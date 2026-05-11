import { useState, useEffect, useCallback } from 'react';
import {
  Users, User, Car, UserCheck, UserX, Clock, Plus, LogOut,
  Eye, Search, Download, RefreshCw, Calendar,
  ChevronDown, ChevronUp
  } from 'lucide-react';
import { useApp } from '../context/useAppState';
import { StatCard, Card, CardHeader, StatusBadge, TypeBadge, Btn, EmptyState, Modal } from '../components/UI';
import { RegistrationModal } from '../components/RegistrationModal';
import { visitorService } from '../services/visitorService';
import { TRANSLATIONS } from '../translations';


/* ============================================
   VISITOR DETAIL MODAL
============================================ */
const Row = ({ label, value, mono }) => (
  <div className="flex justify-between items-start py-2 border-b border-slate-100 dark:border-slate-800 last:border-0 gap-3">
    <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest shrink-0 mt-0.5">{label}</span>
    <span className={`text-xs font-bold text-slate-900 dark:text-slate-100 text-right ${mono ? 'font-mono' : ''}`}>
      {value || '—'}
    </span>
  </div>
);

function VisitorDetail({ visitor, onClose, onCheckout }) {
  const { state } = useApp();
  const t = TRANSLATIONS[state.settings?.language || 'fr'];
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
            {isVehicule ? visitor.vehicule?.immatriculation : `${visitor.nom} ${visitor.prenom}`}
          </p>
          <div className="flex gap-2 mt-2 flex-wrap">
            <StatusBadge statut={visitor.statut} />
            <TypeBadge type={visitor.type} />
          </div>
        </div>
        <div className="text-right hidden sm:block">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.id_passage}</p>
          <p className="text-sm font-black font-mono text-slate-900 dark:text-white">{visitor.id}</p>
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
            <Row label={t.license_plate} value={visitor.vehicule?.immatriculation} mono />
            <Row label={t.brand_model} value={`${visitor.vehicule?.marque || ''} ${visitor.vehicule?.modele || ''}`.trim()} />
            <Row label={t.color} value={visitor.vehicule?.couleur} />
            <Row label={t.id_type} value={visitor.vehicule?.typeVehicule} />
            {visitor.nom && <Row label={t.driver} value={`${visitor.nom} ${visitor.prenom}`} />}
          </>
        ) : (
          <>
            <Row label={t.fullname} value={`${visitor.nom} ${visitor.prenom}`} />
            <Row label={t.id_number} value={visitor.numeroPiece} mono />
            <Row label={t.id_type} value={visitor.typePiece} />
            {visitor.dateNaissance && <Row label={t.birth_date} value={visitor.dateNaissance} />}
          </>
        )}
        <Row label={t.host_name} value={visitor.personneVisitee} />
        <Row label={t.service} value={visitor.service} />
        <Row label={t.date} value={visitor.date} />
        <Row label={t.entry_time} value={visitor.heureEntree} />
        {visitor.heureSortie && <Row label={t.exit_time} value={visitor.heureSortie} />}
      </div>

      {visitor.statut === 'present' && (
        <Btn variant="warning" icon={LogOut} onClick={() => { onCheckout(visitor.id); onClose(); }} fullWidth size="lg">
          {t.mark_exit}
        </Btn>
      )}
    </div>
  );
}

/* ============================================
   TABLEAU DES VISITEURS
============================================ */
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

function VisitorTable({ visitors, onView, onCheckout, compact }) {
  const { state } = useApp();
  const t = TRANSLATIONS[state.settings?.language || 'fr'];
  const [sortBy, setSortBy] = useState('heureEntree');
  const [sortDir, setSortDir] = useState('desc');

  const toggleSort = (col) => {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(col); setSortDir('asc'); }
  };

  const sorted = [...visitors].sort((a, b) => {
    const va = String(a[sortBy] || '');
    const vb = String(b[sortBy] || '');
    return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
  });

  if (!compact) {
    return (
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
              <tr key={v.id} className="group hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                <td className="px-4 py-2.5"><TypeBadge type={v.type} /></td>
                <td className="px-4 py-2.5">
                  <p className="font-bold text-xs text-slate-900 dark:text-slate-100">
                    {v.type === 'vehicule' ? v.vehicule?.immatriculation : `${v.nom} ${v.prenom}`}
                  </p>
                  {v.type === 'vehicule' && <p className="text-[10px] text-slate-500 font-medium">{v.vehicule?.marque} {v.vehicule?.modele}</p>}
                </td>
                <td className="px-4 py-2.5">
                  <p className="text-[10px] font-bold font-mono text-slate-600 dark:text-slate-400">{v.numeroPiece || v.vehicule?.immatriculation || '—'}</p>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">{v.typePiece}</p>
                </td>
                <td className="px-4 py-2.5">
                  <p className="text-[10px] font-bold text-slate-800 dark:text-slate-200">{v.personneVisitee}</p>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">{v.service}</p>
                </td>
                <td className="px-4 py-2.5 text-[10px] font-bold font-mono">
                  {v.heureEntree}
                  {v.heureSortie && <p className="text-[9px] text-slate-400 mt-0.5">→ {v.heureSortie}</p>}
                </td>
                <td className="px-4 py-2.5"><StatusBadge statut={v.statut} /></td>
                <td className="px-5 py-4">
                  <div className="flex gap-1 justify-end">
                    <Btn variant="ghost" size="sm" icon={Eye} onClick={() => onView(v)} className="rounded-full w-8 h-8 !p-0" />
                    {v.statut === 'present' && (
                      <button 
                        onClick={() => onCheckout(v.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-amber-bright text-white border border-brand-amber-bright rounded-lg text-[10px] font-black uppercase hover:bg-amber-600 transition-all active:scale-95"
                      >
                        <LogOut size={12} /> {t.exited}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // Compact / mobile view
  return (
    <div className="flex flex-col divide-y divide-slate-100 dark:divide-slate-800">
      {sorted.map(v => (
        <div key={v.id} onClick={() => onView(v)} className="flex items-start gap-3 p-3 active:bg-slate-50 dark:active:bg-slate-900 transition-colors cursor-pointer group">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${v.type === 'vehicule' ? 'bg-brand-green-light text-brand-green' : 'bg-brand-blue-light text-brand-blue'}`}>
            {v.type === 'vehicule' ? <Car size={20} /> : <User size={20} />}
          </div>
          <div className="flex-1 min-w-0 py-0.5">
            <p className="font-black text-xs text-slate-900 dark:text-slate-100 truncate tracking-tight">
              {v.type === 'vehicule' ? v.vehicule?.immatriculation : `${v.nom} ${v.prenom}`}
            </p>
            <p className="text-[10px] text-slate-500 font-bold truncate mt-0.5">
              <span className="text-slate-400">{t.to} :</span> {v.personneVisitee}
            </p>
            <p className="text-[9px] text-slate-400 font-medium mt-0.5">
              {t.entry_time} : {v.heureEntree} {v.heureSortie && ` • ${t.exit_time} : ${v.heureSortie}`}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1.5 shrink-0 pt-0.5">
            <StatusBadge statut={v.statut} />
            {v.statut === 'present' && (
              <button 
                onClick={e => { e.stopPropagation(); onCheckout(v.id); }}
                className="px-2 py-1 bg-brand-amber-bright text-white border border-brand-amber-bright rounded-md text-[9px] font-black uppercase flex items-center justify-center gap-1 active:scale-90 transition-all"
              >
                <LogOut size={10} /> {t.exited}
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}


/* ============================================
   PAGE DASHBOARD
============================================ */
export function Dashboard({ isMobile }) {
  const { state, dispatch, notify } = useApp();
  const { visitors, searchQuery, filterStatus, settings } = state;
  const t = TRANSLATIONS[settings?.language || 'fr'];
  const [regOpen, setRegOpen] = useState(false);
  const [detailVisitor, setDetailVisitor] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [loading, setLoading] = useState(true); // Initialisé à true pour éviter le setState synchrone dans useEffect

  const fetchVisitors = useCallback(async (isRefresh = false) => {
    if (isRefresh) setLoading(true);
    try {
      const data = await visitorService.getAll();
      dispatch({ type: 'SET_VISITORS', payload: data.visiteurs || [] });
      if (isRefresh) notify('info', t.refresh_ok);
    } catch (err) {
      notify('error', err.message || t.api_error);
    } finally {
      setLoading(false);
    }
  }, [dispatch, notify, t]);

  useEffect(() => {
    let ignore = false;

    const loadData = async () => {
      try {
        const data = await visitorService.getAll();
        if (!ignore) {
          dispatch({ type: 'SET_VISITORS', payload: data.visiteurs || [] });
        }
      } catch {
        if (!ignore) notify('error', t.load_error);
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    loadData();
    return () => { ignore = true; };
  }, [dispatch, notify, t]);

  // Stats
  const total = visitors.length;
  const present = visitors.filter(v => v.statut === 'present').length;
  const sortis = visitors.filter(v => v.statut === 'sorti').length;
  const vehicules = visitors.filter(v => v.type === 'vehicule').length;

  // Filter
  const filtered = visitors.filter(v => {
    const q = searchQuery.toLowerCase();
    const matchSearch = !q || [v.nom, v.prenom, v.numeroPiece, v.vehicule?.immatriculation, v.personneVisitee, v.service]
      .filter(Boolean).some(f => f.toLowerCase().includes(q));
    const matchStatus = filterStatus === 'all' || v.statut === filterStatus;
    const matchType = filterType === 'all' || v.type === filterType;
    return matchSearch && matchStatus && matchType;
  });

  const handleCheckout = (id) => {
    dispatch({ type: 'CHECKOUT_VISITOR', payload: id });
    notify('info', t.exit_recorded);
  };

  return (
    <div className="p-3 lg:p-6 w-full max-w-7xl mx-auto flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-2 duration-500" dir={settings?.language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Title bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-black text-slate-900 dark:text-white tracking-tight">{t.dashboard}</h1>
          <p className="text-xs text-slate-500 font-bold mt-1">
            {new Date().toLocaleDateString(settings?.language === 'ar' ? 'ar-EG' : (settings?.language === 'en' ? 'en-US' : 'fr-FR'), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <Btn variant="primary" icon={Plus} onClick={() => setRegOpen(true)} size={isMobile ? 'md' : 'lg'} className="!rounded-lg">
          {t.new_entry}
        </Btn>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <StatCard label={t.total_visitors} value={total} icon={Users} color="#3B82F6" bg="#EFF6FF" />
        <StatCard label={t.on_site} value={present} icon={UserCheck} color="#10B981" bg="#D1FAE5" />
        <StatCard label={t.total_exits} value={sortis} icon={UserX} color="#6B7280" bg="#F1F5F9" />
        <StatCard label={t.vehicle} value={vehicules} icon={Car} color="#F59E0B" bg="#FEF3C7" />
      </div>

      {/* Main Registry Table Card */}
      <Card className="border-slate-200 dark:border-slate-800">
        <CardHeader
          title={`${t.dashboard} (${filtered.length})`}

          subtitle={t.tracking_desc}
          actions={
            <Btn variant="ghost" size="sm" icon={RefreshCw} onClick={() => fetchVisitors(true)} loading={loading} className="text-[10px] font-black uppercase tracking-widest">
              {!isMobile && t.refresh}
            </Btn>
          }
        />

        {/* Filters & Actions bar */}
        <div className="p-4 bg-slate-50/50 dark:bg-white/[0.01] border-b border-slate-50 dark:border-slate-800 flex flex-col lg:flex-row gap-3 items-stretch lg:items-center">
          {/* Search bar inside the table area */}
          <div className="relative flex-1 group">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-blue-bright transition-colors" />
            <input
              type="text"
              placeholder={t.search}
              value={searchQuery}
              onChange={e => dispatch({ type: 'SET_SEARCH', payload: e.target.value })}
              className="w-full bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 focus:border-brand-blue-bright/20 rounded-lg py-2 pl-10 pr-4 text-xs font-bold text-slate-900 dark:text-slate-100 outline-none transition-all"
            />
          </div>

          <div className="flex gap-2">
            <select
              value={filterStatus}
              onChange={e => dispatch({ type: 'SET_FILTER_STATUS', payload: e.target.value })}
              className="px-4 py-2.5 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-lg text-xs font-black text-slate-700 dark:text-slate-300 outline-none cursor-pointer hover:border-slate-200 transition-colors appearance-none pr-8 relative bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22none%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cpath%20d%3D%22M5%207.5L10%2012.5L15%207.5%22%20stroke%3D%22%2394A3B8%22%20stroke-width%3D%221.66667%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22/%3E%3C/svg%3E')] bg-[length:16px_16px] bg-[right_8px_center] bg-no-repeat"
            >
              <option value="all">{t.all} ({t.status})</option>
              <option value="present">{t.present}</option>
              <option value="sorti">{t.exited}</option>
            </select>

            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
              className="px-4 py-2.5 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-lg text-xs font-black text-slate-700 dark:text-slate-300 outline-none cursor-pointer hover:border-slate-200 transition-colors appearance-none pr-8 relative bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22none%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cpath%20d%3D%22M5%207.5L10%2012.5L15%207.5%22%20stroke%3D%22%2394A3B8%22%20stroke-width%3D%221.66667%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22/%3E%3C/svg%3E')] bg-[length:16px_16px] bg-[right_8px_center] bg-no-repeat"
            >
              <option value="all">{t.all} ({t.filter_by})</option>
              <option value="person">{t.person}</option>
              <option value="vehicule">{t.vehicle}</option>
            </select>
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={Users}
            title={t.no_results}
            description={t.no_results_desc}
            action={
              <Btn variant="primary" icon={Plus} onClick={() => setRegOpen(true)}>
                {t.new_entry}
              </Btn>
            }
          />
        ) : (
          <VisitorTable
            visitors={filtered}
            onView={setDetailVisitor}
            onCheckout={handleCheckout}
            compact={isMobile}
          />
        )}
      </Card>

      {/* Modals */}
      <RegistrationModal isOpen={regOpen} onClose={() => setRegOpen(false)} />

      <Modal isOpen={!!detailVisitor} onClose={() => setDetailVisitor(null)} title={t.profile} size="md">
        <VisitorDetail visitor={detailVisitor} onClose={() => setDetailVisitor(null)} onCheckout={handleCheckout} />
      </Modal>
    </div>
  );
}

/* ============================================
   PAGE HISTORIQUE
============================================ */
export function Historique({ isMobile }) {
  const { state, dispatch, notify } = useApp();
  const { settings } = state;
  const t = TRANSLATIONS[settings?.language || 'fr'];
  const [detailVisitor, setDetailVisitor] = useState(null);
  const [dateFilter, setDateFilter] = useState('');

  const all = state.visitors.filter(v => {
    if (!dateFilter) return true;
    return v.date === new Date(dateFilter).toLocaleDateString(settings?.language === 'ar' ? 'ar-EG' : (settings?.language === 'en' ? 'en-US' : 'fr-FR'));
  });

  const handleCheckout = (id) => {
    dispatch({ type: 'CHECKOUT_VISITOR', payload: id });
    notify('info', t.exit_recorded);
  };

  return (
    <div className="p-4 lg:p-8 w-full max-w-7xl mx-auto flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-2 duration-500" dir={settings?.language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white tracking-tight">{t.history}</h1>
          <p className="text-sm text-slate-500 font-bold mt-1">{state.visitors.length} {t.history.toLowerCase()}</p>
        </div>
        <div className="flex gap-2 items-center">
          <div className="relative">
            <Calendar size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="date" 
              value={dateFilter} 
              onChange={e => setDateFilter(e.target.value)}
              className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-lg py-2 pl-10 pr-3 text-xs font-black text-slate-700 dark:text-slate-200 outline-none hover:border-slate-200 focus:border-brand-blue-bright/20 transition-all"
            />
          </div>
          {dateFilter && <Btn variant="ghost" size="sm" onClick={() => setDateFilter('')} className="text-[10px] font-black uppercase">{t.reset}</Btn>}
          <Btn variant="secondary" size="sm" icon={Download} className="text-[10px] font-black uppercase">{t.export}</Btn>
        </div>
      </div>

      <Card className="border-slate-200 dark:border-slate-800">
        <CardHeader title={`${t.history} (${all.length})`} />
        {all.length === 0
          ? <EmptyState icon={Clock} title={t.no_results} description={t.no_results_desc} />
          : <VisitorTable visitors={all} onView={setDetailVisitor} onCheckout={handleCheckout} compact={isMobile} />
        }
      </Card>

      <Modal isOpen={!!detailVisitor} onClose={() => setDetailVisitor(null)} title={t.profile} size="md">
        <VisitorDetail visitor={detailVisitor} onClose={() => setDetailVisitor(null)} onCheckout={handleCheckout} />
      </Modal>
    </div>

  );
}
