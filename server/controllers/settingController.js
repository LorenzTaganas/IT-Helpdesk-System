const { body, validationResult } = require('express-validator');
const Setting = require('../models/Setting');
const writeAuditLog = require('../utils/audit');

const settingValidation = [
  body('organizationName').trim().notEmpty().withMessage('Organization name is required'),
  body('supportEmail').optional({ nullable: true, checkFalsy: true }).isEmail().withMessage('Support email must be valid'),
  body('timezone').trim().notEmpty().withMessage('Timezone is required'),
  body('defaultTicketPriority').isIn(['low', 'medium', 'high', 'critical']).withMessage('Invalid default priority'),
  body('slaDays').isInt({ min: 1, max: 365 }).withMessage('SLA days must be between 1 and 365'),
  body('allowEmployeeClose').isBoolean().withMessage('Employee close setting must be boolean'),
];

const getSettings = async (req, res) => {
  try {
    let settings = await Setting.findOne({ key: 'system' }).lean();
    if (!settings) settings = await Setting.create({ key: 'system' });
    res.json({ settings });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ message: 'Server error retrieving settings' });
  }
};

const updateSettings = [
  ...settingValidation,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });
    try {
      const settings = await Setting.findOneAndUpdate(
        { key: 'system' },
        { key: 'system', ...req.body },
        { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
      );
      await writeAuditLog({ actor: req.user._id, action: 'update', entityType: 'auth', entityLabel: 'system-settings', summary: `${req.user.firstName} ${req.user.lastName} updated system settings` });
      res.json({ message: 'Settings updated successfully', settings });
    } catch (error) {
      console.error('Update settings error:', error);
      res.status(500).json({ message: 'Server error updating settings' });
    }
  },
];

module.exports = { getSettings, updateSettings };
