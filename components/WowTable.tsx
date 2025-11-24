
import React from 'react';
import { WeeklyData, CalculatedMetrics, ViewMode } from '../types';

interface Props {
  weeks: WeeklyData[];
  metrics: CalculatedMetrics;
  onUpdateWeek: (id: number, field: keyof WeeklyData, value: number) => void;
  viewMode: ViewMode;
  readOnly?: boolean;
}

export const WowTable: React.FC<Props> = ({ weeks, metrics, onUpdateWeek, viewMode, readOnly = false }) => {

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

  const calculateTotal = (key: keyof WeeklyData) => {
    return weeks.reduce((acc, curr) => acc + (typeof curr[key] === 'number' ? curr[key] as number : 0), 0);
  };

  // Helper to render editable percentage cell (Dark Mode)
  const PercentInput = ({ value, onChange, isLast }: { value: number, onChange: (val: number) => void, isLast?: boolean }) => (
    <div className={`relative ${isLast ? 'opacity-50 pointer-events-none' : ''}`}>
      <input
        type="number"
        disabled={readOnly}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className={`w-full text-right border rounded px-1 py-1 text-xs font-bold ${readOnly ? 'bg-slate-900 border-transparent text-slate-500' : 'bg-amber-900/30 border-amber-800/50 text-amber-200 hover:bg-amber-900/50 focus:ring-1 focus:ring-amber-500 outline-none'}`}
      />
      {!readOnly && <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-amber-500 opacity-0 hover:opacity-100">%</span>}
    </div>
  );

  return (
    <div className="bg-slate-900 rounded-xl shadow-lg border border-slate-800 overflow-hidden flex flex-col animate-in fade-in duration-300">
       <div className="bg-slate-950 p-4 border-b border-slate-800 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-white">Week-on-Week Plan (Target)</h2>
          <p className="text-sm text-slate-400">
            {readOnly ? "Plan is locked. These are the frozen targets." : "Adjust seasonality curves below to distribute targets."}
          </p>
        </div>
        {!readOnly && (
          <div className="flex gap-4 text-xs">
             <div className="flex items-center gap-1">
               <div className="w-3 h-3 bg-amber-900/30 border border-amber-800 rounded"></div>
               <span className="text-slate-400">Editable Simulation Metric</span>
             </div>
             <div className="flex items-center gap-1">
               <div className="w-3 h-3 bg-slate-800 border border-slate-700 rounded"></div>
               <span className="text-slate-400">Calculated Output</span>
             </div>
          </div>
        )}
      </div>

      <div className="overflow-x-auto pb-4 custom-scrollbar">
        <table className="min-w-full text-xs text-right border-collapse">
          <thead>
            <tr className="bg-slate-950 text-slate-400 font-bold uppercase tracking-wider">
              <th className="sticky left-0 bg-slate-950 px-4 py-3 text-left w-32 z-20 border-b border-slate-800 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.5)]">Metric</th>
              {weeks.map((week) => (
                <th key={week.id} className="px-2 py-3 border-b border-slate-800 min-w-[100px] whitespace-nowrap">
                  <div className="text-slate-200 font-bold">{week.weekLabel}</div>
                  <div className="text-[10px] text-slate-500 font-normal">{week.dateRange}</div>
                </th>
              ))}
              <th className="sticky right-0 bg-slate-950 px-4 py-3 border-b border-slate-800 z-20 w-24 text-white shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.5)]">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            
            {/* LEADS SECTION */}
            <tr className="hover:bg-slate-800/30 transition-colors">
              <td className="sticky left-0 bg-slate-900 px-4 py-2 text-left font-bold text-slate-300 z-10 border-r border-slate-800">Leads (Nos)</td>
              {weeks.map(week => (
                <td key={week.id} className="px-2 py-2 text-slate-200">{Math.round(week.leads).toLocaleString()}</td>
              ))}
              <td className="sticky right-0 bg-slate-900 px-4 py-2 font-bold text-white border-l border-slate-800 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.5)]">
                {Math.round(calculateTotal('leads')).toLocaleString()}
              </td>
            </tr>

             <tr className="bg-slate-950/30 italic text-slate-500">
              <td className="sticky left-0 bg-slate-950/30 px-4 py-2 text-left z-10 border-r border-slate-800 font-medium">Cumulative Leads</td>
              {weeks.map(week => (
                <td key={week.id} className="px-2 py-2 text-slate-600">{Math.round(week.cumulativeLeads).toLocaleString()}</td>
              ))}
              <td className="sticky right-0 bg-slate-950/30 px-4 py-2 border-l border-slate-800 text-slate-700 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.5)]">-</td>
            </tr>

            {/* APPOINTMENT PROPOSED (AP) */}
            <tr className="hover:bg-slate-800/30 transition-colors">
              <td className="sticky left-0 bg-slate-900 px-4 py-2 text-left font-bold text-slate-300 z-10 border-r border-slate-800">AP (AD x 2)</td>
              {weeks.map(week => (
                <td key={week.id} className="px-2 py-2 text-slate-200">{Math.round(week.ap)}</td>
              ))}
              <td className="sticky right-0 bg-slate-900 px-4 py-2 font-bold text-white border-l border-slate-800 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.5)]">
                 {Math.round(calculateTotal('ap'))}
              </td>
            </tr>

            {/* APPOINTMENT DONE (AD / WALKINS) */}
            <tr className="hover:bg-slate-800/30 transition-colors">
              <td className="sticky left-0 bg-slate-900 px-4 py-2 text-left font-bold text-slate-300 z-10 border-r border-slate-800">AD (Walkins)</td>
              {weeks.map(week => (
                <td key={week.id} className="px-2 py-2 text-slate-200">{Math.round(week.ad)}</td>
              ))}
              <td className="sticky right-0 bg-slate-900 px-4 py-2 font-bold text-white border-l border-slate-800 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.5)]">
                {Math.round(calculateTotal('ad'))}
              </td>
            </tr>

             <tr className="bg-slate-950/30 italic text-slate-500">
              <td className="sticky left-0 bg-slate-950/30 px-4 py-2 text-left z-10 border-r border-slate-800 font-medium">Cumulative AD</td>
              {weeks.map(week => (
                <td key={week.id} className="px-2 py-2 text-slate-600">{Math.round(week.cumulativeAd)}</td>
              ))}
              <td className="sticky right-0 bg-slate-950/30 px-4 py-2 border-l border-slate-800 text-slate-700 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.5)]">-</td>
            </tr>

            {/* SPENDS SECTION (TOGGLE DEPENDENT) */}
            <tr className={`hover:bg-slate-800/30 transition-colors font-medium ${viewMode === ViewMode.AGENCY ? 'text-amber-400' : 'text-emerald-400'}`}>
              <td className="sticky left-0 bg-slate-900 px-4 py-2 text-left font-bold z-10 border-r border-slate-800">
                 {viewMode === ViewMode.AGENCY ? 'All-in Spends' : 'Region Spends'}
              </td>
              {weeks.map(week => {
                const val = viewMode === ViewMode.AGENCY ? week.spendsAllIn : week.spendsBase;
                return <td key={week.id} className="px-2 py-2">{formatCurrency(val)}</td>
              })}
              <td className="sticky right-0 bg-slate-900 px-4 py-2 font-bold border-l border-slate-800 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.5)]">
                {formatCurrency(calculateTotal(viewMode === ViewMode.AGENCY ? 'spendsAllIn' : 'spendsBase'))}
              </td>
            </tr>

            {/* SPACER FOR SIMULATION METRICS */}
            <tr className="bg-slate-950">
              <td colSpan={weeks.length + 2} className="py-2 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-left">
                Simulation Metrics (Edit to Re-distribute)
              </td>
            </tr>

            {/* INPUTS: SPEND % */}
            <tr className={readOnly ? "bg-slate-900" : "bg-amber-950/10"}>
              <td className={`sticky left-0 bg-slate-900 px-4 py-2 text-left font-bold text-slate-400 z-10 border-r border-slate-800 ${!readOnly ? 'border-l-4 border-l-amber-600' : ''}`}>
                Spend Dist. %
              </td>
              {weeks.map((week, idx) => (
                <td key={week.id} className="px-1 py-1">
                  <PercentInput 
                    value={week.spendDistribution} 
                    onChange={(val) => onUpdateWeek(week.id, 'spendDistribution', val)} 
                    isLast={idx === weeks.length - 1} 
                  />
                </td>
              ))}
              <td className="sticky right-0 bg-slate-900 px-4 py-2 font-bold border-l border-slate-800 text-slate-200 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.5)]">
                 {calculateTotal('spendDistribution')}%
              </td>
            </tr>

             {/* INPUTS: LEAD % */}
             <tr className={readOnly ? "bg-slate-900" : "bg-amber-950/10"}>
              <td className={`sticky left-0 bg-slate-900 px-4 py-2 text-left font-bold text-slate-400 z-10 border-r border-slate-800 ${!readOnly ? 'border-l-4 border-l-amber-600' : ''}`}>
                Lead Dist. %
              </td>
              {weeks.map((week, idx) => (
                <td key={week.id} className="px-1 py-1">
                   <PercentInput 
                    value={week.leadDistribution} 
                    onChange={(val) => onUpdateWeek(week.id, 'leadDistribution', val)} 
                    isLast={idx === weeks.length - 1}
                  />
                </td>
              ))}
              <td className="sticky right-0 bg-slate-900 px-4 py-2 font-bold border-l border-slate-800 text-slate-200 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.5)]">
                 {calculateTotal('leadDistribution')}%
              </td>
            </tr>

            {/* INPUTS: AD Conversion % */}
            <tr className={readOnly ? "bg-slate-900" : "bg-amber-950/10"}>
              <td className={`sticky left-0 bg-slate-900 px-4 py-2 text-left font-bold text-slate-400 z-10 border-r border-slate-800 ${!readOnly ? 'border-l-4 border-l-amber-600' : ''}`}>
                L2AP % (AD Conv)
              </td>
              {weeks.map(week => (
                <td key={week.id} className="px-1 py-1">
                  <PercentInput 
                    value={week.adConversion} 
                    onChange={(val) => onUpdateWeek(week.id, 'adConversion', val)} 
                  />
                </td>
              ))}
              <td className="sticky right-0 bg-slate-900 px-4 py-2 font-bold border-l border-slate-800 text-slate-200 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.5)]">
                 Avg { (calculateTotal('adConversion') / weeks.length).toFixed(1)}%
              </td>
            </tr>

          </tbody>
        </table>
      </div>
    </div>
  );
};
