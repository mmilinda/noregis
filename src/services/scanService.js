import api from './api';

export const scanService = {
  scanID: async (imageFile) => {
    const formData = new FormData();
    formData.append('image', imageFile);
    return api.postForm('/api/scan', formData);
  }
};
