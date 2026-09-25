import React, { useState } from 'react';
import { Key, Lock, RefreshCw, Copy, Check, AlertTriangle, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { Modal, Btn, FormInput } from './UI';
import { authService } from '../services/authService';

export function ResetPasswordModal({ isOpen, onClose, user, notify }) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successInfo, setSuccessInfo] = useState(null);
  const [copied, setCopied] = useState(false);

  if (!user) return null;

  const handleGenerateRandom = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$';
    let randPass = 'Pass';
    for (let i = 0; i < 6; i++) {
      randPass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    randPass += '!';
    setPassword(randPass);
    setError('');
  };

  const handleReset = async (e) => {
    e.preventDefault();
    if (!password || password.trim().length < 4) {
      setError('Le mot de passe doit comporter au moins 4 caractères.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const targetId = user.id || user._id;
      await authService.resetPassword(targetId, password.trim());
      setSuccessInfo({
        email: user.email,
        name: `${user.prenom || ''} ${user.nom || ''}`.trim(),
        role: user.role,
        newPassword: password.trim(),
      });
      if (notify) notify('success', `Mot de passe réinitialisé pour ${user.prenom} ${user.nom}.`);
    } catch (err) {
      setError(err.message || 'Erreur lors de la réinitialisation du mot de passe.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCredentials = async () => {
    if (!successInfo) return;
    const text = `Identifiants NoRegis:\nEmail: ${successInfo.email}\nMot de passe: ${successInfo.newPassword}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      if (notify) notify('success', 'Identifiants copiés dans le presse-papiers !');
      setTimeout(() => setCopied(false), 3000);
    } catch {
      if (notify) notify('error', 'Impossible de copier les identifiants.');
    }
  };

  const handleClose = () => {
    setPassword('');
    setError('');
    setSuccessInfo(null);
    setCopied(false);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={`Réinitialiser le mot de passe — ${user.prenom || ''} ${user.nom || ''}`} size="md">
      {successInfo ? (
        <div className="space-y-5 animate-in fade-in zoom-in-95 duration-300">
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center gap-3 text-emerald-600">
            <CheckCircle2 size={24} className="shrink-0" />
            <div>
              <p className="font-black text-sm">Mot de passe réinitialisé avec succès !</p>
              <p className="text-xs opacity-90 mt-0.5">Le nouveau mot de passe est actif immédiatement pour {successInfo.name}.</p>
            </div>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3 font-mono text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-400 font-sans font-bold">Email de connexion :</span>
              <span className="font-bold text-slate-900 dark:text-white">{successInfo.email}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400 font-sans font-bold">Nouveau Mot de Passe :</span>
              <span className="font-bold text-brand-blue-bright bg-brand-blue-bright/10 px-2 py-1 rounded">{successInfo.newPassword}</span>
            </div>
          </div>

          <div className="flex gap-3">
            <Btn variant="primary" icon={copied ? Check : Copy} onClick={handleCopyCredentials} fullWidth>
              {copied ? 'Identifiants Copiés !' : 'Copier les Identifiants'}
            </Btn>
            <Btn variant="secondary" onClick={handleClose}>
              Fermer
            </Btn>
          </div>
        </div>
      ) : (
        <form onSubmit={handleReset} className="space-y-4">
          <p className="text-xs text-slate-500 font-bold bg-slate-50 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
            Vous pouvez saisir un nouveau mot de passe personnalisé ou utiliser le générateur automatique pour réinitialiser le compte de <strong>{user.prenom} {user.nom}</strong> ({user.email}).
          </p>

          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-600 rounded-xl text-xs font-bold flex items-center gap-2">
              <AlertTriangle size={16} />
              <span>{error}</span>
            </div>
          )}

          <div className="relative">
            <FormInput
              label="Nouveau Mot de Passe *"
              id="new_password"
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={e => { setPassword(e.target.value); setError(''); }}
              icon={Lock}
              placeholder="Saisissez ou générez un mot de passe..."
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-[34px] text-slate-400 hover:text-slate-600"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          <button
            type="button"
            onClick={handleGenerateRandom}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-brand-blue-bright/10 text-brand-blue-bright hover:bg-brand-blue-bright/20 rounded-xl text-xs font-black transition-colors"
          >
            <RefreshCw size={14} />
            Générer un Mot de Passe Temporaire Sécurisé
          </button>

          <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Btn variant="secondary" onClick={handleClose} fullWidth type="button">
              Annuler
            </Btn>
            <Btn variant="success" type="submit" loading={loading} icon={Key} fullWidth>
              Valider & Réinitialiser
            </Btn>
          </div>
        </form>
      )}
    </Modal>
  );
}
