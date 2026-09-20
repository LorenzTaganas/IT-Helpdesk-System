import api from './api';

const departmentService = {
  getDepartments: async () => (await api.get('/departments')).data,
  createDepartment: async (data) => (await api.post('/departments', data)).data,
  updateDepartment: async (id, data) => (await api.patch(`/departments/${id}`, data)).data,
};

export default departmentService;
