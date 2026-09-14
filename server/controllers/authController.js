const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');

// Helper to create and send JWT as HTTP-only cookie
const sendTokenCookie = (res, userId) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: '7d', // Token valid for 7 days
  });

  res.cookie('token', token, {
    httpOnly: true,     // Cannot be read by JavaScript (XSS protection)
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    sameSite: 'lax',   // CSRF protection
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
  });

  return token;
};

// ─────────────────────────────────────────────────────────────────────────────
// @route   POST /api/auth/login
// @desc    Authenticate user and return JWT cookie
// @access  Public
// ─────────────────────────────────────────────────────────────────────────────
const login = [
  // Validate request body
  body('email').isEmail().withMessage('Please enter a valid email.').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required.'),

  async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    try {
      const { email, password } = req.body;

      // Find user by email — we need to include password for comparison
      const user = await User.findOne({ email }).select('+password').populate('department', 'name');

      if (!user) {
        // Generic message so attackers can't tell if email exists
        return res.status(401).json({ message: 'Invalid email or password.' });
      }

      // Check if account is disabled
      if (user.status === 'inactive') {
        return res.status(403).json({
          message: 'Your account has been disabled. Please contact your IT administrator.',
        });
      }

      // Compare entered password with hashed password in DB
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid email or password.' });
      }

      // Update last login timestamp
      user.lastLogin = new Date();
      await user.save({ validateBeforeSave: false });

      // Create JWT and send as cookie
      sendTokenCookie(res, user._id);

      // Return user info (WITHOUT password)
      res.status(200).json({
        message: 'Login successful.',
        user: {
          _id: user._id,
          employeeId: user.employeeId,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          department: user.department,
          position: user.position,
          status: user.status,
        },
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Server error. Please try again.' });
    }
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// @route   POST /api/auth/logout
// @desc    Clear the JWT cookie
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
const logout = (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });
  res.status(200).json({ message: 'Logged out successfully.' });
};

// ─────────────────────────────────────────────────────────────────────────────
// @route   GET /api/auth/me
// @desc    Return the currently logged-in user's info
// @access  Private (requires valid JWT cookie)
// ─────────────────────────────────────────────────────────────────────────────
const getMe = async (req, res) => {
  try {
    // req.user is set by requireAuth middleware
    res.status(200).json({ user: req.user });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = { login, logout, getMe };
