// Service de scan public — ne nécessite pas de token JWT
const BASE_URL = import.meta.env.VITE_API_URL || 'https://noregisbackend.onrender.com';

export const scanPublicService = {
  /**
   * Scan d'une pièce d'identité sans authentification.
   * Utilisé pour les bornes ou kiosques publics.
   * @param {File} imageFile
   */
  scanPublic: async (imageFile) => {
    const formData = new FormData();
    formData.append('image', imageFile);

    const response = await fetch(${BASE_URL}/api/public/scan, {
      method: 'POST',
      body: formData,
      // Pas de header Authorization
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Erreur scan public');
    }
    return response.json();
  },
};
