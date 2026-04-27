import React from 'react';
import {
  Moon, Sun, Globe, Database, RefreshCw, WifiOff, Trash2, Bell, Smartphone, Volume2,
  LifeBuoy, HelpCircle, Bug, FileText, ShieldAlert, Info,
  Camera, Building, Phone, Mail, Calendar, BadgeCheck,
  LogOut, Pencil
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Card, Toggle, Btn } from '../components/UI';

/* ============================================
   SETTINGS / PARAMÈTRES
============================================ */
function SettingRow({ icon: Icon, label, description, children }) {
  return (
    <div className="flex justify-between items-center p-4 border-b border-slate-100 dark:border-slate-800 last:border-0">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-900 text-brand-blue flex items-center justify-center shrink-0">
          <Icon size={20} />
        </div>
        <div>
          <p className="font-bold text-sm text-slate-900 dark:text-slate-100">{label}</p>
          {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
        </div>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function SectionCard({ title, children }) {
  return (
    <div className="mb-6">
      <h3 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest mb-3 ml-1">{title}</h3>
      <Card>
        {children}
      </Card>
    </div>
  );
}

export function Parametres() {
  const { state, dispatch, notify } = useApp();
  const { settings, notifications, darkMode } = state;

  const updateSetting = (k, v) => dispatch({ type: 'UPDATE_SETTING', key: k, value: v });
  const updateNotif = (k, v) => dispatch({ type: 'UPDATE_NOTIFICATION_PREF', key: k, value: v });

  return (
    <div className={`p-3 lg:p-6 w-full max-w-7xl mx-auto flex flex-col gap-5`}>
      <div className="mb-1">
        <h1 className="text-xl lg:text-2xl font-black text-slate-900 dark:text-white">Paramètres</h1>
        <p className="text-xs text-slate-500 mt-1">Personnalisez votre interface et vos préférences</p>
      </div>

      <SectionCard title="Apparence">
        <SettingRow icon={darkMode ? Moon : Sun} label="Mode sombre" description="Interface en mode nuit">
          <Toggle active={darkMode} onChange={() => dispatch({ type: 'TOGGLE_DARK' })} />
        </SettingRow>
        <SettingRow icon={Globe} label="Langue" description="Langue de l'interface">
          <select 
            value={settings.language} 
            onChange={e => updateSetting('language', e.target.value)}
            className="p-2 border-1.5 border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-bold outline-none"
          >
            <option value="fr">Français</option>
            <option value="en">English</option>
            <option value="ar">العربية</option>
          </select>
        </SettingRow>
        <div className="p-4 border-b border-slate-100 dark:border-slate-800">
          <p className="font-bold text-sm text-slate-900 dark:text-slate-100 mb-3">Taille du texte</p>
          <div className="flex gap-2">
            {['small', 'medium', 'large'].map(sz => (
              <button 
                key={sz} 
                onClick={() => updateSetting('fontSize', sz)}
                className={`px-4 py-2 rounded-lg border-1.5 font-bold text-xs transition-all ${
                  settings.fontSize === sz 
                    ? 'border-brand-blue bg-blue-50 text-brand-blue dark:bg-blue-900/30 dark:text-blue-400' 
                    : 'border-slate-200 bg-slate-50 text-slate-500 dark:border-slate-700 dark:bg-slate-800'
                }`}
              >
                {sz === 'small' ? 'Petite' : sz === 'medium' ? 'Normale' : 'Grande'}
              </button>
            ))}
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Synchronisation & Données">
        <SettingRow icon={RefreshCw} label="Sync automatique" description="Actualisation en temps réel">
          <Toggle active={settings.autoSync} onChange={v => updateSetting('autoSync', v)} />
        </SettingRow>
        <SettingRow icon={WifiOff} label="Mode hors ligne" description="Scanner sans connexion">
          <Toggle active={settings.offlineMode} onChange={v => updateSetting('offlineMode', v)} />
        </SettingRow>
        <SettingRow icon={Database} label="Sauvegarde" description="Dernière sauvegarde : il y a 2h">
          <Btn variant="secondary" size="sm" onClick={() => notify('success', '💾 Données sauvegardées !')}>Sauvegarder</Btn>
        </SettingRow>
        <SettingRow icon={Trash2} label="Vider le cache" description="Libérer l'espace local">
          <Btn variant="danger" size="sm" onClick={() => notify('info', '🗑 Cache vidé')}>Nettoyer</Btn>
        </SettingRow>
      </SectionCard>

      <SectionCard title="Notifications">
        <SettingRow icon={Bell} label="Nouvelles visites" description="Alerte lors d'un scan réussi">
          <Toggle active={notifications.newVisits} onChange={v => updateNotif('newVisits', v)} />
        </SettingRow>
        <SettingRow icon={Calendar} label="Rappels de rendez-vous" description="Alertes pour les visites planifiées">
          <Toggle active={notifications.reminders} onChange={v => updateNotif('reminders', v)} />
        </SettingRow>
        <SettingRow icon={Smartphone} label="Notifications push" description="Alertes directes sur mobile">
          <Toggle active={notifications.push} onChange={v => updateNotif('push', v)} />
        </SettingRow>
        <SettingRow icon={Volume2} label="Sons d'alerte" description="Retour sonore lors des alertes">
          <Toggle active={notifications.sounds} onChange={v => updateNotif('sounds', v)} />
        </SettingRow>
      </SectionCard>

      <SectionCard title="Support & Assistance">
        <SettingRow icon={LifeBuoy} label="Contacter le support" description="Assistance technique 24/7">
          <Btn variant="secondary" size="sm" onClick={() => notify('info', '📞 Support contacté')}>Contact</Btn>
        </SettingRow>
        <SettingRow icon={HelpCircle} label="FAQ" description="Questions fréquentes">
          <Btn variant="secondary" size="sm">Consulter</Btn>
        </SettingRow>
        <SettingRow icon={Bug} label="Signaler un bug" description="Aidez-nous à améliorer l'outil">
          <Btn variant="danger" size="sm">Signaler</Btn>
        </SettingRow>
      </SectionCard>

      <SectionCard title="À propos">
        <SettingRow icon={Info} label="Version" description="Application NoRegis">
          <span className="text-xs font-mono font-bold bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-md">v1.0.0</span>
        </SettingRow>
        <SettingRow icon={ShieldAlert} label="Politique de confidentialité" description="RGPD & protection des données">
          <Btn variant="ghost" size="sm">Lire</Btn>
        </SettingRow>
        <SettingRow icon={FileText} label="Conditions d'utilisation" description="Règles et engagements">
          <Btn variant="ghost" size="sm">Lire</Btn>
        </SettingRow>
      </SectionCard>
    </div>
  );
}

/* ============================================
   PROFIL AGENT
============================================ */
function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-4 p-4 border-b border-slate-100 dark:border-slate-800 last:border-0">
      <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-brand-blue flex items-center justify-center shrink-0">
        <Icon size={18} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">{label}</p>
        <p className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-0.5">{value || '—'}</p>
      </div>
    </div>
  );
}

export function ProfilAgent() {
  const { state, dispatch, notify } = useApp();
  const { agent } = state;
  const fileRef = React.useRef(null);

  const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      dispatch({ type: 'UPDATE_AGENT', payload: { photo: reader.result } });
      notify('success', '📸 Photo mise à jour !');
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="p-3 lg:p-6 w-full max-w-7xl mx-auto flex flex-col gap-6">
      <h1 className="text-xl lg:text-2xl font-black text-slate-900 dark:text-white">Mon Profil</h1>

      {/* Hero */}
      <div className="relative bg-gradient-to-br from-brand-navy via-slate-900 to-black rounded-xl p-8 lg:p-12 flex flex-col lg:flex-row items-center gap-8 overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute -bottom-10 right-20 w-32 h-32 rounded-full bg-white/5 pointer-events-none" />

        {/* Photo */}
        <div className="relative shrink-0">
          <div className="w-32 h-32 lg:w-40 lg:h-40 rounded-xl overflow-hidden bg-white/10 border-4 border-white/20 flex items-center justify-center">
            {agent.photo
              ? <img src={agent.photo} alt="Agent" className="w-full h-full object-cover" />
              : <span className="text-5xl lg:text-6xl font-black text-white">{agent.initials}</span>
            }
          </div>
          <button 
            onClick={() => fileRef.current?.click()} 
            className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-brand-blue-bright text-white border-4 border-slate-900 flex items-center justify-center cursor-pointer hover:scale-110 transition-transform"
          >
            <Camera size={18} />
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
        </div>

        {/* Info */}
        <div className="text-white text-center lg:text-left z-10">
          <p className="text-3xl lg:text-4xl font-black mb-3">{agent.prenom} {agent.nom}</p>
          <div className="flex gap-2 flex-wrap justify-center lg:justify-start">
            <span className="bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 border border-white/10">
              <BadgeCheck size={14} className="text-blue-400" /> {agent.role}
            </span>
            <span className="bg-white/5 px-4 py-1.5 rounded-full text-xs font-mono font-bold text-slate-300 border border-white/5">
              {agent.matricule}
            </span>
          </div>
          <p className="text-sm opacity-70 mt-5 flex items-center gap-2 justify-center lg:justify-start">
            <Building size={14} /> {agent.poste}
          </p>
        </div>
      </div>

      {/* Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h3 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest mb-3 ml-1">Coordonnées</h3>
          <Card>
            <InfoRow icon={Mail} label="Adresse email" value={agent.email} />
            <InfoRow icon={Phone} label="Téléphone" value={agent.telephone} />
            <InfoRow icon={Building} label="Département" value={agent.departement} />
          </Card>
        </div>
        <div>
          <h3 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest mb-3 ml-1">Informations opérationnelles</h3>
          <Card>
            <InfoRow icon={BadgeCheck} label="Niveau d'accréditation" value={agent.niveau} />
            <InfoRow icon={Building} label="Poste de travail" value={agent.poste} />
            <InfoRow icon={Calendar} label="Date d'arrivée" value={agent.dateArrivee} />
          </Card>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-end mt-2">
        <Btn 
          variant="secondary" 
          icon={Pencil} 
          onClick={() => notify('info', '✏️ Modification du profil (bientôt disponible)')}
          className="!border-brand-blue-bright/30 !text-brand-blue-bright hover:!bg-brand-blue-bright hover:!text-white transition-all"
        >
          Modifier
        </Btn>
        <Btn variant="danger" icon={LogOut} onClick={() => notify('warning', '🔒 Déconnexion (bientôt disponible)')}>
          Déconnexion
        </Btn>
      </div>
    </div>
  );
}
