import { Shield } from 'lucide-react';

export function AppLogo({ compact = false, className = '', logoSrc, textClass = 'text-slate-900 dark:text-white', subTextClass = 'text-[10px] font-bold text-slate-400 uppercase tracking-widest' }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-blue-bright to-blue-600 flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/20 overflow-hidden">
        {logoSrc ? (
          <img src={logoSrc} alt="NoRegis" className="w-full h-full object-cover" />
        ) : (
          <Shield size={22} className="text-white fill-white/20" />
        )}
      </div>
      <div className={`flex flex-col ${compact ? 'gap-0' : 'gap-1'}`}>
        <p className={`text-lg font-black tracking-tight ${textClass}`}>NoRegis</p>
        {!compact && (
          <p className={subTextClass}>Registre Digital</p>
        )}
      </div>
    </div>
  );
}
