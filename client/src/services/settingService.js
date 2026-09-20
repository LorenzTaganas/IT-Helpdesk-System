import api from './api';

const settingService = {
  getSettings: async () => (await api.get('/settings')).data,
  updateSettings: async (data) => (await api.patch('/settings', data)).data,
};

export default settingService;
