import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Shield, Camera, QrCode, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';
import { Btn, Card } from '../components/UI';
import { ScanPanel } from '../components/ScanPanel';
import { useApp } from '../context/useAppState';
import { TRANSLATIONS } from '../translations';
import api from '../services/api';

export function PublicScan() {
  const { agentId } = useParams();
  const navigate = useNavigate();
  const { state, notify } = useApp();
  const t = TRANSLATIONS[state.settings?.language || 'fr'];

  const [scanResult, setScanResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleDataExtracted = async (data, image) => {
    if (!agentId) {
      setError('QR invalide. Impossible de détecter la porte.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await api.post('/api/public-scan', {
        agentId,
        scanData: data,
        image,
        source: 'public_qr',
      });
      setScanResult(response);
      notify('success', response.message || 'Entrée enregistrée. Le gardien est notifié.');
    } catch (err) {
      const message = err.message || 'Impossible de valider le scan.';
      setError(message);
      notify('error', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-slate-500 dark:text-slate-400 mb-2">Badge d'entrée</p>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight">Scan de documents</h1>
            <p className="max-w-2xl mt-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Scannez vos documents pour prévenir le gardien de votre arrivée. Le QR est lié à la porte / agent responsable de l’entrée.
            </p>
          </div>
          <Btn variant="secondary" icon={ArrowLeft} onClick={() => navigate('/')}>Retour</Btn>
        </div>

        <Card className="space-y-6 p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-brand-blue-bright/10 text-brand-blue-bright flex items-center justify-center">
                <Shield size={20} />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-slate-400 dark:text-slate-500">Porte / Agent</p>
                <p className="text-base font-black text-slate-900 dark:text-white break-words">{agentId || 'Aucune porte détectée'}</p>
              </div>
            </div>
            <div className="inline-flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <QrCode size={18} /> QR public : utilisez ce lien depuis l’entrée
            </div>
          </div>

          {!scanResult && (
            <div className="rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <ScanPanel mode="person" onDataExtracted={handleDataExtracted} onClose={() => navigate('/')} />
            </div>
          )}

          {loading && (
            <div className="rounded-3xl border border-brand-blue-light/20 bg-brand-blue-light/5 p-5 text-center text-sm font-black text-brand-blue-bright">
              <Loader2 className="inline-block mr-2 animate-spin" size={18} /> Envoi des informations au gardien...
            </div>
          )}

          {error && (
            <div className="rounded-3xl border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20 p-4 text-sm font-bold text-red-700 dark:text-red-200">
              {error}
            </div>
          )}

          {scanResult && (
            <div className="rounded-3xl border border-brand-green-light/30 bg-brand-green-light/5 p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-brand-green-bright/10 text-brand-green-bright flex items-center justify-center">
                  <CheckCircle2 size={22} />
                </div>
                <div>
                  <p className="text-lg font-black text-slate-900 dark:text-white">Entrée enregistrée</p>
                  <p className="text-sm text-slate-600 dark:text-slate-300">Le gardien a bien reçu la notification.</p>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4">
                  <p className="text-[10px] uppercase tracking-[0.35em] text-slate-400 dark:text-slate-500">Porte / Agent</p>
                  <p className="mt-2 text-sm font-black text-slate-900 dark:text-white break-words">{agentId}</p>
                </div>
                <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4">
                  <p className="text-[10px] uppercase tracking-[0.35em] text-slate-400 dark:text-slate-500">Référence</p>
                  <p className="mt-2 text-sm font-black text-slate-900 dark:text-white break-words">{scanResult.reference || '—'}</p>
                </div>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-slate-600 dark:text-slate-300">Vous pouvez fermer cette page ou revenir à l’accueil.</p>
                <Btn variant="success" icon={ArrowLeft} onClick={() => navigate('/')}>Retour à l’accueil</Btn>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
