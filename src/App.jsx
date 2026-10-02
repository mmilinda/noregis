import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { useApp } from './context/useAppState';
import { Layout } from './components/Layout';
import { Toast } from './components/UI';
import { Parametres, ProfilAgent } from './pages/Settings';
import { Login } from './pages/Login';
import { visitService } from './services/visitService';
import { bugService } from './services/bugService';
import { PublicScan } from './pages/PublicScan';
import { connectSocket, disconnectSocket } from './services/socketService';

// SuperAdmin Components
import { SuperAdminDashboard } from './components/SuperAdminDashboard';
import EntreprisesManagement from './pages/superadmin/Entreprises';
import SecteursManagement from './pages/superadmin/Secteurs';
import AdminsManagement from './pages/superadmin/Admins';
import ComptesManagement from './pages/superadmin/Comptes';

// Admin & Agent Pages
import AdminDashboard from './pages/admin/Dashboard';
import AgentsManagement from './pages/admin/Agents';
import DepartementsManagement from './pages/admin/Departements';
import AgentDashboard from './pages/agent/Dashboard';
import AgentHistorique from './pages/agent/Historique';
import BugsManagement from './pages/Bugs';
import RendezVousManagement from './pages/RendezVous';

/* ============================================
   INNER APP (has access to context and router)
============================================ */
function AppInner() {
  const { state, dispatch, notify } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  // Determine active tab based on route path with alias support
  const rawPath = location.pathname.split('/')[1] || 'dashboard';
  const pathAliasMap = {
    'profil': 'profile',
    'parametres': 'settings',
    'historique': 'history',
    'signalements': 'bugs',
    'rendez-vous': 'rdv',
  };
  const activeTab = pathAliasMap[rawPath] || rawPath;

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

  // Écouteur global d'expiration de session (Token expiré / manquant)
  useEffect(() => {
    const handleExpired = () => {
      dispatch({ type: 'LOGOUT' });
      if (notify) notify('error', 'Votre session a expiré (durée 2h). Veuillez vous reconnecter.');
      navigate('/login');
    };
    window.addEventListener('auth:expired', handleExpired);
    return () => window.removeEventListener('auth:expired', handleExpired);
  }, [dispatch, navigate, notify]);

  // Global data preload — runs once after authentication regardless of role.
  // Ensures Historique and any other page that reads state.visitors or state.bugs always has data.
  useEffect(() => {
    if (!state.isAuthenticated) return;
    let cancelled = false;
    (async () => {
      try {
        const [visitData, bugData] = await Promise.all([
          visitService.getAll().catch(() => ({})),
          bugService.getAll().catch(() => ({})),
        ]);
        if (!cancelled) {
          const rawVis = Array.isArray(visitData) 
            ? visitData 
            : (visitData?.visites || visitData?.visits || visitData?.data?.visites || visitData?.data || []);
          if (rawVis && rawVis.length > 0) {
            const uniqueVis = Array.from(new Map(rawVis.map(v => [v._id || v.id, v])).values());
            dispatch({ type: 'SET_VISITORS', payload: uniqueVis });
          }
          const rawBugs = Array.isArray(bugData)
            ? bugData
            : (bugData?.bugs || bugData?.data?.bugs || bugData?.data || []);
          if (rawBugs && rawBugs.length > 0) {
            dispatch({ type: 'SET_BUGS', payload: rawBugs });
          }
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

  const role = (state.agent?.role || state.user?.role || '').toUpperCase();
  const isSuperAdmin = role === 'SUPER_ADMIN' || role === 'SUPERADMIN';
  const isAdmin = role === 'ADMIN';

  return (
    <div className={state.darkMode ? 'dark' : ''} style={{ minHeight: '100vh' }}>
      <Layout activeTab={activeTab} onTabChange={handleTabChange}>
        <Routes>
          <Route
            path="/dashboard"
            element={
              isSuperAdmin ? <SuperAdminDashboard /> : (isAdmin ? <AdminDashboard /> : <AgentDashboard />)
            }
          />
          {isSuperAdmin && <Route path="/superadmin" element={<SuperAdminDashboard />} />}
          {isSuperAdmin && <Route path="/entreprises" element={<EntreprisesManagement />} />}
          {isSuperAdmin && <Route path="/secteurs" element={<SecteursManagement />} />}
          {(isSuperAdmin || isAdmin) && <Route path="/departements" element={<DepartementsManagement />} />}
          {isSuperAdmin && <Route path="/admins" element={<AdminsManagement />} />}
          {(isSuperAdmin || isAdmin) && <Route path="/agents" element={<AgentsManagement />} />}
          {isSuperAdmin && <Route path="/comptes" element={<ComptesManagement />} />}
          <Route path="/rdv" element={<RendezVousManagement />} />
          <Route path="/rendez-vous" element={<RendezVousManagement />} />
          <Route path="/history" element={<AgentHistorique />} />
          <Route path="/historique" element={<AgentHistorique />} />
          <Route path="/bugs" element={<BugsManagement />} />
          <Route path="/signalements" element={<BugsManagement />} />
          <Route path="/settings" element={<Parametres />} />
          <Route path="/parametres" element={<Parametres />} />
          <Route path="/profile" element={<ProfilAgent />} />
          <Route path="/profil" element={<ProfilAgent />} />
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
