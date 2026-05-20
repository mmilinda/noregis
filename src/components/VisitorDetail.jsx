import React, { useEffect, useState } from 'react';
import { User, Car, LogOut } from 'lucide-react';
import { useApp } from '../context/useAppState';
import { Btn, StatusBadge, TypeBadge } from './UI';
import { TRANSLATIONS } from '../translations';
import { visitorService } from '../services/visitorService';
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
              ? (visitor.vehicule?.immatriculation || visitor.numeroPiece || visitor.visiteur?.numeroPiece || visitor.visitor?.numeroPiece || visitor.visiteurId?.numeroPiece || visitor.visitorId?.numeroPiece || '—') 
              : `${visitor.nom || visitor.visiteur?.nom || visitor.visitor?.nom || visitor.visiteurId?.nom || visitor.visitorId?.nom || visitor.Nom || visitor.lastName || visitor.name || ''} ${visitor.prenom || visitor.visiteur?.prenom || visitor.visitor?.prenom || visitor.visiteurId?.prenom || visitor.visitorId?.prenom || visitor.Prenom || visitor.firstName || ''}`.trim() || visitor.nomComplet || visitor.fullName || '—'}
          </p>
          <div className="flex gap-2 mt-2 flex-wrap">
            <StatusBadge statut={visitor.statut} heureSortie={visitor.heureSortie} />
            <TypeBadge type={visitor.type || (visitor.vehicule ? 'vehicule' : 'person')} />
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
            <Row label={t.license_plate} value={visitor.vehicule?.immatriculation || visitor.numeroPiece || visitor.visiteur?.numeroPiece || visitor.visitor?.numeroPiece || visitor.visiteurId?.numeroPiece || visitor.visitorId?.numeroPiece} mono />
            <Row label={t.brand_model} value={`${visitor.vehicule?.marque || visitor.visiteur?.marque || visitor.visitor?.marque || visitor.visiteurId?.marque || visitor.visitorId?.marque || ''} ${visitor.vehicule?.modele || visitor.visiteur?.modele || visitor.visitor?.modele || visitor.visiteurId?.modele || visitor.visitorId?.modele || ''}`.trim() || '—'} />
            <Row label={t.color} value={visitor.vehicule?.couleur || visitor.visiteur?.couleur || visitor.visitor?.couleur || visitor.visiteurId?.couleur} />
            <Row label={t.id_type} value={visitor.vehicule?.typeVehicule || visitor.typePiece || visitor.visiteur?.typePiece || visitor.visitor?.typePiece || visitor.visiteurId?.typePiece || t.id_types?.carte_grise} />
            {(visitor.nom || visitor.visiteur?.nom || visitor.visitor?.nom || visitor.visiteurId?.nom || visitor.lastName || visitor.Nom) && <Row label={t.driver} value={`${visitor.nom || visitor.visiteur?.nom || visitor.visitor?.nom || visitor.visiteurId?.nom || visitor.visitorId?.nom || visitor.Nom || visitor.lastName || ''} ${visitor.prenom || visitor.visiteur?.prenom || visitor.visitor?.prenom || visitor.visiteurId?.prenom || visitor.visitorId?.prenom || visitor.Prenom || visitor.firstName || ''}`.trim()} />}
          </>
        ) : (
          <>
            <Row label={t.fullname} value={fetching ? '...' : (`${visitor.nom || visitor.visiteur?.nom || visitor.visitor?.nom || visitor.visiteurId?.nom || visitor.visitorId?.nom || visitor.Nom || visitor.lastName || visitor.name || ''} ${visitor.prenom || visitor.visiteur?.prenom || visitor.visitor?.prenom || visitor.visiteurId?.prenom || visitor.visitorId?.prenom || visitor.Prenom || visitor.firstName || ''}`.trim() || visitor.nomComplet || visitor.fullName || '—')} />
            <Row label={t.id_number} value={fetching ? '...' : (visitor.numeroPiece || visitor.visiteur?.numeroPiece || visitor.visitor?.numeroPiece || visitor.visiteurId?.numeroPiece || visitor.visitorId?.numeroPiece)} mono />
            <Row label={t.id_type} value={fetching ? '...' : (visitor.typePiece || visitor.visiteur?.typePiece || visitor.visitor?.typePiece || visitor.visiteurId?.typePiece)} />
            {(visitor.dateNaissance || visitor.visiteur?.dateNaissance || visitor.visitor?.dateNaissance || visitor.visiteurId?.dateNaissance) && (
              <Row label={t.birth_date} value={fetching ? '...' : formatBackendDate(visitor.dateNaissance || visitor.visiteur?.dateNaissance || visitor.visitor?.dateNaissance || visitor.visiteurId?.dateNaissance)} />
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
