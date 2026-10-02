import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Building2, Users, Shield, Clock, Plus, RefreshCw, 
  CheckCircle2, AlertTriangle, UserX, UserCheck, Power, Search, Building,
  TrendingUp, BarChart2, PieChart, Activity, Calendar
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
  const [hoveredPoint, setHoveredPoint] = useState(null);

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

  // 📈 DONNÉES RÉELLES 1 : Évolution des visites sur 7 jours
  const last7DaysData = useMemo(() => {
    const result = [];
    const now = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateKey = d.toISOString().split('T')[0];
      const dayLabel = d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' });

      const count = visits.filter(v => {
        const rawDate = v.dateEntree || v.heureEntree || v.createdAt || v.date;
        if (!rawDate) return false;
        const parsed = new Date(rawDate);
        if (isNaN(parsed.getTime())) return false;
        return parsed.toISOString().split('T')[0] === dateKey;
      }).length;

      result.push({ dateKey, dayLabel, count });
    }
    return result;
  }, [visits]);

  // Calculations line chart SVG
  const lineChartPoints = useMemo(() => {
    const counts = last7DaysData.map(d => d.count);
    const maxVal = Math.max(...counts, 4);
    const width = 600;
    const height = 180;
    const padding = 30;

    const points = last7DaysData.map((d, index) => {
      const x = padding + (index / (last7DaysData.length - 1)) * (width - 2 * padding);
      const y = height - padding - (d.count / maxVal) * (height - 2 * padding);
      return { x, y, label: d.dayLabel, count: d.count, dateKey: d.dateKey };
    });

    const pathData = points.reduce((acc, p, idx) => {
      return acc + `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y} `;
    }, '');

    const areaPathData = pathData + 
      `L ${points[points.length - 1].x} ${height - padding} ` + 
      `L ${points[0].x} ${height - padding} Z`;

    return { points, pathData, areaPathData, width, height, padding, maxVal };
  }, [last7DaysData]);

  // 📊 DONNÉES RÉELLES 2 : Visites par Entreprise
  const entrepriseVisits = useMemo(() => {
    const map = {};
    entreprises.forEach(e => {
      map[e.id || e._id] = { id: e.id || e._id, nom: e.nom, count: 0 };
    });

    visits.forEach(v => {
      const entId = v.entrepriseId || v.entreprise?._id || v.entreprise;
      if (entId && map[entId]) {
        map[entId].count++;
      } else if (v.entrepriseNom) {
        const found = Object.values(map).find(e => e.nom === v.entrepriseNom);
        if (found) found.count++;
      }
    });

    const list = Object.values(map).sort((a, b) => b.count - a.count);
    const maxCount = Math.max(...list.map(l => l.count), 1);
    return { list: list.slice(0, 5), maxCount, total: visits.length };
  }, [entreprises, visits]);

  // ⏰ DONNÉES RÉELLES 3 : Distribution par heure de la journée (8h - 20h)
  const hourlyDistribution = useMemo(() => {
    const hours = [8, 10, 12, 14, 16, 18, 20];
    const counts = { 8: 0, 10: 0, 12: 0, 14: 0, 16: 0, 18: 0, 20: 0 };

    visits.forEach(v => {
      const rawDate = v.dateEntree || v.heureEntree || v.createdAt || v.date;
      if (rawDate) {
        const d = new Date(rawDate);
        if (!isNaN(d.getTime())) {
          const h = d.getHours();
          if (h >= 7 && h < 9) counts[8]++;
          else if (h >= 9 && h < 11) counts[10]++;
          else if (h >= 11 && h < 13) counts[12]++;
          else if (h >= 13 && h < 15) counts[14]++;
          else if (h >= 15 && h < 17) counts[16]++;
          else if (h >= 17 && h < 19) counts[18]++;
          else if (h >= 19) counts[20]++;
        }
      }
    });

    const maxVal = Math.max(...Object.values(counts), 1);
    return hours.map(h => ({
      label: `${h}h - ${h+2}h`,
      count: counts[h] || 0,
      percentage: Math.round(((counts[h] || 0) / maxVal) * 100),
    }));
  }, [visits]);

  // 🍩 DONNÉES RÉELLES 4 : Répartition des Rôles & Statuts des Comptes
  const userRoleStats = useMemo(() => {
    const superAdmins = users.filter(u => u.role === 'SUPERADMIN' || u.role === 'SUPER_ADMIN').length;
    const admins = users.filter(u => u.role === 'ADMIN').length;
    const agents = users.filter(u => u.role === 'AGENT').length;
    const active = users.filter(u => u.statut === 'ACTIF' || !u.statut).length;
    const suspended = users.filter(u => u.statut === 'SUSPENDU' || u.statut === 'DESACTIVE').length;

    return { superAdmins, admins, agents, active, suspended, total: users.length };
  }, [users]);

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
            Vue d'ensemble et analytique en temps réel de toutes les entreprises, administrateurs et passages.
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

      {/* 📈 SECTION GRAPHIQUES ET COURBES DE DONNÉES RÉELLES */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Graphique 1 : Évolution des visites sur 7 jours (SVG Area Line Chart) */}
        <Card className="lg:col-span-2 border-slate-200 dark:border-slate-800">
          <CardHeader
            title="Évolution Globale des Passages (7 Derniers Jours)"
            subtitle="Données réelles agrégées pour l'ensemble du réseau"
          />
          <div className="p-5">
            {loading ? (
              <div className="h-48 flex items-center justify-center">
                <span className="w-8 h-8 border-3 border-brand-blue-bright border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative w-full">
                  <svg 
                    viewBox={`0 0 ${lineChartPoints.width} ${lineChartPoints.height}`}
                    className="w-full h-48 overflow-visible"
                  >
                    <defs>
                      <linearGradient id="superAdminGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* Lignes de grille horizontales */}
                    {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                      const y = lineChartPoints.padding + ratio * (lineChartPoints.height - 2 * lineChartPoints.padding);
                      return (
                        <line 
                          key={idx}
                          x1={lineChartPoints.padding} 
                          y1={y} 
                          x2={lineChartPoints.width - lineChartPoints.padding} 
                          y2={y} 
                          stroke="#E2E8F0" 
                          strokeDasharray="4 4"
                          className="dark:stroke-slate-800"
                        />
                      );
                    })}

                    {/* Aire sous la courbe */}
                    <path 
                      d={lineChartPoints.areaPathData} 
                      fill="url(#superAdminGrad)" 
                    />

                    {/* Courbe principale */}
                    <path 
                      d={lineChartPoints.pathData} 
                      fill="none" 
                      stroke="#3B82F6" 
                      strokeWidth="3.5" 
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />

                    {/* Points interactifs */}
                    {lineChartPoints.points.map((p, idx) => (
                      <g key={idx} className="cursor-pointer group" onMouseEnter={() => setHoveredPoint(p)} onMouseLeave={() => setHoveredPoint(null)}>
                        <circle 
                          cx={p.x} 
                          cy={p.y} 
                          r="5" 
                          fill="#3B82F6" 
                          stroke="#FFFFFF"
                          strokeWidth="2"
                          className="transition-transform duration-200 group-hover:scale-150"
                        />
                        {/* Étiquette d'axe X */}
                        <text 
                          x={p.x} 
                          y={lineChartPoints.height - 5} 
                          textAnchor="middle" 
                          className="text-[10px] font-bold fill-slate-400 uppercase"
                        >
                          {p.label}
                        </text>
                      </g>
                    ))}
                  </svg>

                  {/* Tooltip au survol */}
                  {hoveredPoint && (
                    <div 
                      className="absolute bg-slate-900 text-white text-xs rounded-lg px-3 py-1.5 shadow-xl font-bold border border-slate-700 pointer-events-none transform -translate-x-1/2 -translate-y-12 transition-all z-20"
                      style={{
                        left: `${(hoveredPoint.x / lineChartPoints.width) * 100}%`,
                        top: `${(hoveredPoint.y / lineChartPoints.height) * 100}%`
                      }}
                    >
                      <p className="text-[10px] text-slate-400 font-mono">{hoveredPoint.dateKey}</p>
                      <p className="text-brand-blue-bright font-black">{hoveredPoint.count} passage(s)</p>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-500">
                  <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                    <TrendingUp size={16} /> Flux réel en direct
                  </span>
                  <span>Total 7 derniers jours : <strong className="text-slate-900 dark:text-white">{last7DaysData.reduce((acc, d) => acc + d.count, 0)}</strong> visites</span>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Graphique 2 : Volume par Entreprise */}
        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader
            title="Top Entreprises par Visites"
            subtitle="Répartition des passages selon la boîte"
          />
          <div className="p-5 space-y-4">
            {entrepriseVisits.list.length > 0 ? (
              entrepriseVisits.list.map((ent, idx) => {
                const percent = Math.round((ent.count / (entrepriseVisits.total || 1)) * 100);
                const barWidth = Math.round((ent.count / entrepriseVisits.maxCount) * 100);
                return (
                  <div key={ent.id || idx} className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-slate-800 dark:text-slate-200 truncate max-w-[170px]">{ent.nom}</span>
                      <span className="text-brand-blue-bright font-black">{ent.count} <span className="text-[10px] text-slate-400 font-normal">({percent}%)</span></span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-brand-blue to-brand-blue-bright h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(barWidth, 5)}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-center text-slate-400 text-xs py-8">Aucune donnée de visite pour les entreprises.</p>
            )}
          </div>
        </Card>
      </div>

      {/* 📊 DEUXIÈME RANGEE DE GRAPHIQUES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Graphique 3 : Fréquentation par Tranche Horaire */}
        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader
            title="Fréquentation par Tranche Horaire"
            subtitle="Moments de la journée à plus forte affluence"
          />
          <div className="p-5">
            <div className="grid grid-cols-7 gap-2 items-end h-40 pt-6">
              {hourlyDistribution.map((slot, idx) => (
                <div key={idx} className="flex flex-col items-center h-full justify-end group">
                  <span className="text-[10px] font-black text-brand-blue-bright mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {slot.count}
                  </span>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-t-lg flex items-end h-full overflow-hidden">
                    <div 
                      className="w-full bg-gradient-to-t from-brand-blue-bright to-cyan-400 rounded-t-lg transition-all duration-500 group-hover:brightness-110"
                      style={{ height: `${Math.max(slot.percentage, 8)}%` }}
                    />
                  </div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase mt-2 truncate w-full text-center">
                    {slot.label.split(' ')[0]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Graphique 4 : Répartition des Comptes & Santé des Accès */}
        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader
            title="Répartition & Santé des Comptes"
            subtitle="Structure des rôles d'utilisateurs et statuts réseau"
          />
          <div className="p-5 flex flex-col sm:flex-row items-center justify-around gap-6">
            <div className="relative w-32 h-32 flex items-center justify-center shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-100 dark:text-slate-800"
                  strokeWidth="3.8"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-emerald-500"
                  strokeDasharray={`${Math.round((userRoleStats.active / (userRoleStats.total || 1)) * 100)}, 100`}
                  strokeWidth="3.8"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-xl font-black text-slate-900 dark:text-white">{userRoleStats.total}</span>
                <span className="text-[9px] font-bold text-slate-400 uppercase">Comptes</span>
              </div>
            </div>

            <div className="space-y-2.5 w-full max-w-xs text-xs font-bold">
              <div className="flex items-center justify-between p-2 rounded-lg bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-300">
                <span className="flex items-center gap-2">👑 SuperAdmins</span>
                <span className="font-black">{userRoleStats.superAdmins}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-300">
                <span className="flex items-center gap-2">🛡️ Admins d'Entreprises</span>
                <span className="font-black">{userRoleStats.admins}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-300">
                <span className="flex items-center gap-2">👮 Agents de Sécurité</span>
                <span className="font-black">{userRoleStats.agents}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-300">
                <span className="flex items-center gap-2">🚫 Comptes Suspendus</span>
                <span className="font-black">{userRoleStats.suspended}</span>
              </div>
            </div>
          </div>
        </Card>
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
