import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Users, UserCheck, UserX, Car, Plus, RefreshCw, Search, Camera } from 'lucide-react';
import { useApp } from '../../context/useAppState';
import { StatCard, Card, CardHeader, Btn, EmptyState, Modal } from '../../components/UI';
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

  // Backend v2 — Suppression de visite
  const handleDeleteVisit = async (id) => {
    try {
      await visitService.deleteVisit(id);
      dispatch({ type: 'DELETE_VISIT', payload: id });
      notify('success', 'Visite supprimée.');
    } catch (err) {
      notify('error', (t.error_prefix || 'Erreur') + ': ' + err.message);
    }
  };

  const currentLocale = settings?.language === 'ar' ? 'ar-EG' : (settings?.language === 'en' ? 'en-US' : 'fr-FR');

  return (
    <div className="p-3 lg:p-6 w-full max-w-7xl mx-auto flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-2 duration-500" dir={settings?.language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Title bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-black text-slate-900 dark:text-white tracking-tight">{t.dashboard}</h1>
          <p className="text-xs text-slate-500 font-bold mt-1">
            {new Date().toLocaleDateString(currentLocale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <Btn variant="primary" icon={Plus} onClick={() => setRegOpen(true)} size={isMobile ? 'md' : 'lg'} className="!rounded-lg">
          {t.new_entry}
        </Btn>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <StatCard label={t.total_visitors} value={stats.total} icon={Users} color="#3B82F6" bg="#EFF6FF" />
        <StatCard label={t.on_site} value={stats.present} icon={UserCheck} color="#10B981" bg="#D1FAE5" />
        <StatCard label={t.total_exits} value={stats.sortis} icon={UserX} color="#6B7280" bg="#F1F5F9" />
        <StatCard label={t.vehicle} value={stats.vehicules} icon={Car} color="#F59E0B" bg="#FEF3C7" />
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
