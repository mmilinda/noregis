import React, { useState, useEffect, useCallback } from 'react';
import {
  Shield, UserPlus, Power, Search, Mail, Lock, User, Phone,
  Building2, Briefcase, Award, Calendar, Edit3,
  ShieldAlert, RefreshCw, AlertTriangle, Bell,
  CheckCircle, XCircle, Clock, ChevronDown, ChevronUp, QrCode, Loader2,
} from 'lucide-react';
import { useApp } from '../../context/useAppState';
import { Card, CardHeader, Btn, FormInput, FormSelect, Modal } from '../../components/UI';
import { authService } from '../../services/authService';
import { demandeService } from '../../services/demandeService';
import { TRANSLATIONS } from '../../translations';

const EMPTY_FORM = {
  email: '', password: '', prenom: '', nom: '', role: 'AGENT',
  telephone: '', departement: '', poste: '', niveauAccreditation: '', dateArrivee: '',
};

const FIELD_LABELS = {
  prenom: 'Prénom', nom: 'Nom', telephone: 'Téléphone',
  departement: 'Département', poste: 'Poste',
  niveauAccreditation: "Niveau d'accréditation", dateArrivee: "Date d'arrivée",
};

export default function AgentsManagement({ isMobile }) {
  const { state, notify } = useApp();
  const t = TRANSLATIONS[state.settings?.language || 'fr'];

  const [activeTab, setActiveTab] = useState('agents'); // 'agents' | 'demandes'

  // ── Agents state ──────────────────────────────────────────
  const [agents, setAgents]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');

  // Create modal
  const [createOpen, setCreateOpen]   = useState(false);
  const [createForm, setCreateForm]   = useState(EMPTY_FORM);
  const [createError, setCreateError] = useState('');
  const [creating, setCreating]       = useState(false);

  // Edit modal
  const [editAgent, setEditAgent] = useState(null);
  const [editForm, setEditForm]   = useState({});
  const [editError, setEditError] = useState('');
  const [saving, setSaving]       = useState(false);

  // ── Demandes state ────────────────────────────────────────
  const [demandes, setDemandes]           = useState([]);
  const [loadingDemandes, setLoadingDemandes] = useState(false);
  const [expandedDemande, setExpandedDemande] = useState(null);
  const [rejectModal, setRejectModal]     = useState(null); // demande being rejected
  const [motifRejet, setMotifRejet]       = useState('');
  const [traitementId, setTraitementId]   = useState(null);

  // ── QR code generation state ─────────────────────────────
  const [qrModalOpen, setQrModalOpen]     = useState(false);
  const [qrAgent, setQrAgent]             = useState(null);
  const [qrData, setQrData]               = useState(null);
  const [qrLoading, setQrLoading]         = useState(false);
  const [qrError, setQrError]             = useState('');

  // ── Fetch ─────────────────────────────────────────────────
  const fetchAgents = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await authService.getAllUsers();
      setAgents(res?.utilisateurs || (Array.isArray(res) ? res : []));
    } catch (err) {
      notify('error', err.message || 'Impossible de récupérer la liste des agents.');
    } finally {
      setLoading(false);
    }
  }, [notify]);

  const fetchDemandes = useCallback(async () => {
    setLoadingDemandes(true);
    try {
      const res = await demandeService.lister('en_attente');
      setDemandes(res?.demandes || []);
    } catch (err) {
      notify('error', err.message || 'Impossible de récupérer les demandes.');
    } finally {
      setLoadingDemandes(false);
    }
  }, [notify]);

  useEffect(() => { fetchAgents(); }, [fetchAgents]);
  useEffect(() => {
    if (activeTab === 'demandes') fetchDemandes();
  }, [activeTab, fetchDemandes]);

  // ── Toggle active ─────────────────────────────────────────
  const handleToggleStatus = async (id) => {
    try {
      const res = await authService.toggleUserStatus(id);
      notify('success', res.message || 'Statut mis à jour.');
      fetchAgents(true);
    } catch (err) {
      notify('error', err.message || 'Impossible de modifier le statut.');
    }
  };

  // ── Create agent ──────────────────────────────────────────
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!createForm.email || !createForm.password || !createForm.nom) {
      setCreateError('Nom, email et mot de passe sont obligatoires.');
      return;
    }
    setCreateError('');
    setCreating(true);
    try {
      await authService.createUser({ ...createForm, password: createForm.password });
      notify('success', 'Nouvel agent créé avec succès !');
      setCreateOpen(false);
      setCreateForm(EMPTY_FORM);
      fetchAgents(true);
    } catch (err) {
      setCreateError(err.message || 'Erreur lors de la création.');
    } finally {
      setCreating(false);
    }
  };

  // ── Edit agent ────────────────────────────────────────────
  const openEdit = (agent) => {
    setEditAgent(agent);
    setEditForm({
      prenom: agent.prenom || '', nom: agent.nom || '',
      telephone: agent.telephone || '', departement: agent.departement || '',
      poste: agent.poste || '', niveauAccreditation: agent.niveauAccreditation || '',
      dateArrivee: agent.dateArrivee ? new Date(agent.dateArrivee).toISOString().split('T')[0] : '',
      role: agent.role || 'AGENT',
    });
    setEditError('');
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await authService.updateUserProfile(editAgent._id, editForm);
      notify('success', 'Profil mis à jour avec succès.');
      setEditAgent(null);
      fetchAgents(true);
    } catch (err) {
      setEditError(err.message || 'Erreur lors de la mise à jour.');
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateQr = async (agent) => {
    setQrModalOpen(true);
    setQrAgent(agent);
    setQrData(null);
    setQrError('');
    setQrLoading(true);

    try {
      const response = await authService.generateAgentQr(agent._id);
      setQrData(response);
    } catch (err) {
      setQrError(err.message || 'Impossible de générer le QR code.');
    } finally {
      setQrLoading(false);
    }
  };

  const closeQrModal = () => {
    setQrModalOpen(false);
    setQrAgent(null);
    setQrData(null);
    setQrError('');
  };

  const handleCopyLink = async () => {
    if (!qrData?.qrUrl) return;
    try {
      await navigator.clipboard.writeText(qrData.qrUrl);
      notify('success', 'Lien copié dans le presse-papiers.');
    } catch {
      notify('error', 'Impossible de copier le lien.');
    }
  };

  // ── Demandes ──────────────────────────────────────────────
  const handleApprouver = async (id) => {
    setTraitementId(id);
    try {
      await demandeService.approuver(id);
      notify('success', '✅ Demande approuvée — profil mis à jour.');
      fetchDemandes();
      fetchAgents(true);
    } catch (err) {
      notify('error', err.message || 'Erreur lors de l\'approbation.');
    } finally {
      setTraitementId(null);
    }
  };

  const handleRejeter = async () => {
    if (!rejectModal) return;
    setTraitementId(rejectModal._id);
    try {
      await demandeService.rejeter(rejectModal._id, motifRejet);
      notify('info', 'Demande rejetée.');
      setRejectModal(null);
      setMotifRejet('');
      fetchDemandes();
    } catch (err) {
      notify('error', err.message || 'Erreur lors du rejet.');
    } finally {
      setTraitementId(null);
    }
  };

  const filteredAgents = agents.filter(agent => {
    const q = search.toLowerCase();
    const name = `${agent.prenom || ''} ${agent.nom || ''}`.toLowerCase();
    return name.includes(q) || (agent.email || '').toLowerCase().includes(q) || (agent.role || '').toLowerCase().includes(q);
  });

  const isSelf = (agent) => state.agent?.id === agent._id || state.agent?._id === agent._id;

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Shield className="text-brand-blue-bright fill-brand-blue-bright/10" size={26} />
            {t.agent_management || 'Gestion des Agents'}
          </h1>
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-wider">
            Gérez les accès, les rôles et les demandes de modification.
          </p>
        </div>
        {activeTab === 'agents' && (
          <Btn variant="primary" icon={UserPlus} onClick={() => setCreateOpen(true)} className="text-[10px] font-black uppercase">
            {t.add_agent || 'Ajouter un Agent'}
          </Btn>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('agents')}
          className={`px-5 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
            activeTab === 'agents'
              ? 'bg-white dark:bg-slate-800 text-brand-blue-bright shadow-sm'
              : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          Agents ({agents.length})
        </button>
        <button
          onClick={() => setActiveTab('demandes')}
          className={`px-5 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
            activeTab === 'demandes'
              ? 'bg-white dark:bg-slate-800 text-brand-blue-bright shadow-sm'
              : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <Bell size={13} />
          Demandes
          {demandes.length > 0 && (
            <span className="w-5 h-5 rounded-full bg-brand-amber-bright text-white text-[9px] font-black flex items-center justify-center">
              {demandes.length}
            </span>
          )}
        </button>
      </div>

      {/* ═══════════════ TAB AGENTS ═══════════════ */}
      {activeTab === 'agents' && (
        <>
          <div className="relative group w-full md:w-96">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-blue-bright transition-colors" />
            <input
              type="text"
              placeholder="Rechercher un agent par nom, email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 focus:border-brand-blue-bright/20 rounded-lg py-2.5 pl-12 pr-4 text-sm font-bold text-slate-900 dark:text-slate-100 outline-none transition-all"
            />
          </div>

          <Card className="border-slate-200 dark:border-slate-800">
            <CardHeader
              title={`Total : ${filteredAgents.length} agent(s)`}
              actions={
                <Btn variant="secondary" size="sm" icon={RefreshCw} onClick={() => fetchAgents()} className="text-[10px] font-black uppercase">
                  Actualiser
                </Btn>
              }
            />

            {loading ? (
              <div className="p-12 flex flex-col items-center justify-center gap-3">
                <span className="w-10 h-10 border-4 border-brand-blue-bright border-t-transparent rounded-full animate-spin" />
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Chargement...</p>
              </div>
            ) : filteredAgents.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                <AlertTriangle className="mx-auto mb-3 text-slate-400" size={40} />
                <p className="text-sm font-bold">Aucun agent trouvé</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                      <th className="p-4 text-[10px] font-black uppercase text-slate-400 tracking-wider">Agent</th>
                      <th className="p-4 text-[10px] font-black uppercase text-slate-400 tracking-wider">Rôle</th>
                      <th className="p-4 text-[10px] font-black uppercase text-slate-400 tracking-wider">Poste / Département</th>
                      <th className="p-4 text-[10px] font-black uppercase text-slate-400 tracking-wider">Inscription</th>
                      <th className="p-4 text-[10px] font-black uppercase text-slate-400 tracking-wider">Statut</th>
                      <th className="p-4 text-[10px] font-black uppercase text-slate-400 tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredAgents.map((agent) => {
                      const initials = ((agent.prenom?.[0] || '') + (agent.nom?.[0] || 'U')).toUpperCase();
                      const self = isSelf(agent);
                      return (
                        <tr key={agent._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand-blue-bright to-brand-blue flex items-center justify-center text-white text-xs font-black shrink-0">
                                {initials}
                              </div>
                              <div>
                                <p className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                                  {agent.prenom} {agent.nom}
                                  {self && (
                                    <span className="px-1.5 py-0.5 rounded text-[8px] bg-brand-blue-bright/10 text-brand-blue-bright font-black uppercase tracking-wider">Vous</span>
                                  )}
                                </p>
                                <p className="text-[11px] text-slate-500">{agent.email}</p>
                                {agent.telephone && <p className="text-[10px] text-slate-400">{agent.telephone}</p>}
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                              agent.role === 'ADMIN'
                                ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400'
                                : 'bg-brand-blue-light text-brand-blue'
                            }`}>
                              {agent.role === 'ADMIN' ? 'Administrateur' : 'Agent'}
                            </span>
                          </td>
                          <td className="p-4">
                            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{agent.poste || '—'}</p>
                            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mt-0.5">{agent.departement || ''}</p>
                          </td>
                          <td className="p-4 text-xs font-bold text-slate-600 dark:text-slate-300">
                            {agent.createdAt ? new Date(agent.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                          </td>
                          <td className="p-4">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                              agent.isActif !== false
                                ? 'bg-brand-green-light text-brand-green'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${agent.isActif !== false ? 'bg-brand-green animate-pulse' : 'bg-slate-400'}`} />
                              {agent.isActif !== false ? 'Actif' : 'Inactif'}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Btn variant="ghost" size="sm" icon={Edit3} onClick={() => openEdit(agent)} className="text-brand-blue hover:bg-brand-blue/10">
                                Modifier
                              </Btn>
                              <Btn variant="ghost" size="sm" icon={QrCode} onClick={() => handleGenerateQr(agent)} className="text-brand-blue hover:bg-brand-blue/10">
                                QR
                              </Btn>
                              <Btn
                                variant={agent.isActif !== false ? 'ghost' : 'success'}
                                size="sm"
                                icon={Power}
                                disabled={self}
                                onClick={() => handleToggleStatus(agent._id)}
                                className={agent.isActif !== false ? 'text-brand-red hover:bg-brand-red/10' : 'text-brand-green hover:bg-brand-green/10'}
                              >
                                {agent.isActif !== false ? 'Désactiver' : 'Activer'}
                              </Btn>
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
        </>
      )}

      {/* ═══════════════ TAB DEMANDES ═══════════════ */}
      {activeTab === 'demandes' && (
        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader
            title="Demandes de modification en attente"
            actions={
              <Btn variant="secondary" size="sm" icon={RefreshCw} onClick={fetchDemandes} className="text-[10px] font-black uppercase">
                Actualiser
              </Btn>
            }
          />

          {loadingDemandes ? (
            <div className="p-12 flex flex-col items-center justify-center gap-3">
              <span className="w-10 h-10 border-4 border-brand-blue-bright border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Chargement...</p>
            </div>
          ) : demandes.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <CheckCircle className="mx-auto mb-3 text-brand-green" size={40} />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Aucune demande en attente</p>
              <p className="text-xs mt-1">Toutes les demandes ont été traitées.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {demandes.map((demande) => {
                const agent = demande.utilisateur;
                const champs = Object.entries(demande.modifications || {});
                const isExpanded = expandedDemande === demande._id;
                const isProcessing = traitementId === demande._id;

                return (
                  <div key={demande._id} className="p-5">
                    <div className="flex items-start gap-4">
                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-brand-amber-bright to-amber-400 flex items-center justify-center text-white text-xs font-black shrink-0">
                        {((agent?.prenom?.[0] || '') + (agent?.nom?.[0] || 'A')).toUpperCase()}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div>
                            <p className="text-sm font-black text-slate-900 dark:text-white">
                              {agent?.prenom} {agent?.nom}
                            </p>
                            <p className="text-[11px] text-slate-500">{agent?.email}</p>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-[9px] font-black uppercase">
                              <Clock size={10} /> En attente
                            </span>
                            <span className="text-[10px] text-slate-400 font-bold">
                              {new Date(demande.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                            </span>
                          </div>
                        </div>

                        {/* Champs demandés — résumé */}
                        <div className="mt-3 flex flex-wrap gap-2">
                          {champs.map(([key, val]) => (
                            <div key={key} className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                              <span className="text-[9px] font-black text-slate-400 uppercase">{FIELD_LABELS[key] || key}</span>
                              <span className="text-[10px] font-black text-slate-700 dark:text-slate-200">→ {String(val)}</span>
                            </div>
                          ))}
                        </div>

                        {/* Motif */}
                        {demande.motif && (
                          <p className="mt-2 text-xs text-slate-500 italic">«{demande.motif}»</p>
                        )}

                        {/* Actions */}
                        <div className="mt-4 flex items-center gap-2">
                          <Btn
                            variant="primary"
                            size="sm"
                            icon={CheckCircle}
                            loading={isProcessing}
                            onClick={() => handleApprouver(demande._id)}
                            className="bg-brand-green-bright hover:bg-brand-green text-white !border-0"
                          >
                            Approuver
                          </Btn>
                          <Btn
                            variant="ghost"
                            size="sm"
                            icon={XCircle}
                            disabled={isProcessing}
                            onClick={() => { setRejectModal(demande); setMotifRejet(''); }}
                            className="text-brand-red hover:bg-brand-red/10"
                          >
                            Rejeter
                          </Btn>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}

      {/* ── MODAL CRÉATION ────────────────────────────────── */}
      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Créer un nouvel Agent" size="md">
        <form onSubmit={handleCreate} className="space-y-4">
          {createError && (
            <div className="p-3 bg-red-50 dark:bg-red-950/30 text-brand-red border border-brand-red-bright/20 rounded-lg text-xs font-bold flex items-center gap-2">
              <AlertTriangle size={16} /><span>{createError}</span>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <FormInput label="Prénom" id="c-prenom" value={createForm.prenom}
              onChange={e => setCreateForm(f => ({ ...f, prenom: e.target.value }))} icon={User} placeholder="Ex: Jean" />
            <FormInput label="Nom *" id="c-nom" required value={createForm.nom}
              onChange={e => setCreateForm(f => ({ ...f, nom: e.target.value }))} icon={User} placeholder="Ex: Dupont" />
          </div>
          <FormInput label="Email *" id="c-email" type="email" required value={createForm.email}
            onChange={e => setCreateForm(f => ({ ...f, email: e.target.value }))} icon={Mail} placeholder="j.dupont@company.com" />
          <FormInput label="Mot de passe *" id="c-password" type="password" required value={createForm.password}
            onChange={e => setCreateForm(f => ({ ...f, password: e.target.value }))} icon={Lock} placeholder="••••••••" />
          <div className="grid grid-cols-2 gap-4">
            <FormInput label="Téléphone" id="c-tel" value={createForm.telephone}
              onChange={e => setCreateForm(f => ({ ...f, telephone: e.target.value }))} icon={Phone} placeholder="+226 XX XX XX XX" />
            <FormInput label="Date d'arrivée" id="c-date" type="date" value={createForm.dateArrivee}
              onChange={e => setCreateForm(f => ({ ...f, dateArrivee: e.target.value }))} icon={Calendar} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormInput label="Département" id="c-dept" value={createForm.departement}
              onChange={e => setCreateForm(f => ({ ...f, departement: e.target.value }))} icon={Building2} placeholder="Ex: Sécurité" />
            <FormInput label="Poste" id="c-poste" value={createForm.poste}
              onChange={e => setCreateForm(f => ({ ...f, poste: e.target.value }))} icon={Briefcase} placeholder="Ex: Entrée Principale" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormInput label="Accréditation" id="c-accred" value={createForm.niveauAccreditation}
              onChange={e => setCreateForm(f => ({ ...f, niveauAccreditation: e.target.value }))} icon={Award} placeholder="Ex: Niveau 2" />
            <FormSelect label="Rôle" id="c-role" value={createForm.role}
              onChange={e => setCreateForm(f => ({ ...f, role: e.target.value }))} icon={ShieldAlert}
              options={[{ value: 'AGENT', label: 'Agent' }, { value: 'ADMIN', label: 'Administrateur' }]} />
          </div>
          <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
            <Btn variant="secondary" onClick={() => setCreateOpen(false)}>Annuler</Btn>
            <Btn type="submit" variant="primary" loading={creating}>Créer le compte</Btn>
          </div>
        </form>
      </Modal>

      {/* ── MODAL ÉDITION ─────────────────────────────────── */}
      <Modal isOpen={!!editAgent} onClose={() => setEditAgent(null)} title={`Modifier — ${editAgent?.prenom || ''} ${editAgent?.nom || ''}`} size="md">
        <form onSubmit={handleSaveEdit} className="space-y-4">
          {editError && (
            <div className="p-3 bg-red-50 dark:bg-red-950/30 text-brand-red border border-brand-red-bright/20 rounded-lg text-xs font-bold flex items-center gap-2">
              <AlertTriangle size={16} /><span>{editError}</span>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <FormInput label="Prénom" id="e-prenom" value={editForm.prenom}
              onChange={e => setEditForm(f => ({ ...f, prenom: e.target.value }))} icon={User} />
            <FormInput label="Nom" id="e-nom" value={editForm.nom}
              onChange={e => setEditForm(f => ({ ...f, nom: e.target.value }))} icon={User} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormInput label="Téléphone" id="e-tel" value={editForm.telephone}
              onChange={e => setEditForm(f => ({ ...f, telephone: e.target.value }))} icon={Phone} />
            <FormInput label="Date d'arrivée" id="e-date" type="date" value={editForm.dateArrivee}
              onChange={e => setEditForm(f => ({ ...f, dateArrivee: e.target.value }))} icon={Calendar} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormInput label="Département" id="e-dept" value={editForm.departement}
              onChange={e => setEditForm(f => ({ ...f, departement: e.target.value }))} icon={Building2} />
            <FormInput label="Poste" id="e-poste" value={editForm.poste}
              onChange={e => setEditForm(f => ({ ...f, poste: e.target.value }))} icon={Briefcase} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormInput label="Accréditation" id="e-accred" value={editForm.niveauAccreditation}
              onChange={e => setEditForm(f => ({ ...f, niveauAccreditation: e.target.value }))} icon={Award} />
            <FormSelect label="Rôle" id="e-role" value={editForm.role}
              onChange={e => setEditForm(f => ({ ...f, role: e.target.value }))} icon={ShieldAlert}
              options={[{ value: 'AGENT', label: 'Agent' }, { value: 'ADMIN', label: 'Administrateur' }]} />
          </div>
          <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
            <Btn variant="secondary" onClick={() => setEditAgent(null)}>Annuler</Btn>
            <Btn type="submit" variant="primary" loading={saving}>Enregistrer</Btn>
          </div>
        </form>
      </Modal>

      {/* ── MODAL QR CODE ─────────────────────────────────── */}
      <Modal isOpen={qrModalOpen} onClose={closeQrModal} title={`QR code ${qrAgent?.prenom || ''} ${qrAgent?.nom || ''}`} size="md">
        <div className="space-y-4">
          {qrLoading ? (
            <div className="p-8 text-center text-slate-500">
              <Loader2 className="mx-auto mb-4 animate-spin" size={24} />
              <p className="text-sm font-black uppercase tracking-widest">Génération du QR code...</p>
            </div>
          ) : qrError ? (
            <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 text-sm font-bold text-red-700 dark:text-red-200">
              {qrError}
            </div>
          ) : qrData ? (
            <div className="space-y-4">
              {qrData.qrCodeData ? (
                <div className="flex justify-center">
                  <img src={qrData.qrCodeData} alt="QR Code" className="w-48 h-48" />
                </div>
              ) : (
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-4 text-sm text-slate-600 dark:text-slate-300">
                  Le QR code a été généré. Copiez le lien ci-dessous pour l'imprimer ou le partager.
                </div>
              )}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 text-sm break-all">
                <p className="text-[10px] uppercase tracking-[0.35em] text-slate-400 dark:text-slate-500 mb-2">Lien de scan public</p>
                <p className="font-black text-slate-900 dark:text-white">{qrData.qrUrl}</p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Btn variant="secondary" onClick={handleCopyLink}>Copier le lien</Btn>
                <Btn variant="success" onClick={closeQrModal}>Fermer</Btn>
              </div>
            </div>
          ) : (
            <div className="text-sm text-slate-500">Cliquez sur Générer pour créer le QR code associé à cet agent.</div>
          )}
        </div>
      </Modal>

      {/* ── MODAL REJET ───────────────────────────────────── */}
      <Modal isOpen={!!rejectModal} onClose={() => setRejectModal(null)} title="Rejeter la demande" size="sm">
        <div className="space-y-4">
          <p className="text-xs text-slate-500 font-bold">
            Indiquez un motif (optionnel) qui sera visible par l'agent.
          </p>
          <textarea
            value={motifRejet}
            onChange={e => setMotifRejet(e.target.value)}
            rows={4}
            placeholder="Ex: Les informations fournies ne correspondent pas..."
            className="w-full border-2 border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:border-brand-red/60 transition-colors resize-none"
          />
          <div className="flex gap-3 justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
            <Btn variant="secondary" onClick={() => setRejectModal(null)}>Annuler</Btn>
            <Btn variant="danger" icon={XCircle} loading={!!traitementId} onClick={handleRejeter}>
              Confirmer le rejet
            </Btn>
          </div>
        </div>
      </Modal>
    </div>
  );
}
