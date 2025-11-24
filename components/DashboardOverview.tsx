
import React, { useState } from 'react';
import { Project, ViewMode, Poc } from '../types';
import { ArrowRight, AlertTriangle, Trash2, Check, X } from 'lucide-react';

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

export const DashboardOverview: React.FC<Props> = ({ 
  projects, viewMode, onSelectProject, onUpdateProjectField, startWeekIndex, endWeekIndex, pocs, onUpdateProjectPoc, onDeleteProject 
}) => {
  
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

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
      <div className="bg-slate-900 border-b border-slate-800 p-6 flex justify-between items-end">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Master Performance Report</h2>
          <p className="text-sm text-slate-500 mt-1">Comprehensive tracking of Budget, Funnel Efficiency, and Revenue.</p>
        </div>
      </div>
      
      <div className="overflow-x-auto custom-scrollbar pb-4">
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
              <th className="px-3 py-2 text-right min-w-[100px] bg-slate-800/30">Received (Edit)</th>
              <th className="px-3 py-2 text-right">Perf. Spends</th>
              <th className="px-3 py-2 text-right min-w-[100px] bg-slate-800/30">Other Spends (Edit)</th>
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
              // Calculations
              const planAllIn = p.weeks.reduce((sum, w) => sum + w.spendsAllIn, 0);
              const perfSpendsRaw = p.weeks.reduce((sum, w) => sum + (p.actuals[w.id]?.spends || 0), 0);
              const perfSpendsTaxed = viewMode === ViewMode.AGENCY ? perfSpendsRaw * (1 + p.plan.taxPercent/100) : perfSpendsRaw; 
              
              const totalSpends = perfSpendsTaxed + p.otherSpends;
              const pending = p.plan.receivedBudget - totalSpends;

              const weeksInPeriod = p.weeks.filter(w => w.id >= startWeekIndex && w.id <= endWeekIndex);
              
              const tgtLeadsTotal = p.weeks.reduce((s, w) => s + w.leads, 0);
              const tgtLeadsPeriod = weeksInPeriod.reduce((s, w) => s + w.leads, 0);
              const achLeads = p.weeks.reduce((s, w) => {
                 if (w.id >= startWeekIndex && w.id <= endWeekIndex) return s + (p.actuals[w.id]?.leads || 0);
                 return s;
              }, 0);
              const delLeads = tgtLeadsPeriod > 0 ? (achLeads / tgtLeadsPeriod) * 100 : 0;

              const tgtAPTotal = p.weeks.reduce((s, w) => s + w.ap, 0);
              const tgtAPPeriod = weeksInPeriod.reduce((s, w) => s + w.ap, 0);
              const achAP = p.weeks.reduce((s, w) => {
                if (w.id >= startWeekIndex && w.id <= endWeekIndex) return s + (p.actuals[w.id]?.ap || 0);
                return s;
              }, 0);
              const delAP = tgtAPPeriod > 0 ? (achAP / tgtAPPeriod) * 100 : 0;

              const tgtADTotal = p.weeks.reduce((s, w) => s + w.ad, 0);
              const tgtADPeriod = weeksInPeriod.reduce((s, w) => s + w.ad, 0);
              const achAD = p.weeks.reduce((s, w) => {
                if (w.id >= startWeekIndex && w.id <= endWeekIndex) return s + (p.actuals[w.id]?.ad || 0);
                return s;
              }, 0);
              const delAD = tgtADPeriod > 0 ? (achAD / tgtADPeriod) * 100 : 0;

              const perfSpendsPeriod = p.weeks.reduce((s, w) => {
                 if (w.id >= startWeekIndex && w.id <= endWeekIndex) {
                   const raw = (p.actuals[w.id]?.spends || 0);
                   return s + (viewMode === ViewMode.AGENCY ? raw * (1 + p.plan.taxPercent/100) : raw);
                 }
                 return s;
              }, 0);

              const tgtCPL = p.plan.cpl;
              const achCPL = achLeads > 0 ? perfSpendsPeriod / achLeads : 0;
              
              const tgtCPW = p.plan.baseBudget / (p.weeks.reduce((s,w) => s+w.ad,0) || 1); 
              const achCPW = achAD > 0 ? perfSpendsPeriod / achAD : 0;

              const achDigBookings = p.weeks.reduce((s, w) => {
                 if (w.id >= startWeekIndex && w.id <= endWeekIndex) return s + (p.actuals[w.id]?.bookings || 0);
                 return s;
              }, 0);
              
              const achPresalesBookings = p.weeks.reduce((s, w) => {
                 if (w.id >= startWeekIndex && w.id <= endWeekIndex) return s + (p.actuals[w.id]?.presalesBookings || 0);
                 return s;
              }, 0);

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
                <tr key={p.id} className="hover:bg-slate-800/40 transition-colors group">
                  {/* Project & SPOC */}
                  <td className="px-4 py-3 sticky left-0 bg-slate-900 group-hover:bg-slate-800 border-r border-slate-800 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.5)]">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between cursor-pointer" onClick={() => onSelectProject(p.id)}>
                        <div className="font-bold text-white text-xs hover:text-brand-400 transition-colors">{p.name}</div>
                        <ArrowRight className="w-3 h-3 text-slate-600 group-hover:text-white" />
                      </div>
                      <select 
                        value={p.poc}
                        onChange={(e) => onUpdateProjectPoc(p.id, e.target.value)}
                        className="text-[10px] bg-slate-800 border border-slate-700 rounded text-slate-300 outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {pocs.map(poc => (
                          <option key={poc.id} value={poc.name}>{poc.name}</option>
                        ))}
                      </select>
                    </div>
                  </td>

                  {/* Budget */}
                  <td className="px-3 py-3 text-right text-slate-400">{formatCurrency(planAllIn)}</td>
                  <td className="px-1 py-1 bg-slate-800/30">
                    <input 
                      type="number" 
                      value={p.plan.receivedBudget}
                      onChange={(e) => onUpdateProjectField(p.id, 'receivedBudget', parseFloat(e.target.value))}
                      className="w-24 text-right bg-transparent text-amber-300 font-bold outline-none border-b border-dashed border-amber-900 focus:border-amber-500"
                    />
                  </td>
                  <td className="px-3 py-3 text-right font-medium text-slate-200">{formatCurrency(perfSpendsTaxed)}</td>
                  <td className="px-1 py-1 bg-slate-800/30">
                     <input 
                      type="number" 
                      value={p.otherSpends}
                      onChange={(e) => onUpdateProjectField(p.id, 'otherSpends', parseFloat(e.target.value))}
                      className="w-20 text-right bg-transparent text-slate-300 font-medium outline-none border-b border-dashed border-slate-600 focus:border-slate-400"
                    />
                  </td>
                  <td className="px-3 py-3 text-right text-slate-500">{formatCurrency(p.plan.receivedBudget - (planAllIn + p.otherSpends))}</td>
                  <td className="px-3 py-3 text-right font-bold text-white">{formatCurrency(totalSpends)}</td>
                  <td className={`px-3 py-3 text-right border-r border-slate-800 font-bold ${pending < 0 ? 'text-red-400' : 'text-green-400'}`}>{formatCurrency(pending)}</td>

                  {/* Leads */}
                  <td className="px-3 py-3 text-right text-slate-400">{Math.round(tgtLeadsTotal).toLocaleString()}</td>
                  <td className="px-3 py-3 text-right text-amber-200/70">{Math.round(tgtLeadsPeriod).toLocaleString()}</td>
                  <td className="px-3 py-3 text-right font-bold text-white">{Math.round(achLeads).toLocaleString()}</td>
                  <td className={`px-3 py-3 text-right border-r border-slate-800 font-bold ${getDeliveryColor(delLeads)}`}>{formatPercent(delLeads)}</td>

                  {/* AP */}
                  <td className="px-3 py-3 text-right text-slate-400">{Math.round(tgtAPTotal).toLocaleString()}</td>
                  <td className="px-3 py-3 text-right text-purple-200/70">{Math.round(tgtAPPeriod).toLocaleString()}</td>
                  <td className="px-3 py-3 text-right font-bold text-white">{Math.round(achAP).toLocaleString()}</td>
                  <td className={`px-3 py-3 text-right border-r border-slate-800 font-bold ${getDeliveryColor(delAP)}`}>{formatPercent(delAP)}</td>

                  {/* AD */}
                  <td className="px-3 py-3 text-right text-slate-400">{Math.round(tgtADTotal).toLocaleString()}</td>
                  <td className="px-3 py-3 text-right text-pink-200/70">{Math.round(tgtADPeriod).toLocaleString()}</td>
                  <td className="px-3 py-3 text-right font-bold text-white">{Math.round(achAD).toLocaleString()}</td>
                  <td className={`px-3 py-3 text-right border-r border-slate-800 font-bold ${getDeliveryColor(delAD)}`}>{formatPercent(delAD)}</td>

                  {/* Costs */}
                  <td className="px-2 py-3 text-right text-slate-400">{Math.round(tgtCPL)}</td>
                  <td className={`px-2 py-3 text-right font-bold ${achCPL > tgtCPL ? 'text-red-400' : 'text-green-400'}`}>{Math.round(achCPL)}</td>
                  <td className="px-2 py-3 text-right text-slate-400">{Math.round(tgtCPW)}</td>
                  <td className="px-2 py-3 text-right font-bold text-white">{Math.round(achCPW)}</td>
                  <td className="px-2 py-3 text-right border-r border-slate-800 text-white font-bold">{Math.round(achCPB).toLocaleString()}</td>

                  {/* Ratios */}
                  <td className="px-2 py-3 text-right text-xs">
                     <span className="text-slate-500">{tgtL2W}%</span> / <span className={`${achL2W < tgtL2W ? 'text-red-400' : 'text-green-400'}`}>{formatDecimal(achL2W)}%</span>
                  </td>
                  <td className="px-2 py-3 text-right border-r border-slate-800 text-xs">
                    <span className="text-slate-500">{tgtWTB}%</span> / <span className={`${achWTB < tgtWTB ? 'text-red-400' : 'text-green-400'}`}>{formatDecimal(achWTB)}%</span>
                  </td>

                  {/* Revenue */}
                  <td className="px-3 py-3 text-right font-bold text-emerald-500">{p.plan.overallBV} Cr</td>
                  <td className="px-3 py-3 text-right text-slate-300">{formatDecimal(digitalBVAch)} Cr</td>
                  <td className="px-3 py-3 text-right text-slate-300">{formatDecimal(presalesBVAch)} Cr</td>
                  <td className="px-3 py-3 text-right font-bold text-white">
                    {totalUnitsAch} / {Math.ceil(totalUnitsTarget)}
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
                             className="p-1 bg-red-600 text-white rounded hover:bg-red-500 text-[10px] px-2 font-bold"
                           >
                             CONFIRM
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
      
      <div className="bg-slate-950 px-6 py-3 border-t border-slate-800 flex items-center gap-2 text-xs text-slate-500">
         <AlertTriangle className="w-3 h-3 text-amber-500" />
         <span>Values in <span className="text-amber-300 font-bold">Gold</span> and <span className="text-slate-300 font-bold underline">Underlined</span> fields are editable directly in the report.</span>
      </div>
    </div>
  );
};
