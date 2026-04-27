import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard, History, Settings, User as UserIcon,
  Shield, Clock, Plus, Bell, Search} from 'lucide-react';
import { useApp } from '../context/useAppState';
import { RegistrationModal } from './RegistrationModal';

/* ============================================
   NAVBAR ITEMS
============================================ */
const NAV_ITEMS = [
  { id: 'dashboard', label: 'Registre',    icon: LayoutDashboard },
  { id: 'history',   label: 'Historique',  icon: History },
  { id: 'settings',  label: 'Paramètres',  icon: Settings },
  { id: 'profile',   label: 'Mon profil',  icon: UserIcon },
];

/* ============================================
   CLOCK
============================================ */
function LiveClock({ light }) {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="flex items-center gap-3">
      <Clock size={16} className={light ? 'text-white/40' : 'text-slate-400'} />
      <div className="flex flex-col">
        <span className={`text-[9px] font-black uppercase tracking-widest ${light ? 'text-white/40' : 'text-slate-400'}`}>
          {time.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
        </span>
        <span className={`text-sm font-black font-mono leading-none ${light ? 'text-white' : 'text-slate-900 dark:text-slate-100'}`}>
          {time.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </span>
      </div>
    </div>
  );
}

/* ============================================
   DESKTOP SIDEBAR
============================================ */
function Sidebar({ activeTab, onTabChange, onNewEntry }) {
  const { state } = useApp();
  const { agent, visitors } = state;
  const present = visitors.filter(v => v.statut === 'present').length;

  return (
    <aside className="w-64 bg-brand-navy flex flex-col h-screen sticky top-0 border-r border-white/5 overflow-hidden z-[100]">
      {/* Logo */}
      <div className="p-6 pb-5 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-brand-blue-bright to-brand-blue flex items-center justify-center shrink-0">
            <Shield size={22} className="text-white fill-white/20" />
          </div>
          <div>
            <p className="text-lg font-black text-white tracking-tight">NoRegis</p>
            <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Registre Digital</p>
          </div>
        </div>
      </div>

      {/* Live clock + presence */}
      <div className="px-6 py-5 border-b border-white/5 space-y-4">
        <LiveClock light />
        <div className="flex items-center gap-3 bg-white/5 p-3 rounded-lg border border-white/5">
          <span className="w-2 h-2 rounded-full bg-brand-green-bright animate-pulse" />
          <span className="text-xs font-bold text-white/60">{present} présent{present > 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="p-3 flex-1 flex flex-col gap-1 overflow-y-auto">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
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
      <div className="p-4">
        <button
          onClick={onNewEntry}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-brand-blue-bright to-brand-blue text-white p-3.5 rounded-lg font-black text-sm hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          <Plus size={20} strokeWidth={3} />
          Nouvelle entrée
        </button>
      </div>

      {/* Agent */}
      <div 
        className="p-5 border-t border-white/5 flex items-center gap-3 cursor-pointer hover:bg-white/5 transition-colors group"
        onClick={() => onTabChange('profile')}
      >
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-slate-700 to-slate-900 border border-white/10 flex items-center justify-center text-white text-sm font-black shrink-0 overflow-hidden group-hover:border-brand-blue-bright/50 transition-colors">
          {agent.photo ? <img src={agent.photo} alt="" className="w-full h-full object-cover" /> : agent.initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white/90 truncate">{agent.prenom} {agent.nom}</p>
          <p className="text-[10px] font-black text-white/30 uppercase truncate">{agent.role}</p>
        </div>
      </div>
    </aside>
  );
}

/* ============================================
   MOBILE HEADER
============================================ */
function MobileHeader({ activeTab }) {
  const tabLabel = NAV_ITEMS.find(n => n.id === activeTab)?.label || 'NoRegis';

  return (
    <header className="sticky top-0 z-[100] bg-brand-navy p-4 flex items-center justify-between border-b border-white/5">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand-blue-bright to-brand-blue flex items-center justify-center">
          <Shield size={18} className="text-white fill-white/20" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-base font-black text-white tracking-tight">NoRegis</span>
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
function BottomNav({ activeTab, onTabChange, onNewEntry }) {
  const { state } = useApp();
  const present = state.visitors.filter(v => v.statut === 'present').length;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-brand-navy border-t border-white/10 flex items-center px-2 pb-safe-area z-[100] h-20">
      <button onClick={() => onTabChange('history')} className="flex-1 flex flex-col items-center gap-1.5 transition-all">
        <History size={24} className={activeTab === 'history' ? 'text-brand-blue-bright' : 'text-white/30'} />
        <span className={`text-[9px] font-black uppercase ${activeTab === 'history' ? 'text-brand-blue-bright' : 'text-white/30'}`}>Historique</span>
      </button>

      <button onClick={() => onTabChange('dashboard')} className="flex-1 flex flex-col items-center gap-1.5 transition-all">
        <div className="relative">
          <LayoutDashboard size={24} className={activeTab === 'dashboard' ? 'text-brand-blue-bright' : 'text-white/30'} />
          {present > 0 && (
            <span className="absolute -top-1.5 -right-2 bg-brand-green-bright text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-lg">{present}</span>
          )}
        </div>
        <span className={`text-[9px] font-black uppercase ${activeTab === 'dashboard' ? 'text-brand-blue-bright' : 'text-white/30'}`}>Registre</span>
      </button>

      {/* FAB */}
      <div className="relative -top-6 px-4">
        <button 
          onClick={onNewEntry}
          className="w-16 h-16 rounded-xl bg-gradient-to-br from-brand-blue-bright to-brand-blue text-white flex items-center justify-center border-4 border-brand-navy active:scale-90 transition-transform"
        >
          <Plus size={32} strokeWidth={3} />
        </button>
      </div>

      <button onClick={() => onTabChange('settings')} className="flex-1 flex flex-col items-center gap-1.5 transition-all">
        <Settings size={24} className={activeTab === 'settings' ? 'text-brand-blue-bright' : 'text-white/30'} />
        <span className={`text-[9px] font-black uppercase ${activeTab === 'settings' ? 'text-brand-blue-bright' : 'text-white/30'}`}>Params</span>
      </button>

      <button onClick={() => onTabChange('profile')} className="flex-1 flex flex-col items-center gap-1.5 transition-all">
        <UserIcon size={24} className={activeTab === 'profile' ? 'text-brand-blue-bright' : 'text-white/30'} />
        <span className={`text-[9px] font-black uppercase ${activeTab === 'profile' ? 'text-brand-blue-bright' : 'text-white/30'}`}>Profil</span>
      </button>
    </nav>
  );
}

/* ============================================
   DESKTOP TOP BAR
============================================ */
function DesktopTopBar({ activeTab }) {
  const { dispatch, state } = useApp();
  const { searchQuery } = state;
  const tabLabel = NAV_ITEMS.find(n => n.id === activeTab)?.label || 'NoRegis';

  return (
    <header className="h-20 bg-white dark:bg-[#0D1117]/80 backdrop-blur-md border-b border-slate-100 dark:border-white/5 px-8 flex items-center justify-between sticky top-0 z-[90]">
      <div className="flex items-center gap-8">
        <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{tabLabel}</h2>
        
        {/* Search */}
        <div className="relative group w-80">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-blue-bright transition-colors" />
          <input
            type="text"
            placeholder="Rechercher..."
            value={searchQuery}
            onChange={e => dispatch({ type: 'SET_SEARCH', payload: e.target.value })}
            className="w-full bg-slate-50 dark:bg-white/5 border-2 border-transparent focus:border-brand-blue-bright/20 focus:bg-white dark:focus:bg-slate-800 rounded-lg py-2.5 pl-12 pr-4 text-sm font-bold text-slate-900 dark:text-slate-100 outline-none transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-6">
        <button className="relative p-2.5 bg-slate-50 dark:bg-white/5 text-slate-400 hover:text-brand-blue-bright rounded-xl transition-all">
          <Bell size={20} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-brand-red-bright rounded-full border-2 border-white dark:border-[#0D1117]" />
        </button>
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

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  return (
    <div className={`min-h-screen flex ${state.darkMode ? 'dark' : ''} transition-colors duration-300`}>
      {/* Desktop Sidebar */}
      {!isMobile && (
        <Sidebar activeTab={activeTab} onTabChange={onTabChange} onNewEntry={() => setRegOpen(true)} />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-100 dark:bg-[#0D1117]">
        {isMobile ? (
          <MobileHeader activeTab={activeTab} />
        ) : (
          <DesktopTopBar activeTab={activeTab} />
        )}

        <main className={`flex-1 overflow-y-auto w-full ${isMobile ? 'pb-24' : ''}`}>
          <div className="w-full h-full">
            {React.cloneElement(children, { isMobile })}
          </div>
        </main>
      </div>

      {/* Mobile Nav */}
      {isMobile && (
        <BottomNav activeTab={activeTab} onTabChange={onTabChange} onNewEntry={() => setRegOpen(true)} />
      )}

      {/* Global Modals */}
      <RegistrationModal isOpen={regOpen} onClose={() => setRegOpen(false)} />
    </div>
  );
}
