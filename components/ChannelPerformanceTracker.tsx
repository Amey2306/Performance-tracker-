
import React from 'react';
import { MediaChannel, ChannelPerformance, ViewMode } from '../types';
import { Calculator, Info, TrendingUp } from 'lucide-react';

interface Props {
  channels: MediaChannel[];
  performance: ChannelPerformance[];
  viewMode: ViewMode;
  taxPercent: number;
  onUpdate: (channelId: string, field: keyof ChannelPerformance, value: number) => void;
}

export const ChannelPerformanceTracker: React.FC<Props> = ({ channels, performance, viewMode, taxPercent, onUpdate }) => {
  
  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

  const formatPercent = (num: number, denom: number) => {
    if (!denom) return '0.0%';
    return `${((num / denom) * 100).toFixed(1)}%`;
  };

  // Helper to get performance object or default
  const getPerf = (channelId: string): ChannelPerformance => {
    return performance.find(p => p.channelId === channelId) || {
      channelId, spends: 0, leads: 0, openAttempted: 0, contacted: 0, assignedToSales: 0, ap: 0, ad: 0, bookings: 0, lost: 0
    };
  };

  // Totals Calculation
  const totals = channels.reduce((acc, ch) => {
    const p = getPerf(ch.id);
    acc.spends += p.spends;
    acc.leads += p.leads;
    acc.openAttempted += p.openAttempted;
    acc.contacted += p.contacted;
    acc.assignedToSales += p.assignedToSales;
    acc.ap += p.ap;
    acc.ad += p.ad;
    acc.bookings += p.bookings;
    acc.lost += p.lost;
    return acc;
  }, {
    spends: 0, leads: 0, openAttempted: 0, contacted: 0, assignedToSales: 0, ap: 0, ad: 0, bookings: 0, lost: 0
  });

  const taxMult = viewMode === ViewMode.AGENCY ? (1 + taxPercent/100) : 1;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-lg">
          <div className="text-xs text-slate-500 uppercase font-bold mb-1">Total Channel Spend</div>
          <div className="text-2xl font-bold text-white">{formatCurrency(totals.spends * taxMult)}</div>
        </div>
        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-lg">
          <div className="text-xs text-slate-500 uppercase font-bold mb-1">Total Leads</div>
          <div className="text-2xl font-bold text-brand-400">{totals.leads.toLocaleString()}</div>
        </div>
        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-lg">
          <div className="text-xs text-slate-500 uppercase font-bold mb-1">Overall CPL</div>
          <div className="text-2xl font-bold text-white">{totals.leads > 0 ? formatCurrency((totals.spends * taxMult) / totals.leads) : '-'}</div>
        </div>
        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-lg">
          <div className="text-xs text-slate-500 uppercase font-bold mb-1">Total Bookings</div>
          <div className="text-2xl font-bold text-emerald-400">{totals.bookings}</div>
        </div>
      </div>

      {/* Detailed Table */}
      <div className="bg-slate-900 rounded-2xl shadow-xl border border-slate-800 overflow-hidden">
        <div className="bg-slate-950 border-b border-slate-800 p-4 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-400" /> Channel Funnel Tracker
            </h3>
            <p className="text-sm text-slate-500">Track granular performance from Leads to Lost per channel.</p>
          </div>
          <div className="text-xs text-slate-400 bg-slate-900 px-3 py-1.5 rounded border border-slate-800 flex items-center gap-2 hidden sm:flex">
            <Info className="w-3 h-3" /> Spends are {viewMode === ViewMode.AGENCY ? 'All-in (Taxed)' : 'Base (Excl. Tax)'}
          </div>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="min-w-max text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-950 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800">
                <th className="px-4 py-3 sticky left-0 bg-slate-950 z-20 border-r border-slate-800 min-w-[180px]">Channel</th>
                <th className="px-3 py-3 text-right min-w-[100px] bg-blue-950/20 text-blue-300">Spends (Base)</th>
                <th className="px-3 py-3 text-right min-w-[80px] bg-indigo-950/20 text-indigo-300">Leads</th>
                <th className="px-3 py-3 text-right min-w-[80px] bg-slate-900/50">CPL</th>
                
                <th className="px-3 py-3 text-right min-w-[80px]">Open/Att.</th>
                <th className="px-2 py-3 text-right text-slate-600 border-r border-slate-800">%</th>
                
                <th className="px-3 py-3 text-right min-w-[80px]">Contacted</th>
                <th className="px-2 py-3 text-right text-slate-600 border-r border-slate-800">%</th>
                
                <th className="px-3 py-3 text-right min-w-[80px]">Assigned (CAPI)</th>
                <th className="px-2 py-3 text-right text-slate-600 border-r border-slate-800">%</th>
                <th className="px-3 py-3 text-right min-w-[90px] bg-cyan-950/10 text-cyan-300 border-r border-slate-800">CP-CAPI</th>
                
                <th className="px-3 py-3 text-right min-w-[80px]">AP</th>
                <th className="px-2 py-3 text-right text-slate-600 border-r border-slate-800">%</th>
                <th className="px-3 py-3 text-right min-w-[90px] bg-purple-950/10 text-purple-300 border-r border-slate-800">CP-AP</th>
                
                <th className="px-3 py-3 text-right min-w-[80px]">AD (SVD)</th>
                <th className="px-2 py-3 text-right text-slate-600 border-r border-slate-800">%</th>
                <th className="px-3 py-3 text-right min-w-[90px] bg-pink-950/10 text-pink-300 border-r border-slate-800">CP-AD</th>
                
                <th className="px-3 py-3 text-right min-w-[80px] text-emerald-400 bg-emerald-950/10">Bookings</th>
                
                <th className="px-3 py-3 text-right min-w-[80px] text-red-400 bg-red-950/10">Lost</th>
                <th className="px-2 py-3 text-right text-red-400/60 bg-red-950/10">%</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {channels.map(ch => {
                const p = getPerf(ch.id);
                const spendsDisplay = p.spends * taxMult;
                const cpl = p.leads > 0 ? spendsDisplay / p.leads : 0;
                
                // CP-CAPI based on Assigned to Sales (Qualified)
                const cpCapi = p.assignedToSales > 0 ? spendsDisplay / p.assignedToSales : 0;
                
                const cpAp = p.ap > 0 ? spendsDisplay / p.ap : 0;
                const cpAd = p.ad > 0 ? spendsDisplay / p.ad : 0;

                return (
                  <tr key={ch.id} className="hover:bg-slate-800/30 transition-colors group">
                    <td className="px-4 py-2 sticky left-0 bg-slate-900 group-hover:bg-slate-800 border-r border-slate-800 font-medium text-slate-200">
                      {ch.name}
                    </td>
                    
                    {/* Spends Input (Always Base in DB, Display Taxed) */}
                    <td className="px-2 py-2 bg-blue-950/10">
                      <input
                        type="number"
                        value={p.spends || ''}
                        onChange={(e) => onUpdate(ch.id, 'spends', parseFloat(e.target.value) || 0)}
                        className="w-full text-right bg-transparent border-b border-transparent hover:border-blue-500 focus:border-blue-500 outline-none text-blue-200 font-bold py-1"
                        placeholder="0"
                      />
                    </td>

                    {/* Leads Input */}
                    <td className="px-2 py-2 bg-indigo-950/10">
                      <input
                        type="number"
                        value={p.leads || ''}
                        onChange={(e) => onUpdate(ch.id, 'leads', parseFloat(e.target.value) || 0)}
                        className="w-full text-right bg-transparent border-b border-transparent hover:border-indigo-500 focus:border-indigo-500 outline-none text-indigo-200 font-bold py-1"
                        placeholder="0"
                      />
                    </td>

                    {/* CPL Calculated */}
                    <td className="px-3 py-2 text-right font-medium text-slate-400">
                      {formatCurrency(cpl)}
                    </td>

                    {/* Open & Attempted */}
                    <td className="px-2 py-2">
                      <input
                        type="number"
                        value={p.openAttempted || ''}
                        onChange={(e) => onUpdate(ch.id, 'openAttempted', parseFloat(e.target.value) || 0)}
                        className="w-full text-right bg-transparent border-b border-slate-800 focus:border-slate-500 outline-none text-slate-300"
                      />
                    </td>
                    <td className="px-2 py-2 text-right text-slate-500 text-[10px] border-r border-slate-800">
                      {formatPercent(p.openAttempted, p.leads)}
                    </td>

                    {/* Contacted */}
                    <td className="px-2 py-2">
                      <input
                        type="number"
                        value={p.contacted || ''}
                        onChange={(e) => onUpdate(ch.id, 'contacted', parseFloat(e.target.value) || 0)}
                        className="w-full text-right bg-transparent border-b border-slate-800 focus:border-slate-500 outline-none text-slate-300"
                      />
                    </td>
                    <td className="px-2 py-2 text-right text-slate-500 text-[10px] border-r border-slate-800">
                      {formatPercent(p.contacted, p.leads)}
                    </td>

                    {/* Assigned (Qualified/CAPI) */}
                    <td className="px-2 py-2">
                      <input
                        type="number"
                        value={p.assignedToSales || ''}
                        onChange={(e) => onUpdate(ch.id, 'assignedToSales', parseFloat(e.target.value) || 0)}
                        className="w-full text-right bg-transparent border-b border-slate-800 focus:border-slate-500 outline-none text-slate-300"
                      />
                    </td>
                    <td className="px-2 py-2 text-right text-slate-500 text-[10px] border-r border-slate-800">
                      {formatPercent(p.assignedToSales, p.leads)}
                    </td>
                    <td className="px-3 py-2 text-right font-medium text-cyan-300 bg-cyan-950/10 border-r border-slate-800">
                      {cpCapi > 0 ? formatCurrency(cpCapi) : '-'}
                    </td>

                    {/* AP */}
                    <td className="px-2 py-2">
                      <input
                        type="number"
                        value={p.ap || ''}
                        onChange={(e) => onUpdate(ch.id, 'ap', parseFloat(e.target.value) || 0)}
                        className="w-full text-right bg-transparent border-b border-slate-800 focus:border-slate-500 outline-none text-slate-300"
                      />
                    </td>
                    <td className="px-2 py-2 text-right text-slate-500 text-[10px] border-r border-slate-800">
                      {formatPercent(p.ap, p.leads)}
                    </td>
                    <td className="px-3 py-2 text-right font-medium text-purple-300 bg-purple-950/10 border-r border-slate-800">
                      {cpAp > 0 ? formatCurrency(cpAp) : '-'}
                    </td>

                    {/* AD */}
                    <td className="px-2 py-2">
                      <input
                        type="number"
                        value={p.ad || ''}
                        onChange={(e) => onUpdate(ch.id, 'ad', parseFloat(e.target.value) || 0)}
                        className="w-full text-right bg-transparent border-b border-slate-800 focus:border-slate-500 outline-none text-slate-300"
                      />
                    </td>
                    <td className="px-2 py-2 text-right text-slate-500 text-[10px] border-r border-slate-800">
                      {formatPercent(p.ad, p.leads)}
                    </td>
                    <td className="px-3 py-2 text-right font-medium text-pink-300 bg-pink-950/10 border-r border-slate-800">
                      {cpAd > 0 ? formatCurrency(cpAd) : '-'}
                    </td>

                    {/* Bookings */}
                    <td className="px-2 py-2 bg-emerald-950/10">
                      <input
                        type="number"
                        value={p.bookings || ''}
                        onChange={(e) => onUpdate(ch.id, 'bookings', parseFloat(e.target.value) || 0)}
                        className="w-full text-right bg-transparent border-b border-transparent focus:border-emerald-500 outline-none text-emerald-400 font-bold"
                      />
                    </td>

                    {/* Lost */}
                    <td className="px-2 py-2 bg-red-950/10">
                      <input
                        type="number"
                        value={p.lost || ''}
                        onChange={(e) => onUpdate(ch.id, 'lost', parseFloat(e.target.value) || 0)}
                        className="w-full text-right bg-transparent border-b border-transparent focus:border-red-500 outline-none text-red-400"
                      />
                    </td>
                    <td className="px-2 py-2 text-right text-red-400/60 text-[10px] bg-red-950/10">
                      {formatPercent(p.lost, p.leads)}
                    </td>

                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-slate-950 border-t border-slate-800 font-bold sticky bottom-0 z-20 shadow-[0_-2px_5px_-2px_rgba(0,0,0,0.5)]">
              <tr>
                <td className="px-4 py-3 text-white sticky left-0 bg-slate-950 border-r border-slate-800 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.5)]">Total</td>
                <td className="px-3 py-3 text-right text-blue-400">{formatCurrency(totals.spends * taxMult)}</td>
                <td className="px-3 py-3 text-right text-indigo-400">{totals.leads.toLocaleString()}</td>
                <td className="px-3 py-3 text-right text-slate-400">
                  {totals.leads > 0 ? formatCurrency((totals.spends * taxMult) / totals.leads) : '-'}
                </td>
                <td className="px-3 py-3 text-right text-slate-300">{totals.openAttempted}</td>
                <td className="px-2 py-3 text-right text-slate-600 border-r border-slate-800">{formatPercent(totals.openAttempted, totals.leads)}</td>
                
                <td className="px-3 py-3 text-right text-slate-300">{totals.contacted}</td>
                <td className="px-2 py-3 text-right text-slate-600 border-r border-slate-800">{formatPercent(totals.contacted, totals.leads)}</td>
                
                <td className="px-3 py-3 text-right text-slate-300">{totals.assignedToSales}</td>
                <td className="px-2 py-3 text-right text-slate-600 border-r border-slate-800">{formatPercent(totals.assignedToSales, totals.leads)}</td>
                <td className="px-3 py-3 text-right text-cyan-400 border-r border-slate-800">
                   {totals.assignedToSales > 0 ? formatCurrency((totals.spends * taxMult) / totals.assignedToSales) : '-'}
                </td>
                
                <td className="px-3 py-3 text-right text-slate-300">{totals.ap}</td>
                <td className="px-2 py-3 text-right text-slate-600 border-r border-slate-800">{formatPercent(totals.ap, totals.leads)}</td>
                <td className="px-3 py-3 text-right text-purple-400 border-r border-slate-800">
                   {totals.ap > 0 ? formatCurrency((totals.spends * taxMult) / totals.ap) : '-'}
                </td>
                
                <td className="px-3 py-3 text-right text-slate-300">{totals.ad}</td>
                <td className="px-2 py-3 text-right text-slate-600 border-r border-slate-800">{formatPercent(totals.ad, totals.leads)}</td>
                <td className="px-3 py-3 text-right text-pink-400 border-r border-slate-800">
                   {totals.ad > 0 ? formatCurrency((totals.spends * taxMult) / totals.ad) : '-'}
                </td>
                
                <td className="px-3 py-3 text-right text-emerald-400 bg-emerald-950/10">{totals.bookings}</td>
                
                <td className="px-3 py-3 text-right text-red-400 bg-red-950/10">{totals.lost}</td>
                <td className="px-2 py-3 text-right text-red-400/60 bg-red-950/10">{formatPercent(totals.lost, totals.leads)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
