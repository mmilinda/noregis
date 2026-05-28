import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard, History, Settings, User as UserIcon,
  Shield, Plus, Bell, Search, LogOut, HelpCircle } from 'lucide-react';
import { useApp } from '../context/useAppState';
import { RegistrationModal } from './RegistrationModal';
import { TRANSLATIONS } from '../translations';

/* ============================================
   DESKTOP SIDEBAR  — Persana-style light
============================================ */
function Sidebar({ activeTab, onTabChange, onNewEntry, t, navItems }) {
  const { state, dispatch } = useApp();
  const { agent } = state;

  return (
    <aside className="w-[260px] bg-white dark:bg-[#161B22] flex flex-col h-screen sticky top-0 border-r border-slate-200 dark:border-slate-800 overflow-hidden z-[100]">
      {/* Logo */}
      <div className="p-6 pb-5 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-blue-bright to-blue-600 flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/20">
            <Shield size={22} className="text-white fill-white/20" />
          </div>
          <div>
            <p className="text-lg font-black text-slate-900 dark:text-white tracking-tight">NoRegis</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Registre Digital</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="px-3 py-4 flex-1 flex flex-col gap-0.5 overflow-y-auto">
        {navItems.map(({ id, label, icon: Icon }) => {
          const active = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className={`
                flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 group relative
                ${active
                  ? 'bg-blue-50 dark:bg-brand-blue-bright/10 text-brand-blue-bright'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/5'
                }
              `}
            >
              {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-brand-blue-bright rounded-r-full" />}
              <Icon size={20} className={active ? 'text-brand-blue-bright' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'} />
              <span className="text-[13px] font-semibold">{label}</span>
            </button>
          );
        })}
      </nav>

      {/* CTA */}
      {agent?.role !== 'ADMIN' && (
        <div className="px-4 pb-2">
         
        </div>
      )}

      {/* Help Center */}
      <div className="px-3 pb-1">
        
      </div>

      {/* Agent & Logout */}
      <div className="border-t border-slate-100 dark:border-slate-800">
        <div
          className="p-4 flex items-center gap-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group"
          onClick={() => onTabChange('profile')}
        >
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-[11px] font-black shrink-0 overflow-hidden group-hover:shadow-md transition-all">
            {agent.photo ? <img src={agent.photo} alt="" className="w-full h-full object-cover" /> : agent.initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-slate-800 dark:text-white truncate">{agent.prenom} {agent.nom}</p>
            <p className="text-[9px] font-black text-slate-400 uppercase truncate">{agent.role}</p>
          </div>
        </div>

       
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
    <header className="sticky top-0 z-[100] bg-white dark:bg-[#161B22] p-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand-blue-bright to-blue-600 flex items-center justify-center">
          <Shield size={18} className="text-white fill-white/20" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-base font-black text-slate-900 dark:text-white tracking-tight">NoRegis</span>
          <span className="text-xs font-bold text-slate-400">/ {tabLabel}</span>
        </div>
      </div>
    </header>
  );
}

/* ============================================
   MOBILE BOTTOM NAV
============================================ */
function BottomNav({ activeTab, onTabChange, onNewEntry, t, navItems }) {
  const { state } = useApp();
  const isAdmin = state.agent?.role === 'ADMIN';

  const renderItem = ({ id, label, icon: Icon }) => {
    const active = activeTab === id;
    return (
      <button key={id} onClick={() => onTabChange(id)} className="flex-grow flex flex-col items-center gap-1.5 transition-all">
        <div className="relative">
          <Icon size={24} className={active ? 'text-brand-blue-bright' : 'text-slate-400'} />
        </div>
        <span className={`text-[8px] font-black uppercase tracking-tight ${active ? 'text-brand-blue-bright' : 'text-slate-400'}`}>{label}</span>
      </button>
    );
  };

  if (isAdmin) {
    return (
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-[#161B22] border-t border-slate-200 dark:border-slate-800 flex items-center justify-around px-2 pb-safe-area z-[100] h-20 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        {navItems.map(renderItem)}
      </nav>
    );
  }

  const midIndex = Math.ceil(navItems.length / 2);
  const leftItems = navItems.slice(0, midIndex);
  const rightItems = navItems.slice(midIndex);

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-[#161B22] border-t border-slate-200 dark:border-slate-800 flex items-center justify-around px-2 pb-safe-area z-[100] h-20 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
      {leftItems.map(renderItem)}

      {/* FAB */}
      <div className="relative -top-6 px-2 shrink-0">
        <button
          onClick={onNewEntry}
          className="w-16 h-16 rounded-xl bg-gradient-to-br from-brand-blue-bright to-blue-600 text-white flex items-center justify-center border-4 border-white dark:border-[#161B22] active:scale-90 transition-transform shadow-lg shadow-blue-500/20"
        >
          <Plus size={32} strokeWidth={3} />
        </button>
      </div>

      {rightItems.map(renderItem)}
    </nav>
  );
}

/* ============================================
   DESKTOP TOP BAR
============================================ */
function DesktopTopBar({ activeTab, navItems, t }) {
  const { dispatch, state } = useApp();
  const { searchQuery } = state;
  const tabLabel = navItems.find(n => n.id === activeTab)?.label || 'NoRegis';

  return (
    <header className="h-16 bg-white dark:bg-[#161B22] border-b border-slate-200 dark:border-slate-800 px-8 flex items-center justify-between sticky top-0 z-[90]">
      <div className="flex items-center gap-8">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">{tabLabel}</h2>

        {/* Search */}
        <div className="relative group w-72">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-blue-bright transition-colors" />
          <input
            type="text"
            placeholder={t.search}
            value={searchQuery}
            onChange={e => dispatch({ type: 'SET_SEARCH', payload: e.target.value })}
            className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-slate-700 focus:border-brand-blue-bright/40 focus:bg-white dark:focus:bg-slate-800 rounded-lg py-2 pl-10 pr-4 text-sm text-slate-900 dark:text-slate-100 outline-none transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="relative p-2 text-slate-400 hover:text-brand-blue-bright hover:bg-slate-50 dark:hover:bg-white/5 rounded-lg transition-all">
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-[#161B22]" />
        </button>
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
      <div className="flex-1 flex flex-col min-w-0 bg-[#F8F9FC] dark:bg-[#0D1117]">
        {isMobile ? (
          <MobileHeader activeTab={activeTab} navItems={navItems} />
        ) : (
          <DesktopTopBar activeTab={activeTab} navItems={navItems} t={t} />
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

      {/* Global Modals */}
      <RegistrationModal isOpen={regOpen} onClose={() => setRegOpen(false)} />
    </div>
  );
}
