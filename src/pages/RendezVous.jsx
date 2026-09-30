import { useState, useEffect } from 'react';
import { 
  Calendar, Clock, Plus, Search, Filter, RefreshCw, UserCheck, 
  CheckCircle2, XCircle, AlertCircle, Edit2, Trash2, User, Building2, 
  Phone, Mail, FileText, Check, ArrowRight, ShieldCheck
} from 'lucide-react';
import { useApp } from '../context/useAppState';
import { rdvService } from '../services/rdvService';
import { visitService } from '../services/visitService';
import { departementService } from '../services/departementService';
import { 
  Card, CardHeader, Btn, FormInput, FormSelect, Modal, EmptyState, StatCard 
} from '../components/UI';

export default function RendezVousManagement({ isMobile }) {
  const { notify } = useApp();
  const [rdvList, setRdvList] = useState([]);
  const [departements, setDepartements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('');

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRdv, setEditingRdv] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [checkInConfirmRdv, setCheckInConfirmRdv] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    prenom: '',
    nom: '',
    telephone: '',
    email: '',
    typePiece: 'cni',
    numeroPiece: '',
    personneVisitee: '',
    serviceDepartement: '',
    dateRdv: new Date().toISOString().split('T')[0],
    heureRdv: '10:00',
    motif: 'Rendez-vous professionnel',
    remarques: '',
  });

  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const fetchRdv = async (showToast = false) => {
    if (showToast) setRefreshing(true);
    try {
      const data = await rdvService.getAll();
      setRdvList(data || []);
      if (showToast) notify('success', 'Rendez-vous actualisés avec succès.');
    } catch (err) {
      console.error('Error loading rdv:', err);
      if (showToast) notify('error', 'Erreur lors de l\'actualisation des rendez-vous.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchDepartements = async () => {
    try {
      const res = await departementService.getAll();
      const deps = Array.isArray(res) ? res : (res.departements || res.data || []);
      setDepartements(deps);
    } catch (e) {
      console.warn('Could not load departements:', e);
    }
  };

  useEffect(() => {
    fetchRdv();
    fetchDepartements();
  }, []);

  const openCreateModal = () => {
    setEditingRdv(null);
    setFormData({
      prenom: '',
      nom: '',
      telephone: '',
      email: '',
      typePiece: 'cni',
      numeroPiece: '',
      personneVisitee: '',
      serviceDepartement: departements[0]?.nom || '',
      dateRdv: new Date().toISOString().split('T')[0],
      heureRdv: '10:00',
      motif: 'Rendez-vous professionnel',
      remarques: '',
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (rdv) => {
    setEditingRdv(rdv);
    setFormData({
      prenom: rdv.prenom || '',
      nom: rdv.nom || '',
      telephone: rdv.telephone || '',
      email: rdv.email || '',
      typePiece: rdv.typePiece || 'cni',
      numeroPiece: rdv.numeroPiece || '',
      personneVisitee: rdv.personneVisitee || '',
      serviceDepartement: rdv.serviceDepartement || rdv.departement || '',
      dateRdv: rdv.dateRdv ? rdv.dateRdv.slice(0, 10) : new Date().toISOString().split('T')[0],
      heureRdv: rdv.heureRdv || '10:00',
      motif: rdv.motif || '',
      remarques: rdv.remarques || '',
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.prenom.trim()) errors.prenom = 'Le prénom est obligatoire';
    if (!formData.nom.trim()) errors.nom = 'Le nom est obligatoire';
    if (!formData.telephone.trim()) errors.telephone = 'Le téléphone est obligatoire';
    if (!formData.personneVisitee.trim()) errors.personneVisitee = 'La personne visitée est obligatoire';
    if (!formData.dateRdv) errors.dateRdv = 'La date du RDV est obligatoire';
    if (!formData.heureRdv) errors.heureRdv = 'L\'heure du RDV est obligatoire';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      if (editingRdv) {
        const id = editingRdv._id || editingRdv.id;
        await rdvService.update(id, formData);
        notify('success', 'Rendez-vous mis à jour avec succès.');
      } else {
        await rdvService.create(formData);
        notify('success', 'Rendez-vous programmé avec succès.');
      }
      setIsModalOpen(false);
      fetchRdv();
    } catch (err) {
      notify('error', err.message || 'Erreur lors de l\'enregistrement du rendez-vous.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckIn = async (rdv) => {
    try {
      // 1. Record entry in visitService
      await visitService.recordEntry({
        prenom: rdv.prenom,
        nom: rdv.nom,
        telephone: rdv.telephone,
        email: rdv.email,
        typePiece: rdv.typePiece,
        numeroPiece: rdv.numeroPiece,
        personneVisitee: rdv.personneVisitee,
        serviceDepartement: rdv.serviceDepartement,
        motifVisite: `[RDV Programmé] ${rdv.motif || ''}`,
        statut: 'present',
      });

      // 2. Mark RDV status as ARRIVE
      await rdvService.checkIn(rdv);
      notify('success', `Entrée validée pour ${rdv.prenom} ${rdv.nom} !`);
      setCheckInConfirmRdv(null);
      fetchRdv();
    } catch (err) {
      notify('error', err.message || 'Erreur lors de la validation de l\'entrée.');
    }
  };

  const handleCancelRdv = async (rdv) => {
    const id = rdv._id || rdv.id;
    try {
      await rdvService.update(id, { statut: 'ANNULE' });
      notify('info', 'Rendez-vous annulé.');
      fetchRdv();
    } catch (err) {
      notify('error', 'Erreur lors de l\'annulation.');
    }
  };

  const handleDelete = async (id) => {
    try {
      await rdvService.delete(id);
      notify('success', 'Rendez-vous supprimé.');
      setDeleteConfirmId(null);
      fetchRdv();
    } catch (err) {
      notify('error', 'Erreur lors de la suppression.');
    }
  };

  // Filtered List
  const filteredRdv = rdvList.filter(item => {
    const q = search.toLowerCase().trim();
    const matchesSearch = !q || (
      (item.prenom || '').toLowerCase().includes(q) ||
      (item.nom || '').toLowerCase().includes(q) ||
      (item.telephone || '').toLowerCase().includes(q) ||
      (item.email || '').toLowerCase().includes(q) ||
      (item.personneVisitee || '').toLowerCase().includes(q) ||
      (item.serviceDepartement || '').toLowerCase().includes(q) ||
      (item.numeroPiece || '').toLowerCase().includes(q)
    );

    const matchesStatus = statusFilter === 'ALL' || item.statut === statusFilter;
    const matchesDate = !dateFilter || (item.dateRdv && item.dateRdv.startsWith(dateFilter));

    return matchesSearch && matchesStatus && matchesDate;
  });

  // Stats
  const totalRdv = rdvList.length;
  const programmedCount = rdvList.filter(r => r.statut === 'PROGRAMME' || !r.statut).length;
  const confirmedCount = rdvList.filter(r => r.statut === 'CONFIRME').length;
  const arrivedCount = rdvList.filter(r => r.statut === 'ARRIVE').length;
  const cancelledCount = rdvList.filter(r => r.statut === 'ANNULE').length;

  const renderStatusBadge = (statut) => {
    switch (statut) {
      case 'CONFIRME':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            <CheckCircle2 size={12} /> Confirmé
          </span>
        );
      case 'ARRIVE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <UserCheck size={12} className="animate-pulse" /> Sur Place / Entré
          </span>
        );
      case 'ANNULE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            <XCircle size={12} /> Annulé
          </span>
        );
      case 'PROGRAMME':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <Clock size={12} /> Programmé
          </span>
        );
    }
  };

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-brand-blue-bright/10 text-brand-blue-bright border border-brand-blue-bright/20">
              <Calendar size={24} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Gestion des Rendez-vous
              </h1>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                Planification des visites attendues et conversion en entrées réelles
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Btn 
            variant="secondary" 
            icon={RefreshCw} 
            onClick={() => fetchRdv(true)} 
            loading={refreshing}
            size="md"
          >
            Actualiser
          </Btn>

          <Btn 
            variant="primary" 
            icon={Plus} 
            onClick={openCreateModal}
            size="md"
            className="shadow-lg shadow-brand-blue-bright/20"
          >
            Nouveau Rendez-vous
          </Btn>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <StatCard 
          label="Total RDV" 
          value={totalRdv} 
          icon={Calendar} 
          bg="rgba(59, 130, 246, 0.1)" 
          color="#3B82F6" 
        />
        <StatCard 
          label="Programmés" 
          value={programmedCount} 
          icon={Clock} 
          bg="rgba(245, 158, 11, 0.1)" 
          color="#F59E0B" 
        />
        <StatCard 
          label="Confirmés" 
          value={confirmedCount} 
          icon={CheckCircle2} 
          bg="rgba(99, 102, 241, 0.1)" 
          color="#6366F1" 
        />
        <StatCard 
          label="Visites Effectuées" 
          value={arrivedCount} 
          icon={UserCheck} 
          bg="rgba(16, 185, 129, 0.1)" 
          color="#10B981" 
        />
        <StatCard 
          label="Annulés" 
          value={cancelledCount} 
          icon={XCircle} 
          bg="rgba(244, 63, 94, 0.1)" 
          color="#F43F5E" 
        />
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative flex-1 w-full">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Rechercher par prénom, nom, téléphone, hôte, service..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-xs font-bold text-slate-900 dark:text-slate-100 outline-none focus:border-brand-blue-bright transition-all"
            />
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 w-full md:w-auto">
            {/* Status Selector */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2.5 text-xs font-bold text-slate-900 dark:text-slate-100 outline-none focus:border-brand-blue-bright"
            >
              <option value="ALL">Tous les statuts</option>
              <option value="PROGRAMME">Programmés</option>
              <option value="CONFIRME">Confirmés</option>
              <option value="ARRIVE">Arrivés / Visites</option>
              <option value="ANNULE">Annulés</option>
            </select>

            {/* Date Filter */}
            <input 
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs font-bold text-slate-900 dark:text-slate-100 outline-none focus:border-brand-blue-bright"
            />

            {(search || statusFilter !== 'ALL' || dateFilter) && (
              <Btn 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  setSearch('');
                  setStatusFilter('ALL');
                  setDateFilter('');
                }}
              >
                Réinitialiser
              </Btn>
            )}
          </div>
        </div>
      </Card>

      {/* Main Content List / Table */}
      <Card>
        <CardHeader 
          title={`Rendez-vous programmés (${filteredRdv.length})`}
          subtitle="Consultez les rendez-vous et enregistrez directement les entrées des visiteurs à leur arrivée."
          icon={Calendar}
        />

        {loading ? (
          <div className="p-12 text-center text-slate-400 font-bold text-sm">
            Chargement des rendez-vous en cours...
          </div>
        ) : filteredRdv.length === 0 ? (
          <EmptyState 
            icon={Calendar}
            title="Aucun rendez-vous trouvé"
            description={search || statusFilter !== 'ALL' || dateFilter 
              ? "Aucun rendez-vous ne correspond à vos critères de recherche." 
              : "Aucun rendez-vous n'est encore programmé."}
            action={
              <Btn variant="primary" icon={Plus} onClick={openCreateModal}>
                Programmer un rendez-vous
              </Btn>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-[10px] font-black uppercase tracking-wider text-slate-400">
                  <th className="p-4">Visiteur</th>
                  <th className="p-4">Date & Heure</th>
                  <th className="p-4">Personne Visitée / Service</th>
                  <th className="p-4">Motif</th>
                  <th className="p-4">Statut</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {filteredRdv.map((rdv) => {
                  const id = rdv._id || rdv.id;
                  const isArrived = rdv.statut === 'ARRIVE';
                  const isCancelled = rdv.statut === 'ANNULE';

                  return (
                    <tr 
                      key={id} 
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Visiteur */}
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-brand-blue-bright/10 text-brand-blue-bright flex items-center justify-center font-black text-xs shrink-0">
                            {(rdv.prenom?.[0] || 'V') + (rdv.nom?.[0] || '')}
                          </div>
                          <div>
                            <p className="font-black text-slate-900 dark:text-white">
                              {rdv.prenom} {rdv.nom}
                            </p>
                            <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                              {rdv.telephone && (
                                <span className="flex items-center gap-1">
                                  <Phone size={10} /> {rdv.telephone}
                                </span>
                              )}
                              {rdv.numeroPiece && (
                                <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono">
                                  {rdv.typePiece?.toUpperCase() || 'CIN'}: {rdv.numeroPiece}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Date & Heure */}
                      <td className="p-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                            <Calendar size={13} className="text-brand-blue-bright" />
                            {rdv.dateRdv ? new Date(rdv.dateRdv).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Maintenant'}
                          </span>
                          <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1 mt-0.5">
                            <Clock size={11} /> {rdv.heureRdv || '10:00'}
                          </span>
                        </div>
                      </td>

                      {/* Personne Visitée / Service */}
                      <td className="p-4">
                        <p className="font-bold text-slate-900 dark:text-white">
                          {rdv.personneVisitee || 'Non spécifié'}
                        </p>
                        <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Building2 size={11} /> {rdv.serviceDepartement || rdv.departement || 'Général'}
                        </p>
                      </td>

                      {/* Motif */}
                      <td className="p-4 max-w-xs">
                        <p className="font-medium text-slate-700 dark:text-slate-300 truncate" title={rdv.motif}>
                          {rdv.motif || 'Rendez-vous'}
                        </p>
                        {rdv.remarques && (
                          <p className="text-[10px] text-slate-400 truncate italic">
                            « {rdv.remarques} »
                          </p>
                        )}
                      </td>

                      {/* Statut */}
                      <td className="p-4">
                        {renderStatusBadge(rdv.statut)}
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {!isArrived && !isCancelled && (
                            <Btn
                              variant="success"
                              size="sm"
                              icon={UserCheck}
                              onClick={() => setCheckInConfirmRdv(rdv)}
                              title="Valider l'arrivée et créer l'entrée dans le registre"
                            >
                              Arrivée / Entrée
                            </Btn>
                          )}

                          {!isCancelled && !isArrived && (
                            <Btn
                              variant="secondary"
                              size="sm"
                              icon={Edit2}
                              onClick={() => openEditModal(rdv)}
                              title="Modifier"
                            />
                          )}

                          {!isCancelled && !isArrived && (
                            <Btn
                              variant="warning"
                              size="sm"
                              icon={XCircle}
                              onClick={() => handleCancelRdv(rdv)}
                              title="Annuler le rendez-vous"
                            />
                          )}

                          <Btn
                            variant="ghost"
                            size="sm"
                            icon={Trash2}
                            onClick={() => setDeleteConfirmId(id)}
                            className="text-rose-500 hover:bg-rose-500/10"
                            title="Supprimer"
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modal Programmer / Modifier Rendez-vous */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingRdv ? 'Modifier le Rendez-vous' : 'Programmer un Nouveau Rendez-vous'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormInput
              label="Prénom"
              required
              placeholder="Prénom du visiteur"
              value={formData.prenom}
              onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
              error={formErrors.prenom}
              icon={User}
            />

            <FormInput
              label="Nom"
              required
              placeholder="Nom du visiteur"
              value={formData.nom}
              onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
              error={formErrors.nom}
              icon={User}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormInput
              label="Numéro de Téléphone"
              required
              placeholder="Ex: 771234567"
              value={formData.telephone}
              onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
              error={formErrors.telephone}
              icon={Phone}
            />

            <FormInput
              label="Adresse Email"
              type="email"
              placeholder="visiteur@exemple.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              icon={Mail}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormSelect
              label="Type de Pièce d'identité"
              value={formData.typePiece}
              onChange={(e) => setFormData({ ...formData, typePiece: e.target.value })}
              options={[
                { value: 'cni', label: 'Carte Nationale d\'Identité (CNI)' },
                { value: 'passport', label: 'Passeport' },
                { value: 'license', label: 'Permis de Conduire' },
                { value: 'residence', label: 'Carte de Séjour' },
                { value: 'other', label: 'Autre Document' },
              ]}
              icon={FileText}
            />

            <FormInput
              label="Numéro de la Pièce / CIN"
              placeholder="N° de la pièce"
              value={formData.numeroPiece}
              onChange={(e) => setFormData({ ...formData, numeroPiece: e.target.value })}
              icon={FileText}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormInput
              label="Personne Visitée (Hôte)"
              required
              placeholder="Nom & Prénom de l'hôte"
              value={formData.personneVisitee}
              onChange={(e) => setFormData({ ...formData, personneVisitee: e.target.value })}
              error={formErrors.personneVisitee}
              icon={User}
            />

            <FormSelect
              label="Service / Département"
              value={formData.serviceDepartement}
              onChange={(e) => setFormData({ ...formData, serviceDepartement: e.target.value })}
              options={
                departements.length > 0
                  ? departements.map(d => ({ value: d.nom, label: d.nom }))
                  : [
                      { value: 'Direction Générale', label: 'Direction Générale' },
                      { value: 'Ressources Humaines', label: 'Ressources Humaines' },
                      { value: 'Informatique & IT', label: 'Informatique & IT' },
                      { value: 'Finances & Comptabilité', label: 'Finances & Comptabilité' },
                      { value: 'Commercial & Ventes', label: 'Commercial & Ventes' },
                      { value: 'Logistique', label: 'Logistique' },
                    ]
              }
              icon={Building2}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormInput
              label="Date du Rendez-vous"
              type="date"
              required
              value={formData.dateRdv}
              onChange={(e) => setFormData({ ...formData, dateRdv: e.target.value })}
              error={formErrors.dateRdv}
              icon={Calendar}
            />

            <FormInput
              label="Heure Prévue"
              type="time"
              required
              value={formData.heureRdv}
              onChange={(e) => setFormData({ ...formData, heureRdv: e.target.value })}
              error={formErrors.heureRdv}
              icon={Clock}
            />
          </div>

          <FormInput
            label="Motif du Rendez-vous"
            placeholder="Ex: Entretien d'embauche, Réunion commerciale..."
            value={formData.motif}
            onChange={(e) => setFormData({ ...formData, motif: e.target.value })}
            icon={FileText}
          />

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-300 uppercase tracking-wider ml-1">
              Remarques / Instructions d'Accès
            </label>
            <textarea
              rows={2}
              placeholder="Instructions particulières, badge réservé..."
              value={formData.remarques}
              onChange={(e) => setFormData({ ...formData, remarques: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-xs font-bold text-slate-900 dark:text-slate-100 outline-none focus:border-brand-blue-bright"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Btn variant="ghost" onClick={() => setIsModalOpen(false)}>
              Annuler
            </Btn>
            <Btn variant="primary" type="submit" loading={submitting} icon={Check}>
              {editingRdv ? 'Mettre à jour' : 'Enregistrer le Rendez-vous'}
            </Btn>
          </div>
        </form>
      </Modal>

      {/* Modal Confirmation Check-in (Entrée) */}
      <Modal
        isOpen={Boolean(checkInConfirmRdv)}
        onClose={() => setCheckInConfirmRdv(null)}
        title="Enregistrer l'entrée du Visiteur"
        size="sm"
      >
        {checkInConfirmRdv && (
          <div className="space-y-4">
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center">
              <UserCheck size={36} className="mx-auto text-emerald-500 mb-2 animate-bounce" />
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                {checkInConfirmRdv.prenom} {checkInConfirmRdv.nom}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Le visiteur est arrivé pour son RDV avec <strong className="text-slate-800 dark:text-slate-200">{checkInConfirmRdv.personneVisitee}</strong> ({checkInConfirmRdv.serviceDepartement}).
              </p>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 text-center">
              En confirmant, ce rendez-vous passera au statut <strong className="text-emerald-500">SUR PLACE</strong> et une nouvelle entrée sera ajoutée automatiquement dans le registre actif.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Btn variant="ghost" onClick={() => setCheckInConfirmRdv(null)}>
                Annuler
              </Btn>
              <Btn 
                variant="success" 
                icon={CheckCircle2} 
                onClick={() => handleCheckIn(checkInConfirmRdv)}
              >
                Valider l'entrée sur site
              </Btn>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Confirmation Suppression */}
      <Modal
        isOpen={Boolean(deleteConfirmId)}
        onClose={() => setDeleteConfirmId(null)}
        title="Supprimer le Rendez-vous"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Voulez-vous vraiment supprimer définitivement ce rendez-vous ? Cette action est irréversible.
          </p>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Btn variant="ghost" onClick={() => setDeleteConfirmId(null)}>
              Annuler
            </Btn>
            <Btn 
              variant="danger" 
              icon={Trash2} 
              onClick={() => handleDelete(deleteConfirmId)}
            >
              Supprimer
            </Btn>
          </div>
        </div>
      </Modal>
    </div>
  );
}
