
import React from 'react';
import { WeeklyData, WeeklyActuals, ViewMode, PlanningData } from '../types';

interface Props {
  weeks: WeeklyData[];
  actuals: Record<number, WeeklyActuals>;
  plan: PlanningData;
  onUpdateActual: (weekId: number, field: keyof WeeklyActuals, value: number) => void;
  viewMode: ViewMode;
}

export const PerformanceTracker: React.FC<Props> = ({ weeks, actuals, plan, onUpdateActual, viewMode }) => {
  
  const formatCurrency = (val: number | undefined) => {
    if (val === undefined) return '-';
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
  };

  const formatNumber = (val: number | undefined) => {
    if (val === undefined) return '-';
    return val.toLocaleString(undefined, { maximumFractionDigits: 0 });
  };

  const formatPercent = (val: number | undefined) => {
    if (val === undefined || isNaN(val) || !isFinite(val)) return '-';
    return `${val.toFixed(2)}%`;
  };

  // Tax multiplier for spends display
  const taxMult = viewMode === ViewMode.AGENCY ? (1 + plan.taxPercent/100) : 1;

  // Helper: Calculate cumulative actuals on the fly
  const getCumulativeActuals = (uptoIndex: number, field: keyof WeeklyActuals) => {
    let sum = 0;
    for (let i = 0; i <= uptoIndex; i++) {
      let val = actuals[weeks[i].id]?.[field] || 0;
      if (field === 'spends') val = val * taxMult; 
      sum += val;
    }
    return sum;
  };

  // Totals for the "Total" column
  const getTotalActual = (field: keyof WeeklyActuals) => {
    const rawTotal = weeks.reduce((acc, w) => acc + (actuals[w.id]?.[field] || 0), 0);
    if (field === 'spends') return rawTotal * taxMult;
    return rawTotal;
  };

  const InputCell = ({ weekId, field, value }: { weekId: number, field: keyof WeeklyActuals, value: number | undefined }) => (
    <input
      type="number"
      value={value || ''}
      placeholder="-"
      onChange={(e) => onUpdateActual(weekId, field, parseFloat(e.target.value) || 0)}
      className="w-full text-right bg-blue-900/30 hover:bg-blue-900/50 border border-transparent rounded px-1 py-1 text-xs font-medium text-blue-200 focus:ring-1 focus:ring-blue-500 outline-none placeholder-blue-800"
    />
  );

  const RowHeader = ({ label, sub }: { label: string, sub?: string }) => (
    <div className="flex flex-col justify-center h-full">
      <span className="font-bold text-slate-300">{label}</span>
      {sub && <span className="text-[10px] font-normal text-slate-500">{sub}</span>}
    </div>
  );

  return (
    <div className="bg-slate-900 rounded-xl shadow-lg border border-slate-800 overflow-hidden flex flex-col mt-4">
      <div className="bg-slate-950 p-4 border-b border-slate-800 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-white">Performance Tracker</h2>
          <p className="text-sm text-slate-400">Enter actuals in blue cells. Ratios calculate automatically.</p>
        </div>
        <div className="flex gap-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-900/30 border border-blue-700 rounded"></div>
            <span className="text-slate-400">Actuals (Input)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-slate-800 border border-slate-700 rounded"></div>
            <span className="text-slate-400">Plan (Target)</span>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto pb-4 custom-scrollbar">
        <table className="min-w-full text-xs text-right border-collapse">
          <thead>
            <tr className="bg-slate-950 text-slate-400 font-semibold uppercase tracking-wider">
              <th className="sticky left-0 bg-slate-950 px-4 py-3 text-left w-40 z-20 border-b border-slate-800 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.5)]">Metric</th>
              {weeks.map((week) => (
                <th key={week.id} className="px-2 py-3 border-b border-slate-800 min-w-[100px] whitespace-nowrap">
                  <div className="text-slate-200">{week.weekLabel}</div>
                  <div className="text-[10px] text-slate-500 font-normal">{week.dateRange}</div>
                </th>
              ))}
              <th className="sticky right-0 bg-slate-950 px-4 py-3 border-b border-slate-800 z-20 w-28 text-white shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.5)]">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">

            {/* --- LEADS GROUP --- */}
            <tr className="bg-slate-900">
              <td rowSpan={4} className="sticky left-0 bg-slate-900 px-4 py-2 text-left z-10 border-r border-slate-800 border-b align-top pt-4">
                <RowHeader label="Leads" />
              </td>
            </tr>
            <tr>{/* Spacer */}</tr>
            <tr className="hover:bg-slate-800/40">
               <td className="sticky left-0 bg-slate-900 px-4 py-1 text-left text-[10px] text-slate-500 z-10 border-r border-slate-800 pl-8">Target</td>
               {weeks.map(w => <td key={w.id} className="px-2 py-1 text-slate-500">{Math.round(w.leads)}</td>)}
               <td className="sticky right-0 bg-slate-900 px-4 py-1 text-slate-500 border-l border-slate-800 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.5)]">{Math.round(weeks.reduce((a,b) => a+b.leads, 0))}</td>
            </tr>
             <tr className="hover:bg-blue-900/10">
               <td className="sticky left-0 bg-slate-900 px-4 py-1 text-left text-[10px] font-bold text-blue-400 z-10 border-r border-slate-800 pl-8">Actual</td>
               {weeks.map(w => <td key={w.id} className="px-1 py-1"><InputCell weekId={w.id} field="leads" value={actuals[w.id]?.leads} /></td>)}
               <td className="sticky right-0 bg-slate-900 px-4 py-1 font-bold text-white border-l border-slate-800 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.5)]">{formatNumber(getTotalActual('leads'))}</td>
            </tr>
             <tr className="bg-slate-900 border-b border-slate-800">
               <td className="sticky left-0 bg-slate-900 px-4 py-1 text-left text-[10px] text-slate-600 z-10 border-r border-slate-800 pl-8">Cumul. Act</td>
               {weeks.map((w, i) => <td key={w.id} className="px-2 py-1 text-slate-600 italic">{formatNumber(getCumulativeActuals(i, 'leads'))}</td>)}
               <td className="sticky right-0 bg-slate-900 px-4 py-1 border-l border-slate-800 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.5)]">-</td>
            </tr>

            {/* --- AP GROUP --- */}
             <tr className="bg-slate-900">
              <td rowSpan={4} className="sticky left-0 bg-slate-900 px-4 py-2 text-left z-10 border-r border-slate-800 border-b align-top pt-4">
                <RowHeader label="AP" sub="(Site Visits Proposed)" />
              </td>
            </tr>
            <tr></tr>
            <tr className="hover:bg-slate-800/40">
               <td className="sticky left-0 bg-slate-900 px-4 py-1 text-left text-[10px] text-slate-500 z-10 border-r border-slate-800 pl-8">Target</td>
               {weeks.map(w => <td key={w.id} className="px-2 py-1 text-slate-500">{Math.round(w.ap)}</td>)}
               <td className="sticky right-0 bg-slate-900 px-4 py-1 text-slate-500 border-l border-slate-800 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.5)]">{Math.round(weeks.reduce((a,b) => a+b.ap, 0))}</td>
            </tr>
             <tr className="hover:bg-blue-900/10">
               <td className="sticky left-0 bg-slate-900 px-4 py-1 text-left text-[10px] font-bold text-blue-400 z-10 border-r border-slate-800 pl-8">Actual</td>
               {weeks.map(w => <td key={w.id} className="px-1 py-1"><InputCell weekId={w.id} field="ap" value={actuals[w.id]?.ap} /></td>)}
               <td className="sticky right-0 bg-slate-900 px-4 py-1 font-bold text-white border-l border-slate-800 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.5)]">{formatNumber(getTotalActual('ap'))}</td>
            </tr>
             <tr className="bg-slate-900 border-b border-slate-800">
               <td className="sticky left-0 bg-slate-900 px-4 py-1 text-left text-[10px] text-slate-600 z-10 border-r border-slate-800 pl-8">Cumul. Act</td>
               {weeks.map((w, i) => <td key={w.id} className="px-2 py-1 text-slate-600 italic">{formatNumber(getCumulativeActuals(i, 'ap'))}</td>)}
               <td className="sticky right-0 bg-slate-900 px-4 py-1 border-l border-slate-800 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.5)]">-</td>
            </tr>

            {/* --- AD GROUP --- */}
            <tr className="bg-slate-900">
              <td rowSpan={4} className="sticky left-0 bg-slate-900 px-4 py-2 text-left z-10 border-r border-slate-800 border-b align-top pt-4">
                <RowHeader label="AD / Walkins" sub="(Site Visits Done)" />
              </td>
            </tr>
            <tr></tr>
            <tr className="hover:bg-slate-800/40">
               <td className="sticky left-0 bg-slate-900 px-4 py-1 text-left text-[10px] text-slate-500 z-10 border-r border-slate-800 pl-8">Target</td>
               {weeks.map(w => <td key={w.id} className="px-2 py-1 text-slate-500">{Math.round(w.ad)}</td>)}
               <td className="sticky right-0 bg-slate-900 px-4 py-1 text-slate-500 border-l border-slate-800 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.5)]">{Math.round(weeks.reduce((a,b) => a+b.ad, 0))}</td>
            </tr>
             <tr className="hover:bg-blue-900/10">
               <td className="sticky left-0 bg-slate-900 px-4 py-1 text-left text-[10px] font-bold text-blue-400 z-10 border-r border-slate-800 pl-8">Actual</td>
               {weeks.map(w => <td key={w.id} className="px-1 py-1"><InputCell weekId={w.id} field="ad" value={actuals[w.id]?.ad} /></td>)}
               <td className="sticky right-0 bg-slate-900 px-4 py-1 font-bold text-white border-l border-slate-800 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.5)]">{formatNumber(getTotalActual('ad'))}</td>
            </tr>
             <tr className="bg-slate-900 border-b border-slate-800">
               <td className="sticky left-0 bg-slate-900 px-4 py-1 text-left text-[10px] text-slate-600 z-10 border-r border-slate-800 pl-8">Cumul. Act</td>
               {weeks.map((w, i) => <td key={w.id} className="px-2 py-1 text-slate-600 italic">{formatNumber(getCumulativeActuals(i, 'ad'))}</td>)}
               <td className="sticky right-0 bg-slate-900 px-4 py-1 border-l border-slate-800 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.5)]">-</td>
            </tr>

             {/* --- BOOKINGS GROUP --- */}
             <tr className="bg-slate-900">
              <td rowSpan={5} className="sticky left-0 bg-slate-900 px-4 py-2 text-left z-10 border-r border-slate-800 border-b align-top pt-4">
                <RowHeader label="Bookings" sub="Digital & Presales" />
              </td>
            </tr>
            <tr></tr>
            <tr className="hover:bg-slate-800/40">
               <td className="sticky left-0 bg-slate-900 px-4 py-1 text-left text-[10px] text-slate-500 z-10 border-r border-slate-800 pl-8">Tgt Digital</td>
               {weeks.map(w => <td key={w.id} className="px-2 py-1 text-slate-500">{Math.round(w.ad * (plan.wtbPercent / 100))}</td>)}
               <td className="sticky right-0 bg-slate-900 px-4 py-1 text-slate-500 border-l border-slate-800 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.5)]">{Math.round(weeks.reduce((a,b) => a + (b.ad * (plan.wtbPercent/100)), 0))}</td>
            </tr>
             <tr className="hover:bg-blue-900/10">
               <td className="sticky left-0 bg-slate-900 px-4 py-1 text-left text-[10px] font-bold text-blue-400 z-10 border-r border-slate-800 pl-8">Act Digital</td>
               {weeks.map(w => <td key={w.id} className="px-1 py-1"><InputCell weekId={w.id} field="bookings" value={actuals[w.id]?.bookings} /></td>)}
               <td className="sticky right-0 bg-slate-900 px-4 py-1 font-bold text-white border-l border-slate-800 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.5)]">{formatNumber(getTotalActual('bookings'))}</td>
            </tr>
            <tr className="hover:bg-blue-900/10 border-b border-slate-800">
               <td className="sticky left-0 bg-slate-900 px-4 py-1 text-left text-[10px] font-bold text-emerald-400 z-10 border-r border-slate-800 pl-8">Act Presales</td>
               {weeks.map(w => <td key={w.id} className="px-1 py-1"><InputCell weekId={w.id} field="presalesBookings" value={actuals[w.id]?.presalesBookings} /></td>)}
               <td className="sticky right-0 bg-slate-900 px-4 py-1 font-bold text-white border-l border-slate-800 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.5)]">{formatNumber(getTotalActual('presalesBookings'))}</td>
            </tr>

             {/* --- SPENDS GROUP --- */}
             <tr className="bg-slate-900">
              <td rowSpan={4} className="sticky left-0 bg-slate-900 px-4 py-2 text-left z-10 border-r border-slate-800 border-b align-top pt-4">
                <RowHeader label={viewMode === ViewMode.AGENCY ? 'All-in Spends' : 'Region Spends'} />
              </td>
            </tr>
            <tr></tr>
            <tr className="hover:bg-slate-800/40">
               <td className="sticky left-0 bg-slate-900 px-4 py-1 text-left text-[10px] text-slate-500 z-10 border-r border-slate-800 pl-8">Target</td>
               {weeks.map(w => <td key={w.id} className="px-2 py-1 text-slate-500">{formatCurrency(viewMode === ViewMode.AGENCY ? w.spendsAllIn : w.spendsBase)}</td>)}
               <td className="sticky right-0 bg-slate-900 px-4 py-1 text-slate-500 border-l border-slate-800 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.5)]">{formatCurrency(weeks.reduce((a,b) => a+(viewMode === ViewMode.AGENCY ? b.spendsAllIn : b.spendsBase), 0))}</td>
            </tr>
             <tr className="hover:bg-blue-900/10">
               <td className="sticky left-0 bg-slate-900 px-4 py-1 text-left text-[10px] font-bold text-blue-400 z-10 border-r border-slate-800 pl-8">Actual</td>
               {weeks.map(w => <td key={w.id} className="px-1 py-1"><InputCell weekId={w.id} field="spends" value={actuals[w.id]?.spends} /></td>)}
               <td className="sticky right-0 bg-slate-900 px-4 py-1 font-bold text-white border-l border-slate-800 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.5)]">{formatCurrency(getTotalActual('spends'))}</td>
            </tr>
             <tr className="bg-slate-900 border-b border-slate-800">
               <td className="sticky left-0 bg-slate-900 px-4 py-1 text-left text-[10px] text-slate-600 z-10 border-r border-slate-800 pl-8">Cumul. Act</td>
               {weeks.map((w, i) => <td key={w.id} className="px-2 py-1 text-slate-600 italic">{formatCurrency(getCumulativeActuals(i, 'spends'))}</td>)}
               <td className="sticky right-0 bg-slate-900 px-4 py-1 border-l border-slate-800 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.5)]">-</td>
            </tr>

            {/* --- RATIOS HEADER --- */}
             <tr className="bg-amber-950/20">
              <td colSpan={weeks.length + 2} className="py-2 px-4 text-[10px] font-bold text-amber-500 uppercase tracking-widest text-left border-y border-amber-900/50">
                Efficiency Ratios (Calculated Actuals)
              </td>
            </tr>

            {/* CPL ROW */}
            <tr className="hover:bg-slate-800/30 transition-colors">
               <td className="sticky left-0 bg-slate-900 px-4 py-2 text-left font-bold text-slate-300 z-10 border-r border-slate-800">CPL</td>
               {weeks.map(w => {
                 const leads = actuals[w.id]?.leads || 0;
                 const spends = (actuals[w.id]?.spends || 0) * taxMult;
                 return <td key={w.id} className="px-2 py-2 font-medium text-slate-300">{leads > 0 ? formatCurrency(spends / leads) : '-'}</td>
               })}
               <td className="sticky right-0 bg-slate-900 px-4 py-2 border-l border-slate-800 font-bold text-white shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.5)]">
                 {formatCurrency(getTotalActual('spends') / (getTotalActual('leads') || 1))}
               </td>
            </tr>

            {/* CPW ROW */}
             <tr className="hover:bg-slate-800/30 transition-colors">
               <td className="sticky left-0 bg-slate-900 px-4 py-2 text-left font-bold text-slate-300 z-10 border-r border-slate-800">CPW (Walkin)</td>
               {weeks.map(w => {
                 const ad = actuals[w.id]?.ad || 0;
                 const spends = (actuals[w.id]?.spends || 0) * taxMult;
                 return <td key={w.id} className="px-2 py-2 font-medium text-slate-300">{ad > 0 ? formatCurrency(spends / ad) : '-'}</td>
               })}
               <td className="sticky right-0 bg-slate-900 px-4 py-2 border-l border-slate-800 font-bold text-white shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.5)]">
                 {formatCurrency(getTotalActual('spends') / (getTotalActual('ad') || 1))}
               </td>
            </tr>

             {/* CPB ROW */}
             <tr className="hover:bg-slate-800/30 transition-colors">
               <td className="sticky left-0 bg-slate-900 px-4 py-2 text-left font-bold text-slate-300 z-10 border-r border-slate-800">CPB (Booking)</td>
               {weeks.map(w => {
                 const bk = (actuals[w.id]?.bookings || 0) + (actuals[w.id]?.presalesBookings || 0); // Combined bookings
                 const spends = (actuals[w.id]?.spends || 0) * taxMult;
                 return <td key={w.id} className="px-2 py-2 font-medium text-slate-300">{bk > 0 ? formatCurrency(spends / bk) : '-'}</td>
               })}
               <td className="sticky right-0 bg-slate-900 px-4 py-2 border-l border-slate-800 font-bold text-white shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.5)]">
                 {formatCurrency(getTotalActual('spends') / ((getTotalActual('bookings') + getTotalActual('presalesBookings')) || 1))}
               </td>
            </tr>

            {/* L2W ROW */}
            <tr className="hover:bg-slate-800/30 transition-colors">
               <td className="sticky left-0 bg-slate-900 px-4 py-2 text-left font-bold text-slate-300 z-10 border-r border-slate-800">L2W %</td>
               {weeks.map(w => {
                 const leads = actuals[w.id]?.leads || 0;
                 const ad = actuals[w.id]?.ad || 0;
                 return <td key={w.id} className="px-2 py-2 font-medium text-slate-300">{leads > 0 ? formatPercent((ad / leads) * 100) : '-'}</td>
               })}
               <td className="sticky right-0 bg-slate-900 px-4 py-2 border-l border-slate-800 font-bold text-white shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.5)]">
                 {formatPercent((getTotalActual('ad') / (getTotalActual('leads') || 1)) * 100)}
               </td>
            </tr>

             {/* WTB ROW */}
             <tr className="hover:bg-slate-800/30 transition-colors border-b border-slate-800">
               <td className="sticky left-0 bg-slate-900 px-4 py-2 text-left font-bold text-slate-300 z-10 border-r border-slate-800">WTB %</td>
               {weeks.map(w => {
                 const ad = actuals[w.id]?.ad || 0;
                 const bk = actuals[w.id]?.bookings || 0;
                 return <td key={w.id} className="px-2 py-2 font-medium text-slate-300">{ad > 0 ? formatPercent((bk / ad) * 100) : '-'}</td>
               })}
               <td className="sticky right-0 bg-slate-900 px-4 py-2 border-l border-slate-800 font-bold text-white shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.5)]">
                 {formatPercent((getTotalActual('bookings') / (getTotalActual('ad') || 1)) * 100)}
               </td>
            </tr>

          </tbody>
        </table>
      </div>
    </div>
  );
};
