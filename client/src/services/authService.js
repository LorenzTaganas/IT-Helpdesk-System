import api from './api';

// Auth service — wraps all /api/auth calls

export const authService = {
  // Login with email and password
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data; // { message, user }
  },

  // Logout — clears the JWT cookie on the server
  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  },

  // Get the currently logged-in user
  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data; // { user }
  },

  updateProfile: async (profileData) => {
    const response = await api.patch('/auth/me', profileData);
    return response.data;
  },
};
