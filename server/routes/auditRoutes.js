const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/requireAuth');
const requireRole = require('../middleware/requireRole');
const { getAuditLogs } = require('../controllers/auditController');

router.get('/', requireAuth, requireRole('it_admin', 'super_admin'), getAuditLogs);

module.exports = router;
