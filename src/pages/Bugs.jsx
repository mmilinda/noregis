import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useApp } from '../context/useAppState';
import { bugService } from '../services/bugService';
import {
  AlertTriangle, Bug, Plus, Search, CheckCircle2, Clock, Filter, MessageSquare, Send, ShieldAlert, Check, ShieldCheck, ArrowRight, RefreshCw, Building2, User
} from 'lucide-react';
import { Btn, Card, FormInput, FormSelect, StatCard, Modal, EmptyState } from '../components/UI';

const safeStr = (val, fallback = '') => {
  if (!val) return fallback;
  if (typeof val === 'string' || typeof val === 'number') return String(val);
  if (typeof val === 'object') {
    if (val.nom || val.prenom) return `${val.prenom || ''} ${val.nom || ''}`.trim();
    if (val.name) return String(val.name);
    if (val.code) return String(val.code);
    return fallback;
  }
  return fallback;
};

const safeDate = (dateVal, isTime = false) => {
  if (!dateVal) return '';
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return '';
    return isTime 
      ? d.toLocaleString('fr-FR')
      : d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
  } catch (e) {
    return '';
  }
};

export default function BugsManagement() {
  const { state, dispatch, notify } = useApp();
  const location = useLocation();
  const user = state.user || state.agent || {};
  const role = (user.role || '').toUpperCase();
  const isSuperAdmin = role === 'SUPER_ADMIN' || role === 'SUPERADMIN';
  const isAdmin = role === 'ADMIN';

  const [bugs, setBugs] = useState(state.bugs || []);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Sync with global state bugs
  useEffect(() => {
    if (state.bugs && state.bugs.length > 0) {
      setBugs(state.bugs);
    }
  }, [state.bugs]);

  // Keep selectedBug updated when bugs array updates
  const [selectedBug, setSelectedBug] = useState(null);
  useEffect(() => {
    if (selectedBug) {
      const curId = selectedBug._id || selectedBug.id;
      const updated = bugs.find(b => (b._id === curId || b.id === curId));
      if (updated) {
        setSelectedBug(updated);
      }
    }
  }, [bugs]);

  // Auto-open bug modal from URL query parameter (e.g. /bugs?bugId=xxx)
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const targetBugId = searchParams.get('bugId');
    if (targetBugId && bugs.length > 0) {
      const found = bugs.find(b => (b._id === targetBugId || b.id === targetBugId));
      if (found) {
        setSelectedBug(found);
      }
    }
  }, [location.search, bugs]);

  // Filters
  const [filterStatut, setFilterStatut] = useState('');
  const [filterPriorite, setFilterPriorite] = useState('');
  const [searchTerm, setSearchTerm] = useState(state.searchQuery || '');

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New bug form
  const [newBug, setNewBug] = useState({
    titre: '',
    description: '',
    priorite: 'MOYENNE',
  });
  const [creating, setCreating] = useState(false);

  // Response form
  const [responseMsg, setResponseMsg] = useState('');
  const [newStatut, setNewStatut] = useState('');
  const [responding, setResponding] = useState(false);
  const [transmittingId, setTransmittingId] = useState(null);

  // Fetch bugs
  const loadBugs = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);
    try {
      const params = {};
      if (filterStatut) params.statut = filterStatut;
      if (filterPriorite) params.priorite = filterPriorite;

      const res = await bugService.getAll(params);
      const bugsList = res?.bugs || res?.data?.bugs || [];
      if (res?.success || Array.isArray(bugsList)) {
        setBugs(bugsList);
        if (dispatch) dispatch({ type: 'SET_BUGS', payload: bugsList });
      }
    } catch (err) {
      console.error('Erreur chargement bugs:', err);
      notify('error', 'Impossible de charger les signalements de bugs.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filterStatut, filterPriorite, notify, dispatch]);

  useEffect(() => {
    loadBugs();
  }, [loadBugs]);

  // Sync state searchQuery
  useEffect(() => {
    if (state.searchQuery !== undefined) {
      setSearchTerm(state.searchQuery);
    }
  }, [state.searchQuery]);

  // Create bug submission
  const handleCreateBug = async (e) => {
    e.preventDefault();
    if (!newBug.titre.trim() || !newBug.description.trim()) {
      notify('warning', 'Le titre et la description sont requis.');
      return;
    }

    setCreating(true);
    try {
      const res = await bugService.create(newBug);
      if (res?.success || res?.bug) {
        notify('success', 'Le bug a été signalé et transmis au SuperAdmin.');
        setShowCreateModal(false);
        setNewBug({ titre: '', description: '', priorite: 'MOYENNE' });
        loadBugs(true);
      } else {
        notify('error', res?.message || 'Erreur lors de la création du bug.');
      }
    } catch (err) {
      notify('error', err.response?.data?.message || err.message || 'Erreur lors de la création du bug.');
    } finally {
      setCreating(false);
    }
  };

  // Submit response / change status
  const handleSendResponse = async (e) => {
    e.preventDefault();
    if (!selectedBug) return;
    if (!responseMsg.trim() && !newStatut) {
      notify('warning', 'Veuillez saisir une réponse ou modifier le statut.');
      return;
    }

    setResponding(true);
    try {
      const bugId = selectedBug._id || selectedBug.id;
      const res = await bugService.respond(bugId, {
        message: responseMsg.trim(),
        nouveauStatut: newStatut || selectedBug.statut,
      });

      if (res?.success || res?.bug) {
        notify('success', 'Réponse enregistrée avec succès.');
        setResponseMsg('');
        setNewStatut('');
        const updatedBug = res.bug || res.data?.bug;
        if (updatedBug) {
          setSelectedBug(updatedBug);
          if (dispatch) dispatch({ type: 'UPDATE_BUG_REALTIME', payload: updatedBug });
        }
        loadBugs(true);
      } else {
        notify('error', res?.message || 'Erreur lors de l\'envoi de la réponse.');
      }
    } catch (err) {
      notify('error', err.response?.data?.message || err.message || 'Erreur lors de l\'envoi de la réponse.');
    } finally {
      setResponding(false);
    }
  };

  // Transmit to SuperAdmin explicitly
  const handleTransmit = async (bugId, e) => {
    if (e) e.stopPropagation();
    setTransmittingId(bugId);
    try {
      const res = await bugService.transmit(bugId);
      if (res?.success || res?.bug) {
        notify('success', 'Signalement transmis avec succès au SuperAdmin.');
        if (selectedBug && (selectedBug._id === bugId || selectedBug.id === bugId)) {
          if (res.bug) setSelectedBug(res.bug);
        }
        loadBugs(true);
      } else {
        notify('error', res?.message || 'Erreur lors de la transmission.');
      }
    } catch (err) {
      notify('error', err.response?.data?.message || err.message || 'Erreur lors de la transmission.');
    } finally {
      setTransmittingId(null);
    }
  };

  // Filtered bugs search
  const filteredBugs = (bugs || []).filter(b => {
    if (!b) return false;
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const titre = safeStr(b.titre).toLowerCase();
    const desc = safeStr(b.description).toLowerCase();
    const nom = safeStr(b.nomSignaleur).toLowerCase();
    const ent = safeStr(b.entrepriseNom).toLowerCase();
    return titre.includes(term) || desc.includes(term) || nom.includes(term) || ent.includes(term);
  });

  // Stats calculation
  const totalBugs = (bugs || []).filter(Boolean).length;
  const ouvertsCount = (bugs || []).filter(b => b && b.statut === 'OUVERT').length;
  const enCoursCount = (bugs || []).filter(b => b && b.statut === 'EN_COURS').length;
  const resolusCount = (bugs || []).filter(b => b && (b.statut === 'RESOLU' || b.statut === 'FERME')).length;

  // Helper styles for status badges
  const getStatusBadge = (statut) => {
    switch (statut) {
      case 'OUVERT':
        return <span className="px-2.5 py-1 text-[10px] font-black rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center gap-1.5"><Clock size={12} /> Ouvert</span>;
      case 'EN_COURS':
        return <span className="px-2.5 py-1 text-[10px] font-black rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center gap-1.5"><RefreshCw size={12} className="animate-spin" /> En cours</span>;
      case 'RESOLU':
        return <span className="px-2.5 py-1 text-[10px] font-black rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5"><CheckCircle2 size={12} /> Résolu</span>;
      case 'FERME':
        return <span className="px-2.5 py-1 text-[10px] font-black rounded-full bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20 flex items-center gap-1.5"><Check size={12} /> Fermé</span>;
      default:
        return <span className="px-2.5 py-1 text-[10px] font-black rounded-full bg-slate-100 text-slate-600">{statut}</span>;
    }
  };

  const getPriorityBadge = (priorite) => {
    switch (priorite) {
      case 'CRITIQUE':
        return <span className="px-2 py-0.5 text-[9px] font-extrabold uppercase rounded bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30">Critique</span>;
      case 'HAUTE':
        return <span className="px-2 py-0.5 text-[9px] font-extrabold uppercase rounded bg-orange-500/20 text-orange-600 dark:text-orange-400 border border-orange-500/30">Haute</span>;
      case 'MOYENNE':
        return <span className="px-2 py-0.5 text-[9px] font-extrabold uppercase rounded bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30">Moyenne</span>;
      case 'BASSE':
      default:
        return <span className="px-2 py-0.5 text-[9px] font-extrabold uppercase rounded bg-slate-500/20 text-slate-600 dark:text-slate-400 border border-slate-500/30">Basse</span>;
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#161B22] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2.5 bg-red-500/10 text-red-500 rounded-xl">
              <Bug size={24} />
            </div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
              Signalements & Bugs Techniques
            </h1>
          </div>
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
            {isSuperAdmin
              ? 'Centre de réception global — Traitement et réponses directes du SuperAdmin aux signalements des entreprises et agents.'
              : isAdmin
              ? 'Signalement des dysfonctionnements de votre entreprise — Transmis directement au SuperAdmin pour résolution.'
              : 'Signalez tout problème technique ou bug rencontré lors de l\'utilisation du registre.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Btn
            variant="secondary"
            size="md"
            icon={RefreshCw}
            loading={refreshing}
            onClick={() => loadBugs(true)}
          >
            Actualiser
          </Btn>
          <Btn
            variant="danger"
            size="md"
            icon={Plus}
            onClick={() => setShowCreateModal(true)}
          >
            Signaler un bug
          </Btn>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="TOTAL SIGNALEMENTS"
          value={totalBugs}
          icon={Bug}
          color="#6366F1"
          bg="rgba(99, 102, 241, 0.1)"
        />
        <StatCard
          label="OUVERTS / EN ATTENTE"
          value={ouvertsCount}
          icon={Clock}
          color="#F59E0B"
          bg="rgba(245, 158, 11, 0.1)"
        />
        <StatCard
          label="EN COURS DE TRAITEMENT"
          value={enCoursCount}
          icon={RefreshCw}
          color="#3B82F6"
          bg="rgba(59, 130, 246, 0.1)"
        />
        <StatCard
          label="RÉSOLUS & FERMÉS"
          value={resolusCount}
          icon={CheckCircle2}
          color="#10B981"
          bg="rgba(16, 185, 129, 0.1)"
        />
      </div>

      {/* Filters Bar */}
      <Card className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex flex-1 items-center gap-3 w-full">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher par titre, description, signaleur..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg py-2 pl-9 pr-3 text-xs font-bold text-slate-900 dark:text-slate-100 outline-none focus:border-brand-blue-bright"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="w-40">
            <FormSelect
              id="filterStatut"
              value={filterStatut}
              onChange={(e) => setFilterStatut(e.target.value)}
              options={[
                { value: '', label: 'Tous les statuts' },
                { value: 'OUVERT', label: 'Ouvert' },
                { value: 'EN_COURS', label: 'En cours' },
                { value: 'RESOLU', label: 'Résolu' },
                { value: 'FERME', label: 'Fermé' },
              ]}
            />
          </div>

          <div className="w-40">
            <FormSelect
              id="filterPriorite"
              value={filterPriorite}
              onChange={(e) => setFilterPriorite(e.target.value)}
              options={[
                { value: '', label: 'Toutes priorités' },
                { value: 'CRITIQUE', label: 'Critique' },
                { value: 'HAUTE', label: 'Haute' },
                { value: 'MOYENNE', label: 'Moyenne' },
                { value: 'BASSE', label: 'Basse' },
              ]}
            />
          </div>
        </div>
      </Card>

      {/* Bugs Grid / List */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 flex flex-col items-center gap-3">
          <RefreshCw size={32} className="animate-spin text-brand-blue-bright" />
          <p className="text-xs font-bold">Chargement des signalements de bugs...</p>
        </div>
      ) : filteredBugs.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="Aucun bug trouvé"
          description="Aucun signalement de bug ne correspond à vos critères actuels."
          action={
            <Btn variant="danger" size="md" icon={Plus} onClick={() => setShowCreateModal(true)}>
              Signaler un nouveau bug
            </Btn>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBugs.map((bug) => {
            const reponsesArr = Array.isArray(bug.reponses) ? bug.reponses : [];
            const hasSuperAdminResponse = bug.reponduPar === 'SUPER_ADMIN' || (bug.reponseSuperAdmin && bug.reponseSuperAdmin.trim() !== '') || reponsesArr.some(r => r && (r.roleAuteur === 'SUPER_ADMIN' || r.roleAuteur === 'SUPERADMIN'));
            const hasAdminResponse = !hasSuperAdminResponse && (bug.reponduPar === 'ADMIN' || (bug.reponseAdmin && bug.reponseAdmin.trim() !== '') || reponsesArr.some(r => r && r.roleAuteur === 'ADMIN'));
            return (
              <Card
                key={bug._id}
                className="p-5 flex flex-col justify-between border-slate-200 dark:border-slate-800 hover:border-brand-blue-bright/40 transition-all cursor-pointer group shadow-sm hover:shadow-md"
                onClick={() => setSelectedBug(bug)}
              >
                <div className="space-y-3">
                  {/* Top Header badges */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {getPriorityBadge(bug.priorite)}
                      {getStatusBadge(bug.statut)}
                    </div>
                    <span className="text-[10px] font-bold text-slate-400">
                      {safeDate(bug.createdAt)}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-sm font-black text-slate-900 dark:text-white group-hover:text-brand-blue-bright transition-colors line-clamp-1">
                    {safeStr(bug.titre, 'Signalement technique')}
                  </h3>

                  {/* Description preview */}
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 font-medium">
                    {safeStr(bug.description)}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
                  {/* Reporter and Enterprise info */}
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
                    <div className="flex items-center gap-1.5 truncate">
                      <User size={13} className="text-slate-400 shrink-0" />
                      <span className="truncate text-slate-700 dark:text-slate-300">{safeStr(bug.nomSignaleur, 'Anonyme')}</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 uppercase font-black">
                        {safeStr(bug.roleSignaleur, 'AGENT')}
                      </span>
                    </div>

                    {bug.entrepriseNom && (
                      <div className="flex items-center gap-1 text-[10px] text-brand-blue-bright font-black truncate max-w-[120px]">
                        <Building2 size={12} className="shrink-0" />
                        <span className="truncate">{safeStr(bug.entrepriseNom)}</span>
                      </div>
                    )}
                  </div>

                  {/* Status Indicator Bar / SuperAdmin vs Admin response badge */}
                  <div className="flex items-center justify-between pt-1">
                    {hasSuperAdminResponse ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-600 dark:text-emerald-400">
                        <ShieldCheck size={13} /> Répondu par SuperAdmin
                      </span>
                    ) : hasAdminResponse ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-black text-blue-600 dark:text-blue-400">
                        <ShieldCheck size={13} /> Répondu par Admin
                      </span>
                    ) : bug.statut !== 'OUVERT' ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-black text-slate-600 dark:text-slate-400">
                        <CheckCircle2 size={13} /> Traité par Admin
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-500">
                        <Clock size={12} /> En attente de réponse
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedBug(bug);
                      }}
                      className="text-xs font-black text-brand-blue-bright hover:text-blue-600 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
                    >
                      Consulter & Répondre <ArrowRight size={13} />
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal 1: Create Bug */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Signaler un bug ou problème technique"
        size="md"
      >
        <form onSubmit={handleCreateBug} className="space-y-4">
          <FormInput
            label="Titre du problème"
            id="titre"
            placeholder="Ex: Erreur lors de la validation du scan de CIN"
            value={newBug.titre}
            onChange={(e) => setNewBug({ ...newBug, titre: e.target.value })}
            required
          />

          <FormSelect
            label="Niveau de priorité"
            id="priorite"
            value={newBug.priorite}
            onChange={(e) => setNewBug({ ...newBug, priorite: e.target.value })}
            options={[
              { value: 'BASSE', label: 'Basse — Problème mineur d\'affichage' },
              { value: 'MOYENNE', label: 'Moyenne — Fonctionnalité perturbée' },
              { value: 'HAUTE', label: 'Haute — Blocage partiel d\'un processus' },
              { value: 'CRITIQUE', label: 'Critique — Panne complète ou blocage total' },
            ]}
          />

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-300 uppercase tracking-wider ml-1">
              Description détaillée du bug *
            </label>
            <textarea
              rows={5}
              placeholder="Expliquez en détail l'erreur rencontrée, les étapes pour la reproduire, et le résultat attendu..."
              value={newBug.description}
              onChange={(e) => setNewBug({ ...newBug, description: e.target.value })}
              required
              className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-lg p-3 text-xs font-bold text-slate-900 dark:text-slate-100 outline-none focus:border-brand-blue-bright"
            />
          </div>

          <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-bold flex items-start gap-2">
            <ShieldAlert size={16} className="shrink-0 mt-0.5" />
            <p>
              Ce signalement sera directement transmis au <strong>SuperAdmin</strong> et sera également visible par les administrateurs de votre organisation.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <Btn variant="secondary" onClick={() => setShowCreateModal(false)}>
              Annuler
            </Btn>
            <Btn variant="danger" type="submit" loading={creating} icon={Send}>
              Envoyer le signalement
            </Btn>
          </div>
        </form>
      </Modal>

      {/* Modal 2: View Bug Details & Response Thread */}
      {selectedBug && (
        <Modal
          isOpen={!!selectedBug}
          onClose={() => setSelectedBug(null)}
          title={`Detail du bug: ${safeStr(selectedBug.titre)}`}
          size="lg"
        >
          <div className="space-y-6">
            {/* Header info card */}
            <div className="bg-slate-50 dark:bg-slate-900/80 p-5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  {getPriorityBadge(selectedBug.priorite)}
                  {getStatusBadge(selectedBug.statut)}
                  {selectedBug.transmisAuSuperAdmin && (
                    <span className="px-2 py-0.5 text-[9px] font-black uppercase rounded bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 flex items-center gap-1">
                      <ShieldCheck size={11} /> Transmis SuperAdmin
                    </span>
                  )}
                </div>

                <span className="text-xs font-bold text-slate-400">
                  Signalé le {safeDate(selectedBug.createdAt, true)}
                </span>
              </div>

              <div>
                <h2 className="text-base font-black text-slate-900 dark:text-white mb-2">
                  {safeStr(selectedBug.titre)}
                </h2>
                <p className="text-xs font-medium text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                  {safeStr(selectedBug.description)}
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-500">
                <div>
                  <span className="text-slate-400">Signalé par: </span>
                  <strong className="text-slate-800 dark:text-slate-200">{safeStr(selectedBug.nomSignaleur, 'Anonyme')}</strong> ({safeStr(selectedBug.roleSignaleur, 'AGENT')})
                </div>

                {selectedBug.entrepriseNom && (
                  <div>
                    <span className="text-slate-400">Entreprise: </span>
                    <strong className="text-brand-blue-bright">{safeStr(selectedBug.entrepriseNom)}</strong>
                  </div>
                )}
              </div>
            </div>

            {/* SuperAdmin Official Response callout (if set) */}
            {selectedBug.reponseSuperAdmin && (
              <div className="p-4 rounded-xl bg-amber-500/10 border-2 border-amber-500/30 space-y-1.5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                    <ShieldCheck size={16} /> Réponse Officielle du SuperAdmin
                  </span>
                  <span className="text-[10px] font-bold text-amber-600/70">👑 SuperAdmin</span>
                </div>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 whitespace-pre-wrap leading-relaxed">
                  {safeStr(selectedBug.reponseSuperAdmin)}
                </p>
              </div>
            )}

            {/* Admin Official Response callout (if set and no superadmin response) */}
            {selectedBug.reponseAdmin && !selectedBug.reponseSuperAdmin && (
              <div className="p-4 rounded-xl bg-blue-500/10 border-2 border-blue-500/30 space-y-1.5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
                    <ShieldCheck size={16} /> Réponse Officielle de l'Admin
                  </span>
                  <span className="text-[10px] font-bold text-blue-600/70">💼 Admin</span>
                </div>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 whitespace-pre-wrap leading-relaxed">
                  {safeStr(selectedBug.reponseAdmin)}
                </p>
              </div>
            )}

            {/* Response thread list */}
            <div className="space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <MessageSquare size={14} /> Fil des Réponses & Actions ({(Array.isArray(selectedBug.reponses) ? selectedBug.reponses : []).length})
              </h3>

              {(!Array.isArray(selectedBug.reponses) || selectedBug.reponses.length === 0) ? (
                <p className="text-xs text-slate-400 italic p-4 bg-slate-50 dark:bg-slate-900 rounded-lg text-center">
                  Aucune réponse enregistrée pour le moment. Vous ou le SuperAdmin pouvez répondre ci-dessous.
                </p>
              ) : (
                <div className="space-y-3">
                  {selectedBug.reponses.map((rep, idx) => {
                    if (!rep) return null;
                    const isRepSuperAdmin = rep.roleAuteur === 'SUPER_ADMIN' || rep.roleAuteur === 'SUPERADMIN';
                    return (
                      <div
                        key={rep._id || idx}
                        className={`p-4 rounded-xl border transition-all ${
                          isRepSuperAdmin
                            ? 'bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border-amber-500/30'
                            : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-slate-900 dark:text-white">
                              {safeStr(rep.nomAuteur, 'Utilisateur')}
                            </span>
                            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase ${
                              isRepSuperAdmin ? 'bg-amber-500 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                            }`}>
                              {isRepSuperAdmin ? '👑 SuperAdmin' : safeStr(rep.roleAuteur, 'AGENT')}
                            </span>
                          </div>

                          <span className="text-[10px] font-bold text-slate-400">
                            {safeDate(rep.createdAt, true)}
                          </span>
                        </div>

                        <p className="text-xs font-medium text-slate-700 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                          {safeStr(rep.message)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Form response (Available for All Authorized Users: SuperAdmin, Admin, Agent) */}
            <form onSubmit={handleSendResponse} className="bg-white dark:bg-[#161B22] p-5 rounded-xl border-2 border-brand-blue-bright/20 space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-brand-blue-bright flex items-center gap-2">
                <Send size={14} /> {isSuperAdmin || isAdmin ? 'Ajouter une réponse officielle / Modifier le statut' : 'Répondre dans le fil de discussion'}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormSelect
                  label="Statut du Signalement"
                  id="newStatut"
                  value={newStatut || selectedBug.statut}
                  onChange={(e) => setNewStatut(e.target.value)}
                  options={[
                    { value: 'OUVERT', label: 'Ouvert (En attente)' },
                    { value: 'EN_COURS', label: 'En cours de résolution' },
                    { value: 'RESOLU', label: 'Résolu (Problème réglé)' },
                    ...(isSuperAdmin || isAdmin ? [{ value: 'FERME', label: 'Fermé (Clôturé)' }] : []),
                  ]}
                />

                {isAdmin && !selectedBug.transmisAuSuperAdmin && (
                  <div className="flex items-end">
                    <Btn
                      variant="warning"
                      fullWidth
                      icon={ShieldAlert}
                      loading={transmittingId === selectedBug._id}
                      onClick={(e) => handleTransmit(selectedBug._id, e)}
                    >
                      Transmettre au SuperAdmin
                    </Btn>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider ml-1">
                  Message / Précision pour la suite
                </label>
                <textarea
                  rows={3}
                  placeholder={isSuperAdmin || isAdmin ? "Saisissez votre réponse pour le signaleur..." : "Saisissez votre réponse ou précision..."}
                  value={responseMsg}
                  onChange={(e) => setResponseMsg(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-lg p-3 text-xs font-bold text-slate-900 dark:text-slate-100 outline-none focus:border-brand-blue-bright"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Btn variant="primary" type="submit" loading={responding} icon={Send}>
                  Publier la réponse
                </Btn>
              </div>
            </form>
          </div>
        </Modal>
      )}
    </div>
  );
}
