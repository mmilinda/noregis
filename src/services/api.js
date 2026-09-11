const BASE_URL = (import.meta.env.VITE_API_URL || 'https://noregisbackend-h9l7.onrender.com').replace(/\/+$/, '');

const handleResponse = async (response) => {
  if (response.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    if (typeof window !== 'undefined' && !window.location.pathname.includes('/scan/')) {
      window.dispatchEvent(new Event('auth:expired'));
    }
  }
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const msg = response.status === 401 
      ? 'Votre session a expiré. Veuillez vous reconnecter.' 
      : (errorData.message || 'Erreur API (' + response.status + ')');
    throw new Error(msg);
  }
  return response;
};

const api = {
  get: async (endpoint) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json',
      },
    });
    await handleResponse(response);
    return response.json();
  },
  
  post: async (endpoint, data) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    await handleResponse(response);
    return response.json();
  },

  postForm: async (endpoint, formData) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
      },
      body: formData,
    });
    await handleResponse(response);
    return response.json();
  },

  put: async (endpoint, data) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    await handleResponse(response);
    return response.json();
  },

  delete: async (endpoint) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json',
      },
    });
    await handleResponse(response);
    const text = await response.text();
    return text ? JSON.parse(text) : { success: true };
  },
};

export default api;

