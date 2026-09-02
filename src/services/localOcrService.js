import { createWorker } from 'tesseract.js';

export function parseIDText(text) {
  if (!text) return {};
  const cleanText = text.replace(/\r\n/g, '\n');
  const lines = cleanText.split('\n').map(l => l.trim()).filter(Boolean);

  const result = {};

  // 1. NIN (Numéro d'Identification Nationale - Sénégal: 13 à 15 chiffres)
  let ninMatch = cleanText.match(/NIN[\s:]*([0-9\s]{13,20})/i) ||
                 cleanText.match(/N[.\s]*I[.\s]*N[.\s:]*([0-9\s]{13,20})/i) ||
                 cleanText.match(/\b([12][\s-]?[0-9]{4}[\s-]?[0-9]{4}[\s-]?[0-9]{4,5})\b/) ||
                 cleanText.match(/\b([12]\d{12,14})\b/);
  if (ninMatch) {
    result.nin = ninMatch[1].replace(/[\s-]/g, '');
  }

  // 2. Numéro de pièce
  let pieceMatch = cleanText.match(/(?:N°|NO|NUMERO|CARD|ID)[\s.:]*([A-Z0-9]{8,15})/i) ||
                    cleanText.match(/\b([A-Z]\d{9,12})\b/);
  if (pieceMatch) {
    result.numeroPiece = pieceMatch[1];
  }

  // 3. Date de naissance
  let dateMatch = cleanText.match(/(?:NEE? LE|BIRTH|NAISSANCE)[\s:]*(\d{2}[/.-]\d{2}[/.-]\d{4})/i) ||
                  cleanText.match(/\b(\d{2}[/.-]\d{2}[/.-](?:19|20)\d{2})\b/);
  if (dateMatch) {
    result.dateNaissance = dateMatch[1].replace(/[-.]/g, '/');
  }

  // 4. Sexe
  let sexeMatch = cleanText.match(/\b(?:SEXE|SEX)[\s:]*([MF])\b/i);
  if (sexeMatch) {
    result.sexe = sexeMatch[1].toUpperCase();
  }

  // 5. Nom & Prénom
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/NOM[\s:]+/i.test(line)) {
      const parts = line.split(/NOM[\s:]+/i);
      if (parts[1] && parts[1].trim().length > 1) result.nom = parts[1].trim();
      else if (lines[i + 1]) result.nom = lines[i + 1].trim();
    }
    if (/PRENOM[S]?[\s:]+/i.test(line)) {
      const parts = line.split(/PRENOM[S]?[\s:]+/i);
      if (parts[1] && parts[1].trim().length > 1) result.prenom = parts[1].trim();
      else if (lines[i + 1]) result.prenom = lines[i + 1].trim();
    }
  }

  // Fallback si NOM / PRENOM non trouvés par mot clé : chercher les lignes en majuscules
  if (!result.nom || !result.prenom) {
    const uppercaseLines = lines.filter(l => 
      l === l.toUpperCase() && 
      l.length > 2 && 
      !/\d/.test(l) && 
      !/REPUBLIQUE|SENEGAL|CARTE|NATIONALE|IDENTITE|CEDEAO|ECOWAS|PERMIS|CONDUIRE/i.test(l)
    );
    if (uppercaseLines.length >= 2) {
      if (!result.nom) result.nom = uppercaseLines[0];
      if (!result.prenom) result.prenom = uppercaseLines[1];
    } else if (uppercaseLines.length === 1) {
      if (!result.nom) result.nom = uppercaseLines[0];
    }
  }

  return result;
}

export async function runLocalOCR(imageSource, lang = 'fra') {
  let worker = null;
  try {
    worker = await createWorker(lang);
    const ret = await worker.recognize(imageSource);
    await worker.terminate();
    const texteBrut = ret.data.text || '';
    const extracted = parseIDText(texteBrut);
    return { extracted, texteBrut };
  } catch (err) {
    if (worker) await worker.terminate().catch(() => {});
    console.error('Erreur Tesseract OCR local:', err);
    return { extracted: {}, texteBrut: '' };
  }
}
