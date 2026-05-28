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
import { authService } from '../services/authService';
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
function InfoField({ label, value, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">{label}</p>
      {children ? children : <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{value || '—'}</p>}
    </div>
  );
}

function SectionHeader({ title, onEdit, isEditing, onCancel, onSave, loading }) {
  return (
    <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-200 dark:border-slate-700">
      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{title}</h3>
      {!isEditing ? (
        <button
          onClick={onEdit}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-brand-orange bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/40 rounded-lg border border-orange-200 dark:border-orange-700/50 transition-colors"
        >
          <Pencil size={14} /> Edit
        </button>
      ) : (
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={loading}
            className="px-3 py-1.5 text-xs font-bold text-white bg-brand-blue hover:bg-brand-blue/90 disabled:opacity-50 rounded-lg transition-colors"
          >
            {loading ? 'Saving...' : 'Save'}
          </button>
        </div>
      )}
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

  // Admin edit mode direct
  const [isEditing, setIsEditing] = useState(false);
  const [editingSection, setEditingSection] = useState(null);
  const [editForm, setEditForm] = useState({
    prenom: '', nom: '', telephone: '', departement: '', poste: '', niveauAccreditation: '', dateArrivee: ''
  });

  // Charger la demande en attente de l'agent
  useEffect(() => {
    if (agent?.role === 'ADMIN') {
      setLoadingDemande(false);
      return;
    }
    const charger = async () => {
      try {
        const res = await demandeService.maDemande();
        setDemandePendante(res?.demande || null);
      } catch { /* silencieux */ } finally {
        setLoadingDemande(false);
      }
    };
    charger();
  }, [agent]);

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

  const startEditing = () => {
    setEditForm({
      prenom: agent.prenom || '',
      nom: agent.nom || '',
      telephone: agent.telephone || '',
      departement: agent.departement || '',
      poste: agent.poste || '',
      niveauAccreditation: agent.niveauAccreditation || agent.niveau || '',
      dateArrivee: agent.dateArrivee ? new Date(agent.dateArrivee).toISOString().split('T')[0] : ''
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
      const updatedUser = res.user || res.utilisateur;
      dispatch({ type: 'UPDATE_AGENT', payload: updatedUser });
      localStorage.setItem('user', JSON.stringify(updatedUser));
      notify('success', '✅ Profil mis à jour avec succès.');
      setIsEditing(false);
    } catch (err) {
      setErreurEnvoi(err.message || 'Erreur lors de la mise à jour.');
    } finally {
      setEnvoi(false);
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
    <div className="p-3 lg:p-6 w-full max-w-7xl mx-auto flex flex-col gap-6 bg-slate-50 dark:bg-slate-950 min-h-screen" dir={settings.language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Header with Profile Title */}
      <div className="mb-2">
        <h1 className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white">My Profile</h1>
      </div>

      {/* Profile Card with Avatar Header */}
      <Card className="bg-white dark:bg-slate-900">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="w-28 h-28 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 border-4 border-slate-200 dark:border-slate-700 flex items-center justify-center flex-shrink-0">
                {agent?.photo
                  ? <img src={agent.photo} alt="Agent" className="w-full h-full object-cover" />
                  : <span className="text-4xl font-black text-slate-400">{agent?.initials || 'AU'}</span>
                }
              </div>
              <button
                onClick={() => fileRef.current?.click()}
                className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-brand-blue text-white border-4 border-white dark:border-slate-900 flex items-center justify-center cursor-pointer hover:scale-110 transition-transform"
                title="Change photo"
              >
                <Camera size={16} />
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-1">{agent?.prenom} {agent?.nom}</h2>
              <p className="text-sm font-bold text-slate-600 dark:text-slate-400 mb-3">{agent?.role}</p>
              <div className="flex flex-wrap gap-2">
                <span className="text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded-lg">{agent?.matricule}</span>
                {agent?.poste && (
                  <span className="text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded-lg flex items-center gap-2">
                    <Building size={12} /> {agent.poste}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Personal Information Section */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800">
          <SectionHeader
            title="Personal Information"
            isEditing={editingSection === 'personal'}
            onEdit={() => {
              setEditingSection('personal');
              setEditForm(prev => ({...prev, prenom: agent.prenom || '', nom: agent.nom || '', telephone: agent.telephone || ''}));
            }}
            onCancel={() => setEditingSection(null)}
            onSave={() => handleSaveProfile({ preventDefault: () => {} })}
            loading={envoi}
          />

          {editingSection === 'personal' ? (
            <div className="space-y-4">
              <InfoField label="First Name">
                <input
                  type="text"
                  value={editForm.prenom}
                  onChange={e => setEditForm(prev => ({ ...prev, prenom: e.target.value }))}
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm font-bold bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-brand-blue transition-colors"
                />
              </InfoField>
              <InfoField label="Last Name">
                <input
                  type="text"
                  value={editForm.nom}
                  onChange={e => setEditForm(prev => ({ ...prev, nom: e.target.value }))}
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm font-bold bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-brand-blue transition-colors"
                />
              </InfoField>
              <InfoField label="Phone Number">
                <input
                  type="text"
                  value={editForm.telephone}
                  onChange={e => setEditForm(prev => ({ ...prev, telephone: e.target.value }))}
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm font-bold bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-brand-blue transition-colors"
                />
              </InfoField>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <InfoField label="First Name" value={agent?.prenom} />
              <InfoField label="Last Name" value={agent?.nom} />
              <InfoField label="Phone Number" value={agent?.telephone} />
            </div>
          )}
        </div>

        {/* Address Section */}
        <div className="p-6">
          <SectionHeader
            title="Address"
            isEditing={editingSection === 'address'}
            onEdit={() => {
              setEditingSection('address');
              setEditForm(prev => ({...prev, departement: agent.departement || '', poste: agent.poste || '', niveauAccreditation: agent.niveauAccreditation || agent.niveau || ''}));
            }}
            onCancel={() => setEditingSection(null)}
            onSave={() => handleSaveProfile({ preventDefault: () => {} })}
            loading={envoi}
          />

          {editingSection === 'address' ? (
            <div className="space-y-4">
              <InfoField label="Département">
                <input
                  type="text"
                  value={editForm.departement}
                  onChange={e => setEditForm(prev => ({ ...prev, departement: e.target.value }))}
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm font-bold bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-brand-blue transition-colors"
                />
              </InfoField>
              <InfoField label="Poste">
                <input
                  type="text"
                  value={editForm.poste}
                  onChange={e => setEditForm(prev => ({ ...prev, poste: e.target.value }))}
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm font-bold bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-brand-blue transition-colors"
                />
              </InfoField>
              <InfoField label="Accréditation">
                <input
                  type="text"
                  value={editForm.niveauAccreditation}
                  onChange={e => setEditForm(prev => ({ ...prev, niveauAccreditation: e.target.value }))}
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm font-bold bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-brand-blue transition-colors"
                />
              </InfoField>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <InfoField label="Département" value={agent?.departement} />
              <InfoField label="Poste" value={agent?.poste} />
              <InfoField label="Accréditation" value={agent?.niveauAccreditation || agent?.niveau} />
            </div>
          )}
        </div>
      </Card>

      {/* Error Messages */}
      {erreurEnvoi && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 text-brand-red border border-brand-red-bright/20 rounded-lg text-sm font-bold flex items-center gap-2">
          <XCircle size={16} /> {erreurEnvoi}
        </div>
      )}

      {/* Pending Request Alert */}
      {!loadingDemande && demandePendante && (
        <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
          <Clock size={18} className="text-amber-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-bold text-amber-800 dark:text-amber-300">Modification en attente</p>
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
              Champs : {Object.keys(demandePendante.modifications || {}).join(', ')}
            </p>
          </div>
        </div>
      )}

      {/* Logout Button */}
      <div className="flex justify-end">
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

          {erreurEnvoi && !isEditing && (
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

