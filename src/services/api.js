const BASE_URL = import.meta.env.VITE_API_URL || 'https://noregisbackend.onrender.com';

const api = {
  get: async (endpoint) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'API Error');
    }
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
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'API Error');
    }
    return response.json();
  },

  postForm: async (endpoint, formData) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        // Content-Type is deliberately omitted so the browser automatically sets the correct multipart boundary
      },
      body: formData,
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'API Error');
    }
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
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'API Error');
    }
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
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'API Error');
    }
    // Certains DELETE retournent 204 sans corps
    const text = await response.text();
    return text ? JSON.parse(text) : { success: true };
  },
};

export default api;

