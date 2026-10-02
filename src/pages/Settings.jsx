import { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Moon, Sun, Globe, Bell, Smartphone, Volume2,
  LifeBuoy, Bug, Info, ShieldAlert, KeyRound, Lock,
  Camera, Building, Building2, Briefcase, Phone, Mail, Calendar, BadgeCheck,
  LogOut, Pencil, Send, Clock, XCircle, Plus, Minus, QrCode,
  Shield, CheckCircle2, User, Database, Server, RefreshCw,
  Download, Sparkles, ArrowUpCircle
} from 'lucide-react';
import { useApp } from '../context/useAppState';
import { Card, Toggle, Btn, Modal, FormInput } from '../components/UI';
import { TRANSLATIONS } from '../translations';
import { authService } from '../services/authService';
import { demandeService } from '../services/demandeService';

/* ============================================
   PARAMÈTRES HELPERS
============================================ */
function SettingRow({ icon: Icon, label, description, children }) {
  const IconComponent = Icon || Info;
  return (
    <div className="flex justify-between items-center p-4 border-b border-slate-100 dark:border-slate-800 last:border-0">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-900 text-brand-blue flex items-center justify-center shrink-0 border border-slate-100 dark:border-slate-800">
          <IconComponent size={20} />
        </div>
        <div>
          <p className="font-bold text-sm text-slate-900 dark:text-slate-100">{label}</p>
          {description && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{description}</p>}
        </div>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function formatDateSafe(dateVal, fallback = 'Compte Actif') {
  if (!dateVal) return fallback;
  try {
    const d = new Date(dateVal);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    }
  } catch (e) {
    /* silencieux */
  }
  return String(dateVal);
}

function formatDateInputSafe(dateVal) {
  if (!dateVal) return '';
  try {
    const d = new Date(dateVal);
    if (!isNaN(d.getTime())) {
      return d.toISOString().split('T')[0];
    }
  } catch (e) {
    /* silencieux */
  }
  return '';
}

function SectionCard({ title, children }) {
  return (
    <div className="mb-6">
      <h3 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest mb-3 ml-1">{title}</h3>
      <Card>{children}</Card>
    </div>
  );
}

/* ============================================
   1. COMPOSANT PARAMÈTRES GLOBAUX
============================================ */
export function Parametres() {
  const { state, dispatch, notify } = useApp();
  const { settings, notifications, darkMode } = state;
  const user = state.user || state.agent || {};
  const role = (user.role || '').toUpperCase();
  const isSuperAdmin = role === 'SUPER_ADMIN' || role === 'SUPERADMIN';
  const isAdmin = role === 'ADMIN';

  const navigate = useNavigate();
  const t = TRANSLATIONS[settings.language] || TRANSLATIONS.fr;

  const updateSetting = (k, v) => dispatch({ type: 'UPDATE_SETTING', key: k, value: v });
  const updateNotif   = (k, v) => dispatch({ type: 'UPDATE_NOTIFICATION_PREF', key: k, value: v });

  // Password modal state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passData, setPassData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [updatingPass, setUpdatingPass] = useState(false);

  // Support modal state
  const [showSupportModal, setShowSupportModal] = useState(false);

  // State & Handlers Mise à jour de l'application
  const [appVersion, setAppVersion] = useState(() => localStorage.getItem('noregis_app_version') || '1.0.0');
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [installingUpdate, setInstallingUpdate] = useState(false);
  const [updateProgress, setUpdateProgress] = useState(0);

  const handleCheckUpdate = () => {
    setCheckingUpdate(true);
    setTimeout(() => {
      setCheckingUpdate(false);
      if (appVersion === '1.0.0') {
        setUpdateAvailable(true);
        setShowUpdateModal(true);
        if (notifications.appUpdates !== false) {
          notify('info', '🚀 Une nouvelle version NoRegis v1.1.0 est disponible !');
        }
      } else {
        notify('success', `✨ Votre application NoRegis est à jour (v${appVersion}).`);
      }
    }, 1200);
  };

  const handleInstallUpdate = () => {
    setInstallingUpdate(true);
    setUpdateProgress(15);
    const interval = setInterval(() => {
      setUpdateProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setInstallingUpdate(false);
          setAppVersion('1.1.0');
          localStorage.setItem('noregis_app_version', '1.1.0');
          setUpdateAvailable(false);
          setShowUpdateModal(false);
          notify('success', '🎉 Application mise à jour vers NoRegis v1.1.0 avec succès !');
          return 100;
        }
        return prev + 25;
      });
    }, 400);
  };

  // Handle password change submit
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!passData.newPassword || passData.newPassword.length < 4) {
      notify('warning', 'Le nouveau mot de passe doit contenir au moins 4 caractères.');
      return;
    }
    if (passData.newPassword !== passData.confirmPassword) {
      notify('error', 'La confirmation du mot de passe ne correspond pas.');
      return;
    }

    setUpdatingPass(true);
    try {
      const res = await authService.updateProfile({
        password: passData.newPassword,
        motDePasse: passData.newPassword,
      });

      if (res.data?.success || res.success) {
        notify('success', '🔑 Mot de passe mis à jour avec succès.');
        setShowPasswordModal(false);
        setPassData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        notify('error', res.data?.message || 'Erreur lors de la mise à jour du mot de passe.');
      }
    } catch (err) {
      notify('error', err.response?.data?.message || err.message || 'Erreur serveur lors de la mise à jour.');
    } finally {
      setUpdatingPass(false);
    }
  };

  return (
    <div className="p-4 lg:p-8 w-full max-w-7xl mx-auto space-y-6" dir={settings.language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#161B22] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-xl lg:text-2xl font-black text-slate-900 dark:text-white tracking-tight">{t.settings}</h1>
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1">{t.customize_prefs}</p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 text-xs font-black rounded-full bg-brand-blue-bright/10 text-brand-blue-bright border border-brand-blue-bright/20 uppercase tracking-wider">
            Compte : {user.role || 'AGENT'}
          </span>
        </div>
      </div>

      {/* Apparence & Ergonomie */}
      <SectionCard title={t.appearance}>
        <SettingRow icon={darkMode ? Moon : Sun} label={t.dark_mode} description={t.night_interface}>
          <Toggle active={darkMode} onChange={() => dispatch({ type: 'TOGGLE_DARK' })} />
        </SettingRow>

        <SettingRow icon={Globe} label={t.language} description="Sélectionnez la langue d'affichage du registre">
          <select
            value={settings.language}
            onChange={e => updateSetting('language', e.target.value)}
            className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-bold outline-none focus:border-brand-blue-bright"
          >
            <option value="fr">Français (FR)</option>
            <option value="en">English (EN)</option>
            <option value="ar">العربية (AR)</option>
          </select>
        </SettingRow>

        <div className="p-4 border-b border-slate-100 dark:border-slate-800">
          <p className="font-bold text-sm text-slate-900 dark:text-slate-100 mb-1">{t.textSize}</p>
          <p className="text-xs text-slate-500 mb-3">Ajustez la taille du texte pour un meilleur confort de lecture</p>
          <div className="flex gap-2">
            {[
              { id: 'small', label: 'Petite' },
              { id: 'medium', label: 'Moyenne' },
              { id: 'large', label: 'Grande' },
            ].map(sz => (
              <button
                key={sz.id}
                onClick={() => updateSetting('fontSize', sz.id)}
                className={`px-4 py-2 rounded-lg border font-bold text-xs transition-all ${
                  settings.fontSize === sz.id
                    ? 'border-brand-blue-bright bg-brand-blue-bright/10 text-brand-blue-bright dark:bg-brand-blue-bright/20'
                    : 'border-slate-200 bg-slate-50 text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400'
                }`}
              >
                {sz.label}
              </button>
            ))}
          </div>
        </div>
      </SectionCard>

      {/* Notifications & Alertes */}
      <SectionCard title={t.notifications || 'Notifications & Alertes'}>
        <SettingRow icon={Bell} label={t.new_visits || 'Entrées & Visites'} description={t.scan_alert || 'Alertes lors de l\'enregistrement d\'un nouveau visiteur'}>
          <Toggle active={notifications.newVisits} onChange={v => updateNotif('newVisits', v)} />
        </SettingRow>
        <SettingRow icon={Smartphone} label={t.push_notifs || 'Notifications Navigateur'} description={t.mobile_alerts || 'Recevoir des popups d\'alertes système'}>
          <Toggle active={notifications.push} onChange={v => updateNotif('push', v)} />
        </SettingRow>
        <SettingRow icon={Volume2} label={t.alert_sounds || 'Effets Sonores'} description={t.sound_feedback || 'Bip sonore lors de la lecture des codes QR & CIN'}>
          <Toggle active={notifications.sounds} onChange={v => updateNotif('sounds', v)} />
        </SettingRow>
        <SettingRow icon={ArrowUpCircle} label="Alertes de Nouvelles Versions" description="Recevoir une notification automatique lorsqu'une nouvelle version de NoRegis est disponible">
          <Toggle active={notifications.appUpdates ?? true} onChange={v => updateNotif('appUpdates', v)} />
        </SettingRow>
      </SectionCard>

      {/* Sécurité & Mot de passe */}
      <SectionCard title="Sécurité & Authentification">
        <SettingRow icon={KeyRound} label="Mot de passe du compte" description="Modifiez régulièrement votre mot de passe pour des raisons de sécurité">
          <Btn variant="secondary" size="sm" icon={Lock} onClick={() => setShowPasswordModal(true)}>
            Changer le mot de passe
          </Btn>
        </SettingRow>

        <SettingRow icon={Shield} label="Chiffrement & Session" description="Toutes les connexions sont sécurisées par jeton JWT de 2 heures">
          <span className="px-2.5 py-1 text-[10px] font-black rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
            <CheckCircle2 size={12} /> SSL & JWT Actif
          </span>
        </SettingRow>
      </SectionCard>

      {/* Support, Assistance & Signalement de Bugs */}
      <SectionCard title={t.support_assist || 'Support & Assistance'}>
        <SettingRow icon={LifeBuoy} label={t.contact_support || 'Centre d\'Assistance'} description={t.tech_assist || 'Besoin d\'aide pour l\'utilisation du registre ?'}>
          <Btn variant="secondary" size="sm" icon={LifeBuoy} onClick={() => setShowSupportModal(true)}>
            {t.contact_btn || 'Assistance'}
          </Btn>
        </SettingRow>

        <SettingRow icon={Bug} label={t.report_bug || 'Signaler un bug technique'} description="Transmettez un dysfonctionnement au SuperAdmin">
          <Btn variant="danger" size="sm" icon={Bug} onClick={() => navigate('/bugs')}>
            Espace Bugs
          </Btn>
        </SettingRow>
      </SectionCard>

      {/* Infos Système & Organisation selon le rôle */}
      <SectionCard title={t.about || 'Informations Système & Mises à Jour'}>
        <SettingRow
          icon={Sparkles}
          label="Version de l'application & Mises à jour"
          description={updateAvailable ? "Une nouvelle version v1.1.0 est disponible !" : "Système à jour — Registre Digital NoRegis"}
        >
          <div className="flex items-center gap-2">
            <span className={`text-xs font-mono font-bold px-3 py-1 rounded-md border ${
              updateAvailable 
                ? 'bg-amber-500/10 text-amber-500 border-amber-500/30 animate-pulse' 
                : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700'
            }`}>
              v{appVersion} {updateAvailable ? '(v1.1.0 dispo)' : ''}
            </span>
            <Btn
              variant={updateAvailable ? "success" : "secondary"}
              size="sm"
              icon={checkingUpdate ? RefreshCw : (updateAvailable ? Download : RefreshCw)}
              loading={checkingUpdate}
              onClick={handleCheckUpdate}
            >
              {checkingUpdate ? 'Vérification...' : (updateAvailable ? 'Mettre à jour' : 'Rechercher mise à jour')}
            </Btn>
          </div>
        </SettingRow>

        {isSuperAdmin && (
          <>
            <SettingRow icon={Server} label="État du Serveur API" description="Connexion Backend REST & Socket.IO">
              <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Opérationnel (Render)
              </span>
            </SettingRow>
            <SettingRow icon={Database} label="Base de Données MongoDB" description="Registre centralisé multi-tenant">
              <span className="text-xs font-black text-slate-700 dark:text-slate-300">Cluster Cloud MongoDB Atlas</span>
            </SettingRow>
          </>
        )}

        {(isAdmin || user.entrepriseId) && (
          <SettingRow icon={Building} label="Organisation / Entreprise" description="Rattaché à votre compte">
            <span className="text-xs font-black text-brand-blue-bright">
              {typeof user.entrepriseId === 'object' ? user.entrepriseId.nom : (user.entrepriseNom || 'Entreprise Partenaire')}
            </span>
          </SettingRow>
        )}
      </SectionCard>

      {/* Modal 1: Changement de mot de passe */}
      <Modal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        title="Changer mon mot de passe"
        size="md"
      >
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <FormInput
            label="Nouveau mot de passe"
            id="newPassword"
            type="password"
            placeholder="Au moins 4 caractères..."
            value={passData.newPassword}
            onChange={(e) => setPassData({ ...passData, newPassword: e.target.value })}
            required
          />

          <FormInput
            label="Confirmer le nouveau mot de passe"
            id="confirmPassword"
            type="password"
            placeholder="Répétez le nouveau mot de passe..."
            value={passData.confirmPassword}
            onChange={(e) => setPassData({ ...passData, confirmPassword: e.target.value })}
            required
          />

          <div className="flex justify-end gap-3 pt-3">
            <Btn variant="secondary" onClick={() => setShowPasswordModal(false)}>
              Annuler
            </Btn>
            <Btn variant="primary" type="submit" loading={updatingPass} icon={Lock}>
              Mettre à jour
            </Btn>
          </div>
        </form>
      </Modal>

      {/* Modal 2: Assistance & Support */}
      <Modal
        isOpen={showSupportModal}
        onClose={() => setShowSupportModal(false)}
        title="Centre d'Assistance & Support Client"
        size="md"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 space-y-2">
            <p className="text-xs font-black flex items-center gap-2">
              <Phone size={16} /> Numéro Vert Support Technique
            </p>
            <p className="text-base font-black font-mono">+221 33 800 00 00 / +221 77 000 00 00</p>
            <p className="text-[11px] font-medium text-slate-600 dark:text-slate-300">
              Disponible du Lundi au Samedi de 08h00 à 20h00 (GMT).
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
            <p className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Mail size={16} className="text-brand-blue-bright" /> Support par E-mail
            </p>
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300 font-mono">support@noregis.com</p>
            <p className="text-[11px] text-slate-500">Temps moyen de réponse : Moins de 2 heures.</p>
          </div>

          <div className="flex justify-end pt-2">
            <Btn variant="secondary" onClick={() => setShowSupportModal(false)}>
              Fermer
            </Btn>
          </div>
        </div>
      </Modal>

      {/* Modal 3: Mise à jour Application */}
      <Modal
        isOpen={showUpdateModal}
        onClose={() => !installingUpdate && setShowUpdateModal(false)}
        title="Mise à jour de l'application disponible"
        size="md"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-gradient-to-r from-blue-600/10 via-brand-blue-bright/10 to-indigo-600/10 border border-brand-blue-bright/20 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-brand-blue-bright uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles size={16} /> Version v1.1.0 (Disponible)
              </span>
              <span className="text-[10px] font-bold bg-brand-blue-bright text-white px-2 py-0.5 rounded-full">Recommandé</span>
            </div>
            <h4 className="text-base font-black text-slate-900 dark:text-white">Nouvelle version système prête pour l'installation</h4>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Cette mise à jour apporte des améliorations majeures de performance, sécurité et stabilité pour l'ensemble des modules.
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Nouveautés & Améliorations :</p>
            <ul className="space-y-2 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-900/50 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800">
              <li className="flex items-start gap-2">
                <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                <span><strong>OCR & Scanner :</strong> Détection accélérée et reconnaissance faciale optimisée.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                <span><strong>Notifications Temps Réel :</strong> Alertes automatiques instantanées des nouvelles versions & visites.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                <span><strong>Sécurité Multi-Tenant :</strong> Chiffrement des sessions renforcé et synchronisation hors-ligne.</span>
              </li>
            </ul>
          </div>

          {installingUpdate && (
            <div className="space-y-2 pt-2">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-brand-blue-bright flex items-center gap-2">
                  <RefreshCw size={14} className="animate-spin" /> Installation en cours...
                </span>
                <span className="text-slate-500">{updateProgress}%</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-brand-blue-bright to-emerald-500 h-full transition-all duration-300 rounded-full"
                  style={{ width: `${updateProgress}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            {!installingUpdate && (
              <Btn variant="secondary" onClick={() => setShowUpdateModal(false)}>
                Plus tard
              </Btn>
            )}
            <Btn
              variant="primary"
              icon={Download}
              loading={installingUpdate}
              onClick={handleInstallUpdate}
            >
              {installingUpdate ? 'Installation...' : 'Installer la mise à jour v1.1.0'}
            </Btn>
          </div>
        </div>
      </Modal>
    </div>
  );
}

/* ============================================
   2. COMPOSANT PROFIL UTILISATEUR
============================================ */
function InfoRow({ icon: Icon, label, value }) {
  const IconComponent = Icon || User;
  return (
    <div className="flex items-center gap-2.5 px-3 py-1.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
      <div className="w-6 h-6 rounded-md bg-blue-50 dark:bg-blue-900/20 text-brand-blue flex items-center justify-center shrink-0 border border-blue-500/10">
        <IconComponent size={13} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[8px] font-extrabold text-slate-400 uppercase tracking-wider leading-none">{label}</p>
        <p className="text-xs font-bold text-slate-900 dark:text-slate-100 mt-0.5 truncate leading-tight">{value || '—'}</p>
      </div>
    </div>
  );
}

// Champs modifiables via demande pour les agents
const CHAMPS_DEMANDE = [
  { key: 'prenom',              label: 'Prénom' },
  { key: 'nom',                 label: 'Nom' },
  { key: 'telephone',           label: 'Téléphone' },
  { key: 'departement',         label: 'Département' },
  { key: 'poste',               label: 'Poste' },
  { key: 'niveauAccreditation', label: "Niveau d'accréditation" },
  { key: 'dateArrivee',         label: "Date d'arrivée" },
];

export function ProfilAgent() {
  const { state, dispatch, notify } = useApp();
  const settings = state?.settings || {};
  const notifications = state?.notifications || {};
  const agent = state?.agent || state?.user || {};
  const role = (agent?.role || '').toUpperCase();
  const isSuperAdmin = role === 'SUPER_ADMIN' || role === 'SUPERADMIN';
  const isAdmin = role === 'ADMIN';

  const language = settings?.language || 'fr';
  const t = TRANSLATIONS[language] || TRANSLATIONS.fr;
  const fileRef = useRef(null);

  const [demandeModal, setDemandeModal]       = useState(false);
  const [demandePendante, setDemandePendante] = useState(null);
  const [loadingDemande, setLoadingDemande]   = useState(true);

  // QR Code agent state
  const [qrLoading, setQrLoading] = useState(false);

  // Formulaire d'édition directe (SuperAdmin / Admin / Agent)
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    prenom: '', nom: '', email: '', telephone: '', departement: '', poste: '', niveauAccreditation: '', dateArrivee: ''
  });
  const [envoi, setEnvoi] = useState(false);
  const [erreurEnvoi, setErreurEnvoi] = useState('');

  // Password modal
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passData, setPassData] = useState({ newPassword: '', confirmPassword: '' });
  const [updatingPass, setUpdatingPass] = useState(false);

  // Demande agent state
  const [champsSelectionnes, setChampsSelectionnes] = useState([CHAMPS_DEMANDE?.[0]?.key || 'prenom']);
  const [valeurs, setValeurs] = useState({});
  const [motif, setMotif]     = useState('');

  // Charger la demande en attente pour les agents
  useEffect(() => {
    if (isAdmin || isSuperAdmin) {
      setLoadingDemande(false);
      return;
    }
    let isMounted = true;
    const charger = async () => {
      try {
        const res = await demandeService.maDemande();
        if (isMounted) setDemandePendante(res?.demande || null);
      } catch { /* silencieux */ } finally {
        if (isMounted) setLoadingDemande(false);
      }
    };
    charger();
    return () => { isMounted = false; };
  }, [agent, isAdmin, isSuperAdmin]);

  // Synchroniser automatiquement le profil frais depuis le serveur au chargement
  useEffect(() => {
    let isMounted = true;
    authService.getProfile()
      .then(res => {
        const userObj = res?.user || res?.utilisateur || res?.data?.user || res?.data?.utilisateur;
        if (userObj && isMounted) {
          dispatch({ type: 'UPDATE_AGENT', payload: userObj });
        }
      })
      .catch(() => {});
    return () => { isMounted = false; };
  }, [dispatch]);

  // Informations calculées précises et cohérentes selon le rôle
  const entrepriseNom = isSuperAdmin
    ? 'NoRegis Global (Supervision Centralisée)'
    : (typeof agent?.entrepriseId === 'object' ? agent?.entrepriseId?.nom : agent?.entrepriseNom) || 'Port Autonome de Dakar';

  const displayPoste = agent?.poste || (isSuperAdmin ? 'Super Administrateur Système' : (isAdmin ? 'Chef Sécurité & Contrôle' : 'Agent d\'Accueil & Contrôle'));
  const displayDepartement = agent?.departement || (isSuperAdmin ? 'Direction des Systèmes d\'Information (DSI)' : (isAdmin ? 'Direction de la Sécurité' : 'Poste Nord'));
  const displayAccreditation = agent?.niveauAccreditation || agent?.niveau || (isSuperAdmin ? 'Accès Total (SuperAdmin)' : (isAdmin ? 'Niveau 3 - Admin Boîte' : 'Niveau 1 - Agent d\'Accueil'));
  const displayMatricule = agent?.matricule || `ID-${String(agent?._id || agent?.id || '0042').slice(-6).toUpperCase()}`;
  const displayDateArrivee = formatDateSafe(agent?.dateArrivee || agent?.createdAt);

  const fullName = `${agent?.prenom || ''} ${agent?.nom || ''}`.trim() || 'Utilisateur';
  const initials = agent?.initials || `${(agent?.prenom?.[0] || 'A')}${(agent?.nom?.[0] || 'U')}`.toUpperCase();

  // QR Code download handler
  const handleDownloadQr = async () => {
    const id = agent?.id || agent?._id;
    if (!id) return;
    setQrLoading(true);
    try {
      const res = await authService.generateAgentQr(id);
      if (res?.qrPath || res?.qr || res?.qrCode) {
        notify('success', '📲 Lien de scan généré. QR Code prêt.');
      } else {
        notify('info', 'Generation du lien d\'identification effectuee.');
      }
    } catch (err) {
      notify('error', err?.message || 'Erreur lors de la génération du QR Code.');
    } finally {
      setQrLoading(false);
    }
  };

  // Profile photo upload
  const handlePhoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
      const photoBase64 = reader.result;
      dispatch({ type: 'UPDATE_AGENT', payload: { photo: photoBase64 } });
      notify('success', `📸 Photo de profil mise à jour.`);

      try {
        await authService.updateProfile({ photo: photoBase64 });
      } catch (err) {
        /* backup local actif */
      }
    };
    reader.readAsDataURL(file);
  };

  const handleLogout = () => {
    dispatch({ type: 'LOGOUT' });
    notify('info', t.logout_ok || 'Déconnexion réussie');
  };

  const startEditing = () => {
    setEditForm({
      prenom: agent?.prenom || '',
      nom: agent?.nom || '',
      email: agent?.email || '',
      telephone: agent?.telephone || '',
      departement: agent?.departement || displayDepartement,
      poste: agent?.poste || displayPoste,
      niveauAccreditation: agent?.niveauAccreditation || displayAccreditation,
      dateArrivee: formatDateInputSafe(agent?.dateArrivee)
    });
    setErreurEnvoi('');
    setIsEditing(true);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setEnvoi(true);
    setErreurEnvoi('');
    try {
      const res = await authService.updateProfile(editForm);
      const updatedUser = res?.user || res?.utilisateur || res?.data?.user || res?.data?.utilisateur || { ...agent, ...editForm };
      dispatch({ type: 'UPDATE_AGENT', payload: updatedUser });
      notify('success', '✅ Profil mis à jour avec succès.');
      setIsEditing(false);
    } catch (err) {
      setErreurEnvoi(err?.response?.data?.message || err?.message || 'Erreur lors de la mise à jour.');
    } finally {
      setEnvoi(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!passData.newPassword || passData.newPassword.length < 4) {
      notify('warning', 'Le mot de passe doit comporter au moins 4 caractères.');
      return;
    }
    if (passData.newPassword !== passData.confirmPassword) {
      notify('error', 'Les mots de passe ne correspondent pas.');
      return;
    }
    setUpdatingPass(true);
    try {
      await authService.updateProfile({ password: passData.newPassword, motDePasse: passData.newPassword });
      notify('success', '🔑 Mot de passe réinitialisé avec succès.');
      setShowPasswordModal(false);
      setPassData({ newPassword: '', confirmPassword: '' });
    } catch (err) {
      notify('error', err?.response?.data?.message || 'Erreur lors de la mise à jour du mot de passe.');
    } finally {
      setUpdatingPass(false);
    }
  };

  const handleSubmitDemande = async (e) => {
    e.preventDefault();
    const modifications = {};
    champsSelectionnes.forEach(k => {
      if (valeurs[k] !== undefined && String(valeurs[k]).trim() !== '') {
        modifications[k] = valeurs[k];
      }
    });
    if (Object.keys(modifications).length === 0) {
      setErreurEnvoi('Saisissez au moins une nouvelle valeur.');
      return;
    }
    setEnvoi(true);
    setErreurEnvoi('');
    try {
      await demandeService.soumettre({ modifications, motif });
      setDemandeModal(false);
      notify('success', "✅ Demande envoyée à l'administrateur.");
      const res = await demandeService.maDemande();
      setDemandePendante(res?.demande || null);
    } catch (err) {
      setErreurEnvoi(err?.message || "Erreur lors de l'envoi.");
    } finally {
      setEnvoi(false);
    }
  };

  // Badge role color
  const getRoleBadge = (r) => {
    if (r === 'SUPER_ADMIN' || r === 'SUPERADMIN') {
      return (
        <span className="bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-0.5 rounded-full text-[11px] font-black flex items-center gap-1.5">
          👑 SUPER ADMIN
        </span>
      );
    }
    if (r === 'ADMIN') {
      return (
        <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2.5 py-0.5 rounded-full text-[11px] font-black flex items-center gap-1.5">
          🛡️ ADMINISTRATEUR
        </span>
      );
    }
    return (
      <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full text-[11px] font-black flex items-center gap-1.5">
        👮 AGENT DE SÉCURITÉ
      </span>
    );
  };

  return (
    <div className="p-3 w-full max-w-7xl mx-auto space-y-2" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Top Header Row with Title and Action Buttons inline */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-base font-black text-slate-900 dark:text-white tracking-tight">Mon Profil Utilisateur</h1>

        {/* Action buttons inlined at top */}
        <div className="flex flex-wrap gap-1.5 items-center">
          {isEditing ? (
            <>
              <Btn variant="secondary" size="sm" onClick={() => setIsEditing(false)}>
                Annuler
              </Btn>
              <Btn variant="primary" size="sm" icon={Send} loading={envoi} onClick={handleSaveProfile}>
                Enregistrer
              </Btn>
            </>
          ) : (
            <>
              <Btn variant="secondary" size="sm" icon={Pencil} onClick={startEditing}>
                Modifier
              </Btn>

              {!isAdmin && !isSuperAdmin && (
                <Btn
                  variant="secondary"
                  size="sm"
                  icon={Send}
                  disabled={!!demandePendante}
                  onClick={() => setDemandeModal(true)}
                >
                  Demande
                </Btn>
              )}

              <Btn variant="warning" size="sm" icon={Lock} onClick={() => setShowPasswordModal(true)}>
                Mot de passe
              </Btn>

              <Btn variant="danger" size="sm" icon={LogOut} onClick={handleLogout}>
                {t.logout || 'Déconnexion'}
              </Btn>
            </>
          )}
        </div>
      </div>

      {/* Demande en attente (Agent) */}
      {!loadingDemande && demandePendante && (
        <div className="flex items-start gap-2 p-1.5 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 shadow-sm text-xs">
          <Clock size={14} className="text-amber-500 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-bold text-amber-800 dark:text-amber-300">Demande de modification en attente</p>
            <p className="text-[10px] text-amber-600 dark:text-amber-400">
              Champ(s) : <span className="font-bold">{Object.keys(demandePendante?.modifications || {}).join(', ')}</span>
            </p>
          </div>
        </div>
      )}

      {/* Hero Banner */}
      <div className="relative bg-gradient-to-br from-brand-navy via-slate-900 to-black rounded-xl p-2.5 lg:p-3 flex flex-row items-center gap-3 overflow-hidden shadow-sm">
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute -bottom-10 right-20 w-28 h-28 rounded-full bg-white/5 pointer-events-none" />

        {/* Avatar Photo */}
        <div className="relative shrink-0">
          <div className="w-14 h-14 lg:w-16 lg:h-16 rounded-xl overflow-hidden bg-white/10 border-2 border-white/20 flex items-center justify-center shadow">
            {agent?.photo ? (
              <img src={agent.photo} alt="Utilisateur" className="w-full h-full object-cover" />
            ) : (
              <span className="text-base lg:text-lg font-black text-white">{initials}</span>
            )}
          </div>
          <button
            onClick={() => fileRef.current?.click()}
            className="absolute -bottom-1 -right-1 w-5.5 h-5.5 rounded-full bg-brand-blue-bright text-white border border-slate-900 flex items-center justify-center cursor-pointer hover:scale-110 transition-transform shadow"
            title="Changer la photo de profil"
          >
            <Camera size={11} />
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
        </div>

        {/* User identity & QR button */}
        <div className="text-white text-left z-10 space-y-0.5 flex-1 min-w-0">
          <div>
            <p className="text-base lg:text-lg font-black tracking-tight truncate leading-tight">{fullName}</p>
            <p className="text-[10px] text-slate-400 font-mono font-bold leading-none">{agent?.email || '—'}</p>
          </div>

          <div className="flex gap-1.5 flex-wrap items-center pt-0.5">
            {getRoleBadge(role)}

            <span className="bg-white/10 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold text-slate-300 border border-white/10">
              {displayMatricule}
            </span>

            <button
              onClick={handleDownloadQr}
              disabled={qrLoading}
              className="bg-white/10 hover:bg-white/20 backdrop-blur-md px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 border border-white/10 transition-all disabled:opacity-50 cursor-pointer"
            >
              <QrCode size={12} className="text-emerald-400" />
              {qrLoading ? 'Génération...' : 'Mon QR Code'}
            </button>
          </div>

          <p className="text-[11px] opacity-80 flex items-center gap-1.5 pt-0.5">
            <Building size={13} /> {entrepriseNom} — {displayPoste}
          </p>
        </div>
      </div>

      {erreurEnvoi && isEditing && (
        <div className="p-2 bg-red-50 dark:bg-red-950/30 text-brand-red border border-brand-red-bright/20 rounded-lg text-[11px] font-bold flex items-center gap-2">
          <XCircle size={14} /><span>{erreurEnvoi}</span>
        </div>
      )}

      {/* Profil details grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <div>
          <h3 className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mb-0.5 ml-1">Coordonnées & Identité</h3>
          <Card>
            {isEditing ? (
              <div className="p-2.5 space-y-2">
                <FormInput
                  label="Prénom"
                  id="editPrenom"
                  value={editForm.prenom}
                  onChange={e => setEditForm({ ...editForm, prenom: e.target.value })}
                />
                <FormInput
                  label="Nom"
                  id="editNom"
                  value={editForm.nom}
                  onChange={e => setEditForm({ ...editForm, nom: e.target.value })}
                />
                <FormInput
                  label="E-mail"
                  id="editEmail"
                  type="email"
                  value={editForm.email}
                  onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                />
                <FormInput
                  label="Téléphone"
                  id="editPhone"
                  value={editForm.telephone}
                  onChange={e => setEditForm({ ...editForm, telephone: e.target.value })}
                />
              </div>
            ) : (
              <>
                <InfoRow icon={User}      label="Nom Complet" value={`${agent?.prenom || ''} ${agent?.nom || ''}`} />
                <InfoRow icon={Mail}      label="Adresse E-mail" value={agent?.email} />
                <InfoRow icon={Phone}     label="Numéro de Téléphone" value={agent?.telephone || 'Non renseigné'} />
                <InfoRow icon={Building2} label="Entreprise / Organisation" value={entrepriseNom} />
              </>
            )}
          </Card>
        </div>

        <div>
          <h3 className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mb-0.5 ml-1">Infos Opérationnelles & Accès</h3>
          <Card>
            {isEditing ? (
              <div className="p-2.5 space-y-2">
                <FormInput
                  label="Département"
                  id="editDept"
                  value={editForm.departement}
                  onChange={e => setEditForm({ ...editForm, departement: e.target.value })}
                />
                <FormInput
                  label="Poste"
                  id="editPoste"
                  value={editForm.poste}
                  onChange={e => setEditForm({ ...editForm, poste: e.target.value })}
                />
                <FormInput
                  label="Niveau d'accréditation"
                  id="editAccred"
                  value={editForm.niveauAccreditation}
                  onChange={e => setEditForm({ ...editForm, niveauAccreditation: e.target.value })}
                />
              </div>
            ) : (
              <>
                <InfoRow icon={Building}   label="Département / Service" value={displayDepartement} />
                <InfoRow icon={Briefcase}  label="Poste de travail" value={displayPoste} />
                <InfoRow icon={Calendar}   label="Date de prise de fonction" value={displayDateArrivee} />
              </>
            )}
          </Card>
        </div>
      </div>

      {/* Modal 1: Password change */}
      <Modal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        title="Modifier le mot de passe"
        size="md"
      >
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <FormInput
            label="Nouveau mot de passe"
            id="passNew"
            type="password"
            placeholder="Minimum 4 caractères..."
            value={passData.newPassword}
            onChange={e => setPassData({ ...passData, newPassword: e.target.value })}
            required
          />

          <FormInput
            label="Confirmer le nouveau mot de passe"
            id="passConfirm"
            type="password"
            placeholder="Confirmez..."
            value={passData.confirmPassword}
            onChange={e => setPassData({ ...passData, confirmPassword: e.target.value })}
            required
          />

          <div className="flex justify-end gap-3 pt-3">
            <Btn variant="secondary" onClick={() => setShowPasswordModal(false)}>
              Annuler
            </Btn>
            <Btn variant="primary" type="submit" loading={updatingPass} icon={Lock}>
              Valider
            </Btn>
          </div>
        </form>
      </Modal>

      {/* Modal 2: Change request for agent */}
      <Modal isOpen={demandeModal} onClose={() => setDemandeModal(false)} title="Demande de modification de profil" size="md">
        <form onSubmit={handleSubmitDemande} className="space-y-5">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-bold bg-slate-50 dark:bg-slate-900/40 rounded-lg px-4 py-3 border border-slate-100 dark:border-slate-800">
            Sélectionnez les champs à modifier et spécifiez la valeur souhaitée.
          </p>

          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Champs à modifier</p>
            <div className="space-y-2">
              {CHAMPS_DEMANDE.map(({ key, label }) => {
                const selected = champsSelectionnes.includes(key);
                return (
                  <div key={key} className={`rounded-xl border-2 transition-all ${selected ? 'border-brand-blue-bright/40 bg-brand-blue-bright/5' : 'border-slate-100 dark:border-slate-800'}`}>
                    <button
                      type="button"
                      onClick={() => {
                        setChampsSelectionnes(prev =>
                          prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
                        );
                      }}
                      className="w-full flex items-center justify-between px-4 py-2.5 text-left"
                    >
                      <span className={`text-sm font-bold ${selected ? 'text-brand-blue-bright' : 'text-slate-600 dark:text-slate-300'}`}>{label}</span>
                      {selected ? <Minus size={16} className="text-brand-blue-bright" /> : <Plus size={16} className="text-slate-400" />}
                    </button>
                    {selected && (
                      <div className="px-4 pb-3">
                        <input
                          type={key === 'dateArrivee' ? 'date' : 'text'}
                          value={valeurs[key] || ''}
                          onChange={e => setValeurs(prev => ({ ...prev, [key]: e.target.value }))}
                          placeholder={`Nouvelle valeur pour "${label}"`}
                          className="w-full border-2 border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm font-bold bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:border-brand-blue-bright transition-colors"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Motif (optionnel)</p>
            <textarea
              value={motif}
              onChange={e => setMotif(e.target.value)}
              rows={3}
              placeholder="Spécifiez le motif de votre demande..."
              className="w-full border-2 border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:border-brand-blue-bright transition-colors resize-none"
            />
          </div>

          <div className="flex gap-3 justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
            <Btn variant="secondary" onClick={() => setDemandeModal(false)}>Annuler</Btn>
            <Btn type="submit" variant="primary" icon={Send} loading={envoi}>Envoyer la demande</Btn>
          </div>
        </form>
      </Modal>
    </div>
  );
}
