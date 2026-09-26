import api from './api';

export const departementService = {
  /**
   * Récupérer tous les départements (filtrés selon le rôle / l'entreprise)
   */
  getAll: async (entrepriseId = null) => {
    const query = entrepriseId ? `?entrepriseId=${entrepriseId}` : '';
    return api.get(`/api/departements${query}`);
  },

  /**
   * Créer un nouveau département
   */
  create: async (departementData) => {
    return api.post('/api/departements', departementData);
  },

  /**
   * Modifier un département existant
   */
  update: async (id, departementData) => {
    return api.put(`/api/departements/${id}`, departementData);
  },

  /**
   * Supprimer un département
   */
  delete: async (id) => {
    return api.delete(`/api/departements/${id}`);
  },
};
