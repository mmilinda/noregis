import { useEffect } from 'react';
import { 
  X, CheckCircle2, AlertCircle, Info, AlertTriangle, 
  ChevronRight, Loader2, User, Car
} from 'lucide-react';
import { useApp } from '../context/AppContext';

/* ============================================
   TOAST NOTIFICATION
============================================ */
export function Toast() {
  const { state, dispatch } = useApp();
  const { notification } = state;

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        dispatch({ type: 'CLEAR_NOTIFICATION' });
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [notification, dispatch]);

  if (!notification) return null;

  const styles = {
    success: 'bg-brand-green-light border-brand-green-bright text-brand-green',
    error: 'bg-brand-red-light border-brand-red-bright text-brand-red',
    info: 'bg-brand-blue-light border-brand-blue-bright text-brand-blue',
    warning: 'bg-brand-amber-light border-brand-amber-bright text-brand-amber',
  };

  const icons = {
    success: <CheckCircle2 size={18} />,
    error: <AlertCircle size={18} />,
    info: <Info size={18} />,
    warning: <AlertTriangle size={18} />,
  };

  return (
    <div className="fixed top-6 right-6 left-6 md:left-auto md:w-80 z-[9999] animate-in fade-in slide-in-from-top-4 duration-300">
      <div className={`flex items-center gap-3 p-4 rounded-lg border border-slate-200 dark:border-slate-800 ${styles[notification.type] || styles.info}`}>
        <div className="shrink-0">{icons[notification.type]}</div>
        <p className="text-sm font-bold flex-1 leading-tight">{notification.message}</p>
        <button onClick={() => dispatch({ type: 'CLEAR_NOTIFICATION' })} className="opacity-60 hover:opacity-100 transition-opacity">
          <X size={16} />
        </button>
      </div>
    </div>
  );
}

/* ============================================
   BUTTON COMPONENT
============================================ */
export function Btn({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  icon: Icon, 
  onClick, 
  disabled, 
  fullWidth,
  type = 'button',
  loading,
  className = ""
}) {
  const variants = {
    primary: 'bg-brand-blue-bright text-white hover:bg-blue-600',
    secondary: 'bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 dark:hover:bg-slate-700',
    success: 'bg-brand-green-bright text-white border border-brand-green-bright hover:bg-emerald-600',
    danger: 'bg-brand-red-bright text-white hover:bg-red-600',
    warning: 'bg-brand-amber-bright text-white hover:bg-amber-600',
    ghost: 'bg-transparent text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800',
  };

  const sizes = {
    sm: 'px-2 py-1 text-[10px] rounded-md gap-1',
    md: 'px-4 py-2 text-xs rounded-lg gap-1.5',
    lg: 'px-5 py-2.5 text-sm rounded-lg gap-2',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center font-bold transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 disabled:cursor-not-allowed
        ${variants[variant]} 
        ${sizes[size]} 
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
    >
      {loading ? <Loader2 size={18} className="animate-spin" /> : Icon && <Icon size={size === 'sm' ? 14 : 18} />}
      {children}
    </button>
  );
}

/* ============================================
   CARD COMPONENTS
============================================ */
export function Card({ children, className = "" }) {
  return (
    <div className={`bg-white dark:bg-[#161B22] border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden ${className}`}>
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, actions, icon: Icon }) {
  return (
    <div className="flex items-center justify-between p-4 border-b border-slate-50 dark:border-slate-800">
      <div className="flex items-center gap-2.5">
        {Icon && (
          <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-brand-blue flex items-center justify-center">
            <Icon size={16} />
          </div>
        )}
        <div>
          <h3 className="text-xs font-black text-slate-900 dark:text-white leading-none">{title}</h3>
          {subtitle && <p className="text-[10px] text-slate-500 mt-1">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex gap-1.5">{actions}</div>}
    </div>
  );
}

/* ============================================
   FORM COMPONENTS
============================================ */
export function FormInput({ label, id, error, icon: Icon, required, ...props }) {
  return (
    <div className="flex flex-col gap-1 w-full">
      {label && (
        <label htmlFor={id} className="text-[10px] font-extrabold text-slate-400 dark:text-slate-300 uppercase tracking-wider ml-1">
          {label} {required && <span className="text-brand-red">*</span>}
        </label>
      )}
      <div className="relative group">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-blue-bright transition-colors">
            <Icon size={14} />
          </div>
        )}
        <input
          id={id}
          className={`
            w-full bg-slate-50 dark:bg-slate-900 border-2 rounded-lg py-2 px-3.5 text-xs font-black outline-none transition-all
            ${Icon ? 'pl-9' : ''}
            ${error ? 'border-brand-red bg-red-50 dark:bg-red-900/10' : 'border-slate-200 dark:border-slate-800 focus:border-brand-blue-bright focus:bg-white dark:focus:bg-slate-800'}
            text-slate-900 dark:text-slate-100 placeholder:text-slate-400 placeholder:font-normal
          `}
          {...props}
        />
      </div>
      {error && <p className="text-[9px] font-bold text-brand-red ml-1">{error}</p>}
    </div>
  );
}

export function FormSelect({ label, id, options = [], error, icon: Icon, required, ...props }) {
  return (
    <div className="flex flex-col gap-1 w-full">
      {label && (
        <label htmlFor={id} className="text-[10px] font-extrabold text-slate-400 dark:text-slate-300 uppercase tracking-wider ml-1">
          {label} {required && <span className="text-brand-red">*</span>}
        </label>
      )}
      <div className="relative group">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-blue-bright transition-colors z-10">
            <Icon size={14} />
          </div>
        )}
        <select
          id={id}
          className={`
            w-full bg-white dark:bg-slate-900 border-2 rounded-lg py-2 px-3.5 pr-9 text-xs font-black outline-none transition-all appearance-none cursor-pointer
            ${Icon ? 'pl-9' : ''}
            ${error ? 'border-brand-red bg-red-50 dark:bg-red-900/10' : 'border-slate-300 dark:border-slate-700 focus:border-brand-blue-bright'}
            text-black dark:text-white
          `}
          {...props}
        >
          {props.placeholder && (
            <option key="placeholder" value="" disabled className="text-gray-500 bg-white dark:bg-slate-900">
              {props.placeholder}
            </option>
          )}
          {options.map((opt, i) => {
            const value = typeof opt === 'object' ? opt.value : opt;
            const label = typeof opt === 'object' ? opt.label : opt;
            return (
              <option key={value || i} value={value} className="text-black dark:text-white bg-white dark:bg-slate-900">
                {label}
              </option>
            );
          })}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
          <ChevronRight size={14} className="rotate-90" />
        </div>
      </div>
      {error && <p className="text-[9px] font-bold text-brand-red ml-1">{error}</p>}
    </div>
  );
}

/* ============================================
   BADGES
============================================ */
export function StatusBadge({ statut }) {
  const isPresent = statut === 'present';
  return (
    <span className={`
      inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest
      ${isPresent ? 'bg-brand-green-light text-brand-green' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}
    `}>
      <span className={`w-1.5 h-1.5 rounded-full ${isPresent ? 'bg-brand-green animate-pulse' : 'bg-slate-400'}`} />
      {isPresent ? 'Présent' : 'Sorti'}
    </span>
  );
}

export function TypeBadge({ type }) {
  const isVehicule = type === 'vehicule';
  const Icon = isVehicule ? Car : User;
  return (
    <span className={`
      inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest
      ${isVehicule ? 'bg-brand-blue-light text-brand-blue' : 'bg-brand-amber-light text-brand-amber'}
    `}>
      <Icon size={12} strokeWidth={3} />
      {isVehicule ? 'Véhicule' : 'Visiteur'}
    </span>
  );
}

/* ============================================
   STAT CARD
============================================ */
export function StatCard({ label, value, icon: Icon, color, bg }) {
  return (
    <Card className="p-4 flex items-center gap-3 border-slate-200 dark:border-slate-800">
      <div 
        className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
        style={{ backgroundColor: bg, color: color }}
      >
        <Icon size={20} />
      </div>
      <div>
        <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">{label}</p>
        <p className="text-xl font-black text-slate-900 dark:text-white mt-0.5">{value}</p>
      </div>
    </Card>
  );
}

/* ============================================
   TOGGLE
============================================ */
export function Toggle({ active, onChange }) {
  return (
    <button
      onClick={() => onChange(!active)}
      className={`
        relative w-11 h-6 rounded-full transition-colors duration-200 outline-none
        ${active ? 'bg-brand-blue-bright' : 'bg-slate-300 dark:bg-slate-700'}
      `}
    >
      <span className={`
        absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform duration-200
        ${active ? 'translate-x-5' : 'translate-x-0'}
      `} />
    </button>
  );
}

/* ============================================
   MODAL
============================================ */
export function Modal({ isOpen, onClose, title, children, size = 'md' }) {
  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    full: 'max-w-full m-4',
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose} />
      <div className={`
        relative w-full ${sizes[size]} bg-white dark:bg-[#161B22] rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[95vh] overflow-hidden
        animate-in zoom-in-95 fade-in duration-300
      `}>
        <div className="flex items-center justify-between p-5 pb-3 border-b border-slate-50 dark:border-slate-800">
          <h2 className="text-lg font-black text-slate-900 dark:text-white">{title}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors">
            <X size={18} className="text-slate-400" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 scroll-smooth">
          {children}
        </div>
      </div>
    </div>
  );
}

/* ============================================
   EMPTY STATE
============================================ */
export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-20 h-20 rounded-[2rem] bg-slate-50 dark:bg-slate-900 text-slate-300 dark:text-slate-700 flex items-center justify-center mb-6">
        <Icon size={40} />
      </div>
      <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">{title}</h3>
      <p className="text-sm text-slate-500 max-w-xs mb-8">{description}</p>
      {action && action}
    </div>
  );
}
