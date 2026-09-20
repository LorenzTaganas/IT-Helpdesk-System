import api from './api';

const notificationService = {
  getNotifications: async () => (await api.get('/notifications')).data,
  markRead: async (id) => (await api.patch(`/notifications/${id}/read`)).data,
  markAllRead: async () => (await api.patch('/notifications/read-all')).data,
};

export default notificationService;
