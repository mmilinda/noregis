import api from './api';

export const demandeService = {
  // Agent — soumettre une demande de modification
  soumettre: async ({ modifications, motif }) => {
    return api.post('/api/demandes', { modifications, motif });
  },

  // Agent — vérifier sa demande en attente
  maDemande: async () => {
    return api.get('/api/demandes/ma-demande');
  },

  // Admin — lister toutes les demandes
  lister: async (statut = 'en_attente') => {
    return api.get(`/api/demandes?statut=${statut}`);
  },

  // Admin — approuver
  approuver: async (id) => {
    return api.put(`/api/demandes/${id}/approuver`);
  },

  // Admin — rejeter avec motif
  rejeter: async (id, motif = '') => {
    return api.put(`/api/demandes/${id}/rejeter`, { motif });
  },
};
