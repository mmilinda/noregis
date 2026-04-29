import api from './api';

export const scanService = {
  scanID: async (imageFile) => {
    const formData = new FormData();
    formData.append('image', imageFile);

    // Note: Since our base api object uses JSON by default, 
    // we need a slightly different approach for multipart/form-data.
    const token = localStorage.getItem('token');
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const response = await fetch(`${baseUrl}/upload/scan`, {
      method: 'POST',
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        // Browser will set Content-Type with boundary automatically for FormData
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Scan failed');
    }

    return response.json();
  }
};
