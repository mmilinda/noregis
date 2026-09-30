import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, History, Settings, User as UserIcon, Calendar,
  Shield, Clock, Plus, Bell, Search, LogOut, Camera, Building2, Users, Briefcase, FolderTree, AlertTriangle, Menu, X, ChevronRight } from 'lucide-react';
import { useApp } from '../context/useAppState';
import { RegistrationModal } from './RegistrationModal';
import { TRANSLATIONS } from '../translations';
import Logo from '../assets/logo_noregis_shield.jpg'

/* ============================================
   CLOCK
============================================ */
function LiveClock({ light }) {
  const { state } = useApp();
  const currentLang = state.settings?.language || 'fr';
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const locale = currentLang === 'ar' ? 'ar-EG' : (currentLang === 'en' ? 'en-US' : 'fr-FR');

  return (
    <div className="flex items-center gap-3">
      <Clock size={16} className={light ? 'text-white/40' : 'text-slate-400'} />
      <div className="flex flex-col">
        <span className={`text-[9px] font-black uppercase tracking-widest ${light ? 'text-white/40' : 'text-slate-400'}`}>
          {time.toLocaleDateString(locale, { day: '2-digit', month: 'short' })}
        </span>
        <span className={`text-sm font-black font-mono leading-none ${light ? 'text-white' : 'text-slate-900 dark:text-slate-100'}`}>
          {time.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </span>
      </div>
    </div>
  );
}

/* ============================================
   DESKTOP SIDEBAR
============================================ */
function Sidebar({ activeTab, onTabChange, onNewEntry, t, navItems }) {
  const { state, dispatch } = useApp();
  const agent = state.agent || state.user || {};
  const visitors = state.visitors || [];
  const present = visitors.filter(v => v.statut === 'present').length;
  const initials = agent.initials || `${(agent.prenom||'S')[0] || ''}${(agent.nom||'A')[0] || ''}`.toUpperCase();

  return (
    <aside className="w-64 bg-brand-navy flex flex-col h-screen sticky top-0 border-r border-white/5 overflow-hidden z-[100]">
      {/* Logo */}
      <div className="p-6 pb-5 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-brand-blue-bright to-brand-blue flex items-center justify-center shrink-0">
          <img src={Logo} alt="NoRegis" className="rounded-lg" />
          </div>
          <div>
            <p className="text-lg font-black text-white tracking-tight"><span className='text-white'>No</span><span className='text-brand-blue-bright'>Regis</span></p>
            <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Registre Digital</p>
          </div>
        </div>
      </div>

      {/* Live clock + presence */}
      <div className="px-6 py-5 border-b border-white/5 space-y-4">
        <LiveClock light />
        <div className="flex items-center gap-3 bg-white/5 p-3 rounded-lg border border-white/5">
          <span className="w-2 h-2 rounded-full bg-brand-green-bright animate-pulse" />
          <span className="text-xs font-bold text-white/60">{present} {present > 1 ? t.present.toLowerCase() : t.present.toLowerCase()}</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="p-3 flex-1 flex flex-col gap-1 overflow-y-auto">
        {navItems.map(({ id, label, icon: Icon }) => {
          if (!Icon) return null;
          const active = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group
                ${active 
                  ? 'bg-brand-blue-bright/10 text-brand-blue-bright border border-brand-blue-bright/20 shadow-inner' 
                  : 'text-white/40 hover:text-white hover:bg-white/5 border border-transparent'
                }
              `}
            >
              <Icon size={20} className={active ? 'text-brand-blue-bright' : 'text-white/20 group-hover:text-white/60'} />
              <span className="text-sm font-bold">{label}</span>
            </button>
          );
        })}
      </nav>

      {/* CTA */}
      {agent?.role !== 'ADMIN' && agent?.role !== 'SUPER_ADMIN' && agent?.role !== 'SUPERADMIN' && (
        <div className="p-4">
          <button
            onClick={onNewEntry}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-brand-blue-bright to-brand-blue text-white p-3.5 rounded-lg font-black text-sm hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <Plus size={20} strokeWidth={3} />
            {t.new_entry}
          </button>
        </div>
      )}

      {/* Agent & Logout */}
      <div className="mt-auto border-t border-white/5">
        <div 
          className="p-4 flex items-center gap-3 cursor-pointer hover:bg-white/5 transition-colors group"
          onClick={() => onTabChange('profile')}
        >
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-slate-700 to-slate-900 border border-white/10 flex items-center justify-center text-white text-[11px] font-black shrink-0 overflow-hidden group-hover:border-brand-blue-bright/50 transition-colors">
            {agent.photo ? <img src={agent.photo} alt="" className="w-full h-full object-cover" /> : initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-white/90 truncate">{agent.prenom || ''} {agent.nom || ''}</p>
            <p className="text-[9px] font-black text-white/30 uppercase truncate">{agent.role || ''}</p>
          </div>
        </div>
        
        <button 
          onClick={() => {
            dispatch({ type: 'LOGOUT' });
          }}
          className="w-full flex items-center gap-3 px-6 py-4 text-brand-red hover:bg-red-500/10 transition-colors border-t border-white/5 group"
        >
          <LogOut size={18} className="opacity-50 group-hover:opacity-100" />
          <span className="text-xs font-black uppercase tracking-widest">{t.logout}</span>
        </button>
      </div>
    </aside>
  );
}

/* ============================================
   MOBILE DRAWER SIDEBAR (HAMBURGER MENU)
============================================ */
function MobileDrawer({ isOpen, onClose, activeTab, onTabChange, onNewEntry, t, navItems }) {
  const { state, dispatch } = useApp();
  const agent = state.agent || state.user || {};
  const visitors = state.visitors || [];
  const present = visitors.filter(v => v.statut === 'present').length;
  const initials = agent.initials || `${(agent.prenom||'S')[0] || ''}${(agent.nom||'A')[0] || ''}`.toUpperCase();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[250] flex">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="relative w-80 max-w-[85vw] bg-brand-navy flex flex-col h-full z-[260] shadow-2xl border-r border-white/10 overflow-hidden animate-in slide-in-from-left duration-250">
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand-blue-bright to-brand-blue flex items-center justify-center shrink-0">
              <img src={Logo} alt="NoRegis" className="rounded-lg" />
            </div>
            <div>
              <p className="text-base font-black text-white tracking-tight"><span className='text-white'>No</span><span className='text-brand-blue-bright'>Regis</span></p>
              <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Registre Digital</p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-2 text-white/50 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* User Card */}
        <div 
          className="p-3.5 mx-3 my-3 bg-white/5 rounded-xl border border-white/10 flex items-center gap-3 cursor-pointer hover:bg-white/10 transition-colors"
          onClick={() => {
            onTabChange('profile');
            onClose();
          }}
        >
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-slate-700 to-slate-900 border border-white/20 flex items-center justify-center text-white text-xs font-black shrink-0 overflow-hidden">
            {agent.photo ? <img src={agent.photo} alt="" className="w-full h-full object-cover" /> : initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-black text-white truncate">{agent.prenom || ''} {agent.nom || ''}</p>
            <p className="text-[10px] font-extrabold text-brand-blue-bright uppercase tracking-wider truncate">{agent.role || ''}</p>
          </div>
          {present > 0 && (
            <span className="px-2 py-0.5 text-[9px] font-black rounded-full bg-brand-green-bright/20 text-brand-green-bright border border-brand-green-bright/30 shrink-0">
              {present} pris.
            </span>
          )}
        </div>

        {/* Navigation List */}
        <div className="px-3 py-2 flex-1 overflow-y-auto space-y-1">
          <p className="px-3 text-[10px] font-black uppercase tracking-widest text-white/30 mb-2">Toutes les pages</p>
          {navItems.map(({ id, label, icon: Icon }) => {
            if (!Icon) return null;
            const active = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => {
                  onTabChange(id);
                  onClose();
                }}
                className={`
                  w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group
                  ${active 
                    ? 'bg-brand-blue-bright/15 text-brand-blue-bright border border-brand-blue-bright/30 font-black' 
                    : 'text-white/70 hover:text-white hover:bg-white/5 border border-transparent font-bold'
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  <Icon size={19} className={active ? 'text-brand-blue-bright' : 'text-white/40 group-hover:text-white'} />
                  <span className="text-xs">{label}</span>
                </div>
                <ChevronRight size={14} className={active ? 'text-brand-blue-bright' : 'text-white/20'} />
              </button>
            );
          })}
        </div>

        {/* New entry button for Agents */}
        {agent?.role !== 'ADMIN' && agent?.role !== 'SUPER_ADMIN' && agent?.role !== 'SUPERADMIN' && (
          <div className="px-4 py-2">
            <button
              onClick={() => {
                onNewEntry();
                onClose();
              }}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-brand-blue-bright to-brand-blue text-white p-3 rounded-xl font-black text-xs hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg"
            >
              <Plus size={18} strokeWidth={3} />
              {t.new_entry || 'Nouveau Visiteur'}
            </button>
          </div>
        )}

        {/* Footer Logout */}
        <div className="p-3 border-t border-white/10">
          <button 
            onClick={() => {
              onClose();
              dispatch({ type: 'LOGOUT' });
            }}
            className="w-full flex items-center justify-center gap-2 p-3 rounded-xl text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 transition-colors text-xs font-black uppercase tracking-wider"
          >
            <LogOut size={16} />
            <span>{t.logout || 'Déconnexion'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================================
   MOBILE HEADER
============================================ */
function MobileHeader({ activeTab, navItems, onOpenMenu }) {
  const tabLabel = navItems.find(n => n.id === activeTab)?.label || 'NoRegis';

  return (
    <header className="sticky top-0 z-[100] bg-brand-navy p-3.5 flex items-center justify-between border-b border-white/5">
      <div className="flex items-center gap-3">
        <button 
          onClick={onOpenMenu}
          className="p-2 text-white/80 hover:text-white rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors flex items-center gap-1.5"
          title="Ouvrir le menu complet"
        >
          <Menu size={20} />
        </button>

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-blue-bright to-brand-blue flex items-center justify-center shrink-0">
            <img src={Logo} alt="no regis logo " className="rounded-lg" />
          </div>
          <span className="text-xs font-black text-white/90 truncate max-w-[140px]">{tabLabel}</span>
        </div>
      </div>
      <LiveClock light />
    </header>
  );
}

/* ============================================
   MOBILE BOTTOM NAV
============================================ */
function BottomNav({ activeTab, onTabChange, onOpenMenu, navItems, role }) {
  const { state } = useApp();
  const present = (state.visitors || []).filter(v => v.statut === 'present').length;
  const isSuperAdmin = role === 'SUPER_ADMIN' || role === 'SUPERADMIN';
  const isAdmin = role === 'ADMIN';

  // Déterminer les 3 pages les plus pertinentes selon le rôle
  let mainTabIds = ['dashboard', 'history', 'bugs'];
  if (isSuperAdmin) {
    mainTabIds = ['dashboard', 'entreprises', 'bugs'];
  } else if (isAdmin) {
    mainTabIds = ['dashboard', 'agents', 'bugs'];
  }

  const urgentNavItems = mainTabIds
    .map(id => navItems.find(n => n.id === id))
    .filter(Boolean);

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-brand-navy border-t border-white/10 flex items-center justify-around px-2 pb-safe-area z-[100] h-16 shadow-2xl">
      {urgentNavItems.map(({ id, label, icon: Icon }) => {
        if (!Icon) return null;
        const active = activeTab === id;
        return (
          <button 
            key={id} 
            onClick={() => onTabChange(id)} 
            className="flex-1 flex flex-col items-center justify-center gap-1 transition-all py-1"
          >
            <div className="relative">
              <Icon size={20} className={active ? 'text-brand-blue-bright' : 'text-white/40'} />
              {id === 'dashboard' && present > 0 && (
                <span className="absolute -top-1.5 -right-2.5 bg-brand-green-bright text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-lg">
                  {present}
                </span>
              )}
            </div>
            <span className={`text-[9px] font-black tracking-tight truncate max-w-[75px] ${active ? 'text-brand-blue-bright' : 'text-white/40'}`}>
              {label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

/* ============================================
   DESKTOP TOP BAR
============================================ */
function getSearchPlaceholder(activeTab, t, isSuperAdmin) {
  if (!t) return "Rechercher...";
  switch (activeTab) {
    case 'entreprises':
      return t.search_entreprise || "Rechercher une entreprise (Nom, NINEA, secteur...)";
    case 'secteurs':
      return t.search_secteur || "Rechercher un secteur d'activité (Nom, code...)";
    case 'departements':
      return "Rechercher un département (Nom, code, description...)";
    case 'admins':
      return t.search_admin || "Rechercher un administrateur (Nom, email, entreprise...)";
    case 'agents':
      return t.search_agent || "Rechercher un agent (Nom, email, poste...)";
    case 'comptes':
      return t.search_compte || "Rechercher un compte (Nom, rôle, email...)";
    case 'history':
      return t.search_history || "Rechercher dans l'historique (Visiteur, hôte, date...) font-bold";
    case 'rdv':
      return "Rechercher un rendez-vous (Visiteur, hôte, service...)";
    case 'bugs':
      return "Rechercher un signalement, bug, statut...";
    case 'settings':
      return t.search_settings || "Rechercher dans les paramètres...";
    case 'superadmin':
      return t.search_global || "Rechercher une entreprise, administrateur...";
    case 'dashboard':
    default:
      if (isSuperAdmin) {
        return t.search_global || "Rechercher un visiteur, entreprise, badge...";
      }
      return t.search_visitor || "Rechercher un visiteur (Nom, CIN, Plaque...)";
  }
}

function DesktopTopBar({ activeTab, navItems, t, onTabChange }) {
  const { dispatch, state } = useApp();
  const navigate = useNavigate();
  const { searchQuery, bugs = [], visitors = [] } = state;
  const role = (state.agent?.role || state.user?.role || '').toUpperCase();
  const isSuperAdmin = role === 'SUPER_ADMIN' || role === 'SUPERADMIN';
  const isAdmin = role === 'ADMIN';
  const tabLabel = navItems.find(n => n.id === activeTab)?.label || 'NoRegis';
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef(null);

  const [readNotifIds, setReadNotifIds] = useState([]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

  const safeStr = (val, fallback = '') => {
    if (!val) return fallback;
    if (typeof val === 'string' || typeof val === 'number') return String(val);
    if (typeof val === 'object') {
      if (val.nom || val.prenom) return `${val.prenom || ''} ${val.nom || ''}`.trim();
      if (val.name) return String(val.name);
      return fallback;
    }
    return fallback;
  };

  const bugNotifs = (bugs || []).map(b => {
    if (!b) return null;
    const isResolu = b.statut === 'RESOLU' || b.statut === 'FERME';
    const reponsesArr = Array.isArray(b.reponses) ? b.reponses : [];
    const hasResponses = reponsesArr.length > 0;
    const lastResponse = hasResponses ? reponsesArr[reponsesArr.length - 1] : null;

    const bTitre = safeStr(b.titre, 'Signalement technique');
    const bSignaleur = safeStr(b.nomSignaleur, 'Agent');
    const bEnt = safeStr(b.entrepriseNom);

    let text = `🐛 Bug : ${bTitre}`;
    let subtext = `De: ${bSignaleur}${bEnt ? ` (${bEnt})` : ''}`;

    if (isSuperAdmin) {
      if (hasResponses && lastResponse?.roleAuteur !== 'SUPER_ADMIN' && lastResponse?.roleAuteur !== 'SUPERADMIN') {
        text = `💬 Réponse de ${safeStr(lastResponse?.nomAuteur, 'Utilisateur')} (${safeStr(lastResponse?.roleAuteur)}) : ${bTitre}`;
        subtext = `« ${safeStr(lastResponse?.message)} »`;
      } else {
        text = `🐛 Nouveau Bug : ${bTitre}`;
        subtext = `Par ${bSignaleur}${bEnt ? ` • ${bEnt}` : ''}`;
      }
    } else if (isAdmin) {
      if (hasResponses && (lastResponse?.roleAuteur === 'SUPER_ADMIN' || lastResponse?.roleAuteur === 'SUPERADMIN')) {
        text = `👑 Réponse du SuperAdmin : ${bTitre}`;
        subtext = `« ${safeStr(lastResponse?.message)} »`;
      } else if (hasResponses && lastResponse?.roleAuteur === 'AGENT') {
        text = `💬 Réponse de l'Agent ${safeStr(lastResponse?.nomAuteur, 'Agent')} : ${bTitre}`;
        subtext = `« ${safeStr(lastResponse?.message)} »`;
      } else {
        text = `🐛 Bug Équipe : ${bTitre}`;
        subtext = `Signalé par ${bSignaleur}`;
      }
    } else {
      if (hasResponses && lastResponse?.roleAuteur !== 'AGENT') {
        const authorRole = (lastResponse?.roleAuteur === 'SUPER_ADMIN' || lastResponse?.roleAuteur === 'SUPERADMIN') ? 'SuperAdmin' : 'Admin';
        text = `💬 Réponse de ${authorRole} (${safeStr(lastResponse?.nomAuteur, 'Utilisateur')}) : ${bTitre}`;
        subtext = `« ${safeStr(lastResponse?.message)} »`;
      } else {
        text = `🐛 Mon signalement : ${bTitre}`;
        subtext = `Statut : ${safeStr(b.statut)}`;
      }
    }

    let timeStr = 'Récemment';
    const lastDate = lastResponse?.createdAt || b.updatedAt || b.createdAt;
    if (lastDate) {
      try {
        const d = new Date(lastDate);
        if (!isNaN(d.getTime())) {
          timeStr = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
        }
      } catch (e) {}
    }

    const notifKey = `bug_${b._id || b.id || Math.random()}_${reponsesArr.length}_${b.statut}`;

    return {
      id: notifKey,
      type: 'bug',
      bugId: b._id || b.id,
      text,
      subtext,
      time: timeStr,
      read: readNotifIds.includes(notifKey) || isResolu,
      statut: b.statut,
    };
  }).filter(Boolean);

  const visitNotifs = (visitors || []).slice(0, 2).map(v => ({
    id: `vis_${v._id || v.id}`,
    type: 'visit',
    text: `Entrée visiteur: ${v.prenom || ''} ${v.nom || 'Visiteur'}`,
    subtext: v.motifVisite ? `Motif: ${v.motifVisite}` : 'Registre d\'accès',
    time: v.heureEntree || 'Aujourd\'hui',
    read: readNotifIds.includes(`vis_${v._id || v.id}`),
    tab: 'dashboard',
  }));

  const notificationsList = [...bugNotifs, ...visitNotifs];
  const unreadCount = notificationsList.filter(n => !n.read).length;

  const handleNotifClick = (item) => {
    setReadNotifIds(prev => [...prev, item.id]);
    setShowNotifications(false);
    if (item.type === 'bug' && item.bugId) {
      navigate(`/bugs?bugId=${item.bugId}`);
    } else if (onTabChange) {
      onTabChange(item.tab || 'dashboard');
    }
  };

  const markAllAsRead = () => {
    setReadNotifIds(notificationsList.map(n => n.id));
  };

  return (
    <header className="h-20 bg-white dark:bg-[#0D1117]/80 backdrop-blur-md border-b border-slate-100 dark:border-white/5 px-8 flex items-center justify-between sticky top-0 z-[90]">
      <div className="flex items-center gap-8">
        <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{tabLabel}</h2>
        
        {/* Search */}
        <div className="relative group w-80">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-blue-bright transition-colors" />
          <input
            type="text"
            placeholder={getSearchPlaceholder(activeTab, t, isSuperAdmin)}
            value={searchQuery}
            onChange={e => {
              dispatch({ type: 'SET_SEARCH', payload: e.target.value });
              if (activeTab === 'profile' && e.target.value.trim() !== '') {
                onTabChange('dashboard');
              }
            }}
            className="w-full bg-slate-50 dark:bg-white/5 border-2 border-transparent focus:border-brand-blue-bright/20 focus:bg-white dark:focus:bg-slate-800 rounded-lg py-2.5 pl-12 pr-4 text-sm font-bold text-slate-900 dark:text-slate-100 outline-none transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2.5 bg-slate-50 dark:bg-white/5 text-slate-400 hover:text-brand-blue-bright rounded-xl transition-all"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-brand-red-bright rounded-full border-2 border-white dark:border-[#0D1117] animate-pulse" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute top-full right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-100 dark:border-white/5 p-4 z-[100]">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">{t.notifications || "Notifications"}</h3>
                <button onClick={markAllAsRead} className="text-xs text-brand-blue-bright hover:underline">{t.mark_all_read || "Tout marquer comme lu"}</button>
              </div>
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {notificationsList.map(n => (
                  <div 
                    key={n.id}
                    onClick={() => handleNotifClick(n)}
                    className="flex items-start gap-3 p-2.5 hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl transition-colors cursor-pointer group"
                  >
                    <span className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${n.read ? 'bg-slate-300 dark:bg-slate-600' : 'bg-brand-blue-bright animate-pulse'}`} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs ${n.read ? 'text-slate-500 font-medium' : 'text-slate-900 dark:text-white font-black'} truncate`}>{n.text}</p>
                      {n.subtext && <p className="text-[10px] font-bold text-slate-400 truncate">{n.subtext}</p>}
                      <p className="text-[9px] font-bold text-brand-blue-bright mt-0.5">{n.time} {n.type === 'bug' ? '• Ouvrir & Répondre' : ''}</p>
                    </div>
                  </div>
                ))}
                {notificationsList.length === 0 && (
                  <p className="text-sm text-slate-500 text-center py-4">Aucune notification</p>
                )}
              </div>
            </div>
          )}
        </div>
        <div className="h-8 w-px bg-slate-100 dark:bg-white/10" />
        <LiveClock />
      </div>
    </header>
  );
}

/* ============================================
   MAIN LAYOUT
============================================ */
export function Layout({ children, activeTab, onTabChange }) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [regOpen, setRegOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { state } = useApp();
  const t = TRANSLATIONS[state.settings?.language || 'fr'];

  const role = (state.agent?.role || state.user?.role || '').toUpperCase();
  const isSuperAdmin = role === 'SUPER_ADMIN' || role === 'SUPERADMIN';
  const isAdmin = role === 'ADMIN';

  const navItems = [
    { id: 'dashboard', label: isSuperAdmin ? 'Supervision Global' : t.dashboard, icon: LayoutDashboard },
    { id: 'rdv', label: 'Rendez-vous', icon: Calendar },
    ...(isSuperAdmin ? [
      { id: 'entreprises', label: 'Entreprises & Boîtes', icon: Building2 },
      { id: 'secteurs', label: "Secteurs d'Activité", icon: Briefcase },
      { id: 'departements', label: 'Départements & Services', icon: FolderTree },
      { id: 'admins', label: 'Admins de Boîte', icon: Shield },
      { id: 'agents', label: 'Agents de Sécurité', icon: Users },
      { id: 'comptes', label: 'Tous les Comptes', icon: UserIcon },
    ] : []),
    ...(isAdmin ? [
      { id: 'agents', label: 'Équipe & Accès', icon: Users },
      { id: 'departements', label: 'Départements & Services', icon: FolderTree },
    ] : []),
    { id: 'history', label: isSuperAdmin ? 'Historique Global' : t.history, icon: History },
    { id: 'bugs', label: 'Signalements & Bugs', icon: AlertTriangle },
    { id: 'settings', label: t.settings, icon: Settings },
    { id: 'profile', label: t.profile, icon: UserIcon },
  ];

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  const isAr = state.settings?.language === 'ar';

  return (
    <div className={`min-h-screen flex ${state.darkMode ? 'dark' : ''} transition-colors duration-300`} dir={isAr ? 'rtl' : 'ltr'}>
      {/* Desktop Sidebar */}
      {!isMobile && (
        <Sidebar activeTab={activeTab} onTabChange={onTabChange} onNewEntry={() => setRegOpen(true)} t={t} navItems={navItems} />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-100 dark:bg-[#0D1117]">
        {isMobile ? (
          <MobileHeader activeTab={activeTab} navItems={navItems} onOpenMenu={() => setMobileMenuOpen(true)} />
        ) : (
          <DesktopTopBar activeTab={activeTab} navItems={navItems} t={t} onTabChange={onTabChange} />
        )}

        <main className={`flex-1 overflow-y-auto w-full ${isMobile ? 'pb-24' : ''}`}>
          <div className="w-full h-full">
            {React.cloneElement(children, { isMobile })}
          </div>
        </main>
      </div>

      {/* Mobile Nav & Drawer */}
      {isMobile && (
        <>
          <BottomNav 
            activeTab={activeTab} 
            onTabChange={onTabChange} 
            onOpenMenu={() => setMobileMenuOpen(true)} 
            navItems={navItems} 
            role={role} 
          />
          <MobileDrawer 
            isOpen={mobileMenuOpen} 
            onClose={() => setMobileMenuOpen(false)} 
            activeTab={activeTab} 
            onTabChange={onTabChange} 
            onNewEntry={() => setRegOpen(true)} 
            t={t} 
            navItems={navItems} 
          />
        </>
      )}

      {/* Bouton Flottant (FAB) - Scan Rapide (Desktop uniquement) */}
      {!isMobile && (
        <button
          onClick={() => setRegOpen(true)}
          className="fixed bottom-8 right-8 w-14 h-14 bg-gradient-to-tr from-brand-blue-bright via-blue-600 to-indigo-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-50 group cursor-pointer border-2 border-white/30"
          title="Scanner une pièce d'identité (Recto / Verso)"
        >
          <Camera size={26} className="group-hover:rotate-12 transition-transform drop-shadow" />
          <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-green-bright opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-brand-green-bright border-2 border-white"></span>
          </span>
        </button>
      )}

      {/* Global Modals */}
      <RegistrationModal isOpen={regOpen} onClose={() => setRegOpen(false)} />
    </div>
  );
}
