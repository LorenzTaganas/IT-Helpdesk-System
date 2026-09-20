const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/requireAuth');
const requireRole = require('../middleware/requireRole');
const { getReports } = require('../controllers/reportController');

router.get('/', requireAuth, requireRole('it_support', 'it_admin', 'super_admin'), getReports);

module.exports = router;
