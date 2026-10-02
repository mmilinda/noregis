import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Building2, Users, ShieldAlert, Shield, CheckCircle2, XCircle, AlertTriangle,
  Plus, Search, Filter, RefreshCw, KeyRound, Lock, Eye, Building, Phone, Mail, MapPin,
  UserPlus, UserCheck, UserX, AlertCircle, TrendingUp, BarChart2, PieChart, Activity, Calendar,
  PieChart as DonutIcon, Layers, FileText, CheckCircle
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
  const { state, notify } = useApp();
  const [activeTab, setActiveTab] = useState('analytique'); // 'analytique' | 'entreprises' | 'utilisateurs' | 'historique'
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [hoveredPointHist, setHoveredPointHist] = useState(null);

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
  const [searchVisits, setSearchVisits] = useState('');
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

      const rawEnt = resEnt.entreprises || resEnt.data || (Array.isArray(resEnt) ? resEnt : []);
      const rawUsr = resUsr.utilisateurs || resUsr.users || resUsr.data || (Array.isArray(resUsr) ? resUsr : []);
      const rawVis = resVis.visites || resVis.visits || resVis.data || (Array.isArray(resVis) ? resVis : []);
      const rawSec = resSec.secteurs || resSec.data || (Array.isArray(resSec) ? resSec : []);

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

  // 📈 DONNÉES RÉELLES 1 : Évolution des visites sur 7 jours
  const last7DaysData = useMemo(() => {
    const result = [];
    const now = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateKey = d.toISOString().split('T')[0];
      const dayLabel = d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' });

      const count = visitesGlobales.filter(v => {
        const rawDate = v.heureEntree || v.dateEntree || v.createdAt || v.date;
        if (!rawDate) return false;
        const parsed = new Date(rawDate);
        if (isNaN(parsed.getTime())) return false;
        return parsed.toISOString().split('T')[0] === dateKey;
      }).length;

      result.push({ dateKey, dayLabel, count });
    }
    return result;
  }, [visitesGlobales]);

  // SVG Line Chart points
  const lineChartPoints = useMemo(() => {
    const counts = last7DaysData.map(d => d.count);
    const maxVal = Math.max(...counts, 4);
    const width = 600;
    const height = 180;
    const padding = 30;

    const points = last7DaysData.map((d, index) => {
      const x = padding + (index / (last7DaysData.length - 1)) * (width - 2 * padding);
      const y = height - padding - (d.count / maxVal) * (height - 2 * padding);
      return { x, y, label: d.dayLabel, count: d.count, dateKey: d.dateKey };
    });

    const pathData = points.reduce((acc, p, idx) => {
      return acc + `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y} `;
    }, '');

    const areaPathData = pathData + 
      `L ${points[points.length - 1].x} ${height - padding} ` + 
      `L ${points[0].x} ${height - padding} Z`;

    return { points, pathData, areaPathData, width, height, padding, maxVal };
  }, [last7DaysData]);

  // 📊 DONNÉES RÉELLES 2 : Visites par Entreprise
  const topEntreprisesData = useMemo(() => {
    const map = {};
    entreprises.forEach(e => {
      map[e._id || e.id] = { id: e._id || e.id, nom: e.nom, code: e.code, count: 0 };
    });

    visitesGlobales.forEach(v => {
      const ent = v.entrepriseId;
      const entId = typeof ent === 'object' && ent ? (ent._id || ent.id) : ent;
      if (entId && map[entId]) {
        map[entId].count++;
      }
    });

    const list = Object.values(map).sort((a, b) => b.count - a.count);
    const maxCount = Math.max(...list.map(l => l.count), 1);
    return { list: list.slice(0, 5), maxCount, total: visitesGlobales.length };
  }, [entreprises, visitesGlobales]);

  // ⏰ DONNÉES RÉELLES 3 : Distribution par Heures (8h - 20h)
  const hourlyDistribution = useMemo(() => {
    const hours = [8, 10, 12, 14, 16, 18, 20];
    const counts = { 8: 0, 10: 0, 12: 0, 14: 0, 16: 0, 18: 0, 20: 0 };

    visitesGlobales.forEach(v => {
      const rawDate = v.heureEntree || v.dateEntree || v.createdAt || v.date;
      if (rawDate) {
        const d = new Date(rawDate);
        if (!isNaN(d.getTime())) {
          const h = d.getHours();
          if (h >= 7 && h < 9) counts[8]++;
          else if (h >= 9 && h < 11) counts[10]++;
          else if (h >= 11 && h < 13) counts[12]++;
          else if (h >= 13 && h < 15) counts[14]++;
          else if (h >= 15 && h < 17) counts[16]++;
          else if (h >= 17 && h < 19) counts[18]++;
          else if (h >= 19) counts[20]++;
        }
      }
    });

    const maxVal = Math.max(...Object.values(counts), 1);
    return hours.map(h => ({
      label: `${h}h - ${h+2}h`,
      count: counts[h] || 0,
      percentage: Math.round(((counts[h] || 0) / maxVal) * 100),
    }));
  }, [visitesGlobales]);

  // 🍩 DONNÉES RÉELLES 4 : Répartition des Rôles & Statuts des Comptes
  const userRoleStats = useMemo(() => {
    const superAdmins = utilisateurs.filter(u => String(u.role).toUpperCase() === 'SUPERADMIN' || String(u.role).toUpperCase() === 'SUPER_ADMIN').length;
    const admins = utilisateurs.filter(u => String(u.role).toUpperCase() === 'ADMIN').length;
    const agents = utilisateurs.filter(u => String(u.role).toUpperCase() === 'AGENT').length;
    const active = utilisateurs.filter(u => (u.statutCompte || u.statut || 'ACTIF') === 'ACTIF').length;
    const suspended = utilisateurs.filter(u => (u.statutCompte || u.statut) === 'SUSPENDU' || (u.statutCompte || u.statut) === 'DESACTIVE').length;

    return { superAdmins, admins, agents, active, suspended, total: utilisateurs.length };
  }, [utilisateurs]);

  // 🏢 DONNÉES RÉELLES ONGLET ENTREPRISES : Secteurs & Quotas
  const secteurStats = useMemo(() => {
    const map = {};
    entreprises.forEach(e => {
      const s = e.secteur || 'Maritime / Logistique';
      map[s] = (map[s] || 0) + 1;
    });
    const sorted = Object.entries(map).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
    const maxCount = Math.max(...sorted.map(s => s.count), 1);
    return { list: sorted, maxCount, total: entreprises.length };
  }, [entreprises]);

  const quotaStats = useMemo(() => {
    let maxAdminsTotal = 0;
    let maxAgentsTotal = 0;
    entreprises.forEach(e => {
      maxAdminsTotal += Number(e.maxAdmins) || 5;
      maxAgentsTotal += Number(e.maxAgents) || 20;
    });

    return {
      usedAdmins: totalAdmins,
      maxAdmins: maxAdminsTotal,
      usedAgents: totalAgents,
      maxAgents: maxAgentsTotal,
      adminPercent: Math.round((totalAdmins / Math.max(maxAdminsTotal, 1)) * 100),
      agentPercent: Math.round((totalAgents / Math.max(maxAgentsTotal, 1)) * 100),
    };
  }, [entreprises, totalAdmins, totalAgents]);

  // 👁️ DONNÉES RÉELLES ONGLET HISTORIQUE : Types de pièces & Statuts
  const visitPieceStats = useMemo(() => {
    const map = {};
    visitesGlobales.forEach(v => {
      const vis = v.visiteurId || {};
      const piece = (vis.typePiece || 'CNI').toUpperCase();
      map[piece] = (map[piece] || 0) + 1;
    });
    const list = Object.entries(map).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
    const maxCount = Math.max(...list.map(l => l.count), 1);
    return { list, maxCount, total: visitesGlobales.length };
  }, [visitesGlobales]);

  // Handlers
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
      await authService.register({
        nom: userForm.nom,
        prenom: userForm.prenom,
        email: userForm.email,
        password: userForm.password,
        role: userForm.role || 'ADMIN',
        entrepriseId: userForm.entrepriseId || null,
        telephone: userForm.telephone,
        poste: userForm.poste,
      });

      if (notify) notify('success', `Utilisateur "${userForm.prenom} ${userForm.nom}" créé avec succès.`);
      setShowCreateUserModal(false);
      setUserForm(DEFAULT_USER_FORM);
      loadData(true);
    } catch (err) {
      setUserErrors({ global: err.message || 'Erreur lors de la création de l\'utilisateur.' });
      if (notify) notify('error', err.message || 'Erreur lors de la création de l\'utilisateur.');
    } finally {
      setCreatingUser(false);
    }
  };

  const handleChangeEntStatus = async (id, newStatut) => {
    try {
      await entrepriseService.updateStatus(id, newStatut);
      if (notify) notify('success', `Statut entreprise mis à jour en ${newStatut}.`);
      loadData(true);
    } catch (err) {
      if (notify) notify('error', 'Erreur changement de statut entreprise.');
    }
  };

  const handleChangeUserStatus = async (id, newStatut) => {
    try {
      await authService.updateUserStatus(id, newStatut);
      if (notify) notify('success', `Statut compte utilisateur mis à jour en ${newStatut}.`);
      loadData(true);
    } catch (err) {
      if (notify) notify('error', 'Erreur changement de statut utilisateur.');
    }
  };

  // Filtered lists for sub-tabs
  const globalQuery = (state.searchQuery || '').trim().toLowerCase();

  const filteredEntreprises = entreprises.filter(e => {
    const q = searchEnt.trim().toLowerCase() || globalQuery;
    if (!q) return true;
    return (e.nom || '').toLowerCase().includes(q) || (e.code || '').toLowerCase().includes(q) || (e.secteur || '').toLowerCase().includes(q);
  });

  const filteredUsers = utilisateurs.filter(u => {
    const q = searchUser.trim().toLowerCase() || globalQuery;
    const matchQuery = !q || (u.nom || '').toLowerCase().includes(q) || (u.prenom || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q);
    const entId = u.entrepriseId?._id || u.entrepriseId;
    const matchEnt = !filterEntId || String(entId) === String(filterEntId);
    const matchRole = !filterRole || String(u.role).toUpperCase() === String(filterRole).toUpperCase();
    return matchQuery && matchEnt && matchRole;
  });

  const filteredVisitesGlobales = visitesGlobales.filter(v => {
    const q = searchVisits.trim().toLowerCase() || globalQuery;
    if (!q) return true;
    const vis = v.visiteurId || {};
    const agent = v.agentId || {};
    const ent = v.entrepriseId || {};
    const fields = [
      vis.nom, vis.prenom, vis.numeroPiece, vis.nin, vis.telephone,
      v.personneVisitee, v.service, v.motif,
      agent.nom, agent.prenom, agent.email,
      ent.nom, ent.code
    ];
    return fields.filter(Boolean).some(f => String(f).toLowerCase().includes(q));
  });

  return (
    <div className="p-4 lg:p-8 w-full max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
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
              <p className="text-xs text-slate-300 mt-0.5">Gestion multi-entreprises, supervision analytique et attribution des droits.</p>
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

        {/* Cartes Statistiques Globales */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/10">
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
          onClick={() => setActiveTab('analytique')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all shrink-0 ${
            activeTab === 'analytique'
              ? 'bg-brand-blue-bright text-white shadow-lg shadow-brand-blue-bright/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Activity size={16} /> 📊 Analytique & Graphiques
        </button>
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

      {/* 📊 CONTENU ONGLET 1 : GRAPHIQUES ET ANALYTIQUE EN TEMPS RÉEL */}
      {activeTab === 'analytique' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Rangée 1 : Courbe 7 jours + Top Entreprises */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Graphique 1 : Courbe d'évolution SVG sur 7 jours */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <TrendingUp className="text-brand-blue-bright" size={20} />
                    Évolution Globale des Passages (7 Derniers Jours)
                  </h3>
                  <p className="text-xs text-slate-400 font-bold mt-0.5">Données réelles agrégées pour l'ensemble du réseau NoRegis</p>
                </div>
                <span className="px-3 py-1 rounded-full bg-blue-500/10 text-brand-blue-bright text-xs font-black uppercase">
                  Temps Réel
                </span>
              </div>

              {loading ? (
                <div className="h-48 flex items-center justify-center">
                  <span className="w-8 h-8 border-3 border-brand-blue-bright border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative w-full">
                    <svg 
                      viewBox={`0 0 ${lineChartPoints.width} ${lineChartPoints.height}`}
                      className="w-full h-48 overflow-visible"
                    >
                      <defs>
                        <linearGradient id="superAdminGradComp" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.3" />
                          <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>

                      {/* Lignes de grille */}
                      {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                        const y = lineChartPoints.padding + ratio * (lineChartPoints.height - 2 * lineChartPoints.padding);
                        return (
                          <line 
                            key={idx}
                            x1={lineChartPoints.padding} 
                            y1={y} 
                            x2={lineChartPoints.width - lineChartPoints.padding} 
                            y2={y} 
                            stroke="#E2E8F0" 
                            strokeDasharray="4 4"
                            className="dark:stroke-slate-800"
                          />
                        );
                      })}

                      {/* Aire */}
                      <path 
                        d={lineChartPoints.areaPathData} 
                        fill="url(#superAdminGradComp)" 
                      />

                      {/* Courbe */}
                      <path 
                        d={lineChartPoints.pathData} 
                        fill="none" 
                        stroke="#3B82F6" 
                        strokeWidth="3.5" 
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />

                      {/* Points */}
                      {lineChartPoints.points.map((p, idx) => (
                        <g key={idx} className="cursor-pointer group" onMouseEnter={() => setHoveredPoint(p)} onMouseLeave={() => setHoveredPoint(null)}>
                          <circle 
                            cx={p.x} 
                            cy={p.y} 
                            r="5" 
                            fill="#3B82F6" 
                            stroke="#FFFFFF"
                            strokeWidth="2"
                            className="transition-transform duration-200 group-hover:scale-150"
                          />
                          <text 
                            x={p.x} 
                            y={lineChartPoints.height - 5} 
                            textAnchor="middle" 
                            className="text-[10px] font-bold fill-slate-400 uppercase"
                          >
                            {p.label}
                          </text>
                        </g>
                      ))}
                    </svg>

                    {/* Tooltip */}
                    {hoveredPoint && (
                      <div 
                        className="absolute bg-slate-900 text-white text-xs rounded-lg px-3 py-1.5 shadow-xl font-bold border border-slate-700 pointer-events-none transform -translate-x-1/2 -translate-y-12 transition-all z-20"
                        style={{
                          left: `${(hoveredPoint.x / lineChartPoints.width) * 100}%`,
                          top: `${(hoveredPoint.y / lineChartPoints.height) * 100}%`
                        }}
                      >
                        <p className="text-[10px] text-slate-400 font-mono">{hoveredPoint.dateKey}</p>
                        <p className="text-brand-blue-bright font-black">{hoveredPoint.count} passage(s)</p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-500">
                    <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                      <TrendingUp size={16} /> Flux réel en direct
                    </span>
                    <span>Total 7j : <strong className="text-slate-900 dark:text-white">{last7DaysData.reduce((acc, d) => acc + d.count, 0)}</strong> visites</span>
                  </div>
                </div>
              )}
            </div>

            {/* Graphique 2 : Volume par Entreprise */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2 mb-1">
                  <Building2 className="text-purple-500" size={20} />
                  Top Entreprises par Visites
                </h3>
                <p className="text-xs text-slate-400 font-bold mb-4">Volume des passages rattachés à chaque boîte</p>

                <div className="space-y-3.5">
                  {topEntreprisesData.list.length > 0 ? (
                    topEntreprisesData.list.map((ent, idx) => {
                      const percent = Math.round((ent.count / (topEntreprisesData.total || 1)) * 100);
                      const barWidth = Math.round((ent.count / topEntreprisesData.maxCount) * 100);
                      return (
                        <div key={ent.id || idx} className="space-y-1">
                          <div className="flex justify-between items-center text-xs font-bold">
                            <span className="text-slate-800 dark:text-slate-200 truncate max-w-[170px]">{ent.nom}</span>
                            <span className="text-brand-blue-bright font-black">{ent.count} <span className="text-[10px] text-slate-400 font-normal">({percent}%)</span></span>
                          </div>
                          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                            <div 
                              className="bg-gradient-to-r from-brand-blue to-purple-500 h-full rounded-full transition-all duration-500"
                              style={{ width: `${Math.max(barWidth, 5)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-center text-slate-400 text-xs py-8">Aucune donnée de visite pour le moment.</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Rangée 2 : Fréquentation par heure + Santé des Comptes */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Graphique 3 : Fréquentation Horaire */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2 mb-1">
                <BarChart2 className="text-emerald-500" size={20} />
                Fréquentation par Tranche Horaire
              </h3>
              <p className="text-xs text-slate-400 font-bold mb-4">Pic d'affluence des visites enregistrées (8h - 20h)</p>

              <div className="grid grid-cols-7 gap-2 items-end h-40 pt-4">
                {hourlyDistribution.map((slot, idx) => (
                  <div key={idx} className="flex flex-col items-center h-full justify-end group">
                    <span className="text-[10px] font-black text-brand-blue-bright mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {slot.count}
                    </span>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-t-lg flex items-end h-full overflow-hidden">
                      <div 
                        className="w-full bg-gradient-to-t from-emerald-500 to-teal-400 rounded-t-lg transition-all duration-500 group-hover:brightness-110"
                        style={{ height: `${Math.max(slot.percentage, 8)}%` }}
                      />
                    </div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase mt-2 truncate w-full text-center">
                      {slot.label.split(' ')[0]}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Graphique 4 : Santé & Rôles Comptes */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2 mb-1">
                <PieChart className="text-amber-500" size={20} />
                Répartition & Santé des Comptes
              </h3>
              <p className="text-xs text-slate-400 font-bold mb-4">Structure globale des utilisateurs du réseau</p>

              <div className="flex flex-col sm:flex-row items-center justify-around gap-6 pt-2">
                <div className="relative w-32 h-32 flex items-center justify-center shrink-0">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-slate-100 dark:text-slate-800"
                      strokeWidth="3.8"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className="text-emerald-500"
                      strokeDasharray={`${Math.round((userRoleStats.active / (userRoleStats.total || 1)) * 100)}, 100`}
                      strokeWidth="3.8"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center justify-center text-center">
                    <span className="text-xl font-black text-slate-900 dark:text-white">{userRoleStats.total}</span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase">Comptes</span>
                  </div>
                </div>

                <div className="space-y-2 w-full max-w-xs text-xs font-bold">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-300">
                    <span className="flex items-center gap-2">👑 SuperAdmins</span>
                    <span className="font-black">{userRoleStats.superAdmins}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-300">
                    <span className="flex items-center gap-2">🛡️ Admins d'Entreprises</span>
                    <span className="font-black">{userRoleStats.admins}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-300">
                    <span className="flex items-center gap-2">👮 Agents de Sécurité</span>
                    <span className="font-black">{userRoleStats.agents}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-300">
                    <span className="flex items-center gap-2">🚫 Comptes Suspendus</span>
                    <span className="font-black">{userRoleStats.suspended}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🏢 CONTENU ONGLET 2 : ENTREPRISES (Avec Graphiques & Quotas) */}
      {activeTab === 'entreprises' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Graphiques pour l'onglet Entreprises */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Graphique A : Répartition des Entreprises par Secteur */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2 mb-1">
                <Layers className="text-brand-blue-bright" size={20} />
                Répartition des Boîtes par Secteur d'Activité
              </h3>
              <p className="text-xs text-slate-400 font-bold mb-4">Volume des entreprises rattachées à chaque secteur</p>

              <div className="space-y-3">
                {secteurStats.list.length > 0 ? (
                  secteurStats.list.map((sec, idx) => {
                    const percent = Math.round((sec.count / (secteurStats.total || 1)) * 100);
                    const barWidth = Math.round((sec.count / secteurStats.maxCount) * 100);
                    return (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between items-center text-xs font-bold">
                          <span className="text-slate-800 dark:text-slate-200 truncate max-w-[200px]">{sec.name}</span>
                          <span className="text-brand-blue-bright font-black">{sec.count} <span className="text-[10px] text-slate-400 font-normal">({percent}%)</span></span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                          <div 
                            className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${Math.max(barWidth, 8)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-center text-slate-400 text-xs py-6">Aucune entreprise enregistrée.</p>
                )}
              </div>
            </div>

            {/* Graphique B : Consommation des Quotas Admins & Agents */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2 mb-1">
                  <Shield className="text-purple-500" size={20} />
                  Utilisation des Quotas d'Accès Réseau
                </h3>
                <p className="text-xs text-slate-400 font-bold mb-4">Comptes créés vs Capacités maximales autorisées</p>

                <div className="space-y-5">
                  {/* Gauge Admins */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
                        🛡️ Admins d'Entreprises
                      </span>
                      <span className="font-black text-slate-900 dark:text-white">
                        {quotaStats.usedAdmins} / {quotaStats.maxAdmins} max ({quotaStats.adminPercent}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-purple-500 to-indigo-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(quotaStats.adminPercent, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Gauge Agents */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                        👮 Agents de Sécurité
                      </span>
                      <span className="font-black text-slate-900 dark:text-white">
                        {quotaStats.usedAgents} / {quotaStats.maxAgents} max ({quotaStats.agentPercent}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(quotaStats.agentPercent, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400 font-bold">
                <span>Nombre d'entreprises actives : <strong className="text-emerald-500">{activeEntreprises}</strong></span>
                <span>Suspensions : <strong className="text-rose-500">{suspendedEntreprises}</strong></span>
              </div>
            </div>
          </div>

          {/* Tableau des Entreprises */}
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
        </div>
      )}

      {/* 👥 CONTENU ONGLET 3 : UTILISATEURS (Avec Graphiques & Répartition) */}
      {activeTab === 'utilisateurs' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Graphiques pour l'onglet Utilisateurs */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Graphique A : Répartition des Rôles */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2 mb-1">
                <Users className="text-purple-500" size={20} />
                Répartition des Rôles Utilisateurs
              </h3>
              <p className="text-xs text-slate-400 font-bold mb-4">Volume des comptes par niveau d'habilitation</p>

              <div className="grid grid-cols-3 gap-3">
                <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 text-center">
                  <span className="text-2xl font-black text-purple-600 dark:text-purple-400">{userRoleStats.superAdmins}</span>
                  <p className="text-[10px] font-bold text-purple-700 dark:text-purple-300 uppercase mt-1">SuperAdmins</p>
                </div>
                <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 text-center">
                  <span className="text-2xl font-black text-blue-600 dark:text-blue-400">{userRoleStats.admins}</span>
                  <p className="text-[10px] font-bold text-blue-700 dark:text-blue-300 uppercase mt-1">Admins Boîtes</p>
                </div>
                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-center">
                  <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{userRoleStats.agents}</span>
                  <p className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 uppercase mt-1">Agents Sécurité</p>
                </div>
              </div>
            </div>

            {/* Graphique B : Ratio Comptes Actifs vs Suspendus */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2 mb-1">
                  <Activity className="text-emerald-500" size={20} />
                  Santé & Validité des Comptes
                </h3>
                <p className="text-xs text-slate-400 font-bold mb-4">État des accès et permissions réseau</p>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-emerald-600 dark:text-emerald-400">Comptes Actifs ({userRoleStats.active})</span>
                      <span className="font-black text-emerald-600">{Math.round((userRoleStats.active / (userRoleStats.total || 1)) * 100)}%</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden">
                      <div 
                        className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.round((userRoleStats.active / (userRoleStats.total || 1)) * 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-rose-500">Comptes Suspendus / Inactifs ({userRoleStats.suspended})</span>
                      <span className="font-black text-rose-500">{Math.round((userRoleStats.suspended / (userRoleStats.total || 1)) * 100)}%</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden">
                      <div 
                        className="bg-rose-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.round((userRoleStats.suspended / (userRoleStats.total || 1)) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-400 font-bold mt-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                Total utilisateurs inscrits : <strong className="text-slate-900 dark:text-white">{userRoleStats.total}</strong>
              </p>
            </div>
          </div>

          {/* Tableau des Utilisateurs */}
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
        </div>
      )}

      {/* 👁️ CONTENU ONGLET 4 : HISTORIQUE GLOBAL (Avec Graphiques de Flux & Pièces) */}
      {activeTab === 'historique' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Graphiques pour l'onglet Historique */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Graphique A : Évolution de la Fréquentation */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2 mb-1">
                  <TrendingUp className="text-brand-blue-bright" size={20} />
                  Flux de Fréquentation Réseau
                </h3>
                <p className="text-xs text-slate-400 font-bold mb-4">Volume quotidien des enregistrements</p>

                <div className="relative w-full">
                  <svg 
                    viewBox={`0 0 ${lineChartPoints.width} ${lineChartPoints.height}`}
                    className="w-full h-36 overflow-visible"
                  >
                    <defs>
                      <linearGradient id="histGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10B981" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    <path 
                      d={lineChartPoints.areaPathData} 
                      fill="url(#histGrad)" 
                    />

                    <path 
                      d={lineChartPoints.pathData} 
                      fill="none" 
                      stroke="#10B981" 
                      strokeWidth="3" 
                      strokeLinecap="round"
                    />

                    {lineChartPoints.points.map((p, idx) => (
                      <g key={idx} className="cursor-pointer group" onMouseEnter={() => setHoveredPointHist(p)} onMouseLeave={() => setHoveredPointHist(null)}>
                        <circle 
                          cx={p.x} 
                          cy={p.y} 
                          r="4.5" 
                          fill="#10B981" 
                          stroke="#FFFFFF"
                          strokeWidth="2"
                        />
                      </g>
                    ))}
                  </svg>

                  {hoveredPointHist && (
                    <div 
                      className="absolute bg-slate-900 text-white text-xs rounded-lg px-2.5 py-1 shadow-xl font-bold border border-slate-700 pointer-events-none transform -translate-x-1/2 -translate-y-10 z-20"
                      style={{
                        left: `${(hoveredPointHist.x / lineChartPoints.width) * 100}%`,
                        top: `${(hoveredPointHist.y / lineChartPoints.height) * 100}%`
                      }}
                    >
                      <p className="text-emerald-400 font-black">{hoveredPointHist.count} visite(s)</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-between items-center text-xs font-bold pt-3 border-t border-slate-100 dark:border-slate-800">
                <span className="text-amber-500 font-black">Actuellement sur site : {ongoingVisites}</span>
                <span className="text-slate-400">Total enregistré : {totalVisites}</span>
              </div>
            </div>

            {/* Graphique B : Types de Pièces d'Identité Utilisées */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2 mb-1">
                <FileText className="text-cyan-500" size={20} />
                Répartition par Type de Pièce d'Identité
              </h3>
              <p className="text-xs text-slate-400 font-bold mb-4">CNI, Passeport, Permis et autres documents vérifiés</p>

              <div className="space-y-3">
                {visitPieceStats.list.length > 0 ? (
                  visitPieceStats.list.map((piece, idx) => {
                    const percent = Math.round((piece.count / (visitPieceStats.total || 1)) * 100);
                    const barWidth = Math.round((piece.count / visitPieceStats.maxCount) * 100);
                    return (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between items-center text-xs font-bold">
                          <span className="text-slate-800 dark:text-slate-200 uppercase">{piece.name}</span>
                          <span className="text-cyan-500 font-black">{piece.count} <span className="text-[10px] text-slate-400 font-normal">({percent}%)</span></span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                          <div 
                            className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${Math.max(barWidth, 8)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-center text-slate-400 text-xs py-6">Aucune pièce enregistrée.</p>
                )}
              </div>
            </div>
          </div>

          {/* Tableau de l'historique */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <h2 className="text-sm font-black uppercase text-slate-900 dark:text-white">Historique Général des Enregistrements</h2>
              <div className="relative w-full sm:w-72">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Rechercher (Visiteur, Pièce, Hôte, Agent...)"
                  value={searchVisits}
                  onChange={e => setSearchVisits(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:border-brand-blue-bright transition-all"
                />
              </div>
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
                  {filteredVisitesGlobales.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        {searchVisits || globalQuery ? 'Aucun résultat ne correspond à votre recherche.' : 'Aucune visite enregistrée pour le moment.'}
                      </td>
                    </tr>
                  ) : (
                    filteredVisitesGlobales.map((v) => {
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
        </div>
      )}

      {/* MODAL CRÉATION ENTREPRISE */}
      {showCreateEntModal && (
        <Modal isOpen={showCreateEntModal} title="Créer une nouvelle Boîte / Entreprise" onClose={() => setShowCreateEntModal(false)}>
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
        <Modal isOpen={showCreateUserModal} title="Créer un nouveau Compte Utilisateur" onClose={() => setShowCreateUserModal(false)}>
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
