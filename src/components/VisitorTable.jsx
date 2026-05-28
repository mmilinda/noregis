import React, { useState } from 'react';
import { ChevronUp, ChevronDown, Eye, LogOut, User, Car, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { useApp } from '../context/useAppState';
import { Btn, StatusBadge, TypeBadge } from './UI';
import { TRANSLATIONS } from '../translations';

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
    className="px-4 py-3.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5 transition-colors select-none"
  >
    <div className="flex items-center gap-1.5">
      {label}
      <div className="flex flex-col -gap-1">
        <ChevronUp size={8} className={sortBy === col && sortDir === 'asc' ? 'text-brand-blue-bright' : 'opacity-20'} />
        <ChevronDown size={8} className={sortBy === col && sortDir === 'desc' ? 'text-brand-blue-bright' : 'opacity-20'} />
      </div>
    </div>
  </th>
);

/* ── PAGINATION ─────────────────────────────── */
function Pagination({ currentPage, totalPages, onPageChange, totalItems, perPage }) {
  const pages = [];
  const maxVisible = 4;

  for (let i = 1; i <= Math.min(totalPages, maxVisible); i++) {
    pages.push(i);
  }
  if (totalPages > maxVisible) pages.push('...');

  return (
    <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-100 dark:border-slate-800">
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <span className="font-semibold">Showing</span>
        <span className="font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">{currentPage}</span>
        <span className="font-semibold">Out of {totalItems}</span>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronLeft size={14} /> Previous
        </button>

        {pages.map((p, idx) =>
          p === '...' ? (
            <span key={idx} className="px-2 text-slate-400 text-xs">•••</span>
          ) : (
            <button
              key={idx}
              onClick={() => onPageChange(p)}
              className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold transition-all ${
                currentPage === p
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-600 shadow-sm'
                  : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {p}
            </button>
          )
        )}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Next <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}

/* ── Helper: get visitor display name ────────── */
function getVisitorName(v) {
  if (v.type === 'vehicule') {
    return v.vehicule?.immatriculation || v.numeroPiece || v.visiteur?.numeroPiece || v.visitor?.numeroPiece || v.visiteurId?.numeroPiece || v.visitorId?.numeroPiece || '—';
  }
  return `${v.nom || v.visiteur?.nom || v.visitor?.nom || v.visiteurId?.nom || v.visitorId?.nom || v.Nom || v.lastName || v.name || ''} ${v.prenom || v.visiteur?.prenom || v.visitor?.prenom || v.visiteurId?.prenom || v.visitorId?.prenom || v.Prenom || v.firstName || ''}`.trim() || v.nomComplet || v.fullName || '—';
}

function getInitials(v) {
  const name = getVisitorName(v);
  const parts = name.split(' ').filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

/* ── MAIN TABLE ─────────────────────────────── */
export default function VisitorTable({ visitors, onView, onCheckout, compact }) {
  const { state } = useApp();
  const t = TRANSLATIONS[state.settings?.language || 'fr'];
  const [sortBy, setSortBy] = useState('heureEntree');
  const [sortDir, setSortDir] = useState('desc');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 10;

  const toggleSort = (col) => {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(col); setSortDir('asc'); }
  };

  const sorted = [...visitors].sort((a, b) => {
    const va = String(a[sortBy] || '');
    const vb = String(b[sortBy] || '');
    return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
  });

  const totalPages = Math.max(1, Math.ceil(sorted.length / perPage));
  const safePage = Math.min(currentPage, totalPages);
  const paginated = sorted.slice((safePage - 1) * perPage, safePage * perPage);

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === paginated.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginated.map(v => v._id || v.id)));
    }
  };

  const avatarColors = [
    'from-blue-400 to-blue-600',
    'from-emerald-400 to-emerald-600',
    'from-amber-400 to-amber-600',
    'from-rose-400 to-rose-600',
    'from-violet-400 to-violet-600',
    'from-cyan-400 to-cyan-600',
  ];

  const getAvatarColor = (v) => {
    const name = getVisitorName(v);
    const idx = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % avatarColors.length;
    return avatarColors[idx];
  };

  if (!compact) {
    return (
      <div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40">
                <th className="px-4 py-3.5 w-10">
                  <input
                    type="checkbox"
                    checked={paginated.length > 0 && selectedIds.size === paginated.length}
                    onChange={toggleAll}
                    className="w-4 h-4 rounded border-slate-300 text-brand-blue-bright focus:ring-brand-blue-bright/20 cursor-pointer accent-brand-blue-bright"
                  />
                </th>
                <Th label={t.type} col="type" sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} />
                <Th label={`${t.person} / ${t.vehicle}`} col="nom" sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} />
                <Th label={`${t.id_card} / ${t.plate_number}`} col="numeroPiece" sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} />
                <Th label={t.destination} col="personneVisitee" sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} />
                <Th label={t.time} col="heureEntree" sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} />
                <Th label={t.status} col="statut" sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} />
                <th className="px-4 py-3.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wide text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {paginated.map(v => {
                const vid = v._id || v.id;
                const isSelected = selectedIds.has(vid);
                return (
                  <tr key={vid} className={`group transition-colors ${isSelected ? 'bg-blue-50/50 dark:bg-blue-900/10' : 'hover:bg-slate-50/70 dark:hover:bg-white/[0.02]'}`}>
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(vid)}
                        className="w-4 h-4 rounded border-slate-300 text-brand-blue-bright focus:ring-brand-blue-bright/20 cursor-pointer accent-brand-blue-bright"
                      />
                    </td>
                    <td className="px-4 py-3"><TypeBadge type={v.type} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${getAvatarColor(v)} flex items-center justify-center text-white text-[10px] font-bold shrink-0`}>
                          {v.type === 'vehicule' ? <Car size={14} /> : getInitials(v)}
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-slate-800 dark:text-slate-100">{getVisitorName(v)}</p>
                          {v.type === 'vehicule' && <p className="text-[10px] text-slate-400 font-medium">{v.vehicule?.marque || v.visitor?.marque || v.visiteur?.marque || v.visiteurId?.marque} {v.vehicule?.modele || v.visitor?.modele || v.visiteur?.modele || v.visiteurId?.modele}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs font-medium font-mono text-slate-600 dark:text-slate-400">
                        {v.numeroPiece || v.visiteur?.numeroPiece || v.visitor?.numeroPiece || v.visiteurId?.numeroPiece || v.visitorId?.numeroPiece || v.vehicule?.immatriculation || '—'}
                      </p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                        {v.typePiece || v.visiteur?.typePiece || v.visitor?.typePiece || v.visiteurId?.typePiece || (v.vehicule ? 'CARTE GRISE' : 'CNI')}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs font-medium text-slate-700 dark:text-slate-200">{v.personneVisitee || v.hote || v.visitedPerson || '—'}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{v.service || v.departement}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-[9px] font-medium text-slate-400 uppercase tracking-wider">
                        {formatBackendDate(v.heureEntree || v.createdAt)}
                      </p>
                      <p className="text-xs font-bold font-mono text-slate-700 dark:text-slate-200">
                        {formatBackendTime(v.heureEntree || v.createdAt)}
                      </p>
                      {(v.heureSortie || (String(v.statut || '').toLowerCase() === 'sorti' && v.updatedAt)) && (
                        <p className="text-[9px] text-slate-400 mt-0.5 font-mono">
                          → {formatBackendTime(v.heureSortie || v.updatedAt)}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3"><StatusBadge statut={v.statut} heureSortie={v.heureSortie} /></td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 justify-end">
                        <button onClick={() => onView(v)} className="p-1.5 rounded-lg text-slate-400 hover:text-brand-blue-bright hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all">
                          <Eye size={16} />
                        </button>
                        {(() => {
                          const s = String(v.statut || '').toLowerCase();
                          const isPresent = (s === 'present' || s === 'en-cours' || s === 'en cours' || s === 'on-site') || (!v.heureSortie && s !== 'sorti' && s !== 'sortis');
                          return isPresent && (
                            <button
                              onClick={() => onCheckout(v.id || v._id)}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-600 border border-amber-200 rounded-lg text-[10px] font-bold uppercase hover:bg-amber-100 transition-all active:scale-95"
                            >
                              <LogOut size={12} /> {t.exited}
                            </button>
                          );
                        })()}
                        <button className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {sorted.length > perPage && (
          <Pagination
            currentPage={safePage}
            totalPages={totalPages}
            onPageChange={(p) => setCurrentPage(Math.max(1, Math.min(totalPages, p)))}
            totalItems={sorted.length}
            perPage={perPage}
          />
        )}
      </div>
    );
  }

  // Compact / mobile view
  return (
    <div className="flex flex-col divide-y divide-slate-100 dark:divide-slate-800">
      {sorted.map(v => (
        <div key={v._id || v.id} onClick={() => onView(v)} className="flex items-start gap-3 p-3.5 active:bg-slate-50 dark:active:bg-slate-900 transition-colors cursor-pointer group">
          <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${getAvatarColor(v)} flex items-center justify-center shrink-0 text-white text-xs font-bold`}>
            {v.type === 'vehicule' ? <Car size={18} /> : getInitials(v)}
          </div>
          <div className="flex-1 min-w-0 py-0.5">
            <p className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate tracking-tight">{getVisitorName(v)}</p>
            <p className="text-[10px] text-slate-500 font-medium truncate mt-0.5">
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
            {(() => {
              const s = String(v.statut || '').toLowerCase();
              const isPresent = (s === 'present' || s === 'en-cours' || s === 'en cours' || s === 'on-site') || (!v.heureSortie && s !== 'sorti' && s !== 'sortis');
              return isPresent && (
                <button
                  onClick={e => { e.stopPropagation(); onCheckout(v.id || v._id); }}
                  className="px-2 py-1 bg-amber-50 text-amber-600 border border-amber-200 rounded-md text-[9px] font-bold uppercase flex items-center justify-center gap-1 active:scale-90 transition-all"
                >
                  <LogOut size={10} /> {t.exited}
                </button>
              );
            })()}
          </div>
        </div>
      ))}
    </div>
  );
}
