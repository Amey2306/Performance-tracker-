
import React from 'react';
import { PlanningData, CalculatedMetrics, ViewMode } from '../types';
import { Calculator, Target, Info } from 'lucide-react';

interface Props {
  data: PlanningData;
  metrics: CalculatedMetrics;
  onChange: (key: keyof PlanningData, value: number) => void;
  viewMode: ViewMode;
  readOnly?: boolean;
}

export const PlanningSection: React.FC<Props> = ({ data, metrics, onChange, viewMode, readOnly = false }) => {
  
  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

  const formatCrore = (val: number) => `₹${val.toFixed(2)} Cr`;

  // Helper for consistent input styling (Dark Mode)
  const InputField = ({ label, value, onChange, disabled, suffix, prefix }: any) => (
    <div className="relative group">
       <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 group-focus-within:text-brand-400 transition-colors">
         {label}
       </label>
       <div className="relative">
         {prefix && <span className="absolute left-3 top-2.5 text-slate-400 font-medium text-sm">{prefix}</span>}
         <input
            type="number"
            disabled={disabled}
            value={value}
            onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
            className={`w-full bg-slate-950 border border-slate-800 text-white text-sm font-bold rounded-lg px-3 py-2.5 shadow-inner focus:ring-1 focus:ring-brand-500 focus:border-brand-500 transition-all outline-none disabled:bg-slate-900 disabled:text-slate-600 ${prefix ? 'pl-7' : ''} ${suffix ? 'pr-8' : ''}`}
          />
         {suffix && <span className="absolute right-3 top-2.5 text-slate-500 font-bold text-sm">{suffix}</span>}
       </div>
    </div>
  );

  return (
    <div className="bg-slate-900 rounded-2xl shadow-xl border border-slate-800 overflow-hidden mb-8 animate-in fade-in duration-300">
      <div className="bg-slate-900 border-b border-slate-800 p-6 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Target className="w-5 h-5 text-brand-500" />
            Business Plan & Parameters
          </h2>
          <p className="text-sm text-slate-500 mt-1">Define the anchors for your funnel calculation.</p>
        </div>
        {readOnly && (
          <div className="bg-amber-950/40 text-amber-400 text-xs font-bold px-3 py-1.5 rounded-full border border-amber-900 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5" /> Plan Locked
          </div>
        )}
      </div>

      <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-8">
        {/* Input Group 1: Business Targets */}
        <div className="space-y-6">
          <h3 className="text-xs font-bold text-slate-600 uppercase border-b border-slate-800 pb-2">Revenue Targets</h3>
          
          <InputField 
            label="Overall BV Target (Cr)"
            value={data.overallBV}
            onChange={(val: number) => onChange('overallBV', val)}
            disabled={readOnly}
          />
          <InputField 
            label="Avg Ticket Size (Cr)"
            value={data.ats}
            onChange={(val: number) => onChange('ats', val)}
            disabled={readOnly}
          />
          <div className="grid grid-cols-2 gap-4">
             <InputField 
              label="Digital Contrib."
              value={data.digitalContributionPercent}
              onChange={(val: number) => onChange('digitalContributionPercent', val)}
              disabled={readOnly}
              suffix="%"
            />
             <InputField 
              label="Presales Contrib."
              value={data.presalesContributionPercent}
              onChange={(val: number) => onChange('presalesContributionPercent', val)}
              disabled={readOnly}
              suffix="%"
            />
          </div>
        </div>

        {/* Input Group 2: Funnel Efficiency */}
        <div className="space-y-6">
          <h3 className="text-xs font-bold text-slate-600 uppercase border-b border-slate-800 pb-2">Funnel Efficiency</h3>
          
          <InputField 
            label="Lead to Walkin (LTW)"
            value={data.ltwPercent}
            onChange={(val: number) => onChange('ltwPercent', val)}
            disabled={readOnly}
            suffix="%"
          />
          <InputField 
            label="Walkin to Booking (WTB)"
            value={data.wtbPercent}
            onChange={(val: number) => onChange('wtbPercent', val)}
            disabled={readOnly}
            suffix="%"
          />
        </div>

        {/* Input Group 3: Costs */}
        <div className="space-y-6">
          <h3 className="text-xs font-bold text-slate-600 uppercase border-b border-slate-800 pb-2">Cost Planning</h3>
          
          <InputField 
            label="Planned CPL"
            value={data.cpl}
            onChange={(val: number) => onChange('cpl', val)}
            disabled={readOnly}
            prefix="₹"
          />
          <InputField 
            label="Tax / Agency Fee"
            value={data.taxPercent}
            onChange={(val: number) => onChange('taxPercent', val)}
            disabled={readOnly}
            suffix="%"
          />
        </div>

        {/* Output Group: Derived Targets */}
        <div className="bg-emerald-950/20 rounded-xl p-6 border border-emerald-900/40 flex flex-col justify-center relative overflow-hidden">
           <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/10 blur-xl rounded-full pointer-events-none"></div>
           <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2 mb-4 relative z-10">
             <Calculator className="w-4 h-4" />
             Derived Annual Targets
           </h3>
           
           <div className="space-y-4 relative z-10">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Total Units</span>
                <span className="text-lg font-bold text-white">{metrics.totalUnits.toFixed(1)}</span>
              </div>
              <div className="w-full h-px bg-emerald-900/50"></div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Digital Units</span>
                <span className="text-lg font-bold text-white">{metrics.digitalUnits.toFixed(1)}</span>
              </div>
              <div className="w-full h-px bg-emerald-900/50"></div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Target Walkins</span>
                <span className="text-lg font-bold text-white">{Math.ceil(metrics.targetWalkins)}</span>
              </div>
              <div className="w-full h-px bg-emerald-900/50"></div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Target Leads</span>
                <span className="text-xl font-black text-brand-400">{Math.ceil(metrics.targetLeads).toLocaleString()}</span>
              </div>
           </div>
        </div>
      </div>

      {/* Summary Footer */}
      <div className={`px-8 py-5 border-t border-slate-800 flex flex-wrap gap-12 items-center ${viewMode === ViewMode.AGENCY ? 'bg-amber-950/20' : 'bg-emerald-950/20'}`}>
        <div>
          <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Total Plan Spend ({viewMode === ViewMode.BRAND ? 'Base' : 'All-in'})</span>
          <div className="text-2xl font-black text-white tracking-tight">
            {formatCurrency(viewMode === ViewMode.BRAND ? metrics.baseBudget : metrics.allInBudget)}
          </div>
        </div>
        
        <div className="h-10 w-px bg-slate-800"></div>
        
        {/* New Metrics Display for Dashboard (Digital BV / Presales BV) */}
        <div>
           <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Digital BV</span>
           <div className="text-lg font-bold text-white">{formatCrore(metrics.digitalBV)}</div>
        </div>
        <div>
           <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Target COM %</span>
           <div className="text-lg font-bold text-white">{metrics.targetCOM.toFixed(2)}%</div>
        </div>

        <div className="h-10 w-px bg-slate-800"></div>

        <div>
           <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Target CPW</span>
           <div className="text-lg font-bold text-slate-300">{formatCurrency(metrics.cpw)}</div>
        </div>

        <div>
           <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Target CPB</span>
           <div className="text-lg font-bold text-slate-300">{formatCurrency(metrics.cpb)}</div>
        </div>

        <div className="ml-auto">
           <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 text-right">Proj. Revenue</span>
           <div className="text-xl font-bold text-brand-400">{formatCrore(metrics.revenue / 10000000)}</div>
        </div>
      </div>
    </div>
  );
};
