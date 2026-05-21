import api from './api';

export const authService = {
  login: async ({ email, password }) => {
    const data = await api.post('/api/auth/login', { email, motDePasse: password });
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

  register: async ({ email, password, prenom, nom }) => {
    return api.post('/api/auth/register', {
      email, motDePasse: password, prenom, nom,
    });
  },

  getProfile: async () => {
    const data = await api.get('/api/auth/profil');
    const user = data.user || data.utilisateur;
    if (user) data.user = user;
    return data;
  },

  // Met à jour son propre profil
  updateProfile: async (fields) => {
    return api.put('/api/auth/profil', fields);
  },

  // Admin met à jour le profil d'un autre utilisateur
  updateUserProfile: async (id, fields) => {
    return api.put(`/api/auth/users/${id}`, fields);
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getAllUsers: async () => {
    return api.get('/api/auth/users');
  },

  toggleUserStatus: async (id) => {
    return api.put(`/api/auth/users/${id}/toggle`);
  },

  generateAgentQr: async (id) => {
    return api.post(`/api/auth/users/${id}/qr-code`);
  },

  createUser: async ({ email, password, prenom, nom, role, telephone, departement, poste, niveauAccreditation, dateArrivee }) => {
    return api.post('/api/auth/register', {
      email,
      motDePasse: password,
      prenom,
      nom,
      role,
      telephone,
      departement,
      poste,
      niveauAccreditation,
      dateArrivee,
    });
  },
};
