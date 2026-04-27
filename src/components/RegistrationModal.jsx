import { useState } from 'react';
import {
  User, Car, CreditCard, Building, 
  Clock, Calendar, Camera, CheckCircle2, 
  ChevronRight} from 'lucide-react';
import { FormInput, FormSelect, Btn, Modal } from './UI';
import { ScanPanel } from './Scanner';
import { SERVICES, TYPES_PIECE, TYPES_VEHICULE } from '../data/mockData';
import { useApp } from '../context/AppContext';

/* ============================================
   FORMULAIRE VISITEUR (personne)
============================================ */
function PersonForm({ initial = {}, onSubmit, onCancel }) {
  const now = new Date();
  const [form, setForm] = useState({
    nom: initial.nom || '',
    prenom: initial.prenom || '',
    numeroPiece: initial.numeroPiece || '',
    typePiece: initial.typePiece || '',
    dateNaissance: initial.dateNaissance || '',
    personneVisitee: initial.personneVisitee || '',
    service: initial.service || '',
    profession: initial.profession || '',
    adresse: initial.adresse || '',
    heureEntree: now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    date: now.toLocaleDateString('fr-FR'),
    ...initial,
  });
  const [errors, setErrors] = useState({});
  const [scanOpen, setScanOpen] = useState(false);
  const [docImage, setDocImage] = useState(initial.docImage || null);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const validate = () => {
    const e = {};
    if (!form.nom.trim()) e.nom = 'Champ obligatoire';
    if (!form.prenom.trim()) e.prenom = 'Champ obligatoire';
    if (!form.numeroPiece.trim()) e.numeroPiece = 'Champ obligatoire';
    if (!form.typePiece) e.typePiece = 'Sélectionnez un type';
    if (!form.personneVisitee.trim()) e.personneVisitee = 'Champ obligatoire';
    if (!form.service) e.service = 'Sélectionnez un service';
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
                {docImage ? 'Pièce d\'identité scannée' : 'Scan rapide'}
              </p>
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tighter leading-none mt-1">
                {docImage ? 'Champs remplis par OCR' : 'Remplissage auto via caméra'}
              </p>
            </div>
          </div>
          <Btn variant="primary" size="sm" icon={Camera} onClick={() => setScanOpen(true)} type="button">
            {docImage ? 'Rescanner' : 'Scanner'}
          </Btn>
        </div>

        {/* Données OCR */}
        <div className="space-y-4">
          <p className="text-[10px] font-black text-slate-400 dark:text-slate-200 uppercase tracking-widest flex items-center gap-2 mb-2 ml-1">
            <CreditCard size={14} /> Document d'identité
          </p>
          <div className="grid grid-cols-2 gap-4">
            <FormInput label="Nom" id="nom" required value={form.nom} onChange={set('nom')} error={errors.nom} placeholder="NOM" />
            <FormInput label="Prénom" id="prenom" required value={form.prenom} onChange={set('prenom')} error={errors.prenom} placeholder="Prénom" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormInput label="N° de pièce" id="numeroPiece" required value={form.numeroPiece} onChange={set('numeroPiece')} error={errors.numeroPiece} placeholder="Numéro..." />
            <FormSelect label="Type de pièce" id="typePiece" required value={form.typePiece} onChange={set('typePiece')} options={TYPES_PIECE} placeholder="Choisir..." error={errors.typePiece} />
          </div>
          <FormInput label="Date de naissance" id="dateNaissance" type="date" value={form.dateNaissance} onChange={set('dateNaissance')} icon={Calendar} />
        </div>

        {/* Détails visite */}
        <div className="space-y-4">
          <p className="text-[10px] font-black text-slate-400 dark:text-slate-200 uppercase tracking-widest flex items-center gap-2 mb-2 ml-1">
            <Building size={14} /> Destination
          </p>
          <div className="flex flex-col gap-4">
            <FormInput label="Personne visitée" id="personneVisitee" required value={form.personneVisitee} onChange={set('personneVisitee')} error={errors.personneVisitee} icon={User} placeholder="Nom de l'hôte" />
            <FormSelect label="Service / Département" id="service" required value={form.service} onChange={set('service')} options={SERVICES} placeholder="Sélectionner..." error={errors.service} icon={Building} />
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
          <Btn variant="secondary" onClick={onCancel} fullWidth className="!rounded-lg">Annuler</Btn>
          <Btn variant="success" type="submit" icon={CheckCircle2} fullWidth className="!rounded-lg">Valider l'entrée</Btn>
        </div>
      </form>

      <Modal isOpen={scanOpen} onClose={() => setScanOpen(false)} title="Scan – Pièce d'identité" size="md">
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
function VehiculeForm({ initial = {}, onSubmit, onCancel }) {
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
    heureEntree: now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    date: now.toLocaleDateString('fr-FR'),
    ...initial,
  });
  const [errors, setErrors] = useState({});
  const [scanOpen, setScanOpen] = useState(false);
  const [docImage, setDocImage] = useState(null);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const validate = () => {
    const e = {};
    if (!form.immatriculation.trim()) e.immatriculation = 'Champ obligatoire';
    if (!form.typeVehicule) e.typeVehicule = 'Sélectionnez un type';
    if (!form.personneVisitee.trim()) e.personneVisitee = 'Champ obligatoire';
    if (!form.service) e.service = 'Sélectionnez un service';
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
        typePiece: 'Carte Grise',
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
                {docImage ? 'Carte grise scannée' : 'Scan rapide'}
              </p>
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tighter leading-none mt-1">Extraction auto d'immatriculation</p>
            </div>
          </div>
          <Btn variant="success" size="sm" icon={Camera} onClick={() => setScanOpen(true)} type="button">
            {docImage ? 'Rescanner' : 'Scanner'}
          </Btn>
        </div>

        {/* Infos véhicule */}
        <div className="space-y-4">
          <p className="text-[10px] font-black text-slate-400 dark:text-slate-200 uppercase tracking-widest flex items-center gap-2 mb-2 ml-1">
            <Car size={14} /> Véhicule
          </p>
          <div className="flex flex-col gap-4">
            <FormInput label="Plaque d'immatriculation" id="immatriculation" required value={form.immatriculation} onChange={set('immatriculation')} error={errors.immatriculation} placeholder="Ex: 1234 AB 01" className="uppercase font-mono" />
            <div className="grid grid-cols-2 gap-4">
              <FormInput label="Marque" id="marque" value={form.marque} onChange={set('marque')} placeholder="Toyota..." />
              <FormInput label="Modèle" id="modele" value={form.modele} onChange={set('modele')} placeholder="Hilux..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormInput label="Couleur" id="couleur" value={form.couleur} onChange={set('couleur')} placeholder="Gris..." />
              <FormSelect label="Type" id="typeVehicule" required value={form.typeVehicule} onChange={set('typeVehicule')} options={TYPES_VEHICULE} placeholder="Choisir..." error={errors.typeVehicule} />
            </div>
          </div>
        </div>

        {/* Conducteur */}
        <div className="space-y-4">
          <p className="text-[10px] font-black text-slate-400 dark:text-slate-200 uppercase tracking-widest flex items-center gap-2 mb-2 ml-1">
            <User size={14} /> Conducteur
          </p>
          <div className="grid grid-cols-2 gap-4">
            <FormInput label="Nom" id="nomConducteur" value={form.nom} onChange={set('nom')} placeholder="Conducteur" />
            <FormInput label="Prénom" id="prenomConducteur" value={form.prenom} onChange={set('prenom')} placeholder="Prénom" />
          </div>
        </div>

        {/* Détails visite */}
        <div className="space-y-4">
          <p className="text-[10px] font-black text-slate-400 dark:text-slate-200 uppercase tracking-widest flex items-center gap-2 mb-2 ml-1">
            <Building size={14} /> Destination
          </p>
          <div className="flex flex-col gap-4">
            <FormInput label="Personne / Bureau" id="personneVisiteeCar" required value={form.personneVisitee} onChange={set('personneVisitee')} error={errors.personneVisitee} icon={User} placeholder="Destination finale" />
            <FormSelect label="Service" id="serviceCar" required value={form.service} onChange={set('service')} options={SERVICES} placeholder="Sélectionner..." error={errors.service} icon={Building} />
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
          <Btn variant="secondary" onClick={onCancel} fullWidth className="!rounded-lg">Annuler</Btn>
          <Btn variant="success" type="submit" icon={CheckCircle2} fullWidth className="!rounded-lg">Valider l'entrée</Btn>
        </div>
      </form>

      <Modal isOpen={scanOpen} onClose={() => setScanOpen(false)} title="Scan – Carte grise" size="md">
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
  const { dispatch, notify } = useApp();
  const [mode, setMode] = useState(null); // null | 'person' | 'vehicule'

  const handleSubmit = (data) => {
    dispatch({ type: 'ADD_VISITOR', payload: data });
    notify('success', `${data.type === 'vehicule' ? 'Véhicule' : 'Visiteur'} enregistré avec succès !`);
    setMode(null);
    onClose();
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
        mode === 'person' ? 'Enregistrer un visiteur' :
        mode === 'vehicule' ? 'Enregistrer un véhicule' :
        'Nouvelle entrée'
      }
      size="md"
    >
      {!mode ? (
        <div className="flex flex-col gap-3 py-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="text-center mb-2">
            <h3 className="text-base font-black text-slate-900 dark:text-white">Nouvelle entrée</h3>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
              Quel type d'entrée souhaitez-vous enregistrer ?
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
              <h4 className="text-sm font-black text-slate-900 dark:text-white leading-tight">Personne physique</h4>
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter mt-1 opacity-70 group-hover:opacity-100">CNI, PASSEPORT, PERMIS...</p>
            </div>
            <ChevronRight className="text-slate-300 group-hover:text-brand-blue-bright group-hover:translate-x-1 transition-all" size={16} />
          </button>

          <button
            onClick={() => setMode('vehicule')}
            className="group relative p-4 rounded-xl border-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-brand-green-bright/30 hover:bg-brand-green-light/5 dark:hover:bg-brand-green-bright/5 transition-all duration-300 flex items-center gap-4 text-left shadow-sm active:scale-[0.98]"
          >
            <div className="w-12 h-12 rounded-lg bg-brand-green-light text-brand-green-bright flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Car size={24} />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-black text-slate-900 dark:text-white leading-tight">Véhicule</h4>
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter mt-1 opacity-70 group-hover:opacity-100">CARTE GRISE, IMMATRICULATION...</p>
            </div>
            <ChevronRight className="text-slate-300 group-hover:text-brand-green-bright group-hover:translate-x-1 transition-all" size={16} />
          </button>
        </div>
      ) : mode === 'person' ? (
        <PersonForm onSubmit={handleSubmit} onCancel={() => setMode(null)} />
      ) : (
        <VehiculeForm onSubmit={handleSubmit} onCancel={() => setMode(null)} />
      )}
    </Modal>
  );
}
