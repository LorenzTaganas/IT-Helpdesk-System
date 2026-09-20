const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema(
  {
    key: { type: String, unique: true, required: true, default: 'system' },
    organizationName: { type: String, trim: true, default: 'ITFlow' },
    supportEmail: { type: String, trim: true, default: '' },
    timezone: { type: String, trim: true, default: 'UTC' },
    defaultTicketPriority: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
    slaDays: { type: Number, min: 1, max: 365, default: 3 },
    allowEmployeeClose: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Setting', settingSchema);
