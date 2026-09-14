const { body, validationResult } = require('express-validator');
const Ticket = require('../models/Ticket');
const User = require('../models/User');
const Department = require('../models/Department');

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
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { ticketId: searchRegex },
        { title: searchRegex },
        { description: searchRegex },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10)));
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
      $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { ticketId: id.toUpperCase() }],
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
      $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { ticketId: id.toUpperCase() }],
    });

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    const isEmployee = req.user.role === 'employee';
    const isOwner = ticket.createdBy.toString() === req.user._id.toString();

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
    if (status && ['open', 'in_progress', 'pending_user', 'resolved', 'closed'].includes(status)) {
      ticket.status = status;
      if (status === 'resolved' && !ticket.resolvedAt) {
        ticket.resolvedAt = new Date();
      }
      if (status === 'closed' && !ticket.closedAt) {
        ticket.closedAt = new Date();
      }
    }

    if (priority && ['low', 'medium', 'high', 'critical'].includes(priority)) {
      ticket.priority = priority;
    }

    if (assignedTo !== undefined) {
      ticket.assignedTo = assignedTo ? assignedTo : null;
    }

    if (resolutionNotes !== undefined) {
      ticket.resolutionNotes = resolutionNotes;
    }

    await ticket.save();

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
        $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { ticketId: id.toUpperCase() }],
      });

      if (!ticket) {
        return res.status(404).json({ message: 'Ticket not found' });
      }

      const isEmployee = req.user.role === 'employee';
      const isOwner = ticket.createdBy.toString() === req.user._id.toString();

      if (isEmployee && !isOwner) {
        return res.status(403).json({ message: 'Access denied' });
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
