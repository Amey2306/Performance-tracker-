
import React, { useState, useMemo } from 'react';
import { Project, ViewMode } from '../types';
import { TrendingUp, Users, Footprints, IndianRupee, ArrowUpRight, ArrowDownRight, Target, Activity, Info, Filter, PieChart, BarChart3, AlertCircle, Download } from 'lucide-react';
import { exportAnalytics } from '../utils/exportUtils';

interface Props {
  projects: Project[];
  viewMode: ViewMode;
}

export const VisualDashboard: React.FC<Props> = ({ projects, viewMode }) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  
  // --- AGGREGATION LOGIC ---
  // Filter for active projects first
  const eligibleProjects = projects.filter(p => p.status !== 'Completed');

  // Apply local slicer filter
  const filteredProjects = useMemo(() => {
    return selectedProjectId === 'all'
      ? eligibleProjects
      : eligibleProjects.filter(p => p.id === selectedProjectId);
  }, [selectedProjectId, eligibleProjects]);

  // 1. Totals
  let totalPlannedBudget = 0;
  let totalActualSpend = 0;
  let totalTargetLeads = 0;
  let totalActualLeads = 0;
  let totalTargetWalkins = 0;
  let totalActualWalkins = 0;
  let totalActualBookings = 0;

  // 2. Weekly Trends (Aggregated)
  const weeklyTrendMap = new Map<number, { 
    plannedSpend: number, 
    actualSpend: number, 
    actualLeads: number,
    label: string 
  }>();

  // 3. Media Mix Aggregation
  const mediaMixMap = new Map<string, { name: string, allocation: number }>();

  filteredProjects.forEach(p => {
    const taxMult = viewMode === ViewMode.AGENCY ? (1 + p.plan.taxPercent/100) : 1;
    
    // Aggregate Weeks
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
        weeklyTrendMap.set(w.id, { plannedSpend: 0, actualSpend: 0, actualLeads: 0, label: w.weekLabel });
      }
      const trend = weeklyTrendMap.get(w.id)!;
      trend.plannedSpend += wPlanSpend;
      trend.actualSpend += wActSpend;
      trend.actualLeads += (act.leads || 0);
    });

    // Aggregate Media Mix
    p.mediaPlan.forEach(ch => {
       if (!mediaMixMap.has(ch.id)) {
         mediaMixMap.set(ch.id, { name: ch.name, allocation: 0 });
       }
       mediaMixMap.get(ch.id)!.allocation += ch.allocationPercent;
    });
  });

  const trends = Array.from(weeklyTrendMap.entries())
    .sort((a, b) => a[0] - b[0])
    .filter(t => t[1].plannedSpend > 0 || t[1].actualSpend > 0) // Only show active weeks
    .map(t => ({
        ...t[1],
        cpl: t[1].actualLeads > 0 ? t[1].actualSpend / t[1].actualLeads : 0
    }));

  const mediaMix = Array.from(mediaMixMap.values());
  const totalMixAlloc = mediaMix.reduce((sum, m) => sum + m.allocation, 0);

  // --- INSIGHTS GENERATION ---
  const insights = [];
  const spendDiff = totalActualSpend - totalPlannedBudget;
  if (spendDiff > 0) insights.push({ type: 'negative', text: `Overspending by ${((spendDiff/totalPlannedBudget)*100).toFixed(1)}% vs Plan.` });
  else insights.push({ type: 'positive', text: `Budget efficiency is good. ${Math.abs((spendDiff/totalPlannedBudget)*100).toFixed(1)}% under plan.` });

  const overallCPL = totalActualLeads > 0 ? totalActualSpend / totalActualLeads : 0;
  // Calculate weighted plan CPL
  let totalPlanCPL = 0;
  if (filteredProjects.length > 0) {
      totalPlanCPL = filteredProjects.reduce((sum, p) => sum + p.plan.cpl, 0) / filteredProjects.length;
      if (overallCPL > totalPlanCPL) insights.push({ type: 'negative', text: `CPL is running high (₹${Math.round(overallCPL)}) vs Plan (₹${Math.round(totalPlanCPL)}).` });
      else insights.push({ type: 'positive', text: `CPL is healthy at ₹${Math.round(overallCPL)}.` });
  }

  // --- SVG CHART HELPERS ---
  const width = 800;
  const height = 250;
  const padding = 40;
  
  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

  const formatCompact = (val: number) => 
    Intl.NumberFormat('en-IN', { notation: "compact", maximumFractionDigits: 1 }).format(val);

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

  // -- Pie Chart Math --
  let accumulatedAngle = 0;
  const pieData = mediaMix.map(m => {
      const percentage = m.allocation / totalMixAlloc;
      const angle = percentage * 360;
      const startAngle = accumulatedAngle;
      accumulatedAngle += angle;
      return { ...m, percentage, startAngle, endAngle: accumulatedAngle, color: '' }; 
  });
  const pieColors = ['#3b82f6', '#06b6d4', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

  // -- Bar Chart Helpers --
  const maxBarVal = Math.max(...trends.map(t => Math.max(t.plannedSpend, t.actualSpend)), 1000);
  const barScaleY = (val: number) => height - padding - ((val / maxBarVal) * (height - (padding * 2)));
  const barWidth = (width - (padding * 2)) / trends.length / 3;

  // -- Line Chart Helpers --
  const maxCPLVal = Math.max(...trends.map(t => t.cpl), totalPlanCPL * 1.5, 1000);
  const cplScaleY = (val: number) => height - padding - ((val / maxCPLVal) * (height - (padding * 2)));
  const lineScaleX = (idx: number) => padding + (idx * ((width - (padding * 2)) / (trends.length - 1 || 1)));
  
  const createLinePath = (data: any[]) => {
      if (data.length === 0) return '';
      return data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${lineScaleX(i)} ${cplScaleY(d.cpl)}`).join(' ');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      
      {/* Dashboard Header with Filter */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2 bg-slate-900/50 p-4 rounded-2xl border border-slate-800 backdrop-blur-sm">
         <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-brand-500" />
                Performance Analytics
            </h2>
            <p className="text-slate-400 text-xs mt-1">
               {selectedProjectId === 'all' ? `Aggregated view of ${eligibleProjects.length} active projects.` : `Detailed breakdown for ${filteredProjects[0]?.name}.`}
            </p>
         </div>
         
         <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
             <div className="flex items-center bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 shadow-sm hover:border-brand-500/50 transition-colors w-full md:w-auto">
                <Filter className="w-4 h-4 text-slate-400 mr-3" />
                <div className="flex flex-col w-full">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Project Filter</span>
                    <select
                        value={selectedProjectId}
                        onChange={(e) => setSelectedProjectId(e.target.value)}
                        className="bg-transparent text-sm font-bold text-white outline-none cursor-pointer min-w-[150px] w-full"
                    >
                        <option value="all">All Active Projects</option>
                        <optgroup label="Specific Projects">
                            {eligibleProjects.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </optgroup>
                    </select>
                </div>
             </div>
             
             <button 
               onClick={() => exportAnalytics(projects, viewMode, selectedProjectId)}
               className="p-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-slate-400 hover:text-white transition-colors w-full sm:w-auto flex justify-center"
               title="Export Analytics Data"
             >
               <Download className="w-5 h-5" />
             </button>
         </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card 
          title="Total Spend" 
          value={formatCurrency(totalActualSpend)} 
          subValue={`${totalPlannedBudget > 0 ? ((totalActualSpend/totalPlannedBudget)*100).toFixed(1) : 0}% of Plan`}
          icon={IndianRupee}
          colorClass="text-blue-400"
          gradient="from-slate-800 to-slate-900"
          trend={totalActualSpend > totalPlannedBudget ? 'up' : 'down'}
          tooltip="Cumulative actual spend vs allocated budget."
        />
        <Card 
          title="Leads Generated" 
          value={totalActualLeads.toLocaleString()} 
          subValue={`vs ${formatCompact(totalTargetLeads)} Target`}
          icon={Users}
          colorClass="text-cyan-400"
          gradient="from-slate-800 to-cyan-950/30"
          trend="up"
          tooltip="Total valid inquiries generated."
        />
        <Card 
          title="Site Walkins" 
          value={totalActualWalkins.toLocaleString()} 
          subValue={`Conv Rate: ${totalActualLeads > 0 ? ((totalActualWalkins/totalActualLeads)*100).toFixed(1) : 0}%`}
          icon={Footprints}
          colorClass="text-violet-400"
          gradient="from-slate-800 to-violet-950/30"
          trend="up"
          tooltip="Physical site visits (AD)."
        />
        <Card 
          title="Total Bookings" 
          value={totalActualBookings} 
          subValue={`Est. CPB: ${totalActualBookings > 0 ? formatCompact(totalActualSpend/totalActualBookings) : '-'}`}
          icon={Target}
          colorClass="text-emerald-400"
          gradient="from-slate-800 to-emerald-950/30"
          trend="up"
          tooltip="Confirmed units sold (Digital + Presales)."
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* CHART 1: Budget vs Spend (Bar Chart) */}
        <div className="lg:col-span-2 bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-2xl relative overflow-hidden">
           <div className="flex justify-between items-center mb-6">
             <div>
                <h3 className="text-white font-bold text-lg tracking-wide flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-400" /> 
                  Weekly Budget vs. Spend
                </h3>
             </div>
             <div className="flex gap-4 text-xs font-medium">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-slate-600"></div>
                  <span className="text-slate-300">Planned</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500"></div>
                  <span className="text-blue-100">Actual</span>
                </div>
             </div>
           </div>
           <div className="w-full h-64">
              {trends.length > 0 ? (
              <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible" preserveAspectRatio="none">
                 {/* Grid Lines */}
                 {[0, 0.25, 0.5, 0.75, 1].map(pct => {
                   const y = height - padding - (pct * (height - padding * 2));
                   return (
                     <g key={pct}>
                       <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="#334155" strokeWidth="1" strokeDasharray="4 4" />
                       <text x={padding - 10} y={y + 4} textAnchor="end" className="fill-slate-500 text-[10px] font-sans">
                         {formatCompact(maxBarVal * pct)}
                       </text>
                     </g>
                   );
                 })}
                 
                 {/* Bars */}
                 {trends.map((t, i) => {
                    const x = padding + (i * ((width - padding * 2) / trends.length)) + (barWidth / 2);
                    const hPlan = (height - padding) - barScaleY(t.plannedSpend);
                    const hAct = (height - padding) - barScaleY(t.actualSpend);
                    
                    return (
                        <g key={i} className="group/bar">
                            <rect 
                                x={x} 
                                y={barScaleY(t.plannedSpend)} 
                                width={barWidth} 
                                height={hPlan} 
                                fill="#475569" 
                                rx="2"
                                className="opacity-80 hover:opacity-100 transition-opacity"
                            >
                                <title>Planned: {formatCurrency(t.plannedSpend)}</title>
                            </rect>
                            <rect 
                                x={x + barWidth + 2} 
                                y={barScaleY(t.actualSpend)} 
                                width={barWidth} 
                                height={hAct} 
                                fill="#3b82f6" 
                                rx="2"
                                className="opacity-90 hover:opacity-100 transition-opacity"
                            >
                                <title>Actual: {formatCurrency(t.actualSpend)}</title>
                            </rect>
                            <text x={x + barWidth} y={height - 15} textAnchor="middle" className="fill-slate-500 text-[10px] font-sans">{t.label.split(' ')[1]}</text>
                        </g>
                    )
                 })}
              </svg>
              ) : (
                  <div className="h-full flex items-center justify-center text-slate-500 text-sm">No active weeks with spend data found.</div>
              )}
           </div>
        </div>

        {/* CHART 2: Conversion Funnel */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-2xl flex flex-col items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900 to-slate-950"></div>
          <h3 className="text-white font-bold text-sm uppercase tracking-wide mb-8 w-full text-left relative z-10">Conversion Funnel</h3>
          <div className="w-full max-w-[280px] flex flex-col items-center relative z-10 space-y-2">
            <div className="w-full relative group">
              <div className="h-14 bg-gradient-to-r from-blue-600 to-blue-500 rounded-lg shadow-lg shadow-blue-900/40 flex items-center justify-between px-4 transition-transform group-hover:scale-105">
                <span className="text-white font-bold text-xs">LEADS</span>
                <span className="text-xl font-black text-white">{formatCompact(totalActualLeads)}</span>
              </div>
              <div className="h-4 w-0.5 bg-slate-700 mx-auto"></div>
            </div>
            <div className="w-[80%] relative group">
              <div className="absolute -right-24 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 text-right">
                <span className="block text-white font-bold">{totalActualLeads > 0 ? ((totalActualWalkins/totalActualLeads)*100).toFixed(1) : 0}%</span> Conv
              </div>
              <div className="h-14 bg-gradient-to-r from-violet-600 to-violet-500 rounded-lg shadow-lg shadow-violet-900/40 flex items-center justify-between px-4 transition-transform group-hover:scale-105">
                <span className="text-white font-bold text-xs">WALKINS</span>
                <span className="text-xl font-black text-white">{totalActualWalkins}</span>
              </div>
               <div className="h-4 w-0.5 bg-slate-700 mx-auto"></div>
            </div>
            <div className="w-[60%] relative group">
               <div className="absolute -right-24 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 text-right">
                <span className="block text-white font-bold">{totalActualWalkins > 0 ? ((totalActualBookings/totalActualWalkins)*100).toFixed(1) : 0}%</span> Conv
              </div>
              <div className="h-14 bg-gradient-to-r from-emerald-600 to-emerald-500 rounded-lg shadow-lg shadow-emerald-900/40 flex items-center justify-between px-4 transition-transform group-hover:scale-105">
                <span className="text-white font-bold text-xs">BOOKINGS</span>
                <span className="text-xl font-black text-white">{totalActualBookings}</span>
              </div>
            </div>
          </div>
        </div>

        {/* CHART 3: CPL Trend Line */}
        <div className="lg:col-span-2 bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-2xl relative overflow-hidden">
           <div className="flex justify-between items-center mb-6">
             <div>
                <h3 className="text-white font-bold text-lg tracking-wide flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-pink-400" /> 
                  CPL Efficiency Trend
                </h3>
             </div>
             <div className="text-xs font-bold text-slate-400">Avg Target: ₹{Math.round(totalPlanCPL)}</div>
           </div>
           <div className="w-full h-56">
              {trends.length > 0 ? (
              <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible" preserveAspectRatio="none">
                 {/* Grid */}
                 {[0, 0.5, 1].map(pct => {
                   const y = height - padding - (pct * (height - padding * 2));
                   return (
                     <g key={pct}>
                       <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="#334155" strokeWidth="1" strokeDasharray="4 4" />
                       <text x={padding - 10} y={y + 4} textAnchor="end" className="fill-slate-500 text-[10px] font-sans">
                         ₹{formatCompact(maxCPLVal * pct)}
                       </text>
                     </g>
                   );
                 })}
                 
                 {/* Trend Line */}
                 <path d={createLinePath(trends)} fill="none" stroke="#ec4899" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" filter="drop-shadow(0px 0px 4px rgba(236,72,153,0.5))" />
                 
                 {/* Points */}
                 {trends.map((t, i) => (
                   <g key={i} className="group/point">
                     <circle cx={lineScaleX(i)} cy={cplScaleY(t.cpl)} r="5" fill="#ec4899" stroke="#fff" strokeWidth="2" className="cursor-pointer transition-all group-hover/point:r-7" />
                     <rect x={lineScaleX(i) - 25} y={cplScaleY(t.cpl) - 35} width="50" height="20" rx="4" fill="#1e293b" className="opacity-0 group-hover/point:opacity-100 transition-opacity" />
                     <text x={lineScaleX(i)} y={cplScaleY(t.cpl) - 21} textAnchor="middle" className="fill-white text-[10px] font-bold opacity-0 group-hover/point:opacity-100 pointer-events-none">₹{Math.round(t.cpl)}</text>
                   </g>
                 ))}
                 
                 {/* X Axis Labels */}
                 {trends.map((t, i) => (
                    <text key={i} x={lineScaleX(i)} y={height - 10} textAnchor="middle" className="fill-slate-500 text-[10px] font-sans">{t.label.split(' ')[1]}</text>
                 ))}
              </svg>
              ) : (
                  <div className="h-full flex items-center justify-center text-slate-500 text-sm">No active data.</div>
              )}
           </div>
        </div>

        {/* CHART 4: Media Mix & Insights */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-2xl flex flex-col">
           <h3 className="text-white font-bold text-sm uppercase tracking-wide mb-6 flex items-center gap-2">
             <PieChart className="w-4 h-4 text-indigo-400" /> Media Allocation
           </h3>
           
           {/* Donut Chart Implementation using SVG */}
           <div className="flex-1 flex flex-col items-center justify-center min-h-[180px] relative">
              <svg viewBox="0 0 100 100" className="w-40 h-40 transform -rotate-90">
                 {pieData.map((d, i) => {
                    const x1 = 50 + 40 * Math.cos(Math.PI * d.startAngle / 180);
                    const y1 = 50 + 40 * Math.sin(Math.PI * d.startAngle / 180);
                    const x2 = 50 + 40 * Math.cos(Math.PI * d.endAngle / 180);
                    const y2 = 50 + 40 * Math.sin(Math.PI * d.endAngle / 180);
                    
                    const largeArcFlag = d.endAngle - d.startAngle > 180 ? 1 : 0;
                    const pathData = `M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
                    
                    return <path key={i} d={pathData} fill={pieColors[i % pieColors.length]} stroke="#0f172a" strokeWidth="1" />;
                 })}
                 <circle cx="50" cy="50" r="25" fill="#0f172a" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                 <span className="text-xs font-bold text-slate-400">Mix</span>
              </div>
           </div>
           
           <div className="mt-4 space-y-2 overflow-y-auto max-h-32 custom-scrollbar pr-1">
              {pieData.map((d, i) => (
                 <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                       <div className="w-2 h-2 rounded-full" style={{ backgroundColor: pieColors[i % pieColors.length] }}></div>
                       <span className="text-slate-300 truncate max-w-[120px]">{d.name}</span>
                    </div>
                    <span className="font-bold text-white">{Math.round(d.percentage * 100)}%</span>
                 </div>
              ))}
           </div>

           {/* Automated Insights */}
           <div className="mt-6 pt-4 border-t border-slate-800">
              <h4 className="text-[10px] font-bold text-slate-500 uppercase mb-3 flex items-center gap-1">
                 <AlertCircle className="w-3 h-3" /> AI Insights
              </h4>
              <div className="space-y-2">
                 {insights.map((insight, idx) => (
                    <div key={idx} className={`text-xs p-2 rounded border ${insight.type === 'positive' ? 'bg-green-950/30 border-green-900 text-green-300' : 'bg-red-950/30 border-red-900 text-red-300'}`}>
                       {insight.text}
                    </div>
                 ))}
                 {insights.length === 0 && <div className="text-xs text-slate-500 italic">No insights available yet.</div>}
              </div>
           </div>
        </div>

      </div>
    </div>
  );
};
