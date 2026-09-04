import { useState, useEffect } from 'react';
import {
  User, Car, CreditCard, Building,
  Clock, Calendar, Camera, CheckCircle2,
  ChevronRight, FileText, Ruler, MapPin, CalendarDays, Home, MapPinned, Phone, Search, UserX
} from 'lucide-react';
import { FormInput, FormSelect, Btn, Modal } from './UI';
import { ScanPanel } from './ScanPanel';
import { SERVICES } from '../data/mockData';
import { useApp } from '../context/useAppState';
import { visitorService } from '../services/visitorService';
import { visitService } from '../services/visitService';
import { TRANSLATIONS } from '../translations';

const normalizeTypePiece = (value) => {
  if (!value) return 'CNI';
  const mapping = {
    'Carte Nationale d\'Identité': 'CNI',
    "Carte Nationale d'Identité": 'CNI',
    'Carte Nationale d’Identité': 'CNI',
    'CNI': 'CNI',
    'Passeport': 'PASSEPORT',
    'PASSEPORT': 'PASSEPORT',
    'Permis de conduire': 'PERMIS',
    'PERMIS': 'PERMIS',
    'Carte de séjour': 'CARTE_SEJOUR',
    'CARTE_SEJOUR': 'CARTE_SEJOUR',
    'CARTE_IDENTITE_CEDEAO': 'CARTE_IDENTITE_CEDEAO',
  };
  return mapping[value] || 'CNI';
};

// ========== FORMULAIRE PERSONNE ==========
function PersonForm({ initial = {}, onSubmit, onCancel, loading, t }) {
  const now = new Date();
  const [form, setForm] = useState({
    nom: initial.nom || '',
    prenom: initial.prenom || '',
    nin: initial.nin || '',
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
    heureEntree: now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0'),
    date: now.toLocaleDateString(t.locale || 'fr-FR'),
    ...initial,
  });
  const [errors, setErrors] = useState({});
  const [scanOpen, setScanOpen] = useState(false);
  const [docImage, setDocImage] = useState(initial.docImage || null);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const validate = () => {
    const e = {};
    if (!form.nom.trim()) e.nom = t.required_field;
    if (!form.prenom.trim()) e.prenom = t.required_field;
    if (!form.numeroPiece.trim()) e.numeroPiece = t.required_field;
    if (!form.typePiece) e.typePiece = t.select_type;
    if (!form.personneVisitee.trim()) e.personneVisitee = t.required_field;
    if (!form.service) e.service = t.select_service;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSubmit({ ...form, type: 'person', statut: 'present', heureSortie: null, photo: docImage });
    }
  };

  // ✅ Correction : mapping direct et sécurisé des clés renvoyées par le backend OCR
  const handleScanData = (data, img) => {
    const scanTime = new Date();
    setDocImage(img);
    setForm(prev => ({
      ...prev,
      nom: (data.nom && String(data.nom).trim()) || prev.nom,
      prenom: (data.prenom && String(data.prenom).trim()) || prev.prenom,
      nin: (data.nin && String(data.nin).trim()) || prev.nin,
      numeroPiece: (data.numeroPiece && String(data.numeroPiece).trim()) || prev.numeroPiece,
      typePiece: data.typePiece ? normalizeTypePiece(data.typePiece) : prev.typePiece,
      dateNaissance: (data.dateNaissance && String(data.dateNaissance).trim()) || prev.dateNaissance,
      sexe: (data.sexe && String(data.sexe).trim()) || prev.sexe,
      taille: (data.taille && String(data.taille).trim()) || prev.taille,
      lieuNaissance: (data.lieuNaissance && String(data.lieuNaissance).trim()) || prev.lieuNaissance,
      dateDelivrance: (data.dateDelivrance && String(data.dateDelivrance).trim()) || prev.dateDelivrance,
      dateExpiration: (data.dateExpiration && String(data.dateExpiration).trim()) || prev.dateExpiration,
      telephone: (data.telephone && String(data.telephone).trim()) || prev.telephone,
      centreEnregistrement: (data.centreEnregistrement && String(data.centreEnregistrement).trim()) || prev.centreEnregistrement,
      adresseDomicile: (data.adresseDomicile && String(data.adresseDomicile).trim()) || prev.adresseDomicile,
      profession: (data.profession && String(data.profession).trim()) || prev.profession,
      heureEntree: scanTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      date: scanTime.toLocaleDateString('fr-FR'),
    }));
    setScanOpen(false);
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
                {docImage ? <CheckCircle2 size={16} className="text-brand-green-bright" /> : <Camera size={16} className="text-brand-blue-bright" />}
                {docImage ? t.scan_id_done : t.scan_quick}
              </p>
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tighter leading-none mt-1">
                {t.scan_id_desc}
              </p>
            </div>
          </div>
          <Btn variant="primary" size="sm" icon={Camera} onClick={() => setScanOpen(true)} type="button">
            {docImage ? t.rescan_btn : t.scan_btn}
          </Btn>
        </div>

        {/* Identité */}
        <div className="space-y-4">
          <p className="text-[10px] font-black text-slate-400 dark:text-slate-200 uppercase tracking-widest flex items-center gap-2 mb-2 ml-1">
            <CreditCard size={14} /> {t.id_doc}
          </p>
          <div className="grid grid-cols-2 gap-4">
            <FormInput label={t.name} id="nom" required value={form.nom} onChange={set('nom')} error={errors.nom} placeholder="NOM" />
            <FormInput label={t.firstname} id="prenom" required value={form.prenom} onChange={set('prenom')} error={errors.prenom} placeholder={t.firstname_placeholder} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormInput label={t.id_number} id="numeroPiece" required value={form.numeroPiece} onChange={set('numeroPiece')} error={errors.numeroPiece} placeholder={t.number_placeholder} />
            <FormSelect
              label={t.id_type}
              id="typePiece"
              required
              value={form.typePiece}
              onChange={set('typePiece')}
              options={Object.values(t.id_types)}
              placeholder={t.choose}
              error={errors.typePiece}
            />
          </div>
          <FormInput label={t.birth_date} id="dateNaissance" type="date" value={form.dateNaissance} onChange={set('dateNaissance')} icon={Calendar} />
        </div>

        {/* Infos complémentaires (carte d’identité) */}
        <div className="space-y-4 border-t border-slate-200 dark:border-slate-700 pt-4">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-2 ml-1">
            <FileText size={14} /> Informations détaillées (carte d'identité)
          </p>
          <div className="grid grid-cols-2 gap-4">
            <FormSelect
              label="Sexe"
              id="sexe"
              value={form.sexe}
              onChange={set('sexe')}
              options={[{ value: 'M', label: 'Masculin' }, { value: 'F', label: 'Féminin' }]}
              placeholder="Non renseigné"
            />
            <FormInput label="Taille (cm)" id="taille" type="number" value={form.taille} onChange={set('taille')} icon={Ruler} placeholder="Taille" />
          </div>
          <FormInput label="Lieu de naissance" id="lieuNaissance" value={form.lieuNaissance} onChange={set('lieuNaissance')} icon={MapPin} placeholder="Lieu de naissance" />
          <div className="grid grid-cols-2 gap-4">
            <FormInput label="Date de délivrance" id="dateDelivrance" type="date" value={form.dateDelivrance} onChange={set('dateDelivrance')} icon={CalendarDays} />
            <FormInput label="Date d'expiration" id="dateExpiration" type="date" value={form.dateExpiration} onChange={set('dateExpiration')} icon={CalendarDays} />
          </div>
          <FormInput label="Numéro de Téléphone" id="telephone" value={form.telephone} onChange={set('telephone')} icon={Phone} placeholder="Ex: +221 77 123 45 67" />
          <FormInput label="Centre d'enregistrement" id="centreEnregistrement" value={form.centreEnregistrement} onChange={set('centreEnregistrement')} icon={Home} placeholder="Centre d'enregistrement" />
          <FormInput label="Adresse du domicile" id="adresseDomicile" value={form.adresseDomicile} onChange={set('adresseDomicile')} icon={MapPinned} placeholder="Adresse domicile" />
          <FormInput label="NIN (Numéro d'Identification Nationale)" id="nin" value={form.nin} onChange={set('nin')} icon={CreditCard} placeholder="Ex: 1 890 1999 12345" />
        </div>

        {/* Destination */}
        <div className="space-y-4">
          <p className="text-[10px] font-black text-slate-400 dark:text-slate-200 uppercase tracking-widest flex items-center gap-2 mb-2 ml-1">
            <Building size={14} /> {t.destination}
          </p>
          <div className="flex flex-col gap-4">
            <FormInput label={t.host_name} id="personneVisitee" required value={form.personneVisitee} onChange={set('personneVisitee')} error={errors.personneVisitee} icon={User} placeholder={t.host_placeholder} />
            <div className="grid grid-cols-2 gap-4">
              <FormSelect label={t.service_dept} id="service" required value={form.service} onChange={set('service')} options={SERVICES} placeholder={t.select} error={errors.service} icon={Building} />
              <FormInput label={t.visit_reason} id="motif" required value={form.motif} onChange={set('motif')} placeholder={t.reason_placeholder} />
            </div>
          </div>
        </div>

        {/* Date / Heure */}
        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-4 flex justify-around items-center">
          <div className="flex items-center gap-2">
            <Calendar size={14} className="text-slate-400" />
            <span className="text-xs font-black text-slate-800 dark:text-slate-200">{form.date}</span>
          </div>
          <div className="w-px h-4 bg-slate-200 dark:bg-slate-800" />
          <div className="flex items-center gap-2">
            <Clock size={14} className="text-slate-400" />
            <span className="text-xs font-black text-slate-800 dark:text-slate-200">{form.heureEntree}</span>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Btn variant="secondary" onClick={onCancel} fullWidth>{t.cancel}</Btn>
          <Btn variant="success" type="submit" icon={CheckCircle2} fullWidth loading={loading}>{t.validate_entry}</Btn>
        </div>
      </form>

      <Modal isOpen={scanOpen} onClose={() => setScanOpen(false)} title={`${t.scan_btn} – ${t.id_card}`} size="md">
        <div className="h-[400px] max-h-[92vh] md:h-[560px] md:max-h-[92vh]">
          <ScanPanel mode="person" onDataExtracted={handleScanData} onClose={() => setScanOpen(false)} />
        </div>
      </Modal>
    </>
  );
}

// ========== FORMULAIRE VÉHICULE ==========
function VehiculeForm({ initial = {}, onSubmit, onCancel, loading, t }) {
  const now = new Date();
  const [form, setForm] = useState({
    nom: initial.nom || '',
    prenom: initial.prenom || '',
    immatriculation: initial.immatriculation || '',
    marque: initial.marque || '',
    modele: initial.modele || '',
    couleur: initial.couleur || '',
    typeVehicule: initial.typeVehicule || '',
    personneVisitee: initial.personneVisitee || '',
    service: initial.service || '',
    heureEntree: now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0'),
    date: now.toLocaleDateString(t.locale || 'fr-FR'),
    ...initial,
  });
  const [errors, setErrors] = useState({});
  const [scanOpen, setScanOpen] = useState(false);
  const [docImage, setDocImage] = useState(null);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const validate = () => {
    const e = {};
    if (!form.immatriculation.trim()) e.immatriculation = t.required_field;
    if (!form.typeVehicule) e.typeVehicule = t.select_type;
    if (!form.personneVisitee.trim()) e.personneVisitee = t.required_field;
    if (!form.service) e.service = t.select_service;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSubmit({
        ...form,
        type: 'vehicule',
        statut: 'present',
        heureSortie: null,
        typePiece: 'Carte Grise',
        numeroPiece: form.immatriculation,
        vehicule: {
          immatriculation: form.immatriculation,
          marque: form.marque,
          modele: form.modele,
          couleur: form.couleur,
          typeVehicule: form.typeVehicule,
        },
        photo: docImage,
      });
    }
  };

  const handleScanData = (data, img) => {
    const scanTime = new Date();
    setDocImage(img);
    setForm(prev => ({
      ...prev,
      immatriculation: data.numeroPiece ?? prev.immatriculation,
      marque: data.marque ?? prev.marque,
      modele: data.modele ?? prev.modele,
      couleur: data.couleur ?? prev.couleur,
      typeVehicule: data.typeVehicule ?? prev.typeVehicule,
      nom: data.nom ?? prev.nom,
      prenom: data.prenom ?? prev.prenom,
      heureEntree: scanTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      date: scanTime.toLocaleDateString('fr-FR'),
    }));
    setScanOpen(false);
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="bg-gradient-to-r from-brand-green-light/20 to-brand-blue-light/20 dark:from-brand-green-bright/10 dark:to-brand-blue-bright/10 border-2 border-brand-green-bright/20 rounded-xl p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {docImage ? (
              <div className="w-12 h-9 rounded-lg overflow-hidden border-2 border-brand-green-bright">
                <img src={docImage} alt="carte grise" className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-12 h-9 rounded-lg bg-white/50 dark:bg-slate-800 flex items-center justify-center">
                <Car size={20} className="text-brand-green-bright" />
              </div>
            )}
            <div>
              <p className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
                {docImage ? <CheckCircle2 size={16} className="text-brand-green-bright" /> : <Camera size={16} className="text-brand-green-bright" />}
                {docImage ? t.license_plate : t.scan_quick}
              </p>
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tighter leading-none mt-1">
                {t.scan_id_desc}
              </p>
            </div>
          </div>
          <Btn variant="success" size="sm" icon={Camera} onClick={() => setScanOpen(true)} type="button">
            {docImage ? t.rescan_btn : t.scan_btn}
          </Btn>
        </div>

        <div className="space-y-4">
          <p className="text-[10px] font-black text-slate-400 dark:text-slate-200 uppercase tracking-widest flex items-center gap-2 mb-2 ml-1">
            <Car size={14} /> {t.vehicle_info}
          </p>
          <div className="flex flex-col gap-4">
            <FormInput label={t.plate_number} id="immatriculation" required value={form.immatriculation} onChange={set('immatriculation')} error={errors.immatriculation} placeholder="Ex: 1234 AB 01" className="uppercase font-mono" />
            <div className="grid grid-cols-2 gap-4">
              <FormInput label={t.brand} id="marque" value={form.marque} onChange={set('marque')} placeholder="Toyota..." />
              <FormInput label={t.model} id="modele" value={form.modele} onChange={set('modele')} placeholder="Hilux..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormInput label={t.color} id="couleur" value={form.couleur} onChange={set('couleur')} placeholder="Gris..." />
              <FormSelect
                label={t.id_type}
                id="typeVehicule"
                required
                value={form.typeVehicule}
                onChange={set('typeVehicule')}
                options={Object.values(t.vehicle_types)}
                placeholder={t.choose}
                error={errors.typeVehicule}
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-[10px] font-black text-slate-400 dark:text-slate-200 uppercase tracking-widest flex items-center gap-2 mb-2 ml-1">
            <User size={14} /> {t.driver}
          </p>
          <div className="grid grid-cols-2 gap-4">
            <FormInput label={t.name} id="nomConducteur" value={form.nom} onChange={set('nom')} placeholder={t.driver} />
            <FormInput label={t.firstname} id="prenomConducteur" value={form.prenom} onChange={set('prenom')} placeholder={t.firstname_placeholder} />
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-[10px] font-black text-slate-400 dark:text-slate-200 uppercase tracking-widest flex items-center gap-2 mb-2 ml-1">
            <Building size={14} /> {t.destination}
          </p>
          <div className="flex flex-col gap-4">
            <FormInput label={t.host_name} id="personneVisiteeCar" required value={form.personneVisitee} onChange={set('personneVisitee')} error={errors.personneVisitee} icon={User} placeholder={t.host_placeholder} />
            <FormSelect label={t.service_dept} id="serviceCar" required value={form.service} onChange={set('service')} options={SERVICES} placeholder={t.select} error={errors.service} icon={Building} />
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-4 flex justify-around items-center">
          <div className="flex items-center gap-2">
            <Calendar size={14} className="text-slate-400" />
            <span className="text-xs font-black text-slate-800 dark:text-slate-200">{form.date}</span>
          </div>
          <div className="w-px h-4 bg-slate-200 dark:bg-slate-800" />
          <div className="flex items-center gap-2">
            <Clock size={14} className="text-slate-400" />
            <span className="text-xs font-black text-slate-800 dark:text-slate-200">{form.heureEntree}</span>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Btn variant="secondary" onClick={onCancel} fullWidth>{t.cancel}</Btn>
          <Btn variant="success" type="submit" icon={CheckCircle2} fullWidth loading={loading}>{t.validate_entry}</Btn>
        </div>
      </form>

      <Modal isOpen={scanOpen} onClose={() => setScanOpen(false)} title={`${t.scan_btn} – ${t.license_plate}`} size="md">
        <div className="h-[560px] max-h-[92vh]">
          <ScanPanel mode="vehicule" onDataExtracted={handleScanData} onClose={() => setScanOpen(false)} />
        </div>
      </Modal>
    </>
  );
}

// ========== FORMULAIRE RECHERCHE PAR TÉLÉPHONE (VISITEUR EXISTANT) ==========
function PhoneSearchForm({ onSelectVisitor, onCancel, t }) {
  const { state } = useApp();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searched, setSearched] = useState(false);
  const [selectedVisitor, setSelectedVisitor] = useState(null);

  const [destinationForm, setDestinationForm] = useState({
    personneVisitee: '',
    service: '',
    motif: '',
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    const query = phoneNumber.trim().toLowerCase();
    if (!query) return;

    setSearching(true);
    setSearched(true);
    setSelectedVisitor(null);

    try {
      const mappedVisitors = new Map();

      // 1. Chercher dans l'état local (visitors)
      state.visitors.forEach(v => {
        const visObj = v.visiteur || v.visitor || v.visiteurId || v;
        const id = visObj._id || visObj.id || v.visiteurId || v._id || v.id;
        const phone = String(visObj.telephone || v.telephone || '').toLowerCase();
        const nom = String(visObj.nom || v.nom || '').toLowerCase();
        const prenom = String(visObj.prenom || v.prenom || '').toLowerCase();
        const piece = String(visObj.numeroPiece || v.numeroPiece || '').toLowerCase();

        if (phone.includes(query) || (query.length >= 3 && (`${nom} ${prenom}`.includes(query) || piece.includes(query)))) {
          if (id && !mappedVisitors.has(id)) {
            mappedVisitors.set(id, {
              _id: id,
              id: id,
              nom: visObj.nom || v.nom || '—',
              prenom: visObj.prenom || v.prenom || '',
              telephone: visObj.telephone || v.telephone || '—',
              numeroPiece: visObj.numeroPiece || v.numeroPiece || '—',
              typePiece: visObj.typePiece || v.typePiece || 'CNI',
              nin: visObj.nin || v.nin || '',
              dateNaissance: visObj.dateNaissance || v.dateNaissance || '',
              sexe: visObj.sexe || v.sexe || '',
              adresseDomicile: visObj.adresseDomicile || v.adresseDomicile || '',
              photo: visObj.photo || v.photo || null,
            });
          }
        }
      });

      // 2. Chercher dans l'API backend
      try {
        const apiRes = await visitorService.search(query);
        const apiList = apiRes?.visiteurs || apiRes?.results || (Array.isArray(apiRes) ? apiRes : []);
        apiList.forEach(vis => {
          const id = vis._id || vis.id;
          if (id && !mappedVisitors.has(id)) {
            mappedVisitors.set(id, vis);
          }
        });
      } catch (err) {
        console.warn("Recherche API téléphone:", err);
      }

      setSearchResults(Array.from(mappedVisitors.values()));
    } catch (err) {
      console.error("Erreur lors de la recherche par téléphone:", err);
    } finally {
      setSearching(false);
    }
  };

  const handleValidateVisit = async (e) => {
    e.preventDefault();
    if (!selectedVisitor) return;

    const eObj = {};
    if (!destinationForm.personneVisitee.trim()) eObj.personneVisitee = t.required_field;
    if (!destinationForm.service) eObj.service = t.select_service;
    setErrors(eObj);
    if (Object.keys(eObj).length > 0) return;

    setSubmitting(true);
    try {
      await onSelectVisitor({
        ...selectedVisitor,
        visiteurId: selectedVisitor._id || selectedVisitor.id,
        personneVisitee: destinationForm.personneVisitee,
        service: destinationForm.service,
        motif: destinationForm.motif || t.standard_visit,
        type: 'person',
        statut: 'present',
        heureSortie: null,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-5 py-1 animate-in fade-in duration-300">
      {/* Explication */}
      <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-500/30 p-4 rounded-xl flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0">
          <Phone size={20} />
        </div>
        <div>
          <h4 className="text-xs font-black text-amber-700 dark:text-amber-300 uppercase tracking-wider">
            Recherche par numéro de téléphone
          </h4>
          <p className="text-[11px] font-bold text-slate-600 dark:text-slate-300 mt-0.5">
            Retrouvez rapidement un visiteur déjà enregistré lors d'une précédente visite sans re-scanner sa pièce.
          </p>
        </div>
      </div>

      {/* Barre de recherche */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Entrez le numéro de téléphone (ex: 77 123 45 67)..."
            value={phoneNumber}
            onChange={e => setPhoneNumber(e.target.value)}
            className="w-full bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 focus:border-amber-500 rounded-xl py-2.5 pl-10 pr-3 text-xs font-bold text-slate-900 dark:text-slate-100 outline-none transition-all"
            autoFocus
          />
        </div>
        <Btn variant="primary" type="submit" loading={searching} icon={Search} className="!rounded-xl bg-amber-600 hover:bg-amber-700 text-white border-none text-xs">
          Rechercher
        </Btn>
      </form>

      {/* Résultats de recherche */}
      {searched && !selectedVisitor && (
        <div className="space-y-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Résultats ({searchResults.length})
          </p>

          {searchResults.length === 0 ? (
            <div className="p-6 bg-slate-50 dark:bg-slate-900/50 rounded-xl text-center border border-slate-100 dark:border-slate-800">
              <UserX className="mx-auto text-slate-400 mb-2" size={32} />
              <p className="text-xs font-bold text-slate-700 dark:text-slate-200">Aucun visiteur trouvé avec ce numéro</p>
              <p className="text-[10px] text-slate-400 mt-1">Vérifiez le numéro ou effectuez un premier enregistrement avec pièce d'identité.</p>
            </div>
          ) : (
            <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
              {searchResults.map(vis => (
                <div
                  key={vis._id || vis.id}
                  onClick={() => setSelectedVisitor(vis)}
                  className="p-3 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 hover:border-amber-500 rounded-xl flex items-center justify-between cursor-pointer transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-600 flex items-center justify-center text-xs font-black shrink-0 overflow-hidden">
                      {vis.photo ? <img src={vis.photo} alt="" className="w-full h-full object-cover" /> : ((vis.prenom?.[0] || '') + (vis.nom?.[0] || 'V')).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-900 dark:text-white group-hover:text-amber-600 transition-colors">
                        {vis.prenom} {vis.nom}
                      </p>
                      <p className="text-[10px] font-mono text-slate-500">
                        {vis.telephone || '—'} · {vis.numeroPiece ? `N° ${vis.numeroPiece}` : ''} {vis.nin ? `(NIN: ${vis.nin})` : ''}
                      </p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-black uppercase rounded-lg group-hover:bg-amber-500 group-hover:text-white transition-all">
                    Sélectionner
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Visiteur Sélectionné & Formulaire Destination */}
      {selectedVisitor && (
        <form onSubmit={handleValidateVisit} className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="p-4 bg-brand-green-light/20 dark:bg-brand-green-bright/10 border-2 border-brand-green-bright/30 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="text-brand-green-bright shrink-0" size={24} />
              <div>
                <p className="text-xs font-black text-brand-green-bright uppercase">Visiteur Sélectionné</p>
                <p className="text-sm font-black text-slate-900 dark:text-white mt-0.5">
                  {selectedVisitor.prenom} {selectedVisitor.nom}
                </p>
                <p className="text-[10px] font-mono text-slate-500">
                  {selectedVisitor.telephone} · {selectedVisitor.numeroPiece}
                </p>
              </div>
            </div>
            <Btn variant="ghost" size="sm" onClick={() => setSelectedVisitor(null)} className="text-[10px] font-black uppercase">
              Changer
            </Btn>
          </div>

          {/* Saisie destination */}
          <div className="space-y-4 pt-2">
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-200 uppercase tracking-widest flex items-center gap-2 ml-1">
              <Building size={14} /> Destination de la visite
            </p>
            <FormInput
              label={t.host_name}
              id="personneVisitee"
              required
              value={destinationForm.personneVisitee}
              onChange={e => setDestinationForm(f => ({ ...f, personneVisitee: e.target.value }))}
              error={errors.personneVisitee}
              icon={User}
              placeholder={t.host_placeholder}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormSelect
                label={t.service_dept}
                id="service"
                required
                value={destinationForm.service}
                onChange={e => setDestinationForm(f => ({ ...f, service: e.target.value }))}
                options={SERVICES}
                placeholder={t.select}
                error={errors.service}
                icon={Building}
              />
              <FormInput
                label={t.visit_reason}
                id="motif"
                required
                value={destinationForm.motif}
                onChange={e => setDestinationForm(f => ({ ...f, motif: e.target.value }))}
                placeholder={t.reason_placeholder}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Btn variant="secondary" onClick={() => setSelectedVisitor(null)} fullWidth>{t.cancel}</Btn>
            <Btn variant="success" type="submit" icon={CheckCircle2} fullWidth loading={submitting}>{t.validate_entry}</Btn>
          </div>
        </form>
      )}

      {!selectedVisitor && (
        <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
          <Btn variant="secondary" onClick={onCancel}>{t.cancel}</Btn>
        </div>
      )}
    </div>
  );
}

export function RegistrationModal({ isOpen, onClose, initialMode = null }) {
  const { state, dispatch, notify } = useApp();
  const t = TRANSLATIONS[state.settings?.language || 'fr'];
  const [mode, setMode] = useState(initialMode);
  const [loading, setLoading] = useState(false);

  // Synchroniser le mode initial lorsque la modal s'ouvre
  useEffect(() => {
    setMode(initialMode);
  }, [isOpen, initialMode]);

  const handleSubmit = async (data) => {
    setLoading(true);
    try {
      const normalizedTypePiece = normalizeTypePiece(data.typePiece);
      console.log('📝 Type pièce normalisé :', normalizedTypePiece);

      const visitorPayload = {
        nom: data.nom,
        prenom: data.prenom,
        numeroPiece: data.numeroPiece,
        typePiece: normalizedTypePiece,
        dateNaissance: data.dateNaissance,
        sexe: data.sexe,
        taille: data.taille,
        lieuNaissance: data.lieuNaissance,
        dateDelivrance: data.dateDelivrance,
        dateExpiration: data.dateExpiration,
        telephone: data.telephone,
        centreEnregistrement: data.centreEnregistrement,
        adresseDomicile: data.adresseDomicile,
        profession: data.profession,
      };

      const visitorResponse = await visitorService.create(visitorPayload);
      console.log('✅ Réponse backend (create) :', visitorResponse);

      const visitorId = visitorResponse.visiteur?._id || visitorResponse._id || visitorResponse.id;
      if (!visitorId) throw new Error('Impossible de récupérer l\'identifiant du visiteur');

      await visitService.recordEntry({
        visiteurId: visitorId,
        personneVisitee: data.personneVisitee,
        service: data.service,
        motif: data.motif || t.standard_visit,
      });

      notify('success', t.welcome);
      dispatch({ type: 'ADD_VISITOR', payload: { ...data, id: visitorId } });
      setMode(null);
      onClose();
    } catch (err) {
      console.error('❌ Erreur dans handleSubmit :', err);
      notify('error', `${t.error_prefix}: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleExistingVisitorSubmit = async (data) => {
    setLoading(true);
    try {
      const visitorId = data.visiteurId || data._id || data.id;
      if (!visitorId) throw new Error('Identifiant du visiteur introuvable');

      await visitService.recordEntry({
        visiteurId: visitorId,
        personneVisitee: data.personneVisitee,
        service: data.service,
        motif: data.motif || t.standard_visit,
      });

      notify('success', `Bienvenue ! Entrée enregistrée pour ${data.prenom || ''} ${data.nom || ''}`);
      dispatch({ type: 'ADD_VISITOR', payload: { ...data, id: visitorId } });
      setMode(null);
      onClose();
    } catch (err) {
      console.error('❌ Erreur entrée visiteur existant :', err);
      notify('error', `${t.error_prefix}: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => { setMode(null); onClose(); }}
      title={
        mode === 'person' ? t.person_entry :
        mode === 'vehicule' ? t.vehicle_entry :
        mode === 'phone_search' ? 'Recherche Visiteur Existant' :
        t.new_entry_title
      }
      size="md"
    >
      {!mode ? (
        <div className="flex flex-col gap-3 py-2 animate-in fade-in slide-in-from-bottom-4 duration-500" dir={state.settings?.language === 'ar' ? 'rtl' : 'ltr'}>
          <div className="text-center mb-2">
            <h3 className="text-base font-black text-slate-900 dark:text-white">{t.new_entry_title}</h3>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">{t.choose_type}</p>
          </div>

          <button
            onClick={() => setMode('person')}
            className="group relative p-4 rounded-xl border-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-brand-blue-bright/30 hover:bg-brand-blue-light/5 dark:hover:bg-brand-blue-bright/5 transition-all duration-300 flex items-center gap-4 text-left shadow-sm active:scale-[0.98]"
          >
            <div className="w-12 h-12 rounded-lg bg-brand-blue-light text-brand-blue-bright flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <User size={24} />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-black text-slate-900 dark:text-white leading-tight">{t.person_physical}</h4>
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter mt-1 opacity-70 group-hover:opacity-100">{t.person_desc}</p>
            </div>
            <ChevronRight className={`text-slate-300 group-hover:text-brand-blue-bright transition-all ${state.settings?.language === 'ar' ? 'rotate-180 group-hover:-translate-x-1' : 'group-hover:translate-x-1'}`} size={16} />
          </button>

          <button
            onClick={() => setMode('phone_search')}
            className="group relative p-4 rounded-xl border-2 border-amber-200 dark:border-amber-900/40 bg-amber-50/40 dark:bg-amber-950/10 hover:border-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/20 transition-all duration-300 flex items-center gap-4 text-left shadow-sm active:scale-[0.98]"
          >
            <div className="w-12 h-12 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Phone size={24} />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-black text-slate-900 dark:text-white leading-tight">Visiteur existant (Téléphone)</h4>
              <p className="text-[9px] font-bold text-amber-600/80 dark:text-amber-400/80 uppercase tracking-tighter mt-1 opacity-80 group-hover:opacity-100">Recherche rapide par numéro si déjà enregistré</p>
            </div>
            <ChevronRight className={`text-slate-300 group-hover:text-amber-500 transition-all ${state.settings?.language === 'ar' ? 'rotate-180 group-hover:-translate-x-1' : 'group-hover:translate-x-1'}`} size={16} />
          </button>

          <button
            onClick={() => setMode('vehicule')}
            className="group relative p-4 rounded-xl border-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-brand-green-bright/30 hover:bg-brand-green-light/5 dark:hover:bg-brand-green-bright/5 transition-all duration-300 flex items-center gap-4 text-left shadow-sm active:scale-[0.98]"
          >
            <div className="w-12 h-12 rounded-lg bg-brand-green-light text-brand-green-bright flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Car size={24} />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-black text-slate-900 dark:text-white leading-tight">{t.vehicle_info}</h4>
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter mt-1 opacity-70 group-hover:opacity-100">{t.vehicle_desc}</p>
            </div>
            <ChevronRight className={`text-slate-300 group-hover:text-brand-green-bright transition-all ${state.settings?.language === 'ar' ? 'rotate-180 group-hover:-translate-x-1' : 'group-hover:translate-x-1'}`} size={16} />
          </button>
        </div>
      ) : mode === 'person' ? (
        <PersonForm onSubmit={handleSubmit} onCancel={() => setMode(null)} loading={loading} t={t} />
      ) : mode === 'phone_search' ? (
        <PhoneSearchForm onSelectVisitor={handleExistingVisitorSubmit} onCancel={() => setMode(null)} t={t} />
      ) : (
        <VehiculeForm onSubmit={handleSubmit} onCancel={() => setMode(null)} loading={loading} t={t} />
      )}
    </Modal>
  );
}
