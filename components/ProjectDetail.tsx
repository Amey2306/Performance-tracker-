
import React, { useState } from 'react';
import { Project, TabView, CalculatedMetrics, PlanningData, WeeklyData, WeeklyActuals, ViewMode, MediaChannel, ChannelPerformance } from '../types';
import { PlanningSection } from './PlanningSection';
import { WowTable } from './WowTable';
import { PerformanceTracker } from './PerformanceTracker';
import { MediaMixSimulator } from './MediaMixSimulator';
import { ChannelPerformanceTracker } from './ChannelPerformanceTracker';
import { Target, LayoutList, TrendingUp, Lock, Unlock, ArrowLeft, PieChart, BarChart2, Download } from 'lucide-react';
import { exportBusinessPlan, exportMediaMix, exportWoWPlan, exportPerformance, exportChannelTracker } from '../utils/exportUtils';

interface Props {
  project: Project;
  metrics: CalculatedMetrics;
  viewMode: ViewMode;
  onBack: () => void;
  onUpdatePlan: (id: string, key: keyof PlanningData, value: number) => void;
  onUpdateWeek: (projectId: string, weekId: number, field: keyof WeeklyData, value: number) => void;
  onUpdateActual: (projectId: string, weekId: number, field: keyof WeeklyActuals, value: number) => void;
  onUpdateChannel: (projectId: string, channelId: string, field: keyof MediaChannel, value: number | string) => void;
  onAddChannel: (projectId: string, presetName?: string) => void;
  onDeleteChannel: (projectId: string, channelId: string) => void;
  onUpdateManualBudget: (projectId: string, value: number) => void;
  onToggleLock: (id: string) => void;
  onUpdateChannelPerformance: (projectId: string, channelId: string, field: keyof ChannelPerformance, value: number) => void;
}

export const ProjectDetail: React.FC<Props> = ({ 
  project, metrics, viewMode, onBack, onUpdatePlan, onUpdateWeek, onUpdateActual, 
  onUpdateChannel, onAddChannel, onDeleteChannel, onUpdateManualBudget, onToggleLock, onUpdateChannelPerformance 
}) => {
  const [activeTab, setActiveTab] = useState<TabView>(TabView.PLANNING);

  const handleDownload = () => {
    switch(activeTab) {
        case TabView.PLANNING:
            exportBusinessPlan(project, metrics);
            break;
        case TabView.MEDIA_MIX:
            exportMediaMix(project);
            break;
        case TabView.WOW_PLAN:
            exportWoWPlan(project, viewMode);
            break;
        case TabView.PERFORMANCE:
            exportPerformance(project, viewMode);
            break;
        case TabView.CHANNEL_TRACKER:
            exportChannelTracker(project, viewMode);
            break;
    }
  };

  return (
    <div className="space-y-6">
      {/* Project Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="flex items-center gap-2">
          <button onClick={onBack} className="p-2 hover:bg-slate-800 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-400 hover:text-white" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-white">{project.name}</h2>
            <p className="text-sm text-slate-400">{project.location} • {project.status}</p>
          </div>
        </div>

        <div className="w-full lg:w-auto overflow-x-auto pb-1 custom-scrollbar">
          <div className="flex items-center gap-2 bg-slate-900 p-1.5 rounded-xl border border-slate-800 shadow-sm min-w-max">
            <button
              onClick={() => setActiveTab(TabView.PLANNING)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === TabView.PLANNING ? 'bg-slate-800 text-white shadow ring-1 ring-slate-700' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
              <Target className="w-4 h-4" />
              Business Plan
            </button>
            <button
              onClick={() => setActiveTab(TabView.MEDIA_MIX)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === TabView.MEDIA_MIX ? 'bg-slate-800 text-white shadow ring-1 ring-slate-700' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
              <PieChart className="w-4 h-4" />
              Media Mix
            </button>
            <button
              onClick={() => setActiveTab(TabView.WOW_PLAN)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === TabView.WOW_PLAN ? 'bg-slate-800 text-white shadow ring-1 ring-slate-700' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
              <LayoutList className="w-4 h-4" />
              WoW Plan
            </button>
            <button
              onClick={() => setActiveTab(TabView.PERFORMANCE)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === TabView.PERFORMANCE ? 'bg-slate-800 text-white shadow ring-1 ring-slate-700' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
              <TrendingUp className="w-4 h-4" />
              Performance
            </button>
            <button
              onClick={() => setActiveTab(TabView.CHANNEL_TRACKER)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === TabView.CHANNEL_TRACKER ? 'bg-slate-800 text-white shadow ring-1 ring-slate-700' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
              <BarChart2 className="w-4 h-4" />
              Channel Tracker
            </button>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="transition-all duration-300">
        
        <div className="flex justify-end mb-2 gap-2">
            <button 
                onClick={handleDownload}
                className="flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded border border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors shadow-sm"
            >
                <Download className="w-3.5 h-3.5" /> Download Excel
            </button>

            {/* Lock Button logic specific to Planning/WoW tabs */}
            {(activeTab === TabView.PLANNING || activeTab === TabView.WOW_PLAN) && (
              <button 
                onClick={() => onToggleLock(project.id)}
                className={`flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded border shadow-sm transition-colors ${project.isLocked ? 'bg-amber-950/40 border-amber-900 text-amber-400 hover:bg-amber-900/60' : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'}`}
              >
                {project.isLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                {project.isLocked ? 'Plan Locked' : 'Lock Plan'}
              </button>
            )}
        </div>

        {activeTab === TabView.PLANNING && (
          <PlanningSection 
            data={project.plan} 
            metrics={metrics} 
            onChange={(k, v) => onUpdatePlan(project.id, k, v)} 
            viewMode={viewMode}
            readOnly={project.isLocked}
          />
        )}

        {activeTab === TabView.MEDIA_MIX && (
          <MediaMixSimulator 
            channels={project.mediaPlan}
            metrics={metrics}
            viewMode={viewMode}
            manualBudget={project.manualMediaBudget}
            onUpdateChannel={(cid, f, v) => onUpdateChannel(project.id, cid, f, v)}
            onUpdateManualBudget={(val) => onUpdateManualBudget(project.id, val)}
            onAddChannel={(preset) => onAddChannel(project.id, preset)}
            onDeleteChannel={(cid) => onDeleteChannel(project.id, cid)}
          />
        )}

        {activeTab === TabView.WOW_PLAN && (
          <WowTable 
            weeks={project.weeks} 
            metrics={metrics} 
            onUpdateWeek={(wid, k, v) => onUpdateWeek(project.id, wid, k, v)} 
            viewMode={viewMode}
            readOnly={project.isLocked}
          />
        )}

        {activeTab === TabView.PERFORMANCE && (
          <PerformanceTracker 
            weeks={project.weeks}
            actuals={project.actuals}
            plan={project.plan}
            onUpdateActual={(wid, k, v) => onUpdateActual(project.id, wid, k, v)}
            viewMode={viewMode}
          />
        )}

        {activeTab === TabView.CHANNEL_TRACKER && (
          <ChannelPerformanceTracker
            channels={project.mediaPlan}
            performance={project.channelPerformance || []}
            viewMode={viewMode}
            taxPercent={project.plan.taxPercent}
            onUpdate={(cid, f, v) => onUpdateChannelPerformance(project.id, cid, f, v)}
          />
        )}
      </div>
    </div>
  );
};
