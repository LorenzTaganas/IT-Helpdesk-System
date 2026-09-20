const AuditLog = require('../models/AuditLog');

const getAuditLogs = async (req, res) => {
  try {
    const { action, entityType, search, page = 1, limit = 30 } = req.query;
    const query = {};
    if (action && action !== 'all') query.action = action;
    if (entityType && entityType !== 'all') query.entityType = entityType;
    if (search?.trim()) {
      const escaped = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [{ summary: new RegExp(escaped, 'i') }, { entityLabel: new RegExp(escaped, 'i') }];
    }

    const pageNum = Math.max(1, Number.parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, Number.parseInt(limit, 10) || 30));
    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .populate('actor', 'firstName lastName email employeeId role')
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean(),
      AuditLog.countDocuments(query),
    ]);

    res.json({ logs, pagination: { total, page: pageNum, limit: limitNum, pages: Math.ceil(total / limitNum) } });
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({ message: 'Server error retrieving audit logs' });
  }
};

module.exports = { getAuditLogs };
