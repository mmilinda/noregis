import { createWorker } from 'tesseract.js';

export function toISODate(dateStr) {
  if (!dateStr) return '';
  const s = String(dateStr).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const m = s.match(/^(\d{2})[/.-](\d{2})[/.-](\d{4})$/);
  if (m) {
    const [, day, month, year] = m;
    return `${year}-${month}-${day}`;
  }
  const m2 = s.match(/^(\d{4})[/.-](\d{2})[/.-](\d{2})$/);
  if (m2) {
    const [, year, month, day] = m2;
    return `${year}-${month}-${day}`;
  }
  return s;
}

export function normaliserDonneesOCR(res) {
  if (!res) return {};
  const data = res.infosExtraites || res.donnees || res.data || res.result || res.extracted || res;

  const getVal = (...keys) => {
    for (const key of keys) {
      if (data && data[key] !== undefined && data[key] !== null && data[key] !== '') {
        const val = String(data[key]).trim();
        if (val && val.toLowerCase() !== 'null' && val.toLowerCase() !== 'undefined') return val;
      }
    }
    return '';
  };

  const nom = getVal('nom', 'lastName', 'last_name', 'surname', 'family_name', 'nomFamille');
  const prenom = getVal('prenom', 'firstName', 'first_name', 'given_name', 'prenoms');
  const numeroPiece = getVal('numeroPiece', 'numero_piece', 'documentNumber', 'document_number', 'card_number', 'cni', 'numPiece', 'numero');
  const nin = getVal('nin', 'ninNumber', 'nin_number', 'idNumber', 'id_number', 'nationalId', 'national_id', 'numNational', 'codeNational');
  const rawDateNaissance = getVal('dateNaissance', 'date_naissance', 'birthDate', 'birth_date', 'dob');
  const sexe = getVal('sexe', 'sex', 'gender');
  const typePiece = getVal('typePiece', 'type_piece', 'documentType', 'docType');
  const lieuNaissance = getVal('lieuNaissance', 'lieu_naissance', 'birthPlace', 'pob');
  const rawDateDelivrance = getVal('dateDelivrance', 'date_delivrance', 'issueDate', 'issued_date', 'issuedAt');
  const rawDateExpiration = getVal('dateExpiration', 'date_expiration', 'expiryDate', 'expirationDate', 'expiresAt', 'exp', 'validUntil', 'dateExp', 'expiration');
  const adresseDomicile = getVal('adresseDomicile', 'adresse', 'address');

  return {
    nom,
    prenom,
    numeroPiece,
    nin,
    dateNaissance: toISODate(rawDateNaissance),
    sexe: sexe ? sexe.toUpperCase().slice(0, 1) : '',
    typePiece: typePiece || (numeroPiece ? 'CNI' : ''),
    lieuNaissance,
    dateDelivrance: toISODate(rawDateDelivrance),
    dateExpiration: toISODate(rawDateExpiration),
    adresseDomicile,
  };
}

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

  // 4. Date d'expiration
  let expiryMatch = cleanText.match(/(?:EXPIRATION|EXPIRE|VALIDE JUSQU|EXPIRATION DATE|DATE D['’]EXPIRATION|EXP)[\s:]*(\d{2}[/.-]\d{2}[/.-]\d{4})/i) ||
                    cleanText.match(/(?:EXPIRATION|EXPIRE)[\s:]*(\d{2}[/.-]\d{2}[/.-](?:20)\d{2})/i) ||
                    cleanText.match(/EXP[\s:]*(\d{2}[/.-]\d{2}[/.-]\d{4})/i);
  if (expiryMatch) {
    result.dateExpiration = expiryMatch[1].replace(/[-.]/g, '/');
  }

  // 5. Date de délivrance
  let issueMatch = cleanText.match(/(?:DELIVRANCE|DELIVRE LE|ISSUED|ISSUE DATE|DATE DE DELIVRANCE)[\s:]*(\d{2}[/.-]\d{2}[/.-]\d{4})/i);
  if (issueMatch) {
    result.dateDelivrance = issueMatch[1].replace(/[-.]/g, '/');
  }

  // 6. Sexe
  let sexeMatch = cleanText.match(/\b(?:SEXE|SEX)[\s:]*([MF])\b/i);
  if (sexeMatch) {
    result.sexe = sexeMatch[1].toUpperCase();
  }

  // 7. Nom & Prénom
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
