const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Department = require('../models/Department');
const Ticket = require('../models/Ticket');
const Asset = require('../models/Asset');
const writeAuditLog = require('../utils/audit');

const ROLES = ['employee', 'it_support', 'it_admin', 'super_admin'];
const STATUSES = ['active', 'inactive'];

const userFields = 'employeeId firstName lastName email role department position status avatar lastLogin createdAt';

const userCreateValidation = [
  body('firstName').trim().notEmpty().withMessage('First name is required').isLength({ min: 2, max: 60 }).withMessage('First name must be between 2 and 60 characters'),
  body('lastName').trim().notEmpty().withMessage('Last name is required').isLength({ min: 2, max: 60 }).withMessage('Last name must be between 2 and 60 characters'),
  body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('password').isLength({ min: 8, max: 128 }).withMessage('Password must be between 8 and 128 characters'),
  body('role').optional().isIn(ROLES).withMessage('Invalid user role'),
  body('status').optional().isIn(STATUSES).withMessage('Invalid user status'),
];

const userUpdateValidation = [
  body('firstName').optional().trim().notEmpty().withMessage('First name cannot be empty').isLength({ min: 2, max: 60 }).withMessage('First name must be between 2 and 60 characters'),
  body('lastName').optional().trim().notEmpty().withMessage('Last name cannot be empty').isLength({ min: 2, max: 60 }).withMessage('Last name must be between 2 and 60 characters'),
  body('email').optional().isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('password').optional().isLength({ min: 8, max: 128 }).withMessage('Password must be between 8 and 128 characters'),
  body('department').optional({ nullable: true, checkFalsy: true }).isMongoId().withMessage('Invalid department'),
  body('position').optional({ nullable: true, checkFalsy: true }).trim().isLength({ max: 100 }).withMessage('Position must be 100 characters or less'),
  body('role').optional().isIn(ROLES).withMessage('Invalid user role'),
  body('status').optional().isIn(STATUSES).withMessage('Invalid user status'),
];

const checkErrors = (req, res) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) return true;
  res.status(400).json({ message: errors.array()[0].msg });
  return false;
};

const getUsers = async (req, res) => {
  try {
    const { search, role, status, department } = req.query;
    const query = {};
    if (role && role !== 'all') query.role = role;
    if (status && status !== 'all') query.status = status;
    if (department && department !== 'all') query.department = department;
    if (search?.trim()) {
      const escaped = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escaped, 'i');
      query.$or = [{ firstName: regex }, { lastName: regex }, { email: regex }, { employeeId: regex }];
    }

    const users = await User.find(query).select(userFields).populate('department', 'name').sort({ firstName: 1, lastName: 1 }).lean();
    res.json({ users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error retrieving employees' });
  }
};

const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select(userFields).populate('department', 'name').lean();
    if (!user) return res.status(404).json({ message: 'Employee not found' });
    const [ticketCount, assetCount] = await Promise.all([
      Ticket.countDocuments({ createdBy: user._id }),
      Asset.countDocuments({ assignedTo: user._id }),
    ]);
    res.json({ user: { ...user, ticketCount, assetCount } });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(400).json({ message: 'Invalid employee ID' });
  }
};

const createUser = [
  ...userCreateValidation,
  async (req, res) => {
    if (!checkErrors(req, res)) return;
    try {
      const user = await User.create({
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        password: req.body.password,
        role: req.body.role || 'employee',
        status: req.body.status || 'active',
        department: req.body.department || null,
        position: req.body.position || '',
      });
      const safeUser = await User.findById(user._id).select(userFields).populate('department', 'name');
      await writeAuditLog({ actor: req.user._id, action: 'create', entityType: 'user', entityId: user._id, entityLabel: user.employeeId, summary: `${req.user.firstName} ${req.user.lastName} created employee ${user.employeeId}` });
      res.status(201).json({ message: 'Employee created successfully', user: safeUser });
    } catch (error) {
      if (error.code === 11000) return res.status(409).json({ message: 'Email or employee ID already exists' });
      console.error('Create user error:', error);
      res.status(500).json({ message: 'Server error creating employee' });
    }
  },
];

const updateUser = [
  ...userUpdateValidation,
  async (req, res) => {
    if (!checkErrors(req, res)) return;
    try {
      const user = await User.findById(req.params.id).select('+password');
      if (!user) return res.status(404).json({ message: 'Employee not found' });
      const allowed = ['firstName', 'lastName', 'email', 'password', 'role', 'status', 'department', 'position'];
      allowed.forEach((field) => {
        if (req.body[field] !== undefined) user[field] = req.body[field] || (field === 'department' ? null : req.body[field]);
      });
      await user.save();
      const safeUser = await User.findById(user._id).select(userFields).populate('department', 'name');
      await writeAuditLog({ actor: req.user._id, action: user.status === 'inactive' ? 'deactivate' : 'update', entityType: 'user', entityId: user._id, entityLabel: user.employeeId, summary: `${req.user.firstName} ${req.user.lastName} updated employee ${user.employeeId}` });
      res.json({ message: 'Employee updated successfully', user: safeUser });
    } catch (error) {
      if (error.code === 11000) return res.status(409).json({ message: 'Email or employee ID already exists' });
      console.error('Update user error:', error);
      res.status(500).json({ message: 'Server error updating employee' });
    }
  },
];

module.exports = { getUsers, getUserById, createUser, updateUser };
