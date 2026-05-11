import api from './api';

export const authService = {
  login: async ({ email, password }) => {
    const data = await api.post('/api/auth/login', { email, motDePasse: password });
    if (data.token) {
      localStorage.setItem('token', data.token);
    }
    return data;
  },

  register: async ({ email, password, prenom, nom }) => {
    return api.post('/api/auth/register', { email, motDePasse: password, prenom, nom });
  },


  getProfile: async () => {
    return api.get('/api/auth/profil');
  },

  logout: () => {
    localStorage.removeItem('token');
  }
};
