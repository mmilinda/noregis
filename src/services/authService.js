import api from './api';
import { MOCK_USERS } from '../data/mockData';

const LOCAL_USERS_KEY = 'noregis_local_users';

const getStoredUsers = () => {
  try {
    const data = localStorage.getItem(LOCAL_USERS_KEY);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error('Erreur lecture local users', e);
  }
  return MOCK_USERS;
};

const saveStoredUsers = (users) => {
  try {
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
  } catch (e) {
    console.error('Erreur sauvegarde local users', e);
  }
};

export const authService = {
  login: async ({ email, password }) => {
    const cleanEmail = String(email || '').trim().toLowerCase();
    
    // Tente de se connecter via l'API backend
    try {
      const data = await api.post('/api/auth/login', { email: cleanEmail, motDePasse: password });
      const user = data.user || data.utilisateur;

      if (user) {
        if (user.statut === 'SUSPENDU' || user.statut === 'DESACTIVE') {
          throw new Error(`Votre compte est ${user.statut === 'SUSPENDU' ? 'suspendu' : 'désactivé'}. Veuillez contacter l'administration.`);
        }
        data.user = user;
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(user));
        return data;
      }
    } catch (err) {
      if (err.message && (err.message.includes('suspendu') || err.message.includes('désactivé'))) {
        throw err;
      }
      console.warn('Backend API login indisponible ou échoué, essai fallback utilisateurs locaux/mock:', err.message);
    }

    // Fallback Mock / Local Storage
    const users = getStoredUsers();
    const found = users.find(u => String(u.email || '').toLowerCase() === cleanEmail);

    if (!found) {
      throw new Error('Identifiants invalides');
    }

    if (found.statut === 'SUSPENDU' || found.statut === 'DESACTIVE') {
      throw new Error(`Votre compte est ${found.statut === 'SUSPENDU' ? 'suspendu' : 'désactivé'}. Veuillez contacter votre administrateur.`);
    }

    const mockToken = `mock_jwt_token_${found.id}_${Date.now()}`;
    localStorage.setItem('token', mockToken);
    localStorage.setItem('user', JSON.stringify(found));
    
    return {
      token: mockToken,
      user: found,
      utilisateur: found,
    };
  },

  verify2FA: async ({ userId, code }) => {
    const data = await api.post('/api/auth/verify-2fa', { userId, code });
    if (data.token) {
      localStorage.setItem('token', data.token);
      const user = data.user || data.utilisateur;
      if (user) {
        data.user = user;
        localStorage.setItem('user', JSON.stringify(user));
      }
    }
    return data;
  },

  resend2FA: async ({ userId }) => {
    return api.post('/api/auth/resend-2fa', { userId });
  },

  register: async (fields) => {
    return api.post('/api/auth/register', fields);
  },

  getProfile: async () => {
    const data = await api.get('/api/auth/profil');
    const user = data.user || data.utilisateur;
    if (user) data.user = user;
    return data;
  },

  updateProfile: async (fields) => {
    return api.put('/api/auth/profil', fields);
  },

  updateUserProfile: async (id, fields) => {
    return api.put(`/api/auth/users/${id}`, fields);
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getAllUsers: async (entrepriseIdFilter = null) => {
    try {
      const res = await api.get('/api/auth/users');
      let list = res?.utilisateurs || (Array.isArray(res) ? res : []);
      if (list && list.length > 0) {
        saveStoredUsers(list);
        if (entrepriseIdFilter) {
          list = list.filter(u => u.entrepriseId === entrepriseIdFilter);
        }
        return { utilisateurs: list };
      }
    } catch (err) {
      console.warn('Erreur API getAllUsers, fallback local:', err.message);
    }

    let users = getStoredUsers();
    if (entrepriseIdFilter) {
      users = users.filter(u => u.entrepriseId === entrepriseIdFilter);
    }
    return { utilisateurs: users };
  },

  toggleUserStatus: async (id, targetStatus = null) => {
    try {
      const res = await api.put(`/api/auth/users/${id}/toggle`, { statut: targetStatus });
      if (res && res.success) {
        return res;
      }
    } catch (err) {
      console.warn('API toggleUserStatus échouée, fallback local:', err.message);
    }

    const current = getStoredUsers();
    const updated = current.map(u => {
      if (u.id === id || u._id === id) {
        const nextStatus = targetStatus ? targetStatus : (u.statut === 'ACTIF' ? 'SUSPENDU' : 'ACTIF');
        return { ...u, statut: nextStatus };
      }
      return u;
    });
    saveStoredUsers(updated);
    return { success: true, message: 'Statut du compte mis à jour localement.' };
  },

  updateUserStatus: async (id, targetStatus) => {
    return authService.toggleUserStatus(id, targetStatus);
  },

  generateAgentQr: async (id) => {
    return api.post(`/api/auth/users/${id}/qr-code`);
  },

  createUser: async ({ email, password, prenom, nom, role, telephone, departement, poste, entrepriseId, entrepriseNom, niveauAccreditation, dateArrivee }) => {
    const payload = {
      email,
      motDePasse: password,
      prenom,
      nom,
      role: role || 'AGENT',
      statut: 'ACTIF',
      telephone: telephone || '',
      departement: departement || '',
      poste: poste || '',
      entrepriseId: entrepriseId || null,
      entrepriseNom: entrepriseNom || '',
      niveauAccreditation: niveauAccreditation || 'Niveau 1',
      dateArrivee: dateArrivee || new Date().toLocaleDateString('fr-FR'),
    };

    try {
      const res = await api.post('/api/auth/register', payload);
      if (res && (res.utilisateur || res.user)) {
        const created = res.utilisateur || res.user;
        const current = getStoredUsers();
        saveStoredUsers([created, ...current]);
        return res;
      }
    } catch (err) {
      console.warn('Création utilisateur API échouée, création locale:', err.message);
    }

    const newUsr = {
      id: `usr_${Date.now()}`,
      _id: `usr_${Date.now()}`,
      ...payload,
    };
    const current = getStoredUsers();
    saveStoredUsers([newUsr, ...current]);
    return { success: true, utilisateur: newUsr, message: 'Utilisateur créé avec succès (Mode local).' };
  },

  getAgentQr: async (id) => {
    return api.get(`/api/auth/users/${id}/qr`);
  },
};
