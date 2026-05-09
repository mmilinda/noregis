// services/scanService.js

/**
 * Prétraite une image avant envoi à l'OCR.
 * - Redimensionne si la largeur dépasse maxWidth (maintient ratio)
 * - Convertit en niveaux de gris
 * - Améliore le contraste (étirement dynamique)
 * - Optionnel : seuillage binaire pour texte noir/blanc
 *
 * @param {File|Blob} file - Fichier image brut
 * @param {Object} options - Paramètres optionnels
 * @param {number} options.maxWidth - Largeur max en pixels (défaut: 1500)
 * @param {boolean} options.enhanceContrast - Activer l’amélioration du contraste (défaut: true)
 * @param {number} options.contrastFactor - Facteur de contraste (défaut: 1.5)
 * @param {boolean} options.binarize - Appliquer un seuillage binaire (défaut: false)
 * @param {number} options.binarizeThreshold - Seuil pour binarisation (défaut: 180)
 * @returns {Promise<Blob>} Blob JPEG prétraité
 */
async function preprocessImage(file, options = {}) {
  const {
    maxWidth = 1500,
    enhanceContrast = true,
    contrastFactor = 1.5,
    binarize = false,
    binarizeThreshold = 180,
  } = options;

  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;
      // Redimensionnement proportionnel
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      // Dessiner l'image redimensionnée
      ctx.drawImage(img, 0, 0, width, height);

      // Récupérer les pixels
      const imageData = ctx.getImageData(0, 0, width, height);
      const data = imageData.data;

      // Parcourir chaque pixel (R,G,B,A)
      for (let i = 0; i < data.length; i += 4) {
        let r = data[i];
        let g = data[i + 1];
        let b = data[i + 2];

        // Conversion en niveaux de gris (luminance)
        let gray = 0.299 * r + 0.587 * g + 0.114 * b;

        if (enhanceContrast) {
          // Étirement du contraste autour de 128
          gray = 128 + (gray - 128) * contrastFactor;
          gray = Math.min(255, Math.max(0, gray));
        }

        if (binarize) {
          // Seuillage : 255 si > seuil, sinon 0
          const value = gray > binarizeThreshold ? 255 : 0;
          data[i] = data[i + 1] = data[i + 2] = value;
        } else {
          data[i] = data[i + 1] = data[i + 2] = gray;
        }
        // Alpha inchangé
      }

      ctx.putImageData(imageData, 0, 0);

      // Convertir en Blob JPEG (qualité 0.85)
      canvas.toBlob(blob => resolve(blob), 'image/jpeg', 0.85);
    };

    img.onerror = () => reject(new Error('Erreur chargement de l’image'));
    img.src = url;
  });
}

/**
 * Service de scan avec prétraitement automatique
 */
export const scanService = {
  /**
   * Envoie une image scannée (carte d'identité, passeport, carte grise) à l'API d'OCR.
   * L'image est automatiquement prétraitée pour améliorer la reconnaissance.
   *
   * @param {File} imageFile - Fichier image capturé (depuis la caméra ou un téléchargement)
   * @returns {Promise<Object>} Données extraites (nom, prénom, numéro de pièce, etc.)
   */
  scanID: async (imageFile) => {
    // 1. Prétraiter l'image
    const processedBlob = await preprocessImage(imageFile, {
      maxWidth: 1500,
      enhanceContrast: true,
      binarize: false,      // mettre à true pour des documents très contrastés
      binarizeThreshold: 180,
      contrastFactor: 1.6,
    });

    // 2. Construire le FormData
    const formData = new FormData();
    formData.append('image', processedBlob, 'scan_processed.jpg');

    // 3. Appel API
    const token = localStorage.getItem('token');
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    const response = await fetch(`${baseUrl}/upload/scan`, {
      method: 'POST',
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
        // Ne pas définir Content-Type → le navigateur ajoute la boundary automatiquement
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Échec du scan');
    }

    return response.json();
  },
};