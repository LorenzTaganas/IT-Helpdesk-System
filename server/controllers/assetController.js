const { body, validationResult } = require('express-validator');
const mongoose = require('mongoose');
const Asset = require('../models/Asset');
const User = require('../models/User');
const writeAuditLog = require('../utils/audit');

const CATEGORIES = ['laptop', 'desktop', 'monitor', 'printer', 'mobile', 'network', 'software', 'other'];
const STATUSES = ['available', 'assigned', 'maintenance', 'retired'];
const STAFF_ROLES = ['it_support', 'it_admin', 'super_admin'];

const assetValidation = [
  body('name').trim().notEmpty().withMessage('Asset name is required').isLength({ max: 150 }).withMessage('Asset name must be 150 characters or less'),
  body('category').isIn(CATEGORIES).withMessage('Invalid asset category'),
  body('status').optional().isIn(STATUSES).withMessage('Invalid asset status'),
  body('assignedTo').optional({ nullable: true }).custom((value) => !value || mongoose.isValidObjectId(value)).withMessage('Invalid assigned user'),
  body('purchaseDate').optional({ nullable: true }).isISO8601().withMessage('Invalid purchase date'),
  body('warrantyExpires').optional({ nullable: true }).isISO8601().withMessage('Invalid warranty date'),
];

const assetUpdateValidation = [
  body('name').optional().trim().notEmpty().withMessage('Asset name cannot be empty').isLength({ max: 150 }).withMessage('Asset name must be 150 characters or less'),
  body('category').optional().isIn(CATEGORIES).withMessage('Invalid asset category'),
  body('status').optional().isIn(STATUSES).withMessage('Invalid asset status'),
  body('assignedTo').optional({ nullable: true }).custom((value) => !value || mongoose.isValidObjectId(value)).withMessage('Invalid assigned user'),
  body('purchaseDate').optional({ nullable: true }).isISO8601().withMessage('Invalid purchase date'),
  body('warrantyExpires').optional({ nullable: true }).isISO8601().withMessage('Invalid warranty date'),
];

const getAssetQuery = (id) => ({
  $or: [
    { _id: mongoose.isValidObjectId(id) ? id : null },
    { assetTag: String(id).toUpperCase() },
  ],
});

const populateAsset = (query) => query
  .populate('assignedTo', 'firstName lastName email employeeId role')
  .populate('department', 'name');

const validateRequest = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ message: errors.array()[0].msg });
    return false;
  }
  return true;
};

const normalizeAssignment = async (data) => {
  const update = { ...data };
  if (update.assignedTo === '') update.assignedTo = null;

  if (update.assignedTo) {
    const user = await User.findOne({
      _id: update.assignedTo,
      status: 'active',
      role: { $in: [...STAFF_ROLES, 'employee'] },
    }).select('_id department');
    if (!user) return { error: 'Assigned user must be an active user' };
    update.department = user.department || update.department || null;
    if (!update.status) update.status = 'assigned';
  }

  if (update.status === 'assigned' && !update.assignedTo) {
    return { error: 'Assigned assets must have an assigned user' };
  }

  if (['available', 'maintenance', 'retired'].includes(update.status)) {
    update.assignedTo = null;
  }

  if (update.status && update.status !== 'assigned' && update.assignedTo === null) {
    update.assignedTo = null;
  }

  return { update };
};

const createAsset = [
  ...assetValidation,
  async (req, res) => {
    if (!validateRequest(req, res)) return;
    try {
      const { update, error } = await normalizeAssignment(req.body);
      if (error) return res.status(400).json({ message: error });

      const asset = await Asset.create(update);
      await writeAuditLog({ actor: req.user._id, action: 'create', entityType: 'asset', entityId: asset._id, entityLabel: asset.assetTag, summary: `${req.user.firstName} ${req.user.lastName} created asset ${asset.assetTag}` });
      const populated = await populateAsset(Asset.findById(asset._id));
      res.status(201).json({ message: 'Asset created successfully', asset: populated });
    } catch (err) {
      if (err.code === 11000) return res.status(409).json({ message: 'Asset tag or serial number already exists' });
      console.error('Create asset error:', err);
      res.status(500).json({ message: 'Server error creating asset' });
    }
  },
];

const getAssets = async (req, res) => {
  try {
    const { status, category, assignedTo, search, page = 1, limit = 20 } = req.query;
    const query = {};

    if (req.user.role === 'employee') {
      query.assignedTo = req.user._id;
    } else if (assignedTo === 'me') {
      query.assignedTo = req.user._id;
    } else if (assignedTo === 'unassigned') {
      query.assignedTo = null;
    } else if (assignedTo) {
      query.assignedTo = assignedTo;
    }

    if (status && status !== 'all') query.status = status;
    if (category && category !== 'all') query.category = category;
    if (search?.trim()) {
      const escaped = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [
        { assetTag: new RegExp(escaped, 'i') },
        { name: new RegExp(escaped, 'i') },
        { manufacturer: new RegExp(escaped, 'i') },
        { model: new RegExp(escaped, 'i') },
        { serialNumber: new RegExp(escaped, 'i') },
      ];
    }

    const pageNum = Math.max(1, Number.parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, Number.parseInt(limit, 10) || 20));
    const [assets, total] = await Promise.all([
      populateAsset(Asset.find(query).sort({ createdAt: -1 }).skip((pageNum - 1) * limitNum).limit(limitNum).lean()),
      Asset.countDocuments(query),
    ]);

    res.json({
      assets,
      pagination: { total, page: pageNum, limit: limitNum, pages: Math.ceil(total / limitNum) },
    });
  } catch (err) {
    console.error('Get assets error:', err);
    res.status(500).json({ message: 'Server error retrieving assets' });
  }
};

const getAssetStats = async (req, res) => {
  try {
    const baseQuery = req.user.role === 'employee' ? { assignedTo: req.user._id } : {};
    const [total, available, assigned, maintenance, retired] = await Promise.all(
      STATUSES.map((status) => Asset.countDocuments({ ...baseQuery, status }))
    );
    res.json({ total, available, assigned, maintenance, retired });
  } catch (err) {
    console.error('Asset stats error:', err);
    res.status(500).json({ message: 'Server error retrieving asset statistics' });
  }
};

const getAssignableUsers = async (req, res) => {
  try {
    const users = await User.find({ status: 'active' })
      .select('firstName lastName email employeeId role department')
      .populate('department', 'name')
      .sort({ firstName: 1, lastName: 1 })
      .lean();
    res.json({ users });
  } catch (err) {
    console.error('Get assignable users error:', err);
    res.status(500).json({ message: 'Server error retrieving assignable users' });
  }
};

const getAssetById = async (req, res) => {
  try {
    const asset = await populateAsset(Asset.findOne(getAssetQuery(req.params.id)));
    if (!asset) return res.status(404).json({ message: 'Asset not found' });
    if (req.user.role === 'employee' && asset.assignedTo?._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied to this asset' });
    }
    res.json({ asset });
  } catch (err) {
    console.error('Get asset error:', err);
    res.status(500).json({ message: 'Server error retrieving asset' });
  }
};

const updateAsset = [
  ...assetUpdateValidation,
  async (req, res) => {
    if (!validateRequest(req, res)) return;
    try {
      const asset = await Asset.findOne(getAssetQuery(req.params.id));
      if (!asset) return res.status(404).json({ message: 'Asset not found' });

      const { update, error } = await normalizeAssignment(req.body);
      if (error) return res.status(400).json({ message: error });
      Object.assign(asset, update);
      await asset.save();
      await writeAuditLog({ actor: req.user._id, action: update.assignedTo ? 'assign' : 'update', entityType: 'asset', entityId: asset._id, entityLabel: asset.assetTag, summary: `${req.user.firstName} ${req.user.lastName} updated asset ${asset.assetTag}`, metadata: { status: update.status, assignedTo: update.assignedTo } });

      const populated = await populateAsset(Asset.findById(asset._id));
      res.json({ message: 'Asset updated successfully', asset: populated });
    } catch (err) {
      if (err.code === 11000) return res.status(409).json({ message: 'Asset tag or serial number already exists' });
      console.error('Update asset error:', err);
      res.status(500).json({ message: 'Server error updating asset' });
    }
  },
];

module.exports = { createAsset, getAssets, getAssetStats, getAssignableUsers, getAssetById, updateAsset };
