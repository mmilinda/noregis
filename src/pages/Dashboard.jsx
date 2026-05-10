import { useState, useEffect, useCallback } from 'react';
import {
  Users, User, Car, UserCheck, UserX, Clock, Plus, LogOut,
  Eye, Search, Download, RefreshCw, Calendar,
  ChevronDown, ChevronUp
} from 'lucide-react';
import { useApp } from '../context/useAppState';
import { StatCard, Card, CardHeader, StatusBadge, TypeBadge, Btn, EmptyState, Modal } from '../components/UI';
import { RegistrationModal } from '../components/RegistrationModal';
import { visitService } from '../services/visitService';  // ← CHANGEMENT
import { TRANSLATIONS } from '../translations';

/* ============================================
   VISITOR DETAIL MODAL (adapté aux visites)
============================================ */
const Row = ({ label, value, mono }) => (
  <div className="flex justify-between items-start py-2 border-b border-slate-100 dark:border-slate-800 last:border-0 gap-3">
    <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest shrink-0 mt-0.5">{label}</span>
    <span className={`text-xs font-bold text-slate-900 dark:text-slate-100 text-right ${mono ? 'font-mono' : ''}`}>
      {value || '—'}
    </span>
  </div>
);

function VisitorDetail({ visit, onClose, onCheckout }) {
  const { state } = useApp();
  const t = TRANSLATIONS[state.settings?.language || 'fr'];
  if (!visit) return null;
  const visiteur = visit.visiteurId;
  const isVehicule = visit.type === 'vehicule';

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
            {isVehicule ? visit.vehicule?.immatriculation : `${visiteur?.nom} ${visiteur?.prenom}`}
          </p>
          <div className="flex gap-2 mt-2 flex-wrap">
            <StatusBadge statut={visit.statut === 'EN_COURS' ? 'present' : 'sorti'} />
            <TypeBadge type={isVehicule ? 'vehicule' : 'person'} />
          </div>
        </div>
        <div className="text-right hidden sm:block">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.id_passage}</p>
          <p className="text-sm font-black font-mono text-slate-900 dark:text-white">{visit._id}</p>
        </div>
      </div>

      {/* Photo if present */}
      {visit.photo && (
        <div className="rounded-xl overflow-hidden border border-slate-100 dark:border-slate-800">
          <img src={visit.photo} alt={t.scanned_doc} className="w-full h-40 object-cover" />
        </div>
      )}

      {/* Details */}
      <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-2 px-5">
        {isVehicule ? (
          <>
            <Row label={t.license_plate} value={visit.vehicule?.immatriculation} mono />
            <Row label={t.brand_model} value={`${visit.vehicule?.marque || ''} ${visit.vehicule?.modele || ''}`.trim()} />
            <Row label={t.color} value={visit.vehicule?.couleur} />
            <Row label={t.id_type} value={visit.vehicule?.typeVehicule} />
            {visiteur?.nom && <Row label={t.driver} value={`${visiteur.nom} ${visiteur.prenom}`} />}
          </>
        ) : (
          <>
            <Row label={t.fullname} value={`${visiteur?.nom} ${visiteur?.prenom}`} />
            <Row label={t.id_number} value={visiteur?.numeroPiece} mono />
            <Row label={t.id_type} value={visiteur?.typePiece} />
            {visiteur?.dateNaissance && <Row label={t.birth_date} value={new Date(visiteur.dateNaissance).toLocaleDateString()} />}
          </>
        )}
        <Row label={t.host_name} value={visit.personneVisitee} />
        <Row label={t.service} value={visit.service} />
        <Row label={t.entry_time} value={new Date(visit.heureEntree).toLocaleString()} />
        {visit.heureSortie && <Row label={t.exit_time} value={new Date(visit.heureSortie).toLocaleString()} />}
      </div>

      {visit.statut === 'EN_COURS' && (
        <Btn variant="warning" icon={LogOut} onClick={() => { onCheckout(visit._id); onClose(); }} fullWidth size="lg">
          {t.mark_exit}
        </Btn>
      )}
    </div>
  );
}

/* ============================================
   TABLEAU DES VISITES (au lieu des visiteurs)
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

function VisitsTable({ visits, onView, onCheckout, compact }) {
  const { state } = useApp();
  const t = TRANSLATIONS[state.settings?.language || 'fr'];
  const [sortBy, setSortBy] = useState('heureEntree');
  const [sortDir, setSortDir] = useState('desc');

  const toggleSort = (col) => {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(col); setSortDir('asc'); }
  };

  const sorted = [...visits].sort((a, b) => {
    let va, vb;
    if (sortBy === 'nom') {
      va = a.visiteurId?.nom || '';
      vb = b.visiteurId?.nom || '';
    } else if (sortBy === 'numeroPiece') {
      va = a.visiteurId?.numeroPiece || '';
      vb = b.visiteurId?.numeroPiece || '';
    } else {
      va = a[sortBy] ? new Date(a[sortBy]).getTime() : 0;
      vb = b[sortBy] ? new Date(b[sortBy]).getTime() : 0;
    }
    if (sortDir === 'asc') return va > vb ? 1 : -1;
    else return va < vb ? 1 : -1;
  });

  const getStatus = (statut) => statut === 'EN_COURS' ? 'present' : 'sorti';

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
              <tr key={v._id} className="group hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                <td className="px-4 py-2.5"><TypeBadge type={v.type || 'person'} /></td>
                <td className="px-4 py-2.5">
                  <p className="font-bold text-xs text-slate-900 dark:text-slate-100">
                    {v.type === 'vehicule' ? v.vehicule?.immatriculation : `${v.visiteurId?.nom} ${v.visiteurId?.prenom}`}
                  </p>
                  {v.type === 'vehicule' && <p className="text-[10px] text-slate-500 font-medium">{v.vehicule?.marque} {v.vehicule?.modele}</p>}
                </td>
                <td className="px-4 py-2.5">
                  <p className="text-[10px] font-bold font-mono text-slate-600 dark:text-slate-400">
                    {v.visiteurId?.numeroPiece || v.vehicule?.immatriculation || '—'}
                  </p>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">{v.visiteurId?.typePiece}</p>
                </td>
                <td className="px-4 py-2.5">
                  <p className="text-[10px] font-bold text-slate-800 dark:text-slate-200">{v.personneVisitee}</p>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">{v.service}</p>
                </td>
                <td className="px-4 py-2.5 text-[10px] font-bold font-mono">
                  {new Date(v.heureEntree).toLocaleTimeString()}
                  {v.heureSortie && <p className="text-[9px] text-slate-400 mt-0.5">→ {new Date(v.heureSortie).toLocaleTimeString()}</p>}
                </td>
                <td className="px-4 py-2.5"><StatusBadge statut={getStatus(v.statut)} /></td>
                <td className="px-5 py-4">
                  <div className="flex gap-1 justify-end">
                    <Btn variant="ghost" size="sm" icon={Eye} onClick={() => onView(v)} className="rounded-full w-8 h-8 !p-0" />
                    {v.statut === 'EN_COURS' && (
                      <button 
                        onClick={() => onCheckout(v._id)}
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
        <div key={v._id} onClick={() => onView(v)} className="flex items-start gap-3 p-3 active:bg-slate-50 dark:active:bg-slate-900 transition-colors cursor-pointer group">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${v.type === 'vehicule' ? 'bg-brand-green-light text-brand-green' : 'bg-brand-blue-light text-brand-blue'}`}>
            {v.type === 'vehicule' ? <Car size={20} /> : <User size={20} />}
          </div>
          <div className="flex-1 min-w-0 py-0.5">
            <p className="font-black text-xs text-slate-900 dark:text-slate-100 truncate tracking-tight">
              {v.type === 'vehicule' ? v.vehicule?.immatriculation : `${v.visiteurId?.nom} ${v.visiteurId?.prenom}`}
            </p>
            <p className="text-[10px] text-slate-500 font-bold truncate mt-0.5">
              <span className="text-slate-400">{t.to} :</span> {v.personneVisitee}
            </p>
            <p className="text-[9px] text-slate-400 font-medium mt-0.5">
              {t.entry_time} : {new Date(v.heureEntree).toLocaleTimeString()} 
              {v.heureSortie && ` • ${t.exit_time} : ${new Date(v.heureSortie).toLocaleTimeString()}`}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1.5 shrink-0 pt-0.5">
            <StatusBadge statut={getStatus(v.statut)} />
            {v.statut === 'EN_COURS' && (
              <button 
                onClick={e => { e.stopPropagation(); onCheckout(v._id); }}
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
  const { visits, searchQuery, filterStatus, settings } = state;
  const t = TRANSLATIONS[settings?.language || 'fr'];
  const [regOpen, setRegOpen] = useState(false);
  const [detailVisit, setDetailVisit] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [loading, setLoading] = useState(true);

  const fetchVisits = useCallback(async (isRefresh = false) => {
    if (isRefresh) setLoading(true);
    try {
      const res = await visitService.getAll();
      const visites = res.data?.visites || res.visites || [];
      dispatch({ type: 'SET_VISITS', payload: visites });
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
        const res = await visitService.getAll();
        if (!ignore) {
          const visites = res.data?.visites || res.visites || [];
          dispatch({ type: 'SET_VISITS', payload: visites });
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

  const handleCheckout = async (visitId) => {
    try {
      await visitService.recordExit(visitId);
      await fetchVisits(true);  // rafraîchir la liste
      notify('info', t.exit_recorded);
    } catch (err) {
      notify('error', err.message);
    }
  };

  // Statistiques à partir des visites en cours
  const total = visits.length;
  const present = visits.filter(v => v.statut === 'EN_COURS').length;
  const sortis = visits.filter(v => v.statut === 'TERMINE').length;
  const vehicules = visits.filter(v => v.type === 'vehicule').length;

  // Filtrage
  const filtered = visits.filter(v => {
    const q = searchQuery.toLowerCase();
    const visiteur = v.visiteurId;
    const matchSearch = !q || 
      (visiteur?.nom && visiteur.nom.toLowerCase().includes(q)) ||
      (visiteur?.prenom && visiteur.prenom.toLowerCase().includes(q)) ||
      (visiteur?.numeroPiece && visiteur.numeroPiece.toLowerCase().includes(q)) ||
      (v.vehicule?.immatriculation && v.vehicule.immatriculation.toLowerCase().includes(q)) ||
      (v.personneVisitee && v.personneVisitee.toLowerCase().includes(q)) ||
      (v.service && v.service.toLowerCase().includes(q));
    const matchStatus = filterStatus === 'all' || 
      (filterStatus === 'present' && v.statut === 'EN_COURS') ||
      (filterStatus === 'sorti' && v.statut === 'TERMINE');
    const matchType = filterType === 'all' || v.type === filterType;
    return matchSearch && matchStatus && matchType;
  });

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

      {/* Main Registry Card */}
      <Card className="border-slate-200 dark:border-slate-800">
        <CardHeader
          title={`${t.dashboard} (${filtered.length})`}
          subtitle={t.tracking_desc}
          actions={
            <Btn variant="ghost" size="sm" icon={RefreshCw} onClick={() => fetchVisits(true)} loading={loading} className="text-[10px] font-black uppercase tracking-widest">
              {!isMobile && t.refresh}
            </Btn>
          }
        />

        {/* Filters bar */}
        <div className="p-4 bg-slate-50/50 dark:bg-white/[0.01] border-b border-slate-50 dark:border-slate-800 flex flex-col lg:flex-row gap-3 items-stretch lg:items-center">
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
              className="px-4 py-2.5 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-lg text-xs font-black text-slate-700 dark:text-slate-300 outline-none cursor-pointer hover:border-slate-200 transition-colors appearance-none pr-8"
            >
              <option value="all">{t.all} ({t.status})</option>
              <option value="present">{t.present}</option>
              <option value="sorti">{t.exited}</option>
            </select>

            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
              className="px-4 py-2.5 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-lg text-xs font-black text-slate-700 dark:text-slate-300 outline-none cursor-pointer hover:border-slate-200 transition-colors appearance-none pr-8"
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
          <VisitsTable
            visits={filtered}
            onView={setDetailVisit}
            onCheckout={handleCheckout}
            compact={isMobile}
          />
        )}
      </Card>

      {/* Modals */}
      <RegistrationModal isOpen={regOpen} onClose={() => setRegOpen(false)} />
      <Modal isOpen={!!detailVisit} onClose={() => setDetailVisit(null)} title={t.profile} size="md">
        <VisitorDetail visit={detailVisit} onClose={() => setDetailVisit(null)} onCheckout={handleCheckout} />
      </Modal>
    </div>
  );
}

/* ============================================
   PAGE HISTORIQUE
============================================ */
export function Historique({ isMobile }) {
  const { state, dispatch, notify } = useApp();
  const { visits, settings } = state;
  const t = TRANSLATIONS[settings?.language || 'fr'];
  const [detailVisit, setDetailVisit] = useState(null);
  const [dateFilter, setDateFilter] = useState('');

  const filtered = visits.filter(v => {
    if (!dateFilter) return true;
    const dateVisite = new Date(v.heureEntree).toLocaleDateString(settings?.language === 'ar' ? 'ar-EG' : (settings?.language === 'en' ? 'en-US' : 'fr-FR'));
    const filterDate = new Date(dateFilter).toLocaleDateString(settings?.language === 'ar' ? 'ar-EG' : (settings?.language === 'en' ? 'en-US' : 'fr-FR'));
    return dateVisite === filterDate;
  });

  const handleCheckout = async (visitId) => {
    try {
      await visitService.recordExit(visitId);
      // Rafraîchir la liste des visites (appel API)
      const res = await visitService.getAll();
      const visites = res.data?.visites || res.visites || [];
      dispatch({ type: 'SET_VISITS', payload: visites });
      notify('info', t.exit_recorded);
    } catch (err) {
      notify('error', err.message);
    }
  };

  return (
    <div className="p-4 lg:p-8 w-full max-w-7xl mx-auto flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-2 duration-500" dir={settings?.language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white tracking-tight">{t.history}</h1>
          <p className="text-sm text-slate-500 font-bold mt-1">{visits.length} {t.history.toLowerCase()}</p>
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
        <CardHeader title={`${t.history} (${filtered.length})`} />
        {filtered.length === 0
          ? <EmptyState icon={Clock} title={t.no_results} description={t.no_results_desc} />
          : <VisitsTable visits={filtered} onView={setDetailVisit} onCheckout={handleCheckout} compact={isMobile} />
        }
      </Card>

      <Modal isOpen={!!detailVisit} onClose={() => setDetailVisit(null)} title={t.profile} size="md">
        <VisitorDetail visit={detailVisit} onClose={() => setDetailVisit(null)} onCheckout={handleCheckout} />
      </Modal>
    </div>
  );
}