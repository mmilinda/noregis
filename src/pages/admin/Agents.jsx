import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import QRCode from 'qrcode';
import {
  Shield, UserPlus, Power, Search, Mail, Lock, User, Phone,
  Building2, Briefcase, Award, Calendar, Edit3,
  ShieldAlert, RefreshCw, AlertTriangle, Bell,
  CheckCircle, XCircle, Clock, ChevronDown, ChevronUp, QrCode, Loader2, History,
  UserCheck, UserX, AlertCircle, Key,
} from 'lucide-react';
import { useApp } from '../../context/useAppState';
import { Card, CardHeader, Btn, FormInput, FormSelect, Modal } from '../../components/UI';
import { authService } from '../../services/authService';
import { entrepriseService } from '../../services/entrepriseService';
import { demandeService } from '../../services/demandeService';
import { TRANSLATIONS } from '../../translations';
import { ResetPasswordModal } from '../../components/ResetPasswordModal';

const EMPTY_FORM = {
  email: '', password: '', prenom: '', nom: '', role: 'AGENT',
  telephone: '', departement: '', poste: '', niveauAccreditation: '', dateArrivee: '',
  entrepriseId: '',
};

const FIELD_LABELS = {
  prenom: 'Prénom', nom: 'Nom', telephone: 'Téléphone',
  departement: 'Département', poste: 'Poste',
  niveauAccreditation: "Niveau d'accréditation", dateArrivee: "Date d'arrivée",
};

export default function AgentsManagement({ isMobile }) {
  const { state, notify } = useApp();
  const navigate = useNavigate();
  const t = TRANSLATIONS[state.settings?.language || 'fr'];

  const role = (state.agent?.role || state.user?.role || '').toUpperCase();
  const isSuperAdmin = role === 'SUPER_ADMIN' || role === 'SUPERADMIN';

  const [activeTab, setActiveTab] = useState('agents'); // 'agents' | 'demandes'

  // ── Agents & Entreprises state ─────────────────────────────
  const [agents, setAgents]         = useState([]);
  const [entreprises, setEntreprises] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [entrepriseFilter, setEntrepriseFilter] = useState('ALL');
  const [statutFilter, setStatutFilter]         = useState('ALL');

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

  // Reset password modal
  const [resetUser, setResetUser] = useState(null);

  // ── Demandes state ────────────────────────────────────────
  const [demandes, setDemandes]           = useState([]);
  const [loadingDemandes, setLoadingDemandes] = useState(false);
  const [expandedDemande, setExpandedDemande] = useState(null);
  const [rejectModal, setRejectModal]     = useState(null);
  const [motifRejet, setMotifRejet]       = useState('');
  const [traitementId, setTraitementId]   = useState(null);

  // ── QR code generation state ─────────────────────────────
  const [qrModalOpen, setQrModalOpen]     = useState(false);
  const [qrAgent, setQrAgent]             = useState(null);
  const [qrData, setQrData]               = useState(null);
  const [qrLoading, setQrLoading]         = useState(false);
  const [qrError, setQrError]             = useState('');

  // ── Fetch ─────────────────────────────────────────────────
  const fetchAgentsAndEntreprises = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const entIdParam = isSuperAdmin ? null : state.agent?.entrepriseId;
      const [resUsers, resEnts] = await Promise.all([
        authService.getAllUsers(entIdParam, 'AGENT'),
        isSuperAdmin ? entrepriseService.getAll() : Promise.resolve([]),
      ]);

      let list = resUsers?.utilisateurs || (Array.isArray(resUsers) ? resUsers : []);
      if (!isSuperAdmin && state.agent?.entrepriseId) {
        list = list.filter(u => String(u.entrepriseId?._id || u.entrepriseId) === String(state.agent.entrepriseId));
      }
      list = list.filter(u => u.role === 'AGENT' || (!isSuperAdmin && (u._id === state.agent?.id || u.id === state.agent?.id)));
      setAgents(list);
      setEntreprises(Array.isArray(resEnts) ? resEnts : (resEnts?.entreprises || []));
    } catch (err) {
      notify('error', err.message || 'Impossible de récupérer la liste des agents.');
    } finally {
      setLoading(false);
    }
  }, [notify, state.agent, isSuperAdmin]);

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

  useEffect(() => { fetchAgentsAndEntreprises(); }, [fetchAgentsAndEntreprises]);
  useEffect(() => {
    if (activeTab === 'demandes') fetchDemandes();
  }, [activeTab, fetchDemandes]);

  // ── Toggle active / suspend / deactivate ──────────────────
  const handleToggleStatus = async (id, targetStatus = null) => {
    try {
      const res = await authService.updateUserStatus(id, targetStatus);
      notify('success', res.message || 'Statut de l\'agent mis à jour.');
      fetchAgentsAndEntreprises(true);
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
    const entId = isSuperAdmin ? createForm.entrepriseId : state.agent?.entrepriseId;
    if (isSuperAdmin && !entId) {
      setCreateError('Veuillez sélectionner l\'entreprise pour cet agent.');
      return;
    }

    setCreateError('');
    setCreating(true);
    try {
      const targetEnt = entreprises.find(e => (e.id === entId || e._id === entId));
      await authService.createUser({
        ...createForm,
        password: createForm.password,
        role: 'AGENT',
        entrepriseId: entId,
        entrepriseNom: targetEnt ? targetEnt.nom : (state.agent?.entrepriseNom || ''),
      });
      notify('success', 'Nouvel agent créé avec succès !');
      setCreateOpen(false);
      setCreateForm(EMPTY_FORM);
      fetchAgentsAndEntreprises(true);
    } catch (err) {
      setCreateError(err.message || 'Erreur lors de la création.');
    } finally {
      setCreating(false);
    }
  };

  // ── Edit agent ────────────────────────────────────────────
  const openEdit = (agent) => {
    const entId = agent.entrepriseId?._id || agent.entrepriseId || '';
    setEditAgent(agent);
    setEditForm({
      prenom: agent.prenom || '', nom: agent.nom || '',
      email: agent.email || '',
      telephone: agent.telephone || '', departement: agent.departement || '',
      poste: agent.poste || '', niveauAccreditation: agent.niveauAccreditation || '',
      dateArrivee: agent.dateArrivee ? new Date(agent.dateArrivee).toISOString().split('T')[0] : '',
      role: agent.role || 'AGENT',
      entrepriseId: entId,
      password: '',
      statutCompte: agent.statutCompte || 'ACTIF',
    });
    setEditError('');
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await authService.updateUserProfile(editAgent._id || editAgent.id, editForm);
      notify('success', 'Profil de l\'agent mis à jour avec succès.');
      setEditAgent(null);
      fetchAgentsAndEntreprises(true);
    } catch (err) {
      setEditError(err.message || 'Erreur lors de la mise à jour.');
    } finally {
      setSaving(false);
    }
  };

  const handleViewHistory = (agentId) => {
    navigate(`/history?agentId=${agentId}`);
  };

  const handleGenerateQr = async (agent) => {
    setQrModalOpen(true);
    setQrAgent(agent);
    setQrData(null);
    setQrError('');
    setQrLoading(true);

    try {
      const response = await authService.generateAgentQr(agent._id || agent.id);
      const qrUrl = `${window.location.origin}${response.qrPath}`;
      const qrCodeData = await QRCode.toDataURL(qrUrl);
      
      setQrData({
        ...response,
        qrUrl,
        qrCodeData,
      });
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

  const handleDownloadQr = async () => {
    if (!qrData?.qrCodeData || !qrAgent) return;
    try {
      const link = document.createElement('a');
      link.href = qrData.qrCodeData;
      const filename = `QR_${qrAgent.prenom || 'Agent'}_${qrAgent.nom || ''}.png`.trim().replace(/\s+/g, '_');
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      notify('success', `QR téléchargé : ${filename}`);
    } catch (err) {
      notify('error', 'Impossible de télécharger le QR code.');
    }
  };

  // ── Demandes ──────────────────────────────────────────────
  const handleApprouver = async (id) => {
    setTraitementId(id);
    try {
      await demandeService.approuver(id);
      notify('success', '✅ Demande approuvée — profil mis à jour.');
      fetchDemandes();
      fetchAgentsAndEntreprises(true);
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
    const entId = agent.entrepriseId?._id || agent.entrepriseId;
    const matchSearch = name.includes(q) || (agent.email || '').toLowerCase().includes(q) || (agent.entrepriseNom || agent.entrepriseId?.nom || '').toLowerCase().includes(q);
    const matchEntreprise = entrepriseFilter === 'ALL' || String(entId) === String(entrepriseFilter);
    const matchStatut = statutFilter === 'ALL' || (agent.statutCompte || agent.statut || 'ACTIF') === statutFilter;

    return matchSearch && matchEntreprise && matchStatut;
  });

  const isSelf = (agent) => state.agent?.id === agent._id || state.agent?._id === agent._id;

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Shield className="text-brand-blue-bright fill-brand-blue-bright/10" size={26} />
            {t.agent_management || 'Gestion des Agents de Sécurité'}
          </h1>
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-wider">
            {isSuperAdmin ? 'Gestion globale de tous les agents rattachés aux entreprises' : 'Gérez les accès et profils des agents de votre entreprise.'}
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
          {t.active_agents || 'Agents'} ({agents.length})
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
          {t.access_requests || 'Demandes'}
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
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative group flex-1">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-blue-bright transition-colors" />
              <input
                type="text"
                placeholder={t.search || "Rechercher un agent par nom, email..."}
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 focus:border-brand-blue-bright/20 rounded-xl py-2.5 pl-12 pr-4 text-xs font-bold text-slate-900 dark:text-slate-100 outline-none transition-all"
              />
            </div>

            {isSuperAdmin && (
              <select
                value={entrepriseFilter}
                onChange={e => setEntrepriseFilter(e.target.value)}
                className="px-3 py-2.5 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-xl text-xs font-black outline-none cursor-pointer"
              >
                <option value="ALL">Toutes les entreprises</option>
                {entreprises.map(ent => (
                  <option key={ent.id || ent._id} value={ent.id || ent._id}>
                    {ent.nom}
                  </option>
                ))}
              </select>
            )}

            <select
              value={statutFilter}
              onChange={e => setStatutFilter(e.target.value)}
              className="px-3 py-2.5 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-xl text-xs font-black outline-none cursor-pointer"
            >
              <option value="ALL">Tous les statuts</option>
              <option value="ACTIF">Actifs</option>
              <option value="SUSPENDU">Suspendus</option>
              <option value="DESACTIVE">Désactivés</option>
            </select>
          </div>

          <Card className="border-slate-200 dark:border-slate-800">
            <CardHeader
              title={`Total : ${filteredAgents.length} agent(s)`}
              actions={
                <Btn variant="secondary" size="sm" icon={RefreshCw} onClick={() => fetchAgentsAndEntreprises()} className="text-[10px] font-black uppercase">
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
              <div className="p-3 sm:p-4 overflow-x-auto w-full">
                <table className="w-full min-w-[700px] table-fixed text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                      <th className="py-2.5 px-3 text-[10px] font-black uppercase text-slate-400 tracking-wider w-[24%]">Agent</th>
                      <th className="py-2.5 px-2 text-[10px] font-black uppercase text-slate-400 tracking-wider w-[18%]">Entreprise</th>
                      <th className="py-2.5 px-2 text-[10px] font-black uppercase text-slate-400 tracking-wider w-[16%]">Poste / Dept</th>
                      <th className="py-2.5 px-2 text-[10px] font-black uppercase text-slate-400 tracking-wider w-[12%]">Statut</th>
                      <th className="py-2.5 px-3 text-[10px] font-black uppercase text-slate-400 tracking-wider text-right w-[30%]">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredAgents.map((agent) => {
                      const initials = ((agent.prenom?.[0] || '') + (agent.nom?.[0] || 'U')).toUpperCase();
                      const self = isSelf(agent);
                      const entName = agent.entrepriseId?.nom || agent.entrepriseNom || '—';
                      const currentStatus = agent.statutCompte || agent.statut || 'ACTIF';

                      return (
                        <tr key={agent._id || agent.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors">
                          <td className="py-2.5 px-3 min-w-0">
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-blue-bright to-brand-blue flex items-center justify-center text-white text-[11px] font-black shrink-0">
                                {initials}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1 leading-tight truncate">
                                  {agent.prenom} {agent.nom}
                                  {self && (
                                    <span className="px-1 py-0.2 rounded text-[7px] bg-brand-blue-bright/10 text-brand-blue-bright font-black uppercase tracking-wider shrink-0">Vous</span>
                                  )}
                                </p>
                                <p className="text-[10px] text-slate-400 truncate">{agent.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-2.5 px-2 text-xs font-bold text-slate-800 dark:text-slate-200 min-w-0">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <Building2 size={13} className="text-brand-blue-bright shrink-0" />
                              <span className="truncate">{entName}</span>
                            </div>
                          </td>
                          <td className="py-2.5 px-2 min-w-0">
                            <p className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">{agent.poste || '—'}</p>
                            <p className="text-[9px] text-slate-400 uppercase tracking-wider font-bold truncate">{agent.departement || ''}</p>
                          </td>
                          <td className="py-2.5 px-2 min-w-0">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                              currentStatus === 'ACTIF' ? 'bg-emerald-500/10 text-emerald-600' :
                              currentStatus === 'SUSPENDU' ? 'bg-amber-500/10 text-amber-600' : 'bg-rose-500/10 text-rose-600'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${currentStatus === 'ACTIF' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                              <span className="truncate">{currentStatus}</span>
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right min-w-0">
                            <div className="flex items-center justify-end gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleViewHistory(agent._id || agent.id)}
                                className="p-1.5 rounded-lg text-brand-blue-bright bg-brand-blue-bright/10 hover:bg-brand-blue-bright/20 transition-all shrink-0"
                                title="Historique de l'agent"
                              >
                                <History size={13} />
                              </button>
                              <button
                                type="button"
                                onClick={() => openEdit(agent)}
                                className="p-1.5 rounded-lg text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition-all shrink-0"
                                title="Modifier"
                              >
                                <Edit3 size={13} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleGenerateQr(agent)}
                                className="p-1.5 rounded-lg text-brand-blue-bright bg-brand-blue-bright/10 hover:bg-brand-blue-bright/20 transition-all shrink-0"
                                title="QR Code"
                              >
                                <QrCode size={13} />
                              </button>
                              <button
                                type="button"
                                onClick={() => setResetUser(agent)}
                                className="p-1.5 rounded-lg text-amber-600 bg-amber-500/10 hover:bg-amber-500/20 transition-all shrink-0"
                                title="Réinitialiser le mot de passe"
                              >
                                <Key size={13} />
                              </button>
                              {!self && (
                                <>
                                  {currentStatus !== 'ACTIF' && (
                                    <button
                                      type="button"
                                      onClick={() => handleToggleStatus(agent._id || agent.id, 'ACTIF')}
                                      className="p-1.5 sm:px-2 sm:py-1 rounded-lg text-[9px] font-black uppercase text-emerald-700 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 transition-all shrink-0 flex items-center gap-1"
                                      title="Activer"
                                    >
                                      <UserCheck size={13} />
                                      <span className="hidden xl:inline">Activer</span>
                                    </button>
                                  )}
                                  {currentStatus !== 'SUSPENDU' && (
                                    <button
                                      type="button"
                                      onClick={() => handleToggleStatus(agent._id || agent.id, 'SUSPENDU')}
                                      className="p-1.5 sm:px-2 sm:py-1 rounded-lg text-[9px] font-black uppercase text-amber-700 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 transition-all shrink-0 flex items-center gap-1"
                                      title="Suspendre"
                                    >
                                      <AlertCircle size={13} />
                                      <span className="hidden xl:inline">Suspendre</span>
                                    </button>
                                  )}
                                  {currentStatus !== 'DESACTIVE' && (
                                    <button
                                      type="button"
                                      onClick={() => handleToggleStatus(agent._id || agent.id, 'DESACTIVE')}
                                      className="p-1.5 sm:px-2 sm:py-1 rounded-lg text-[9px] font-black uppercase text-rose-700 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-all shrink-0 flex items-center gap-1"
                                      title="Désactiver"
                                    >
                                      <UserX size={13} />
                                      <span className="hidden xl:inline">Désactiver</span>
                                    </button>
                                  )}
                                </>
                              )}
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
                const isProcessing = traitementId === demande._id;

                return (
                  <div key={demande._id} className="p-5">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-brand-amber-bright to-amber-400 flex items-center justify-center text-white text-xs font-black shrink-0">
                        {((agent?.prenom?.[0] || '') + (agent?.nom?.[0] || 'A')).toUpperCase()}
                      </div>

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

                        <div className="mt-3 flex flex-wrap gap-2">
                          {champs.map(([key, val]) => (
                            <div key={key} className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                              <span className="text-[9px] font-black text-slate-400 uppercase">{FIELD_LABELS[key] || key}</span>
                              <span className="text-[10px] font-black text-slate-700 dark:text-slate-200">→ {String(val)}</span>
                            </div>
                          ))}
                        </div>

                        {demande.motif && (
                          <p className="mt-2 text-xs text-slate-500 italic">«{demande.motif}»</p>
                        )}

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
      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Créer un nouvel Agent de Sécurité" size="md">
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

          {isSuperAdmin && (
            <FormSelect
              label="Entreprise Rattachée *"
              id="c-entrepriseId"
              required
              value={createForm.entrepriseId}
              onChange={e => setCreateForm(f => ({ ...f, entrepriseId: e.target.value }))}
              options={entreprises.map(e => ({ value: e.id || e._id, label: e.nom }))}
              placeholder="Sélectionner l'entreprise..."
            />
          )}

          <div className="grid grid-cols-2 gap-4">
            <FormInput label="Téléphone" id="c-tel" value={createForm.telephone}
              onChange={e => setCreateForm(f => ({ ...f, telephone: e.target.value }))} icon={Phone} placeholder="+221 77 000 00 00" />
            <FormInput label="Date d'arrivée" id="c-date" type="date" value={createForm.dateArrivee}
              onChange={e => setCreateForm(f => ({ ...f, dateArrivee: e.target.value }))} icon={Calendar} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormInput label="Département" id="c-dept" value={createForm.departement}
              onChange={e => setCreateForm(f => ({ ...f, departement: e.target.value }))} icon={Building2} placeholder="Ex: Sécurité" />
            <FormInput label="Poste" id="c-poste" value={createForm.poste}
              onChange={e => setCreateForm(f => ({ ...f, poste: e.target.value }))} icon={Briefcase} placeholder="Ex: Entrée Principale" />
          </div>
          <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
            <Btn variant="secondary" onClick={() => setCreateOpen(false)}>Annuler</Btn>
            <Btn type="submit" variant="primary" loading={creating}>Créer l'Agent</Btn>
          </div>
        </form>
      </Modal>

      {/* ── MODAL ÉDITION ─────────────────────────────────── */}
      {editAgent && (
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
              <FormInput label="Email" id="e-email" type="email" value={editForm.email}
                onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} icon={Mail} />
              <FormInput label="Nouveau mot de passe" id="e-password" type="password" value={editForm.password}
                onChange={e => setEditForm(f => ({ ...f, password: e.target.value }))} icon={Lock} placeholder="Conserver l'actuel" />
            </div>

            {isSuperAdmin && (
              <FormSelect
                label="Entreprise Rattachée"
                id="e-entrepriseId"
                value={editForm.entrepriseId}
                onChange={e => setEditForm(f => ({ ...f, entrepriseId: e.target.value }))}
                options={entreprises.map(e => ({ value: e.id || e._id, label: e.nom }))}
              />
            )}

            <div className="grid grid-cols-2 gap-4">
              <FormInput label="Téléphone" id="e-tel" value={editForm.telephone}
                onChange={e => setEditForm(f => ({ ...f, telephone: e.target.value }))} icon={Phone} />
              <FormSelect
                label="Statut du compte"
                id="e-statut"
                value={editForm.statutCompte}
                onChange={e => setEditForm(f => ({ ...f, statutCompte: e.target.value }))}
                options={[
                  { value: 'ACTIF', label: 'Actif' },
                  { value: 'SUSPENDU', label: 'Suspendu' },
                  { value: 'DESACTIVE', label: 'Désactivé' },
                ]}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormInput label="Département" id="e-dept" value={editForm.departement}
                onChange={e => setEditForm(f => ({ ...f, departement: e.target.value }))} icon={Building2} />
              <FormInput label="Poste" id="e-poste" value={editForm.poste}
                onChange={e => setEditForm(f => ({ ...f, poste: e.target.value }))} icon={Briefcase} />
            </div>
            <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
              <Btn variant="secondary" onClick={() => setEditAgent(null)}>Annuler</Btn>
              <Btn type="submit" variant="primary" loading={saving}>Enregistrer</Btn>
            </div>
          </form>
        </Modal>
      )}

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
                <p className="font-black text-slate-900 dark:text-white text-base">{qrData.qrUrl}</p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Btn variant="secondary" onClick={handleCopyLink}>Copier le lien</Btn>
                <Btn variant="primary" onClick={handleDownloadQr} icon={QrCode}>Télécharger QR</Btn>
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

      {/* Modal Réinitialisation Mot de passe */}
      {resetUser && (
        <ResetPasswordModal
          isOpen={!!resetUser}
          onClose={() => setResetUser(null)}
          user={resetUser}
          notify={notify}
        />
      )}
    </div>
  );
}
