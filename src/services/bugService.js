import api from './api';

export const bugService = {
  getAll: async (params = {}) => {
    return api.get('/api/bugs', { params });
  },

  create: async (data) => {
    return api.post('/api/bugs', data);
  },

  respond: async (id, data) => {
    return api.put(`/api/bugs/${id}/repondre`, data);
  },

  transmit: async (id) => {
    return api.patch(`/api/bugs/${id}/transmettre`);
  },
};
