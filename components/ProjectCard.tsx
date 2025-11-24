
import React, { useState } from 'react';
import { Project, CalculatedMetrics } from '../types';
import { Building2, MapPin, ArrowRight, Trash2, Edit2, MoreVertical, Save, X, BarChart3 } from 'lucide-react';

interface Props {
  project: Project;
  metrics: CalculatedMetrics;
  onSelect: (id: string) => void;
  onRename: (id: string, newName: string) => void;
  onDelete: (id: string) => void;
}

export const ProjectCard: React.FC<Props> = ({ project, metrics, onSelect, onRename, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(project.name);
  const [showMenu, setShowMenu] = useState(false);

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (editName.trim()) {
      onRename(project.id, editName);
      setIsEditing(false);
    }
  };

  const handleCancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditName(project.name);
    setIsEditing(false);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if(window.confirm(`Are you sure you want to delete ${project.name}?`)) {
      onDelete(project.id);
    }
  };

  // Calculate quick stats for the card
  const totalSpend = project.weeks.reduce((acc, w) => acc + (project.actuals[w.id]?.spends || 0), 0);
  // Assuming base budget for comparison to keep it simple on card
  const spendProgress = Math.min((totalSpend / metrics.baseBudget) * 100, 100);

  return (
    <div 
      onClick={() => !isEditing && onSelect(project.id)}
      className="bg-slate-900 rounded-2xl shadow-xl border border-slate-800 p-0 cursor-pointer hover:border-brand-500/50 hover:shadow-brand-500/10 transition-all duration-300 group relative overflow-hidden"
    >
      {/* Top Banner Status */}
      <div className={`h-1.5 w-full ${project.status === 'Active' ? 'bg-green-500' : 'bg-yellow-500'}`}></div>

      <div className="p-6">
        {/* Header Section */}
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-start gap-4 w-full">
            <div className="p-3 bg-slate-800 rounded-xl border border-slate-700 group-hover:bg-slate-800 group-hover:border-brand-500/30 transition-colors">
              <Building2 className="w-6 h-6 text-slate-400 group-hover:text-brand-400 transition-colors" />
            </div>
            <div className="w-full pr-8">
              {isEditing ? (
                <div className="flex gap-2">
                   <input 
                    type="text" 
                    value={editName} 
                    onChange={(e) => setEditName(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full bg-slate-800 border border-brand-500 rounded px-2 py-1 text-lg font-bold text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                    autoFocus
                  />
                  <button onClick={handleSave} className="p-1 bg-green-900/40 text-green-400 rounded hover:bg-green-900/60"><Save className="w-4 h-4"/></button>
                  <button onClick={handleCancel} className="p-1 bg-slate-700 text-slate-300 rounded hover:bg-slate-600"><X className="w-4 h-4"/></button>
                </div>
              ) : (
                <>
                  <h3 className="font-bold text-xl text-white leading-tight">{project.name}</h3>
                  <div className="flex items-center text-xs text-slate-400 gap-1 mt-1 font-medium">
                    <MapPin className="w-3 h-3" />
                    {project.location}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Context Menu */}
          {!isEditing && (
            <div className="absolute top-6 right-4 z-20" onClick={(e) => e.stopPropagation()}>
               <button 
                 onClick={() => setShowMenu(!showMenu)} 
                 className="p-1.5 text-slate-500 hover:text-slate-300 rounded-full hover:bg-slate-800 transition-colors"
               >
                 <MoreVertical className="w-4 h-4" />
               </button>
               {showMenu && (
                 <div className="absolute right-0 mt-1 w-32 bg-slate-800 border border-slate-700 shadow-xl rounded-lg py-1 text-sm z-30 animate-in fade-in zoom-in-95 duration-200">
                   <button 
                     onClick={() => { setIsEditing(true); setShowMenu(false); }}
                     className="flex items-center gap-2 w-full px-4 py-2 text-left hover:bg-slate-700 text-slate-300 font-medium"
                   >
                     <Edit2 className="w-3.5 h-3.5" /> Rename
                   </button>
                   <button 
                     onClick={(e) => { handleDelete(e); setShowMenu(false); }}
                     className="flex items-center gap-2 w-full px-4 py-2 text-left hover:bg-red-900/20 text-red-400 font-medium"
                   >
                     <Trash2 className="w-3.5 h-3.5" /> Delete
                   </button>
                 </div>
               )}
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-4 mb-6">
          <div>
            <span className="block text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">Target Revenue</span>
            <span className="font-bold text-white text-lg">₹{project.plan.overallBV} Cr</span>
          </div>
          <div>
            <span className="block text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">Target Leads</span>
            <span className="font-bold text-white text-lg">{Math.ceil(metrics.targetLeads).toLocaleString()}</span>
          </div>
        </div>
        
        {/* Budget Progress */}
        <div className="mb-2">
           <div className="flex justify-between items-end mb-1">
             <span className="text-xs font-medium text-slate-500">Budget Utilized</span>
             <span className="text-xs font-bold text-white">{spendProgress.toFixed(1)}%</span>
           </div>
           <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
             <div 
               className={`h-full rounded-full ${spendProgress > 90 ? 'bg-red-500' : 'bg-brand-500'}`} 
               style={{ width: `${spendProgress}%` }}
             ></div>
           </div>
        </div>

      </div>

      {/* Footer */}
      <div className="bg-slate-950/50 px-6 py-3 border-t border-slate-800 flex justify-between items-center text-xs font-medium">
         <span className={`flex items-center gap-1.5 ${project.status === 'Active' ? 'text-green-400' : 'text-yellow-400'}`}>
           <span className={`w-1.5 h-1.5 rounded-full ${project.status === 'Active' ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
           {project.status}
         </span>
         
         <div className="flex items-center gap-1 text-brand-400 font-bold opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-2 group-hover:translate-x-0 duration-300">
            Open Dashboard <ArrowRight className="w-3.5 h-3.5" />
         </div>
      </div>
    </div>
  );
};
