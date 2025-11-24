
import React, { useState, useEffect, useRef } from 'react';
import { MediaChannel, CalculatedMetrics, ViewMode } from '../types';
import { PieChart, TrendingUp, AlertCircle, CheckCircle2, Plus, Trash2, ChevronDown, RotateCcw } from 'lucide-react';

interface Props {
  channels: MediaChannel[];
  metrics: CalculatedMetrics;
  viewMode: ViewMode;
  manualBudget?: number;
  onUpdateChannel: (channelId: string, field: keyof MediaChannel, value: number | string) => void;
  onUpdateManualBudget: (value: number) => void;
  onAddChannel: (presetName?: string) => void;
  onDeleteChannel: (channelId: string) => void;
}

export const MediaMixSimulator: React.FC<Props> = ({ 
  channels, metrics, viewMode, manualBudget, onUpdateChannel, onUpdateManualBudget, onAddChannel, onDeleteChannel 
}) => {
  
  const [showAddMenu, setShowAddMenu] = useState(false);
  const budgetInputRef = useRef<HTMLInputElement>(null);

  // Fallback Budget (Calculated from Business Plan)
  const calculatedTotal = viewMode === ViewMode.AGENCY ? metrics.allInBudget : metrics.baseBudget;
  
  // The 'source of truth' from props. 
  const propBudget = manualBudget !== undefined ? manualBudget : calculatedTotal;

  // Local state handles the input field text for smooth typing
  const [localInputValue, setLocalInputValue] = useState<string>(propBudget.toString());

  // Sync local state ONLY when prop changes externally AND input is not focused.
  // This prevents the input from fighting the user while they type.
  useEffect(() => {
    if (document.activeElement !== budgetInputRef.current) {
        setLocalInputValue(propBudget.toString());
    }
  }, [propBudget]);

  // 1. HANDLE SIMULATION BUDGET CHANGE
  const handleBudgetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLocalInputValue(val); 

    const numVal = parseFloat(val);
    if (!isNaN(numVal)) {
        onUpdateManualBudget(numVal);
    } else if (val === '') {
        onUpdateManualBudget(0);
    }
  };

  const handleBudgetBlur = () => {
      const numVal = parseFloat(localInputValue);
      if (isNaN(numVal)) {
          onUpdateManualBudget(0);
          setLocalInputValue("0");
      } else {
          onUpdateManualBudget(numVal);
      }
  };

  const handleReset = () => {
      onUpdateManualBudget(calculatedTotal);
      setLocalInputValue(calculatedTotal.toString());
  };
  
  // 2. DETERMINE ACTIVE BUDGET FOR CALCULATION
  // We use the local string parsed as float to ensure the table updates INSTANTLY as you type.
  const currentInputVal = parseFloat(localInputValue);
  const activeBudget = !isNaN(currentInputVal) ? currentInputVal : 0;

  // 3. HANDLE CHANNEL BUDGET CHANGE (Reverse Calculation)
  const handleChannelBudgetChange = (channelId: string, newBudget: number) => {
      // If total budget is 0, we can't calculate percentage. Avoid division by zero.
      if (activeBudget <= 0) return; 
      
      const newAlloc = (newBudget / activeBudget) * 100;
      onUpdateChannel(channelId, 'allocationPercent', newAlloc);
  };

  // 4. PERFORM FORECASTING
  const totalAllocation = channels.reduce((sum, ch) => sum + (ch.allocationPercent || 0), 0);
  
  const forecastedData = channels.map(ch => {
    const alloc = isNaN(ch.allocationPercent) ? 0 : ch.allocationPercent;
    
    // Budget = Total * %
    const budget = activeBudget * (alloc / 100);
    
    const cpl = ch.estimatedCpl || 0;
    const leads = cpl > 0 ? budget / cpl : 0;
    
    const capi = leads * ((ch.capiPercent || 0) / 100);
    const ap = capi * ((ch.capiToApPercent || 0) / 100);
    const ad = ap * ((ch.apToAdPercent || 0) / 100);

    return { ...ch, budget, leads, capi, ap, ad };
  });

  const totalForecastedBudget = forecastedData.reduce((sum, ch) => sum + ch.budget, 0);
  const totalForecastedLeads = forecastedData.reduce((sum, ch) => sum + ch.leads, 0);
  const totalForecastedCapi = forecastedData.reduce((sum, ch) => sum + ch.capi, 0);
  const totalForecastedAp = forecastedData.reduce((sum, ch) => sum + ch.ap, 0);
  const totalForecastedAd = forecastedData.reduce((sum, ch) => sum + ch.ad, 0);

  const blendedCPL = totalForecastedLeads > 0 ? totalForecastedBudget / totalForecastedLeads : 0;

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

  const PRESET_CHANNELS = [
    "LinkedIn", "YouTube", "Print / Newspaper", "Hoardings / OOH", "Radio", "Channel Partners"
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 animate-in fade-in duration-300" onClick={() => setShowAddMenu(false)}>
      
      {/* Main Simulator Table */}
      <div className="lg:col-span-3 bg-slate-900 rounded-xl shadow-xl border border-slate-800 overflow-hidden flex flex-col">
        <div className="bg-indigo-950/30 border-b border-indigo-900/50 p-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <PieChart className="w-5 h-5 text-indigo-400" /> Media Mix Simulator
            </h2>
          </div>
          
          <div className="flex items-center gap-3 bg-slate-800/50 p-2 rounded-lg border border-slate-700">
             <span className="text-sm font-medium text-indigo-300">Simulation Budget:</span>
             <div className="relative group">
               <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-xs pointer-events-none">₹</span>
               <input 
                  ref={budgetInputRef}
                  type="text"
                  value={localInputValue}
                  onChange={handleBudgetChange}
                  onBlur={handleBudgetBlur}
                  onFocus={(e) => e.target.select()}
                  className="bg-slate-900 border border-slate-600 rounded px-2 py-1 pl-6 text-white font-bold w-36 text-right focus:ring-1 focus:ring-indigo-500 outline-none transition-all group-hover:border-slate-500"
                  placeholder="0"
               />
             </div>
             {manualBudget !== undefined && Math.abs(manualBudget - calculatedTotal) > 1 && (
               <button 
                onClick={handleReset}
                className="flex items-center gap-1 bg-slate-700 hover:bg-slate-600 text-white text-[10px] px-2 py-1 rounded ml-2 transition-colors font-medium"
                title="Reset to Business Plan Budget"
               >
                 <RotateCcw className="w-3 h-3" /> Reset
               </button>
             )}
          </div>
        </div>

        <div className="flex-1 overflow-x-auto custom-scrollbar">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-950 text-slate-500 border-b border-slate-800 uppercase font-bold whitespace-nowrap">
              <tr>
                <th className="px-4 py-3 sticky left-0 bg-slate-950 z-10 border-r border-slate-800 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.5)]">Channel</th>
                <th className="px-2 py-3 text-center w-20 bg-slate-900/50">Alloc %</th>
                <th className="px-3 py-3 text-right min-w-[120px] bg-slate-900/50 text-emerald-400">Budget (Edit)</th>
                <th className="px-2 py-3 text-right w-24">Est. CPL</th>
                <th className="px-3 py-3 text-right text-indigo-300">Proj. Leads</th>
                
                {/* Funnel Inputs */}
                <th className="px-2 py-3 text-center w-20 bg-slate-900/30 border-l border-slate-800">CAPI %</th>
                <th className="px-2 py-3 text-right text-indigo-200 bg-slate-900/30">Proj. CAPI</th>
                
                <th className="px-2 py-3 text-center w-20 bg-slate-900/30 border-l border-slate-800">CAPI-AP %</th>
                <th className="px-2 py-3 text-right text-purple-200 bg-slate-900/30">Proj. AP</th>

                <th className="px-2 py-3 text-center w-20 bg-slate-900/30 border-l border-slate-800">AP-AD %</th>
                <th className="px-2 py-3 text-right text-pink-200 bg-slate-900/30">Proj. AD</th>

                <th className="px-2 py-3 text-center w-10 bg-slate-900/30"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {forecastedData.map(channel => (
                <tr key={channel.id} className="hover:bg-slate-800/50 transition-colors group">
                  <td className="px-4 py-2 font-medium text-slate-200 sticky left-0 bg-slate-900 group-hover:bg-slate-800 border-r border-slate-800 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.5)]">
                     <input 
                      type="text"
                      value={channel.name}
                      onChange={(e) => onUpdateChannel(channel.id, 'name', e.target.value)}
                      className="bg-transparent border-b border-transparent hover:border-slate-600 focus:border-indigo-500 text-slate-200 font-medium w-full outline-none placeholder-slate-600"
                      placeholder="Channel Name"
                     />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="number"
                      value={channel.allocationPercent === 0 ? '' : Number(channel.allocationPercent.toFixed(2))}
                      placeholder="0"
                      onChange={(e) => onUpdateChannel(channel.id, 'allocationPercent', parseFloat(e.target.value) || 0)}
                      className="w-full text-center bg-slate-800 border border-slate-700 rounded py-1 text-white font-bold focus:ring-1 focus:ring-indigo-500 outline-none"
                    />
                  </td>
                  
                  {/* EDITABLE CHANNEL BUDGET */}
                  <td className="px-3 py-2 text-right font-medium">
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-emerald-600 text-[10px]">₹</span>
                      <input
                        type="number"
                        value={channel.budget === 0 ? '' : Math.round(channel.budget)}
                        placeholder="0"
                        onChange={(e) => handleChannelBudgetChange(channel.id, parseFloat(e.target.value) || 0)}
                        className="w-full text-right bg-slate-800 border border-slate-700 rounded py-1 pl-4 text-emerald-400 font-bold focus:ring-1 focus:ring-emerald-500 outline-none"
                      />
                    </div>
                  </td>

                  <td className="px-2 py-2">
                    <input
                      type="number"
                      value={channel.estimatedCpl === 0 ? '' : channel.estimatedCpl}
                      placeholder="0"
                      onChange={(e) => onUpdateChannel(channel.id, 'estimatedCpl', parseFloat(e.target.value) || 0)}
                      className="w-full text-right bg-slate-800 border border-slate-700 rounded py-1 text-white font-medium focus:ring-1 focus:ring-indigo-500 outline-none"
                    />
                  </td>
                  <td className="px-3 py-2 text-right font-bold text-indigo-400">
                    {Math.round(channel.leads).toLocaleString()}
                  </td>

                  {/* Funnel Inputs */}
                  <td className="px-2 py-2 border-l border-slate-800 bg-slate-900/30">
                     <input
                      type="number"
                      value={channel.capiPercent === 0 ? '' : channel.capiPercent}
                      placeholder="0"
                      onChange={(e) => onUpdateChannel(channel.id, 'capiPercent', parseFloat(e.target.value) || 0)}
                      className="w-full text-center bg-slate-800 border border-slate-700 rounded py-1 text-emerald-200 font-medium focus:ring-1 focus:ring-indigo-500 outline-none"
                    />
                  </td>
                  <td className="px-2 py-2 text-right text-indigo-200 bg-slate-900/30">
                    {Math.round(channel.capi).toLocaleString()}
                  </td>

                   <td className="px-2 py-2 border-l border-slate-800 bg-slate-900/30">
                     <input
                      type="number"
                      value={channel.capiToApPercent === 0 ? '' : channel.capiToApPercent}
                      placeholder="0"
                      onChange={(e) => onUpdateChannel(channel.id, 'capiToApPercent', parseFloat(e.target.value) || 0)}
                      className="w-full text-center bg-slate-800 border border-slate-700 rounded py-1 text-purple-200 font-medium focus:ring-1 focus:ring-indigo-500 outline-none"
                    />
                  </td>
                  <td className="px-2 py-2 text-right text-purple-200 bg-slate-900/30">
                    {Math.round(channel.ap).toLocaleString()}
                  </td>

                  <td className="px-2 py-2 border-l border-slate-800 bg-slate-900/30">
                     <input
                      type="number"
                      value={channel.apToAdPercent === 0 ? '' : channel.apToAdPercent}
                      placeholder="0"
                      onChange={(e) => onUpdateChannel(channel.id, 'apToAdPercent', parseFloat(e.target.value) || 0)}
                      className="w-full text-center bg-slate-800 border border-slate-700 rounded py-1 text-pink-200 font-medium focus:ring-1 focus:ring-indigo-500 outline-none"
                    />
                  </td>
                  <td className="px-2 py-2 text-right text-pink-200 bg-slate-900/30">
                    {Math.round(channel.ad).toLocaleString()}
                  </td>
                  
                  <td className="px-2 py-2 text-center bg-slate-900/30">
                    <button 
                      type="button"
                      onClick={(e) => { e.stopPropagation(); onDeleteChannel(channel.id); }}
                      className="p-1 text-slate-600 hover:text-red-400 hover:bg-red-900/20 rounded transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-950 border-t border-slate-800 font-bold sticky bottom-0 z-20 shadow-[0_-2px_5px_-2px_rgba(0,0,0,0.5)]">
              <tr>
                <td className="px-4 py-3 text-white sticky left-0 bg-slate-950 border-r border-slate-800 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.5)]">Total</td>
                <td className={`px-2 py-3 text-center ${Math.abs(totalAllocation - 100) > 0.5 ? 'text-red-500' : 'text-green-500'}`}>
                  {Math.round(totalAllocation)}%
                </td>
                <td className="px-3 py-3 text-right text-white">{formatCurrency(totalForecastedBudget)}</td>
                <td className="px-2 py-3 text-right text-white">Avg ₹{Math.round(blendedCPL).toLocaleString()}</td>
                <td className="px-3 py-3 text-right text-indigo-400 text-sm">{Math.round(totalForecastedLeads).toLocaleString()}</td>
                <td className="px-2 py-3 bg-slate-950 border-l border-slate-800"></td>
                <td className="px-2 py-3 text-right text-emerald-400">{Math.round(totalForecastedCapi).toLocaleString()}</td>
                <td className="px-2 py-3 bg-slate-950 border-l border-slate-800"></td>
                <td className="px-2 py-3 text-right text-purple-400">{Math.round(totalForecastedAp).toLocaleString()}</td>
                <td className="px-2 py-3 bg-slate-950 border-l border-slate-800"></td>
                <td className="px-2 py-3 text-right text-pink-400">{Math.round(totalForecastedAd).toLocaleString()}</td>
                <td className="px-2 py-3"></td>
              </tr>
            </tfoot>
          </table>
        </div>
        
        <div className="bg-slate-950/50 p-3 border-t border-slate-800 flex justify-between items-center">
           <div className="relative">
             <button 
               onClick={(e) => { e.stopPropagation(); setShowAddMenu(!showAddMenu); }}
               className="flex items-center gap-2 text-xs font-bold text-indigo-400 hover:text-indigo-300 bg-indigo-900/20 hover:bg-indigo-900/40 px-3 py-1.5 rounded transition-colors"
             >
               <Plus className="w-3.5 h-3.5" /> Add Channel <ChevronDown className="w-3 h-3" />
             </button>
             {showAddMenu && (
               <div className="absolute bottom-full left-0 mb-1 w-48 bg-slate-800 border border-slate-700 shadow-xl rounded-lg overflow-hidden z-30">
                  <div className="text-[10px] uppercase font-bold text-slate-500 px-3 py-2 bg-slate-900/50">Quick Add</div>
                  {PRESET_CHANNELS.map(name => (
                    <button 
                      key={name}
                      onClick={() => { onAddChannel(name); setShowAddMenu(false); }}
                      className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-slate-700 hover:text-white"
                    >
                      {name}
                    </button>
                  ))}
                  <div className="border-t border-slate-700"></div>
                  <button 
                    onClick={() => { onAddChannel(); setShowAddMenu(false); }}
                    className="w-full text-left px-3 py-2 text-xs text-indigo-400 font-bold hover:bg-slate-700"
                  >
                    Custom Channel...
                  </button>
               </div>
             )}
           </div>

           {Math.abs(totalAllocation - 100) > 0.5 && (
             <div className="text-xs text-red-400 flex items-center gap-2 font-medium">
               <AlertCircle className="w-4 h-4" /> Allocation must equal 100%. Current: {Math.round(totalAllocation)}%
             </div>
           )}
        </div>
      </div>

      {/* Forecasting Summary Card */}
      <div className="space-y-6">
        <div className="bg-slate-900 rounded-xl shadow-xl border border-slate-800 p-6">
          <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-4">Plan Variance</h3>
          
          <div className="space-y-6">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-400">Target Walkins (Biz Plan)</span>
                <span className="font-bold text-white">{Math.ceil(metrics.targetWalkins).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-pink-400 font-medium">Proj. Walkins (Simulator)</span>
                <span className="font-bold text-pink-300">{Math.round(totalForecastedAd).toLocaleString()}</span>
              </div>
              
              {/* Progress Bar */}
              <div className="w-full bg-slate-800 rounded-full h-2.5 mt-2 overflow-hidden">
                <div 
                  className={`h-2.5 rounded-full shadow-lg ${totalForecastedAd >= metrics.targetWalkins ? 'bg-green-500 shadow-green-500/30' : 'bg-red-500 shadow-red-500/30'}`}
                  style={{ width: `${Math.min((totalForecastedAd / (metrics.targetWalkins || 1)) * 100, 100)}%` }}
                ></div>
              </div>
               <div className="mt-2 text-xs text-right">
                 {totalForecastedAd >= metrics.targetWalkins ? (
                    <span className="text-green-400 font-bold flex justify-end items-center gap-1">
                       <CheckCircle2 className="w-3 h-3" /> Target Achievable
                    </span>
                 ) : (
                    <span className="text-red-400 font-bold flex justify-end items-center gap-1">
                       <TrendingUp className="w-3 h-3" /> Gap: {(metrics.targetWalkins - totalForecastedAd).toFixed(0)} Walkins
                    </span>
                 )}
               </div>
            </div>

            <div className="pt-4 border-t border-slate-800">
               <div className="flex justify-between items-center mb-2">
                 <span className="text-slate-500 text-xs uppercase font-bold">Simulated CPW</span>
               </div>
               <div className="flex items-baseline gap-2">
                 <span className="text-2xl font-bold text-white">{totalForecastedAd > 0 ? formatCurrency(activeBudget / totalForecastedAd) : '-'}</span>
                 <span className="text-xs text-slate-500">vs Plan: {formatCurrency(metrics.cpw)}</span>
               </div>
               <p className="text-xs text-slate-400 mt-1">
                 Adjust funnel % (CAPI, AP, AD) to check if Walkin targets are realistic within budget.
               </p>
            </div>

          </div>
        </div>

        <div className="bg-blue-950/20 rounded-xl border border-blue-900/40 p-5">
            <h4 className="text-blue-400 font-bold text-sm mb-2">Simulation Mode</h4>
            <ul className="text-xs text-blue-300 space-y-2 list-disc pl-4">
              <li>Edit the <b>Simulation Budget</b> at the top to see impact of higher/lower spend.</li>
              <li>Edit individual <b>Channel Budgets</b> directly to auto-adjust allocation %.</li>
              <li>Input <b>CAPI %</b> (Qualified Lead %) and subsequent conversion rates.</li>
              <li>Aim to match or exceed the <b>Target Walkins</b> from the Business Plan.</li>
            </ul>
        </div>
      </div>

    </div>
  );
};
