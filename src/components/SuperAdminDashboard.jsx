import { useState, useEffect, useCallback } from 'react';
import {
  Building2, Users, ShieldAlert, Shield, CheckCircle2, XCircle, AlertTriangle,
  Plus, Search, Filter, RefreshCw, KeyRound, Lock, Eye, Building, Phone, Mail, MapPin, UserPlus, UserCheck, UserX, AlertCircle
} from 'lucide-react';
import { Btn, FormInput, FormSelect, Modal } from './UI';
import { entrepriseService } from '../services/entrepriseService';
import { authService } from '../services/authService';
import { visitService } from '../services/visitService';
import { secteurService } from '../services/secteurService';
import { useApp } from '../context/useAppState';

const DEFAULT_ENT_FORM = {
  nom: '',
  code: '',
  adresse: '',
  telephone: '',
  emailContact: '',
  secteur: 'Maritime / Logistique',
  statut: 'ACTIF',
  maxAdmins: 5,
  maxAgents: 20,
};

const DEFAULT_USER_FORM = {
  nom: '',
  prenom: '',
  email: '',
  password: '',
  role: 'ADMIN',
  entrepriseId: '',
  telephone: '',
  poste: '',
};

export function SuperAdminDashboard({ t }) {
  const { notify } = useApp();
  const [activeTab, setActiveTab] = useState('entreprises'); // 'entreprises' | 'utilisateurs' | 'historique'
  
  // Data States
  const [entreprises, setEntreprises] = useState([]);
  const [utilisateurs, setUtilisateurs] = useState([]);
  const [visitesGlobales, setVisitesGlobales] = useState([]);
  const [secteursOptions, setSecteursOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filters & Search
  const [searchEnt, setSearchEnt] = useState('');
  const [searchUser, setSearchUser] = useState('');
  const [filterEntId, setFilterEntId] = useState('');
  const [filterRole, setFilterRole] = useState('');

  // Modals
  const [showCreateEntModal, setShowCreateEntModal] = useState(false);
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);

  // Form States & Errors
  const [entForm, setEntForm] = useState(DEFAULT_ENT_FORM);
  const [entErrors, setEntErrors] = useState({});
  const [creatingEnt, setCreatingEnt] = useState(false);

  const [userForm, setUserForm] = useState(DEFAULT_USER_FORM);
  const [userErrors, setUserErrors] = useState({});
  const [creatingUser, setCreatingUser] = useState(false);

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const [resEnt, resUsr, resVis, resSec] = await Promise.all([
        entrepriseService.getAll().catch(() => ({ entreprises: [] })),
        authService.getAllUsers().catch(() => ({ utilisateurs: [] })),
        visitService.getAll().catch(() => ({ visites: [] })),
        secteurService.getAll().catch(() => ({ secteurs: [] })),
      ]);

      const rawEnt = resEnt.entreprises || (Array.isArray(resEnt) ? resEnt : []);
      const rawUsr = resUsr.utilisateurs || (Array.isArray(resUsr) ? resUsr : []);
      const rawVis = resVis.visites || (Array.isArray(resVis) ? resVis : []);
      const rawSec = resSec.secteurs || (Array.isArray(resSec) ? resSec : []);

      setEntreprises(rawEnt);
      setUtilisateurs(rawUsr);
      setVisitesGlobales(rawVis);

      const activeSecteurs = rawSec.filter(s => s.statut === 'ACTIF').map(s => s.nom);
      const defaultSecteurs = ['Maritime / Logistique', 'Énergie', 'Télécommunications', 'Banque / Finance', 'Santé', 'Administration Publique', 'Industrie', 'Autre'];
      setSecteursOptions(Array.from(new Set([...activeSecteurs, ...defaultSecteurs])));

      if (isRefresh && notify) {
        notify('success', 'Données du tableau de bord actualisées avec succès.');
      }
    } catch (err) {
      console.error('Erreur chargement SuperAdmin:', err);
      if (notify) notify('error', 'Erreur lors du rafraîchissement des données.');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [notify]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Compute live real-time statistics
  const totalEntreprises = entreprises.length;
  const activeEntreprises = entreprises.filter(e => (e.statut || 'ACTIF') === 'ACTIF').length;
  const suspendedEntreprises = entreprises.filter(e => (e.statut || '') === 'SUSPENDU').length;

  const totalAdmins = utilisateurs.filter(u => String(u.role || '').toUpperCase() === 'ADMIN').length;
  const activeAdmins = utilisateurs.filter(u => String(u.role || '').toUpperCase() === 'ADMIN' && (u.statutCompte || u.statut || 'ACTIF') === 'ACTIF').length;

  const totalAgents = utilisateurs.filter(u => String(u.role || '').toUpperCase() === 'AGENT').length;
  const activeAgents = utilisateurs.filter(u => String(u.role || '').toUpperCase() === 'AGENT' && (u.statutCompte || u.statut || 'ACTIF') === 'ACTIF').length;

  const totalVisites = visitesGlobales.length;
  const ongoingVisites = visitesGlobales.filter(v => {
    const s = String(v.statut || '').toUpperCase();
    return s === 'EN_COURS' || s === 'PRESENT' || (!v.heureSortie && s !== 'SORTI' && s !== 'TERMINÉ');
  }).length;

  // Handler Création Entreprise
  const handleCreateEntreprise = async (e) => {
    e.preventDefault();
    if (!entForm.nom.trim()) {
      setEntErrors({ nom: 'Nom requis' });
      return;
    }
    
    setCreatingEnt(true);
    setEntErrors({});
    
    try {
      const codeGenerated = entForm.code.trim() ? entForm.code.trim().toUpperCase() : `ENT-${Date.now().toString().slice(-4)}`;
      await entrepriseService.create({
        nom: entForm.nom,
        code: codeGenerated,
        immatriculation: entForm.code,
        adresse: entForm.adresse,
        telephone: entForm.telephone,
        emailContact: entForm.emailContact,
        secteur: entForm.secteur || 'Maritime / Logistique',
        statut: entForm.statut || 'ACTIF',
        maxAdmins: Number(entForm.maxAdmins) || 5,
        maxAgents: Number(entForm.maxAgents) || 20,
      });

      if (notify) notify('success', `Entreprise "${entForm.nom}" créée avec succès.`);
      setShowCreateEntModal(false);
      setEntForm(DEFAULT_ENT_FORM);
      loadData(true);
    } catch (err) {
      setEntErrors({ global: err.message || 'Erreur lors de la création de l\'entreprise.' });
      if (notify) notify('error', err.message || 'Erreur lors de la création de l\'entreprise.');
    } finally {
      setCreatingEnt(false);
    }
  };

  // Handler Création Utilisateur
  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!userForm.nom.trim() || !userForm.email.trim() || !userForm.password.trim()) {
      setUserErrors({
        nom: !userForm.nom.trim() ? 'Nom requis' : '',
        email: !userForm.email.trim() ? 'Email requis' : '',
        password: !userForm.password.trim() ? 'Mot de passe requis' : ''
      });
      return;
    }

    setCreatingUser(true);
    setUserErrors({});

    try {
      await authService.createUser({
        nom: userForm.nom,
        prenom: userForm.prenom,
        email: userForm.email,
        password: userForm.password,
        role: userForm.role,
        entrepriseId: userForm.entrepriseId || null,
        telephone: userForm.telephone,
        poste: userForm.poste,
      });

      if (notify) notify('success', `Compte pour "${userForm.prenom || ''} ${userForm.nom}" créé avec succès.`);
      setShowCreateUserModal(false);
      setUserForm(DEFAULT_USER_FORM);
      loadData(true);
    } catch (err) {
      setUserErrors({ global: err.message || 'Erreur lors de la création du compte.' });
      if (notify) notify('error', err.message || 'Erreur lors de la création du compte.');
    } finally {
      setCreatingUser(false);
    }
  };

  // Handler Modification Statut Entreprise
  const handleChangeEntStatus = async (id, newStatus) => {
    try {
      await entrepriseService.changeStatus(id, newStatus);
      if (notify) notify('success', `Statut entreprise mis à jour (${newStatus}).`);
      loadData(true);
    } catch (err) {
      if (notify) notify('error', err.message || 'Erreur changement statut entreprise.');
    }
  };

  // Handler Modification Statut Utilisateur
  const handleChangeUserStatus = async (id, newStatus) => {
    try {
      await authService.toggleUserStatus(id, newStatus);
      if (notify) notify('success', `Statut utilisateur mis à jour (${newStatus}).`);
      loadData(true);
    } catch (err) {
      if (notify) notify('error', err.message || 'Erreur changement statut compte.');
    }
  };

  const filteredEntreprises = entreprises.filter(e =>
    (e.nom || '').toLowerCase().includes(searchEnt.toLowerCase()) ||
    (e.code || e.immatriculation || '').toLowerCase().includes(searchEnt.toLowerCase())
  );

  const filteredUsers = utilisateurs.filter(u => {
    const entId = u.entrepriseId?._id || u.entrepriseId;
    const matchSearch = `${u.nom || ''} ${u.prenom || ''} ${u.email || ''}`.toLowerCase().includes(searchUser.toLowerCase());
    const matchEnt = !filterEntId || String(entId) === String(filterEntId);
    const matchRole = !filterRole || u.role === filterRole;
    return matchSearch && matchEnt && matchRole;
  });

  return (
    <div className="space-y-6">
      {/* Header / Bandeau SuperAdmin */}
      <div className="bg-gradient-to-r from-slate-900 via-brand-blue-dark to-slate-900 text-white rounded-2xl p-6 shadow-xl border border-white/10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-brand-blue-bright/20 border border-brand-blue-bright/40 flex items-center justify-center text-brand-blue-bright shadow-inner">
              <ShieldAlert size={32} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-brand-red-bright/20 text-brand-red-bright border border-brand-red-bright/30">
                  Super Admin
                </span>
                <span className="text-xs text-slate-400">| Administration Globale</span>
              </div>
              <h1 className="text-2xl font-black tracking-tight mt-1">Espace SuperAdministrateur</h1>
              <p className="text-xs text-slate-300 mt-0.5">Gestion multi-entreprises, attribution des droits et supervision des accès.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Btn
              variant="ghost"
              size="sm"
              icon={RefreshCw}
              onClick={() => loadData(true)}
              loading={isRefreshing}
              className="text-white hover:bg-white/10"
            >
              Rafraîchir
            </Btn>
            <Btn
              variant="primary"
              size="sm"
              icon={Plus}
              onClick={() => {
                setEntForm(DEFAULT_ENT_FORM);
                setEntErrors({});
                setShowCreateEntModal(true);
              }}
            >
              Nouvelle Entreprise
            </Btn>
          </div>
        </div>

        {/* Cartes Statistiques Globales (Colorées & Dynamiques) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/10">
          {/* Card 1 : Entreprises (Bleu) */}
          <div className="bg-gradient-to-br from-blue-600/30 via-sky-600/20 to-blue-950/50 backdrop-blur-md rounded-2xl p-4 border border-blue-400/30 shadow-lg shadow-blue-500/10 flex flex-col justify-between hover:scale-[1.02] transition-all duration-300">
            <div className="flex items-center justify-between text-blue-200 mb-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-blue-200/90">Entreprises</span>
              <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-400/40 flex items-center justify-center text-blue-300 shadow-inner">
                <Building2 size={20} />
              </div>
            </div>
            <p className="text-3xl font-black text-white tracking-tight">{totalEntreprises}</p>
            <p className="text-[10px] text-blue-100/90 mt-2 font-bold flex items-center gap-1.5 flex-wrap">
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-extrabold">{activeEntreprises} active(s)</span>
              {suspendedEntreprises > 0 && <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 font-extrabold">• {suspendedEntreprises} suspendue(s)</span>}
            </p>
          </div>

          {/* Card 2 : Admins Boîtes (Violet) */}
          <div className="bg-gradient-to-br from-purple-600/30 via-indigo-600/20 to-purple-950/50 backdrop-blur-md rounded-2xl p-4 border border-purple-400/30 shadow-lg shadow-purple-500/10 flex flex-col justify-between hover:scale-[1.02] transition-all duration-300">
            <div className="flex items-center justify-between text-purple-200 mb-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-purple-200/90">Admins Boîtes</span>
              <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-400/40 flex items-center justify-center text-purple-300 shadow-inner">
                <Shield size={20} />
              </div>
            </div>
            <p className="text-3xl font-black text-white tracking-tight">{totalAdmins}</p>
            <p className="text-[10px] text-purple-100/90 mt-2 font-bold">
              <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/30 font-extrabold">{activeAdmins} compte(s) actif(s)</span>
            </p>
          </div>

          {/* Card 3 : Agents Sécurité (Émeraude / Vert) */}
          <div className="bg-gradient-to-br from-emerald-600/30 via-teal-600/20 to-emerald-950/50 backdrop-blur-md rounded-2xl p-4 border border-emerald-400/30 shadow-lg shadow-emerald-500/10 flex flex-col justify-between hover:scale-[1.02] transition-all duration-300">
            <div className="flex items-center justify-between text-emerald-200 mb-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-emerald-200/90">Agents Sécurité</span>
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 shadow-inner">
                <Users size={20} />
              </div>
            </div>
            <p className="text-3xl font-black text-white tracking-tight">{totalAgents}</p>
            <p className="text-[10px] text-emerald-100/90 mt-2 font-bold">
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-extrabold">{activeAgents} agent(s) actif(s)</span>
            </p>
          </div>

          {/* Card 4 : Visites Globales (Ambre / Orange) */}
          <div className="bg-gradient-to-br from-amber-600/30 via-orange-600/20 to-amber-950/50 backdrop-blur-md rounded-2xl p-4 border border-amber-400/30 shadow-lg shadow-amber-500/10 flex flex-col justify-between hover:scale-[1.02] transition-all duration-300">
            <div className="flex items-center justify-between text-amber-200 mb-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-amber-200/90">Visites Globales</span>
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 shadow-inner">
                <CheckCircle2 size={20} />
              </div>
            </div>
            <p className="text-3xl font-black text-white tracking-tight">{totalVisites}</p>
            <p className="text-[10px] text-amber-100/90 mt-2 font-bold">
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 font-extrabold">{ongoingVisites} actuellement sur site</span>
            </p>
          </div>
        </div>
      </div>

      {/* Bar d'onglets */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto max-w-full whitespace-nowrap scrollbar-none">
        <button
          onClick={() => setActiveTab('entreprises')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all shrink-0 ${
            activeTab === 'entreprises'
              ? 'bg-brand-blue-bright text-white shadow-lg shadow-brand-blue-bright/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Building2 size={16} /> Entreprises / Boîtes ({entreprises.length})
        </button>
        <button
          onClick={() => setActiveTab('utilisateurs')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all shrink-0 ${
            activeTab === 'utilisateurs'
              ? 'bg-brand-blue-bright text-white shadow-lg shadow-brand-blue-bright/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Users size={16} /> Utilisateurs ({utilisateurs.length})
        </button>
        <button
          onClick={() => setActiveTab('historique')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all shrink-0 ${
            activeTab === 'historique'
              ? 'bg-brand-blue-bright text-white shadow-lg shadow-brand-blue-bright/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Eye size={16} /> Historique Global ({visitesGlobales.length})
        </button>
      </div>

      {/* CONTENU ONGLET 1 : ENTREPRISES */}
      {activeTab === 'entreprises' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-72">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder={t?.search_entreprise || "Rechercher une entreprise (Nom, NINEA, secteur...)"}
                value={searchEnt}
                onChange={e => setSearchEnt(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
              />
            </div>
            <Btn variant="primary" size="sm" icon={Plus} onClick={() => setShowCreateEntModal(true)}>
              Créer une Boîte / Entreprise
            </Btn>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 w-full">
            <table className="w-full min-w-[700px] table-fixed text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[10px] font-black text-slate-500 uppercase tracking-wider">
                  <th className="py-2.5 px-3 w-[22%]">Code & Entreprise</th>
                  <th className="py-2.5 px-2 w-[14%]">Secteur</th>
                  <th className="py-2.5 px-2 w-[18%]">Contact</th>
                  <th className="py-2.5 px-2 w-[7%]">Admins</th>
                  <th className="py-2.5 px-2 w-[7%]">Agents</th>
                  <th className="py-2.5 px-2 w-[7%]">Visites</th>
                  <th className="py-2.5 px-2 w-[11%]">Statut</th>
                  <th className="py-2.5 px-3 w-[14%] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {filteredEntreprises.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      Aucune entreprise trouvée.
                    </td>
                  </tr>
                ) : (
                  filteredEntreprises.map((ent) => (
                    <tr key={ent._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white min-w-0 overflow-hidden">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="px-1.5 py-0.5 rounded bg-brand-blue-bright/10 text-brand-blue-bright font-mono text-[9px] uppercase font-black border border-brand-blue-bright/20 shrink-0">
                            {ent.code}
                          </span>
                          <span className="truncate text-xs">{ent.nom}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-2 text-slate-600 dark:text-slate-300 font-bold min-w-0 overflow-hidden">
                        <p className="truncate text-xs">{ent.secteur || 'Maritime / Logistique'}</p>
                      </td>
                      <td className="py-2.5 px-2 text-slate-600 dark:text-slate-300 min-w-0 overflow-hidden">
                        <p className="truncate text-xs">{ent.telephone || '—'}</p>
                        <p className="text-[10px] text-slate-400 truncate">{ent.emailContact}</p>
                      </td>
                      <td className="py-2.5 px-2 font-bold text-purple-600 dark:text-purple-400 min-w-0">{ent.nbAdmins || 0}</td>
                      <td className="py-2.5 px-2 font-bold text-brand-green-bright min-w-0">{ent.nbAgents || 0}</td>
                      <td className="py-2.5 px-2 font-bold text-slate-700 dark:text-slate-300 min-w-0">{ent.nbVisites || 0}</td>
                      <td className="py-2.5 px-2 min-w-0 overflow-hidden">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider max-w-full ${
                          ent.statut === 'ACTIF' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' :
                          ent.statut === 'SUSPENDU' ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20' :
                          'bg-rose-500/10 text-rose-600 border border-rose-500/20'
                        }`}>
                          <span className="truncate">{ent.statut}</span>
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right min-w-0 overflow-hidden">
                        <div className="flex items-center justify-end gap-1 shrink-0">
                          {ent.statut !== 'ACTIF' && (
                            <button
                              onClick={() => handleChangeEntStatus(ent._id, 'ACTIF')}
                              className="p-1.5 rounded-lg text-emerald-700 bg-emerald-500/10 hover:bg-emerald-500/20 transition-all shrink-0"
                              title="Activer"
                            >
                              <UserCheck size={13} />
                            </button>
                          )}
                          {ent.statut !== 'SUSPENDU' && (
                            <button
                              onClick={() => handleChangeEntStatus(ent._id, 'SUSPENDU')}
                              className="p-1.5 rounded-lg text-amber-700 bg-amber-500/10 hover:bg-amber-500/20 transition-all shrink-0"
                              title="Suspendre"
                            >
                              <AlertCircle size={13} />
                            </button>
                          )}
                          {ent.statut !== 'DESACTIVE' && (
                            <button
                              onClick={() => handleChangeEntStatus(ent._id, 'DESACTIVE')}
                              className="p-1.5 rounded-lg text-rose-700 bg-rose-500/10 hover:bg-rose-500/20 transition-all shrink-0"
                              title="Désactiver"
                            >
                              <UserX size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CONTENU ONGLET 2 : UTILISATEURS */}
      {activeTab === 'utilisateurs' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative w-full sm:w-64">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder={t?.search_compte || "Rechercher un utilisateur (Nom, email...)"}
                  value={searchUser}
                  onChange={e => setSearchUser(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <select
                value={filterEntId}
                onChange={e => setFilterEntId(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
              >
                <option value="">Toutes les Entreprises</option>
                {entreprises.map(e => (
                  <option key={e._id} value={e._id}>{e.nom} ({e.code})</option>
                ))}
              </select>

              <select
                value={filterRole}
                onChange={e => setFilterRole(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
              >
                <option value="">Tous les Rôles</option>
                <option value="SUPER_ADMIN">Super Admin</option>
                <option value="ADMIN">Admin de boîte</option>
                <option value="AGENT">Agent de sécurité</option>
              </select>
            </div>

            <Btn variant="primary" size="sm" icon={UserPlus} onClick={() => setShowCreateUserModal(true)}>
              Créer un Compte
            </Btn>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 w-full">
            <table className="w-full min-w-[700px] table-fixed text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[10px] font-black text-slate-500 uppercase tracking-wider">
                  <th className="py-2.5 px-3 w-[25%]">Utilisateur</th>
                  <th className="py-2.5 px-2 w-[12%]">Rôle</th>
                  <th className="py-2.5 px-2 w-[22%]">Entreprise</th>
                  <th className="py-2.5 px-2 w-[14%]">Téléphone / Poste</th>
                  <th className="py-2.5 px-2 w-[12%]">Statut Compte</th>
                  <th className="py-2.5 px-3 w-[15%] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      Aucun utilisateur trouvé.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    const ent = u.entrepriseId;
                    const entName = typeof ent === 'object' && ent ? `${ent.nom} (${ent.code})` : 'Global / SuperAdmin';
                    const statut = u.statutCompte || (u.isActif ? 'ACTIF' : 'DESACTIVE');

                    return (
                      <tr key={u._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-2.5 px-3 min-w-0 overflow-hidden">
                          <p className="font-bold text-slate-900 dark:text-white truncate text-xs">{u.prenom} {u.nom}</p>
                          <p className="text-[10px] text-slate-400 font-mono truncate">{u.email}</p>
                        </td>
                        <td className="py-2.5 px-2 font-bold min-w-0 overflow-hidden">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase inline-block truncate max-w-full ${
                            u.role === 'SUPER_ADMIN' || u.role === 'SUPERADMIN' ? 'bg-red-500/10 text-red-600 border border-red-500/20' :
                            u.role === 'ADMIN' ? 'bg-purple-500/10 text-purple-600 border border-purple-500/20' :
                            'bg-blue-500/10 text-blue-600 border border-blue-500/20'
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="py-2.5 px-2 font-medium text-slate-700 dark:text-slate-300 min-w-0 overflow-hidden">
                          <p className="truncate text-xs">{entName}</p>
                        </td>
                        <td className="py-2.5 px-2 text-slate-600 dark:text-slate-400 min-w-0 overflow-hidden">
                          <p className="truncate text-xs">{u.telephone || '-'}</p>
                          <p className="text-[10px] text-slate-400 truncate">{u.poste || u.departement || '-'}</p>
                        </td>
                        <td className="py-2.5 px-2 min-w-0 overflow-hidden">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider max-w-full ${
                            statut === 'ACTIF' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' :
                            statut === 'SUSPENDU' ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20' :
                            'bg-rose-500/10 text-rose-600 border border-rose-500/20'
                          }`}>
                            <span className="truncate">{statut}</span>
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right min-w-0 overflow-hidden">
                          <div className="flex items-center justify-end gap-1 shrink-0">
                            {statut !== 'ACTIF' && (
                              <button
                                onClick={() => handleChangeUserStatus(u._id, 'ACTIF')}
                                className="p-1.5 rounded-lg text-emerald-700 bg-emerald-500/10 hover:bg-emerald-500/20 transition-all shrink-0"
                                title="Activer"
                              >
                                <UserCheck size={13} />
                              </button>
                            )}
                            {statut !== 'SUSPENDU' && (
                              <button
                                onClick={() => handleChangeUserStatus(u._id, 'SUSPENDU')}
                                className="p-1.5 rounded-lg text-amber-700 bg-amber-500/10 hover:bg-amber-500/20 transition-all shrink-0"
                                title="Suspendre"
                              >
                                <AlertCircle size={13} />
                              </button>
                            )}
                            {statut !== 'DESACTIVE' && (
                              <button
                                onClick={() => handleChangeUserStatus(u._id, 'DESACTIVE')}
                                className="p-1.5 rounded-lg text-rose-700 bg-rose-500/10 hover:bg-rose-500/20 transition-all shrink-0"
                                title="Désactiver"
                              >
                                <UserX size={13} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CONTENU ONGLET 3 : HISTORIQUE GLOBAL */}
      {activeTab === 'historique' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black uppercase text-slate-900 dark:text-white">Historique Général des Enregistrements</h2>
            <span className="text-xs font-bold text-slate-500">{visitesGlobales.length} passages enregistrés</span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 w-full">
            <table className="w-full min-w-[700px] table-fixed text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[10px] font-black text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-3 w-[18%]">Date & Heure</th>
                  <th className="py-3 px-3 w-[22%]">Visiteur</th>
                  <th className="py-3 px-3 w-[18%]">Pièce & N°</th>
                  <th className="py-3 px-3 w-[18%]">Entreprise</th>
                  <th className="py-3 px-3 w-[14%]">Agent Créateur</th>
                  <th className="py-3 px-3 w-[10%]">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-bold">
                {visitesGlobales.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      Aucune visite enregistrée pour le moment.
                    </td>
                  </tr>
                ) : (
                  visitesGlobales.map((v) => {
                    const vis = v.visiteurId || {};
                    const agent = v.agentId || {};
                    const ent = v.entrepriseId || {};

                    return (
                      <tr key={v._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-3 text-slate-600 dark:text-slate-400 min-w-0 overflow-hidden truncate">
                          {new Date(v.heureEntree || v.createdAt).toLocaleString('fr-FR')}
                        </td>
                        <td className="py-3 px-3 font-bold text-slate-900 dark:text-white min-w-0 overflow-hidden truncate">
                          {vis.prenom} {vis.nom}
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-600 dark:text-slate-300 min-w-0 overflow-hidden truncate">
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-bold mr-1">
                            {vis.typePiece || 'CNI'}
                          </span>
                          {vis.numeroPiece || vis.nin || '-'}
                        </td>
                        <td className="py-3 px-3 font-bold text-brand-blue-bright min-w-0 overflow-hidden truncate">
                          {ent.nom ? `${ent.nom} (${ent.code})` : 'Global'}
                        </td>
                        <td className="py-3 px-3 text-slate-700 dark:text-slate-300 min-w-0 overflow-hidden truncate">
                          {agent.prenom || agent.nom ? `${agent.prenom || ''} ${agent.nom || ''}`.trim() : 'Scanner QR / Inconnu'}
                        </td>
                        <td className="py-3 px-3 min-w-0 overflow-hidden">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase inline-block truncate max-w-full ${
                            v.statut === 'EN_COURS' ? 'bg-amber-500/10 text-amber-600' : 'bg-emerald-500/10 text-emerald-600'
                          }`}>
                            {v.statut === 'EN_COURS' ? 'En Cours' : 'Terminé'}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL CRÉATION ENTREPRISE */}
      {showCreateEntModal && (
        <Modal title="Créer une nouvelle Boîte / Entreprise" onClose={() => setShowCreateEntModal(false)}>
          <form onSubmit={handleCreateEntreprise} className="space-y-4">
            {entErrors.global && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-600 rounded-xl text-xs font-bold">
                {entErrors.global}
              </div>
            )}
            <FormInput
              label="Nom de l'entreprise *"
              value={entForm.nom}
              onChange={e => setEntForm({ ...entForm, nom: e.target.value })}
              error={entErrors.nom}
              placeholder="ex: Port Autonome de Dakar"
            />
            <FormInput
              label="Code Unique / NINEA *"
              value={entForm.code}
              onChange={e => setEntForm({ ...entForm, code: e.target.value.toUpperCase() })}
              error={entErrors.code}
              placeholder="ex: SN-DKR-2025-B-1234"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormInput
                label="Email de Contact"
                type="email"
                value={entForm.emailContact}
                onChange={e => setEntForm({ ...entForm, emailContact: e.target.value })}
                placeholder="contact@entreprise.sn"
              />
              <FormInput
                label="Téléphone"
                value={entForm.telephone}
                onChange={e => setEntForm({ ...entForm, telephone: e.target.value })}
                placeholder="+221 33 000 00 00"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormSelect
                label="Secteur d'Activité"
                value={entForm.secteur}
                onChange={e => setEntForm({ ...entForm, secteur: e.target.value })}
                options={secteursOptions.length > 0 ? secteursOptions : ['Maritime / Logistique', 'Énergie', 'Télécommunications', 'Banque / Finance', 'Santé', 'Administration Publique', 'Industrie', 'Autre']}
              />
              <FormSelect
                label="Statut Initial"
                value={entForm.statut}
                onChange={e => setEntForm({ ...entForm, statut: e.target.value })}
                options={[{ value: 'ACTIF', label: 'Actif' }, { value: 'SUSPENDU', label: 'Suspendu' }]}
              />
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
              <p className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Shield size={13} className="text-brand-blue-bright" /> Quotas & Limites d'Utilisateurs
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormInput
                  label="Nombre Max d'Admins"
                  type="number"
                  min="1"
                  value={entForm.maxAdmins}
                  onChange={e => setEntForm({ ...entForm, maxAdmins: e.target.value })}
                />
                <FormInput
                  label="Nombre Max d'Agents"
                  type="number"
                  min="1"
                  value={entForm.maxAgents}
                  onChange={e => setEntForm({ ...entForm, maxAgents: e.target.value })}
                />
              </div>
            </div>

            <FormInput
              label="Adresse Siège Social"
              value={entForm.adresse}
              onChange={e => setEntForm({ ...entForm, adresse: e.target.value })}
              placeholder="ex: Plateau, Dakar"
            />

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
              <Btn variant="ghost" size="sm" onClick={() => setShowCreateEntModal(false)} type="button">Annuler</Btn>
              <Btn variant="primary" size="sm" type="submit" loading={creatingEnt}>Valider & Créer l'Entreprise</Btn>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL CRÉATION UTILISATEUR */}
      {showCreateUserModal && (
        <Modal title="Créer un nouveau Compte Utilisateur" onClose={() => setShowCreateUserModal(false)}>
          <form onSubmit={handleCreateUser} className="space-y-4">
            {userErrors.global && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-600 rounded-xl text-xs font-bold">
                {userErrors.global}
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <FormInput
                label="Prénom"
                value={userForm.prenom}
                onChange={e => setUserForm({ ...userForm, prenom: e.target.value })}
                placeholder="Prénom"
              />
              <FormInput
                label="Nom *"
                value={userForm.nom}
                onChange={e => setUserForm({ ...userForm, nom: e.target.value })}
                error={userErrors.nom}
                placeholder="Nom"
              />
            </div>
            <FormInput
              label="Email professionnel *"
              type="email"
              value={userForm.email}
              onChange={e => setUserForm({ ...userForm, email: e.target.value })}
              error={userErrors.email}
              placeholder="nom@entreprise.sn"
            />
            <FormInput
              label="Mot de passe *"
              type="password"
              value={userForm.password}
              onChange={e => setUserForm({ ...userForm, password: e.target.value })}
              error={userErrors.password}
              placeholder="••••••••"
            />

            <div className="grid grid-cols-2 gap-4">
              <FormSelect
                label="Rôle *"
                value={userForm.role}
                onChange={e => setUserForm({ ...userForm, role: e.target.value })}
                options={[
                  { value: 'ADMIN', label: 'Admin de boîte' },
                  { value: 'AGENT', label: 'Agent de sécurité' },
                  { value: 'SUPER_ADMIN', label: 'Super Admin' },
                ]}
              />

              <FormSelect
                label="Rattachement Entreprise"
                value={userForm.entrepriseId}
                onChange={e => setUserForm({ ...userForm, entrepriseId: e.target.value })}
                options={[
                  { value: '', label: 'Aucune (Global)' },
                  ...entreprises.map(e => ({ value: e._id || e.id, label: `${e.nom} (${e.code || e.immatriculation || '—'})` }))
                ]}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
              <Btn variant="ghost" size="sm" onClick={() => setShowCreateUserModal(false)} type="button">Annuler</Btn>
              <Btn variant="primary" size="sm" type="submit" loading={creatingUser}>Créer le Compte</Btn>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
