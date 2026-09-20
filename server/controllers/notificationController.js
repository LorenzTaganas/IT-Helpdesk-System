const mongoose = require('mongoose');
const Notification = require('../models/Notification');

const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id }).sort({ createdAt: -1 }).limit(50).lean();
    const unreadCount = await Notification.countDocuments({ recipient: req.user._id, readAt: null });
    res.json({ notifications, unreadCount });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ message: 'Server error retrieving notifications' });
  }
};

const markNotificationRead = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid notification ID' });
  const notification = await Notification.findOneAndUpdate({ _id: req.params.id, recipient: req.user._id }, { readAt: new Date() }, { new: true });
  if (!notification) return res.status(404).json({ message: 'Notification not found' });
  res.json({ notification });
};

const markAllNotificationsRead = async (req, res) => {
  await Notification.updateMany({ recipient: req.user._id, readAt: null }, { readAt: new Date() });
  res.json({ message: 'Notifications marked as read' });
};

module.exports = { getNotifications, markNotificationRead, markAllNotificationsRead };
