const Notification = require('../models/Notification');

const notifyUsers = async (recipients, data) => {
  const uniqueRecipients = [...new Set(recipients.filter(Boolean).map((id) => id.toString()))];
  if (!uniqueRecipients.length) return;
  try {
    await Notification.insertMany(uniqueRecipients.map((recipient) => ({ recipient, ...data })));
  } catch (error) {
    console.error('Notification error:', error);
  }
};

module.exports = notifyUsers;
