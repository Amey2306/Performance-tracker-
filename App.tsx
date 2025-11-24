
import React, { useState, useMemo } from 'react';
import { Project, PlanningData, CalculatedMetrics, WeeklyData, ViewMode, WeeklyActuals, MediaChannel, Poc } from './types';
import { ProjectDetail } from './components/ProjectDetail';
import { DashboardOverview } from './components/DashboardOverview';
import { VisualDashboard } from './components/VisualDashboard';
import { LayoutDashboard, Briefcase, UserCircle, Plus, PieChart, Table, UserPlus, X, Calendar, Search, Check } from 'lucide-react';

const INITIAL_PLAN: PlanningData = {
  overallBV: 350, // 350 Cr
  ats: 7, // 7 Cr
  digitalContributionPercent: 12.5,
  presalesContributionPercent: 2.5,
  ltwPercent: 3.0,
  wtbPercent: 6.0,
  cpl: 4819,
  taxPercent: 18,
  receivedBudget: 0,
};

const INITIAL_MEDIA_PLAN: MediaChannel[] = [
  { id: 'fb', name: 'Meta (FB/Insta)', allocationPercent: 40, estimatedCpl: 4200, capiPercent: 35, capiToApPercent: 30, apToAdPercent: 50 },
  { id: 'google', name: 'Google Search', allocationPercent: 30, estimatedCpl: 3800, capiPercent: 40, capiToApPercent: 35, apToAdPercent: 55 },
  { id: 'display', name: 'Google Display', allocationPercent: 10, estimatedCpl: 2500, capiPercent: 20, capiToApPercent: 15, apToAdPercent: 30 },
  { id: 'portals', name: 'Property Portals', allocationPercent: 15, estimatedCpl: 3200, capiPercent: 45, capiToApPercent: 40, apToAdPercent: 60 },
  { id: 'native', name: 'Native / Others', allocationPercent: 5, estimatedCpl: 5500, capiPercent: 25, capiToApPercent: 20, apToAdPercent: 40 },
];

// Generate 13 weeks starting Oct 1 2025
const PROJECT_START_DATE = new Date('2025-10-01');

const generateWeeks = (): WeeklyData[] => {
  const weeks: WeeklyData[] = [];
  
  const initialSpendDist = [0, 0, 7, 8, 11, 11, 13, 13, 13, 13, 11, 0, 0]; 
  const initialLeadDist = [0, 0, 7, 8, 11, 11, 13, 13, 13, 13, 11, 0, 0];
  const initialAdConv = [0, 0, 3, 3, 2.5, 2.5, 2.5, 2.7, 2.7, 2.7, 3.2, 3, 0];

  for (let i = 0; i < 13; i++) {
    const start = new Date(PROJECT_START_DATE);
    start.setDate(PROJECT_START_DATE.getDate() + (i * 7));
    const end = new Date(start);
    end.setDate(start.getDate() + 6);

    weeks.push({
      id: i,
      weekLabel: `Week ${i + 1}`,
      dateRange: `${start.getDate()} ${start.toLocaleString('default', { month: 'short' })} - ${end.getDate()} ${end.toLocaleString('default', { month: 'short' })}`,
      spendDistribution: initialSpendDist[i] || 0,
      leadDistribution: initialLeadDist[i] || 0,
      adConversion: initialAdConv[i] || 2.5,
      leads: 0,
      cumulativeLeads: 0,
      ap: 0,
      cumulativeAp: 0,
      ad: 0,
      cumulativeAd: 0,
      spendsBase: 0,
      spendsAllIn: 0,
    });
  }
  return weeks;
};

const INITIAL_PROJECTS: Project[] = [
  {
    id: '1',
    name: 'Godrej Horizon',
    location: 'Wadala, Mumbai',
    poc: 'Amey',
    status: 'Active',
    plan: { ...INITIAL_PLAN, overallBV: 350, receivedBudget: 2936003 },
    otherSpends: 50000,
    mediaPlan: [...INITIAL_MEDIA_PLAN],
    weeks: generateWeeks(),
    actuals: {
      0: { weekId: 0, leads: 38, ap: 3, ad: 2, spends: 137143, bookings: 0, presalesBookings: 0 },
      1: { weekId: 1, leads: 76, ap: 8, ad: 4, spends: 274286, bookings: 1, presalesBookings: 0 },
      2: { weekId: 2, leads: 115, ap: 12, ad: 6, spends: 400000, bookings: 1, presalesBookings: 1 },
    },
    isLocked: true,
  },
  {
    id: '2',
    name: 'Godrej Reserve',
    location: 'Kandivali, Mumbai',
    poc: 'Rohan',
    status: 'Planning',
    plan: { ...INITIAL_PLAN, overallBV: 500, receivedBudget: 0 },
    otherSpends: 0,
    mediaPlan: [...INITIAL_MEDIA_PLAN],
    weeks: generateWeeks(),
    actuals: {},
    isLocked: false,
  }
];

const INITIAL_POCS: Poc[] = [
  { id: '1', name: 'Amey' },
  { id: '2', name: 'Rohan' },
  { id: '3', name: 'Pratham' },
];

const App = () => {
  const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.BRAND);
  const [isVisualMode, setIsVisualMode] = useState(false);
  
  // Reporting State
  const [reportStartDate, setReportStartDate] = useState<string>('2025-10-01');
  const [reportEndDate, setReportEndDate] = useState<string>('2025-11-24');
  
  // POC State
  const [pocs, setPocs] = useState<Poc[]>(INITIAL_POCS);
  const [selectedPocFilter, setSelectedPocFilter] = useState<string>('All');
  const [isPocModalOpen, setIsPocModalOpen] = useState(false);
  const [newPocName, setNewPocName] = useState('');
  const [isAddingPoc, setIsAddingPoc] = useState(false);

  // New Project Modal State
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectPoc, setNewProjectPoc] = useState(INITIAL_POCS[0]?.name || '');

  // 1. Calculate Metrics Function
  const calculateMetrics = (plan: PlanningData): CalculatedMetrics => {
    const digitalBV = plan.overallBV * (plan.digitalContributionPercent / 100);
    const presalesBV = plan.overallBV * (plan.presalesContributionPercent / 100);
    
    const totalUnits = plan.overallBV / plan.ats;
    const digitalUnits = digitalBV / plan.ats;
    const presalesUnits = presalesBV / plan.ats;
    
    const targetWalkins = digitalUnits / (plan.wtbPercent / 100);
    const targetLeads = targetWalkins / (plan.ltwPercent / 100);
    
    const baseBudget = targetLeads * plan.cpl;
    const taxAmount = baseBudget * (plan.taxPercent / 100);
    const allInBudget = baseBudget + taxAmount;

    const cpw = baseBudget / targetWalkins;
    const cpb = baseBudget / digitalUnits; // Cost per digital booking
    const revenue = plan.overallBV * 10000000; // Convert Cr to actual
    const targetCOM = (allInBudget / (digitalBV * 10000000)) * 100;

    return { 
      totalUnits, digitalUnits, presalesUnits, digitalBV, presalesBV, 
      targetWalkins, targetLeads, baseBudget, taxAmount, allInBudget, 
      cpw, cpb, revenue, targetCOM 
    };
  };

  // 2. Recalculate Weekly Data Function
  const recalculateWeeks = (weeks: WeeklyData[], metrics: CalculatedMetrics): WeeklyData[] => {
    let cumLeads = 0;
    let cumAp = 0;
    let cumAd = 0;

    return weeks.map(week => {
      const leads = metrics.targetLeads * (week.leadDistribution / 100);
      cumLeads += leads;
      const ad = leads * (week.adConversion / 100); 
      const ap = ad * 2; // Rule of thumb: AP is 2x AD

      cumAp += ap;
      cumAd += ad;

      const spendsBase = metrics.baseBudget * (week.spendDistribution / 100);
      const spendsAllIn = metrics.allInBudget * (week.spendDistribution / 100);

      return {
        ...week,
        leads, cumulativeLeads: cumLeads,
        ap, cumulativeAp: cumAp,
        ad, cumulativeAd: cumAd,
        spendsBase, spendsAllIn
      };
    });
  };

  // Initialize projects with calculations
  const calculatedProjects = useMemo(() => {
    return projects.map(p => {
      const metrics = calculateMetrics(p.plan);
      const weeks = recalculateWeeks(p.weeks, metrics);
      return { ...p, weeks };
    });
  }, [projects]);

  const getProjectMetrics = (id: string) => {
    const p = calculatedProjects.find(proj => proj.id === id);
    return p ? calculateMetrics(p.plan) : calculateMetrics(INITIAL_PLAN);
  };

  // Handlers
  const updateProjectPlan = (id: string, key: keyof PlanningData, value: number) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, plan: { ...p.plan, [key]: value } } : p));
  };

  const updateProjectField = (id: string, field: 'receivedBudget' | 'otherSpends', value: number) => {
     setProjects(prev => prev.map(p => p.id === id ? { ...p, [field]: value, plan: field === 'receivedBudget' ? { ...p.plan, receivedBudget: value } : p.plan } : p));
  }
  
  const updateProjectManualBudget = (id: string, value: number) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, manualMediaBudget: value } : p));
  };

  const updateProjectWeek = (id: string, weekId: number, field: keyof WeeklyData, value: number) => {
    setProjects(prev => prev.map(p => {
      if (p.id !== id) return p;
      const updatedWeeks = p.weeks.map(w => w.id === weekId ? { ...w, [field]: value } : w);
      return { ...p, weeks: updatedWeeks };
    }));
  };

  const updateProjectActual = (id: string, weekId: number, field: keyof WeeklyActuals, value: number) => {
    setProjects(prev => prev.map(p => {
      if (p.id !== id) return p;
      const currentActual = p.actuals[weekId] || { weekId };
      return {
        ...p,
        actuals: {
          ...p.actuals,
          [weekId]: { ...currentActual, [field]: value }
        }
      };
    }));
  };

  // Media Plan Handlers
  const updateMediaChannel = (projectId: string, channelId: string, field: keyof MediaChannel, value: number | string) => {
    setProjects(prev => prev.map(p => {
      if (p.id !== projectId) return p;
      return {
        ...p,
        mediaPlan: p.mediaPlan.map(ch => ch.id === channelId ? { ...ch, [field]: value } : ch)
      };
    }));
  };

  const addMediaChannel = (projectId: string, presetName?: string) => {
    const newChannel: MediaChannel = {
       id: Date.now().toString(),
       name: presetName || 'New Channel',
       allocationPercent: 0,
       estimatedCpl: 0,
       capiPercent: 30,
       capiToApPercent: 30,
       apToAdPercent: 50,
       isCustom: true
    };
    setProjects(prev => prev.map(p => p.id === projectId ? { ...p, mediaPlan: [...p.mediaPlan, newChannel] } : p));
  };

  const deleteMediaChannel = (projectId: string, channelId: string) => {
    setProjects(prev => prev.map(p => p.id === projectId ? { ...p, mediaPlan: p.mediaPlan.filter(c => c.id !== channelId) } : p));
  };

  const toggleProjectLock = (id: string) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, isLocked: !p.isLocked } : p));
  };

  const updateProjectPoc = (id: string, newPocName: string) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, poc: newPocName } : p));
  };

  const handleDeleteProject = (id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
  };

  const handleAddProject = () => {
    if (!newProjectName.trim()) return;
    const newId = Date.now().toString();
    const newProject: Project = {
      id: newId,
      name: newProjectName,
      location: 'New Location',
      poc: newProjectPoc,
      status: 'Planning',
      plan: { ...INITIAL_PLAN },
      otherSpends: 0,
      mediaPlan: [...INITIAL_MEDIA_PLAN],
      weeks: generateWeeks(),
      actuals: {},
      isLocked: false,
    };
    setProjects(prev => [...prev, newProject]);
    setIsProjectModalOpen(false);
    setNewProjectName('');
  };

  const handleAddPoc = () => {
    if (newPocName.trim()) {
      const newId = Date.now().toString();
      setPocs([...pocs, { id: newId, name: newPocName }]);
      setNewPocName('');
      setIsAddingPoc(false);
    }
  };

  // Week Index Calculation for Date Range
  const getWeekIndexFromDate = (dateStr: string) => {
    const target = new Date(dateStr);
    const start = new Date(PROJECT_START_DATE);
    // Diff in weeks
    const diffTime = target.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    let weekIdx = Math.floor(diffDays / 7);
    
    if (target < start) weekIdx = -1;
    if (weekIdx > 12) weekIdx = 12;
    
    return weekIdx;
  };

  const startWeekIndex = getWeekIndexFromDate(reportStartDate);
  const endWeekIndex = getWeekIndexFromDate(reportEndDate);

  const filteredProjects = selectedPocFilter === 'All' 
    ? calculatedProjects 
    : calculatedProjects.filter(p => p.poc === selectedPocFilter);

  const activeProject = calculatedProjects.find(p => p.id === selectedProjectId);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-brand-500/30">
      
      {/* --- HEADER --- */}
      <header className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-tr from-brand-600 to-brand-400 p-2 rounded-lg shadow-lg shadow-brand-500/20">
              <LayoutDashboard className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-white">EstateFlow</h1>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Performance Tracking Suite</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Date Range Filter */}
            <div className="flex items-center bg-slate-800 rounded-lg border border-slate-700 p-1 shadow-sm">
               <div className="flex items-center px-2 border-r border-slate-700">
                 <span className="text-[10px] text-slate-500 mr-2 font-bold">FROM</span>
                 <input 
                   type="date" 
                   value={reportStartDate}
                   onChange={(e) => setReportStartDate(e.target.value)}
                   className="bg-transparent text-xs font-bold text-white outline-none w-24 uppercase"
                 />
               </div>
               <div className="flex items-center px-2">
                 <span className="text-[10px] text-slate-500 mr-2 font-bold">TO</span>
                 <input 
                   type="date" 
                   value={reportEndDate}
                   onChange={(e) => setReportEndDate(e.target.value)}
                   className="bg-transparent text-xs font-bold text-white outline-none w-24 uppercase"
                 />
               </div>
            </div>

            {/* SPOC Filter & Add */}
            <div className="flex items-center bg-slate-800 rounded-lg border border-slate-700 p-1 shadow-sm relative">
              <div className="flex items-center px-3 gap-2 border-r border-slate-700">
                <UserCircle className="w-4 h-4 text-slate-400" />
                <select 
                  value={selectedPocFilter}
                  onChange={(e) => setSelectedPocFilter(e.target.value)}
                  className="bg-transparent text-xs font-bold text-white outline-none cursor-pointer min-w-[80px]"
                >
                  <option value="All">All SPOCs</option>
                  {pocs.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                </select>
              </div>
              
              {isAddingPoc ? (
                <div className="flex items-center px-2 animate-in slide-in-from-left-2 duration-200">
                  <input 
                    type="text" 
                    value={newPocName}
                    onChange={(e) => setNewPocName(e.target.value)}
                    placeholder="Name"
                    className="w-20 bg-slate-900 border border-slate-600 rounded px-1 text-xs text-white focus:outline-none focus:border-brand-500 mr-1"
                    autoFocus
                  />
                  <button onClick={handleAddPoc} className="text-green-500 hover:text-green-400"><Check className="w-4 h-4" /></button>
                  <button onClick={() => setIsAddingPoc(false)} className="text-red-500 hover:text-red-400"><X className="w-4 h-4" /></button>
                </div>
              ) : (
                <button 
                  onClick={() => setIsAddingPoc(true)}
                  className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-brand-400 transition-colors"
                  title="Add New SPOC"
                >
                  <UserPlus className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="h-6 w-px bg-slate-800 mx-2"></div>

            {/* View Toggles */}
            <div className="flex bg-slate-800 rounded-lg p-1 border border-slate-700">
              <button
                onClick={() => setIsVisualMode(false)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${!isVisualMode ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-white'}`}
              >
                <Table className="w-3.5 h-3.5" /> Report
              </button>
              <button
                onClick={() => setIsVisualMode(true)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${isVisualMode ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-white'}`}
              >
                <PieChart className="w-3.5 h-3.5" /> Analytics
              </button>
            </div>

            <div className="flex bg-slate-800 rounded-lg p-1 border border-slate-700">
              <button
                onClick={() => setViewMode(ViewMode.BRAND)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${viewMode === ViewMode.BRAND ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-white'}`}
              >
                <Briefcase className="w-3.5 h-3.5" /> Brand
              </button>
              <button
                onClick={() => setViewMode(ViewMode.AGENCY)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${viewMode === ViewMode.AGENCY ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-white'}`}
              >
                <UserCircle className="w-3.5 h-3.5" /> Agency
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* --- MAIN CONTENT --- */}
      <main className="max-w-[1600px] mx-auto px-4 py-8">
        {selectedProjectId ? (
          <ProjectDetail 
            project={activeProject!} 
            metrics={getProjectMetrics(activeProject!.id)}
            viewMode={viewMode}
            onBack={() => setSelectedProjectId(null)}
            onUpdatePlan={updateProjectPlan}
            onUpdateWeek={updateProjectWeek}
            onUpdateActual={updateProjectActual}
            onUpdateChannel={updateMediaChannel}
            onAddChannel={addMediaChannel}
            onDeleteChannel={(cid) => deleteMediaChannel(activeProject!.id, cid)}
            onUpdateManualBudget={(val) => updateProjectManualBudget(activeProject!.id, val)}
            onToggleLock={toggleProjectLock}
          />
        ) : (
          <>
            <div className="flex justify-between items-end mb-6">
              <div>
                <h2 className="text-3xl font-black text-white tracking-tight">Project Portfolio</h2>
                <p className="text-slate-400 mt-1 font-medium flex items-center gap-2">
                   <Calendar className="w-4 h-4" /> 
                   Reporting Period: <span className="text-white">{reportStartDate}</span> to <span className="text-white">{reportEndDate}</span>
                </p>
              </div>
              <button 
                onClick={() => setIsProjectModalOpen(true)}
                className="flex items-center gap-2 bg-brand-600 hover:bg-brand-500 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-brand-500/20 transition-all transform hover:scale-105"
              >
                <Plus className="w-5 h-5" /> New Project
              </button>
            </div>

            {isVisualMode ? (
              <VisualDashboard projects={filteredProjects} viewMode={viewMode} />
            ) : (
              <DashboardOverview 
                projects={filteredProjects} 
                viewMode={viewMode} 
                onSelectProject={setSelectedProjectId}
                onUpdateProjectField={updateProjectField}
                startWeekIndex={Math.max(0, startWeekIndex)}
                endWeekIndex={endWeekIndex === -1 ? 0 : endWeekIndex}
                pocs={pocs}
                onUpdateProjectPoc={updateProjectPoc}
                onDeleteProject={handleDeleteProject}
              />
            )}
          </>
        )}
      </main>

      {/* --- MODALS --- */}
      
      {/* New Project Modal */}
      {isProjectModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
             <div className="p-6 border-b border-slate-800 flex justify-between items-center">
               <h3 className="text-xl font-bold text-white">Create New Project</h3>
               <button onClick={() => setIsProjectModalOpen(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5"/></button>
             </div>
             <div className="p-6 space-y-4">
                <div>
                   <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Project Name</label>
                   <input 
                    type="text" 
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-brand-500 outline-none"
                    placeholder="e.g. Godrej Park World"
                    autoFocus
                   />
                </div>
                <div>
                   <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Assign SPOC</label>
                   <select 
                    value={newProjectPoc}
                    onChange={(e) => setNewProjectPoc(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-brand-500 outline-none cursor-pointer"
                   >
                     {pocs.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                   </select>
                </div>
             </div>
             <div className="p-6 border-t border-slate-800 flex justify-end gap-3 bg-slate-900">
               <button onClick={() => setIsProjectModalOpen(false)} className="px-4 py-2 text-sm font-bold text-slate-400 hover:text-white">Cancel</button>
               <button 
                 onClick={handleAddProject}
                 className="px-6 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-sm font-bold shadow-lg"
               >
                 Create Project
               </button>
             </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default App;
