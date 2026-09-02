const BASE_URL = (import.meta.env.VITE_API_URL || 'https://noregisbackend-h9l7.onrender.com').replace(/\/+$/, '');

const handleResponse = async (response) => {
  if (response.status === 401) {
    localStorage.removeItem('token');
  }
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Erreur API (' + response.status + ')');
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

