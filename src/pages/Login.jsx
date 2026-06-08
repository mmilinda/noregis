import { useState } from 'react';
import { Lock, Mail, Loader2, ChevronRight, AlertCircle, Eye, EyeOff } from 'lucide-react';
import logoImage from './1BE8AC5E-D98A-4C48-8E38-C498F5486981-removebg-preview.png';
import { useApp } from '../context/useAppState';
import { authService } from '../services/authService';
import { TRANSLATIONS } from '../translations';

export function Login() {
  const { state, dispatch, notify } = useApp();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

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
          user: data.user,
          prenom: data.user?.prenom || 'Admin',
          nom: data.user?.nom || 'User',
          role: data.user?.role || 'Agent',
          matricule: data.user?.matricule || 'AGN-001',
          initials: (data.user?.prenom?.[0] || 'A') + (data.user?.nom?.[0] || 'U')
        }
      });
      // Notification de succès supprimée
      // notify('success', t.welcome);
    } catch (err) {
      setError(err.message || t.login_error);
      // Notification d'erreur supprimée
      // notify('error', t.login_failed);
    } finally {
      setLoading(false);
    }
  };

  const getContent = () => {
    switch (currentLang) {
      case 'en':
        return {
          title: "Login",
          forgot: "Forgot password",
          google: "Sign in with Google",
          terms: "By creating an account, you agree to our Terms of Use",
        };
      case 'ar':
        return {
          title: "تسجيل الدخول",
          forgot: "نسيت كلمة المرور",
          google: "تسجيل الدخول باستخدام Google",
          terms: "بإنشاء حساب، فإنك توافق على شروط الاستخدام الخاصة بنا",
        };
      default:
        return {
          title: "Connexion",
          forgot: "Mot de passe oublié ?",
          google: "Se connecter avec Google",
          terms: "En créant un compte, vous acceptez nos Conditions d'Utilisation",
        };
    }
  };

  const content = getContent();
  const isRtl = currentLang === 'ar';

  return (
    <div className="min-h-screen bg-[#0d1b2a] flex flex-col items-center justify-center p-6 font-sans relative overflow-hidden" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="absolute inset-0 bg-radial-gradient from-[#1b263b] to-transparent opacity-50 pointer-events-none"></div>

      {/* Logo agrandi, sans fond bleu */}
    

      {/* Login Card */}
      <div className="w-full max-w-lg bg-[#16213e]/80 backdrop-blur-md border border-white/10 rounded-3xl p-8 shadow-2xl z-10">
        <h2 className="text-white text-3xl font-semibold text-center mb-8">{content.title}</h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email Field */}
          <div className="space-y-2">
            <label className="text-white/60 text-sm font-medium ml-1">{t.email}</label>
            <div className="relative">
              <div className={`absolute ${isRtl ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-white/40 transition-all duration-200 ${
                focusedField === 'email' ? 'text-[#9BA6E8]' : ''
              }`}>
                <Mail size={18} />
              </div>
              <input
                type="email"
                required
                placeholder={t.email_placeholder}
                className={`block w-full bg-[#1b263b] border rounded-2xl py-2.5 ${isRtl ? 'pr-4 pl-12 text-right' : 'pl-12 pr-4'} text-white placeholder-white/20 focus:outline-none transition-all duration-200 ${
                  focusedField === 'email'
                    ? 'border-[#9BA6E8] ring-2 ring-[#9BA6E8]/30 shadow-[0_0_12px_rgba(155,166,232,0.2)]'
                    : 'border-white/10 hover:border-white/30'
                } [&:-webkit-autofill]:bg-[#1b263b] [&:-webkit-autofill]:text-white [&:-webkit-autofill]:shadow-[inset_0_0_0_1000px_#1b263b]`}
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <label className="text-white/60 text-sm font-medium ml-1">{t.password}</label>
            <div className="relative">
              <div className={`absolute ${isRtl ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-white/40 transition-all duration-200 ${
                focusedField === 'password' ? 'text-[#9BA6E8]' : ''
              }`}>
                <Lock size={18} />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="••••••••"
                className={`block w-full bg-[#1b263b] border rounded-2xl py-2.5 ${isRtl ? 'pr-12 pl-12 text-right' : 'pl-12 pr-12'} text-white placeholder-white/20 focus:outline-none transition-all duration-200 ${
                  focusedField === 'password'
                    ? 'border-[#9BA6E8] ring-2 ring-[#9BA6E8]/30 shadow-[0_0_12px_rgba(155,166,232,0.2)]'
                    : 'border-white/10 hover:border-white/30'
                } [&:-webkit-autofill]:bg-[#1b263b] [&:-webkit-autofill]:text-white [&:-webkit-autofill]:shadow-[inset_0_0_0_1000px_#1b263b]`}
                value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={`absolute ${isRtl ? 'left-4' : 'right-4'} top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors`}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Forgot Password */}
          <div className="flex justify-end text-sm">
            <button type="button" className="text-white/60 hover:text-[#9BA6E8] transition-colors text-sm">
              {content.forgot}
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-3 flex gap-2 items-center text-red-300">
              <AlertCircle size={16} className="shrink-0" />
              <p className="text-xs font-semibold leading-normal">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-[#9BA6E8] to-[#7B86C8] text-[#0d1b2a] font-bold py-3 rounded-2xl shadow-[0_0_20px_rgba(155,166,232,0.3)] hover:shadow-[0_0_25px_rgba(155,166,232,0.5)] hover:from-[#8B96D8] hover:to-[#6B76B8] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <>
                {t.login_btn}
                <ChevronRight size={16} className={isRtl ? 'rotate-180' : ''} />
              </>
            )}
          </button>

          {/* Divider */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-transparent text-white/20 uppercase tracking-widest text-xs">OR</span>
            </div>
          </div>

          {/* Google Button */}
          <button
            type="button"
            className="w-full border border-white/20 hover:bg-white/5 text-white/80 font-bold py-3 rounded-2xl flex items-center justify-center gap-3 transition-all text-sm hover:border-white/40"
          >
            <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center text-xs font-bold text-[#4285F4]">
              G
            </div>
            {content.google}
          </button>
        </form>

        {/* Terms (vide) */}
        <div className="text-center text-white/40 text-xs mt-8">
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-12 text-white/30 text-xs flex flex-wrap justify-center gap-6 z-10">
        <span>© 2024 NoRegis, Inc. All rights reserved.</span>
        <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
        <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
        <a href="#" className="hover:text-white transition-colors">Security</a>
      </footer>
    </div>
  );
}