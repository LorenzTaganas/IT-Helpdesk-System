import api from './api';

export const ticketService = {
  // Get list of tickets with optional query params (status, priority, category, search, page, limit)
  getTickets: async (params = {}) => {
    const response = await api.get('/tickets', { params });
    return response.data;
  },

  // Get statistics
  getStats: async () => {
    const response = await api.get('/tickets/stats');
    return response.data;
  },

  // Get ticket by ID or ticketId string (e.g. TICK-0001)
  getTicketById: async (id) => {
    const response = await api.get(`/tickets/${id}`);
    return response.data.ticket;
  },

  // Create new ticket
  createTicket: async (ticketData) => {
    const response = await api.post('/tickets', ticketData);
    return response.data;
  },

  // Update ticket (status, priority, assignedTo, resolutionNotes)
  updateTicket: async (id, updateData) => {
    const response = await api.patch(`/tickets/${id}`, updateData);
    return response.data;
  },

  // Add comment / reply
  addComment: async (id, commentData) => {
    const response = await api.post(`/tickets/${id}/comments`, commentData);
    return response.data;
  },
};

export default ticketService;
