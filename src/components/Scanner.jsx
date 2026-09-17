import { useState, useRef } from 'react';
import { Calendar, Building2, User, CreditCard, CheckCircle2, Camera, Clock, MapPin, Ruler, CalendarDays, UserRound, FileText, Home, MapPinned, Phone, Globe, Award, FileBadge, Car } from 'lucide-react';
import { Btn, Input, Select, Modal } from './UI';
import { ScanPanel } from './ScanPanel';
import { useApp } from '../context/useAppState';
import { TRANSLATIONS } from '../translations';

import { PAYS_OPTIONS, normalizeTypePiece } from '../services/localOcrService';

const servicesList = [
  'Direction Générale', 'Ressources Humaines', 'Direction Financière',
  'Comptabilité', 'Direction Technique', 'Maintenance', 'Informatique / IT',
  'Logistique', 'Entrepôt / Livraison', 'Commercial / Ventes', 'Marketing',
  'Juridique', 'Sécurité', 'Accueil / Réception', 'Autre'
];

export function Dt({ initial = {}, onSubmit, onCancel, loading, t: translations }) {
  const { state } = useApp();
  const t = translations || TRANSLATIONS[state.settings?.language || 'fr'];

  const [formData, setFormData] = useState({
    nom: initial.nom || '',
    prenom: initial.prenom || '',
    pays: initial.pays || 'Sénégal',
    dateNaissance: initial.dateNaissance || '',
    sexe: initial.sexe || '',
    taille: initial.taille || '',
    lieuNaissance: initial.lieuNaissance || '',
    numeroPiece: initial.numeroPiece || '',
    typePiece: initial.typePiece || '',
    dateDelivrance: initial.dateDelivrance || '',
    dateExpiration: initial.dateExpiration || '',
    telephone: initial.telephone || '',
    centreEnregistrement: initial.centreEnregistrement || '',
    adresseDomicile: initial.adresseDomicile || '',
    personneVisitee: initial.personneVisitee || '',
    service: initial.service || '',
    motif: initial.motif || '',
    profession: initial.profession || '',
    immatriculation: initial.immatriculation || '',
    marque: initial.marque || '',
    modele: initial.modele || '',
    couleur: initial.couleur || '',
    typeVehicule: initial.typeVehicule || '',
    categoriesPermis: initial.categoriesPermis || '',
    nin: initial.nin || '',
    heureEntree: initial.heureEntree || new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    date: initial.date || new Date().toLocaleDateString('fr-FR'),
    ...initial
  });

  const [errors, setErrors] = useState({});
  const [showScan, setShowScan] = useState(false);
  const [docImage, setDocImage] = useState(initial.docImage || null);

  const activeDocType = normalizeTypePiece(formData.typePiece);
  const docCategory = 
    activeDocType === 'Passeport' ? 'PASSPORT' :
    activeDocType === 'Permis de Conduire' ? 'LICENSE' :
    (activeDocType === 'Carte Consulaire' || activeDocType === 'Carte de Séjour') ? 'CONSULAR' :
    activeDocType === 'Carte Grise' ? 'CARTE_GRISE' : 'CNI';

  const handleChange = (field) => (e) => {
    const val = e.target.value;
    setFormData(prev => ({ ...prev, [field]: val }));
  };

  const validate = () => {
    const err = {};
    if (!formData.nom.trim()) err.nom = t.required_field;
    if (!formData.prenom.trim()) err.prenom = t.required_field;
    if (!formData.numeroPiece.trim()) err.numeroPiece = t.required_field;
    if (!formData.typePiece) err.typePiece = t.select_type;
    if (!formData.personneVisitee.trim()) err.personneVisitee = t.required_field;
    if (!formData.service) err.service = t.select_service;
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSubmit({
        ...formData,
        type: 'person',
        statut: 'present',
        heureSortie: null,
        photo: docImage
      });
    }
  };

  const handleOcrData = (rawData, image) => {
    const data = rawData?.infosExtraites || rawData?.extracted || rawData || {};
    const extractedTypePiece = (data.typePiece || data.documentType) ? normalizeTypePiece(data.typePiece || data.documentType) : formData.typePiece;
    const extractedNumPiece = (data.numeroPiece || data.documentNumber) ? String(data.numeroPiece || data.documentNumber).trim() : formData.numeroPiece;
    const extractedNin = (data.nin || data.idNumber) ? String(data.nin || data.idNumber).trim() : formData.nin;

    setFormData(prev => ({
      ...prev,
      nom: (data.nom || data.lastName) ? String(data.nom || data.lastName).trim() : prev.nom,
      prenom: (data.prenom || data.firstName) ? String(data.prenom || data.firstName).trim() : prev.prenom,
      nin: extractedNin,
      pays: (data.pays || data.country) ? String(data.pays || data.country).trim() : prev.pays,
      numeroPiece: extractedNumPiece,
      typePiece: extractedTypePiece,
      dateNaissance: data.dateNaissance ?? prev.dateNaissance,
      sexe: data.sexe ?? prev.sexe,
      taille: data.taille ?? prev.taille,
      lieuNaissance: data.lieuNaissance ?? prev.lieuNaissance,
      dateDelivrance: data.dateDelivrance ?? prev.dateDelivrance,
      dateExpiration: data.dateExpiration ?? prev.dateExpiration,
      telephone: data.telephone ?? prev.telephone,
      centreEnregistrement: data.centreEnregistrement ?? prev.centreEnregistrement,
      adresseDomicile: data.adresseDomicile ?? prev.adresseDomicile,
      immatriculation: data.immatriculation ?? prev.immatriculation,
      marque: data.marque ?? prev.marque,
      modele: data.modele ?? prev.modele,
      couleur: data.couleur ?? prev.couleur,
      typeVehicule: data.typeVehicule ?? prev.typeVehicule,
      categoriesPermis: data.categoriesPermis ?? prev.categoriesPermis,
    }));
    setDocImage(image);
    setShowScan(false);
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Bloc Scan */}
        <div className="bg-gradient-to-r from-brand-blue-light/20 to-brand-green-light/20 dark:from-brand-blue-bright/10 dark:to-brand-green-bright/10 border-2 border-brand-blue-bright/20 rounded-xl p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {docImage ? (
              <div className="w-12 h-9 rounded-lg overflow-hidden border-2 border-brand-green-bright">
                <img src={docImage} alt="doc" className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-12 h-9 rounded-lg bg-white/50 dark:bg-slate-800 flex items-center justify-center">
                <CreditCard size={20} className="text-brand-blue-bright" />
              </div>
            )}
            <div>
              <p className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
                {docImage ? (
                  <><CheckCircle2 size={16} className="text-brand-green-bright" /> {t.scan_id_done}</>
                ) : (
                  <><Camera size={16} className="text-brand-blue-bright" /> {t.scan_quick}</>
                )}
              </p>
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tighter leading-none mt-1">
                {t.scan_id_desc}
              </p>
            </div>
          </div>
          <Btn variant="primary" size="sm" icon={Camera} onClick={() => setShowScan(true)} type="button">
            {docImage ? t.rescan_btn : t.scan_btn}
          </Btn>
        </div>

        {/* Formulaire Dynamique selon le document */}
        <div className="space-y-4">
          <div className={`p-3.5 rounded-xl border-2 transition-all flex items-center justify-between gap-3 ${
            docCategory === 'PASSPORT' ? 'bg-blue-500/10 border-blue-500/30 text-blue-900 dark:text-blue-200' :
            docCategory === 'LICENSE' ? 'bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200' :
            docCategory === 'CONSULAR' ? 'bg-purple-500/10 border-purple-500/30 text-purple-900 dark:text-purple-200' :
            docCategory === 'CARTE_GRISE' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-200' :
            'bg-brand-blue-light/30 border-brand-blue-bright/30 text-slate-900 dark:text-white'
          }`}>
            <div className="flex items-center gap-2.5">
              {docCategory === 'PASSPORT' && <Globe size={20} className="text-blue-500 shrink-0" />}
              {docCategory === 'LICENSE' && <Award size={20} className="text-amber-500 shrink-0" />}
              {docCategory === 'CONSULAR' && <FileBadge size={20} className="text-purple-500 shrink-0" />}
              {docCategory === 'CARTE_GRISE' && <Car size={20} className="text-emerald-500 shrink-0" />}
              {docCategory === 'CNI' && <CreditCard size={20} className="text-brand-blue-bright shrink-0" />}
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider">Formulaire {activeDocType}</h4>
                <p className="text-[10px] font-bold opacity-80 mt-0.5">Adapté au document détecté</p>
              </div>
            </div>
            <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-lg bg-white/80 dark:bg-slate-800 border border-current/20 shadow-sm shrink-0">
              {activeDocType}
            </span>
          </div>

          {/* PASSEPORT */}
          {docCategory === 'PASSPORT' && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="grid grid-cols-2 gap-4">
                <Input label={t.name} id="nom" required value={formData.nom} onChange={handleChange('nom')} error={errors.nom} placeholder="NOM" />
                <Input label={t.firstname} id="prenom" required value={formData.prenom} onChange={handleChange('prenom')} error={errors.prenom} placeholder={t.firstname_placeholder} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input label="N° de Passeport" id="numeroPiece" required value={formData.numeroPiece} onChange={(e) => { handleChange('numeroPiece')(e); setFormData(f => ({ ...f, nin: e.target.value })); }} error={errors.numeroPiece} placeholder="Ex: A12345678" />
                <Select label={t.id_type} id="typePiece" required value={formData.typePiece} onChange={handleChange('typePiece')} options={Object.values(t.id_types)} placeholder={t.choose} error={errors.typePiece} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Select label="Pays d'émission" id="pays" value={formData.pays} onChange={handleChange('pays')} options={PAYS_OPTIONS} icon={Globe} />
                <Input label="Date d'expiration" id="dateExpiration" type="date" value={formData.dateExpiration} onChange={handleChange('dateExpiration')} icon={CalendarDays} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input label={t.birth_date} id="dateNaissance" type="date" value={formData.dateNaissance} onChange={handleChange('dateNaissance')} icon={Calendar} />
                <Select label="Sexe" id="sexe" value={formData.sexe} onChange={handleChange('sexe')} options={[{ value: 'M', label: 'Masculin' }, { value: 'F', label: 'Féminin' }]} placeholder="Non renseigné" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Lieu de naissance" id="lieuNaissance" value={formData.lieuNaissance} onChange={handleChange('lieuNaissance')} icon={MapPin} placeholder="Lieu" />
                <Input label="Numéro de Téléphone" id="telephone" value={formData.telephone} onChange={handleChange('telephone')} icon={Phone} placeholder="Ex: +221 77 123 45 67" />
              </div>
            </div>
          )}

          {/* PERMIS DE CONDUIRE */}
          {docCategory === 'LICENSE' && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="grid grid-cols-2 gap-4">
                <Input label={t.name} id="nom" required value={formData.nom} onChange={handleChange('nom')} error={errors.nom} placeholder="NOM" />
                <Input label={t.firstname} id="prenom" required value={formData.prenom} onChange={handleChange('prenom')} error={errors.prenom} placeholder={t.firstname_placeholder} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input label="N° Permis de Conduire" id="numeroPiece" required value={formData.numeroPiece} onChange={handleChange('numeroPiece')} error={errors.numeroPiece} placeholder="Ex: 12345678" />
                <Select label={t.id_type} id="typePiece" required value={formData.typePiece} onChange={handleChange('typePiece')} options={Object.values(t.id_types)} placeholder={t.choose} error={errors.typePiece} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Catégories Permis" id="categoriesPermis" value={formData.categoriesPermis || ''} onChange={handleChange('categoriesPermis')} placeholder="Ex: B, C" />
                <Select label="Pays d'émission" id="pays" value={formData.pays} onChange={handleChange('pays')} options={PAYS_OPTIONS} icon={Globe} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Date de délivrance" id="dateDelivrance" type="date" value={formData.dateDelivrance} onChange={handleChange('dateDelivrance')} icon={CalendarDays} />
                <Input label="Date d'expiration" id="dateExpiration" type="date" value={formData.dateExpiration} onChange={handleChange('dateExpiration')} icon={CalendarDays} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Centre / Lieu de délivrance" id="centreEnregistrement" value={formData.centreEnregistrement} onChange={handleChange('centreEnregistrement')} icon={Home} placeholder="Centre d'enregistrement" />
                <Input label="Numéro de Téléphone" id="telephone" value={formData.telephone} onChange={handleChange('telephone')} icon={Phone} placeholder="Ex: +221 77 123 45 67" />
              </div>
            </div>
          )}

          {/* CARTE CONSULAIRE / SÉJOUR */}
          {docCategory === 'CONSULAR' && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="grid grid-cols-2 gap-4">
                <Input label={t.name} id="nom" required value={formData.nom} onChange={handleChange('nom')} error={errors.nom} placeholder="NOM" />
                <Input label={t.firstname} id="prenom" required value={formData.prenom} onChange={handleChange('prenom')} error={errors.prenom} placeholder={t.firstname_placeholder} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input label={`N° ${activeDocType}`} id="numeroPiece" required value={formData.numeroPiece} onChange={handleChange('numeroPiece')} error={errors.numeroPiece} placeholder="N° Document..." />
                <Select label={t.id_type} id="typePiece" required value={formData.typePiece} onChange={handleChange('typePiece')} options={Object.values(t.id_types)} placeholder={t.choose} error={errors.typePiece} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Select label="Pays d'origine / Émission" id="pays" value={formData.pays} onChange={handleChange('pays')} options={PAYS_OPTIONS} icon={Globe} />
                <Input label="NIN / Code Identité" id="nin" value={formData.nin} onChange={handleChange('nin')} icon={CreditCard} placeholder="NIN / Code Consulaire..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input label={t.birth_date} id="dateNaissance" type="date" value={formData.dateNaissance} onChange={handleChange('dateNaissance')} icon={Calendar} />
                <Select label="Sexe" id="sexe" value={formData.sexe} onChange={handleChange('sexe')} options={[{ value: 'M', label: 'Masculin' }, { value: 'F', label: 'Féminin' }]} placeholder="Non renseigné" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Date de délivrance" id="dateDelivrance" type="date" value={formData.dateDelivrance} onChange={handleChange('dateDelivrance')} icon={CalendarDays} />
                <Input label="Date d'expiration" id="dateExpiration" type="date" value={formData.dateExpiration} onChange={handleChange('dateExpiration')} icon={CalendarDays} />
              </div>
              <Input label="Ambassade / Centre" id="centreEnregistrement" value={formData.centreEnregistrement} onChange={handleChange('centreEnregistrement')} icon={Home} placeholder="Ambassade / Consulat" />
              <Input label="Adresse domicile" id="adresseDomicile" value={formData.adresseDomicile} onChange={handleChange('adresseDomicile')} icon={MapPinned} placeholder="Adresse domicile" />
              <Input label="Numéro de Téléphone" id="telephone" value={formData.telephone} onChange={handleChange('telephone')} icon={Phone} placeholder="Ex: +221 77 123 45 67" />
            </div>
          )}

          {/* CARTE GRISE */}
          {docCategory === 'CARTE_GRISE' && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="grid grid-cols-2 gap-4">
                <Input label="Plaque d'Immatriculation" id="immatriculation" required value={formData.immatriculation || formData.numeroPiece} onChange={(e) => { handleChange('immatriculation')(e); handleChange('numeroPiece')(e); }} error={errors.numeroPiece} placeholder="Ex: DK-1234-AB" className="uppercase font-mono" />
                <Select label={t.id_type} id="typePiece" required value={formData.typePiece} onChange={handleChange('typePiece')} options={Object.values(t.id_types)} placeholder={t.choose} error={errors.typePiece} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input label={t.brand} id="marque" value={formData.marque || ''} onChange={handleChange('marque')} placeholder="Toyota..." />
                <Input label={t.model} id="modele" value={formData.modele || ''} onChange={handleChange('modele')} placeholder="Hilux..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input label={t.color} id="couleur" value={formData.couleur || ''} onChange={handleChange('couleur')} placeholder="Gris..." />
                <Select label="Type Véhicule" id="typeVehicule" value={formData.typeVehicule || ''} onChange={handleChange('typeVehicule')} options={['Berline', 'SUV / 4x4', 'Pick-up', 'Camion', 'Moto', 'Bus', 'Autre']} placeholder="Choisir..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Nom Titulaire" id="nom" value={formData.nom} onChange={handleChange('nom')} placeholder="NOM" />
                <Input label="Prénom Titulaire" id="prenom" value={formData.prenom} onChange={handleChange('prenom')} placeholder="Prénom" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Centre d'immatriculation" id="centreEnregistrement" value={formData.centreEnregistrement} onChange={handleChange('centreEnregistrement')} icon={Home} placeholder="Centre..." />
                <Input label="Téléphone Conducteur" id="telephone" value={formData.telephone} onChange={handleChange('telephone')} icon={Phone} placeholder="Ex: +221 77 123 45 67" />
              </div>
            </div>
          )}

          {/* CNI / DEFAULT */}
          {docCategory === 'CNI' && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="grid grid-cols-2 gap-4">
                <Input label={t.name} id="nom" required value={formData.nom} onChange={handleChange('nom')} error={errors.nom} placeholder="NOM" />
                <Input label={t.firstname} id="prenom" required value={formData.prenom} onChange={handleChange('prenom')} error={errors.prenom} placeholder={t.firstname_placeholder} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input label={t.id_number} id="numeroPiece" required value={formData.numeroPiece} onChange={handleChange('numeroPiece')} error={errors.numeroPiece} placeholder={t.number_placeholder} />
                <Select label={t.id_type} id="typePiece" required value={formData.typePiece} onChange={handleChange('typePiece')} options={Object.values(t.id_types)} placeholder={t.choose} error={errors.typePiece} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Select label="Pays d'émission" id="pays" value={formData.pays} onChange={handleChange('pays')} options={PAYS_OPTIONS} icon={Globe} />
                <Input label={t.birth_date} id="dateNaissance" type="date" value={formData.dateNaissance} onChange={handleChange('dateNaissance')} icon={Calendar} />
              </div>

              <div className="space-y-4 border-t border-slate-200 dark:border-slate-700 pt-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-2 ml-1">
                  <FileText size={14} /> Infos complémentaires CNI
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <Select label="Sexe" id="sexe" value={formData.sexe} onChange={handleChange('sexe')} options={[{ value: 'M', label: 'Masculin' }, { value: 'F', label: 'Féminin' }]} placeholder="Non renseigné" />
                  <Input label="Taille (cm)" id="taille" type="number" value={formData.taille} onChange={handleChange('taille')} icon={Ruler} placeholder="Taille" />
                </div>
                <Input label="Lieu de naissance" id="lieuNaissance" value={formData.lieuNaissance} onChange={handleChange('lieuNaissance')} icon={MapPin} placeholder="Lieu de naissance" />
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Date de délivrance" id="dateDelivrance" type="date" value={formData.dateDelivrance} onChange={handleChange('dateDelivrance')} icon={CalendarDays} />
                  <Input label="Date d'expiration" id="dateExpiration" type="date" value={formData.dateExpiration} onChange={handleChange('dateExpiration')} icon={CalendarDays} />
                </div>
                <Input label="Numéro de Téléphone" id="telephone" value={formData.telephone} onChange={handleChange('telephone')} icon={Phone} placeholder="Ex: +221 77 123 45 67" />
                <Input label="Centre d'enregistrement" id="centreEnregistrement" value={formData.centreEnregistrement} onChange={handleChange('centreEnregistrement')} icon={Home} placeholder="Centre d'enregistrement" />
                <Input label="Adresse du domicile" id="adresseDomicile" value={formData.adresseDomicile} onChange={handleChange('adresseDomicile')} icon={MapPinned} placeholder="Adresse domicile" />
              </div>
            </div>
          )}
        </div>

        {/* Destination */}
        <div className="space-y-4">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-2 ml-1">
            <Building2 size={14} /> {t.destination}
          </p>
          <Input label={t.host_name} id="personneVisitee" required value={formData.personneVisitee} onChange={handleChange('personneVisitee')} error={errors.personneVisitee} icon={User} placeholder={t.host_placeholder} />
          <div className="grid grid-cols-2 gap-4">
            <Select label={t.service_dept} id="service" required value={formData.service} onChange={handleChange('service')} options={servicesList} placeholder={t.select} error={errors.service} icon={Building2} />
            <Input label={t.visit_reason} id="motif" required value={formData.motif} onChange={handleChange('motif')} placeholder={t.reason_placeholder} />
          </div>
        </div>

        {/* Date / Heure */}
        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-4 flex justify-around items-center">
          <div className="flex items-center gap-2">
            <Calendar size={14} className="text-slate-400" />
            <span className="text-xs font-black text-slate-800 dark:text-slate-200">{formData.date}</span>
          </div>
          <div className="w-px h-4 bg-slate-200 dark:bg-slate-800" />
          <div className="flex items-center gap-2">
            <Clock size={14} className="text-slate-400" />
            <span className="text-xs font-black text-slate-800 dark:text-slate-200">{formData.heureEntree}</span>
          </div>
        </div>

        {/* Boutons */}
        <div className="flex gap-3 pt-2">
          <Btn variant="secondary" onClick={onCancel} fullWidth className="!rounded-lg">{t.cancel}</Btn>
          <Btn variant="success" type="submit" icon={CheckCircle2} fullWidth className="!rounded-lg" loading={loading}>{t.validate_entry}</Btn>
        </div>
      </form>

      {/* Modal ScanPanel */}
      <Modal isOpen={showScan} onClose={() => setShowScan(false)} title={`${t.scan_btn} – ${t.id_card}`} size="md">
        <div className="h-[560px] max-h-[92vh]">
          <ScanPanel mode="person" onDataExtracted={handleOcrData} onClose={() => setShowScan(false)} />
        </div>
      </Modal>
    </>
  );
}
