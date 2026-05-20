export function ScanPanel({ mode = 'person', onDataExtracted, onClose }) {
  const { state } = useApp();
  const t = TRANSLATIONS[state.settings?.language || 'fr'];
  const [phase, setPhase] = useState('choose');
  const [capturedImage, setCapturedImage] = useState(null);
  const [ocrData, setOcrData] = useState(null);
  const fileRef = useRef(null);

  const handleOcrDone = (data) => {
    console.log('📥 Données OCR reçues :', data); // DEBUG
    setOcrData(data);
    setPhase('done');
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setCapturedImage(reader.result);
      setPhase('ocr');
    };
    reader.readAsDataURL(file);
  };

  const isAr = state.settings?.language === 'ar';

  // Liste fixe de tous les champs à afficher (même si leur valeur est null)
  const allFields = [
    { label: 'NOM', key: 'nom' },
    { label: 'PRENOM', key: 'prenom' },
    { label: 'DATE NAISSANCE', key: 'dateNaissance' },
    { label: 'NUMERO PIECE', key: 'numeroPiece' },
    { label: 'TYPE PIECE', key: 'typePiece' },
    { label: 'SEXE', key: 'sexe' },
    { label: 'TAILLE (cm)', key: 'taille' },
    { label: 'LIEU NAISSANCE', key: 'lieuNaissance' },
    { label: 'DATE DELIVRANCE', key: 'dateDelivrance' },
    { label: 'DATE EXPIRATION', key: 'dateExpiration' },
    { label: 'CENTRE ENREGISTREMENT', key: 'centreEnregistrement' },
    { label: 'ADRESSE DOMICILE', key: 'adresseDomicile' },
  ];

  return (
    <div className="flex flex-col h-full min-h-[520px] bg-white dark:bg-slate-900 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Header (inchangé) */}
      <div className="p-4 border-b border-slate-50 dark:border-slate-800 flex items-center gap-4 bg-slate-50/50 dark:bg-slate-900/50">
        <div className="w-10 h-10 rounded-lg bg-brand-blue-light text-brand-blue-bright flex items-center justify-center">
          {mode === 'vehicule' ? <Car size={20} /> : <Camera size={20} />}
        </div>
        <div>
          <h2 className="text-base font-black text-slate-900 dark:text-white leading-none">{t.scanning}</h2>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter mt-1.5">
            {mode === 'vehicule' ? t.license_plate : t.id_card}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {/* Phase 'choose' (inchangée) */}
        {phase === 'choose' && (
          <div className="p-8 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-300">
            <p className="text-center text-slate-500 text-[11px] font-extrabold uppercase tracking-widest mb-2">{t.scan_method}</p>
            <button
              onClick={() => setPhase('camera')}
              className="group flex items-center gap-4 p-4 rounded-xl border-2 border-brand-blue-bright/10 bg-brand-blue-light/10 hover:border-brand-blue-bright/30 transition-all text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-brand-blue-bright text-white flex items-center justify-center shrink-0">
                <Camera size={20} />
              </div>
              <div className="flex-1">
                <p className="font-black text-sm text-slate-900 dark:text-white">{t.live_camera}</p>
                <p className="text-[9px] font-bold text-brand-blue-bright uppercase tracking-tighter mt-1">{t.scan_id_desc}</p>
              </div>
            </button>
            <button
              onClick={() => fileRef.current?.click()}
              className="group flex items-center gap-4 p-4 rounded-xl border-2 border-slate-100 dark:border-slate-800 hover:border-slate-300 transition-all text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center shrink-0">
                <Upload size={20} />
              </div>
              <div className="flex-1">
                <p className="font-black text-sm text-slate-900 dark:text-white">{t.import_file}</p>
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter mt-1">{t.scan_id_desc}</p>
              </div>
            </button>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleFileUpload} />
            <button
              onClick={onClose}
              className="mt-6 px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-[10px] font-black text-slate-400 uppercase tracking-widest active:scale-95 transition-all"
            >
              {t.cancel}
            </button>
          </div>
        )}

        {phase === 'camera' && (
          <LiveCamera
            onCapture={(img) => { setCapturedImage(img); setPhase('ocr'); }}
            onClose={() => setPhase('choose')}
            t={t}
          />
        )}

        {phase === 'ocr' && (
          <OcrProcessing image={capturedImage} mode={mode} onDone={handleOcrDone} t={t} />
        )}

        {phase === 'done' && (
          <div className="p-6 flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="relative rounded-lg overflow-hidden border-2 border-brand-green-bright">
              <img src={capturedImage} alt="Capture" className="w-full h-32 object-cover" />
              <div className="absolute top-2 right-2 bg-brand-green-bright text-white px-2 py-1 rounded text-[9px] font-black uppercase tracking-tighter">
                {t.capture_valid}
              </div>
            </div>
            <div className="bg-brand-green-light/10 dark:bg-brand-green-bright/5 rounded-xl p-4 border border-brand-green-bright/20">
              <p className="text-[9px] font-black text-brand-green-bright uppercase tracking-widest mb-3">
                {t.extraction_done}
              </p>
              <div className="space-y-2">
                {allFields.map(({ label, key }) => (
                  <div key={key} className="flex justify-between items-center gap-4 pb-2 border-b border-brand-green-bright/5 last:border-0 last:pb-0">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">{label}</span>
                    <span className={`text-xs font-black text-slate-900 dark:text-white ${isAr ? 'text-left' : 'text-right'}`}>
                      {ocrData?.[key] || '—'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <Btn variant="secondary" icon={RotateCcw} onClick={() => setPhase('choose')} fullWidth>{t.restart}</Btn>
              <Btn variant="success" icon={CheckCircle2} onClick={() => onDataExtracted(ocrData, capturedImage)} fullWidth>{t.validate_data}</Btn>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}