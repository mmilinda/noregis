import React, { useState } from 'react';
import { ChevronUp, ChevronDown, Eye, LogOut, User, Car, Trash2, AlertTriangle } from 'lucide-react';
import { useApp } from '../context/useAppState';
import { Btn, StatusBadge, TypeBadge, Modal } from './UI';
import { TRANSLATIONS } from '../translations';
import { visitService } from '../services/visitService';

// Helper pour formater les dates ISO du backend
export const formatBackendDate = (dateStr) => {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('fr-FR');
  } catch {
    return dateStr;
  }
};

export const formatBackendTime = (dateStr) => {
  if (!dateStr) return '—';
  if (/^\d{2}:\d{2}$/.test(dateStr)) return dateStr;
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return dateStr;
  }
};

const Th = ({ label, col, sortBy, sortDir, onSort }) => (
  <th 
    onClick={() => onSort(col)} 
    className="px-4 py-3 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5 transition-colors select-none"
  >
    <div className="flex items-center gap-1.5">
      {label}
      <div className="flex flex-col -gap-1">
        <ChevronUp size={8} className={sortBy === col && sortDir === 'asc' ? 'text-brand-blue-bright' : 'opacity-10'} />
        <ChevronDown size={8} className={sortBy === col && sortDir === 'desc' ? 'text-brand-blue-bright' : 'opacity-10'} />
      </div>
    </div>
  </th>
);

export default function VisitorTable({ visitors, onView, onCheckout, onDelete, compact }) {
  const { state, dispatch, notify } = useApp();
  const t = TRANSLATIONS[state.settings?.language || 'fr'];
  const [sortBy, setSortBy] = useState('heureEntree');
  const [sortDir, setSortDir] = useState('desc');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const isAdmin = state.agent?.role === 'ADMIN' || !!onDelete;

  const toggleSort = (col) => {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(col); setSortDir('asc'); }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    const id = deleteTarget._id || deleteTarget.id;
    setDeleting(true);
    try {
      if (onDelete) {
        await onDelete(id);
      } else {
        await visitService.deleteVisit(id);
        dispatch({ type: 'DELETE_VISIT', payload: id });
      }
      notify('success', 'Visite supprimée avec succès.');
      setDeleteTarget(null);
    } catch (err) {
      notify('error', 'Erreur lors de la suppression : ' + (err.message || err));
    } finally {
      setDeleting(false);
    }
  };

  const sorted = [...visitors].sort((a, b) => {
    const va = String(a[sortBy] || '');
    const vb = String(b[sortBy] || '');
    return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
  });

  return (
    <>
      {!compact ? (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-slate-50 dark:border-slate-800">
                <Th label={t.type} col="type" sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} />
                <Th label={`${t.person} / ${t.vehicle}`} col="nom" sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} />
                <Th label={`${t.id_card} / ${t.plate_number}`} col="numeroPiece" sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} />
                <Th label={t.destination} col="personneVisitee" sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} />
                <Th label={t.time} col="heureEntree" sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} />
                <Th label={t.status} col="statut" sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} />
                <th className="px-5 py-4" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {sorted.map(v => (
                <tr key={v._id || v.id} className="group hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-2.5"><TypeBadge type={v.type} /></td>
                  <td className="px-4 py-2.5">
                    <p className="font-bold text-xs text-slate-900 dark:text-slate-100">
                      {v.type === 'vehicule' 
                        ? (v.vehicule?.immatriculation || v.numeroPiece || v.visiteur?.numeroPiece || v.visitor?.numeroPiece || v.visiteurId?.numeroPiece || v.visitorId?.numeroPiece) 
                        : `${v.nom || v.visiteur?.nom || v.visitor?.nom || v.visiteurId?.nom || v.visitorId?.nom || v.Nom || v.lastName || v.name || ''} ${v.prenom || v.visiteur?.prenom || v.visitor?.prenom || v.visiteurId?.prenom || v.visitorId?.prenom || v.Prenom || v.firstName || ''}`.trim() || v.nomComplet || v.fullName || '—'}
                    </p>
                    {v.type === 'vehicule' && <p className="text-[10px] text-slate-500 font-medium">{v.vehicule?.marque || v.visitor?.marque || v.visiteur?.marque || v.visiteurId?.marque} {v.vehicule?.modele || v.visitor?.modele || v.visiteur?.modele || v.visiteurId?.modele}</p>}
                  </td>
                  <td className="px-4 py-2.5">
                    <p className="text-[10px] font-bold font-mono text-slate-600 dark:text-slate-400">
                      {v.numeroPiece || v.visiteur?.numeroPiece || v.visitor?.numeroPiece || v.visiteurId?.numeroPiece || v.visitorId?.numeroPiece || v.vehicule?.immatriculation || '—'}
                    </p>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">
                      {v.typePiece || v.visiteur?.typePiece || v.visitor?.typePiece || v.visiteurId?.typePiece || (v.vehicule ? 'CARTE GRISE' : 'CNI')}
                    </p>
                  </td>
                  <td className="px-4 py-2.5">
                    <p className="text-[10px] font-bold text-slate-800 dark:text-slate-200">{v.personneVisitee || v.hote || v.visitedPerson || '—'}</p>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">{v.service || v.departement}</p>
                  </td>
                  <td className="px-4 py-2.5">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                      {formatBackendDate(v.heureEntree || v.createdAt)}
                    </p>
                    <p className="text-xs font-black font-mono text-slate-800 dark:text-slate-200">
                      {formatBackendTime(v.heureEntree || v.createdAt)}
                    </p>
                    {(v.heureSortie || (String(v.statut || '').toLowerCase() === 'sorti' && v.updatedAt)) && (
                      <p className="text-[9px] text-slate-400 mt-0.5 font-mono">
                        → {formatBackendTime(v.heureSortie || v.updatedAt)}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-2.5"><StatusBadge statut={v.statut} heureSortie={v.heureSortie} /></td>
                  <td className="px-5 py-4">
                    <div className="flex gap-1.5 justify-end items-center">
                      <Btn variant="ghost" size="sm" icon={Eye} onClick={() => onView(v)} className="rounded-full w-8 h-8 !p-0" />
                      {(() => {
                        const s = String(v.statut || '').toLowerCase();
                        const isPresent = (s === 'present' || s === 'en-cours' || s === 'en cours' || s === 'on-site') || (!v.heureSortie && s !== 'sorti' && s !== 'sortis');
                        return isPresent && (
                          <button 
                            onClick={() => onCheckout(v.id || v._id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-amber-bright text-white border border-brand-amber-bright rounded-lg text-[10px] font-black uppercase hover:bg-amber-600 transition-all active:scale-95"
                          >
                            <LogOut size={12} /> {t.exited}
                          </button>
                        );
                      })()}
                      {isAdmin && (
                        <button
                          type="button"
                          title="Supprimer la visite"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteTarget(v);
                          }}
                          className="w-8 h-8 rounded-full flex items-center justify-center text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* Compact / mobile view */
        <div className="flex flex-col divide-y divide-slate-100 dark:divide-slate-800">
          {sorted.map(v => (
            <div key={v._id || v.id} onClick={() => onView(v)} className="flex items-start gap-3 p-3 active:bg-slate-50 dark:active:bg-slate-900 transition-colors cursor-pointer group">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${v.type === 'vehicule' ? 'bg-brand-green-light text-brand-green' : 'bg-brand-blue-light text-brand-blue'}`}>
                {v.type === 'vehicule' ? <Car size={20} /> : <User size={20} />}
              </div>
              <div className="flex-1 min-w-0 py-0.5">
                <p className="font-black text-xs text-slate-900 dark:text-slate-100 truncate tracking-tight">
                  {v.type === 'vehicule' 
                    ? (v.vehicule?.immatriculation || v.numeroPiece || v.visiteur?.numeroPiece || v.visitor?.numeroPiece || v.visiteurId?.numeroPiece || v.visitorId?.numeroPiece || '—') 
                    : `${v.nom || v.visiteur?.nom || v.visitor?.nom || v.visiteurId?.nom || v.visitorId?.nom || v.Nom || v.lastName || v.name || ''} ${v.prenom || v.visiteur?.prenom || v.visitor?.prenom || v.visiteurId?.prenom || v.visitorId?.prenom || v.Prenom || v.firstName || ''}`.trim() || v.nomComplet || v.fullName || '—'}
                </p>
                <p className="text-[10px] text-slate-500 font-bold truncate mt-0.5">
                  <span className="text-slate-400">{t.to} :</span> {v.personneVisitee || v.hote || v.visitedPerson || '—'}
                </p>
                <p className="text-[9px] text-slate-400 font-medium mt-0.5">
                  {formatBackendDate(v.heureEntree || v.createdAt)} · {formatBackendTime(v.heureEntree || v.createdAt)}
                  {(v.heureSortie || (String(v.statut || '').toLowerCase() === 'sorti' && v.updatedAt)) && (
                    <> · → {formatBackendTime(v.heureSortie || v.updatedAt)}</>
                  )}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1.5 shrink-0 pt-0.5">
                <StatusBadge statut={v.statut} heureSortie={v.heureSortie} />
                <div className="flex items-center gap-1">
                  {(() => {
                    const s = String(v.statut || '').toLowerCase();
                    const isPresent = (s === 'present' || s === 'en-cours' || s === 'en cours' || s === 'on-site') || (!v.heureSortie && s !== 'sorti' && s !== 'sortis');
                    return isPresent && (
                      <button 
                        onClick={e => { e.stopPropagation(); onCheckout(v.id || v._id); }}
                        className="px-2 py-1 bg-brand-amber-bright text-white border border-brand-amber-bright rounded-md text-[9px] font-black uppercase flex items-center justify-center gap-1 active:scale-90 transition-all"
                      >
                        <LogOut size={10} /> {t.exited}
                      </button>
                    );
                  })()}
                  {isAdmin && (
                    <button
                      type="button"
                      title="Supprimer"
                      onClick={e => { e.stopPropagation(); setDeleteTarget(v); }}
                      className="p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-md transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de confirmation de suppression */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Supprimer la visite"
        size="sm"
      >
        <div className="space-y-4">
          <div className="p-4 bg-red-50 dark:bg-red-950/30 rounded-2xl border border-red-200 dark:border-red-800/50 flex items-start gap-3 text-red-600 dark:text-red-400">
            <AlertTriangle size={20} className="shrink-0 mt-0.5" />
            <div className="text-xs">
              <p className="font-bold">Confirmation de suppression</p>
              <p className="mt-1">
                Êtes-vous sûr de vouloir supprimer définitivement la visite de <strong>
                  {deleteTarget?.nom || deleteTarget?.visiteur?.nom || deleteTarget?.vehicule?.immatriculation || 'ce visiteur'}
                </strong> ? Cette action est irréversible.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Btn variant="secondary" size="sm" onClick={() => setDeleteTarget(null)}>
              Annuler
            </Btn>
            <Btn variant="danger" size="sm" icon={Trash2} loading={deleting} onClick={handleDeleteConfirm}>
              Supprimer
            </Btn>
          </div>
        </div>
      </Modal>
    </>
  );
}

