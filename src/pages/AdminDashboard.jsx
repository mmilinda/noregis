import React, { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, Users, Car, Clock, Shield, Download, 
  Calendar, Award, UserCheck, RefreshCw, BarChart2
} from 'lucide-react';
import { useApp } from '../context/useAppState';
import { Card, CardHeader, StatCard, Btn } from '../components/UI';
import { visitService } from '../services/visitService';
import { TRANSLATIONS } from '../translations';

export default function AdminDashboard({ isMobile }) {
  const { state, dispatch, notify } = useApp();
  const t = TRANSLATIONS[state.settings?.language || 'fr'];
  
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchStats = async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      const data = await visitService.getAll();
      const rawVisits = data.visites || [];
      // Deduplicate
      const uniqueVisits = Array.from(new Map(rawVisits.map(v => [v._id || v.id, v])).values());
      setVisits(uniqueVisits);
      if (isRefresh) notify('success', 'Statistiques actualisées.');
    } catch (err) {
      notify('error', 'Erreur lors de la récupération des statistiques.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // Helper : normalise le statut pour détecter si quelqu'un est sur site
  const isOnSite = (v) => {
    const s = String(v.statut || '').toLowerCase();
    return (
      s === 'present' || s === 'en-cours' || s === 'en cours' || s === 'on-site'
    ) || (!v.heureSortie && s !== 'sorti' && s !== 'sortis' && s !== 'exited');
  };

  // Helper : détecte si la visite est un véhicule
  const isVehicle = (v) => {
    const t = v.type || v.visiteur?.type || v.visiteurId?.type || v.visitor?.type;
    return String(t || '').toLowerCase() === 'vehicule';
  };

  // 1. Calculate general indicators
  const stats = useMemo(() => {
    const today = new Date().toDateString();

    // Visites d'aujourd'hui uniquement
    const visitsToday = visits.filter(v => {
      if (!v.createdAt) return false;
      return new Date(v.createdAt).toDateString() === today;
    });

    // Semaine en cours vs semaine précédente (pour le % d'évolution)
    const oneWeekAgo = new Date(); oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const twoWeeksAgo = new Date(); twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    const thisWeek = visits.filter(v => v.createdAt && new Date(v.createdAt) >= oneWeekAgo).length;
    const lastWeek = visits.filter(v => {
      if (!v.createdAt) return false;
      const d = new Date(v.createdAt);
      return d >= twoWeeksAgo && d < oneWeekAgo;
    }).length;
    const weekEvolution = lastWeek === 0
      ? (thisWeek > 0 ? 100 : 0)
      : Math.round(((thisWeek - lastWeek) / lastWeek) * 100);

    const activeVisits = visits.filter(isOnSite);
    const vehicleVisits = visits.filter(isVehicle);
    const personVisits = visits.filter(v => !isVehicle(v));

    // Heure de pointe — base = 30 derniers jours (représentatif sans être pollué par de très vieux historiques)
    const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentVisits = visits.filter(v => v.createdAt && new Date(v.createdAt) >= thirtyDaysAgo);

    const hoursCount = Array(24).fill(0);
    recentVisits.forEach(v => {
      if (v.createdAt) {
        const hour = new Date(v.createdAt).getHours();
        hoursCount[hour]++;
      }
    });

    // Heure de pointe — distribution AUJOURD'HUI pour le graphique
    const todayHoursCount = Array(24).fill(0);
    visitsToday.forEach(v => {
      if (v.createdAt) {
        const hour = new Date(v.createdAt).getHours();
        todayHoursCount[hour]++;
      }
    });

    // Cherche la meilleure plage de 2h (cohérent avec les tranches du graphique [8, 10, 12, 14, 16, 18, 20])
    const slots = [8, 10, 12, 14, 16, 18, 20];
    let peakSlot = null;
    let maxSlotVisits = 0;
    slots.forEach(h => {
      const count = (hoursCount[h] || 0) + (hoursCount[h + 1] || 0);
      if (count > maxSlotVisits) {
        maxSlotVisits = count;
        peakSlot = h;
      }
    });

    // Fallback : si aucune visite dans les créneaux standards, chercher heure quelconque
    if (peakSlot === null && recentVisits.length > 0) {
      let peakH = 0, maxH = 0;
      hoursCount.forEach((c, h) => { if (c > maxH) { maxH = c; peakH = h; } });
      peakSlot = peakH;
    }

    const peakHourLabel = peakSlot !== null && maxSlotVisits > 0
      ? `${String(peakSlot).padStart(2, '0')}:00 – ${String(peakSlot + 2).padStart(2, '0')}:00`
      : '—';

    return {
      total: visits.length,
      today: visitsToday.length,
      active: activeVisits.length,
      vehicles: vehicleVisits.length,
      people: personVisits.length,
      peakHour: peakHourLabel,
      hourlyDistribution: hoursCount,
      todayHourlyDistribution: todayHoursCount,
      weekEvolution,
    };
  }, [visits]);

  // 2. Hourly data for SVG Chart — AUJOURD'HUI uniquement (8h → 20h par tranches de 2h)
  const chartData = useMemo(() => {
    const hours = [8, 10, 12, 14, 16, 18, 20];
    const dist = stats.todayHourlyDistribution;
    return hours.map(h => ({
      label: `${h}h`,
      val: (dist[h] || 0) + (dist[h + 1] || 0),
    }));
  }, [stats.todayHourlyDistribution]);

  // Calculate drawing coordinates for line chart
  const lineChartPoints = useMemo(() => {
    const maxVal = Math.max(...chartData.map(d => d.val), 3); // minimum scaling limit of 3
    const width = 500;
    const height = 150;
    const padding = 25;
    
    const points = chartData.map((d, index) => {
      const x = padding + (index / (chartData.length - 1)) * (width - 2 * padding);
      const y = height - padding - (d.val / maxVal) * (height - 2 * padding);
      return { x, y, label: d.label, val: d.val };
    });

    const pathData = points.reduce((acc, p, idx) => {
      return acc + `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y} `;
    }, '');

    // Area path closing at the bottom
    const areaPathData = pathData + 
      `L ${points[points.length - 1].x} ${height - padding} ` + 
      `L ${points[0].x} ${height - padding} Z`;

    return { points, pathData, areaPathData, width, height, padding };
  }, [chartData]);

  // Department popularity list
  const departmentsList = useMemo(() => {
    const depts = {};
    visits.forEach(v => {
      const d = v.departement || v.visiteur?.departement || 'Visiteur';
      depts[d] = (depts[d] || 0) + 1;
    });
    return Object.entries(depts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [visits]);

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <BarChart2 className="text-brand-blue-bright fill-brand-blue-bright/10" size={26} />
            Supervision & Statistiques
          </h1>
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-wider">
            Consultez les indicateurs d'accès en temps réel et analysez la fréquentation du site.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Btn variant="secondary" size="sm" icon={RefreshCw} onClick={() => fetchStats(true)} className="text-[10px] font-black uppercase">
            Actualiser
          </Btn>
        </div>
      </div>

      {/* Grid of indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white dark:bg-[#161B22] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-4 hover:shadow-lg transition-all duration-300">
          <div className="w-12 h-12 rounded-xl bg-brand-blue-bright/10 text-brand-blue-bright flex items-center justify-center shrink-0">
            <Users size={24} />
          </div>
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Total Visites</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1 leading-none">{stats.total}</h3>
            <p className="text-[10px] font-bold text-slate-500 mt-1">Depuis le lancement</p>
          </div>
        </div>

        <div className="bg-white dark:bg-[#161B22] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-4 hover:shadow-lg transition-all duration-300">
          <div className="w-12 h-12 rounded-xl bg-brand-green-bright/10 text-brand-green-bright flex items-center justify-center shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-green-bright animate-ping absolute" />
            <span className="w-2.5 h-2.5 rounded-full bg-brand-green-bright relative" />
          </div>
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Sur Site Actuels</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1 leading-none">{stats.active}</h3>
            <p className="text-[10px] font-bold text-brand-green mt-1">Flux en temps réel</p>
          </div>
        </div>

        <div className="bg-white dark:bg-[#161B22] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-4 hover:shadow-lg transition-all duration-300">
          <div className="w-12 h-12 rounded-xl bg-brand-amber-bright/10 text-brand-amber-bright flex items-center justify-center shrink-0">
            <Car size={24} />
          </div>
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Véhicules Enregistrés</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1 leading-none">{stats.vehicles}</h3>
            <p className="text-[10px] font-bold text-slate-500 mt-1">Total engins roulants</p>
          </div>
        </div>

        <div className="bg-white dark:bg-[#161B22] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-4 hover:shadow-lg transition-all duration-300">
          <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Heure de Pointe</p>
            <h3 className={`font-black text-slate-900 dark:text-white mt-2 leading-none truncate max-w-[150px] ${stats.peakHour === '—' ? 'text-2xl' : 'text-sm'}`}>
              {stats.peakHour}
            </h3>
            <p className="text-[10px] font-bold text-slate-500 mt-1">30 derniers jours</p>
          </div>
        </div>
      </div>

      {/* Main Charts & Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* SVG Line Chart (Hourly Traffic) */}
        <Card className="lg:col-span-2 border-slate-200 dark:border-slate-800">
          <CardHeader title="Courbe d'Affluence (Aujourd'hui)" subtitle="Volume des entrées cumulées par tranches de 2 heures." />
          <div className="p-6">
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
                      <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#2563EB" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#2563EB" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* Grid lines */}
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

                    {/* Gradient Area */}
                    <path 
                      d={lineChartPoints.areaPathData} 
                      fill="url(#chartGrad)" 
                    />

                    {/* Main Line */}
                    <path 
                      d={lineChartPoints.pathData} 
                      fill="none" 
                      stroke="#2563EB" 
                      strokeWidth="3.5" 
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />

                    {/* Data Points */}
                    {lineChartPoints.points.map((p, idx) => (
                      <g key={idx} className="group cursor-pointer">
                        <circle 
                          cx={p.x} 
                          cy={p.y} 
                          r="5.5" 
                          fill="#ffffff" 
                          stroke="#2563EB" 
                          strokeWidth="3"
                          className="transition-all duration-200 hover:r-7"
                        />
                        {/* Tooltip text (value) above dot */}
                        <text
                          x={p.x}
                          y={p.y - 12}
                          textAnchor="middle"
                          className="text-[9px] font-black fill-slate-700 dark:fill-slate-300"
                        >
                          {p.val}
                        </text>
                      </g>
                    ))}

                    {/* X Axis labels */}
                    {lineChartPoints.points.map((p, idx) => (
                      <text 
                        key={idx}
                        x={p.x} 
                        y={lineChartPoints.height - 4} 
                        textAnchor="middle" 
                        className="text-[9px] font-black fill-slate-400 dark:fill-slate-500 uppercase tracking-wider"
                      >
                        {p.label}
                      </text>
                    ))}
                  </svg>
                </div>
                <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900/30 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800/50">
                  <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Fluctuations d'entrées</span>
                  <span className={`text-xs font-black flex items-center gap-1 ${stats.weekEvolution > 0 ? 'text-brand-blue' : stats.weekEvolution < 0 ? 'text-brand-red' : 'text-slate-400'}`}>
                    <TrendingUp size={16} className={stats.weekEvolution < 0 ? 'rotate-180' : ''} />
                    {stats.weekEvolution > 0 ? '+' : ''}{stats.weekEvolution}% vs la semaine dernière
                  </span>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Breakdown & Popularity side panel */}
        <div className="flex flex-col gap-6">
          {/* Visitor Split Card */}
          <Card className="border-slate-200 dark:border-slate-800 flex-1">
            <CardHeader title="Répartition des Visites" subtitle="Comparaison personnes physiques vs véhicules" />
            <div className="p-6 flex flex-col justify-between h-full gap-5">
              {loading ? (
                <div className="h-32 flex items-center justify-center">
                  <span className="w-8 h-8 border-3 border-brand-blue-bright border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <div className="space-y-4">
                  {/* People bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                      <span className="flex items-center gap-1.5"><Users size={14} className="text-brand-blue-bright" /> Personnes</span>
                      <span>{stats.people} ({stats.total > 0 ? Math.round((stats.people / stats.total) * 100) : 0}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-brand-blue-bright h-full rounded-full transition-all duration-1000"
                        style={{ width: `${stats.total > 0 ? (stats.people / stats.total) * 100 : 0}%` }}
                      />
                    </div>
                  </div>

                  {/* Vehicles bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                      <span className="flex items-center gap-1.5"><Car size={14} className="text-brand-amber-bright" /> Véhicules</span>
                      <span>{stats.vehicles} ({stats.total > 0 ? Math.round((stats.vehicles / stats.total) * 100) : 0}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-brand-amber-bright h-full rounded-full transition-all duration-1000"
                        style={{ width: `${stats.total > 0 ? (stats.vehicles / stats.total) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}
              
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-around text-center">
                <div>
                  <h4 className="text-xl font-black text-slate-800 dark:text-white leading-none">{stats.people}</h4>
                  <p className="text-[9px] uppercase font-bold text-slate-400 mt-1">Membres</p>
                </div>
                <div className="w-px bg-slate-100 dark:bg-slate-800" />
                <div>
                  <h4 className="text-xl font-black text-slate-800 dark:text-white leading-none">{stats.vehicles}</h4>
                  <p className="text-[9px] uppercase font-bold text-slate-400 mt-1">Moyens Mobiles</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Popular Departments Card */}
          <Card className="border-slate-200 dark:border-slate-800 flex-1">
            <CardHeader title="Départements les plus visités" />
            <div className="p-4">
              {loading ? (
                <div className="h-32 flex items-center justify-center">
                  <span className="w-6 h-6 border-2 border-brand-blue-bright border-t-transparent rounded-full animate-spin" />
                </div>
              ) : departmentsList.length === 0 ? (
                <div className="text-center text-xs font-bold text-slate-400 py-6">Aucune donnée départementale.</div>
              ) : (
                <div className="space-y-3">
                  {departmentsList.map((dept, idx) => (
                    <div key={idx} className="flex justify-between items-center p-2 rounded-lg bg-slate-50 dark:bg-slate-900/40 hover:scale-[1.01] transition-transform">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                        <span className="w-5 h-5 rounded bg-brand-blue-bright/10 text-brand-blue-bright text-[10px] font-black flex items-center justify-center">
                          {idx + 1}
                        </span>
                        {dept.name}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-[10px] font-black text-slate-600 dark:text-slate-400">
                        {dept.count} visite(s)
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>
        
      </div>
    </div>
  );
}
