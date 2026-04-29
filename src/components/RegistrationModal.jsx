import { useState } from 'react';
import {
  User, Car, CreditCard, Building, 
  Clock, Calendar, Camera, CheckCircle2, 
  ChevronRight} from 'lucide-react';
import { FormInput, FormSelect, Btn, Modal } from './UI';
import { ScanPanel } from './Scanner';
import { SERVICES, TYPES_PIECE, TYPES_VEHICULE } from '../data/mockData';
import { useApp } from '../context/useAppState';
import { visitorService } from '../services/visitorService';
import { visitService } from '../services/visitService';
import { TRANSLATIONS } from '../translations';

/* ============================================
   FORMULAIRE VISITEUR (personne)
============================================ */
function PersonForm({ initial = {}, onSubmit, onCancel, loading, t }) {
  const now = new Date();
  const [form, setForm] = useState({
    nom: initial.nom || '',
    prenom: initial.prenom || '',
    numeroPiece: initial.numeroPiece || '',
    typePiece: initial.typePiece || '',
    dateNaissance: initial.dateNaissance || '',
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
    if (validate()) onSubmit({ ...form, type: 'person', statut: 'present', heureSortie: null, photo: docImage });
  };

  const handleScanData = (data, img) => {
    setDocImage(img);
    setForm(prev => ({
      ...prev,
      nom: data.nom || prev.nom,
      prenom: data.prenom || prev.prenom,
      numeroPiece: data.numeroPiece || prev.numeroPiece,
      dateNaissance: data.dateNaissance || prev.dateNaissance,
      profession: data.profession || prev.profession,
      adresse: data.adresse || prev.adresse,
    }));
    setScanOpen(false);
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Scan quick button */}
        <div className="bg-gradient-to-r from-brand-blue-light/20 to-brand-green-light/20 dark:from-brand-blue-bright/10 dark:to-brand-green-bright/10 border-2 border-brand-blue-bright/20 rounded-xl p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {docImage
              ? <div className="w-12 h-9 rounded-lg overflow-hidden border-2 border-brand-green-bright"><img src={docImage} alt="doc" className="w-full h-full object-cover" /></div>
              : <div className="w-12 h-9 rounded-lg bg-white/50 dark:bg-slate-800 flex items-center justify-center"><CreditCard size={20} className="text-brand-blue-bright" /></div>
            }
            <div>
              <p className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
                {docImage ? <CheckCircle2 size={16} className="text-brand-green-bright" /> : <Camera size={16} className="text-brand-blue-bright" />}
                {docImage ? t.scan_id_done : t.scan_quick}
              </p>
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tighter leading-none mt-1">
                {docImage ? t.scan_id_desc : t.scan_id_desc}
              </p>
            </div>
          </div>
          <Btn variant="primary" size="sm" icon={Camera} onClick={() => setScanOpen(true)} type="button">
            {docImage ? t.rescan_btn : t.scan_btn}
          </Btn>
        </div>

        {/* Données OCR */}
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

        {/* Détails visite */}
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

        {/* Auto-fields Info */}
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
          <Btn variant="secondary" onClick={onCancel} fullWidth className="!rounded-lg">{t.cancel}</Btn>
          <Btn variant="success" type="submit" icon={CheckCircle2} fullWidth className="!rounded-lg" loading={loading}>{t.validate_entry}</Btn>
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

/* ============================================
   FORMULAIRE VÉHICULE
============================================ */
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
        type: 'vehicule',
        statut: 'present',
        heureSortie: null,
        nom: form.nom,
        prenom: form.prenom,
        typePiece: t.id_types.carte_grise,
        personneVisitee: form.personneVisitee,
        service: form.service,
        heureEntree: form.heureEntree,
        date: form.date,
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
    setDocImage(img);
    setForm(prev => ({
      ...prev,
      immatriculation: data.immatriculation || prev.immatriculation,
      marque: data.marque || prev.marque,
      modele: data.modele || prev.modele,
      couleur: data.couleur || prev.couleur,
      typeVehicule: data.typeVehicule || prev.typeVehicule,
      nom: data.nom || prev.nom,
      prenom: data.prenom || prev.prenom,
    }));
    setScanOpen(false);
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Scan button */}
        <div className="bg-gradient-to-r from-brand-green-light/20 to-brand-blue-light/20 dark:from-brand-green-bright/10 dark:to-brand-blue-bright/10 border-2 border-brand-green-bright/20 rounded-xl p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {docImage
              ? <div className="w-12 h-9 rounded-lg overflow-hidden border-2 border-brand-green-bright"><img src={docImage} alt="carte grise" className="w-full h-full object-cover" /></div>
              : <div className="w-12 h-9 rounded-lg bg-white/50 dark:bg-slate-800 flex items-center justify-center"><Car size={20} className="text-brand-green-bright" /></div>
            }
            <div>
              <p className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
                {docImage ? <CheckCircle2 size={16} className="text-brand-green-bright" /> : <Camera size={16} className="text-brand-green-bright" />}
                {docImage ? t.license_plate : t.scan_quick}
              </p>
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tighter leading-none mt-1">{t.scan_id_desc}</p>
            </div>
          </div>
          <Btn variant="success" size="sm" icon={Camera} onClick={() => setScanOpen(true)} type="button">
            {docImage ? t.rescan_btn : t.scan_btn}
          </Btn>
        </div>

        {/* Infos véhicule */}
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

        {/* Conducteur */}
        <div className="space-y-4">
          <p className="text-[10px] font-black text-slate-400 dark:text-slate-200 uppercase tracking-widest flex items-center gap-2 mb-2 ml-1">
            <User size={14} /> {t.driver}
          </p>
          <div className="grid grid-cols-2 gap-4">
            <FormInput label={t.name} id="nomConducteur" value={form.nom} onChange={set('nom')} placeholder={t.driver} />
            <FormInput label={t.firstname} id="prenomConducteur" value={form.prenom} onChange={set('prenom')} placeholder={t.firstname_placeholder} />
          </div>
        </div>

        {/* Détails visite */}
        <div className="space-y-4">
          <p className="text-[10px] font-black text-slate-400 dark:text-slate-200 uppercase tracking-widest flex items-center gap-2 mb-2 ml-1">
            <Building size={14} /> {t.destination}
          </p>
          <div className="flex flex-col gap-4">
            <FormInput label={t.host_name} id="personneVisiteeCar" required value={form.personneVisitee} onChange={set('personneVisitee')} error={errors.personneVisitee} icon={User} placeholder={t.host_placeholder} />
            <FormSelect label={t.service_dept} id="serviceCar" required value={form.service} onChange={set('service')} options={SERVICES} placeholder={t.select} error={errors.service} icon={Building} />
          </div>
        </div>

        {/* Auto-fields Info */}
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
          <Btn variant="secondary" onClick={onCancel} fullWidth className="!rounded-lg">{t.cancel}</Btn>
          <Btn variant="success" type="submit" icon={CheckCircle2} fullWidth className="!rounded-lg" loading={loading}>{t.validate_entry}</Btn>
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

/* ============================================
   COMPOSANT PRINCIPAL – RegistrationModal
============================================ */
export function RegistrationModal({ isOpen, onClose }) {
  const { state, dispatch, notify } = useApp();
  const { settings } = state;
  const t = TRANSLATIONS[settings?.language || 'fr'];
  const [mode, setMode] = useState(null); // null | 'person' | 'vehicule'
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data) => {
    setLoading(true);
    try {
      const visitorResponse = await visitorService.create({
        nom: data.nom,
        prenom: data.prenom,
        numeroPiece: data.numeroPiece,
        typePiece: data.typePiece,
        dateNaissance: data.dateNaissance
      });

      const visitorId = visitorResponse.visiteur?.id || visitorResponse.id;

      await visitService.recordEntry({
        visiteurId: visitorId,
        personneVisitee: data.personneVisitee,
        service: data.service,
        motif: data.motif || t.standard_visit
      });

      notify('success', t.welcome);
      dispatch({ type: 'ADD_VISITOR', payload: { ...data, id: visitorId } });
      setMode(null);
      onClose();
    } catch (err) {
      notify('error', `${t.error_prefix}: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setMode(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={
        mode === 'person' ? t.person_entry :
        mode === 'vehicule' ? t.vehicle_entry :
        t.new_entry_title
      }
      size="md"
    >
      {!mode ? (
        <div className="flex flex-col gap-3 py-2 animate-in fade-in slide-in-from-bottom-4 duration-500" dir={settings?.language === 'ar' ? 'rtl' : 'ltr'}>
          <div className="text-center mb-2">
            <h3 className="text-base font-black text-slate-900 dark:text-white">{t.new_entry_title}</h3>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
              {t.choose_type}
            </p>
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
            <ChevronRight className={`text-slate-300 group-hover:text-brand-blue-bright transition-all ${settings?.language === 'ar' ? 'rotate-180 group-hover:-translate-x-1' : 'group-hover:translate-x-1'}`} size={16} />
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
            <ChevronRight className={`text-slate-300 group-hover:text-brand-green-bright transition-all ${settings?.language === 'ar' ? 'rotate-180 group-hover:-translate-x-1' : 'group-hover:translate-x-1'}`} size={16} />
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

