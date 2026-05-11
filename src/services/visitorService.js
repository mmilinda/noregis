import api from './api';

export const visitorService = {
  getAll: async () => {
    return api.get('/api/visiteurs');
  },

  create: async (visitorData) => {
    return api.post('/api/visiteurs', visitorData);
  },

  getById: async (id) => {
    return api.get(`/api/visiteurs/${id}`);
  },

  update: async (id, visitorData) => {
    return api.put(`/api/visiteurs/${id}`, visitorData);
  },

  search: async (query) => {
    return api.get(`/api/search?q=${encodeURIComponent(query)}`);
  }
};
