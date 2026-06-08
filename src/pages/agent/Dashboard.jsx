import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Users, UserCheck, UserX, Car, Plus, RefreshCw, Search } from 'lucide-react';
import { useApp } from '../../context/useAppState';
import { DashboardStatCard, Card, CardHeader, Btn, EmptyState, Modal } from '../../components/UI';
import { RegistrationModal } from '../../components/RegistrationModal';
import { visitService } from '../../services/visitService';
import { TRANSLATIONS } from '../../translations';
import VisitorTable from '../../components/VisitorTable';
import VisitorDetail from '../../components/VisitorDetail';

export default function AgentDashboard({ isMobile }) {
  const { state, dispatch, notify } = useApp();
  const { visitors, searchQuery, filterStatus, settings } = state;
  const t = TRANSLATIONS[settings?.language || 'fr'];
  
  const [regOpen, setRegOpen] = useState(false);
  const [detailVisitor, setDetailVisitor] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [loading, setLoading] = useState(true);

  const fetchVisitors = useCallback(async (isRefresh = false) => {
    if (isRefresh) setLoading(true);
    try {
      const data = await visitService.getAll();
      dispatch({ type: 'SET_VISITORS', payload: data.visites || [] });
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
        const data = await visitService.getAll();
        if (!ignore) {
          const rawVisits = data.visites || [];
          const uniqueVisits = Array.from(new Map(rawVisits.map(v => [v._id || v.id, v])).values());
          dispatch({ type: 'SET_VISITORS', payload: uniqueVisits });
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

  const stats = useMemo(() => {
    const total = visitors.length;
    const present = visitors.filter(v => {
      const s = String(v.statut || '').toLowerCase();
      return (s === 'present' || s === 'en-cours' || s === 'en cours' || s === 'on-site') || (!v.heureSortie && s !== 'sorti' && s !== 'sortis');
    }).length;
    const sortis = visitors.filter(v => {
      const s = String(v.statut || '').toLowerCase();
      return s === 'sorti' || s === 'sortis' || s === 'exited' || s === 'terminé' || v.heureSortie;
    }).length;
    const vehicules = visitors.filter(v => (v.type || (v.vehicule ? 'vehicule' : 'person')) === 'vehicule').length;
    
    return { total, present, sortis, vehicules };
  }, [visitors]);

  const filtered = visitors.filter(v => {
    const q = (searchQuery || '').trim().toLowerCase();
    
    const s = String(v.statut || '').toLowerCase();
    const isPresent = (s === 'present' || s === 'en-cours' || s === 'en cours' || s === 'on-site') || (!v.heureSortie && s !== 'sorti' && s !== 'sortis');
    
    const matchStatus = filterStatus === 'all' || 
                        (filterStatus === 'present' && isPresent) || 
                        (filterStatus === 'sorti' && !isPresent);
                        
    const rawType = String(v.type || '').toLowerCase();
    const visitorType = (rawType === 'vehicule' || v.vehicule) ? 'vehicule' : 'person';
    const matchType = filterType === 'all' || visitorType === filterType;
    
    const matchSearch = !q || [
      v.nom, v.prenom, v.numeroPiece, v.typePiece, v.immatriculation,
      v.visiteur?.nom, v.visiteur?.prenom, v.visiteur?.numeroPiece, v.visiteur?.typePiece,
      v.visitor?.nom, v.visitor?.prenom, v.visitor?.numeroPiece, v.visitor?.typePiece,
      v.visiteurId?.nom, v.visiteurId?.prenom, v.visiteurId?.numeroPiece, v.visiteurId?.typePiece,
      v.visitorId?.nom, v.visitorId?.prenom, v.visitorId?.numeroPiece, v.visitorId?.typePiece,
      v.vehicule?.immatriculation, v.vehicule?.marque, v.vehicule?.modele, v.vehicule?.couleur,
      v.personneVisitee, v.hote, v.visitedPerson,
      v.service, v.departement,
      v.nomComplet, v.fullName, v.Nom, v.Prenom, v.lastName, v.firstName, v.name
    ].filter(Boolean).some(f => String(f).toLowerCase().includes(q));

    return matchSearch && matchStatus && matchType;
  });

  const handleCheckout = async (id) => {
    try {
      await visitService.recordExit(id);
      dispatch({ type: 'CHECKOUT_VISITOR', payload: id });
      notify('info', t.exit_recorded);
    } catch (err) {
      notify('error', (t.error_prefix || 'Erreur') + ': ' + err.message);
    }
  };

  const currentLocale = settings?.language === 'ar' ? 'ar-EG' : (settings?.language === 'en' ? 'en-US' : 'fr-FR');

  return (
    <div className="p-3 lg:p-6 w-full max-w-7xl mx-auto flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-2 duration-500" dir={settings?.language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Title bar */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight">{t.dashboard}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {t.tracking_desc}
          </p>
        </div>
        <Btn variant="primary" icon={Plus} onClick={() => setRegOpen(true)} size={isMobile ? 'md' : 'lg'} className="!rounded-lg">
          {t.new_entry}
        </Btn>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
        {/* Total Visitors Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 flex items-center justify-center">
                <Users size={24} className="text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Total Entrées</span>
            </div>
            <span className="px-2.5 py-1 bg-blue-100 dark:bg-blue-900/30 rounded-full text-[10px] font-black text-blue-600 dark:text-blue-400">↑ 12%</span>
          </div>
          <p className="text-4xl font-black text-slate-900 dark:text-white">{stats.total}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">{t.total_visitors}</p>
        </div>

        {/* On Site Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-100 to-green-100 dark:from-emerald-900/30 dark:to-green-900/30 flex items-center justify-center">
                <UserCheck size={24} className="text-emerald-600 dark:text-emerald-400" />
              </div>
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Actuellement</span>
            </div>
            <span className="px-2.5 py-1 bg-emerald-100 dark:bg-emerald-900/30 rounded-full text-[10px] font-black text-emerald-600 dark:text-emerald-400">✓ {stats.present > 0 ? '99.8%' : '0%'}</span>
          </div>
          <p className="text-4xl font-black text-slate-900 dark:text-white">{stats.present}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">{t.on_site}</p>
        </div>

        {/* Exits Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-100 to-gray-100 dark:from-slate-800 dark:to-gray-700 flex items-center justify-center">
                <UserX size={24} className="text-slate-600 dark:text-slate-400" />
              </div>
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Sorties</span>
            </div>
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black ${stats.sortis > stats.present ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
              {stats.sortis > 0 ? 'Complété' : 'En attente'}
            </span>
          </div>
          <p className="text-4xl font-black text-slate-900 dark:text-white">{stats.sortis}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">{t.total_exits}</p>
        </div>

        {/* Vehicles Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 flex items-center justify-center">
                <Car size={24} className="text-amber-600 dark:text-amber-400" />
              </div>
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Véhicules</span>
            </div>
            <span className="px-2.5 py-1 bg-amber-100 dark:bg-amber-900/30 rounded-full text-[10px] font-black text-amber-600 dark:text-amber-400">↑ 3%</span>
          </div>
          <p className="text-4xl font-black text-slate-900 dark:text-white">{stats.vehicules}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">{t.vehicle}</p>
        </div>
      </div>

      {/* Main Registry Table Card */}
      <Card className="border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Tabs Header */}
        <div className="px-6 pt-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex gap-8">
            {['all', 'person', 'vehicule'].map((tab) => (
              <button
                key={tab}
                onClick={() => setFilterType(tab)}
                className={`pb-4 text-sm font-bold transition-all border-b-2 ${
                  filterType === tab
                    ? 'text-brand-blue-bright dark:text-blue-400 border-brand-blue-bright dark:border-blue-400'
                    : 'text-slate-400 dark:text-slate-500 border-transparent hover:text-slate-600 dark:hover:text-slate-300'
                }`}
              >
                {tab === 'all' && t.all}
                {tab === 'person' && t.person}
                {tab === 'vehicule' && t.vehicle}
              </button>
            ))}
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">
            {t.showing} 1-10 {t.of} {filtered.length} {t.records}
          </span>
        </div>

        {/* Filters & Actions bar */}
        <div className="p-6 bg-slate-50/50 dark:bg-slate-900/30 border-b border-slate-200 dark:border-slate-700 flex flex-col lg:flex-row gap-4 items-stretch lg:items-center">
          <div className="relative flex-1 group">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-blue-bright transition-colors" />
            <input
              type="text"
              placeholder={t.search}
              value={searchQuery}
              onChange={e => dispatch({ type: 'SET_SEARCH', payload: e.target.value })}
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-brand-blue-bright focus:ring-2 focus:ring-brand-blue-bright/20 dark:focus:bg-slate-700 rounded-lg py-2.5 pl-10 pr-4 text-xs font-bold text-slate-900 dark:text-slate-100 outline-none transition-all"
            />
          </div>

          <div className="flex gap-2">
            <select
              value={filterStatus}
              onChange={e => dispatch({ type: 'SET_FILTER_STATUS', payload: e.target.value })}
              className="px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-300 outline-none cursor-pointer hover:border-slate-300 dark:hover:border-slate-600 transition-colors appearance-none pr-8 relative"
            >
              <option value="all">{t.all} ({t.status})</option>
              <option value="present">{t.present}</option>
              <option value="sorti">{t.exited}</option>
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
