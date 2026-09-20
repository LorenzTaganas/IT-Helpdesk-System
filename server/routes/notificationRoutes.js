const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/requireAuth');
const { getNotifications, markNotificationRead, markAllNotificationsRead } = require('../controllers/notificationController');

router.use(requireAuth);
router.get('/', getNotifications);
router.patch('/read-all', markAllNotificationsRead);
router.patch('/:id/read', markNotificationRead);

module.exports = router;
