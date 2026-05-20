import { useState, useEffect, useCallback } from 'react';
import { AppProvider } from './context/AppContext';
import { useApp } from './context/useAppState';
import { Layout } from './components/Layout';
import { Toast } from './components/UI';
import { Dashboard, Historique } from './pages/Dashboard';
import { Parametres, ProfilAgent } from './pages/Settings';
import { Login } from './pages/Login';
import { visitService } from './services/visitService';

import AdminDashboard from './pages/AdminDashboard';
import AgentsManagement from './pages/Agents';

/* ============================================
   INNER APP (has access to context)
============================================ */
function AppInner() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { state, dispatch } = useApp();

  // Sync font size and dark mode to <html> element
  useEffect(() => {
    const html = document.documentElement;
    html.className = '';
    if (state.darkMode) html.classList.add('dark');
    if (state.settings?.fontSize) html.classList.add(`font-${state.settings.fontSize}`);
  }, [state.darkMode, state.settings?.fontSize]);

  // Global data preload — runs once after authentication regardless of role.
  // Ensures Historique and any other page that reads state.visitors always has data.
  useEffect(() => {
    if (!state.isAuthenticated) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await visitService.getAll();
        if (!cancelled) {
          const raw = data.visites || [];
          const unique = Array.from(new Map(raw.map(v => [v._id || v.id, v])).values());
          dispatch({ type: 'SET_VISITORS', payload: unique });
        }
      } catch {
        // Silent — individual pages can handle their own error states
      }
    })();
    return () => { cancelled = true; };
  }, [state.isAuthenticated, dispatch]);

  // If not authenticated, show only the Login page
  if (!state.isAuthenticated) {
    return (
      <>
        <Login />
        <Toast />
      </>
    );
  }

  const isAdmin = state.agent?.role === 'ADMIN';

  const pages = {
    dashboard: isAdmin ? <AdminDashboard /> : <Dashboard />,
    history:   <Historique />,
    ...(isAdmin ? { agents: <AgentsManagement /> } : {}),
    settings:  <Parametres />,
    profile:   <ProfilAgent />,
  };

  const currentPage = pages[activeTab] || pages.dashboard;

  return (
    <div className={state.darkMode ? 'dark' : ''} style={{ minHeight: '100vh' }}>
      <Layout activeTab={activeTab} onTabChange={setActiveTab}>
        {currentPage}
      </Layout>
      <Toast />
    </div>
  );
}

/* ============================================
   ROOT APP
============================================ */
export default function App() {
  return (
    <AppProvider>
      <AppInner />
    </AppProvider>
  );
}
