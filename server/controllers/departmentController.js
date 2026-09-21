const { body, validationResult } = require('express-validator');
const mongoose = require('mongoose');
const Department = require('../models/Department');
const User = require('../models/User');
const writeAuditLog = require('../utils/audit');

const departmentValidation = [
  body('name').trim().notEmpty().withMessage('Department name is required').isLength({ min: 2, max: 100 }).withMessage('Department name must be between 2 and 100 characters'),
  body('description').optional({ nullable: true, checkFalsy: true }).trim().isLength({ max: 500 }).withMessage('Description must be 500 characters or less'),
  body('head').optional({ nullable: true, checkFalsy: true }).isMongoId().withMessage('Invalid department head'),
];

const checkErrors = (req, res) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) return true;
  res.status(400).json({ message: errors.array()[0].msg });
  return false;
};

const getDepartments = async (req, res) => {
  try {
    const departments = await Department.find()
      .populate('head', 'firstName lastName employeeId')
      .sort({ name: 1 })
      .lean();
    const counts = await User.aggregate([{ $group: { _id: '$department', count: { $sum: 1 } } }]);
    const countMap = Object.fromEntries(counts.filter((item) => item._id).map((item) => [item._id.toString(), item.count]));
    res.json({ departments: departments.map((department) => ({ ...department, employeeCount: countMap[department._id.toString()] || 0 })) });
  } catch (error) {
    console.error('Get departments error:', error);
    res.status(500).json({ message: 'Server error retrieving departments' });
  }
};

const createDepartment = [
  ...departmentValidation,
  async (req, res) => {
    if (!checkErrors(req, res)) return;
    try {
      const department = await Department.create({ name: req.body.name, description: req.body.description || '', head: req.body.head || null });
      const populated = await Department.findById(department._id).populate('head', 'firstName lastName employeeId');
      await writeAuditLog({ actor: req.user._id, action: 'create', entityType: 'department', entityId: department._id, entityLabel: department.name, summary: `${req.user.firstName} ${req.user.lastName} created department ${department.name}` });
      res.status(201).json({ message: 'Department created successfully', department: populated });
    } catch (error) {
      if (error.code === 11000) return res.status(409).json({ message: 'Department name already exists' });
      console.error('Create department error:', error);
      res.status(500).json({ message: 'Server error creating department' });
    }
  },
];

const updateDepartment = [
  body('name').optional().trim().notEmpty().withMessage('Department name cannot be empty').isLength({ min: 2, max: 100 }).withMessage('Department name must be between 2 and 100 characters'),
  body('description').optional({ nullable: true, checkFalsy: true }).trim().isLength({ max: 500 }).withMessage('Description must be 500 characters or less'),
  body('head').optional({ nullable: true, checkFalsy: true }).isMongoId().withMessage('Invalid department head'),
  async (req, res) => {
    if (!checkErrors(req, res)) return;
    try {
      const department = await Department.findById(req.params.id);
      if (!department) return res.status(404).json({ message: 'Department not found' });
      ['name', 'description', 'head', 'isActive'].forEach((field) => {
        if (req.body[field] !== undefined) department[field] = req.body[field] || (['head'].includes(field) ? null : req.body[field]);
      });
      await department.save();
      const populated = await Department.findById(department._id).populate('head', 'firstName lastName employeeId');
      await writeAuditLog({ actor: req.user._id, action: 'update', entityType: 'department', entityId: department._id, entityLabel: department.name, summary: `${req.user.firstName} ${req.user.lastName} updated department ${department.name}` });
      res.json({ message: 'Department updated successfully', department: populated });
    } catch (error) {
      if (error.code === 11000) return res.status(409).json({ message: 'Department name already exists' });
      console.error('Update department error:', error);
      res.status(500).json({ message: 'Server error updating department' });
    }
  },
];

module.exports = { getDepartments, createDepartment, updateDepartment };
