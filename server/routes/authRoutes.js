const express = require('express');
const router = express.Router();
const { login, logout, getMe, updateProfile } = require('../controllers/authController');
const requireAuth = require('../middleware/requireAuth');

// POST /api/auth/login — Login (public)
router.post('/login', login);

// POST /api/auth/logout — Logout (private)
router.post('/logout', requireAuth, logout);

// GET /api/auth/me — Get current user (private)
router.get('/me', requireAuth, getMe);
router.patch('/me', requireAuth, updateProfile);

module.exports = router;
