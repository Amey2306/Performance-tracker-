
import React, { useState } from 'react';
import { Project, ViewMode, Poc } from '../types';
import { ArrowRight, AlertTriangle, Trash2, Check, X, Download, LayoutGrid, List, ChevronDown, ChevronUp, ExternalLink, Target, IndianRupee, PieChart } from 'lucide-react';
import { exportMasterReport } from '../utils/exportUtils';

interface Props {
  projects: Project[];
  viewMode: ViewMode;
  onSelectProject: (id: string) => void;
  onUpdateProjectField: (id: string, field: 'receivedBudget' | 'otherSpends', value: number) => void;
  startWeekIndex: number;
  endWeekIndex: number;
  pocs: Poc[];
  onUpdateProjectPoc: (id: string, newPoc: string) => void;
  onDeleteProject: (id: string) => void;
}

const formatCurrency = (val: number) => 
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

const formatDecimal = (val: number) => val.toFixed(1);
const formatPercent = (val: number) => `${val.toFixed(0)}%`;

interface ProjectBoxProps {
  p: Project;
  viewMode: ViewMode;
  startWeekIndex: number;
  endWeekIndex: number;
  onSelectProject: (id: string) => void;
  onDeleteProject: (id: string) => void;
}

const ProjectBox: React.FC<ProjectBoxProps> = ({ p, viewMode, startWeekIndex, endWeekIndex, onSelectProject, onDeleteProject }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // --- Calculations ---
  const taxMult = viewMode === ViewMode.AGENCY ? (1 + p.plan.taxPercent/100) : 1;
  const planAllIn = p.weeks.reduce((sum, w) => sum + w.spendsAllIn, 0);
  const perfSpendsRaw = p.weeks.reduce((sum, w) => sum + (p.actuals[w.id]?.spends || 0), 0);
  const totalSpends = (perfSpendsRaw * taxMult) + p.otherSpends;
  const pending = p.plan.receivedBudget - totalSpends;
  const pendingPct = p.plan.receivedBudget > 0 ? (pending / p.plan.receivedBudget) * 100 : 0;

  // Period Calculations
  const weeksInPeriod = p.weeks.filter(w => w.id >= startWeekIndex && w.id <= endWeekIndex);
  
  // Funnel
  const tgtLeadsPeriod = weeksInPeriod.reduce((s, w) => s + w.leads, 0);
  const achLeads = weeksInPeriod.reduce((s, w) => s + (p.actuals[w.id]?.leads || 0), 0);
  const delLeads = tgtLeadsPeriod > 0 ? (achLeads / tgtLeadsPeriod) * 100 : 0;

  const tgtAPPeriod = weeksInPeriod.reduce((s, w) => s + w.ap, 0);
  const achAP = weeksInPeriod.reduce((s, w) => s + (p.actuals[w.id]?.ap || 0), 0);
  const delAP = tgtAPPeriod > 0 ? (achAP / tgtAPPeriod) * 100 : 0;

  const tgtADPeriod = weeksInPeriod.reduce((s, w) => s + w.ad, 0);
  const achAD = weeksInPeriod.reduce((s, w) => s + (p.actuals[w.id]?.ad || 0), 0);
  const delAD = tgtADPeriod > 0 ? (achAD / tgtADPeriod) * 100 : 0;

  // Financials
  const perfSpendsPeriod = weeksInPeriod.reduce((s, w) => {
      const raw = (p.actuals[w.id]?.spends || 0);
      return s + (raw * taxMult);
  }, 0);

  const tgtCPL = p.plan.cpl;
  const achCPL = achLeads > 0 ? perfSpendsPeriod / achLeads : 0;
  
  const tgtCPW = p.plan.baseBudget / (p.weeks.reduce((s,w) => s+w.ad,0) || 1); 
  const achCPW = achAD > 0 ? perfSpendsPeriod / achAD : 0;

  // Revenue
  const achDigBookings = weeksInPeriod.reduce((s, w) => s + (p.actuals[w.id]?.bookings || 0), 0);
  const achPresalesBookings = weeksInPeriod.reduce((s, w) => s + (p.actuals[w.id]?.presalesBookings || 0), 0);
  const totalUnitsAch = achDigBookings + achPresalesBookings;
  const achCPB = totalUnitsAch > 0 ? perfSpendsPeriod / totalUnitsAch : 0;
  
  const digitalBVAch = achDigBookings * p.plan.ats;
  const presalesBVAch = achPresalesBookings * p.plan.ats;

  const getDeliveryColor = (pct: number) => {
    if (pct >= 90) return 'text-emerald-400';
    if (pct >= 70) return 'text-amber-400';
    return 'text-red-400';
  };

  return (
    <div className={`bg-slate-900 rounded-2xl border border-slate-800 shadow-xl relative group transition-all flex flex-col justify-between ${isExpanded ? 'row-span-2' : ''}`}>
       
       <div className="p-6">
         {/* Top Section: Name & Delete */}
         <div className="flex justify-between items-start mb-2">
            <h3 
              onClick={() => onSelectProject(p.id)}
              className="text-2xl font-bold text-white tracking-tight leading-tight cursor-pointer hover:text-brand-400 transition-colors flex items-center gap-2 group/title"
            >
              {p.name} <ArrowRight className="w-5 h-5 opacity-0 -ml-2 group-hover/title:opacity-100 group-hover/title:ml-0 transition-all" />
            </h3>
            <button 
              onClick={(e) => { e.stopPropagation(); if(window.confirm(`Delete ${p.name}?`)) onDeleteProject(p.id); }}
              className="text-slate-600 hover:text-red-400 p-1 rounded hover:bg-slate-800 transition-colors"
              title="Delete Project"
            >
              <Trash2 className="w-4 h-4" />
            </button>
         </div>

         {/* Status Badge */}
         <div className="mb-6">
            <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider inline-block ${p.status === 'Active' ? 'bg-green-950 text-green-400 border border-green-900' : 'bg-red-950 text-red-400 border border-red-900'}`}>
              {p.status}
            </span>
         </div>

         {/* Summary Metrics 2x2 Grid */}
         <div className="grid grid-cols-2 gap-y-6 gap-x-4">
            <div>
               <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Planned Budget</div>
               <div className="text-xl font-medium text-slate-200">{formatCurrency(planAllIn)}</div>
            </div>
            <div>
               <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">WO Received</div>
               <div className="text-xl font-medium text-slate-200">{formatCurrency(p.plan.receivedBudget)}</div>
            </div>
            <div>
               <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Pending</div>
               <div className={`text-xl font-medium ${pending < 0 ? 'text-red-400' : 'text-amber-400'}`}>{formatCurrency(pending)}</div>
               <div className="text-[10px] font-bold text-slate-600 mt-1">({pendingPct.toFixed(1)}%)</div>
            </div>
            <div>
               <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Est. Raised</div>
               <div className="text-xl font-medium text-slate-200">{formatCurrency(totalSpends)}</div>
            </div>
         </div>

         {/* --- EXPANDED DETAILS SECTION --- */}
         {isExpanded && (
           <div className="mt-8 pt-8 border-t border-slate-800 animate-in fade-in slide-in-from-top-4 duration-300 space-y-8">
              
              {/* 1. Funnel Performance */}
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Target className="w-3.5 h-3.5 text-brand-400" /> Funnel Performance (Period)
                </h4>
                <div className="bg-slate-950/50 rounded-lg p-4 grid grid-cols-3 gap-4 border border-slate-800/50">
                  {/* Leads */}
                  <div className="space-y-1">
                    <div className="text-[10px] text-amber-500 font-bold uppercase">Leads</div>
                    <div className="text-lg font-bold text-white">{achLeads}</div>
                    <div className="text-[10px] text-slate-500">Tgt: {Math.round(tgtLeadsPeriod)}</div>
                    <div className={`text-xs font-bold ${getDeliveryColor(delLeads)}`}>{formatPercent(delLeads)}</div>
                  </div>
                  {/* AP */}
                  <div className="space-y-1 border-l border-slate-800 pl-4">
                    <div className="text-[10px] text-purple-400 font-bold uppercase">AP (Site Visits)</div>
                    <div className="text-lg font-bold text-white">{achAP}</div>
                    <div className="text-[10px] text-slate-500">Tgt: {Math.round(tgtAPPeriod)}</div>
                    <div className={`text-xs font-bold ${getDeliveryColor(delAP)}`}>{formatPercent(delAP)}</div>
                  </div>
                  {/* AD */}
                  <div className="space-y-1 border-l border-slate-800 pl-4">
                    <div className="text-[10px] text-pink-400 font-bold uppercase">AD (Walkins)</div>
                    <div className="text-lg font-bold text-white">{achAD}</div>
                    <div className="text-[10px] text-slate-500">Tgt: {Math.round(tgtADPeriod)}</div>
                    <div className={`text-xs font-bold ${getDeliveryColor(delAD)}`}>{formatPercent(delAD)}</div>
                  </div>
                </div>
              </div>

              {/* 2. Financial Efficiency */}
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                  <IndianRupee className="w-3.5 h-3.5 text-blue-400" /> Financial Efficiency
                </h4>
                <div className="grid grid-cols-3 gap-2">
                   {/* CPL */}
                   <div className="bg-slate-950/50 rounded-lg p-3 border border-slate-800/50">
                      <div className="flex justify-between items-center mb-2">
                         <span className="text-[10px] text-slate-500 font-bold uppercase">CPL</span>
                         <span className={`text-[10px] font-bold ${achCPL <= tgtCPL ? 'text-emerald-400' : 'text-red-400'}`}>
                           {achCPL > 0 && tgtCPL > 0 ? (achCPL <= tgtCPL ? '✔' : '▲') : ''}
                         </span>
                      </div>
                      <div className="text-sm font-bold text-white mb-1">{formatCurrency(achCPL)}</div>
                      <div className="text-[10px] text-slate-500">Tgt: {formatCurrency(tgtCPL)}</div>
                   </div>
                   
                   {/* CPW */}
                   <div className="bg-slate-950/50 rounded-lg p-3 border border-slate-800/50">
                      <div className="flex justify-between items-center mb-2">
                         <span className="text-[10px] text-slate-500 font-bold uppercase">CPW</span>
                         <span className={`text-[10px] font-bold ${achCPW <= tgtCPW ? 'text-emerald-400' : 'text-red-400'}`}>
                            {achCPW > 0 && tgtCPW > 0 ? (achCPW <= tgtCPW ? '✔' : '▲') : ''}
                         </span>
                      </div>
                      <div className="text-sm font-bold text-white mb-1">{formatCurrency(achCPW)}</div>
                      <div className="text-[10px] text-slate-500">Tgt: {formatCurrency(tgtCPW)}</div>
                   </div>

                   {/* CPB */}
                   <div className="bg-slate-950/50 rounded-lg p-3 border border-slate-800/50">
                      <div className="text-[10px] text-slate-500 font-bold uppercase mb-2">CPB</div>
                      <div className="text-sm font-bold text-white mb-1">{formatCurrency(achCPB)}</div>
                      <div className="text-[10px] text-slate-500">Cost/Booking</div>
                   </div>
                </div>
              </div>

              {/* 3. Revenue & Bookings */}
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                  <PieChart className="w-3.5 h-3.5 text-emerald-400" /> Revenue & Bookings
                </h4>
                <div className="bg-emerald-950/20 rounded-lg p-4 border border-emerald-900/30 flex justify-between items-center">
                   <div>
                      <div className="text-xs text-emerald-400 font-bold mb-1">Total Revenue</div>
                      <div className="text-xl font-black text-white">₹{formatDecimal(digitalBVAch + presalesBVAch)} Cr</div>
                      <div className="text-[10px] text-slate-400 mt-1">
                        Digital: {formatDecimal(digitalBVAch)} Cr | Presales: {formatDecimal(presalesBVAch)} Cr
                      </div>
                   </div>
                   <div className="text-right">
                      <div className="text-xs text-emerald-400 font-bold mb-1">Total Units</div>
                      <div className="text-2xl font-black text-white">{totalUnitsAch}</div>
                   </div>
                </div>
              </div>

              {/* Deep Dive Action */}
              <button 
                onClick={() => onSelectProject(p.id)}
                className="w-full py-3 bg-brand-600 hover:bg-brand-500 rounded-lg text-white text-sm font-bold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-brand-900/20"
              >
                Open Project Dashboard <ExternalLink className="w-4 h-4" />
              </button>

           </div>
         )}
       </div>

       {/* Footer Expansion Button */}
       <button 
         onClick={() => setIsExpanded(!isExpanded)}
         className={`w-full py-4 border-t border-slate-800 rounded-b-2xl flex items-center justify-center gap-2 text-xs font-bold transition-all group/btn ${isExpanded ? 'bg-slate-900 text-slate-400 hover:text-white' : 'bg-slate-950/50 text-blue-400 hover:text-blue-300 hover:bg-slate-900'}`}
       >
         {isExpanded ? (
            <>Hide Details <ChevronUp className="w-3.5 h-3.5" /></>
         ) : (
            <>View Details <ChevronDown className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-y-0.5" /></>
         )}
       </button>
    </div>
  );
};

export const DashboardOverview: React.FC<Props> = ({ 
  projects, viewMode, onSelectProject, onUpdateProjectField, startWeekIndex, endWeekIndex, pocs, onUpdateProjectPoc, onDeleteProject 
}) => {
  
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [viewType, setViewType] = useState<'table' | 'grid'>('grid');

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
  
  const formatPercent = (val: number) => `${val.toFixed(1)}%`;
  const formatDecimal = (val: number) => val.toFixed(1);

  const getDeliveryColor = (pct: number) => {
    if (pct >= 90) return 'text-green-400';
    if (pct >= 70) return 'text-amber-400';
    return 'text-red-400';
  };

  return (
    <div className="bg-slate-900 rounded-2xl shadow-xl border border-slate-800 overflow-hidden mb-8 animate-in fade-in duration-500">
      <div className="bg-slate-900 border-b border-slate-800 p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Master Performance Report</h2>
          <p className="text-sm text-slate-500 mt-1">Comprehensive tracking of Budget, Funnel Efficiency, and Revenue.</p>
        </div>
        
        <div className="flex items-center gap-3">
           <div className="flex bg-slate-800 p-1 rounded-lg border border-slate-700">
              <button 
                onClick={() => setViewType('grid')}
                className={`p-1.5 rounded transition-all ${viewType === 'grid' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                title="Summary Cards"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setViewType('table')}
                className={`p-1.5 rounded transition-all ${viewType === 'table' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                title="Detailed List"
              >
                <List className="w-4 h-4" />
              </button>
           </div>
           
           <div className="h-6 w-px bg-slate-800 mx-1"></div>

           <button 
            onClick={() => exportMasterReport(projects, viewMode)}
            className="flex items-center gap-2 bg-emerald-600/10 text-emerald-400 hover:bg-emerald-600/20 border border-emerald-900/50 px-3 py-2 rounded-lg text-xs font-bold transition-all"
           >
            <Download className="w-3.5 h-3.5" /> Export
           </button>
        </div>
      </div>
      
      {viewType === 'grid' ? (
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 bg-slate-950/30 min-h-[400px]">
           {projects.map(p => (
             <ProjectBox 
               key={p.id} 
               p={p} 
               viewMode={viewMode}
               startWeekIndex={startWeekIndex}
               endWeekIndex={endWeekIndex}
               onSelectProject={onSelectProject}
               onDeleteProject={onDeleteProject}
             />
           ))}
           {projects.length === 0 && (
             <div className="col-span-full flex flex-col items-center justify-center text-slate-500 py-12">
               <List className="w-12 h-12 mb-4 opacity-20" />
               <p>No projects found. Add a new project to get started.</p>
             </div>
           )}
        </div>
      ) : (
        <div className="overflow-x-auto custom-scrollbar pb-4 bg-obsidian-900">
          <table className="min-w-max text-xs text-left border-collapse">
            <thead>
              {/* --- TOP HEADER ROW (GROUPINGS) --- */}
              <tr className="bg-slate-950 border-b border-slate-800 uppercase tracking-wider font-bold text-slate-400">
                <th className="px-4 py-3 sticky left-0 bg-slate-950 z-20 border-r border-slate-800 min-w-[220px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.5)]">Project Details</th>
                
                <th colSpan={7} className="px-2 py-2 border-r border-slate-800 bg-blue-950/20 text-center text-blue-400">Budget & Spends</th>
                <th colSpan={4} className="px-2 py-2 border-r border-slate-800 bg-amber-950/20 text-center text-amber-500">Leads Funnel</th>
                <th colSpan={4} className="px-2 py-2 border-r border-slate-800 bg-purple-950/20 text-center text-purple-400">AP (Site Visits Proposed)</th>
                <th colSpan={4} className="px-2 py-2 border-r border-slate-800 bg-pink-950/20 text-center text-pink-400">AD (Walk-ins)</th>
                
                <th colSpan={5} className="px-2 py-2 border-r border-slate-800 bg-slate-800/50 text-center text-slate-300">Cost Efficiency</th>
                <th colSpan={2} className="px-2 py-2 border-r border-slate-800 bg-slate-800/50 text-center text-slate-300">Conversion Ratios</th>
                
                <th colSpan={5} className="px-2 py-2 bg-emerald-950/20 text-center text-emerald-400 border-r border-slate-800">Bookings & Revenue</th>
                <th className="px-4 py-3 bg-slate-950 text-center">Actions</th>
              </tr>

              {/* --- SECOND HEADER ROW (COLUMNS) --- */}
              <tr className="bg-slate-900 border-b border-slate-700 text-[10px] font-semibold text-slate-400">
                <th className="px-4 py-3 sticky left-0 bg-slate-900 z-20 border-r border-slate-800 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.5)]">Name & SPOC (Edit)</th>
                
                {/* Budget */}
                <th className="px-3 py-2 text-right">All-in Planned</th>
                <th className="px-3 py-2 text-right min-w-[100px] bg-slate-800/30 text-amber-200">Received (Edit)</th>
                <th className="px-3 py-2 text-right">Perf. Spends</th>
                <th className="px-3 py-2 text-right min-w-[100px] bg-slate-800/30 text-blue-200">Other Spends (Edit)</th>
                <th className="px-3 py-2 text-right text-slate-500">Buffer</th>
                <th className="px-3 py-2 text-right font-bold text-white">Total Spends</th>
                <th className="px-3 py-2 text-right border-r border-slate-800">Pending</th>

                {/* Leads */}
                <th className="px-3 py-2 text-right">Overall Tgt</th>
                <th className="px-3 py-2 text-right text-amber-200">Target (Period)</th>
                <th className="px-3 py-2 text-right font-bold text-white">Achieved</th>
                <th className="px-3 py-2 text-right border-r border-slate-800">% Del</th>

                {/* AP */}
                <th className="px-3 py-2 text-right">Overall Tgt</th>
                <th className="px-3 py-2 text-right text-purple-200">Target (Period)</th>
                <th className="px-3 py-2 text-right font-bold text-white">Achieved</th>
                <th className="px-3 py-2 text-right border-r border-slate-800">% Del</th>

                {/* AD */}
                <th className="px-3 py-2 text-right">Overall Tgt</th>
                <th className="px-3 py-2 text-right text-pink-200">Target (Period)</th>
                <th className="px-3 py-2 text-right font-bold text-white">Achieved</th>
                <th className="px-3 py-2 text-right border-r border-slate-800">% Del</th>

                {/* Costs */}
                <th className="px-2 py-2 text-right">Tgt CPL</th>
                <th className="px-2 py-2 text-right font-bold text-white">Ach CPL</th>
                <th className="px-2 py-2 text-right">Tgt CPW</th>
                <th className="px-2 py-2 text-right font-bold text-white">Ach CPW</th>
                <th className="px-2 py-2 text-right border-r border-slate-800 text-xs">Ach CPB</th>

                {/* Ratios */}
                <th className="px-2 py-2 text-right">Tgt vs Ach L2W</th>
                <th className="px-2 py-2 text-right border-r border-slate-800">Tgt vs Ach WTB</th>

                {/* Revenue */}
                <th className="px-3 py-2 text-right">Overall BV</th>
                <th className="px-3 py-2 text-right">Digital BV Ach</th>
                <th className="px-3 py-2 text-right">Presales BV Ach</th>
                <th className="px-3 py-2 text-right">Total Units Ach</th>
                <th className="px-3 py-2 text-right border-r border-slate-800">% Contrib</th>

                <th className="px-4 py-3 text-center">Delete</th>
              </tr>
            </thead>
            
            <tbody className="divide-y divide-slate-800">
              {projects.map((p) => {
                // Calculations (Duplicated for table row context)
                const taxMult = viewMode === ViewMode.AGENCY ? (1 + p.plan.taxPercent/100) : 1;
                const planAllIn = p.weeks.reduce((sum, w) => sum + w.spendsAllIn, 0);
                const perfSpendsRaw = p.weeks.reduce((sum, w) => sum + (p.actuals[w.id]?.spends || 0), 0);
                const perfSpendsTaxed = perfSpendsRaw * taxMult;
                
                const totalSpends = perfSpendsTaxed + p.otherSpends;
                const pending = p.plan.receivedBudget - totalSpends;

                const weeksInPeriod = p.weeks.filter(w => w.id >= startWeekIndex && w.id <= endWeekIndex);
                
                const tgtLeadsTotal = p.weeks.reduce((s, w) => s + w.leads, 0);
                const tgtLeadsPeriod = weeksInPeriod.reduce((s, w) => s + w.leads, 0);
                const achLeads = weeksInPeriod.reduce((s, w) => s + (p.actuals[w.id]?.leads || 0), 0);
                const delLeads = tgtLeadsPeriod > 0 ? (achLeads / tgtLeadsPeriod) * 100 : 0;

                const tgtAPTotal = p.weeks.reduce((s, w) => s + w.ap, 0);
                const tgtAPPeriod = weeksInPeriod.reduce((s, w) => s + w.ap, 0);
                const achAP = weeksInPeriod.reduce((s, w) => s + (p.actuals[w.id]?.ap || 0), 0);
                const delAP = tgtAPPeriod > 0 ? (achAP / tgtAPPeriod) * 100 : 0;

                const tgtADTotal = p.weeks.reduce((s, w) => s + w.ad, 0);
                const tgtADPeriod = weeksInPeriod.reduce((s, w) => s + w.ad, 0);
                const achAD = weeksInPeriod.reduce((s, w) => s + (p.actuals[w.id]?.ad || 0), 0);
                const delAD = tgtADPeriod > 0 ? (achAD / tgtADPeriod) * 100 : 0;

                const perfSpendsPeriod = weeksInPeriod.reduce((s, w) => {
                    const raw = (p.actuals[w.id]?.spends || 0);
                    return s + (raw * taxMult);
                }, 0);

                const tgtCPL = p.plan.cpl;
                const achCPL = achLeads > 0 ? perfSpendsPeriod / achLeads : 0;
                
                const tgtCPW = p.plan.baseBudget / (p.weeks.reduce((s,w) => s+w.ad,0) || 1); 
                const achCPW = achAD > 0 ? perfSpendsPeriod / achAD : 0;

                const achDigBookings = weeksInPeriod.reduce((s, w) => s + (p.actuals[w.id]?.bookings || 0), 0);
                const achPresalesBookings = weeksInPeriod.reduce((s, w) => s + (p.actuals[w.id]?.presalesBookings || 0), 0);

                const totalUnitsAch = achDigBookings + achPresalesBookings;
                const achCPB = totalUnitsAch > 0 ? perfSpendsPeriod / totalUnitsAch : 0;

                const tgtL2W = p.plan.ltwPercent;
                const achL2W = achLeads > 0 ? (achAD / achLeads) * 100 : 0;
                const tgtWTB = p.plan.wtbPercent;
                const achWTB = achAD > 0 ? (achDigBookings / achAD) * 100 : 0;

                const digitalBVAch = achDigBookings * p.plan.ats;
                const presalesBVAch = achPresalesBookings * p.plan.ats;
                const totalUnitsTarget = p.plan.overallBV / p.plan.ats;
                
                return (
                  <tr key={p.id} className="hover:bg-slate-800/40 transition-colors group h-16">
                    {/* Project & SPOC */}
                    <td className="px-4 py-3 sticky left-0 bg-slate-900 group-hover:bg-slate-800 border-r border-slate-800 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.5)]">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between cursor-pointer group/name" onClick={() => onSelectProject(p.id)}>
                          <div className="font-bold text-white text-sm group-hover/name:text-brand-400 transition-colors">{p.name}</div>
                          <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover/name:text-white" />
                        </div>
                        <select 
                          value={p.poc}
                          onChange={(e) => onUpdateProjectPoc(p.id, e.target.value)}
                          className="text-[10px] bg-slate-800/50 border border-slate-700/50 rounded text-slate-400 outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer py-0.5 px-1 w-full"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {pocs.map(poc => (
                            <option key={poc.id} value={poc.name}>{poc.name}</option>
                          ))}
                        </select>
                      </div>
                    </td>

                    {/* Budget */}
                    <td className="px-3 py-3 text-right text-slate-400 text-[10px] font-medium">{formatCurrency(planAllIn)}</td>
                    <td className="px-1 py-1 bg-slate-800/20">
                      <input 
                        type="number" 
                        value={p.plan.receivedBudget}
                        onChange={(e) => onUpdateProjectField(p.id, 'receivedBudget', parseFloat(e.target.value))}
                        className="w-24 text-right bg-slate-900 border border-slate-700 rounded px-2 py-1 text-amber-400 font-bold outline-none focus:border-amber-500 text-xs"
                      />
                    </td>
                    <td className="px-3 py-3 text-right font-medium text-slate-300">{formatCurrency(perfSpendsTaxed)}</td>
                    <td className="px-1 py-1 bg-slate-800/20">
                      <input 
                        type="number" 
                        value={p.otherSpends}
                        onChange={(e) => onUpdateProjectField(p.id, 'otherSpends', parseFloat(e.target.value))}
                        className="w-20 text-right bg-slate-900 border border-slate-700 rounded px-2 py-1 text-blue-300 font-medium outline-none focus:border-blue-500 text-xs"
                      />
                    </td>
                    <td className="px-3 py-3 text-right text-slate-500 text-[10px]">{formatCurrency(p.plan.receivedBudget - (planAllIn + p.otherSpends))}</td>
                    <td className="px-3 py-3 text-right font-black text-white">{formatCurrency(totalSpends)}</td>
                    <td className={`px-3 py-3 text-right border-r border-slate-800 font-bold ${pending < 0 ? 'text-red-400' : 'text-green-400'}`}>{formatCurrency(pending)}</td>

                    {/* Leads */}
                    <td className="px-3 py-3 text-right text-slate-500 text-[10px]">{Math.round(tgtLeadsTotal).toLocaleString()}</td>
                    <td className="px-3 py-3 text-right text-amber-200/50 text-[10px]">{Math.round(tgtLeadsPeriod).toLocaleString()}</td>
                    <td className="px-3 py-3 text-right font-black text-lg text-white">{Math.round(achLeads).toLocaleString()}</td>
                    <td className={`px-3 py-3 text-right border-r border-slate-800 font-bold ${getDeliveryColor(delLeads)}`}>{formatPercent(delLeads)}</td>

                    {/* AP */}
                    <td className="px-3 py-3 text-right text-slate-500 text-[10px]">{Math.round(tgtAPTotal).toLocaleString()}</td>
                    <td className="px-3 py-3 text-right text-purple-200/50 text-[10px]">{Math.round(tgtAPPeriod).toLocaleString()}</td>
                    <td className="px-3 py-3 text-right font-bold text-white">{Math.round(achAP).toLocaleString()}</td>
                    <td className={`px-3 py-3 text-right border-r border-slate-800 font-bold ${getDeliveryColor(delAP)}`}>{formatPercent(delAP)}</td>

                    {/* AD */}
                    <td className="px-3 py-3 text-right text-slate-500 text-[10px]">{Math.round(tgtADTotal).toLocaleString()}</td>
                    <td className="px-3 py-3 text-right text-pink-200/50 text-[10px]">{Math.round(tgtADPeriod).toLocaleString()}</td>
                    <td className="px-3 py-3 text-right font-bold text-white">{Math.round(achAD).toLocaleString()}</td>
                    <td className={`px-3 py-3 text-right border-r border-slate-800 font-bold ${getDeliveryColor(delAD)}`}>{formatPercent(delAD)}</td>

                    {/* Costs */}
                    <td className="px-2 py-3 text-right text-slate-500 text-[10px]">{Math.round(tgtCPL)}</td>
                    <td className={`px-2 py-3 text-right font-bold ${achCPL > tgtCPL ? 'text-red-400' : 'text-green-400'}`}>{Math.round(achCPL)}</td>
                    <td className="px-2 py-3 text-right text-slate-500 text-[10px]">{Math.round(tgtCPW)}</td>
                    <td className="px-2 py-3 text-right font-bold text-white">{Math.round(achCPW)}</td>
                    <td className="px-2 py-3 text-right border-r border-slate-800 text-slate-300 font-medium text-[10px]">{Math.round(achCPB).toLocaleString()}</td>

                    {/* Ratios */}
                    <td className="px-2 py-3 text-right text-[10px]">
                      <div className="flex flex-col items-end">
                        <span className={`${achL2W < tgtL2W ? 'text-red-400' : 'text-green-400'} font-bold`}>{formatDecimal(achL2W)}%</span>
                        <span className="text-slate-600">/ {tgtL2W}%</span>
                      </div>
                    </td>
                    <td className="px-2 py-3 text-right border-r border-slate-800 text-[10px]">
                      <div className="flex flex-col items-end">
                        <span className={`${achWTB < tgtWTB ? 'text-red-400' : 'text-green-400'} font-bold`}>{formatDecimal(achWTB)}%</span>
                        <span className="text-slate-600">/ {tgtWTB}%</span>
                      </div>
                    </td>

                    {/* Revenue */}
                    <td className="px-3 py-3 text-right font-bold text-emerald-600">{p.plan.overallBV} Cr</td>
                    <td className="px-3 py-3 text-right text-slate-300">{formatDecimal(digitalBVAch)} Cr</td>
                    <td className="px-3 py-3 text-right text-slate-300">{formatDecimal(presalesBVAch)} Cr</td>
                    <td className="px-3 py-3 text-right font-bold text-white">
                      {totalUnitsAch} <span className="text-slate-600 font-normal">/ {Math.ceil(totalUnitsTarget)}</span>
                    </td>
                    <td className="px-3 py-3 text-right font-bold text-emerald-400 border-r border-slate-800">
                      {totalUnitsTarget > 0 ? formatPercent((totalUnitsAch/totalUnitsTarget)*100) : '0%'}
                    </td>
                    
                    {/* Delete Action */}
                    <td className="px-4 py-3 text-center sticky right-0 bg-slate-900 z-10">
                      {deleteConfirmId === p.id ? (
                          <div className="flex items-center gap-1 justify-center animate-in fade-in zoom-in duration-200">
                            <button 
                              onClick={(e) => { e.stopPropagation(); onDeleteProject(p.id); setDeleteConfirmId(null); }}
                              className="p-1 bg-red-600 text-white rounded hover:bg-red-500 text-[10px] px-2 font-bold shadow-lg shadow-red-900/50"
                            >
                              YES
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(null); }}
                              className="p-1 text-slate-400 hover:text-white"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                      ) : (
                        <button 
                          onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(p.id); }}
                          className="p-1.5 text-slate-600 hover:text-red-400 hover:bg-red-900/20 rounded transition-colors"
                          title="Delete Project"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      
      <div className="bg-slate-950 px-6 py-3 border-t border-slate-800 flex items-center gap-2 text-xs text-slate-500">
         <AlertTriangle className="w-3 h-3 text-amber-500" />
         <span>Values in <span className="text-amber-300 font-bold">Gold</span> and <span className="text-blue-300 font-bold">Blue</span> fields are editable directly in the report table.</span>
      </div>
    </div>
  );
};
