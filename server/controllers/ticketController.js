const { body, validationResult } = require('express-validator');
const Ticket = require('../models/Ticket');
const User = require('../models/User');
const Department = require('../models/Department');
const writeAuditLog = require('../utils/audit');

const STAFF_ROLES = ['it_support', 'it_admin', 'super_admin'];
const VALID_STATUSES = ['open', 'in_progress', 'pending_user', 'resolved', 'closed'];
const VALID_PRIORITIES = ['low', 'medium', 'high', 'critical'];

const getTicketQuery = (id) => {
  const byObjectId = /^[0-9a-fA-F]{24}$/.test(id) ? id : null;
  return { $or: [{ _id: byObjectId }, { ticketId: String(id).toUpperCase() }] };
};

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// ─────────────────────────────────────────────────────────────────────────────
// @route   POST /api/tickets
// @desc    Create a new support ticket
// @access  Private (All authenticated users)
// ─────────────────────────────────────────────────────────────────────────────
const createTicket = [
  body('title').notEmpty().withMessage('Title is required').isLength({ max: 150 }).withMessage('Title must be 150 chars or less'),
  body('description').notEmpty().withMessage('Description is required'),
  body('category').isIn(['hardware', 'software', 'network', 'access', 'email', 'other']).withMessage('Invalid category'),
  body('priority').optional().isIn(['low', 'medium', 'high', 'critical']).withMessage('Invalid priority'),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    try {
      const { title, description, category, priority } = req.body;

      const ticket = new Ticket({
        title,
        description,
        category,
        priority: priority || 'medium',
        createdBy: req.user._id,
        department: req.user.department?._id || req.user.department || null,
      });

      await ticket.save();
      await writeAuditLog({
        actor: req.user._id,
        action: 'create',
        entityType: 'ticket',
        entityId: ticket._id,
        entityLabel: ticket.ticketId,
        summary: `${req.user.firstName} ${req.user.lastName} created ticket ${ticket.ticketId}`,
      });

      const populatedTicket = await Ticket.findById(ticket._id)
        .populate('createdBy', 'firstName lastName email employeeId role')
        .populate('department', 'name');

      res.status(201).json({
        message: 'Ticket created successfully',
        ticket: populatedTicket,
      });
    } catch (error) {
      console.error('Create ticket error:', error);
      res.status(500).json({ message: 'Server error creating ticket' });
    }
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// @route   GET /api/tickets
// @desc    Get tickets with search, filters, pagination
// @access  Private (Employees see own tickets; IT/Admins see all)
// ─────────────────────────────────────────────────────────────────────────────
const getTickets = async (req, res) => {
  try {
    const {
      status,
      priority,
      category,
      assignedTo,
      search,
      page = 1,
      limit = 20,
    } = req.query;

    const query = {};

    // Role-based visibility: employees only see their own tickets
    if (req.user.role === 'employee') {
      query.createdBy = req.user._id;
    } else {
      // IT Support / Admins can filter by assignedTo
      if (assignedTo === 'me') {
        query.assignedTo = req.user._id;
      } else if (assignedTo === 'unassigned') {
        query.assignedTo = null;
      } else if (assignedTo) {
        query.assignedTo = assignedTo;
      }
    }

    // Status filter
    if (status && status !== 'all') {
      query.status = status;
    }

    // Priority filter
    if (priority && priority !== 'all') {
      query.priority = priority;
    }

    // Category filter
    if (category && category !== 'all') {
      query.category = category;
    }

    // Search by title, ticketId, or description
    if (search && search.trim()) {
      const searchRegex = new RegExp(escapeRegex(search.trim()), 'i');
      query.$or = [
        { ticketId: searchRegex },
        { title: searchRegex },
        { description: searchRegex },
      ];
    }

    const pageNum = Math.max(1, Number.parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, Number.parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [tickets, total] = await Promise.all([
      Ticket.find(query)
        .populate('createdBy', 'firstName lastName email employeeId')
        .populate('assignedTo', 'firstName lastName email employeeId')
        .populate('department', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Ticket.countDocuments(query),
    ]);

    // Sanitize internal comments for employees
    const sanitizedTickets = tickets.map((t) => {
      if (req.user.role === 'employee' && t.comments) {
        t.comments = t.comments.filter((c) => !c.isInternal);
      }
      return t;
    });

    res.status(200).json({
      tickets: sanitizedTickets,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Get tickets error:', error);
    res.status(500).json({ message: 'Server error retrieving tickets' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @route   GET /api/tickets/stats
// @desc    Get ticket statistics / counts
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
const getTicketStats = async (req, res) => {
  try {
    const baseQuery = req.user.role === 'employee' ? { createdBy: req.user._id } : {};

    const [total, open, inProgress, resolved, closed, highOrCritical, assignedToMe] =
      await Promise.all([
        Ticket.countDocuments(baseQuery),
        Ticket.countDocuments({ ...baseQuery, status: 'open' }),
        Ticket.countDocuments({ ...baseQuery, status: 'in_progress' }),
        Ticket.countDocuments({ ...baseQuery, status: 'resolved' }),
        Ticket.countDocuments({ ...baseQuery, status: 'closed' }),
        Ticket.countDocuments({
          ...baseQuery,
          priority: { $in: ['high', 'critical'] },
          status: { $in: ['open', 'in_progress'] },
        }),
        req.user.role !== 'employee'
          ? Ticket.countDocuments({ assignedTo: req.user._id, status: { $in: ['open', 'in_progress'] } })
          : 0,
      ]);

    res.status(200).json({
      total,
      open,
      inProgress,
      resolved,
      closed,
      highOrCritical,
      assignedToMe,
    });
  } catch (error) {
    console.error('Ticket stats error:', error);
    res.status(500).json({ message: 'Server error retrieving ticket statistics' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @route   GET /api/tickets/:id
// @desc    Get single ticket details with discussion
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
const getTicketById = async (req, res) => {
  try {
    const { id } = req.params;

    let ticket = await Ticket.findOne({
      ...getTicketQuery(id),
    })
      .populate('createdBy', 'firstName lastName email employeeId role')
      .populate('assignedTo', 'firstName lastName email employeeId role')
      .populate('department', 'name')
      .populate('comments.author', 'firstName lastName email employeeId role avatar');

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // Permission check: regular employees can only view their own tickets
    if (
      req.user.role === 'employee' &&
      ticket.createdBy._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: 'Access denied to this ticket' });
    }

    // Sanitize internal comments for employees
    const ticketObj = ticket.toObject();
    if (req.user.role === 'employee' && ticketObj.comments) {
      ticketObj.comments = ticketObj.comments.filter((c) => !c.isInternal);
    }

    res.status(200).json({ ticket: ticketObj });
  } catch (error) {
    console.error('Get ticket detail error:', error);
    res.status(500).json({ message: 'Server error retrieving ticket details' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @route   PATCH /api/tickets/:id
// @desc    Update ticket status, priority, assignee, or resolution
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
const updateTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, priority, assignedTo, resolutionNotes } = req.body;

    const ticket = await Ticket.findOne({
      ...getTicketQuery(id),
    });

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    const isEmployee = req.user.role === 'employee';
    const isStaff = STAFF_ROLES.includes(req.user.role);
    const isOwner = ticket.createdBy.toString() === req.user._id.toString();

    if (!isEmployee && !isStaff) {
      return res.status(403).json({ message: 'Your role cannot update tickets' });
    }

    // Employees can only close their own tickets
    if (isEmployee) {
      if (!isOwner) {
        return res.status(403).json({ message: 'Access denied' });
      }
      if (status && status !== 'closed') {
        return res.status(403).json({ message: 'Employees can only close their tickets' });
      }
      if (status === 'closed') {
        ticket.status = 'closed';
        ticket.closedAt = new Date();
      }
      await ticket.save();
      return res.status(200).json({ message: 'Ticket closed successfully', ticket });
    }

    // IT Support & Admin updates
    if (status && !VALID_STATUSES.includes(status)) {
      return res.status(400).json({ message: 'Invalid ticket status' });
    }

    if (priority && !VALID_PRIORITIES.includes(priority)) {
      return res.status(400).json({ message: 'Invalid ticket priority' });
    }

    if (assignedTo !== undefined && assignedTo !== null && assignedTo !== '' && !/^[0-9a-fA-F]{24}$/.test(assignedTo)) {
      return res.status(400).json({ message: 'Invalid assignee' });
    }

    if (assignedTo) {
      const assignee = await User.findOne({ _id: assignedTo, role: { $in: STAFF_ROLES }, status: 'active' }).select('_id');
      if (!assignee) {
        return res.status(400).json({ message: 'Assignee must be an active IT staff member' });
      }
    }

    if (status) {
      ticket.status = status;
      if (status === 'resolved' && !ticket.resolvedAt) {
        ticket.resolvedAt = new Date();
      }
      if (status === 'closed' && !ticket.closedAt) {
        ticket.closedAt = new Date();
      }
    }

    if (priority) {
      ticket.priority = priority;
    }

    if (assignedTo !== undefined) {
      ticket.assignedTo = assignedTo ? assignedTo : null;
    }

    if (resolutionNotes !== undefined) {
      ticket.resolutionNotes = resolutionNotes;
    }

    await ticket.save();

    await writeAuditLog({
      actor: req.user._id,
      action: assignedTo !== undefined ? 'assign' : status ? 'status_change' : 'update',
      entityType: 'ticket',
      entityId: ticket._id,
      entityLabel: ticket.ticketId,
      summary: `${req.user.firstName} ${req.user.lastName} updated ticket ${ticket.ticketId}`,
      metadata: { status, priority, assignedTo },
    });

    const updated = await Ticket.findById(ticket._id)
      .populate('createdBy', 'firstName lastName email employeeId')
      .populate('assignedTo', 'firstName lastName email employeeId')
      .populate('department', 'name')
      .populate('comments.author', 'firstName lastName email employeeId role avatar');

    res.status(200).json({ message: 'Ticket updated successfully', ticket: updated });
  } catch (error) {
    console.error('Update ticket error:', error);
    res.status(500).json({ message: 'Server error updating ticket' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @route   POST /api/tickets/:id/comments
// @desc    Add a comment / reply to a ticket
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
const addComment = [
  body('text').notEmpty().withMessage('Comment text is required').trim(),
  body('isInternal').optional().isBoolean(),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    try {
      const { id } = req.params;
      const { text, isInternal } = req.body;

      const ticket = await Ticket.findOne({
        ...getTicketQuery(id),
      });

      if (!ticket) {
        return res.status(404).json({ message: 'Ticket not found' });
      }

      const isEmployee = req.user.role === 'employee';
      const isOwner = ticket.createdBy.toString() === req.user._id.toString();

      if (isEmployee && !isOwner) {
        return res.status(403).json({ message: 'Access denied' });
      }

      if (!isEmployee && !STAFF_ROLES.includes(req.user.role)) {
        return res.status(403).json({ message: 'Your role cannot comment on tickets' });
      }

      // Employees cannot post internal notes
      const internalFlag = isEmployee ? false : Boolean(isInternal);

      ticket.comments.push({
        author: req.user._id,
        text,
        isInternal: internalFlag,
      });

      // If employee replies and status was pending_user, automatically set back to in_progress or open
      if (isEmployee && ticket.status === 'pending_user') {
        ticket.status = ticket.assignedTo ? 'in_progress' : 'open';
      }

      await ticket.save();

      await writeAuditLog({
        actor: req.user._id,
        action: 'comment',
        entityType: 'ticket',
        entityId: ticket._id,
        entityLabel: ticket.ticketId,
        summary: `${req.user.firstName} ${req.user.lastName} added a comment to ${ticket.ticketId}`,
        metadata: { internal: internalFlag },
      });

      const populated = await Ticket.findById(ticket._id)
        .populate('comments.author', 'firstName lastName email employeeId role avatar');

      const addedComment = populated.comments[populated.comments.length - 1];

      res.status(201).json({
        message: 'Comment added successfully',
        comment: addedComment,
      });
    } catch (error) {
      console.error('Add comment error:', error);
      res.status(500).json({ message: 'Server error adding comment' });
    }
  },
];

module.exports = {
  createTicket,
  getTickets,
  getTicketStats,
  getTicketById,
  updateTicket,
  addComment,
};
