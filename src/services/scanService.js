import api from './api';

export const scanService = {
  scanID: async (imageFile) => {
    const formData = new FormData();
    formData.append('image', imageFile);

    // ✅ Axios gère automatiquement le Content-Type multipart/form-data + boundary
    return api.post('/upload/scan', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};