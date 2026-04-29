import { useState } from 'react';
import { Shield, Lock, User, Loader2, ChevronRight, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useApp } from '../context/useAppState';
import { Card } from '../components/UI';
import { authService } from '../services/authService';
import { TRANSLATIONS } from '../translations';

export function Login() {
  const { state, dispatch, notify } = useApp();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const currentLang = state.settings?.language || 'fr';
  const t = TRANSLATIONS[currentLang];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await authService.login(formData);
      
      dispatch({ 
        type: 'LOGIN', 
        payload: { 
          prenom: data.user?.prenom || 'Admin', 
          nom: data.user?.nom || 'User', 
          role: data.user?.role || 'Agent', 
          matricule: data.user?.matricule || 'AGN-001',
          initials: (data.user?.prenom?.[0] || 'A') + (data.user?.nom?.[0] || 'U')
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
            <Shield size={40} className="text-white group-hover:rotate-12 transition-transform" />
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight mb-2">NoRegis</h1>
          <p className="text-slate-400 font-medium">{t.visitor_management}</p>
        </div>

        <Card className="!bg-slate-900/50 !backdrop-blur-xl !border-white/10 !p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
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
        </Card>

        <p className="text-center mt-8 text-slate-500 text-sm">
          NoRegis v1.0.0 &bull; {t.secured_by} <span className="text-slate-300 font-bold">{t.e2e}</span>
        </p>
      </div>
    </div>
  );
}

