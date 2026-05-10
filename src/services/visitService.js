export const visitService = {
  getAll: async () => {
    return api.get('/api/visits');          // ← visits (pas visites)
  },
  getOngoing: async () => {
    return api.get('/api/visits/en-cours');
  },
  recordEntry: async (entryData) => {
    return api.post('/api/visits/entree', entryData);
  },
  recordExit: async (visitId) => {
    return api.post(`/api/visits/sortie/${visitId}`);
  }
};