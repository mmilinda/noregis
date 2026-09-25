import api from './api';

export const entrepriseService = {
  getAll: async () => {
    return api.get('/api/entreprises');
  },

  create: async (entrepriseData) => {
    return api.post('/api/entreprises', entrepriseData);
  },

  update: async (id, entrepriseData) => {
    return api.put(`/api/entreprises/${id}`, entrepriseData);
  },

  changeStatus: async (id, statut) => {
    return api.patch(`/api/entreprises/${id}/statut`, { statut });
  },
};
