import { useRef, useState, useEffect } from 'react';
import {
  Moon, Sun, Globe, Bell, Smartphone, Volume2,
  LifeBuoy, Bug, Info, ShieldAlert,
  Camera, Building, Phone, Mail, Calendar, BadgeCheck,
  LogOut, Pencil, Send, Clock, XCircle, Plus, Minus,
} from 'lucide-react';
import { useApp } from '../context/useAppState';
import { Card, Toggle, Btn, Modal } from '../components/UI';
import { TRANSLATIONS } from '../translations';
import { demandeService } from '../services/demandeService';

/* ============================================
   PARAMÈTRES
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
      <Card>{children}</Card>
    </div>
  );
}

export function Parametres() {
  const { state, dispatch, notify } = useApp();
  const { settings, notifications, darkMode } = state;
  const t = TRANSLATIONS[settings.language] || TRANSLATIONS.fr;

  const updateSetting = (k, v) => dispatch({ type: 'UPDATE_SETTING', key: k, value: v });
  const updateNotif   = (k, v) => dispatch({ type: 'UPDATE_NOTIFICATION_PREF', key: k, value: v });

  return (
    <div className={`p-3 lg:p-6 w-full max-w-7xl mx-auto flex flex-col gap-5`} dir={settings.language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="mb-1">
        <h1 className="text-xl lg:text-2xl font-black text-slate-900 dark:text-white">{t.settings}</h1>
        <p className="text-xs text-slate-500 mt-1">{t.customize_prefs}</p>
      </div>

      <SectionCard title={t.appearance}>
        <SettingRow icon={darkMode ? Moon : Sun} label={t.dark_mode} description={t.night_interface}>
          <Toggle active={darkMode} onChange={() => dispatch({ type: 'TOGGLE_DARK' })} />
        </SettingRow>
        <SettingRow icon={Globe} label={t.language} description={t.language}>
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
          <p className="font-bold text-sm text-slate-900 dark:text-slate-100 mb-3">{t.textSize}</p>
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
                {t[sz]}
              </button>
            ))}
          </div>
        </div>
      </SectionCard>

      <SectionCard title={t.notifications || 'Notifications'}>
        <SettingRow icon={Bell} label={t.new_visits} description={t.scan_alert}>
          <Toggle active={notifications.newVisits} onChange={v => updateNotif('newVisits', v)} />
        </SettingRow>
        <SettingRow icon={Smartphone} label={t.push_notifs} description={t.mobile_alerts}>
          <Toggle active={notifications.push} onChange={v => updateNotif('push', v)} />
        </SettingRow>
        <SettingRow icon={Volume2} label={t.alert_sounds} description={t.sound_feedback}>
          <Toggle active={notifications.sounds} onChange={v => updateNotif('sounds', v)} />
        </SettingRow>
      </SectionCard>

      <SectionCard title={t.support_assist}>
        <SettingRow icon={LifeBuoy} label={t.contact_support} description={t.tech_assist}>
          <Btn variant="secondary" size="sm" onClick={() => notify('info', `📞 ${t.support_called}`)}>{t.contact_btn}</Btn>
        </SettingRow>
        <SettingRow icon={Bug} label={t.report_bug} description={t.help_improve}>
          <Btn variant="danger" size="sm" onClick={() => notify('error', `🪲 ${t.bug_reported}`)}>{t.report_btn}</Btn>
        </SettingRow>
      </SectionCard>

      <SectionCard title={t.about}>
        <SettingRow icon={Info} label="Version" description={t.app_version}>
          <span className="text-xs font-mono font-bold bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-md">v1.0.0</span>
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

// Champs modifiables via demande
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
  const { agent, settings } = state;
  const t = TRANSLATIONS[settings.language] || TRANSLATIONS.fr;
  const fileRef = useRef(null);

  const [demandeModal, setDemandeModal]       = useState(false);
  const [demandePendante, setDemandePendante] = useState(null);
  const [loadingDemande, setLoadingDemande]   = useState(true);

  // Formulaire de demande
  const [champsSelectionnes, setChampsSelectionnes] = useState([CHAMPS_DEMANDE[0].key]);
  const [valeurs, setValeurs] = useState({});
  const [motif, setMotif]     = useState('');
  const [envoi, setEnvoi]     = useState(false);
  const [erreurEnvoi, setErreurEnvoi] = useState('');

  // Charger la demande en attente de l'agent
  useEffect(() => {
    const charger = async () => {
      try {
        const res = await demandeService.maDemande();
        setDemandePendante(res?.demande || null);
      } catch { /* silencieux */ } finally {
        setLoadingDemande(false);
      }
    };
    charger();
  }, []);

  const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      dispatch({ type: 'UPDATE_AGENT', payload: { photo: reader.result } });
      notify('success', `📸 ${t.photo_updated}`);
    };
    reader.readAsDataURL(file);
  };

  const handleLogout = () => {
    dispatch({ type: 'LOGOUT' });
    notify('info', t.logout_ok);
  };

  const toggleChamp = (key) => {
    setChampsSelectionnes(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
    setValeurs(prev => {
      const copy = { ...prev };
      delete copy[key];
      return copy;
    });
  };

  const openDemandeModal = () => {
    setChampsSelectionnes([CHAMPS_DEMANDE[0].key]);
    setValeurs({});
    setMotif('');
    setErreurEnvoi('');
    setDemandeModal(true);
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
      setErreurEnvoi('Saisissez au moins une nouvelle valeur pour un champ sélectionné.');
      return;
    }
    setEnvoi(true);
    setErreurEnvoi('');
    try {
      await demandeService.soumettre({ modifications, motif });
      setDemandeModal(false);
      notify('success', "✅ Demande envoyée. L'administrateur la traitera prochainement.");
      const res = await demandeService.maDemande();
      setDemandePendante(res?.demande || null);
    } catch (err) {
      setErreurEnvoi(err.message || "Erreur lors de l'envoi.");
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <div className="p-3 lg:p-6 w-full max-w-7xl mx-auto flex flex-col gap-6" dir={settings.language === 'ar' ? 'rtl' : 'ltr'}>
      <h1 className="text-xl lg:text-2xl font-black text-slate-900 dark:text-white">{t.profile}</h1>

      {/* Bannière demande en attente */}
      {!loadingDemande && demandePendante && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
          <Clock size={18} className="text-amber-500 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-amber-800 dark:text-amber-300">Demande de modification en attente</p>
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
              Champ(s) : <span className="font-bold">{Object.keys(demandePendante.modifications || {}).join(', ')}</span>
            </p>
            {demandePendante.motif && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5 italic">«{demandePendante.motif}»</p>
            )}
            <p className="text-[10px] text-amber-500 mt-1 font-bold">
              Soumise le {new Date(demandePendante.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>
      )}

      {/* Hero */}
      <div className="relative bg-gradient-to-br from-brand-navy via-slate-900 to-black rounded-xl p-8 lg:p-12 flex flex-col lg:flex-row items-center gap-8 overflow-hidden">
        <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute -bottom-10 right-20 w-32 h-32 rounded-full bg-white/5 pointer-events-none" />

        {/* Photo */}
        <div className="relative shrink-0">
          <div className="w-32 h-32 lg:w-40 lg:h-40 rounded-xl overflow-hidden bg-white/10 border-4 border-white/20 flex items-center justify-center">
            {agent?.photo
              ? <img src={agent.photo} alt="Agent" className="w-full h-full object-cover" />
              : <span className="text-5xl lg:text-6xl font-black text-white">{agent?.initials || 'AU'}</span>
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
          <p className="text-3xl lg:text-4xl font-black mb-3">{agent?.prenom} {agent?.nom}</p>
          <div className="flex gap-2 flex-wrap justify-center lg:justify-start">
            <span className="bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 border border-white/10">
              <BadgeCheck size={14} className="text-blue-400" /> {agent?.role}
            </span>
            <span className="bg-white/5 px-4 py-1.5 rounded-full text-xs font-mono font-bold text-slate-300 border border-white/5">
              {agent?.matricule}
            </span>
          </div>
          <p className="text-sm opacity-70 mt-5 flex items-center gap-2 justify-center lg:justify-start">
            <Building size={14} /> {agent?.poste || t.poste_undef}
          </p>
        </div>
      </div>

      {/* Details — lecture seule */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h3 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest mb-3 ml-1">{t.coordinates}</h3>
          <Card>
            <InfoRow icon={Mail}    label={t.email}  value={agent?.email} />
            <InfoRow icon={Phone}   label={t.phone}  value={agent?.telephone} />
            <InfoRow icon={Building} label={t.dept}  value={agent?.departement} />
          </Card>
        </div>
        <div>
          <h3 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest mb-3 ml-1">{t.ops_info}</h3>
          <Card>
            <InfoRow icon={BadgeCheck} label={t.acc_level}   value={agent?.niveauAccreditation || agent?.niveau} />
            <InfoRow icon={Building}   label={t.workstation} value={agent?.poste} />
            <InfoRow icon={Calendar}   label={t.arrival}     value={
              agent?.dateArrivee
                ? new Date(agent.dateArrivee).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
                : '—'
            } />
          </Card>
        </div>
      </div>

      {/* Note lecture seule */}
      <div className="flex items-center gap-2 text-xs text-slate-400 font-bold bg-slate-50 dark:bg-slate-900/40 px-4 py-3 rounded-lg border border-slate-100 dark:border-slate-800">
        <ShieldAlert size={14} className="text-slate-400 shrink-0" />
        Ces informations sont gérées par votre administrateur. Pour les modifier, soumettez une demande.
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-end mt-2">
        <Btn
          variant="secondary"
          icon={Pencil}
          disabled={!!demandePendante}
          onClick={openDemandeModal}
          className="!border-brand-blue-bright/30 !text-brand-blue-bright hover:!bg-brand-blue-bright hover:!text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {demandePendante ? 'Demande en attente…' : 'Demander une modification'}
        </Btn>
        <Btn variant="danger" icon={LogOut} onClick={handleLogout}>
          {t.logout}
        </Btn>
      </div>

      {/* ── MODAL DE DEMANDE ───────────────────────────────── */}
      <Modal isOpen={demandeModal} onClose={() => setDemandeModal(false)} title="Demande de modification de profil" size="md">
        <form onSubmit={handleSubmitDemande} className="space-y-5">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-bold bg-slate-50 dark:bg-slate-900/40 rounded-lg px-4 py-3 border border-slate-100 dark:border-slate-800">
            Sélectionnez les champs à modifier, indiquez les nouvelles valeurs et ajoutez un motif si besoin.
          </p>

          {erreurEnvoi && (
            <div className="p-3 bg-red-50 dark:bg-red-950/30 text-brand-red border border-brand-red-bright/20 rounded-lg text-xs font-bold flex items-center gap-2">
              <XCircle size={16} /><span>{erreurEnvoi}</span>
            </div>
          )}

          {/* Sélection des champs */}
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Champs à modifier</p>
            <div className="space-y-2">
              {CHAMPS_DEMANDE.map(({ key, label }) => {
                const selected = champsSelectionnes.includes(key);
                return (
                  <div key={key} className={`rounded-xl border-2 transition-all ${selected ? 'border-brand-blue-bright/40 bg-brand-blue-bright/5' : 'border-slate-100 dark:border-slate-800'}`}>
                    <button
                      type="button"
                      onClick={() => toggleChamp(key)}
                      className="w-full flex items-center justify-between px-4 py-2.5 text-left"
                    >
                      <span className={`text-sm font-bold ${selected ? 'text-brand-blue-bright' : 'text-slate-600 dark:text-slate-300'}`}>{label}</span>
                      {selected
                        ? <Minus size={16} className="text-brand-blue-bright shrink-0" />
                        : <Plus  size={16} className="text-slate-400 shrink-0" />
                      }
                    </button>
                    {selected && (
                      <div className="px-4 pb-3">
                        <input
                          type={key === 'dateArrivee' ? 'date' : 'text'}
                          value={valeurs[key] || ''}
                          onChange={e => setValeurs(prev => ({ ...prev, [key]: e.target.value }))}
                          placeholder={`Nouvelle valeur pour "${label}"`}
                          className="w-full border-2 border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm font-bold bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:border-brand-blue-bright/60 transition-colors"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Motif */}
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Motif (optionnel)</p>
            <textarea
              value={motif}
              onChange={e => setMotif(e.target.value)}
              rows={3}
              placeholder="Ex: Changement de poste depuis le 1er mai..."
              className="w-full border-2 border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:border-brand-blue-bright/60 transition-colors resize-none"
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
