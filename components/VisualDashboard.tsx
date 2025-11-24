
import React from 'react';
import { Project, ViewMode } from '../types';
import { TrendingUp, Users, Footprints, IndianRupee, ArrowUpRight, ArrowDownRight, Target, Activity, Info } from 'lucide-react';

interface Props {
  projects: Project[];
  viewMode: ViewMode;
}

export const VisualDashboard: React.FC<Props> = ({ projects, viewMode }) => {
  
  // --- AGGREGATION LOGIC ---
  const activeProjects = projects.filter(p => p.status !== 'Completed');

  // 1. Totals
  let totalPlannedBudget = 0;
  let totalActualSpend = 0;
  let totalTargetLeads = 0;
  let totalActualLeads = 0;
  let totalTargetWalkins = 0;
  let totalActualWalkins = 0;
  let totalActualBookings = 0;

  // 2. Weekly Trends (Aggregated)
  const weeklyTrendMap = new Map<number, { plannedSpend: number, actualSpend: number, label: string }>();

  activeProjects.forEach(p => {
    const taxMult = viewMode === ViewMode.AGENCY ? (1 + p.plan.taxPercent/100) : 1;
    
    p.weeks.forEach(w => {
      const wPlanSpend = (viewMode === ViewMode.AGENCY ? w.spendsAllIn : w.spendsBase);
      totalPlannedBudget += wPlanSpend;
      totalTargetLeads += w.leads;
      totalTargetWalkins += w.ad;

      const act = p.actuals[w.id] || { leads: 0, ad: 0, spends: 0, bookings: 0 };
      const wActSpend = (act.spends || 0) * taxMult;
      
      totalActualSpend += wActSpend;
      totalActualLeads += (act.leads || 0);
      totalActualWalkins += (act.ad || 0);
      totalActualBookings += (act.bookings || 0);

      if (!weeklyTrendMap.has(w.id)) {
        weeklyTrendMap.set(w.id, { plannedSpend: 0, actualSpend: 0, label: w.weekLabel });
      }
      const trend = weeklyTrendMap.get(w.id)!;
      trend.plannedSpend += wPlanSpend;
      trend.actualSpend += wActSpend;
    });
  });

  const trends = Array.from(weeklyTrendMap.entries())
    .sort((a, b) => a[0] - b[0])
    .filter(t => t[1].plannedSpend > 0 || t[1].actualSpend > 0)
    .map(t => t[1]);

  // --- SVG CHART HELPERS ---
  const width = 1000;
  const height = 300;
  const padding = 40;
  
  const maxSpend = Math.max(...trends.map(t => Math.max(t.plannedSpend, t.actualSpend)), 10000);
  
  const yScale = (val: number) => height - padding - ((val / maxSpend) * (height - (padding * 2)));
  const xScale = (idx: number) => padding + (idx * ((width - (padding * 2)) / (trends.length - 1 || 1)));

  const createPath = (dataKey: 'plannedSpend' | 'actualSpend') => {
    if (trends.length === 0) return '';
    return trends.map((t, i) => 
      `${i === 0 ? 'M' : 'L'} ${xScale(i)} ${yScale(t[dataKey])}`
    ).join(' ');
  };

  const createAreaPath = (dataKey: 'plannedSpend' | 'actualSpend') => {
    if (trends.length === 0) return '';
    const line = createPath(dataKey);
    return `${line} L ${xScale(trends.length - 1)} ${height - padding} L ${padding} ${height - padding} Z`;
  };

  const Card = ({ title, value, subValue, icon: Icon, trend, colorClass, gradient, tooltip }: any) => (
    <div className={`rounded-2xl p-6 border border-slate-700/50 shadow-xl relative overflow-hidden group bg-gradient-to-br ${gradient}`}>
      <div className={`absolute -right-6 -top-6 p-4 opacity-10 group-hover:opacity-20 transition-opacity duration-500 rotate-12 ${colorClass}`}>
        <Icon className="w-24 h-24" />
      </div>
      <div className="flex items-center gap-3 mb-3 relative z-10">
        <div className={`p-2.5 rounded-xl bg-slate-900/40 backdrop-blur-sm border border-white/10 ${colorClass} text-white shadow-inner`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex items-center gap-2">
          <h3 className="text-slate-200 text-xs font-bold uppercase tracking-widest">{title}</h3>
          {tooltip && (
            <div className="group/tooltip relative">
              <Info className="w-3.5 h-3.5 text-slate-500 hover:text-white cursor-help transition-colors" />
              <div className="absolute left-0 top-full mt-2 w-48 p-3 bg-slate-800 border border-slate-600 rounded-lg text-[10px] text-slate-200 shadow-xl opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all duration-200 z-50 pointer-events-none leading-relaxed">
                {tooltip}
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="text-3xl font-black text-white mb-1 relative z-10 tracking-tight">{value}</div>
      <div className="text-xs font-medium text-slate-300 flex items-center gap-1.5 relative z-10">
        <span className={`flex items-center ${trend === 'up' ? 'text-emerald-300' : trend === 'down' ? 'text-rose-300' : 'text-slate-400'}`}>
          {trend === 'up' ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
        </span>
        {subValue}
      </div>
    </div>
  );

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

  const formatCompact = (val: number) => 
    Intl.NumberFormat('en-IN', { notation: "compact", maximumFractionDigits: 1 }).format(val);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card 
          title="Total Spend" 
          value={formatCurrency(totalActualSpend)} 
          subValue={`${totalPlannedBudget > 0 ? ((totalActualSpend/totalPlannedBudget)*100).toFixed(1) : 0}% of Plan`}
          icon={IndianRupee}
          colorClass="text-blue-400"
          gradient="from-slate-800 to-slate-900"
          trend={totalActualSpend > totalPlannedBudget ? 'up' : 'down'}
          tooltip="Cumulative actual spend across all active campaigns vs the allocated budget."
        />
        <Card 
          title="Leads Generated" 
          value={totalActualLeads.toLocaleString()} 
          subValue={`vs ${formatCompact(totalTargetLeads)} Target`}
          icon={Users}
          colorClass="text-cyan-400"
          gradient="from-slate-800 to-cyan-950/30"
          trend="up"
          tooltip="Total valid inquiries generated. Measures top-of-funnel marketing performance."
        />
        <Card 
          title="Site Walkins" 
          value={totalActualWalkins.toLocaleString()} 
          subValue={`Conv Rate: ${totalActualLeads > 0 ? ((totalActualWalkins/totalActualLeads)*100).toFixed(1) : 0}%`}
          icon={Footprints}
          colorClass="text-violet-400"
          gradient="from-slate-800 to-violet-950/30"
          trend="up"
          tooltip="Physical site visits (AD - Appointment Done) generated from leads. Indicates lead quality."
        />
        <Card 
          title="Total Bookings" 
          value={totalActualBookings} 
          subValue={`Est. CPB: ${totalActualBookings > 0 ? formatCompact(totalActualSpend/totalActualBookings) : '-'}`}
          icon={Target}
          colorClass="text-emerald-400"
          gradient="from-slate-800 to-emerald-950/30"
          trend="up"
          tooltip="Confirmed units sold. The ultimate measure of ROI and campaign success."
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-2xl relative overflow-hidden">
           <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-blue-600"></div>
           <div className="flex justify-between items-center mb-8">
             <div>
                <h3 className="text-white font-bold text-lg tracking-wide flex items-center gap-2">
                  <Activity className="w-5 h-5 text-cyan-400" /> 
                  Spend Trajectory
                </h3>
                <p className="text-slate-400 text-xs mt-1">Comparing Weekly Planned Budget vs. Actual Spend</p>
             </div>
             <div className="flex gap-6 text-xs font-medium">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-slate-600 border border-slate-500"></div>
                  <span className="text-slate-300">Planned Budget</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]"></div>
                  <span className="text-cyan-100">Actual Spend</span>
                </div>
             </div>
           </div>
           <div className="w-full h-64 relative">
              <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
                 {[0, 0.25, 0.5, 0.75, 1].map(pct => {
                   const y = height - padding - (pct * (height - padding * 2));
                   return (
                     <g key={pct}>
                       <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="#334155" strokeWidth="1" strokeDasharray="4 4" />
                       <text x={padding - 10} y={y + 4} textAnchor="end" className="fill-slate-500 text-[10px] font-sans">
                         {formatCompact(maxSpend * pct)}
                       </text>
                     </g>
                   );
                 })}
                 <path d={createAreaPath('plannedSpend')} fill="rgba(148, 163, 184, 0.1)" stroke="none" />
                 <path d={createPath('plannedSpend')} fill="none" stroke="#64748b" strokeWidth="2" strokeDasharray="5 5" />
                 <defs>
                    <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.4"/>
                      <stop offset="100%" stopColor="#06b6d4" stopOpacity="0"/>
                    </linearGradient>
                 </defs>
                 <path d={createAreaPath('actualSpend')} fill="url(#actualGradient)" stroke="none" />
                 <path d={createPath('actualSpend')} fill="none" stroke="#06b6d4" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" filter="drop-shadow(0px 0px 4px rgba(6,182,212,0.5))" />
                 {trends.map((t, i) => (
                   <g key={i}>
                     <circle cx={xScale(i)} cy={yScale(t.actualSpend)} r="6" fill="#06b6d4" stroke="#fff" strokeWidth="2" className="transition-all duration-300 hover:r-8 cursor-pointer">
                        <title>{`${t.label}: ₹${t.actualSpend.toLocaleString()}`}</title>
                      </circle>
                   </g>
                 ))}
                 {trends.map((t, i) => (
                    <text key={i} x={xScale(i)} y={height - 10} textAnchor="middle" className="fill-slate-500 text-[10px] font-sans">{t.label}</text>
                 ))}
              </svg>
           </div>
        </div>

        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-2xl flex flex-col items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900 to-slate-950"></div>
          <h3 className="text-white font-bold text-sm uppercase tracking-wide mb-8 w-full text-left relative z-10">Conversion Flow</h3>
          <div className="w-full max-w-[280px] flex flex-col items-center relative z-10 space-y-2">
            <div className="w-full relative group">
              <div className="h-16 bg-gradient-to-r from-blue-600 to-blue-500 rounded-lg transform perspective-500 shadow-lg shadow-blue-900/40 flex items-center justify-between px-4 transition-transform group-hover:scale-105">
                <span className="text-white font-bold text-sm">LEADS</span>
                <span className="text-2xl font-black text-white">{formatCompact(totalActualLeads)}</span>
              </div>
              <div className="h-4 w-0.5 bg-slate-700 mx-auto"></div>
            </div>
            <div className="w-[80%] relative group">
              <div className="absolute -right-24 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 text-right">
                <span className="block text-white font-bold">{totalActualLeads > 0 ? ((totalActualWalkins/totalActualLeads)*100).toFixed(1) : 0}%</span> Conversion
              </div>
              <div className="h-16 bg-gradient-to-r from-violet-600 to-violet-500 rounded-lg shadow-lg shadow-violet-900/40 flex items-center justify-between px-4 transition-transform group-hover:scale-105">
                <span className="text-white font-bold text-sm">WALKINS</span>
                <span className="text-2xl font-black text-white">{totalActualWalkins}</span>
              </div>
               <div className="h-4 w-0.5 bg-slate-700 mx-auto"></div>
            </div>
            <div className="w-[60%] relative group">
               <div className="absolute -right-24 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 text-right">
                <span className="block text-white font-bold">{totalActualWalkins > 0 ? ((totalActualBookings/totalActualWalkins)*100).toFixed(1) : 0}%</span> Conversion
              </div>
              <div className="h-16 bg-gradient-to-r from-emerald-600 to-emerald-500 rounded-lg shadow-lg shadow-emerald-900/40 flex items-center justify-between px-4 transition-transform group-hover:scale-105">
                <span className="text-white font-bold text-sm">BOOKINGS</span>
                <span className="text-2xl font-black text-white">{totalActualBookings}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
