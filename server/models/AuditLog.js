const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    action: {
      type: String,
      enum: ['login', 'logout', 'create', 'update', 'assign', 'status_change', 'comment', 'deactivate'],
      required: true,
    },
    entityType: {
      type: String,
      enum: ['auth', 'ticket', 'asset', 'user', 'department'],
      required: true,
    },
    entityId: { type: mongoose.Schema.Types.ObjectId },
    entityLabel: { type: String, trim: true },
    summary: { type: String, required: true, trim: true, maxlength: 300 },
    metadata: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ entityType: 1, action: 1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
