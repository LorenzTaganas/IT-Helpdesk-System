const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/requireAuth');
const {
  createTicket,
  getTickets,
  getTicketStats,
  getTicketById,
  updateTicket,
  addComment,
} = require('../controllers/ticketController');

// All ticket routes require authentication
router.use(requireAuth);

// Routes
router.post('/', createTicket);
router.get('/', getTickets);
router.get('/stats', getTicketStats);
router.get('/:id', getTicketById);
router.patch('/:id', updateTicket);
router.post('/:id/comments', addComment);

module.exports = router;
