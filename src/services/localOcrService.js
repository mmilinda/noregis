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

export function verifierFiabiliteDocument(doc = {}) {
  const warnings = [];
  const errors = [];
  let score = 100;

  const pays = (doc.pays || doc.country || doc.nationalite || 'Sénégal').trim();
  const nin = (doc.nin || '').trim();
  const sexe = (doc.sexe || '').toUpperCase().slice(0, 1);
  const dateExp = doc.dateExpiration ? toISODate(doc.dateExpiration) : '';
  const dateNaissance = doc.dateNaissance ? toISODate(doc.dateNaissance) : '';
  const dateDelivrance = doc.dateDelivrance ? toISODate(doc.dateDelivrance) : '';
  const numeroPiece = (doc.numeroPiece || '').trim();
  const typePiece = (doc.typePiece || '').trim();

  // 1. Expiration check
  if (dateExp) {
    const today = new Date().toISOString().slice(0, 10);
    if (dateExp < today) {
      errors.push(`Document expiré depuis le ${dateExp}`);
      score -= 40;
    }
  } else if (typePiece && typePiece !== 'Carte Grise') {
    warnings.push("Date d'expiration non renseignée");
    score -= 10;
  }

  // 2. Coherence of dates
  if (dateNaissance && dateExp && dateExp <= dateNaissance) {
    errors.push("La date d'expiration ne peut pas être antérieure à la date de naissance");
    score -= 30;
  }
  if (dateNaissance && dateDelivrance && dateDelivrance <= dateNaissance) {
    errors.push("La date de délivrance ne peut pas être antérieure à la date de naissance");
    score -= 30;
  }
  if (dateDelivrance && dateExp && dateExp <= dateDelivrance) {
    errors.push("La date d'expiration doit être postérieure à la date de délivrance");
    score -= 30;
  }

  // 3. Senegal NIN coherence & logic
  const isSenegal = /sénégal|senegal|sn/i.test(pays);
  if (isSenegal && nin) {
    const cleanNin = nin.replace(/[\s-]/g, '');
    if (!/^\d{13,15}$/.test(cleanNin)) {
      warnings.push("Format NIN sénégalais inhabituel (13 à 15 chiffres attendus)");
      score -= 15;
    } else {
      const firstDigit = cleanNin[0];
      if (sexe === 'M' && firstDigit !== '1') {
        errors.push("Incohérence NIN / Sexe: Le NIN commence par " + firstDigit + " alors que le sexe est Masculin (chiffre 1 attendu)");
        score -= 25;
      } else if (sexe === 'F' && firstDigit !== '2') {
        errors.push("Incohérence NIN / Sexe: Le NIN commence par " + firstDigit + " alors que le sexe est Féminin (chiffre 2 attendu)");
        score -= 25;
      }
    }
  }

  // 4. Check mandatory fields
  if (!numeroPiece) {
    warnings.push("Numéro de document d'identité absent");
    score -= 15;
  }

  let statut = 'conforme'; // 'conforme' | 'attention' | 'suspect'
  if (errors.length > 0 || score < 60) {
    statut = 'suspect';
  } else if (warnings.length > 0 || score < 90) {
    statut = 'attention';
  }

  return {
    statut,
    score: Math.max(0, score),
    errors,
    warnings,
    isFiable: errors.length === 0,
    pays,
  };
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
  const telephone = getVal('telephone', 'phone', 'phoneNumber', 'phone_number', 'tel', 'mobile');
  const pays = getVal('pays', 'country', 'paysEmetteur', 'issuingCountry', 'nationality', 'nationalite', 'paysOrigine') || 'Sénégal';

  const immatriculation = getVal('immatriculation', 'immatriculationVehicule', 'plaque', 'plate');
  const marque = getVal('marque', 'brand', 'make');
  const modele = getVal('modele', 'model');
  const couleur = getVal('couleur', 'color');
  const typeVehicule = getVal('typeVehicule', 'type_vehicule', 'vehicleType', 'genre');
  const categoriesPermis = getVal('categoriesPermis', 'categories', 'permisCategory');
  const nationalite = getVal('nationalite', 'nationality');
  const centreEnregistrement = getVal('centreEnregistrement', 'issuer', 'autorite', 'emetteur');

  const isCar = (typePiece || '').toUpperCase() === 'CARTE_GRISE' || (!!immatriculation && !numeroPiece);

  const norm = {
    nom,
    prenom,
    numeroPiece: numeroPiece || (isCar ? immatriculation : ''),
    nin,
    dateNaissance: toISODate(rawDateNaissance),
    sexe: sexe ? sexe.toUpperCase().slice(0, 1) : '',
    typePiece: typePiece || (isCar ? 'CARTE_GRISE' : (numeroPiece ? 'CNI' : '')),
    lieuNaissance,
    dateDelivrance: toISODate(rawDateDelivrance),
    dateExpiration: toISODate(rawDateExpiration),
    adresseDomicile,
    telephone,
    pays,
    immatriculation: isCar ? (immatriculation || numeroPiece) : '',
    marque,
    modele,
    couleur,
    typeVehicule,
    categoriesPermis,
    nationalite,
    centreEnregistrement,
  };

  norm.fiabilite = res.fiabilite || verifierFiabiliteDocument(norm);
  return norm;
}

export const ISO3_COUNTRY_MAP = {
  SEN: 'Sénégal',
  FRA: 'France',
  GAB: 'Gabon',
  MLI: 'Mali',
  CIV: "Côte d'Ivoire",
  GIN: 'Guinée',
  GMB: 'Gambie',
  MRT: 'Mauritanie',
  TOG: 'Togo',
  BEN: 'Bénin',
  BFA: 'Burkina Faso',
  NER: 'Niger',
  MAR: 'Maroc',
  TUN: 'Tunisie',
  DZA: 'Algérie',
  CMR: 'Cameroun',
  COD: 'RDC',
  COG: 'Congo',
  GHA: 'Ghana',
  NGA: 'Nigeria',
  CPV: 'Cap-Vert',
  GNB: 'Guinée-Bissau',
  GNQ: 'Guinée Équatoriale',
  RWA: 'Rwanda',
  BDI: 'Burundi',
  TZA: 'Tanzanie',
  KEN: 'Kenya',
  UGA: 'Ouganda',
  ETH: 'Éthiopie',
  ZAF: 'Afrique du Sud',
  USA: 'États-Unis',
  CAN: 'Canada',
  GBR: 'Royaume-Uni',
  DEU: 'Allemagne',
  ESP: 'Espagne',
  ITA: 'Italie',
  PRT: 'Portugal',
  BEL: 'Belgique',
  CHE: 'Suisse',
  NLD: 'Pays-Bas',
  CHN: 'Chine',
  JPN: 'Japon',
  IND: 'Inde',
  BRA: 'Brésil',
  TUR: 'Turquie',
  SAU: 'Arabie Saoudite',
  ARE: 'Émirats Arabes Unis',
  QAT: 'Qatar',
  EGY: 'Égypte',
  RUS: 'Russie',
  LUX: 'Luxembourg',
  SWE: 'Suède',
  NOR: 'Norvège',
  DNK: 'Danemark',
  FIN: 'Finlande',
  POL: 'Pologne',
  AUT: 'Autriche',
};

export const PAYS_OPTIONS = [
  'Sénégal', 'France', 'Gabon', 'Mali', "Côte d'Ivoire", 'Guinée', 'Gambie',
  'Mauritanie', 'Togo', 'Bénin', 'Burkina Faso', 'Niger', 'Maroc', 'Tunisie', 'Algérie',
  'Cameroun', 'RDC', 'Congo', 'Ghana', 'Nigeria', 'Cap-Vert', 'Guinée-Bissau', 'Guinée Équatoriale',
  'États-Unis', 'Canada', 'Royaume-Uni', 'Allemagne', 'Espagne', 'Italie', 'Suisse', 'Belgique',
  'Autre'
];

export function normalizeTypePiece(value) {
  if (!value) return "Carte Nationale d'Identité";
  const v = String(value).toUpperCase().trim();
  if (v === 'CNI' || v.includes('NATIONAL') || v.includes('IDENTIT')) return "Carte Nationale d'Identité";
  if (v === 'PASSEPORT' || v.includes('PASSPORT') || v === 'P') return "Passeport";
  if (v === 'PERMIS' || v.includes('DRIVER') || v.includes('CONDUIRE')) return "Permis de Conduire";
  if (v === 'CARTE_SEJOUR' || v.includes('SEJOUR') || v.includes('RESIDENCE')) return "Carte de Séjour";
  if (v === 'CARTE_CONSULAIRE' || v.includes('CONSULAIRE')) return "Carte Consulaire";
  if (v === 'CARTE_GRISE' || v.includes('GRISE')) return "Carte Grise";
  return value;
}

function fixMRZDigits(str) {
  if (!str) return '';
  return str
    .replace(/O/gi, '0')
    .replace(/Q/gi, '0')
    .replace(/[IL]/gi, '1')
    .replace(/Z/gi, '2')
    .replace(/S/gi, '5')
    .replace(/B/gi, '8');
}

export function parseMRZ(cleanText) {
  if (!cleanText) return {};
  const lines = cleanText.split('\n').map(l => l.replace(/[\s\r\t]/g, '').toUpperCase());
  const res = {};

  // Recherche Ligne 1 du MRZ Passeport (Standard ICAO 9303 TD3)
  let l1Idx = lines.findIndex(l => /^P[<A-Z0-9]{1}[A-Z]{3}[A-Z<]{10,}/.test(l) || (l.startsWith('P') && l.includes('<<')));
  if (l1Idx === -1) {
    l1Idx = lines.findIndex(l => l.includes('<<') && (l.startsWith('P') || l.startsWith('1P') || l.startsWith('2P')));
  }

  if (l1Idx !== -1) {
    res.typePiece = 'Passeport';
    const l1 = lines[l1Idx].replace(/^[^P]+/, '');

    // Code pays d'émission (3 lettres ISO à la position 2..4)
    const natMatch = l1.match(/^P[<A-Z0-9]?([A-Z]{3})/);
    if (natMatch && ISO3_COUNTRY_MAP[natMatch[1]]) {
      res.pays = ISO3_COUNTRY_MAP[natMatch[1]];
    }

    // Nom & Prénom depuis la ligne 1 MRZ (format SURNAME<<GIVEN_NAMES)
    let namePart = l1.slice(5);
    if (!namePart.includes('<<')) namePart = l1.slice(2);
    if (namePart.includes('<<')) {
      const parts = namePart.split('<<');
      let surname = parts[0].replace(/</g, ' ').replace(/\s+/g, ' ').trim();
      let given = parts[1] ? parts[1].split('<').filter(Boolean).join(' ').trim() : '';

      if (surname) res.nom = surname;
      if (given) res.prenom = given;
    }

    // Recherche Ligne 2 MRZ (N° Passeport, Nationalité, Date Naissance, Sexe, Date Expiration)
    const l2Raw = lines[l1Idx + 1] || lines[l1Idx + 2];
    if (l2Raw && l2Raw.length >= 25) {
      const l2 = l2Raw.replace(/^[^A-Z0-9]+/, '');

      // Numéro de Passeport (positions 0..8)
      const docNo = l2.slice(0, 9).replace(/</g, '').trim();
      if (/^[A-Z0-9]{6,12}$/.test(docNo)) {
        res.numeroPiece = docNo;
      }

      // Pays si non extrait de la ligne 1 (positions 10..12)
      if (!res.pays) {
        const nat2 = l2.slice(10, 13).replace(/[^A-Z]/g, '');
        if (ISO3_COUNTRY_MAP[nat2]) res.pays = ISO3_COUNTRY_MAP[nat2];
      }

      // Date de Naissance (positions 13..18: YYMMDD)
      const rawDob = l2.slice(13, 19);
      const dobStr = fixMRZDigits(rawDob);
      if (/^\d{6}$/.test(dobStr)) {
        const yy = parseInt(dobStr.slice(0, 2), 10);
        const mm = dobStr.slice(2, 4);
        const dd = dobStr.slice(4, 6);
        const currentYY = new Date().getFullYear() % 100;
        const century = (yy > currentYY) ? '19' : '20';
        res.dateNaissance = `${century}${dobStr.slice(0, 2)}-${mm}-${dd}`;
      }

      // Sexe (position 20)
      const sexChar = l2.charAt(20).toUpperCase();
      if (sexChar === 'M' || sexChar === 'F') {
        res.sexe = sexChar;
      }

      // Date d'expiration (positions 21..26: YYMMDD)
      const rawExp = l2.slice(21, 27);
      const expStr = fixMRZDigits(rawExp);
      if (/^\d{6}$/.test(expStr)) {
        const mm = expStr.slice(2, 4);
        const dd = expStr.slice(4, 6);
        res.dateExpiration = `20${expStr.slice(0, 2)}-${mm}-${dd}`;
      }

      // Numéro d'identification personnel / NIN (positions 28..41)
      const persNum = l2.slice(28, 42).replace(/</g, '').trim();
      if (persNum && /^\d{11,15}$/.test(persNum)) {
        res.nin = persNum;
      }
    }
  }

  return res;
}

export function parseIDText(text) {
  if (!text) return {};
  const cleanText = text.replace(/\r\n/g, '\n');
  const lines = cleanText.split('\n').map(l => l.trim()).filter(Boolean);

  // 1. Tenter la lecture MRZ internationale (Passeports ICAO 9303)
  const mrzResult = parseMRZ(cleanText);
  const result = { ...mrzResult };

  // Country detection fallback si non extrait du MRZ
  if (!result.pays) {
    if (/SENEGAL|SÉNÉGAL/i.test(cleanText)) {
      result.pays = 'Sénégal';
    } else if (/FRANCE|FRANCAISE|FRANÇAISE/i.test(cleanText)) {
      result.pays = 'France';
    } else if (/GABON|GABONAISE/i.test(cleanText)) {
      result.pays = 'Gabon';
    } else if (/MALI/i.test(cleanText)) {
      result.pays = 'Mali';
    } else if (/COTE D['’]IVOIRE|CÔTE D['’]IVOIRE/i.test(cleanText)) {
      result.pays = "Côte d'Ivoire";
    } else if (/GUINEE|GUINÉE/i.test(cleanText)) {
      result.pays = 'Guinée';
    } else if (/GAMBIA|GAMBIE/i.test(cleanText)) {
      result.pays = 'Gambie';
    } else if (/MAURITANIE|MAURITANIA/i.test(cleanText)) {
      result.pays = 'Mauritanie';
    } else if (/UNITED STATES|AMERICA|USA/i.test(cleanText)) {
      result.pays = 'États-Unis';
    } else if (/CANADA/i.test(cleanText)) {
      result.pays = 'Canada';
    } else if (/UNITED KINGDOM|BRITISH|GBR/i.test(cleanText)) {
      result.pays = 'Royaume-Uni';
    }
  }

  // Multi-lingual Passport Visual Zone Detection
  if (/(?:PASSPORT|PASSEPORT|PASAPORTE)/i.test(cleanText) || result.typePiece === 'Passeport') {
    result.typePiece = 'Passeport';

    // Numéro de Passeport (Zone Visuelle)
    let pNoMatch = cleanText.match(/(?:PASSPORT\s*(?:NO|NUMERO|N°)?|PASSEPORT\s*(?:NO|NUMERO|N°)?|PASAPORTE\s*(?:NO|NUMERO|N°)?)[\s.:]*([A-Z0-9]{6,12})/i) ||
                   cleanText.match(/(?:DOC\s*N°|DOCUMENT\s*N°|PASSPORT\s*CODE)[\s.:]*([A-Z0-9]{6,12})/i);
    if (pNoMatch && !result.numeroPiece) {
      result.numeroPiece = pNoMatch[1];
    }

    // Nom (Zone Visuelle)
    let surnameMatch = cleanText.match(/(?:SURNAME|NOM|APELLIDOS)[\s.:]+([A-Z\s-]+)/i);
    if (surnameMatch && !result.nom) {
      const rawNom = surnameMatch[1].split('\n')[0].trim();
      if (rawNom.length > 1 && !/PASSEPORT|PASSPORT|REPUBLIQUE|SENEGAL|GABON|FRANCE|MALI/i.test(rawNom)) {
        result.nom = rawNom;
      }
    }

    // Prénom (Zone Visuelle)
    let givenMatch = cleanText.match(/(?:GIVEN\s*NAMES?|PRENOMS?|NOMBRES?)[\s.:]+([A-Z\s-]+)/i);
    if (givenMatch && !result.prenom) {
      const rawPrenom = givenMatch[1].split('\n')[0].trim();
      if (rawPrenom.length > 1 && !/PASSEPORT|PASSPORT|REPUBLIQUE|SENEGAL|GABON|FRANCE|MALI/i.test(rawPrenom)) {
        result.prenom = rawPrenom;
      }
    }

    // Lieu de naissance (Zone Visuelle)
    let pobMatch = cleanText.match(/(?:PLACE\s*OF\s*BIRTH|LIEU\s*DE\s*NAISSANCE)[\s.:]*([A-Z\s-]+)/i);
    if (pobMatch && !result.lieuNaissance) {
      const pob = pobMatch[1].split('\n')[0].trim();
      if (pob.length > 2 && !/DATE|SEXE|SEX/i.test(pob)) {
        result.lieuNaissance = pob;
      }
    }
  }

  // 1. NIN (Numéro d'Identification Nationale - Sénégal: 13 à 15 chiffres)
  if (!result.nin) {
    let ninMatch = cleanText.match(/NIN[\s:]*([0-9\s]{13,20})/i) ||
                   cleanText.match(/N[.\s]*I[.\s]*N[.\s:]*([0-9\s]{13,20})/i) ||
                   cleanText.match(/\b([12][\s-]?[0-9]{4}[\s-]?[0-9]{4}[\s-]?[0-9]{4,5})\b/) ||
                   cleanText.match(/\b([12]\d{12,14})\b/);
    if (ninMatch) {
      result.nin = ninMatch[1].replace(/[\s-]/g, '');
    }
  }

  // 2. Numéro de pièce fallback
  if (!result.numeroPiece) {
    let pieceMatch = cleanText.match(/(?:N°|NO|NUMERO|CARD|ID)[\s.:]*([A-Z0-9]{8,15})/i) ||
                      cleanText.match(/\b([A-Z]\d{9,12})\b/);
    if (pieceMatch) {
      result.numeroPiece = pieceMatch[1];
    }
  }

  // 3. Date de naissance fallback
  if (!result.dateNaissance) {
    let dateMatch = cleanText.match(/(?:NEE? LE|BIRTH|NAISSANCE|DATE OF BIRTH)[\s:]*(\d{2}[/.-]\d{2}[/.-]\d{4})/i) ||
                    cleanText.match(/\b(\d{2}[/.-]\d{2}[/.-](?:19|20)\d{2})\b/);
    if (dateMatch) {
      result.dateNaissance = dateMatch[1].replace(/[-.]/g, '/');
    }
  }

  // 4. Date d'expiration fallback
  if (!result.dateExpiration) {
    let expiryMatch = cleanText.match(/(?:EXPIRATION|EXPIRE|VALIDE JUSQU|EXPIRATION DATE|DATE D['’]EXPIRATION|DATE OF EXPIRY|EXP)[\s:]*(\d{2}[/.-]\d{2}[/.-]\d{4})/i) ||
                      cleanText.match(/(?:EXPIRATION|EXPIRE)[\s:]*(\d{2}[/.-]\d{2}[/.-](?:20)\d{2})/i) ||
                      cleanText.match(/EXP[\s:]*(\d{2}[/.-]\d{2}[/.-]\d{4})/i);
    if (expiryMatch) {
      result.dateExpiration = expiryMatch[1].replace(/[-.]/g, '/');
    }
  }

  // 5. Date de délivrance fallback
  if (!result.dateDelivrance) {
    let issueMatch = cleanText.match(/(?:DELIVRANCE|DELIVRE LE|ISSUED|ISSUE DATE|DATE DE DELIVRANCE|DATE OF ISSUE)[\s:]*(\d{2}[/.-]\d{2}[/.-]\d{4})/i);
    if (issueMatch) {
      result.dateDelivrance = issueMatch[1].replace(/[-.]/g, '/');
    }
  }

  // 6. Sexe fallback
  if (!result.sexe) {
    let sexeMatch = cleanText.match(/\b(?:SEXE|SEX|GENDER)[\s:]*([MF])\b/i);
    if (sexeMatch) {
      result.sexe = sexeMatch[1].toUpperCase();
    }
  }

  // 7. Téléphone
  if (!result.telephone) {
    let phoneMatch = cleanText.match(/(?:TEL|PHONE|TELEPHONE|MOBILE)[\s:]*([+\d\s]{8,18})/i);
    if (phoneMatch) {
      result.telephone = phoneMatch[1].trim();
    }
  }

  // 8. Nom & Prénom fallback
  if (!result.nom || !result.prenom) {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (/NOM[\s:]+|SURNAME[\s:]+/i.test(line)) {
        const parts = line.split(/(?:NOM|SURNAME)[\s:]+/i);
        if (parts[1] && parts[1].trim().length > 1 && !result.nom) result.nom = parts[1].trim();
        else if (lines[i + 1] && !result.nom) result.nom = lines[i + 1].trim();
      }
      if (/PRENOM[S]?[\s:]+|GIVEN NAMES?[\s:]+/i.test(line)) {
        const parts = line.split(/(?:PRENOM[S]?|GIVEN NAMES?)[\s:]+/i);
        if (parts[1] && parts[1].trim().length > 1 && !result.prenom) result.prenom = parts[1].trim();
        else if (lines[i + 1] && !result.prenom) result.prenom = lines[i + 1].trim();
      }
    }
  }

  // Fallback si NOM / PRENOM toujours non trouvés
  if (!result.nom || !result.prenom) {
    const uppercaseLines = lines.filter(l => 
      l === l.toUpperCase() && 
      l.length > 2 && 
      !/\d/.test(l) && 
      !/REPUBLIQUE|SENEGAL|GABON|FRANCE|MALI|CARTE|NATIONALE|IDENTITE|CEDEAO|ECOWAS|PERMIS|CONDUIRE|PASSEPORT|PASSPORT/i.test(l)
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

