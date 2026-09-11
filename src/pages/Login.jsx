import { useState } from 'react';
import { Lock, User, Loader2, ChevronRight, AlertCircle, Eye, EyeOff, ShieldCheck, RefreshCw, ArrowLeft } from 'lucide-react';
import { useApp } from '../context/useAppState';
import { Card } from '../components/UI';
import { authService } from '../services/authService';
import { TRANSLATIONS } from '../translations';
import logo from '../assets/logo_noregis_shield.jpg';

export function Login() {
  const { state, dispatch, notify } = useApp();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [step, setStep] = useState('login'); // 'login' | '2fa'
  const [twoFactorInfo, setTwoFactorInfo] = useState({ userId: '', email: '', otpPreview: '' });
  const [otpCode, setOtpCode] = useState('');
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const currentLang = state.settings?.language || 'fr';
  const t = TRANSLATIONS[currentLang] || TRANSLATIONS.fr;

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await authService.login(formData);

      if (data.require2FA) {
        setTwoFactorInfo({
          userId: data.userId,
          email: data.email,
          otpPreview: data.otpPreview || '',
        });
        setStep('2fa');
        notify('info', 'Double authentification requise.');
        return;
      }

      dispatch({ 
        type: 'LOGIN', 
        payload: { 
          user: data.user,
          prenom: data.user?.prenom || 'Admin', 
          nom: data.user?.nom || 'User', 
          role: data.user?.role || 'Agent', 
          matricule: data.user?.matricule || 'AGN-001',
          initials: (data.user?.prenom?.[0] || 'A') + (data.user?.nom?.[0] || 'U'),
          email: data.user?.email || 'admin@noregis.app',
          telephone: data.user?.telephone || '+226 01 02 03 04',
          poste: data.user?.poste || 'Supervision Centrale',
          departement: data.user?.departement || 'Administration & Sécurité',
          niveau: data.user?.niveau || 'Niveau 1',
          dateArrivee: data.user?.dateArrivee || '28/04/2026'
        } 
      });
      notify('success', t.welcome);
    } catch (err) {
      setError(err.message || t.login_error);
      notify('error', t.login_failed);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2FA = async (e) => {
    e.preventDefault();
    if (!otpCode || otpCode.trim().length !== 6) {
      setError('Veuillez saisir le code à 6 chiffres.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = await authService.verify2FA({
        userId: twoFactorInfo.userId,
        code: otpCode.trim(),
      });

      dispatch({ 
        type: 'LOGIN', 
        payload: { 
          user: data.user,
          prenom: data.user?.prenom || 'Admin', 
          nom: data.user?.nom || 'User', 
          role: data.user?.role || 'Agent', 
          matricule: data.user?.matricule || 'AGN-001',
          initials: (data.user?.prenom?.[0] || 'A') + (data.user?.nom?.[0] || 'U'),
          email: data.user?.email || 'admin@noregis.app',
          telephone: data.user?.telephone || '+226 01 02 03 04',
          poste: data.user?.poste || 'Supervision Centrale',
          departement: data.user?.departement || 'Administration & Sécurité',
          niveau: data.user?.niveau || 'Niveau 1',
          dateArrivee: data.user?.dateArrivee || '28/04/2026'
        } 
      });
      notify('success', t.welcome);
    } catch (err) {
      setError(err.message || 'Code de vérification 2FA invalide.');
      notify('error', 'Échec de la vérification 2FA');
    } finally {
      setLoading(false);
    }
  };

  const handleResend2FA = async () => {
    setResending(true);
    setError('');
    try {
      const res = await authService.resend2FA({ userId: twoFactorInfo.userId });
      if (res.otpPreview) {
        setTwoFactorInfo(prev => ({ ...prev, otpPreview: res.otpPreview }));
      }
      notify('success', res.message || 'Nouveau code envoyé.');
    } catch (err) {
      setError(err.message || 'Impossible de renvoyer le code.');
    } finally {
      setResending(false);
    }
  };

  const changeLang = (l) => {
    dispatch({ type: 'UPDATE_SETTINGS', payload: { language: l } });
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden" dir={currentLang === 'ar' ? 'rtl' : 'ltr'}>
      {/* Language Selector Top Right */}
      <div className="absolute top-6 right-6 flex gap-2 z-50">
        {['fr', 'en', 'ar'].map(l => (
          <button 
            key={l}
            onClick={() => changeLang(l)}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${currentLang === l ? 'bg-brand-blue text-white shadow-lg shadow-blue-500/20' : 'bg-slate-900 text-slate-500 hover:text-white'}`}
          >
            {l}
          </button>
        ))}
      </div>

      {/* Animated Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-blue/20 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px]" />

      <div className="w-full max-w-md z-10">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-brand-blue to-blue-700 shadow-2xl shadow-blue-500/20 mb-6 group transition-all hover:scale-105">
            <img src={logo} alt="no regis logo " className="rounded-lg" />
          </div>
          <p className="text-slate-400 font-medium">{t.visitor_management}</p>
        </div>

        <Card className="!bg-slate-900/50 !backdrop-blur-xl !border-white/10 !p-8 shadow-2xl">
          {step === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="flex flex-col gap-6">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">{t.email}</label>
                <div className="relative">
                  <div className={`absolute ${currentLang === 'ar' ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-slate-500`}>
                    <User size={18} />
                  </div>
                  <input 
                    type="email" 
                    required
                    placeholder={t.email_placeholder}
                    className={`w-full bg-slate-800/50 border-2 border-slate-700/50 rounded-2xl py-4 ${currentLang === 'ar' ? 'pr-12 pl-4 text-right' : 'pl-12 pr-4'} text-white placeholder:text-slate-600 outline-none focus:border-brand-blue/50 focus:ring-4 focus:ring-brand-blue/10 transition-all font-bold`}
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2 ml-1">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">{t.password}</label>
                  <button type="button" className="text-[10px] font-black text-brand-blue uppercase tracking-widest hover:text-white transition-colors">{t.forgot_password}</button>
                </div>
                <div className="relative">
                  <div className={`absolute ${currentLang === 'ar' ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-slate-500`}>
                    <Lock size={18} />
                  </div>
                  <input 
                    type={showPassword ? "text" : "password"} 
                    required
                    placeholder="••••••••"
                    className={`w-full bg-slate-800/50 border-2 border-slate-700/50 rounded-2xl py-4 ${currentLang === 'ar' ? 'pr-12 pl-12 text-right' : 'pl-12 pr-12'} text-white placeholder:text-slate-600 outline-none focus:border-brand-blue/50 focus:ring-4 focus:ring-brand-blue/10 transition-all font-bold`}
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={`absolute ${currentLang === 'ar' ? 'left-4' : 'right-4'} top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors`}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex gap-3 items-center text-red-400">
                  <AlertCircle size={18} className="shrink-0" />
                  <p className="text-xs font-bold">{error}</p>
                </div>
              )}

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-gradient-to-r from-brand-blue to-blue-600 hover:from-blue-500 hover:to-blue-700 text-white font-black py-4 rounded-2xl shadow-lg shadow-blue-500/20 flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <>
                    {t.login_btn} 
                    <ChevronRight size={20} className={currentLang === 'ar' ? 'rotate-180' : ''} />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerify2FA} className="flex flex-col gap-6">
              <div className="text-center">
                <div className="inline-flex p-3 rounded-2xl bg-blue-500/10 text-brand-blue mb-3">
                  <ShieldCheck size={32} />
                </div>
                <h2 className="text-xl font-black text-white mb-1">Authentification 2FA</h2>
                <p className="text-xs text-slate-400">
                  Saisissez le code de vérification à 6 chiffres envoyé pour <strong className="text-slate-200">{twoFactorInfo.email}</strong>.
                </p>
              </div>

              {twoFactorInfo.otpPreview && (
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3 text-center">
                  <p className="text-[11px] font-semibold text-blue-400">Code de test (Démo / Dev) :</p>
                  <p className="text-2xl font-black text-white tracking-widest mt-0.5">{twoFactorInfo.otpPreview}</p>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 text-center">Code OTP (6 chiffres)</label>
                <input 
                  type="text" 
                  maxLength={6}
                  required
                  autoFocus
                  placeholder="123456"
                  className="w-full bg-slate-800/50 border-2 border-slate-700/50 rounded-2xl py-4 text-center text-2xl font-black tracking-widest text-white outline-none focus:border-brand-blue/50 focus:ring-4 focus:ring-brand-blue/10 transition-all"
                  value={otpCode}
                  onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))}
                />
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex gap-3 items-center text-red-400">
                  <AlertCircle size={18} className="shrink-0" />
                  <p className="text-xs font-bold">{error}</p>
                </div>
              )}

              <button 
                type="submit" 
                disabled={loading || otpCode.length !== 6}
                className="w-full bg-gradient-to-r from-brand-blue to-blue-600 hover:from-blue-500 hover:to-blue-700 text-white font-black py-4 rounded-2xl shadow-lg shadow-blue-500/20 flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <>
                    Vérifier le code
                    <ChevronRight size={20} className={currentLang === 'ar' ? 'rotate-180' : ''} />
                  </>
                )}
              </button>

              <div className="flex justify-between items-center pt-2">
                <button
                  type="button"
                  onClick={() => { setStep('login'); setError(''); setOtpCode(''); }}
                  className="text-xs font-bold text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
                >
                  <ArrowLeft size={14} /> Retour
                </button>

                <button
                  type="button"
                  disabled={resending}
                  onClick={handleResend2FA}
                  className="text-xs font-bold text-brand-blue hover:text-white flex items-center gap-1 transition-colors disabled:opacity-50"
                >
                  {resending ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                  Renvoyer le code
                </button>
              </div>
            </form>
          )}
        </Card>

        <p className="text-center mt-8 text-slate-500 text-sm">
          NoRegis v1.0.0 &bull; {t.secured_by} <span className="text-slate-300 font-bold">{t.e2e}</span>
        </p>
      </div>
    </div>
  );
}


