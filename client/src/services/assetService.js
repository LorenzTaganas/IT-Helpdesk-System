import api from './api';

const assetService = {
  getAssets: async (params = {}) => {
    const response = await api.get('/assets', { params });
    return response.data;
  },

  getStats: async () => {
    const response = await api.get('/assets/stats');
    return response.data;
  },

  getAssignableUsers: async () => {
    const response = await api.get('/assets/users');
    return response.data.users;
  },

  getAssetById: async (id) => {
    const response = await api.get(`/assets/${id}`);
    return response.data.asset;
  },

  createAsset: async (assetData) => {
    const response = await api.post('/assets', assetData);
    return response.data;
  },

  updateAsset: async (id, assetData) => {
    const response = await api.patch(`/assets/${id}`, assetData);
    return response.data;
  },
};

export default assetService;
