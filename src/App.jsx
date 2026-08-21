import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { useApp } from './context/useAppState';
import { Layout } from './components/Layout';
import { Toast } from './components/UI';
import { Parametres, ProfilAgent } from './pages/Settings';
import { Login } from './pages/Login';
import { visitService } from './services/visitService';
import { PublicScan } from './pages/PublicScan';
import { connectSocket, disconnectSocket } from './services/socketService';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import AgentsManagement from './pages/admin/Agents';

// Agent Pages
import AgentDashboard from './pages/agent/Dashboard';
import AgentHistorique from './pages/agent/Historique';

/* ============================================
   INNER APP (has access to context and router)
============================================ */
function AppInner() {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  // Determine active tab based on route path
  const path = location.pathname.replace('/', '') || 'dashboard';
  const activeTab = path;

  const handleTabChange = (tabId) => {
    navigate('/' + tabId);
  };

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

  // Socket.IO — connexion temps réel après authentification (Backend v2)
  useEffect(() => {
    if (!state.isAuthenticated) {
      disconnectSocket();
      return;
    }
    connectSocket(dispatch);
    return () => { disconnectSocket(); };
  }, [state.isAuthenticated, dispatch]);

  // Public scan route should be reachable sans login.
  if (location.pathname.startsWith('/scan/')) {
    return (
      <div className={state.darkMode ? 'dark' : ''} style={{ minHeight: '100vh' }}>
        <PublicScan />
        <Toast />
      </div>
    );
  }

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

  return (
    <div className={state.darkMode ? 'dark' : ''} style={{ minHeight: '100vh' }}>
      <Layout activeTab={activeTab} onTabChange={handleTabChange}>
        <Routes>
          <Route path="/dashboard" element={isAdmin ? <AdminDashboard /> : <AgentDashboard />} />
          <Route path="/history" element={<AgentHistorique />} />
          {isAdmin && <Route path="/agents" element={<AgentsManagement />} />}
          <Route path="/settings" element={<Parametres />} />
          <Route path="/profile" element={<ProfilAgent />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
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
      <Router>
        <AppInner />
      </Router>
    </AppProvider>
  );
}
