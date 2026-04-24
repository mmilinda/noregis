import React, { useState, useEffect, useRef } from 'react';
import {
  Camera,
  History,
  Bell,
  User,
  Building,
  CreditCard,
  Clock,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  LogOut,
  Scan,
  AlertTriangle,
  QrCode,
  X,
  Zap,
  LayoutDashboard,
  Settings,
  Search,
  Menu,
  MoreVertical,
  Moon,
  Sun,
  Languages,
  Type,
  Calendar,
  RefreshCw,
  WifiOff,
  Database,
  Trash2,
  Globe,
  LifeBuoy,
  HelpCircle,
  Bug,
  MessageSquare,
  FileText,
  ShieldAlert,
  Info,
  Mail,
  Smartphone,
  Volume2,
  Shield,
  Upload,
  Phone,
  Mail as MailIcon,
  BadgeCheck
} from 'lucide-react';

const Header = ({ isMobile, onMenuToggle, onProfileClick }) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedDate = time.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).toUpperCase();

  return (
    <header className="app-header">
      <div className="header-left">
        {isMobile && (
          <button className="menu-trigger-btn" onClick={onMenuToggle}>
            <Menu size={28} />
          </button>
        )}
        <div className="brand-group">
          <div className="logo-placeholder">
            <Shield size={28} fill="currentColor" />
          </div>
          <h1 className="brand-title">INCLUSIVE AGENT</h1>
          {!isMobile && <span className="terminal-id">TERMINAL A1 • SECURE ACCESS</span>}
        </div>
      </div>

      <div className="header-right">
        {!isMobile && (
          <div className="search-bar">
            <Search size={18} />
            <input type="text" placeholder="SEARCH VISITORS..." />
          </div>
        )}
        <div className="timestamp-badge">
          <Clock size={16} strokeWidth={3} />
          <div className="time-date-group">
            <span className="current-date">{formattedDate}</span>
            <span className="current-time">{time.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>
        {!isMobile && (
          <div className="agent-profile clickable" onClick={onProfileClick}>
            <div className="avatar">JD</div>
            <div className="profile-info">
              <span className="agent-name">OFFICER SMITH</span>
              <span className="agent-role">LEVEL 4 SECURITY</span>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

const ProfilePage = ({ agent, onPhotoUpload }) => {
  const fileInputRef = useRef(null);

  return (
    <div className="profile-page">
      <div className="profile-hero">
        <div className="profile-photo-container">
          <div className="profile-photo">
            {agent.photo ? <img src={agent.photo} alt="Agent" /> : <span>{agent.initials}</span>}
          </div>
          <button className="upload-badge" onClick={() => fileInputRef.current.click()}>
            <Camera size={20} />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            hidden
            accept="image/*"
            onChange={onPhotoUpload}
          />
        </div>
        <div className="profile-main-info">
          <h1>{agent.name}</h1>
          <div className="badge-row">
            <span className="status-pill verified">
              <BadgeCheck size={14} /> {agent.role}
            </span>
            <span className="id-tag">ID: {agent.id}</span>
          </div>
        </div>
      </div>

      <div className="profile-grid">
        <section className="data-section">
          <SectionHeader title="COORDONNÉES" />
          <div className="data-list">
            <DataField label="ADRESSE EMAIL" value={agent.email} icon={MailIcon} />
            <DataField label="TÉLÉPHONE" value={agent.phone} icon={Phone} />
            <DataField label="DÉPARTEMENT" value={agent.department} icon={Building} />
          </div>
        </section>

        <section className="data-section">
          <SectionHeader title="DÉTAILS OPÉRATIONNELS" />
          <div className="data-list">
            <DataField label="NIVEAU D'ACCRÉDITATION" value={agent.clearance} icon={ShieldCheck} />
            <DataField label="DERNIÈRE CONNEXION" value="AUJOURD'HUI, 08:30" icon={Clock} />
            <DataField label="DATE D'ENGAGEMENT" value={agent.joinedDate} icon={Calendar} />
          </div>
        </section>
      </div>

      <div className="profile-actions">
        <button className="checkout-btn secondary">MODIFIER LE PROFIL</button>
        <button className="checkout-btn">DÉCONNEXION</button>
      </div>
    </div>
  );
};

const MobileMenu = ({ isOpen, onClose, activeTab, onTabChange, onProfileClick }) => (
  <div className={`mobile-menu-overlay ${isOpen ? 'open' : ''}`} onClick={onClose}>
    <div className="mobile-menu-drawer" onClick={e => e.stopPropagation()}>
      <div className="drawer-header">
        <h2 className="brand-title">MENU</h2>
        <button className="close-drawer-btn" onClick={onClose}><X size={32} /></button>
      </div>
      <nav className="drawer-nav">
        <button
          className={`drawer-item ${activeTab === 'scan' ? 'active' : ''}`}
          onClick={() => { onTabChange('scan'); onClose(); }}
        >
          <LayoutDashboard size={24} />
          <span>DASHBOARD</span>
        </button>
        <button
          className={`drawer-item ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => { onTabChange('history'); onClose(); }}
        >
          <History size={24} />
          <span>VISIT HISTORY</span>
        </button>
        <button
          className={`drawer-item ${activeTab === 'alerts' ? 'active' : ''}`}
          onClick={() => { onTabChange('alerts'); onClose(); }}
        >
          <div className="alert-wrapper">
            <Bell size={24} />
            <div className="alert-dot"></div>
          </div>
          <span>SYSTEM ALERTS</span>
        </button>
        <button
          className={`drawer-item ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => { onTabChange('settings'); onClose(); }}
        >
          <Settings size={24} />
          <span>SETTINGS</span>
        </button>
      </nav>
      <div className="drawer-footer">
        <div className="agent-profile mini clickable" onClick={() => { onProfileClick(); onClose(); }}>
          <div className="avatar">JD</div>
          <div className="profile-info">
            <span className="agent-name">OFFICER SMITH</span>
            <span className="agent-role">LEVEL 4 SECURITY</span>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const Sidebar = ({ activeTab, onTabChange }) => (
  <aside className="app-sidebar">
    <nav className="sidebar-nav">
      <button
        className={`sidebar-item ${activeTab === 'scan' ? 'active' : ''}`}
        onClick={() => onTabChange('scan')}
      >
        <LayoutDashboard size={24} />
        <span>DASHBOARD</span>
      </button>
      <button
        className={`sidebar-item ${activeTab === 'history' ? 'active' : ''}`}
        onClick={() => onTabChange('history')}
      >
        <History size={24} />
        <span>VISIT HISTORY</span>
      </button>
      <button
        className={`sidebar-item ${activeTab === 'alerts' ? 'active' : ''}`}
        onClick={() => onTabChange('alerts')}
      >
        <div className="alert-wrapper">
          <Bell size={24} />
          <div className="alert-dot"></div>
        </div>
        <span>SYSTEM ALERTS</span>
      </button>
      <div className="sidebar-divider"></div>
      <button
        className={`sidebar-item ${activeTab === 'settings' ? 'active' : ''}`}
        onClick={() => onTabChange('settings')}
      >
        <Settings size={24} />
        <span>SETTINGS</span>
      </button>
    </nav>

    <button className="sidebar-scan-btn" onClick={() => onTabChange('live-scan')}>
      <Camera size={24} strokeWidth={3} />
      <span>START NEW SCAN</span>
    </button>
  </aside>
);

const SectionHeader = ({ title }) => (
  <div className="section-header">
    <h2>{title}</h2>
  </div>
);

const DataField = ({ label, value, icon: Icon, color = 'primary' }) => (
  <div className="data-field">
    <div className={`icon-container ${color}`}>
      <Icon size={24} strokeWidth={2.5} />
    </div>
    <div className="field-content">
      <label>{label}</label>
      <div className="field-value">{value || 'NOT REGISTERED'}</div>
    </div>
  </div>
);

const SettingRow = ({ icon: Icon, label, description, children }) => (
  <div className="setting-row">
    <div className="setting-info">
      <div className="setting-icon">
        <Icon size={20} />
      </div>
      <div className="setting-text">
        <div className="setting-label">{label}</div>
        {description && <div className="setting-description">{description}</div>}
      </div>
    </div>
    <div className="setting-control">
      {children}
    </div>
  </div>
);

const Toggle = ({ active, onClick }) => (
  <button className={`toggle-btn ${active ? 'active' : ''}`} onClick={onClick}>
    <div className="toggle-thumb"></div>
  </button>
);

const AlertsPage = ({ notifications, updateNotification }) => (
  <div className="alerts-page">
    <section className="settings-section">
      <SectionHeader title="🔔 NOTIFICATIONS" />
      <div className="settings-card">
        <SettingRow icon={User} label="NOUVELLES VISITES" description="Alerte lors d'un scan réussi">
          <Toggle active={notifications.newVisits} onClick={() => updateNotification('newVisits', !notifications.newVisits)} />
        </SettingRow>
        <SettingRow icon={Calendar} label="RAPPELS DE RENDEZ-VOUS" description="Alertes pour les visites planifiées">
          <Toggle active={notifications.reminders} onClick={() => updateNotification('reminders', !notifications.reminders)} />
        </SettingRow>
        <SettingRow icon={Mail} label="NOTIFICATIONS EMAIL" description="Envoyer un rapport par email">
          <Toggle active={notifications.email} onClick={() => updateNotification('email', !notifications.email)} />
        </SettingRow>
        <SettingRow icon={Smartphone} label="NOTIFICATIONS SMS / PUSH" description="Alertes directes sur mobile">
          <Toggle active={notifications.push} onClick={() => updateNotification('push', !notifications.push)} />
        </SettingRow>
        <SettingRow icon={Volume2} label="SONS DE NOTIFICATION" description="Retour sonore lors des alertes">
          <Toggle active={notifications.sounds} onClick={() => updateNotification('sounds', !notifications.sounds)} />
        </SettingRow>
      </div>
    </section>

    <section className="settings-section">
      <SectionHeader title="👉 EXEMPLES DE CONFIGURATION" />
      <div className="settings-card">
        <div className="example-row">
          <div className={`radio-mock ${notifications.reminderOneHour ? 'active' : ''}`} onClick={() => updateNotification('reminderOneHour', !notifications.reminderOneHour)}></div>
          <span>Activer rappel 1h avant visite</span>
        </div>
        <div className="example-row">
          <div className={`radio-mock ${notifications.mailAfterValidation ? 'active' : ''}`} onClick={() => updateNotification('mailAfterValidation', !notifications.mailAfterValidation)}></div>
          <span>Recevoir mail après validation</span>
        </div>
      </div>
    </section>
  </div>
);

const SettingsPage = ({ settings, updateSetting }) => (
  <div className="settings-page">
    <section className="settings-section">
      <SectionHeader title="APPARENCE (UI/UX)" />
      <div className="settings-card">
        <SettingRow icon={Moon} label="MODE SOMBRE" description="Passer l'interface en mode nuit">
          <Toggle active={settings.darkMode} onClick={() => updateSetting('darkMode', !settings.darkMode)} />
        </SettingRow>
        <SettingRow icon={Globe} label="LANGUE" description="Choisir la langue d'interface">
          <select value={settings.language} onChange={(e) => updateSetting('language', e.target.value)}>
            <option value="fr">FRANÇAIS</option>
            <option value="en">ENGLISH</option>
            <option value="es">ESPAÑOL</option>
          </select>
        </SettingRow>
        <SettingRow icon={Type} label="TAILLE DE POLICE" description="Ajuster pour la lisibilité">
          <select value={settings.fontSize} onChange={(e) => updateSetting('fontSize', e.target.value)}>
            <option value="small">PETITE</option>
            <option value="medium">MOYENNE</option>
            <option value="large">GRANDE</option>
          </select>
        </SettingRow>
        <SettingRow icon={Calendar} label="FORMAT DE DATE" description="Préférence d'affichage">
          <select value={settings.dateFormat} onChange={(e) => updateSetting('dateFormat', e.target.value)}>
            <option value="DD/MM/YYYY">JJ/MM/AAAA</option>
            <option value="MM/DD/YYYY">MM/JJ/AAAA</option>
            <option value="YYYY-MM-DD">AAAA-MM-JJ</option>
          </select>
        </SettingRow>
      </div>
    </section>

    <section className="settings-section">
      <SectionHeader title="SYNCHRONISATION & DONNÉES" />
      <div className="settings-card">
        <SettingRow icon={RefreshCw} label="SYNCHRONISATION AUTOMATIQUE" description="Mise à jour en temps réel">
          <Toggle active={settings.autoSync} onClick={() => updateSetting('autoSync', !settings.autoSync)} />
        </SettingRow>
        <SettingRow icon={WifiOff} label="MODE HORS LIGNE" description="Permet de scanner sans connexion">
          <Toggle active={settings.offlineMode} onClick={() => updateSetting('offlineMode', !settings.offlineMode)} />
        </SettingRow>
        <SettingRow icon={Database} label="SAUVEGARDE DES DONNÉES" description="Dernière sauvegarde: Il y a 2h">
          <button className="action-link-btn">SAUVEGARDER</button>
        </SettingRow>
        <SettingRow icon={Trash2} label="NETTOYAGE DU CACHE" description="Libérer de l'espace sur le terminal">
          <button className="action-link-btn delete">NETTOYER</button>
        </SettingRow>
      </div>
    </section>

    <section className="settings-section">
      <SectionHeader title="SUPPORT & ASSISTANCE" />
      <div className="settings-card">
        <SettingRow icon={LifeBuoy} label="CONTACTER LE SUPPORT" description="Assistance technique 24/7">
          <button className="action-link-btn">CONTACT</button>
        </SettingRow>
        <SettingRow icon={HelpCircle} label="FAQ" description="Questions fréquemment posées">
          <button className="action-link-btn">CONSULTER</button>
        </SettingRow>
        <SettingRow icon={Bug} label="SIGNALER UN BUG" description="Aidez-nous à améliorer l'outil">
          <button className="action-link-btn delete">SIGNALER</button>
        </SettingRow>
        <SettingRow icon={MessageSquare} label="SUGGESTIONS" description="Proposez des améliorations">
          <button className="action-link-btn">PROPOSER</button>
        </SettingRow>
      </div>
    </section>

    <section className="settings-section">
      <SectionHeader title="INFORMATIONS LÉGALES" />
      <div className="settings-card">
        <SettingRow icon={FileText} label="CONDITIONS D'UTILISATION" description="Règles et engagements">
          <button className="action-link-btn">LIRE</button>
        </SettingRow>
        <SettingRow icon={ShieldAlert} label="POLITIQUE DE CONFIDENTIALITÉ" description="Gestion de vos données">
          <button className="action-link-btn">LIRE</button>
        </SettingRow>
        <SettingRow icon={Info} label="VERSION" description="Détails de l'application">
          <span className="version-tag">v2.4.0-STABLE</span>
        </SettingRow>
      </div>
    </section>
  </div>
);

const LiveScanner = ({ onClose, onScan }) => {
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          setStream(mediaStream);
          setIsInitializing(false);
        }
      } catch (err) {
        console.error("Camera access error:", err);
        setIsInitializing(false);
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <div className="scanner-overlay">
      <div className="scanner-modal">
        <div className="scanner-header">
          <button className="close-btn" onClick={onClose}><X size={32} /></button>
          <span className="scanner-title">LIVE DOCUMENT SENSOR</span>
          <button className="flash-btn"><Zap size={24} /></button>
        </div>

        <div className="scanner-viewfinder">
          {isInitializing && <div className="loading-spinner">INITIALIZING SENSOR...</div>}
          <video ref={videoRef} autoPlay playsInline muted className="live-feed" />
          <div className="scanner-frame">
            <div className="corner top-left"></div>
            <div className="corner top-right"></div>
            <div className="corner bottom-left"></div>
            <div className="corner bottom-right"></div>
            <div className="scan-line"></div>
          </div>
          <div className="scanner-instructions">
            ALIGN ID CARD WITHIN THE FRAME
          </div>
        </div>

        <div className="scanner-controls">
          <button className="capture-trigger" onClick={() => onScan()}>
            <div className="outer-ring">
              <div className="inner-circle"></div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

const VisitHistory = ({ history }) => (
  <div className="history-page">
    <SectionHeader title="COMPLETE VISIT HISTORY" />
    <div className="history-list">
      <div className="history-header">
        <div className="col">VISITOR</div>
        <div className="col">COMPANY</div>
        <div className="col">DATE</div>
        <div className="col">TIME</div>
        <div className="col">STATUS</div>
      </div>
      {history.map((visit, index) => (
        <div key={index} className="history-row">
          <div className="col">
            <span className="visitor-name">{visit.name}</span>
            <span className="visitor-id">{visit.id}</span>
          </div>
          <div className="col">{visit.company}</div>
          <div className="col">{visit.scanDate}</div>
          <div className="col">{visit.entryTime}</div>
          <div className="col">
            <span className={`status-pill ${visit.status.toLowerCase()}`}>{visit.status}</span>
          </div>
        </div>
      ))}
    </div>
  </div>
);

function App() {
  const [isScanning, setIsScanning] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('scan');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [history, setHistory] = useState([
    {
      name: 'SARAH MILLER',
      id: 'SN-782-991-X',
      company: 'TECH SOLUTIONS INC',
      docType: 'NATIONAL PASSPORT',
      purpose: 'SECURITY AUDIT',
      host: 'LT. ROBERTSON',
      entryTime: '14:22:15',
      scanDate: '24/04/2026',
      location: 'GATE 4 - NORTH ENTRANCE',
      status: 'VERIFIED'
    },
    {
      name: 'JOHN DOE',
      id: 'ID-442-123-A',
      company: 'GLOBAL LOGISTICS',
      docType: 'DRIVERS LICENSE',
      purpose: 'DELIVERY',
      host: 'MAINTENANCE',
      entryTime: '09:15:30',
      scanDate: '24/04/2026',
      location: 'MAIN GATE',
      status: 'VERIFIED'
    }
  ]);
  const [visitorData, setVisitorData] = useState(history[0]);
  const [settings, setSettings] = useState({
    darkMode: false,
    language: 'fr',
    fontSize: 'medium',
    dateFormat: 'DD/MM/YYYY',
    autoSync: true,
    offlineMode: false
  });
  const [notifications, setNotifications] = useState({
    newVisits: true,
    reminders: true,
    email: false,
    push: true,
    sounds: true,
    reminderOneHour: false,
    mailAfterValidation: true
  });
  const [agentProfile, setAgentProfile] = useState({
    name: 'OFFICER SMITH',
    initials: 'JD',
    role: 'LEVEL 4 SECURITY',
    id: 'AGENT-7704',
    email: 'j.smith@security-corp.com',
    phone: '+33 6 12 34 56 78',
    department: 'INFRASTRUCTURE CRITIQUE',
    clearance: 'TOP SECRET',
    joinedDate: '12 MARS 2024',
    photo: null
  });

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const updateNotification = (key, value) => {
    setNotifications(prev => ({ ...prev, [key]: value }));
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAgentProfile(prev => ({ ...prev, photo: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleScanSuccess = () => {
    const now = new Date();
    const newVisitor = {
      name: 'MARCUS VANCE',
      id: `ID-${Math.floor(Math.random() * 900) + 100}-XYZ`,
      company: 'VORTEX ENERGY',
      docType: 'CORPORATE ID',
      purpose: 'SITE INSPECTION',
      host: 'CAPT. STERLING',
      entryTime: now.toLocaleTimeString('fr-FR'),
      scanDate: now.toLocaleDateString('fr-FR'),
      location: 'GATE 4 - NORTH ENTRANCE',
      status: 'VERIFIED'
    };

    setHistory([newVisitor, ...history]);
    setVisitorData(newVisitor);
    setIsScanning(false);
    setActiveTab('scan');
  };

  return (
    <div className={`app-wrapper ${isMobile ? 'mobile' : 'desktop'} ${settings.darkMode ? 'dark-mode' : ''}`}>
      {isScanning && <LiveScanner onClose={() => setIsScanning(false)} onScan={handleScanSuccess} />}

      {isMobile && (
        <MobileMenu
          isOpen={isMenuOpen}
          onClose={() => setIsMenuOpen(false)}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onProfileClick={() => setActiveTab('profile')}
        />
      )}

      {!isMobile && <Sidebar activeTab={activeTab} onTabChange={(tab) => tab === 'live-scan' ? setIsScanning(true) : setActiveTab(tab)} />}

      <div className="main-viewport">
        <Header
          isMobile={isMobile}
          onMenuToggle={() => setIsMenuOpen(true)}
          onProfileClick={() => setActiveTab('profile')}
        />

        <main className="content-area">
          {activeTab === 'scan' ? (
            <>
              <div className="status-banner verified">
                <div className="status-indicator">
                  <CheckCircle2 size={24} strokeWidth={3} />
                  <span>STATUS: {visitorData.status}</span>
                </div>
                <div className="status-tag">ON-SITE</div>
              </div>

              <div className="dashboard-grid">
                <section className="data-section">
                  <SectionHeader title="SCANNED DATA" />
                  <div className="data-list">
                    <DataField label="VISITOR NAME" value={visitorData.name} icon={User} />
                    <DataField label="COMPANY / ORGANIZATION" value={visitorData.company} icon={Building} />
                    <DataField label="DOCUMENT ID NUMBER" value={visitorData.id} icon={CreditCard} />
                    <DataField label="DOCUMENT TYPE" value={visitorData.docType} icon={ShieldCheck} />
                  </div>
                </section>

                <section className="data-section">
                  <SectionHeader title="VISIT DETAILS" />
                  <div className="data-list">
                    <DataField label="PURPOSE OF VISIT" value={visitorData.purpose} icon={MapPin} />
                    <DataField label="AUTHORIZED BY" value={visitorData.host} icon={User} />
                    <DataField label="SCANNED DATE" value={visitorData.scanDate} icon={Clock} />
                    <DataField label="ENTRY TIMESTAMP" value={visitorData.entryTime} icon={Clock} />
                    <DataField label="ENTRY POINT" value={visitorData.location} icon={MapPin} />
                  </div>
                </section>
              </div>

              <div className="action-footer">
                <button className="checkout-btn">
                  <LogOut size={28} strokeWidth={3} />
                  <span>CHECK-OUT VISITOR</span>
                </button>
              </div>
            </>
          ) : activeTab === 'history' ? (
            <VisitHistory history={history} />
          ) : activeTab === 'settings' ? (
            <SettingsPage settings={settings} updateSetting={updateSetting} />
          ) : activeTab === 'alerts' ? (
            <AlertsPage notifications={notifications} updateNotification={updateNotification} />
          ) : activeTab === 'profile' ? (
            <ProfilePage agent={agentProfile} onPhotoUpload={handlePhotoUpload} />
          ) : (
            <div className="empty-state">TAB UNDER DEVELOPMENT</div>
          )}
        </main>
      </div>

      {isMobile && (
        <footer className="bottom-nav">
          <div className="nav-container">
            <button className={`nav-btn ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
              <History size={28} strokeWidth={2.5} />
              <span>HISTORY</span>
            </button>

            <button className="scan-trigger" onClick={() => setIsScanning(true)}>
              <div className="scan-circle">
                <Camera size={36} strokeWidth={3} />
              </div>
              <span className="scan-label">SCAN</span>
            </button>

            <button className={`nav-btn ${activeTab === 'alerts' ? 'active' : ''}`} onClick={() => setActiveTab('alerts')}>
              <div className="alert-wrapper">
                <Bell size={28} strokeWidth={2.5} />
                <div className="alert-dot"></div>
              </div>
              <span>ALERTS</span>
            </button>
          </div>
        </footer>
      )}

      <style>{`
        :root {
          --primary: #00328a;
          --primary-container: #0047bb;
          --on-primary: #ffffff;
          --secondary: #006e2e;
          --secondary-container: #93f9a2;
          --on-secondary-container: #007431;
          --tertiary: #6a2100;
          --tertiary-container: #913000;
          --surface: #f9f9fc;
          --surface-container-highest: #e2e2e5;
          --outline: #737685;
          --on-surface: #1a1c1e;
          --on-surface-variant: #434653;
          --sidebar-width: 280px;
        }

        .app-wrapper {
          display: flex;
          min-height: 100vh;
          background: #f0f2f5;
        }

        .main-viewport {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow-x: hidden;
        }

        /* Desktop Sidebar */
        .app-sidebar {
          width: var(--sidebar-width);
          background: var(--primary);
          color: white;
          padding: 32px 16px;
          display: flex;
          flex-direction: column;
          gap: 32px;
          position: sticky;
          top: 0;
          height: 100vh;
        }

        .sidebar-nav {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .sidebar-item {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px;
          border-radius: 12px;
          background: none;
          color: rgba(255,255,255,0.7);
          font-weight: 600;
          font-size: 15px;
          transition: all 0.2s;
          text-align: left;
        }

        .sidebar-item.active, .sidebar-item:hover {
          background: rgba(255,255,255,0.1);
          color: white;
        }

        .sidebar-divider {
          height: 1px;
          background: rgba(255,255,255,0.1);
          margin: 16px 0;
        }

        .sidebar-scan-btn {
          margin-top: auto;
          background: var(--primary-container);
          color: white;
          padding: 20px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          font-weight: 800;
          box-shadow: 0 8px 20px rgba(0,0,0,0.2);
          transition: transform 0.2s;
        }

        .sidebar-scan-btn:hover {
          transform: translateY(-2px);
          background: #0056e0;
        }

        /* App Header */
        .app-header {
          background: white;
          padding: 20px 32px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid #e0e0e0;
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .brand-title {
          font-size: 24px;
          font-weight: 800;
          color: var(--primary);
          letter-spacing: 0.05em;
        }

        .terminal-id {
          font-size: 11px;
          font-weight: 700;
          color: var(--on-surface-variant);
          letter-spacing: 0.1em;
          opacity: 0.7;
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: 24px;
        }

        .search-bar {
          background: #f0f2f5;
          padding: 10px 16px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          gap: 12px;
          width: 300px;
          color: var(--on-surface-variant);
        }

        .search-bar input {
          background: none;
          border: none;
          outline: none;
          font-family: inherit;
          font-weight: 600;
          width: 100%;
        }

        .timestamp-badge {
          background: var(--surface-container-highest);
          padding: 10px 16px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 700;
          color: var(--primary);
        }

        .agent-profile {
          display: flex;
          align-items: center;
          gap: 12px;
          padding-left: 24px;
          border-left: 1px solid #e0e0e0;
        }

        .avatar {
          width: 40px;
          height: 40px;
          background: var(--primary);
          color: white;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
        }

        .agent-name {
          display: block;
          font-size: 14px;
          font-weight: 800;
        }

        .agent-role {
          display: block;
          font-size: 11px;
          font-weight: 600;
          color: var(--on-surface-variant);
        }

        /* Content Area */
        .content-area {
          padding: 32px;
          max-width: 1400px;
          margin: 0 auto;
          width: 100%;
        }

        .status-banner {
          background: var(--secondary-container);
          color: var(--on-secondary-container);
          padding: 24px 32px;
          border-radius: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 32px;
          border: 1px solid var(--secondary);
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        }

        .dashboard-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 32px;
        }

        .data-section {
          background: white;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(0,0,0,0.05);
          border: 1px solid #e0e0e0;
        }

        .section-header {
          background: #f8f9fa;
          padding: 20px 24px;
          border-bottom: 1px solid #e0e0e0;
        }

        .section-header h2 {
          font-size: 14px;
          font-weight: 800;
          color: var(--on-surface-variant);
          letter-spacing: 0.1em;
        }

        .data-list {
          display: flex;
          flex-direction: column;
        }

        .data-field {
          padding: 24px;
          display: flex;
          align-items: center;
          gap: 20px;
          border-bottom: 1px solid #f0f0f0;
        }

        .icon-container {
          width: 56px;
          height: 56px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f0f4ff;
          color: var(--primary);
        }

        .field-value {
          font-size: 18px;
          font-weight: 800;
        }

        .action-footer {
          margin-top: 32px;
          display: flex;
          justify-content: flex-end;
        }

        .checkout-btn {
          background: var(--tertiary);
          color: white;
          padding: 20px 40px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          gap: 16px;
          font-weight: 800;
          font-size: 18px;
          box-shadow: 0 8px 16px rgba(106, 33, 0, 0.2);
        }

        /* Mobile Styles */
        .mobile .app-sidebar { display: none; }
        .mobile .content-area { padding: 16px; padding-bottom: 120px; }
        .mobile .dashboard-grid { grid-template-columns: 1fr; gap: 16px; }
        .mobile .app-header { padding: 40px 24px 20px; background: var(--primary); color: white; border: none; }
        .mobile .brand-title { color: white; }
        .mobile .timestamp-badge { background: rgba(255,255,255,0.15); color: white; }
        .mobile .status-banner { border-radius: 0; margin: 0 -16px 24px; border-left: none; border-right: none; }
        
        .bottom-nav {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background: white;
          padding: 16px 24px 32px;
          border-top: 2px solid #eeeef0;
          z-index: 1000;
        }

        .nav-container { display: grid; grid-template-columns: 1fr 1.2fr 1fr; align-items: center; }
        .nav-btn { display: flex; flex-direction: column; align-items: center; gap: 6px; background: none; color: var(--on-surface-variant); font-size: 11px; font-weight: 700; }
        .scan-trigger { display: flex; flex-direction: column; align-items: center; gap: 8px; background: none; }
        .scan-circle { width: 80px; height: 80px; background: var(--primary); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 10px 25px rgba(0, 50, 138, 0.4); margin-top: -40px; border: 6px solid white; }

        /* History Page */
        .history-page {
          background: white;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(0,0,0,0.05);
          border: 1px solid #e0e0e0;
        }

        .history-list {
          display: flex;
          flex-direction: column;
        }

        .history-header {
          display: grid;
          grid-template-columns: 2fr 1.5fr 1fr 1fr 1fr;
          padding: 20px 24px;
          background: #f8f9fa;
          border-bottom: 2px solid #e0e0e0;
          font-size: 12px;
          font-weight: 800;
          color: var(--on-surface-variant);
          letter-spacing: 0.1em;
        }

        .history-row {
          display: grid;
          grid-template-columns: 2fr 1.5fr 1fr 1fr 1fr;
          padding: 20px 24px;
          border-bottom: 1px solid #f0f0f0;
          align-items: center;
          transition: background 0.2s;
        }

        .history-row:hover {
          background: #f8faff;
        }

        .visitor-name {
          display: block;
          font-weight: 800;
          font-size: 15px;
          color: var(--primary);
        }

        .visitor-id {
          display: block;
          font-size: 11px;
          font-weight: 600;
          color: var(--on-surface-variant);
          opacity: 0.7;
        }

        .status-pill {
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
        }

        .status-pill.verified {
          background: var(--secondary-container);
          color: var(--on-secondary-container);
        }

        .empty-state {
          padding: 100px;
          text-align: center;
          font-weight: 800;
          color: var(--on-surface-variant);
          letter-spacing: 0.1em;
          opacity: 0.5;
        }

        @media (max-width: 1024px) {
          .history-header { display: none; }
          .history-row { 
            grid-template-columns: 1fr 1fr; 
            gap: 12px; 
            padding: 16px;
          }
          .history-row .col:nth-child(1) { grid-column: span 2; }
          .history-row .col:nth-child(2) { font-size: 13px; font-weight: 600; }
        }

        /* Settings Page */
        .settings-page {
          display: flex;
          flex-direction: column;
          gap: 32px;
        }

        .settings-card {
          background: white;
          border-radius: 20px;
          border: 1px solid #e0e0e0;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(0,0,0,0.05);
        }

        .setting-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          border-bottom: 1px solid #f0f0f0;
        }

        .setting-row:last-child {
          border-bottom: none;
        }

        .setting-info {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .setting-icon {
          width: 40px;
          height: 40px;
          background: #f0f4ff;
          color: var(--primary);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .setting-label {
          font-weight: 800;
          font-size: 15px;
          color: var(--on-surface);
        }

        .setting-description {
          font-size: 12px;
          font-weight: 600;
          color: var(--on-surface-variant);
          opacity: 0.7;
        }

        .setting-control select {
          padding: 8px 12px;
          border-radius: 8px;
          border: 2px solid #e0e0e0;
          font-family: inherit;
          font-weight: 700;
          background: white;
          outline: none;
        }

        .toggle-btn {
          width: 52px;
          height: 28px;
          background: #e2e2e5;
          border-radius: 20px;
          position: relative;
          transition: all 0.3s;
          padding: 4px;
        }

        .toggle-btn.active {
          background: var(--primary);
        }

        .toggle-thumb {
          width: 20px;
          height: 20px;
          background: white;
          border-radius: 50%;
          transition: all 0.3s;
        }

        .toggle-btn.active .toggle-thumb {
          transform: translateX(24px);
        }

        .action-link-btn {
          background: none;
          color: var(--primary);
          font-weight: 800;
          font-size: 13px;
          letter-spacing: 0.05em;
          padding: 8px 16px;
          border: 2px solid var(--primary);
          border-radius: 8px;
          transition: all 0.2s;
        }

        .action-link-btn:hover {
          background: var(--primary);
          color: white;
        }

        .action-link-btn.delete {
          color: var(--tertiary);
          border-color: var(--tertiary);
        }

        .action-link-btn.delete:hover {
          background: var(--tertiary);
          color: white;
        }

        .version-tag {
          background: var(--surface-container-highest);
          color: var(--primary);
          padding: 6px 12px;
          border-radius: 8px;
          font-family: monospace;
          font-weight: 800;
          font-size: 12px;
        }

        .example-row {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px 24px;
          border-bottom: 1px solid #f0f0f0;
          cursor: pointer;
          transition: background 0.2s;
        }

        .example-row:hover {
          background: #f8faff;
        }

        .example-row span {
          font-size: 14px;
          font-weight: 700;
          color: var(--on-surface);
        }

        .radio-mock {
          width: 24px;
          height: 24px;
          border: 3px solid #e2e2e5;
          border-radius: 50%;
          position: relative;
          transition: all 0.2s;
        }

        .radio-mock.active {
          border-color: var(--primary);
        }

        .radio-mock.active::after {
          content: '';
          position: absolute;
          inset: 4px;
          background: var(--primary);
          border-radius: 50%;
        }

        /* Mobile Menu */
        .menu-trigger-btn {
          background: none;
          color: inherit;
          padding: 8px;
          margin-left: -12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .mobile-menu-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.5);
          backdrop-filter: blur(4px);
          z-index: 3000;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.3s;
        }

        .mobile-menu-overlay.open {
          opacity: 1;
          pointer-events: auto;
        }

        .mobile-menu-drawer {
          position: absolute;
          top: 0;
          left: 0;
          bottom: 0;
          width: 300px;
          background: white;
          box-shadow: 10px 0 30px rgba(0,0,0,0.2);
          display: flex;
          flex-direction: column;
          transform: translateX(-100%);
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .mobile-menu-overlay.open .mobile-menu-drawer {
          transform: translateX(0);
        }

        .drawer-header {
          padding: 32px 24px;
          border-bottom: 1px solid #eee;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .drawer-nav {
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .drawer-item {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px 20px;
          border-radius: 12px;
          background: none;
          color: var(--on-surface-variant);
          font-weight: 700;
          transition: all 0.2s;
          text-align: left;
        }

        .drawer-item.active {
          background: var(--primary);
          color: white;
        }

        .drawer-footer {
          margin-top: auto;
          padding: 24px;
          border-top: 1px solid #eee;
        }

        .agent-profile.mini {
          padding-left: 0;
          border-left: none;
        }

        .close-drawer-btn {
          background: none;
          color: var(--on-surface-variant);
        }

        /* Dark Mode Overrides */
        .dark-mode .mobile-menu-drawer {
          background: #1e1e1e;
        }
        .dark-mode .drawer-header,
        .dark-mode .drawer-footer {
          border-color: #333;
        }
        .dark-mode .drawer-item {
          color: #a0a0a0;
        }
        .dark-mode .drawer-item.active {
          color: white;
        }

        /* Header Enhancements */
        .logo-placeholder {
          background: var(--primary);
          color: white;
          width: 44px;
          height: 44px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(0, 50, 138, 0.2);
        }

        .time-date-group {
          display: flex;
          flex-direction: column;
          line-height: 1.1;
        }

        .current-date {
          font-size: 10px;
          opacity: 0.6;
          letter-spacing: 0.05em;
        }

        .current-time {
          font-size: 16px;
        }

        .agent-profile.clickable {
          cursor: pointer;
          padding: 6px 12px;
          border-radius: 12px;
          transition: background 0.2s;
        }

        .agent-profile.clickable:hover {
          background: rgba(0,0,0,0.03);
        }

        .dark-mode .agent-profile.clickable:hover {
          background: rgba(255,255,255,0.05);
        }

        /* Profile Page */
        .profile-page {
          max-width: 1000px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 32px;
        }

        .profile-hero {
          display: flex;
          align-items: center;
          gap: 32px;
          background: white;
          padding: 40px;
          border-radius: 24px;
          border: 1px solid #e0e0e0;
          box-shadow: 0 4px 20px rgba(0,0,0,0.05);
        }

        .dark-mode .profile-hero {
          background: #1e1e1e;
          border-color: #333;
        }

        .profile-photo-container {
          position: relative;
        }

        .profile-photo {
          width: 140px;
          height: 140px;
          background: var(--primary);
          color: white;
          border-radius: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 48px;
          font-weight: 800;
          overflow: hidden;
          border: 4px solid white;
          box-shadow: 0 8px 24px rgba(0,0,0,0.1);
        }

        .profile-photo img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .upload-badge {
          position: absolute;
          bottom: -8px;
          right: -8px;
          width: 44px;
          height: 44px;
          background: var(--primary-container);
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 4px solid white;
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
          transition: transform 0.2s;
        }

        .upload-badge:hover {
          transform: scale(1.1);
        }

        .profile-main-info h1 {
          font-size: 32px;
          margin-bottom: 8px;
        }

        .badge-row {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .id-tag {
          font-family: monospace;
          font-weight: 800;
          font-size: 14px;
          color: var(--on-surface-variant);
          background: var(--surface-container-highest);
          padding: 6px 12px;
          border-radius: 8px;
        }

        .profile-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 32px;
        }

        .profile-actions {
          display: flex;
          gap: 16px;
          justify-content: flex-end;
        }

        .checkout-btn.secondary {
          background: var(--surface-container-highest);
          color: var(--on-surface);
          box-shadow: none;
        }

        @media (max-width: 768px) {
          .profile-hero { flex-direction: column; text-align: center; padding: 32px 20px; }
          .profile-grid { grid-template-columns: 1fr; }
          .profile-actions { flex-direction: column; }
          .badge-row { justify-content: center; }
        }

        /* Dark Mode Overrides */
        .dark-mode {
          --surface: #121212;
          --on-surface: #e2e2e5;
          --on-surface-variant: #a0a0a0;
          background: #000;
        }

        .dark-mode .app-header,
        .dark-mode .data-section,
        .dark-mode .section-header,
        .dark-mode .history-page,
        .dark-mode .settings-card {
          background: #1e1e1e;
          border-color: #333;
        }

        .dark-mode .setting-label,
        .dark-mode .field-value {
          color: white;
        }

        .dark-mode .setting-icon,
        .dark-mode .icon-container {
          background: #2c2c2c;
          color: var(--primary-container);
        }

        .dark-mode .setting-row,
        .dark-mode .history-row,
        .dark-mode .data-field {
          border-color: #2c2c2c;
        }

        /* Scanner Modal (Desktop) */
        .desktop .scanner-overlay {
          background: rgba(0,0,0,0.85);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .desktop .scanner-modal {
          width: 600px;
          height: 800px;
          background: #000;
          border-radius: 32px;
          overflow: hidden;
          border: 4px solid var(--primary-container);
          display: flex;
          flex-direction: column;
        }

        /* Mobile Scanner */
        .mobile .scanner-overlay { position: fixed; inset: 0; background: #000; z-index: 2000; display: flex; flex-direction: column; }
        .mobile .scanner-modal { flex: 1; display: flex; flex-direction: column; }

        .scanner-header { padding: 24px; display: flex; justify-content: space-between; align-items: center; }
        .scanner-viewfinder { flex: 1; position: relative; display: flex; align-items: center; justify-content: center; background: #111; }
        .live-feed { width: 100%; height: 100%; object-fit: cover; }
        .scanner-frame { position: absolute; width: 80%; aspect-ratio: 1.6; border: 2px solid rgba(255,255,255,0.3); border-radius: 12px; box-shadow: 0 0 0 1000px rgba(0,0,0,0.6); }
        .corner { position: absolute; width: 30px; height: 30px; border: 4px solid var(--primary-container); }
        .top-left { top: -2px; left: -2px; border-right: 0; border-bottom: 0; border-top-left-radius: 8px; }
        .top-right { top: -2px; right: -2px; border-left: 0; border-bottom: 0; border-top-right-radius: 8px; }
        .bottom-left { bottom: -2px; left: -2px; border-right: 0; border-top: 0; border-bottom-left-radius: 8px; }
        .bottom-right { bottom: -2px; right: -2px; border-left: 0; border-top: 0; border-bottom-right-radius: 8px; }
        .scan-line { position: absolute; top: 0; left: 0; right: 0; height: 3px; background: var(--primary-container); box-shadow: 0 0 15px var(--primary-container); animation: scanMove 3s infinite ease-in-out; }
        @keyframes scanMove { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(200px); } }
        .scanner-controls { padding: 40px; display: flex; justify-content: center; background: rgba(0,0,0,0.5); }
        .capture-trigger { background: none; transition: transform 0.1s; }
        .capture-trigger:hover { transform: scale(1.05); }
        .capture-trigger:active .inner-circle { background: #e0e0e0; transform: scale(0.9); }
        .outer-ring { width: 72px; height: 72px; border: 4px solid white; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
        .inner-circle { width: 56px; height: 56px; background: white; border-radius: 50%; transition: all 0.1s; }
      `}</style>
    </div>
  );
}

export default App;
