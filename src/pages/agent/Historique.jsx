import React, { useState } from 'react';
import { Clock, Calendar, Download } from 'lucide-react';
import { useApp } from '../../context/useAppState';
import { Card, CardHeader, Btn, EmptyState, Modal } from '../../components/UI';
import { TRANSLATIONS } from '../../translations';
import { visitService } from '../../services/visitService';
import VisitorTable from '../../components/VisitorTable';
import VisitorDetail from '../../components/VisitorDetail';

export default function AgentHistorique({ isMobile }) {
  const { state, dispatch, notify } = useApp();
  const { settings } = state;
  const t = TRANSLATIONS[settings?.language || 'fr'];
  const [detailVisitor, setDetailVisitor] = useState(null);
  const [dateFilter, setDateFilter] = useState('');

  const all = state.visitors.filter(v => {
    if (!dateFilter) return true;
    
    const filterDateStr = new Date(dateFilter).toLocaleDateString('fr-FR');
    const visitorDate = v.date || (v.createdAt ? new Date(v.createdAt).toLocaleDateString('fr-FR') : '');
    
    return visitorDate === filterDateStr;
  });

  const handleExport = () => {
    if (all.length === 0) return notify('warning', t.no_results);
    
    const headers = ["Nom", "Prenom", "Piece", "Type", "Hote", "Service", "Entree", "Sortie", "Statut"];
    const rows = all.map(v => [
      v.nom || v.visiteur?.nom || v.visitor?.nom || '',
      v.prenom || v.visiteur?.prenom || v.visitor?.prenom || '',
      v.numeroPiece || v.visiteur?.numeroPiece || v.visitor?.numeroPiece || '',
      v.type || 'personne',
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
          <Btn variant="secondary" size="sm" icon={Download} onClick={handleExport} className="text-[10px] font-black uppercase">{t.export}</Btn>
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
