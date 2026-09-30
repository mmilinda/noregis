import api from './api';

const STORAGE_KEY = 'noregis_rdv_data';

const getLocalRdv = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

const saveLocalRdv = (items) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    console.error('Error saving local rdv data:', e);
  }
};

export const rdvService = {
  getAll: async () => {
    try {
      const res = await api.get('/api/visites/rdv');
      const items = Array.isArray(res) ? res : (res.rdv || res.rendezVous || res.data || []);
      if (items.length > 0) {
        saveLocalRdv(items);
      }
      return items.length > 0 ? items : getLocalRdv();
    } catch (err) {
      console.warn('API /api/visites/rdv unavailable, using local fallback:', err);
      return getLocalRdv();
    }
  },

  create: async (rdvData) => {
    const payload = {
      prenom: rdvData.prenom || '',
      nom: rdvData.nom || '',
      telephone: rdvData.telephone || '',
      email: rdvData.email || '',
      typePiece: rdvData.typePiece || 'cni',
      numeroPiece: rdvData.numeroPiece || '',
      personneVisitee: rdvData.personneVisitee || '',
      serviceDepartement: rdvData.serviceDepartement || rdvData.departement || '',
      dateRdv: rdvData.dateRdv || new Date().toISOString().split('T')[0],
      heureRdv: rdvData.heureRdv || '10:00',
      motif: rdvData.motif || 'Rendez-vous',
      statut: rdvData.statut || 'PROGRAMME',
      remarques: rdvData.remarques || '',
    };

    let createdItem = null;
    try {
      const res = await api.post('/api/visites/rdv', payload);
      createdItem = res.rdv || res.rendezVous || res.data || res;
    } catch (err) {
      console.warn('Backend create RDV failed, saving locally:', err);
      createdItem = {
        _id: 'rdv_' + Date.now(),
        ...payload,
        createdAt: new Date().toISOString(),
      };
    }

    const current = getLocalRdv();
    saveLocalRdv([createdItem, ...current]);
    return createdItem;
  },

  update: async (id, rdvData) => {
    let updatedItem = null;
    try {
      const res = await api.put(`/api/visites/rdv/${id}`, rdvData).catch(() => 
        api.patch(`/api/visites/rdv/${id}`, rdvData)
      );
      updatedItem = res.rdv || res.rendezVous || res.data || res;
    } catch (err) {
      console.warn('Backend update RDV failed, updating locally:', err);
      updatedItem = { _id: id, ...rdvData };
    }

    const current = getLocalRdv();
    const index = current.findIndex(item => (item._id || item.id) === id);
    if (index !== -1) {
      current[index] = { ...current[index], ...updatedItem };
      saveLocalRdv(current);
    }
    return updatedItem;
  },

  delete: async (id) => {
    try {
      await api.delete(`/api/visites/rdv/${id}`);
    } catch (err) {
      console.warn('Backend delete RDV failed, deleting locally:', err);
    }

    const current = getLocalRdv();
    const filtered = current.filter(item => (item._id || item.id) !== id);
    saveLocalRdv(filtered);
    return { success: true };
  },

  checkIn: async (rdvItem) => {
    // Marquer l'entrée du visiteur issu de ce RDV
    const rdvId = rdvItem._id || rdvItem.id;
    try {
      await api.post(`/api/visites/rdv/${rdvId}/checkin`, rdvItem);
    } catch {
      // Fallback update status to CONFIRME / ARRIVE
    }
    return rdvService.update(rdvId, { statut: 'ARRIVE' });
  }
};
