import { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, Upload, X, RotateCcw, CheckCircle2, Loader2, Car, WifiOff, Zap, ZapOff, ArrowRight, SkipForward, Layers } from 'lucide-react';
import { Btn } from './UI';
import { useApp } from '../context/useAppState';
import { TRANSLATIONS } from '../translations';
import api from '../services/api';
import { runLocalOCR } from '../services/localOcrService';


/* ===========================================
   HELPER: base64 -> File (pour FormData)
=========================================== */
function base64ToFile(base64, filename = 'scan.jpg') {
  const [meta, data] = base64.split(',');
  const mime = meta.match(/:(.*?);/)[1];
  const bytes = atob(data);
  const arr = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
  return new File([arr], filename, { type: mime });
}

/* ===========================================
   PRÉTRAITEMENT & COMPRESSION ULTRA-RAPIDE (Canvas)
=========================================== */
function preparerImageOCR(base64) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const MAX = 1280; // Résolution optimale pour Gemini Vision IA
      let w = img.width;
      let h = img.height;
      if (w > MAX || h > MAX) {
        if (w > h) {
          h = Math.round((h * MAX) / w);
          w = MAX;
        } else {
          w = Math.round((w * MAX) / h);
          h = MAX;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');

      // Dessin direct en couleur sans détruire la saturation RGB (Gemini lit mieux les photos couleur)
      ctx.drawImage(img, 0, 0, w, h);

      // Compression JPEG 0.85 (excellente lisibilité pour l'IA Gemini Vision)
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = () => resolve(base64);
    img.src = base64;
  });
}

function extraireNINLocal(textRaw) {
  if (!textRaw) return null;
  let m = textRaw.match(/NIN[\s:]*([0-9\s]{13,20})/i);
  if (m) return m[1].replace(/\s/g, '');
  m = textRaw.match(/N[.\s]*I[.\s]*N[.\s:]*([0-9\s]{13,20})/i);
  if (m) return m[1].replace(/\s/g, '');
  m = textRaw.match(/\b([12]\s?\d{4}\s?\d{4}\s?\d{4,5})\b/);
  if (m) return m[1].replace(/\s/g, '');
  m = textRaw.match(/\b(\d{13,15})\b/);
  if (m) return m[1];
  return null;
}

/* ===========================================
   CAMERA LIVE (Plein écran)
=========================================== */
function LiveCamera({ currentSide = 'recto', onCapture, onClose, t }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const [ready, setReady] = useState(false);
  const [flashOn, setFlashOn] = useState(false);
  const [flashAvail, setFlashAvail] = useState(false);
  const [error, setError] = useState(() => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      return t.camera_unsupported || 'Caméra non supportée';
    }
    return null;
  });

  useEffect(() => {
    if (error) return;

    try {
      screen.orientation?.lock?.('portrait').catch(() => {});
    } catch (_) {}

    const startCamera = async (facing) => {
      try {
        const s = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: facing,
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
        });
        streamRef.current = s;

        if (videoRef.current) {
          videoRef.current.srcObject = s;
          setReady(true);
        }

        const track = s.getVideoTracks()[0];
        const caps = track?.getCapabilities?.();

        if (caps?.torch) {
          setFlashAvail(true);
          try {
            await track.applyConstraints({ advanced: [{ torch: true }] });
            setFlashOn(true);
          } catch (_) {}
        }
      } catch (err) {
        if (facing === 'environment') {
          startCamera('user');
        } else {
          setError((t.camera_error || 'Erreur caméra') + ' : ' + (err.name === 'NotAllowedError' ? (t.permission_denied || 'Permission refusée') : (t.unavailable || 'Non disponible')));
        }
      }
    };

    startCamera('environment');

    return () => {
      const track = streamRef.current?.getVideoTracks()[0];
      if (track) {
        track.applyConstraints({ advanced: [{ torch: false }] }).catch(() => {});
        streamRef.current.getTracks().forEach(tr => tr.stop());
      }
      try { screen.orientation?.unlock?.(); } catch (_) {}
    };
  }, [error, t]);

  const toggleFlash = useCallback(async () => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    const next = !flashOn;
    try {
      await track.applyConstraints({ advanced: [{ torch: next }] });
      setFlashOn(next);
    } catch (err) {
      console.warn('Flash toggle error:', err);
    }
  }, [flashOn]);

  const capture = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    const MAX = 1024;
    let w = video.videoWidth || 1024;
    let h = video.videoHeight || 600;
    if (w > MAX) { h = Math.round((h * MAX) / w); w = MAX; }
    if (h > MAX) { w = Math.round((w * MAX) / h); h = MAX; }

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    canvas.getContext('2d').drawImage(video, 0, 0, w, h);

    const track = streamRef.current?.getVideoTracks()[0];
    if (track && flashOn) {
      track.applyConstraints({ advanced: [{ torch: false }] }).catch(() => {});
    }

    onCapture(canvas.toDataURL('image/jpeg', 0.85));
  }, [flashOn, onCapture]);

  const handleClose = useCallback(() => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (track && flashOn) {
      track.applyConstraints({ advanced: [{ torch: false }] }).catch(() => {});
    }
    onClose();
  }, [flashOn, onClose]);

  const isRecto = currentSide === 'recto';

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      <div className="flex-1 relative overflow-hidden">
        {!ready && !error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-slate-400 z-10">
            <Loader2 size={40} className="animate-spin text-brand-blue-bright" />
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-8 text-center bg-slate-900 z-10">
            <WifiOff size={40} className="text-brand-red-bright" />
            <p className="text-sm font-black text-white uppercase tracking-tight leading-tight">{error}</p>
            <button
              onClick={handleClose}
              className="mt-4 px-6 py-2 bg-white/10 text-white rounded-lg text-[10px] font-black uppercase"
            >
              {t.close || 'Fermer'}
            </button>
          </div>
        )}

        <video
          ref={videoRef}
          autoPlay playsInline muted
          className={`absolute inset-0 w-full h-full object-cover ${ready ? 'opacity-100' : 'opacity-0'}`}
        />

        {/* Indicateur d'étape en haut */}
        <div className="absolute top-4 left-0 right-0 z-20 flex justify-center pointer-events-none px-4">
          <div className="bg-black/70 backdrop-blur-md border border-white/20 px-4 py-2 rounded-full flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${isRecto ? 'bg-brand-blue-bright animate-ping' : 'bg-brand-green-bright animate-ping'}`} />
            <span className="text-xs font-black text-white uppercase tracking-wider">
              {isRecto ? 'Étape 1 : Cadrez le RECTO' : 'Étape 2 : Cadrez le VERSO (NIN)'}
            </span>
          </div>
        </div>

        {/* Cadre de visée */}
        <div className="absolute inset-0 flex items-center justify-center p-8 pointer-events-none">
          <div className="relative w-full aspect-[1.58] max-w-sm border-2 border-white/30 rounded-2xl shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]">
            <div className={`absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 ${isRecto ? 'border-brand-blue-bright' : 'border-brand-green-bright'} rounded-tl-xl`} />
            <div className={`absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 ${isRecto ? 'border-brand-blue-bright' : 'border-brand-green-bright'} rounded-tr-xl`} />
            <div className={`absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 ${isRecto ? 'border-brand-blue-bright' : 'border-brand-green-bright'} rounded-bl-xl`} />
            <div className={`absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 ${isRecto ? 'border-brand-blue-bright' : 'border-brand-green-bright'} rounded-br-xl`} />
            <p className="absolute -bottom-8 left-0 right-0 text-center text-[10px] font-black text-white/90 uppercase tracking-widest bg-black/60 py-1 rounded">
              {isRecto ? 'Face avant : Nom, Prénom, Photo' : 'Face arrière : NIN sénégalais'}
            </p>
          </div>
        </div>

        {flashAvail && ready && (
          <button
            onClick={toggleFlash}
            className={`
              absolute top-4 right-4 z-20
              w-11 h-11 rounded-full flex items-center justify-center
              transition-all duration-200 active:scale-90
              ${flashOn
                ? 'bg-yellow-400 text-slate-900 shadow-[0_0_16px_4px_rgba(250,204,21,0.5)]'
                : 'bg-white/10 text-white backdrop-blur-sm border border-white/20'
              }
            `}
          >
            {flashOn ? <Zap size={20} fill="currentColor" /> : <ZapOff size={20} />}
          </button>
        )}

        <button
          onClick={handleClose}
          className="absolute top-4 left-4 z-20 w-11 h-11 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white flex items-center justify-center active:scale-90 transition-transform"
        >
          <X size={22} />
        </button>
      </div>

      {/* Barre de capture */}
      <div
        className="flex items-center justify-center gap-10 py-6 bg-gradient-to-t from-black/90 to-transparent"
        style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom))' }}
      >
        <div className="w-12 h-12" />

        <button
          onClick={capture}
          disabled={!ready}
          className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center active:scale-95 transition-transform disabled:opacity-40 shadow-2xl"
          title="Prendre la photo"
        >
          <div className={`w-14 h-14 rounded-full ${isRecto ? 'bg-brand-blue-bright' : 'bg-brand-green-bright'}`} />
        </button>

        {flashAvail ? (
          <button
            onClick={toggleFlash}
            className={`
              w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 active:scale-90
              ${flashOn ? 'bg-yellow-400 text-slate-900 shadow-[0_0_12px_2px_rgba(250,204,21,0.4)]' : 'bg-white/10 text-white'}
            `}
          >
            {flashOn ? <Zap size={20} fill="currentColor" /> : <ZapOff size={20} />}
          </button>
        ) : (
          <div className="w-12 h-12" />
        )}
      </div>
    </div>
  );
}

/* ===========================================
   SCAN PANEL (Flux Guidé Recto ➔ Verso)
=========================================== */
export function ScanPanel({ mode = 'person', onDataExtracted, onClose }) {
  const { state } = useApp();
  const t = TRANSLATIONS[state.settings?.language || 'fr'];

  // Étapes : 'recto_choose' | 'recto_camera' | 'recto_ocr' | 'verso_prompt' | 'verso_camera' | 'verso_ocr' | 'summary'
  const [phase, setPhase] = useState('recto_choose');

  const [rectoImg, setRectoImg] = useState(null);
  const [versoImg, setVersoImg] = useState(null);

  const [rectoData, setRectoData] = useState({});
  const [versoData, setVersoData] = useState({});
  const [loadingMsg, setLoadingMsg] = useState('');

  const fileInputRef = useRef(null);
  const currentFileInputTarget = useRef('recto');

  const isAr = state.settings?.language === 'ar';

  // Exécution de l'OCR sur le Recto
  const runRectoOCR = async (image) => {
    setLoadingMsg('Analyse du RECTO en cours...');
    setPhase('recto_ocr');
    let extracted = {};
    let isLocalFallback = false;

    try {
      const imgPrep = await preparerImageOCR(image);
      const fd = new FormData();
      fd.append('image', base64ToFile(imgPrep, 'recto.jpg'));
      fd.append('mode', mode);

      const res = await api.postForm('/api/scan', fd);
      extracted = res.infosExtraites || res.donnees || {};

      if (!extracted.nin && res.texteBrut) {
        const foundNIN = extraireNINLocal(res.texteBrut);
        if (foundNIN) extracted.nin = foundNIN;
      }
    } catch (err) {
      console.warn('Backend API scan indisponible ou erreur 401, bascule sur OCR local Tesseract:', err);
      isLocalFallback = true;
    }

    // Si le serveur a échoué ou n'a renvoyé aucune donnée essentielle
    if (isLocalFallback || (!extracted.nom && !extracted.prenom && !extracted.nin && !extracted.numeroPiece)) {
      setLoadingMsg('Analyse Tesseract.js locale (mode secours)...');
      try {
        const localRes = await runLocalOCR(image);
        extracted = { ...localRes.extracted, ...extracted };
      } catch (lErr) {
        console.error('Erreur OCR local:', lErr);
      }
    }

    setRectoData(extracted);
    setRectoImg(image);

    if (mode === 'vehicule') {
      onDataExtracted(extracted, image);
    } else {
      setPhase('verso_prompt');
    }
  };

  // Exécution de l'OCR sur le Verso
  const runVersoOCR = async (image) => {
    setLoadingMsg('Analyse du VERSO (extraction NIN)...');
    setPhase('verso_ocr');
    let extracted = {};
    let isLocalFallback = false;

    try {
      const imgPrep = await preparerImageOCR(image);
      const fd = new FormData();
      fd.append('image', base64ToFile(imgPrep, 'verso.jpg'));
      fd.append('mode', 'verso');

      const res = await api.postForm('/api/scan', fd);
      extracted = res.infosExtraites || res.donnees || {};

      if (!extracted.nin && res.texteBrut) {
        const foundNIN = extraireNINLocal(res.texteBrut);
        if (foundNIN) extracted.nin = foundNIN;
      }
    } catch (err) {
      console.warn('Backend API scan verso indisponible, bascule sur OCR local:', err);
      isLocalFallback = true;
    }

    if (isLocalFallback || !extracted.nin) {
      setLoadingMsg('Analyse NIN Tesseract.js locale...');
      try {
        const localRes = await runLocalOCR(image);
        if (localRes.extracted.nin) extracted.nin = localRes.extracted.nin;
        extracted = { ...localRes.extracted, ...extracted };
      } catch (lErr) {
        console.error('Erreur OCR local verso:', lErr);
      }
    }

    setVersoData(extracted);
    setVersoImg(image);
    setPhase('summary');
  };

  // Passer le verso
  const handleSkipVerso = () => {
    setPhase('summary');
  };

  // Fichier importé
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      if (currentFileInputTarget.current === 'recto') {
        runRectoOCR(reader.result);
      } else {
        runVersoOCR(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const triggerUpload = (target) => {
    currentFileInputTarget.current = target;
    fileInputRef.current?.click();
  };

  // Validation finale
  const handleFinalValidation = () => {
    const merged = {
      ...rectoData,
      ...versoData,
      nin: versoData.nin || rectoData.nin || '',
      nom: rectoData.nom || versoData.nom || '',
      prenom: rectoData.prenom || versoData.prenom || '',
      numeroPiece: rectoData.numeroPiece || versoData.numeroPiece || '',
      photo: rectoImg,
      photoVerso: versoImg,
    };
    onDataExtracted(merged, rectoImg);
  };

  const combinedSummary = {
    ...rectoData,
    ...(versoData.nin ? { nin: versoData.nin } : {}),
  };

  return (
    <div
      className="flex flex-col h-full min-h-0 bg-white dark:bg-slate-900 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800"
      dir={isAr ? 'rtl' : 'ltr'}
    >
      {/* Header avec indicateur Recto/Verso */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-brand-blue-light text-brand-blue-bright flex items-center justify-center">
            {mode === 'vehicule' ? <Car size={20} /> : <Layers size={20} />}
          </div>
          <div>
            <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">
              Scan de pièce d'identité
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${phase.startsWith('recto') ? 'bg-brand-blue-bright text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'}`}>
                1. RECTO
              </span>
              <ArrowRight size={12} className="text-slate-400" />
              <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${phase.startsWith('verso') ? 'bg-brand-green-bright text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'}`}>
                2. VERSO (NIN)
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleFileUpload} />

      {/* Corps dynamique */}
      <div className="flex-1 min-h-0 overflow-y-auto p-5">

        {/* ─── 1. CHOIX RECTO ─── */}
        {phase === 'recto_choose' && (
          <div className="flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-brand-blue-light/20 dark:bg-brand-blue-bright/10 border border-brand-blue-bright/20 p-4 rounded-xl text-center">
              <p className="text-xs font-black text-brand-blue-bright uppercase tracking-wider">Étape 1 : Face Avant (Recto)</p>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 font-bold mt-1">
                Scannez la face avant de la carte d'identité pour capturer le nom, prénom et numéro de pièce.
              </p>
            </div>

            <button
              onClick={() => setPhase('recto_camera')}
              className="group flex items-center gap-4 p-4 rounded-xl border-2 border-brand-blue-bright/20 bg-brand-blue-light/10 hover:border-brand-blue-bright hover:bg-brand-blue-light/20 transition-all text-left"
            >
              <div className="w-12 h-12 rounded-xl bg-brand-blue-bright text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-md">
                <Camera size={24} />
              </div>
              <div className="flex-1">
                <p className="font-black text-sm text-slate-900 dark:text-white">Scanner le RECTO avec la caméra</p>
                <p className="text-[10px] font-bold text-brand-blue-bright uppercase tracking-tight mt-0.5">Capture en direct</p>
              </div>
            </button>

            <button
              onClick={() => triggerUpload('recto')}
              className="group flex items-center gap-4 p-4 rounded-xl border-2 border-slate-200 dark:border-slate-800 hover:border-slate-400 transition-all text-left"
            >
              <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center shrink-0">
                <Upload size={24} />
              </div>
              <div className="flex-1">
                <p className="font-black text-sm text-slate-900 dark:text-white">Importer une photo du RECTO</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mt-0.5">Galerie / Fichier</p>
              </div>
            </button>
          </div>
        )}

        {/* ─── CAMERA RECTO ─── */}
        {phase === 'recto_camera' && (
          <LiveCamera
            currentSide="recto"
            onCapture={(img) => runRectoOCR(img)}
            onClose={() => setPhase('recto_choose')}
            t={t}
          />
        )}

        {/* ─── CHARGEMENT OCR ─── */}
        {(phase === 'recto_ocr' || phase === 'verso_ocr') && (
          <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
            <Loader2 size={44} className="animate-spin text-brand-blue-bright" />
            <p className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-widest animate-pulse">
              {loadingMsg}
            </p>
            <p className="text-[10px] text-slate-400 font-bold">Extraction automatique par Intelligence Artificielle</p>
          </div>
        )}

        {/* ─── 2. PROMPT VERSO ─── */}
        {phase === 'verso_prompt' && (
          <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-right-4 duration-300">
            {/* Aperçu du Recto validé */}
            <div className="flex items-center gap-3 p-3 bg-brand-green-light/20 dark:bg-brand-green-bright/10 border border-brand-green-bright/30 rounded-xl">
              {rectoImg && (
                <img src={rectoImg} alt="Recto" className="w-16 h-11 object-cover rounded-lg border border-brand-green-bright" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black text-brand-green-bright flex items-center gap-1.5">
                  <CheckCircle2 size={14} /> RECTO capturé avec succès
                </p>
                <p className="text-[11px] font-bold text-slate-700 dark:text-slate-200 truncate mt-0.5">
                  {rectoData.prenom} {rectoData.nom} {rectoData.numeroPiece ? `(${rectoData.numeroPiece})` : ''}
                </p>
              </div>
            </div>

            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-500/30 p-4 rounded-xl text-center">
              <p className="text-xs font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                Étape 2 : Face Arrière (Verso)
              </p>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 font-bold mt-1">
                Scannez le VERSO pour extraire le <strong>NIN</strong> (Numéro d'Identification Nationale) et les dates officielles.
              </p>
            </div>

            <button
              onClick={() => setPhase('verso_camera')}
              className="group flex items-center gap-4 p-4 rounded-xl border-2 border-brand-green-bright/30 bg-brand-green-light/10 hover:border-brand-green-bright hover:bg-brand-green-light/20 transition-all text-left"
            >
              <div className="w-12 h-12 rounded-xl bg-brand-green-bright text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-md">
                <Camera size={24} />
              </div>
              <div className="flex-1">
                <p className="font-black text-sm text-slate-900 dark:text-white">Scanner le VERSO avec la caméra</p>
                <p className="text-[10px] font-bold text-brand-green-bright uppercase tracking-tight mt-0.5">Pour extraire le NIN</p>
              </div>
            </button>

            <button
              onClick={() => triggerUpload('verso')}
              className="group flex items-center gap-4 p-4 rounded-xl border-2 border-slate-200 dark:border-slate-800 hover:border-slate-400 transition-all text-left"
            >
              <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center shrink-0">
                <Upload size={24} />
              </div>
              <div className="flex-1">
                <p className="font-black text-sm text-slate-900 dark:text-white">Importer une photo du VERSO</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mt-0.5">Galerie / Fichier</p>
              </div>
            </button>

            <button
              onClick={handleSkipVerso}
              className="w-full flex items-center justify-center gap-2 p-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-black uppercase tracking-wider transition-all mt-2"
            >
              <SkipForward size={16} /> Passer le verso (valider uniquement le recto)
            </button>
          </div>
        )}

        {/* ─── CAMERA VERSO ─── */}
        {phase === 'verso_camera' && (
          <LiveCamera
            currentSide="verso"
            onCapture={(img) => runVersoOCR(img)}
            onClose={() => setPhase('verso_prompt')}
            t={t}
          />
        )}

        {/* ─── 3. RÉSUMÉ & VALIDATION ─── */}
        {phase === 'summary' && (
          <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* Photos capturées */}
            <div className="grid grid-cols-2 gap-3">
              {rectoImg && (
                <div className="relative rounded-xl overflow-hidden border-2 border-brand-blue-bright">
                  <img src={rectoImg} alt="Recto" className="w-full h-24 object-cover" />
                  <span className="absolute bottom-1 left-1 bg-brand-blue-bright text-white text-[8px] font-black px-1.5 py-0.5 rounded uppercase">
                    Recto
                  </span>
                </div>
              )}
              {versoImg ? (
                <div className="relative rounded-xl overflow-hidden border-2 border-brand-green-bright">
                  <img src={versoImg} alt="Verso" className="w-full h-24 object-cover" />
                  <span className="absolute bottom-1 left-1 bg-brand-green-bright text-white text-[8px] font-black px-1.5 py-0.5 rounded uppercase">
                    Verso
                  </span>
                </div>
              ) : (
                <div className="rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-800 flex items-center justify-center p-2 text-center text-slate-400 text-[10px] font-bold">
                  Verso non fourni
                </div>
              )}
            </div>

            {/* Tableau des informations extraites */}
            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-4 border border-slate-200 dark:border-slate-700/60 space-y-2">
              <p className="text-[10px] font-black text-brand-blue-bright uppercase tracking-widest mb-2">
                Données Extraites avec succès
              </p>

              {combinedSummary.nin && (
                <div className="flex justify-between items-center py-1.5 border-b border-brand-green-bright/20 bg-brand-green-light/20 dark:bg-brand-green-bright/10 px-2 rounded">
                  <span className="text-[10px] font-extrabold text-brand-green-bright uppercase">NIN (Verso)</span>
                  <span className="text-xs font-black font-mono text-brand-green-bright">{combinedSummary.nin}</span>
                </div>
              )}

              {combinedSummary.nom && (
                <div className="flex justify-between items-center py-1 border-b border-slate-200 dark:border-slate-700/50">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Nom</span>
                  <span className="text-xs font-black text-slate-900 dark:text-white">{combinedSummary.nom}</span>
                </div>
              )}

              {combinedSummary.prenom && (
                <div className="flex justify-between items-center py-1 border-b border-slate-200 dark:border-slate-700/50">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Prénom</span>
                  <span className="text-xs font-black text-slate-900 dark:text-white">{combinedSummary.prenom}</span>
                </div>
              )}

              {combinedSummary.numeroPiece && (
                <div className="flex justify-between items-center py-1 border-b border-slate-200 dark:border-slate-700/50">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">N° Pièce</span>
                  <span className="text-xs font-mono font-black text-slate-900 dark:text-white">{combinedSummary.numeroPiece}</span>
                </div>
              )}

              {combinedSummary.dateNaissance && (
                <div className="flex justify-between items-center py-1 border-b border-slate-200 dark:border-slate-700/50">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Naissance</span>
                  <span className="text-xs font-bold text-slate-900 dark:text-white">{combinedSummary.dateNaissance}</span>
                </div>
              )}

              {combinedSummary.sexe && (
                <div className="flex justify-between items-center py-1 border-b border-slate-200 dark:border-slate-700/50">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Sexe</span>
                  <span className="text-xs font-bold text-slate-900 dark:text-white">{combinedSummary.sexe}</span>
                </div>
              )}
            </div>

            {/* Boutons d'action */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setPhase('recto_choose')}
                className="flex-1 py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs flex items-center justify-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              >
                <RotateCcw size={16} /> Recommencer
              </button>

              <button
                onClick={handleFinalValidation}
                className="flex-[2] py-3 px-4 rounded-xl bg-brand-green-bright text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-green-600 shadow-lg active:scale-95 transition-all"
              >
                <CheckCircle2 size={18} /> Valider & Remplir
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
