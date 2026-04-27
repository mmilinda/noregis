import { useState } from 'react';
import { AppProvider } from './context/AppContext';
import { useApp } from './context/useAppState';
import { Layout } from './components/Layout';
import { Toast } from './components/UI';
import { Dashboard, Historique } from './pages/Dashboard';
import { Parametres, ProfilAgent } from './pages/Settings';
import { Login } from './pages/Login';

/* ============================================
   INNER APP (has access to context)
============================================ */
function AppInner() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { state } = useApp();

  // If not authenticated, show only the Login page
  if (!state.isAuthenticated) {
    return (
      <div className={state.darkMode ? 'dark' : ''}>
        <Login />
        <Toast />
      </div>
    );
  }

  const pages = {
    dashboard: <Dashboard />,
    history:   <Historique />,
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
