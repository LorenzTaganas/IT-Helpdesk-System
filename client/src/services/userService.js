import api from './api';

const userService = {
  getUsers: async (params = {}) => (await api.get('/users', { params })).data,
  getUserById: async (id) => (await api.get(`/users/${id}`)).data.user,
  createUser: async (data) => (await api.post('/users', data)).data,
  updateUser: async (id, data) => (await api.patch(`/users/${id}`, data)).data,
};

export default userService;
