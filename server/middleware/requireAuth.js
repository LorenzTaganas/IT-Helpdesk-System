const jwt = require('jsonwebtoken');
const User = require('../models/User');

// This middleware checks if the user is logged in via JWT cookie
const requireAuth = async (req, res, next) => {
  try {
    // Get the token from the HTTP-only cookie
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({ message: 'Not authenticated. Please log in.' });
    }

    // Verify the token using our secret key
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find the user in the database (exclude password)
    const user = await User.findById(decoded.userId).populate('department', 'name');

    if (!user) {
      return res.status(401).json({ message: 'User not found. Please log in again.' });
    }

    if (user.status === 'inactive') {
      return res.status(403).json({ message: 'Your account has been disabled. Contact your administrator.' });
    }

    // Attach user to the request object so route handlers can use it
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Session expired. Please log in again.' });
    }
    return res.status(401).json({ message: 'Invalid token. Please log in again.' });
  }
};

module.exports = requireAuth;
