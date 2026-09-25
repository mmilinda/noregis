import api from './api';
import { MOCK_SECTEURS } from '../data/mockData';

const STORAGE_KEY = 'noregis_secteurs_data';

const getStoredSecteurs = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(MOCK_SECTEURS));
      return MOCK_SECTEURS;
    }
    return JSON.parse(data);
  } catch {
    return MOCK_SECTEURS;
  }
};

const saveStoredSecteurs = (list) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // Ignore storage errors
  }
};

export const secteurService = {
  getAll: async () => {
    try {
      const res = await api.get('/api/secteurs');
      if (res && res.secteurs && Array.isArray(res.secteurs)) {
        saveStoredSecteurs(res.secteurs);
        return res;
      }
    } catch {
      // Fallback local
    }
    return { secteurs: getStoredSecteurs() };
  },

  create: async (secteurData) => {
    try {
      const res = await api.post('/api/secteurs', secteurData);
      if (res && (res.secteur || res.success)) {
        const list = getStoredSecteurs();
        const created = res.secteur || { ...secteurData, id: 'SEC-' + Date.now(), _id: 'SEC-' + Date.now(), statut: 'ACTIF' };
        list.push(created);
        saveStoredSecteurs(list);
        return { success: true, secteur: created };
      }
    } catch {
      // Fallback local
    }

    const list = getStoredSecteurs();
    const newId = `SEC-${String(list.length + 1).padStart(3, '0')}`;
    const newSecteur = {
      id: newId,
      _id: newId,
      code: newId,
      nom: secteurData.nom,
      description: secteurData.description || '',
      statut: 'ACTIF',
      createdAt: new Date().toISOString(),
    };
    list.push(newSecteur);
    saveStoredSecteurs(list);
    return { success: true, secteur: newSecteur };
  },

  update: async (id, secteurData) => {
    try {
      const res = await api.put(`/api/secteurs/${id}`, secteurData);
      if (res && (res.secteur || res.success)) {
        const list = getStoredSecteurs();
        const idx = list.findIndex(s => (s.id === id || s._id === id));
        if (idx !== -1) {
          list[idx] = { ...list[idx], ...secteurData };
          saveStoredSecteurs(list);
        }
        return { success: true, secteur: list[idx] || secteurData };
      }
    } catch {
      // Fallback local
    }

    const list = getStoredSecteurs();
    const idx = list.findIndex(s => (s.id === id || s._id === id));
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...secteurData };
      saveStoredSecteurs(list);
      return { success: true, secteur: list[idx] };
    }
    return { success: false, message: 'Secteur introuvable' };
  },

  changeStatus: async (id, statut) => {
    try {
      const res = await api.patch(`/api/secteurs/${id}/statut`, { statut });
      if (res && res.success) {
        const list = getStoredSecteurs();
        const idx = list.findIndex(s => (s.id === id || s._id === id));
        if (idx !== -1) {
          list[idx].statut = statut;
          saveStoredSecteurs(list);
        }
        return { success: true, statut };
      }
    } catch {
      // Fallback local
    }

    const list = getStoredSecteurs();
    const idx = list.findIndex(s => (s.id === id || s._id === id));
    if (idx !== -1) {
      list[idx].statut = statut;
      saveStoredSecteurs(list);
      return { success: true, statut };
    }
    return { success: false, message: 'Secteur introuvable' };
  },
};
