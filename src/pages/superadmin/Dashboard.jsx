import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Building2, Users, Shield, Clock, Plus, RefreshCw, 
  CheckCircle2, AlertTriangle, UserX, UserCheck, Power, Search, Building
} from 'lucide-react';
import { useApp } from '../../context/useAppState';
import { Card, CardHeader, StatCard, Btn, Modal } from '../../components/UI';
import { entrepriseService } from '../../services/entrepriseService';
import { authService } from '../../services/authService';
import { visitService } from '../../services/visitService';
import { TRANSLATIONS } from '../../translations';
import VisitorTable from '../../components/VisitorTable';
import VisitorDetail from '../../components/VisitorDetail';

export default function SuperAdminDashboard({ isMobile }) {
  const { state, dispatch, notify } = useApp();
  const t = TRANSLATIONS[state.settings?.language || 'fr'];

  const [entreprises, setEntreprises] = useState([]);
  const [users, setUsers] = useState([]);
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detailVisitor, setDetailVisitor] = useState(null);

  const fetchGlobalData = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      const [entData, usrData, visData] = await Promise.all([
        entrepriseService.getAll(),
        authService.getAllUsers(),
        visitService.getAll(),
      ]);

      setEntreprises(Array.isArray(entData) ? entData : (entData?.entreprises || []));
      setUsers(usrData?.utilisateurs || (Array.isArray(usrData) ? usrData : []));
      
      const rawVisits = visData?.visites || (Array.isArray(visData) ? visData : []);
      const uniqueVisits = Array.from(new Map(rawVisits.map(v => [v._id || v.id, v])).values());
      setVisits(uniqueVisits);

      if (isRefresh) notify('success', 'Données globales actualisées.');
    } catch (err) {
      console.error('Erreur chargement données SuperAdmin:', err);
      notify('error', 'Erreur chargement du tableau de bord SuperAdmin.');
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    fetchGlobalData();
  }, [fetchGlobalData]);

  const handleToggleAccountStatus = async (id, currentStatus) => {
    const nextStatus = currentStatus === 'ACTIF' ? 'SUSPENDU' : 'ACTIF';
    try {
      await authService.updateUserStatus(id, nextStatus);
      notify('success', `Statut du compte mis à jour (${nextStatus}).`);
      fetchGlobalData(true);
    } catch (err) {
      notify('error', 'Erreur lors du changement de statut : ' + err.message);
    }
  };

  const handleToggleEntrepriseStatus = async (id, currentStatus) => {
    const nextStatus = currentStatus === 'ACTIF' ? 'SUSPENDU' : 'ACTIF';
    try {
      await entrepriseService.updateStatus(id, nextStatus);
      notify('success', `Statut de l'entreprise mis à jour (${nextStatus}).`);
      fetchGlobalData(true);
    } catch (err) {
      notify('error', 'Erreur lors du changement de statut entreprise : ' + err.message);
    }
  };

  const stats = useMemo(() => {
    const totalEntreprises = entreprises.length;
    const totalAdmins = users.filter(u => u.role === 'ADMIN').length;
    const totalAgents = users.filter(u => u.role === 'AGENT').length;
    const totalVisits = visits.length;
    const suspendedAccounts = users.filter(u => u.statut === 'SUSPENDU' || u.statut === 'DESACTIVE').length;

    return { totalEntreprises, totalAdmins, totalAgents, totalVisits, suspendedAccounts };
  }, [entreprises, users, visits]);

  return (
    <div className="p-4 lg:p-8 w-full max-w-7xl mx-auto flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <Shield className="text-brand-blue-bright" size={32} />
            Supervision Globale (SuperAdmin)
          </h1>
          <p className="text-xs text-slate-500 font-bold mt-1">
            Vue d'ensemble de toutes les entreprises, administrateurs, agents et passages enregistrés.
          </p>
        </div>
        <Btn variant="ghost" size="sm" icon={RefreshCw} onClick={() => fetchGlobalData(true)} loading={loading} className="text-[10px] font-black uppercase">
          Actualiser
        </Btn>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard label="Entreprises / Boîtes" value={stats.totalEntreprises} icon={Building2} color="#3B82F6" bg="#EFF6FF" />
        <StatCard label="Total Admins" value={stats.totalAdmins} icon={Shield} color="#8B5CF6" bg="#F5F3FF" />
        <StatCard label="Total Agents" value={stats.totalAgents} icon={Users} color="#10B981" bg="#D1FAE5" />
        <StatCard label="Visites Globale" value={stats.totalVisits} icon={Clock} color="#F59E0B" bg="#FEF3C7" />
        <StatCard label="Comptes Suspendus" value={stats.suspendedAccounts} icon={UserX} color="#EF4444" bg="#FEE2E2" />
      </div>

      {/* Section 1 : Entreprises actives */}
      <Card className="border-slate-200 dark:border-slate-800">
        <CardHeader
          title={`Entreprises Enregistrées (${entreprises.length})`}
          subtitle="Aperçu des boîtes rattachées au système"
        />
        <div className="p-3 sm:p-4 overflow-hidden w-full">
          <table className="w-full table-fixed text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-black uppercase tracking-wider text-slate-400 bg-slate-50 dark:bg-slate-900/50">
                <th className="py-2.5 px-3 w-[32%]">Entreprise</th>
                <th className="py-2.5 px-2 w-[22%]">Secteur</th>
                <th className="py-2.5 px-2 w-[22%]">Immatriculation</th>
                <th className="py-2.5 px-2 w-[12%]">Statut</th>
                <th className="py-2.5 px-3 w-[12%] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-bold">
              {entreprises.map(ent => (
                <tr key={ent.id || ent._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors">
                  <td className="py-2.5 px-3 min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-brand-blue-bright/10 text-brand-blue-bright flex items-center justify-center font-black shrink-0">
                        <Building size={18} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-black text-slate-900 dark:text-white text-xs truncate leading-tight">{ent.nom}</p>
                        <p className="text-[10px] text-slate-400 truncate">{ent.email || ent.telephone}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-2.5 px-2 text-slate-600 dark:text-slate-300 min-w-0">
                    <p className="truncate text-xs">{ent.secteur || '—'}</p>
                  </td>
                  <td className="py-2.5 px-2 font-mono text-slate-500 text-xs min-w-0">
                    <p className="truncate">{ent.immatriculation || '—'}</p>
                  </td>
                  <td className="py-2.5 px-2 min-w-0">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider inline-block truncate max-w-full ${
                      ent.statut === 'ACTIF' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'
                    }`}>
                      {ent.statut || 'ACTIF'}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right min-w-0">
                    <Btn
                      variant={ent.statut === 'ACTIF' ? 'danger' : 'success'}
                      size="sm"
                      onClick={() => handleToggleEntrepriseStatus(ent.id || ent._id, ent.statut || 'ACTIF')}
                      className="text-[9px] font-black uppercase py-1 px-2"
                    >
                      {ent.statut === 'ACTIF' ? 'Suspendre' : 'Activer'}
                    </Btn>
                  </td>
                </tr>
              ))}
              {entreprises.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-400 text-xs font-bold">
                    Aucune entreprise enregistrée.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Section 2 : Aperçu des Comptes Utilisateurs */}
      <Card className="border-slate-200 dark:border-slate-800">
        <CardHeader
          title={`Comptes Utilisateurs Globaux (${users.length})`}
          subtitle="Gestion des accès SuperAdmin, Admin d'Entreprise et Agent"
        />
        <div className="p-3 sm:p-4 overflow-hidden w-full">
          <table className="w-full table-fixed text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-black uppercase tracking-wider text-slate-400 bg-slate-50 dark:bg-slate-900/50">
                <th className="py-2.5 px-3 w-[30%]">Utilisateur</th>
                <th className="py-2.5 px-2 w-[16%]">Rôle</th>
                <th className="py-2.5 px-2 w-[26%]">Entreprise</th>
                <th className="py-2.5 px-2 w-[14%]">Statut</th>
                <th className="py-2.5 px-3 w-[14%] text-right">Action Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-bold">
              {users.map(usr => (
                <tr key={usr.id || usr._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors">
                  <td className="py-2.5 px-3 min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center font-black shrink-0 text-[11px]">
                        {(usr.prenom?.[0] || 'U') + (usr.nom?.[0] || '')}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-black text-slate-900 dark:text-white text-xs truncate leading-tight">{usr.prenom} {usr.nom}</p>
                        <p className="text-[10px] text-slate-400 font-mono truncate">{usr.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-2.5 px-2 min-w-0">
                    <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider inline-block truncate max-w-full ${
                      usr.role === 'SUPERADMIN' || usr.role === 'SUPER_ADMIN' ? 'bg-purple-500/10 text-purple-600 border border-purple-500/20' :
                      usr.role === 'ADMIN' ? 'bg-blue-500/10 text-blue-600 border border-blue-500/20' : 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                    }`}>
                      {usr.role}
                    </span>
                  </td>
                  <td className="py-2.5 px-2 text-slate-600 dark:text-slate-300 min-w-0">
                    <p className="truncate text-xs">{usr.entrepriseNom || '— (Global)'}</p>
                  </td>
                  <td className="py-2.5 px-2 min-w-0">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider inline-block truncate max-w-full ${
                      usr.statut === 'ACTIF' ? 'bg-emerald-500/10 text-emerald-600' :
                      usr.statut === 'SUSPENDU' ? 'bg-amber-500/10 text-amber-600' : 'bg-rose-500/10 text-rose-600'
                    }`}>
                      {usr.statut || 'ACTIF'}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right min-w-0">
                    <Btn
                      variant={usr.statut === 'ACTIF' ? 'warning' : 'success'}
                      size="sm"
                      onClick={() => handleToggleAccountStatus(usr.id || usr._id, usr.statut || 'ACTIF')}
                      className="text-[10px] font-black uppercase"
                    >
                      {usr.statut === 'ACTIF' ? 'Suspendre' : 'Activer'}
                    </Btn>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Section 3 : Historique Global des Visites */}
      <Card className="border-slate-200 dark:border-slate-800">
        <CardHeader
          title={`Historique Global des Passages (${visits.length})`}
          subtitle="Toutes les visites enregistrées dans le réseau NoRegis"
        />
        <div className="p-4">
          <VisitorTable visitors={visits} onView={setDetailVisitor} compact={isMobile} />
        </div>
      </Card>

      <Modal isOpen={!!detailVisitor} onClose={() => setDetailVisitor(null)} title={t.profile} size="md">
        <VisitorDetail visitor={detailVisitor} onClose={() => setDetailVisitor(null)} />
      </Modal>
    </div>
  );
}
