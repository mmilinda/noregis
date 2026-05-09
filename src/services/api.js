import axios from 'axios';

const api = axios.create({
  baseURL: 'https://noregisbackend.onrender.com',
  headers: { 'Content-Type': 'application/json' },
});

// Injecte le token automatiquement
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Gestion centralisée des erreurs
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.message || error.message || 'API Error';
    return Promise.reject(new Error(message));
  }
);

export default api;