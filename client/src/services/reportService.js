import api from './api';

const reportService = {
  getReports: async () => (await api.get('/reports')).data,
};

export default reportService;
