import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Layout } from './components/Layout';
import { Toast } from './components/UI';
import { Dashboard, Historique } from './pages/Dashboard';
import { Parametres, ProfilAgent } from './pages/Settings';

/* ============================================
   INNER APP (has access to context)
============================================ */
function AppInner() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { state } = useApp();

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
