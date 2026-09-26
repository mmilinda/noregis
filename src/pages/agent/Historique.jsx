import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Clock, Calendar, Download, Building2, User } from 'lucide-react';
import { useApp } from '../../context/useAppState';
import { Card, CardHeader, Btn, EmptyState, Modal } from '../../components/UI';
import { TRANSLATIONS } from '../../translations';
import { visitService } from '../../services/visitService';
import { entrepriseService } from '../../services/entrepriseService';
import { authService } from '../../services/authService';
import VisitorTable from '../../components/VisitorTable';
import VisitorDetail from '../../components/VisitorDetail';

export default function AgentHistorique({ isMobile }) {
  const { state, dispatch, notify } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const { settings } = state;
  const t = TRANSLATIONS[settings?.language || 'fr'];

  const role = (state.agent?.role || state.user?.role || '').toUpperCase();
  const isSuperAdmin = role === 'SUPER_ADMIN' || role === 'SUPERADMIN';

  const [detailVisitor, setDetailVisitor] = useState(null);
  const [dateFilter, setDateFilter] = useState('');
  const [entrepriseFilter, setEntrepriseFilter] = useState(searchParams.get('entrepriseId') || 'ALL');
  const [agentFilter, setAgentFilter] = useState(searchParams.get('agentId') || 'ALL');

  const [entreprises, setEntreprises] = useState([]);
  const [agentsList, setAgentsList] = useState([]);

  useEffect(() => {
    const entParam = searchParams.get('entrepriseId');
    const agentParam = searchParams.get('agentId');
    if (entParam) setEntrepriseFilter(entParam);
    if (agentParam) setAgentFilter(agentParam);
  }, [searchParams]);

  useEffect(() => {
    if (isSuperAdmin) {
      Promise.all([
        entrepriseService.getAll(),
        authService.getAllUsers(),
      ]).then(([entData, usrData]) => {
        setEntreprises(Array.isArray(entData) ? entData : (entData?.entreprises || []));
        const users = usrData?.utilisateurs || (Array.isArray(usrData) ? usrData : []);
        setAgentsList(users);
      }).catch(() => {});
    }
  }, [isSuperAdmin]);

  useEffect(() => {
    let ignore = false;
    const loadVisits = async () => {
      try {
        const data = await visitService.getAll();
        if (!ignore && data?.visites) {
          const rawVisits = data.visites || [];
          const uniqueVisits = Array.from(new Map(rawVisits.map(v => [v._id || v.id, v])).values());
          dispatch({ type: 'SET_VISITORS', payload: uniqueVisits });
        }
      } catch (err) {
        console.error("Erreur chargement historique:", err);
      }
    };
    loadVisits();
    return () => { ignore = true; };
  }, [dispatch]);

  const all = state.visitors.filter(v => {
    const userObj = state.agent || state.user || {};
    const role = (userObj.role || '').toUpperCase();

    // 1. Contextual filtering based on role & query selection
    if (role === 'SUPER_ADMIN' || role === 'SUPERADMIN') {
      if (entrepriseFilter !== 'ALL') {
        const vEntId = v.entrepriseId?._id || v.entrepriseId;
        if (String(vEntId) !== String(entrepriseFilter)) return false;
      }
      if (agentFilter !== 'ALL') {
        const vAgentId = v.agentId?._id || v.agentId || v.createdBy || v.agent?.id;
        if (String(vAgentId) !== String(agentFilter)) return false;
      }
    } else if (role === 'ADMIN') {
      const entId = userObj.entrepriseId?._id || userObj.entrepriseId;
      const vEntId = v.entrepriseId?._id || v.entrepriseId;
      if (entId && vEntId && String(vEntId) !== String(entId)) return false;
    } else {
      // AGENT: voit uniquement son propre historique de visites enregistrées
      if (!state.isAuthenticated) {
        const currentId = userObj._id || userObj.id;
        const currentEmail = userObj.email;
        const currentNom = `${userObj.prenom || ''} ${userObj.nom || ''}`.trim().toLowerCase();

        const vAgentId = v.agentId?._id || v.agentId || v.createdBy || v.agent?._id || v.agent?.id;
        const vEmail = v.agentEmail || v.agent?.email;
        const vAuthorName = String(v.enregistrePar || v.agentNom || '').toLowerCase();

        const isOwn = (
          (vAgentId && currentId && String(vAgentId) === String(currentId)) ||
          (vEmail && currentEmail && String(vEmail).toLowerCase() === String(currentEmail).toLowerCase()) ||
          (vAuthorName && currentNom && currentNom.length > 2 && vAuthorName.includes(currentNom)) ||
          (!vAgentId && !vEmail && !vAuthorName)
        );
        if (!isOwn) return false;
      }
    }

    // 2. Search query filtering (from top bar)
    if (state.searchQuery && state.searchQuery.trim()) {
      const q = state.searchQuery.trim().toLowerCase();
      const nom = String(v.nom || v.visiteur?.nom || '').toLowerCase();
      const prenom = String(v.prenom || v.visiteur?.prenom || '').toLowerCase();
      const piece = String(v.numeroPiece || v.visiteur?.numeroPiece || '').toLowerCase();
      const hote = String(v.personneVisitee || v.hote || '').toLowerCase();
      const service = String(v.service || v.departement || '').toLowerCase();
      const match = nom.includes(q) || prenom.includes(q) || piece.includes(q) || hote.includes(q) || service.includes(q);
      if (!match) return false;
    }

    // 3. Date filtering
    if (!dateFilter) return true;
    const filterDateStr = new Date(dateFilter).toLocaleDateString('fr-FR');
    const visitorDate = v.date || (v.createdAt ? new Date(v.createdAt).toLocaleDateString('fr-FR') : '');
    return visitorDate === filterDateStr;
  });

  const handleExport = () => {
    if (all.length === 0) return notify('warning', t.no_results);
    
    const headers = ["Nom", "Prenom", "Telephone", "Piece", "Type", "Pays", "Hote", "Service", "Entree", "Sortie", "Statut"];
    const rows = all.map(v => [
      v.nom || v.visiteur?.nom || v.visitor?.nom || '',
      v.prenom || v.visiteur?.prenom || v.visitor?.prenom || '',
      v.telephone || v.visiteur?.telephone || v.visitor?.telephone || '',
      v.numeroPiece || v.visiteur?.numeroPiece || v.visitor?.numeroPiece || '',
      v.type || 'personne',
      v.pays || v.visiteur?.pays || v.visitor?.pays || 'Sénégal',
      v.personneVisitee || v.hote || v.visitedPerson || '',
      v.service || v.departement || '',
      v.heureEntree || (v.createdAt ? new Date(v.createdAt).toLocaleTimeString() : ''),
      v.heureSortie || (v.updatedAt && (v.statut === 'sorti' || v.statut === 'sortis') ? new Date(v.updatedAt).toLocaleTimeString() : ''),
      v.statut
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `historique_noregis_${dateFilter || 'complet'}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    notify('success', 'Exportation réussie');
  };

  const handleCheckout = async (id) => {
    try {
      await visitService.recordExit(id);
      dispatch({ type: 'CHECKOUT_VISITOR', payload: id });
      notify('info', t.exit_recorded);
    } catch (err) {
      notify('error', (t.error_prefix || 'Erreur') + ': ' + err.message);
    }
  };

  const clearFilters = () => {
    setDateFilter('');
    setEntrepriseFilter('ALL');
    setAgentFilter('ALL');
    setSearchParams({});
  };

  return (
    <div className="p-4 lg:p-8 w-full max-w-7xl mx-auto flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-2 duration-500" dir={settings?.language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white tracking-tight">{isSuperAdmin ? 'Historique Global des Visites' : t.history}</h1>
          <p className="text-sm text-slate-500 font-bold mt-1">{all.length} visite(s) répertoriée(s)</p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          {isSuperAdmin && (
            <>
              <select
                value={entrepriseFilter}
                onChange={e => {
                  setEntrepriseFilter(e.target.value);
                  if (e.target.value !== 'ALL') searchParams.set('entrepriseId', e.target.value);
                  else searchParams.delete('entrepriseId');
                  setSearchParams(searchParams);
                }}
                className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-lg py-2 px-3 text-xs font-black text-slate-700 dark:text-slate-200 outline-none hover:border-slate-200 focus:border-brand-blue-bright/20 transition-all cursor-pointer"
              >
                <option value="ALL">Toutes les entreprises</option>
                {entreprises.map(e => (
                  <option key={e.id || e._id} value={e.id || e._id}>{e.nom}</option>
                ))}
              </select>

              <select
                value={agentFilter}
                onChange={e => {
                  setAgentFilter(e.target.value);
                  if (e.target.value !== 'ALL') searchParams.set('agentId', e.target.value);
                  else searchParams.delete('agentId');
                  setSearchParams(searchParams);
                }}
                className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-lg py-2 px-3 text-xs font-black text-slate-700 dark:text-slate-200 outline-none hover:border-slate-200 focus:border-brand-blue-bright/20 transition-all cursor-pointer"
              >
                <option value="ALL">Tous les agents</option>
                {agentsList.map(a => (
                  <option key={a.id || a._id} value={a.id || a._id}>{a.prenom} {a.nom} ({a.role})</option>
                ))}
              </select>
            </>
          )}

          <div className="relative">
            <Calendar size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="date" 
              value={dateFilter} 
              onChange={e => setDateFilter(e.target.value)}
              className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-lg py-2 pl-10 pr-3 text-xs font-black text-slate-700 dark:text-slate-200 outline-none hover:border-slate-200 focus:border-brand-blue-bright/20 transition-all"
            />
          </div>

          {(dateFilter || entrepriseFilter !== 'ALL' || agentFilter !== 'ALL') && (
            <Btn variant="ghost" size="sm" onClick={clearFilters} className="text-[10px] font-black uppercase">
              Réinitialiser
            </Btn>
          )}

          <Btn variant="secondary" size="sm" icon={Download} onClick={handleExport} className="text-[10px] font-black uppercase">{t.export}</Btn>
        </div>
      </div>

      <Card className="border-slate-200 dark:border-slate-800">
        <CardHeader title={`Historique (${all.length})`} />
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
