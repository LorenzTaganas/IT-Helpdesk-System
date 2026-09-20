import api from './api';

const auditService = {
  getLogs: async (params = {}) => (await api.get('/audit-logs', { params })).data,
};

export default auditService;
