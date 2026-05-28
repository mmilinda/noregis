import { useState } from 'react';
import { Shield, Lock, Mail, Loader2, ChevronRight, AlertCircle, Eye, EyeOff, CreditCard } from 'lucide-react';
import { useApp } from '../context/useAppState';
import { authService } from '../services/authService';
import { TRANSLATIONS } from '../translations';

export function Login() {
  const { state, dispatch, notify } = useApp();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

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

  // Content helper based on language
  const getContent = () => {
    switch (currentLang) {
      case 'en':
        return {
          title: "Log in to your account",
          subtitle: "Please enter your details",
          remember: "Remember for 30 days",
          forgot: "Forgot password",
          smartcard: "Log in with SmartCard",
          terms: "By creating an account, you agree to our Terms of Use",
          slogan: "Empowering secure communities",
          description: "Simplify and automate visitor tracking, gate logs, and credential verifications."
        };
      case 'ar':
        return {
          title: "تسجيل الدخول إلى حسابك",
          subtitle: "الرجاء إدخال التفاصيل الخاصة بك",
          remember: "تذكرني لمدة 30 يومًا",
          forgot: "نسيت كلمة المرور",
          smartcard: "تسجيل الدخول باستخدام SmartCard",
          terms: "بإنشاء حساب، فإنك توافق على شروط الاستخدام الخاصة بنا",
          slogan: "تمكين مجتمعات أكثر أمانًا",
          description: "تبسيط وأتمتة تتبع الزوار وسجلات البوابات والتحقق من الهويات."
        };
      default:
        return {
          title: "Connexion à votre compte",
          subtitle: "Veuillez entrer vos informations",
          remember: "Se souvenir de moi pendant 30 jours",
          forgot: "Mot de passe oublié ?",
          smartcard: "Connexion avec SmartCard",
          terms: "En créant un compte, vous acceptez nos Conditions d'Utilisation",
          slogan: "Sécuriser et simplifier vos accès",
          description: "Simplifiez et automatisez le suivi des visiteurs, les registres d'accès et la vérification des pièces."
        };
    }
  };

  const content = getContent();
  const isRtl = currentLang === 'ar';

  return (
    <div className="min-h-screen w-full flex bg-[#F8F9FC] dark:bg-[#0D1117] overflow-hidden font-sans" dir={isRtl ? 'rtl' : 'ltr'}>

      {/* LEFT SIDE: Login Form */}
      <div className="w-full lg:w-[45%] flex flex-col justify-between p-8 md:p-16 bg-white dark:bg-[#161B22] relative z-10 shadow-2xl">

        {/* Top: Logo & Language Selector */}
        <div className="flex items-center justify-between w-full">
          {/* Logo brand like Vesper */}
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-blue-bright to-blue-600 flex items-center justify-center shadow-md">
              <Shield size={18} className="text-white fill-white/20" />
            </div>
            <span className="text-xl font-bold text-slate-800 dark:text-white tracking-tight">NoRegis</span>
          </div>

          {/* Language selector */}

        </div>

        {/* Center: Form Container */}
        <div className="w-full max-w-sm mx-auto my-12">
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white tracking-tight mb-2">
              {content.title}
            </h1>
            <p className="text-sm text-slate-400 dark:text-slate-500 font-medium">
              {content.subtitle}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email field */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">{t.email}</label>
              <div className="relative group">
                <div className={`absolute ${isRtl ? 'right-3.5' : 'left-3.5'} top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-brand-blue-bright`}>
                  <Mail size={16} />
                </div>
                <input
                  type="email"
                  required
                  placeholder={t.email_placeholder}
                  className={`w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg py-3 ${isRtl ? 'pr-10 pl-4 text-right' : 'pl-10 pr-4'} text-sm text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-brand-blue-bright/60 focus:bg-white transition-all`}
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            {/* Password field */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">{t.password}</label>
              <div className="relative group">
                <div className={`absolute ${isRtl ? 'right-3.5' : 'left-3.5'} top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-brand-blue-bright`}>
                  <Lock size={16} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  className={`w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg py-3 ${isRtl ? 'pr-10 pl-10 text-right' : 'pl-10 pr-10'} text-sm text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-brand-blue-bright/60 focus:bg-white transition-all`}
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute ${isRtl ? 'left-3.5' : 'right-3.5'} top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors`}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Remember me & Forgot Password */}
            <div className="flex items-center justify-between text-xs font-semibold py-1">
              <label className="flex items-center gap-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-brand-blue-bright focus:ring-brand-blue-bright/20 cursor-pointer accent-brand-blue-bright"
                />
                {content.remember}
              </label>
              <button
                type="button"
                className="text-brand-blue-bright hover:underline"
              >
                {content.forgot}
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/30 rounded-lg p-3.5 flex gap-2.5 items-center text-red-600 dark:text-red-400">
                <AlertCircle size={16} className="shrink-0" />
                <p className="text-xs font-semibold leading-normal">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-brand-blue-bright to-blue-600 hover:shadow-lg hover:shadow-blue-500/20 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
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
            <div className="relative my-6 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-100 dark:border-slate-800"></div>
              </div>
              <span className="relative px-3 bg-white dark:bg-[#161B22] text-[10px] font-bold text-slate-400 uppercase tracking-widest">OR</span>
            </div>

            {/* SmartCard Button */}
            <button
              type="button"
              className="w-full border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 font-bold py-3 rounded-lg flex items-center justify-center gap-2.5 transition-all text-sm shadow-sm"
            >
              <CreditCard size={18} className="text-slate-400" />
              {content.smartcard}
            </button>
          </form>
        </div>

        {/* Bottom disclaimer */}
        <p className="text-center text-xs text-slate-400 dark:text-slate-500 leading-normal">
          {content.terms}
        </p>
      </div>

      {/* RIGHT SIDE: Gorgeous Blue Card & Mockup Dashboard Tablet */}
      <div className="hidden lg:flex w-[55%] bg-gradient-to-br from-blue-600 to-indigo-800 relative overflow-hidden p-16 flex-col justify-between">

        {/* Background decorative glowing circles */}
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-500/30 rounded-full blur-3xl pointer-events-none" />

        {/* Top: Logo / Slogan Header */}


        {/* Middle Header Message */}
        <div className="my-auto max-w-md relative z-10">
          <h3 className="text-3xl font-bold text-white tracking-tight mb-4 leading-tight">
            {content.slogan}
          </h3>
          <p className="text-sm text-white/70 font-medium leading-relaxed">
            {content.description}
          </p>
        </div>

        {/* Bottom Mockup Dashboard Tablet - slanted to match screenshot exactly */}
        <div
          className="absolute -right-20 -bottom-24 w-[540px] h-[360px] bg-slate-900 border-8 border-slate-900 rounded-[2rem] overflow-hidden shadow-2xl transition-all duration-700 ease-out z-10"
          style={{
            transform: 'perspective(1000px) rotateY(-15deg) rotateX(8deg) rotateZ(-3deg)',
            boxShadow: '0 30px 60px -15px rgba(0,0,0,0.5)'
          }}
        >
          {/* Mockup Screen Content */}
          <div className="w-full h-full bg-[#F8F9FC] dark:bg-[#0D1117] flex text-slate-800 dark:text-slate-200">
            {/* Mock Sidebar */}
            <div className="w-[140px] bg-white border-r border-slate-100 flex flex-col justify-between p-3.5 shrink-0">
              <div className="space-y-4">
                <div className="flex items-center gap-1.5 pb-2 border-b border-slate-100">
                  <div className="w-5 h-5 rounded-md bg-blue-500 flex items-center justify-center text-[10px] text-white">V</div>
                  <span className="text-[10px] font-bold tracking-tight">NoRegis</span>
                </div>
                <div className="space-y-1">
                  <div className="px-2 py-1.5 rounded-md bg-blue-50 text-blue-600 text-[9px] font-bold flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div> Dashboard
                  </div>
                  <div className="px-2 py-1.5 text-slate-400 text-[9px] font-semibold flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-transparent"></div> Historique
                  </div>
                  <div className="px-2 py-1.5 text-slate-400 text-[9px] font-semibold flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-transparent"></div> Paramètres
                  </div>
                </div>
              </div>
              <div className="text-[8px] text-slate-400 font-bold">NoRegis v1.0.0</div>
            </div>

            {/* Mock Dashboard Area */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Mock Topbar */}
              <div className="h-10 bg-white border-b border-slate-100 flex items-center justify-between px-4 shrink-0">
                <span className="text-[10px] font-bold">Supervision</span>
                <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[9px] font-bold">U</div>
              </div>

              {/* Mock Body */}
              <div className="flex-1 p-4 space-y-3 overflow-hidden">
                {/* Mock stats cards */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-white border border-slate-100 rounded-lg p-2 flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-md bg-blue-50 text-blue-500 flex items-center justify-center text-[9px] font-bold">24</div>
                    <div className="leading-tight"><p className="text-[6px] text-slate-400 font-bold uppercase">Total</p></div>
                  </div>
                  <div className="bg-white border border-slate-100 rounded-lg p-2 flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-md bg-emerald-50 text-emerald-500 flex items-center justify-center text-[9px] font-bold">8</div>
                    <div className="leading-tight"><p className="text-[6px] text-slate-400 font-bold uppercase">Présents</p></div>
                  </div>
                  <div className="bg-white border border-slate-100 rounded-lg p-2 flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-md bg-amber-50 text-amber-500 flex items-center justify-center text-[9px] font-bold">3</div>
                    <div className="leading-tight"><p className="text-[6px] text-slate-400 font-bold uppercase">Véhicules</p></div>
                  </div>
                </div>

                {/* Mock table card */}
                <div className="bg-white border border-slate-100 rounded-lg flex-1 flex flex-col overflow-hidden">
                  <div className="p-2 border-b border-slate-100 flex items-center justify-between">
                    <span className="text-[8px] font-bold text-slate-700">Registre Visites</span>
                  </div>
                  <div className="p-1 space-y-1">
                    <div className="flex items-center justify-between text-[7px] text-slate-400 border-b border-slate-50 pb-1 px-1">
                      <span>NOM / PRÉNOM</span>
                      <span>DESTINATION</span>
                      <span>STATUT</span>
                    </div>
                    <div className="flex items-center justify-between text-[7px] py-1 px-1 hover:bg-slate-50 rounded">
                      <div className="flex items-center gap-1">
                        <div className="w-3.5 h-3.5 rounded-full bg-blue-500 text-white flex items-center justify-center text-[5px]">SM</div>
                        <span className="font-bold">Shahid Miah</span>
                      </div>
                      <span className="text-slate-500">Drawstack</span>
                      <span className="px-1 py-0.2 bg-emerald-50 text-emerald-600 rounded">Présent</span>
                    </div>
                    <div className="flex items-center justify-between text-[7px] py-1 px-1 hover:bg-slate-50 rounded">
                      <div className="flex items-center gap-1">
                        <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[5px]">NM</div>
                        <span className="font-bold">Noor Mohammad</span>
                      </div>
                      <span className="text-slate-500">Drawstack</span>
                      <span className="px-1 py-0.2 bg-emerald-50 text-emerald-600 rounded">Présent</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
