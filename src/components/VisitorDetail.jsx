import React, { useEffect, useState } from 'react';
import { User, Car, LogOut, ShieldCheck, AlertTriangle, XCircle, Globe } from 'lucide-react';
import { useApp } from '../context/useAppState';
import { Btn, StatusBadge, TypeBadge } from './UI';
import { TRANSLATIONS } from '../translations';
import { visitorService } from '../services/visitorService';
import { verifierFiabiliteDocument } from '../services/localOcrService';
import { formatBackendDate, formatBackendTime } from './VisitorTable';

const Row = ({ label, value, mono }) => (
  <div className="flex justify-between items-start py-2 border-b border-slate-100 dark:border-slate-800 last:border-0 gap-3">
    <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest shrink-0 mt-0.5">{label}</span>
    <span className={`text-xs font-bold text-slate-900 dark:text-slate-100 text-right ${mono ? 'font-mono' : ''}`}>
      {value || '—'}
    </span>
  </div>
);

export default function VisitorDetail({ visitor: initialVisitor, onClose, onCheckout }) {
  const { state } = useApp();
  const [visitor, setVisitor] = useState(initialVisitor);
  const [fetching, setFetching] = useState(false);
  const t = TRANSLATIONS[state.settings?.language || 'fr'];

  useEffect(() => {
    const fetchFullVisitor = async () => {
      const hasName = !!(initialVisitor.nom || initialVisitor.visiteur?.nom || initialVisitor.visitor?.nom || initialVisitor.visiteurId?.nom);
      const visiteurId = initialVisitor.visiteur?._id || initialVisitor.visiteur || initialVisitor.visiteurId || initialVisitor.visitorId;
      
      if (!hasName && typeof visiteurId === 'string' && visiteurId.length > 10) {
        setFetching(true);
        try {
          const data = await visitorService.getById(visiteurId);
          const fullVisitorData = data.visiteur || data;
          setVisitor(prev => ({ ...prev, ...fullVisitorData, visiteur: fullVisitorData }));
        } catch (err) {
          console.error("Erreur fetch visitor details:", err);
        } finally {
          setFetching(false);
        }
      }
    };
    fetchFullVisitor();
  }, [initialVisitor]);

  if (!visitor) return null;
  const isVehicule = visitor.type === 'vehicule';

  const visData = visitor.visiteur || visitor.visitor || visitor.visiteurId || visitor;
  const paysVal = visitor.pays || visData.pays || 'Sénégal';
  const auditDoc = verifierFiabiliteDocument({
    nom: visitor.nom || visData.nom,
    prenom: visitor.prenom || visData.prenom,
    numeroPiece: visitor.numeroPiece || visData.numeroPiece,
    typePiece: visitor.typePiece || visData.typePiece,
    nin: visitor.nin || visData.nin,
    sexe: visitor.sexe || visData.sexe,
    dateNaissance: visitor.dateNaissance || visData.dateNaissance,
    dateDelivrance: visitor.dateDelivrance || visData.dateDelivrance,
    dateExpiration: visitor.dateExpiration || visData.dateExpiration,
    pays: paysVal,
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Header card */}
      <div className={`
        relative overflow-hidden rounded-3xl p-6 flex items-center gap-5 border-2
        ${isVehicule 
          ? 'bg-brand-green-light/30 border-brand-green-bright/20' 
          : 'bg-brand-blue-light/30 border-brand-blue-bright/20'
        }
      `}>
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 ${isVehicule ? 'bg-brand-green-bright text-white' : 'bg-brand-blue-bright text-white'}`}>
          {isVehicule ? <Car size={32} /> : <User size={32} />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-black text-lg text-slate-900 dark:text-white truncate">
            {isVehicule 
              ? (visitor.vehicule?.immatriculation || visitor.numeroPiece || visData.numeroPiece || '—') 
              : `${visitor.nom || visData.nom || visitor.Nom || ''} ${visitor.prenom || visData.prenom || visitor.Prenom || ''}`.trim() || visitor.nomComplet || visitor.fullName || '—'}
          </p>
          <div className="flex gap-2 mt-2 flex-wrap">
            <StatusBadge statut={visitor.statut} heureSortie={visitor.heureSortie} />
            <TypeBadge type={visitor.type || (visitor.vehicule ? 'vehicule' : 'person')} />
            {!isVehicule && (
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 ${
                auditDoc.statut === 'conforme' ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300' :
                auditDoc.statut === 'attention' ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300' :
                'bg-rose-500/20 text-rose-700 dark:text-rose-300'
              }`}>
                {auditDoc.statut === 'conforme' && <ShieldCheck size={12} />}
                {auditDoc.statut === 'attention' && <AlertTriangle size={12} />}
                {auditDoc.statut === 'suspect' && <XCircle size={12} />}
                {auditDoc.statut === 'conforme' ? 'Doc Valide' : auditDoc.statut === 'attention' ? 'À vérifier' : 'Doc Suspect'}
              </span>
            )}
          </div>
        </div>
        <div className="text-right hidden sm:block">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.id_passage}</p>
          <p className="text-sm font-black font-mono text-slate-900 dark:text-white">{visitor.id || visitor._id}</p>
        </div>
      </div>

      {/* Photo if present */}
      {visitor.photo && (
        <div className="rounded-xl overflow-hidden border border-slate-100 dark:border-slate-800">
          <img src={visitor.photo} alt={t.scanned_doc} className="w-full h-40 object-cover" />
        </div>
      )}

      {/* Details */}
      <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-2 px-5">
        {isVehicule ? (
          <>
            <Row label={t.license_plate} value={visitor.vehicule?.immatriculation || visitor.numeroPiece || visData.numeroPiece} mono />
            <Row label={t.brand_model} value={`${visitor.vehicule?.marque || visData.marque || ''} ${visitor.vehicule?.modele || visData.modele || ''}`.trim() || '—'} />
            <Row label={t.color} value={visitor.vehicule?.couleur || visData.couleur} />
            <Row label={t.id_type} value={visitor.vehicule?.typeVehicule || visitor.typePiece || visData.typePiece || t.id_types?.carte_grise} />
            {(visitor.nom || visData.nom || visitor.Nom) && <Row label={t.driver} value={`${visitor.nom || visData.nom || ''} ${visitor.prenom || visData.prenom || ''}`.trim()} />}
          </>
        ) : (
          <>
            <Row label={t.fullname} value={fetching ? '...' : (`${visitor.nom || visData.nom || visitor.Nom || ''} ${visitor.prenom || visData.prenom || visitor.Prenom || ''}`.trim() || visitor.nomComplet || visitor.fullName || '—')} />
            <Row label={t.id_number} value={fetching ? '...' : (visitor.numeroPiece || visData.numeroPiece)} mono />
            <Row label={t.id_type} value={fetching ? '...' : (visitor.typePiece || visData.typePiece)} />
            <Row label="Pays d'émission" value={fetching ? '...' : paysVal} />
            {(visitor.dateNaissance || visData.dateNaissance) && (
              <Row label={t.birth_date} value={fetching ? '...' : formatBackendDate(visitor.dateNaissance || visData.dateNaissance)} />
            )}
            {/* NIN — Backend v2 */}
            {(visitor.nin || visData.nin) && (
              <Row label="NIN" value={fetching ? '...' : (visitor.nin || visData.nin)} mono />
            )}
            {(visitor.dateExpiration || visData.dateExpiration) && (
              <Row label={t.expiration_date || "Date d'expiration"} value={fetching ? '...' : formatBackendDate(visitor.dateExpiration || visData.dateExpiration)} />
            )}
            {(visitor.telephone || visData.telephone) && (
              <Row label={t.phone || "Téléphone"} value={fetching ? '...' : (visitor.telephone || visData.telephone)} mono />
            )}
          </>
        )}
        <Row label={t.host_name} value={visitor.personneVisitee || visitor.hote || visitor.visitedPerson} />
        <Row label={t.service} value={visitor.service || visitor.departement} />
        <Row label={t.date} value={visitor.date || formatBackendDate(visitor.createdAt)} />
        <Row label={t.entry_time} value={formatBackendTime(visitor.heureEntree || visitor.createdAt)} />
        {visitor.heureSortie && <Row label={t.exit_time} value={formatBackendTime(visitor.heureSortie || visitor.updatedAt)} />}
      </div>

      {(() => {
        const s = String(visitor.statut || '').toLowerCase();
        const isPresent = (s === 'present' || s === 'en-cours' || s === 'en cours' || s === 'on-site') || (!visitor.heureSortie && s !== 'sorti' && s !== 'sortis');
        return isPresent && (
          <Btn variant="warning" icon={LogOut} onClick={() => { onCheckout(visitor.id || visitor._id); onClose(); }} fullWidth size="lg">
            {t.mark_exit}
          </Btn>
        );
      })()}
    </div>
  );
}
