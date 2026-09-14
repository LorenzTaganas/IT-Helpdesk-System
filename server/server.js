require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');

const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const errorHandler = require('./middleware/errorHandler');

// Connect to MongoDB
connectDB();

// Register Mongoose models
require('./models/Department');
require('./models/User');
require('./models/Ticket');

const app = express();

// ─── Middleware ───────────────────────────────────────────────────────────────

// Allow requests from the React frontend
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true, // Required for cookies to work cross-origin
}));

// Parse JSON request bodies
app.use(express.json());

// Parse URL-encoded bodies (form submissions)
app.use(express.urlencoded({ extended: true }));

// Parse cookies (needed for JWT cookie)
app.use(cookieParser());

// Rate limiter — applied only to login to prevent brute-force
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Max 20 login attempts per window
  message: { message: 'Too many login attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/auth/login', loginLimiter);

// ─── Routes ───────────────────────────────────────────────────────────────────

const ticketRoutes = require('./routes/ticketRoutes');
app.use('/api/auth', authRoutes);
app.use('/api/tickets', ticketRoutes);

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'ITFlow API is running.' });
});

// 404 handler for unmatched routes
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found.' });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use(errorHandler);

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 ITFlow server running on http://localhost:${PORT}`);
});
