import api from './api';

export const visitService = {
  getAll: async () => {
    return api.get('/api/visites');
  },

  getOngoing: async () => {
    return api.get('/api/visites/en-cours');
  },

  recordEntry: async (entryData) => {
    return api.post('/api/visites/entree', entryData);
  },

  recordExit: async (visitId) => {
    return api.post(`/api/visites/sortie/${visitId}`);
  },

  // Nouvelle méthode — Backend v2
  deleteVisit: async (visitId) => {
    return api.delete(`/api/visites/${visitId}`);
  },
};
