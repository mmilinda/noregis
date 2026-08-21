import React, { useState, useEffect, useRef } from 'react';
import {
  LayoutDashboard, History, Settings, User as UserIcon,
  Shield, Clock, Plus, Bell, Search, LogOut, Camera } from 'lucide-react';
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
  const { agent, visitors } = state;
  const present = visitors.filter(v => v.statut === 'present').length;

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
      {agent?.role !== 'ADMIN' && (
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
            {agent.photo ? <img src={agent.photo} alt="" className="w-full h-full object-cover" /> : agent.initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-white/90 truncate">{agent.prenom} {agent.nom}</p>
            <p className="text-[9px] font-black text-white/30 uppercase truncate">{agent.role}</p>
          </div>
        </div>
        
        <button 
          onClick={() => {
            dispatch({ type: 'LOGOUT' });
            // Pas besoin de notify ici car le retour au login est immédiat
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
   MOBILE HEADER
============================================ */
function MobileHeader({ activeTab, navItems }) {
  const tabLabel = navItems.find(n => n.id === activeTab)?.label || 'NoRegis';

  return (
    <header className="sticky top-0 z-[100] bg-brand-navy p-4 flex items-center justify-between border-b border-white/5">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand-blue-bright to-brand-blue flex items-center justify-center">
        <img src={Logo} alt="no regis logo " className="rounded-lg" />
        </div>
        <div className="flex items-center gap-2">
          {/* <span className="text-base font-black text-white tracking-tight">NoRegis</span> */}
          <span className="text-xs font-bold text-white/30">/ {tabLabel}</span>
        </div>
      </div>
      <LiveClock light />
    </header>
  );
}

/* ============================================
   MOBILE BOTTOM NAV
============================================ */
function BottomNav({ activeTab, onTabChange, onNewEntry, t, navItems }) {
  const { state } = useApp();
  const present = state.visitors.filter(v => v.statut === 'present').length;
  const isAdmin = state.agent?.role === 'ADMIN';

  if (isAdmin) {
    return (
      <nav className="fixed bottom-0 left-0 right-0 bg-brand-navy border-t border-white/10 flex items-center justify-around px-2 pb-safe-area z-[100] h-20">
        {navItems.map(({ id, label, icon: Icon }) => {
          const active = activeTab === id;
          return (
            <button key={id} onClick={() => onTabChange(id)} className="flex-grow flex flex-col items-center gap-1.5 transition-all">
              <div className="relative">
                <Icon size={24} className={active ? 'text-brand-blue-bright' : 'text-white/30'} />
              </div>
              <span className={`text-[8px] font-black uppercase tracking-tight ${active ? 'text-brand-blue-bright' : 'text-white/30'}`}>{label}</span>
            </button>
          );
        })}
      </nav>
    );
  }

  const midIndex = Math.ceil(navItems.length / 2);
  const leftItems = navItems.slice(0, midIndex);
  const rightItems = navItems.slice(midIndex);

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-brand-navy border-t border-white/10 flex items-center justify-around px-2 pb-safe-area z-[100] h-20">
      {leftItems.map(({ id, label, icon: Icon }) => {
        const active = activeTab === id;
        return (
          <button key={id} onClick={() => onTabChange(id)} className="flex-grow flex flex-col items-center gap-1.5 transition-all">
            <div className="relative">
              <Icon size={24} className={active ? 'text-brand-blue-bright' : 'text-white/30'} />
              {id === 'dashboard' && present > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-brand-green-bright text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-lg">{present}</span>
              )}
            </div>
            <span className={`text-[8px] font-black uppercase tracking-tight ${active ? 'text-brand-blue-bright' : 'text-white/30'}`}>{label}</span>
          </button>
        );
      })}

      {/* FAB */}
      <div className="relative -top-6 px-2 shrink-0">
        <button 
          onClick={onNewEntry}
          className="w-16 h-16 rounded-xl bg-gradient-to-br from-brand-blue-bright to-brand-blue text-white flex items-center justify-center border-4 border-brand-navy active:scale-90 transition-transform"
        >
          <Plus size={32} strokeWidth={3} />
        </button>
      </div>

      {rightItems.map(({ id, label, icon: Icon }) => {
        const active = activeTab === id;
        return (
          <button key={id} onClick={() => onTabChange(id)} className="flex-grow flex flex-col items-center gap-1.5 transition-all">
            <div className="relative">
              <Icon size={24} className={active ? 'text-brand-blue-bright' : 'text-white/30'} />
            </div>
            <span className={`text-[8px] font-black uppercase tracking-tight ${active ? 'text-brand-blue-bright' : 'text-white/30'}`}>{label}</span>
          </button>
        );
      })}
    </nav>
  );
}

/* ============================================
   DESKTOP TOP BAR
============================================ */
function DesktopTopBar({ activeTab, navItems, t, onTabChange }) {
  const { dispatch, state } = useApp();
  const { searchQuery } = state;
  const tabLabel = navItems.find(n => n.id === activeTab)?.label || 'NoRegis';
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef(null);

  const [notificationsList, setNotificationsList] = useState([
    { id: 1, text: "Nouveau visiteur enregistré", time: "Il y a 5 minutes", read: false, tab: "dashboard" },
    { id: 2, text: "Véhicule détecté à l'entrée", time: "Il y a 10 minutes", read: false, tab: "dashboard" },
  ]);

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

  const handleNotifClick = (id, tab) => {
    setNotificationsList(notificationsList.map(n => n.id === id ? { ...n, read: true } : n));
    setShowNotifications(false);
    if (onTabChange) {
      onTabChange(tab);
    }
  };

  const markAllAsRead = () => {
    setNotificationsList(notificationsList.map(n => ({ ...n, read: true })));
  };

  const unreadCount = notificationsList.filter(n => !n.read).length;

  return (
    <header className="h-20 bg-white dark:bg-[#0D1117]/80 backdrop-blur-md border-b border-slate-100 dark:border-white/5 px-8 flex items-center justify-between sticky top-0 z-[90]">
      <div className="flex items-center gap-8">
        <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{tabLabel}</h2>
        
        {/* Search */}
        <div className="relative group w-80">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-blue-bright transition-colors" />
          <input
            type="text"
            placeholder={t.search}
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
              <span className="absolute top-2 right-2 w-2 h-2 bg-brand-red-bright rounded-full border-2 border-white dark:border-[#0D1117]" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute top-full right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-100 dark:border-white/5 p-4 z-[100]">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Notifications</h3>
                <button onClick={markAllAsRead} className="text-xs text-brand-blue-bright hover:underline">Tout marquer comme lu</button>
              </div>
              <div className="space-y-3">
                {notificationsList.map(n => (
                  <div 
                    key={n.id}
                    onClick={() => handleNotifClick(n.id, n.tab)}
                    className="flex items-start gap-3 p-2 hover:bg-slate-50 dark:hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
                  >
                    <span className={`w-2 h-2 rounded-full mt-1.5 ${n.read ? 'bg-slate-300 dark:bg-slate-600' : 'bg-brand-blue-bright'}`} />
                    <div>
                      <p className={`text-sm ${n.read ? 'text-slate-500' : 'text-slate-900 dark:text-white font-bold'}`}>{n.text}</p>
                      <p className="text-xs text-slate-500">{n.time}</p>
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
  const { state } = useApp();
  const t = TRANSLATIONS[state.settings?.language || 'fr'];

  const navItems = [
    { id: 'dashboard', label: t.dashboard, icon: LayoutDashboard },
    { id: 'history',   label: t.history,   icon: History },
    ...(state.agent?.role === 'ADMIN' ? [{ id: 'agents', label: t.agents || 'Agents', icon: Shield }] : []),
    { id: 'settings',  label: t.settings,  icon: Settings },
    { id: 'profile',   label: t.profile,   icon: UserIcon },
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
          <MobileHeader activeTab={activeTab} navItems={navItems} />
        ) : (
          <DesktopTopBar activeTab={activeTab} navItems={navItems} t={t} onTabChange={onTabChange} />
        )}

        <main className={`flex-1 overflow-y-auto w-full ${isMobile ? 'pb-24' : ''}`}>
          <div className="w-full h-full">
            {React.cloneElement(children, { isMobile })}
          </div>
        </main>
      </div>

      {/* Mobile Nav */}
      {isMobile && (
        <BottomNav activeTab={activeTab} onTabChange={onTabChange} onNewEntry={() => setRegOpen(true)} t={t} navItems={navItems} />
      )}

      {/* Bouton Flottant (FAB) - Scan Rapide Recto/Verso accessible partout */}
      <button
        onClick={() => setRegOpen(true)}
        className="fixed bottom-6 right-6 md:bottom-8 md:right-8 w-14 h-14 bg-gradient-to-tr from-brand-blue-bright via-blue-600 to-indigo-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-50 group cursor-pointer border-2 border-white/30"
        title="Scanner une pièce d'identité (Recto / Verso)"
      >
        <Camera size={26} className="group-hover:rotate-12 transition-transform drop-shadow" />
        <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-green-bright opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-brand-green-bright border-2 border-white"></span>
        </span>
      </button>

      {/* Global Modals */}
      <RegistrationModal isOpen={regOpen} onClose={() => setRegOpen(false)} />
    </div>
  );
}

