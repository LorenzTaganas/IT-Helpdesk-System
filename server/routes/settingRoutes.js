const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/requireAuth');
const requireRole = require('../middleware/requireRole');
const { getSettings, updateSettings } = require('../controllers/settingController');

router.use(requireAuth, requireRole('it_admin', 'super_admin'));
router.get('/', getSettings);
router.patch('/', updateSettings);

module.exports = router;
