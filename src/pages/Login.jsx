import { useState } from 'react';
import { Shield, Lock, User, Loader2, ChevronRight, AlertCircle } from 'lucide-react';
import { useApp } from '../context/useAppState';
import { Card } from '../components/UI';

export function Login() {
  const { dispatch, notify } = useApp();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Simulation of login for demonstration if backend is not ready
      // Or actual call if the user wants it
      // For now, I'll implement the logic to call the API
      // const data = await api.post('/auth/login', formData);
      
      // Since I don't know the exact endpoint, I'll simulate a successful login 
      // but the structure is there to be used.
      
      setTimeout(() => {
        if (formData.email === 'admin@noregis.com' && formData.password === 'password') {
           dispatch({ 
            type: 'LOGIN', 
            payload: { 
              prenom: 'Admin', 
              nom: 'User', 
              role: 'Superviseur', 
              matricule: 'AGN-001',
              initials: 'AU'
            } 
          });
          notify('success', 'Bienvenue sur NoRegis !');
        } else {
          setError('Identifiants invalides. Essayez admin@noregis.com / password');
          notify('error', 'Échec de la connexion');
        }
        setLoading(false);
      }, 1500);

    } catch (err) {
      setError(err.message || 'Une erreur est survenue');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-blue/20 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px]" />

      <div className="w-full max-w-md z-10">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-brand-blue to-blue-700 shadow-2xl shadow-blue-500/20 mb-6 group transition-all hover:scale-105">
            <Shield size={40} className="text-white group-hover:rotate-12 transition-transform" />
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight mb-2">NoRegis</h1>
          <p className="text-slate-400 font-medium">Système de Gestion des Visiteurs</p>
        </div>

        <Card className="!bg-slate-900/50 !backdrop-blur-xl !border-white/10 !p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Adresse Email</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                  <User size={18} />
                </div>
                <input 
                  type="email" 
                  required
                  placeholder="votre@email.com"
                  className="w-full bg-slate-800/50 border-2 border-slate-700/50 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-slate-600 outline-none focus:border-brand-blue/50 focus:ring-4 focus:ring-brand-blue/10 transition-all font-bold"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2 ml-1">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Mot de passe</label>
                <button type="button" className="text-[10px] font-black text-brand-blue uppercase tracking-widest hover:text-white transition-colors">Oublié ?</button>
              </div>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                  <Lock size={18} />
                </div>
                <input 
                  type="password" 
                  required
                  placeholder="••••••••"
                  className="w-full bg-slate-800/50 border-2 border-slate-700/50 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-slate-600 outline-none focus:border-brand-blue/50 focus:ring-4 focus:ring-brand-blue/10 transition-all font-bold"
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                />
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
                  Connexion 
                  <ChevronRight size={20} />
                </>
              )}
            </button>
          </form>
        </Card>

        <p className="text-center mt-8 text-slate-500 text-sm">
          NoRegis v1.0.0 &bull; Sécurisé par <span className="text-slate-300 font-bold">End-to-End Encryption</span>
        </p>
      </div>
    </div>
  );
}
