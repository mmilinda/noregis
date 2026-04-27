import { useState, useRef, useEffect } from 'react';
import { Camera, Upload, X, RotateCcw, CheckCircle2, Loader2, Car, WifiOff } from 'lucide-react';
import { Btn } from './UI';
import Tesseract from 'tesseract.js';

/* ===========================================
   OCR PROCESSING ENGINE
=========================================== */
function OcrProcessing({ image, mode, onDone }) {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('Initialisation...');

  useEffect(() => {
    let isMounted = true;

    const runOCR = async () => {
      try {
        setStatus('Lecture du document...');
        const { data: { text } } = await Tesseract.recognize(
          image,
          'fra+eng',
          { 
            logger: m => {
              if (m.status === 'recognizing text' && isMounted) {
                setProgress(Math.round(m.progress * 100));
                setStatus(`Analyse : ${Math.round(m.progress * 100)}%`);
              }
            }
          }
        );

        if (!isMounted) return;

        // Smart Extraction Logic
        const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 2);
        const data = {};

        if (mode === 'vehicule') {
          // Extract immatriculation
          const plateRegex = /([0-9]{1,4}\s?[A-Z]{1,3}\s?[0-9]{1,2})|([A-Z]{2}-[0-9]{3}-[A-Z]{2})/i;
          const plateMatch = text.match(plateRegex);
          data.immatriculation = plateMatch ? plateMatch[0].toUpperCase() : '';
          
          const brands = ['TOYOTA', 'MERCEDES', 'BMW', 'RENAULT', 'PEUGEOT', 'HYUNDAI', 'KIA', 'VOLKSWAGEN', 'FORD'];
          const foundBrand = brands.find(b => text.toUpperCase().includes(b));
          data.marque = foundBrand || '';
        } else {
          // Extract Identity Data with flexible regex
          // NOM(S) or NOM
          const nomMatch = text.match(/(?:NOM|SURNAME)[(S)]*[\s:]+([A-Z\s.-]{3,})/i);
          data.nom = nomMatch ? nomMatch[1].trim().split('\n')[0] : '';

          // PRENOM(S) or PRENOM
          const prenomMatch = text.match(/(?:PRÉ?NOMS?|GIVEN NAMES?)[(S)]*[\s:]+([A-Z\s.-]{3,})/i);
          data.prenom = prenomMatch ? prenomMatch[1].trim().split('\n')[0] : '';

          // NUMERO DE PIECE (ID)
          const pieceMatch = text.match(/(?:N°|NO|NUMÉ?RO|ID|IDENTITY|PIÈ?CE|CONSULAIRE)[\s:]+([A-Z0-9\s-]{4,})/i);
          data.numeroPiece = pieceMatch ? pieceMatch[1].trim().split('\n')[0] : '';

          // DATE DE NAISSANCE (Normalize to YYYY-MM-DD for input[type=date])
          const dateMatch = text.match(/(\d{2})[/.-](\d{2})[/.-](\d{4})/);
          if (dateMatch) {
            data.dateNaissance = `${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}`;
          } else {
            const isoMatch = text.match(/(\d{4})[/.-](\d{2})[/.-](\d{2})/);
            data.dateNaissance = isoMatch ? isoMatch[0].replace(/[/.]/g, '-') : '';
          }

          // PROFESSION
          const profMatch = text.match(/(?:PROFESSION|OCCUPATION)[\s:]+([A-Z\s]+)/i);
          data.profession = profMatch ? profMatch[1].trim().split('\n')[0] : '';

          // ADRESSE
          const addrMatch = text.match(/(?:ADRESSE|ADDRESS|DOMICILE)[\s:]+([A-Z0-9\s,.-]+)/i);
          data.adresse = addrMatch ? addrMatch[1].trim().split('\n')[0] : '';

          // Fallback: if Nom/Prenom not found, try to look for the first few uppercase lines
          if (!data.nom || !data.prenom) {
            const uppercaseLines = lines.filter(l => /^[A-Z\s.-]+$/.test(l) && l.length > 3 && !l.includes('REPUBLIQUE') && !l.includes('CARTE'));
            if (!data.nom && uppercaseLines[0]) data.nom = uppercaseLines[0];
            if (!data.prenom && uppercaseLines[1]) data.prenom = uppercaseLines[1];
          }
        }

        // Final cleanup
        Object.keys(data).forEach(k => {
          if (typeof data[k] === 'string') {
            data[k] = data[k].replace(/^(NOM|PRENOM|SURNAME|GIVEN NAMES|DATE|ID|NO|NUMERO|PROFESSION|ADRESSE|ADDRESS)S?[:\s]*/i, '');
            data[k] = data[k].trim();
          }
        });

        onDone(data);
      } catch (err) {
        console.error('OCR Error:', err);
        onDone({ error: 'Échec de la lecture' });
      }
    };

    runOCR();
    return () => { isMounted = false; };
  }, [image, mode, onDone]);

  return (
    <div className="flex flex-col items-center justify-center h-full gap-8 p-8 text-center bg-slate-50/50 dark:bg-slate-900/50">
      <div className="relative">
        <img src={image} alt="doc" className="w-52 h-32 object-cover rounded-xl border-2 border-brand-blue-bright/30 blur-[1px] opacity-40 shadow-2xl" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-900 shadow-xl flex items-center justify-center">
            <Loader2 size={28} className="animate-spin text-brand-blue-bright" />
          </div>
        </div>
      </div>
      <div className="space-y-3">
        <p className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">Analyse intelligente</p>
        <div className="w-48 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mx-auto">
          <div className="h-full bg-brand-blue-bright transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
        <p className="text-[10px] font-black text-brand-blue-bright uppercase animate-pulse tracking-widest">{status}</p>
      </div>
    </div>
  );
}

/* ===========================================
   SCANNER (Camera Live)
=========================================== */
function LiveCamera({ onCapture, onClose }) {
  const videoRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(() => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return "Le navigateur ne supporte pas l'accès caméra ou vous n'êtes pas en HTTPS.";
    }
    return null;
  });

  useEffect(() => {
    let localStream = null;
    if (error) return;

    const startCamera = async (facing) => {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } } 
        });
        localStream = s;
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          setReady(true);
        }
      } catch (err) {
        console.error(err);
        if (facing === 'environment') {
          // Try fallback to user camera if environment fails
          startCamera('user');
        } else {
          setError(`Erreur caméra : ${err.name === 'NotAllowedError' ? 'Permission refusée' : 'Indisponible'}`);
        }
      }
    };

    startCamera('environment');

    return () => {
      if (localStream) localStream.getTracks().forEach(t => t.stop());
    };
  }, [error]);

  const capture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext('2d').drawImage(videoRef.current, 0, 0);
    onCapture(canvas.toDataURL('image/jpeg', 0.95));
  };

  return (
    <div className="flex flex-col h-full bg-black">
      <div className="flex-1 relative overflow-hidden">
        {!ready && !error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-slate-400">
            <Loader2 size={40} className="animate-spin text-brand-blue-bright" />
            <span className="text-[10px] font-black uppercase tracking-widest">Initialisation...</span>
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-8 text-center bg-slate-900">
            <WifiOff size={40} className="text-brand-red-bright" />
            <p className="text-sm font-black text-white uppercase tracking-tight leading-tight">{error}</p>
            <button onClick={onClose} className="mt-4 px-6 py-2 bg-white/10 text-white rounded-lg text-[10px] font-black uppercase">Fermer</button>
          </div>
        )}
        <video ref={videoRef} autoPlay playsInline muted className={`w-full h-full object-cover ${ready ? 'opacity-100' : 'opacity-0'}`} />
        <div className="absolute inset-0 flex items-center justify-center p-8 pointer-events-none">
          <div className="relative w-full aspect-[1.6] max-w-sm border-2 border-white/20 rounded-2xl">
            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-brand-blue-bright rounded-tl-xl" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-brand-blue-bright rounded-tr-xl" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-brand-blue-bright rounded-bl-xl" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-brand-blue-bright rounded-br-xl" />
          </div>
        </div>
      </div>
      <div className="p-8 bg-slate-900 flex items-center justify-center gap-10">
        <button onClick={onClose} className="w-12 h-12 rounded-full bg-white/10 text-white flex items-center justify-center"><X size={24} /></button>
        <button onClick={capture} disabled={!ready} className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center active:scale-95 transition-transform">
          <div className="w-14 h-14 rounded-full bg-white" />
        </button>
        <div className="w-12 h-12" />
      </div>
    </div>
  );
}

/* ===========================================
   SCAN PANEL (Main Entry)
=========================================== */
export function ScanPanel({ mode = 'person', onDataExtracted, onClose }) {
  const [phase, setPhase] = useState('choose');
  const [capturedImage, setCapturedImage] = useState(null);
  const [ocrData, setOcrData] = useState(null);
  const fileRef = useRef(null);

  const handleOcrDone = (data) => {
    setOcrData(data);
    setPhase('done');
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => { setCapturedImage(reader.result); setPhase('ocr'); };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col h-full min-h-[520px] bg-white dark:bg-slate-900 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800">
      <div className="p-4 border-b border-slate-50 dark:border-slate-800 flex items-center gap-4 bg-slate-50/50 dark:bg-slate-900/50">
        <div className="w-10 h-10 rounded-lg bg-brand-blue-light text-brand-blue-bright flex items-center justify-center">
          {mode === 'vehicule' ? <Car size={20} /> : <Camera size={20} />}
        </div>
        <div>
          <h2 className="text-base font-black text-slate-900 dark:text-white leading-none">Numérisation</h2>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter mt-1.5">{mode === 'vehicule' ? 'Carte grise' : 'Pièce d\'identité'}</p>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {phase === 'choose' && (
          <div className="p-8 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-300">
            <p className="text-center text-slate-500 text-[11px] font-extrabold uppercase tracking-widest mb-2">Méthode de capture</p>
            <button onClick={() => setPhase('camera')} className="group flex items-center gap-4 p-4 rounded-xl border-2 border-brand-blue-bright/10 bg-brand-blue-light/10 hover:border-brand-blue-bright/30 transition-all text-left">
              <div className="w-10 h-10 rounded-lg bg-brand-blue-bright text-white flex items-center justify-center shrink-0"><Camera size={20} /></div>
              <div className="flex-1">
                <p className="font-black text-sm text-slate-900 dark:text-white">Caméra en direct</p>
                <p className="text-[9px] font-bold text-brand-blue-bright uppercase tracking-tighter mt-1">Extraction OCR automatique</p>
              </div>
            </button>
            <button onClick={() => fileRef.current?.click()} className="group flex items-center gap-4 p-4 rounded-xl border-2 border-slate-100 dark:border-slate-800 hover:border-slate-300 transition-all text-left">
              <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center shrink-0"><Upload size={20} /></div>
              <div className="flex-1">
                <p className="font-black text-sm text-slate-900 dark:text-white">Importer un fichier</p>
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter mt-1">Photo ou document PDF</p>
              </div>
            </button>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleFileUpload} />
            <button onClick={onClose} className="mt-6 px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-[10px] font-black text-slate-400 uppercase tracking-widest active:scale-95 transition-all">Annuler</button>
          </div>
        )}

        {phase === 'camera' && <LiveCamera onCapture={(img) => { setCapturedImage(img); setPhase('ocr'); }} onClose={() => setPhase('choose')} />}
        {phase === 'ocr' && <OcrProcessing image={capturedImage} mode={mode} onDone={handleOcrDone} />}
        
        {phase === 'done' && (
          <div className="p-6 flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="relative rounded-lg overflow-hidden border-2 border-brand-green-bright">
              <img src={capturedImage} alt="Capture" className="w-full h-32 object-cover" />
              <div className="absolute top-2 right-2 bg-brand-green-bright text-white px-2 py-1 rounded text-[9px] font-black uppercase tracking-tighter">Capture validée</div>
            </div>
            <div className="bg-brand-green-light/10 dark:bg-brand-green-bright/5 rounded-xl p-4 border border-brand-green-bright/20">
              <p className="text-[9px] font-black text-brand-green-bright uppercase tracking-widest mb-3 flex items-center gap-2">Extraction terminée</p>
              <div className="space-y-2">
                {Object.entries(ocrData).map(([k, v]) => (
                  <div key={k} className="flex justify-between items-center gap-4 pb-2 border-b border-brand-green-bright/5 last:border-0 last:pb-0">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">{k}</span>
                    <span className="text-xs font-black text-slate-900 dark:text-white text-right">{v || '—'}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <Btn variant="secondary" icon={RotateCcw} onClick={() => setPhase('choose')} fullWidth>Recommencer</Btn>
              <Btn variant="success" icon={CheckCircle2} onClick={() => onDataExtracted(ocrData, capturedImage)} fullWidth>Valider les données</Btn>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
