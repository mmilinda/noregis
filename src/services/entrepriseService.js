import api from './api';
import { MOCK_ENTREPRISES } from '../data/mockData';

const LOCAL_STORAGE_KEY = 'noregis_entreprises';

const getStoredEntreprises = () => {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error('Erreur lecture entreprises localStorage', e);
  }
  return MOCK_ENTREPRISES;
};

const saveStoredEntreprises = (entreprises) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(entreprises));
  } catch (e) {
    console.error('Erreur sauvegarde entreprises localStorage', e);
  }
};

export const entrepriseService = {
  getAll: async () => {
    try {
      const data = await api.get('/api/entreprises');
      if (data && (data.entreprises || Array.isArray(data))) {
        const list = data.entreprises || data;
        saveStoredEntreprises(list);
        return list;
      }
    } catch (err) {
      console.warn('Backend API entreprise indisponible, utilisation du cache/mock local:', err.message);
    }
    return getStoredEntreprises();
  },

  create: async ({ nom, immatriculation, adresse, email, telephone, secteur, statut = 'ACTIF' }) => {
    const payload = {
      nom: nom?.trim(),
      immatriculation: immatriculation?.trim() || `ENT-${Date.now().toString().slice(-4)}`,
      adresse: adresse?.trim() || '',
      email: email?.trim() || '',
      telephone: telephone?.trim() || '',
      secteur: secteur?.trim() || 'Services',
      statut,
      createdAt: new Date().toISOString(),
    };

    try {
      const data = await api.post('/api/entreprises', payload);
      if (data && (data.entreprise || data._id)) {
        const created = data.entreprise || data;
        const current = getStoredEntreprises();
        saveStoredEntreprises([created, ...current]);
        return created;
      }
    } catch (err) {
      console.warn('Création entreprise via API échouée, enregistrement local:', err.message);
    }

    const newEnt = {
      id: `ENT-${Date.now()}`,
      _id: `ENT-${Date.now()}`,
      ...payload,
    };
    const current = getStoredEntreprises();
    const updated = [newEnt, ...current];
    saveStoredEntreprises(updated);
    return newEnt;
  },

  updateStatus: async (id, statut) => {
    try {
      const data = await api.put(`/api/entreprises/${id}/status`, { statut });
      if (data && (data.entreprise || data.success)) {
        const current = getStoredEntreprises();
        const updated = current.map(e => (e.id === id || e._id === id) ? { ...e, statut } : e);
        saveStoredEntreprises(updated);
        return data.entreprise || { id, statut };
      }
    } catch (err) {
      console.warn('Mise à jour statut entreprise API échouée, fallback local:', err.message);
    }

    const current = getStoredEntreprises();
    const updated = current.map(e => (e.id === id || e._id === id) ? { ...e, statut } : e);
    saveStoredEntreprises(updated);
    return { id, statut };
  },
};
