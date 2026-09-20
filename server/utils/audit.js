const AuditLog = require('../models/AuditLog');

const writeAuditLog = async ({ actor, action, entityType, entityId, entityLabel, summary, metadata }) => {
  try {
    await AuditLog.create({ actor, action, entityType, entityId, entityLabel, summary, metadata });
  } catch (error) {
    console.error('Audit log error:', error);
  }
};

module.exports = writeAuditLog;
