import { authService } from './authService';

const API_URL = import.meta.env.VITE_API_URL || 'https://noregisbackend-h9l7.onrender.com/api';

export const departementService = {
  /**
   * Récupérer tous les départements (filtrés selon le rôle / l'entreprise)
   */
  getAll: async (entrepriseId = null) => {
    try {
      const url = entrepriseId ? `${API_URL}/departements?entrepriseId=${entrepriseId}` : `${API_URL}/departements`;
      const response = await fetch(url, {
        headers: {
          ...authService.getAuthHeader(),
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          window.dispatchEvent(new CustomEvent('auth:expired'));
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Erreur lors du chargement des départements.');
      }

      return await response.json();
    } catch (error) {
      console.error('Erreur departementService.getAll :', error);
      throw error;
    }
  },

  /**
   * Créer un nouveau département
   */
  create: async (departementData) => {
    try {
      const response = await fetch(`${API_URL}/departements`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authService.getAuthHeader(),
        },
        body: JSON.stringify(departementData),
      });

      if (!response.ok) {
        if (response.status === 401) {
          window.dispatchEvent(new CustomEvent('auth:expired'));
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Erreur lors de la création du département.');
      }

      return await response.json();
    } catch (error) {
      console.error('Erreur departementService.create :', error);
      throw error;
    }
  },

  /**
   * Modifier un département existant
   */
  update: async (id, departementData) => {
    try {
      const response = await fetch(`${API_URL}/departements/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...authService.getAuthHeader(),
        },
        body: JSON.stringify(departementData),
      });

      if (!response.ok) {
        if (response.status === 401) {
          window.dispatchEvent(new CustomEvent('auth:expired'));
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Erreur lors de la modification du département.');
      }

      return await response.json();
    } catch (error) {
      console.error('Erreur departementService.update :', error);
      throw error;
    }
  },

  /**
   * Supprimer un département
   */
  delete: async (id) => {
    try {
      const response = await fetch(`${API_URL}/departements/${id}`, {
        method: 'DELETE',
        headers: {
          ...authService.getAuthHeader(),
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          window.dispatchEvent(new CustomEvent('auth:expired'));
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Erreur lors de la suppression du département.');
      }

      return await response.json();
    } catch (error) {
      console.error('Erreur departementService.delete :', error);
      throw error;
    }
  },
};
