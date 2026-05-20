import { useState } from 'react';
import {
  User, Car, CreditCard, Building,
  Clock, Calendar, Camera, CheckCircle2,
  ChevronRight, FileText, Ruler, MapPin, CalendarDays, Home, MapPinned
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
    dateNaissance: initial.dateNaissance || '',
    sexe: initial.sexe || '',
    taille: initial.taille || '',
    lieuNaissance: initial.lieuNaissance || '',
    numeroPiece: initial.numeroPiece || '',
    typePiece: initial.typePiece || '',
    dateDelivrance: initial.dateDelivrance || '',
    dateExpiration: initial.dateExpiration || '',
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

  // ✅ Correction : mapping direct des clés camelCase renvoyées par le backend
  const handleScanData = (data, img) => {
    const scanTime = new Date();
    setDocImage(img);
    setForm(prev => ({
      ...prev,
      nom: data.nom ?? prev.nom,
      prenom: data.prenom ?? prev.prenom,
      numeroPiece: data.numeroPiece ?? prev.numeroPiece,
      typePiece: data.typePiece ? normalizeTypePiece(data.typePiece) : prev.typePiece,
      dateNaissance: data.dateNaissance ?? prev.dateNaissance,
      sexe: data.sexe ?? prev.sexe,
      taille: data.taille ?? prev.taille,
      lieuNaissance: data.lieuNaissance ?? prev.lieuNaissance,
      dateDelivrance: data.dateDelivrance ?? prev.dateDelivrance,
      dateExpiration: data.dateExpiration ?? prev.dateExpiration,
      centreEnregistrement: data.centreEnregistrement ?? prev.centreEnregistrement,
      adresseDomicile: data.adresseDomicile ?? prev.adresseDomicile,
      profession: data.profession ?? prev.profession,
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
          <FormInput label="Centre d'enregistrement" id="centreEnregistrement" value={form.centreEnregistrement} onChange={set('centreEnregistrement')} icon={Home} placeholder="Centre d'enregistrement" />
          <FormInput label="Adresse du domicile" id="adresseDomicile" value={form.adresseDomicile} onChange={set('adresseDomicile')} icon={MapPinned} placeholder="Adresse domicile" />
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
        <div className="h-[560px]">
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
        <div className="h-[560px]">
          <ScanPanel mode="vehicule" onDataExtracted={handleScanData} onClose={() => setScanOpen(false)} />
        </div>
      </Modal>
    </>
  );
}

// ========== MODAL D’ENREGISTREMENT ==========
export function RegistrationModal({ isOpen, onClose }) {
  const { state, dispatch, notify } = useApp();
  const t = TRANSLATIONS[state.settings?.language || 'fr'];
  const [mode, setMode] = useState(null);
  const [loading, setLoading] = useState(false);

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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        mode === 'person' ? t.person_entry :
        mode === 'vehicule' ? t.vehicle_entry :
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
      ) : (
        <VehiculeForm onSubmit={handleSubmit} onCancel={() => setMode(null)} loading={loading} t={t} />
      )}
    </Modal>
  );
}