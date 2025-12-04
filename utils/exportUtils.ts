
import * as XLSX from 'xlsx';
import { Project, ViewMode, WeeklyData, WeeklyActuals, MediaChannel, ChannelPerformance, CalculatedMetrics, PlanningData } from '../types';

const saveFile = (wb: XLSX.WorkBook, filename: string) => {
  XLSX.writeFile(wb, `${filename}_${new Date().toISOString().slice(0, 10)}.xlsx`);
};

export const exportMasterReport = (projects: Project[], viewMode: ViewMode) => {
  const data = projects.map(p => {
    const taxMult = viewMode === ViewMode.AGENCY ? (1 + p.plan.taxPercent/100) : 1;
    
    // Aggregations
    const planAllIn = p.weeks.reduce((sum, w) => sum + w.spendsAllIn, 0);
    const perfSpendsRaw = p.weeks.reduce((sum, w) => sum + (p.actuals[w.id]?.spends || 0), 0);
    const totalSpends = (perfSpendsRaw * taxMult) + p.otherSpends;
    
    const tgtLeads = p.weeks.reduce((s, w) => s + w.leads, 0);
    const achLeads = p.weeks.reduce((s, w) => s + (p.actuals[w.id]?.leads || 0), 0);
    
    const tgtAD = p.weeks.reduce((s, w) => s + w.ad, 0);
    const achAD = p.weeks.reduce((s, w) => s + (p.actuals[w.id]?.ad || 0), 0);
    
    const achDigBookings = p.weeks.reduce((s, w) => s + (p.actuals[w.id]?.bookings || 0), 0);
    const achPresalesBookings = p.weeks.reduce((s, w) => s + (p.actuals[w.id]?.presalesBookings || 0), 0);

    return {
      "Project Name": p.name,
      "SPOC": p.poc,
      "Planned Budget (All-in)": planAllIn,
      "Received Budget": p.plan.receivedBudget,
      "Performance Spends": perfSpendsRaw * taxMult,
      "Other Spends": p.otherSpends,
      "Total Consumed": totalSpends,
      "Pending Budget": p.plan.receivedBudget - totalSpends,
      "Target Leads": Math.round(tgtLeads),
      "Achieved Leads": achLeads,
      "Leads Delivery %": tgtLeads > 0 ? (achLeads/tgtLeads) : 0,
      "Target AD": Math.round(tgtAD),
      "Achieved AD": achAD,
      "AD Delivery %": tgtAD > 0 ? (achAD/tgtAD) : 0,
      "Target CPL": p.plan.cpl,
      "Achieved CPL": achLeads > 0 ? (perfSpendsRaw * taxMult) / achLeads : 0,
      "Achieved CPW": achAD > 0 ? (perfSpendsRaw * taxMult) / achAD : 0,
      "Digital Bookings": achDigBookings,
      "Presales Bookings": achPresalesBookings,
      "Total Units": achDigBookings + achPresalesBookings,
      "Digital BV (Cr)": (achDigBookings * p.plan.ats),
      "Presales BV (Cr)": (achPresalesBookings * p.plan.ats)
    };
  });

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Master Report");
  saveFile(wb, "EstateFlow_Master_Report");
};

export const exportBusinessPlan = (project: Project, metrics: CalculatedMetrics) => {
  const planRows = [
    { Metric: "Overall BV Target (Cr)", Value: project.plan.overallBV },
    { Metric: "ATS (Cr)", Value: project.plan.ats },
    { Metric: "Digital Contribution %", Value: project.plan.digitalContributionPercent },
    { Metric: "Presales Contribution %", Value: project.plan.presalesContributionPercent },
    { Metric: "Lead to Walkin (LTW) %", Value: project.plan.ltwPercent },
    { Metric: "Walkin to Booking (WTB) %", Value: project.plan.wtbPercent },
    { Metric: "Planned CPL", Value: project.plan.cpl },
    { Metric: "Tax %", Value: project.plan.taxPercent },
    { Metric: "---", Value: "---" },
    { Metric: "Derived Total Units", Value: metrics.totalUnits },
    { Metric: "Target Leads", Value: metrics.targetLeads },
    { Metric: "Target Walkins", Value: metrics.targetWalkins },
    { Metric: "All-in Budget", Value: metrics.allInBudget },
    { Metric: "Projected Revenue", Value: metrics.revenue }
  ];

  const ws = XLSX.utils.json_to_sheet(planRows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Business Plan");
  saveFile(wb, `${project.name}_Business_Plan`);
};

export const exportMediaMix = (project: Project) => {
  const data = project.mediaPlan.map(ch => {
    // Basic recalculation for export if budget isn't stored explicitly
    // Assuming simulator logic runs in UI, we export the stored config
    return {
      "Channel Name": ch.name,
      "Allocation %": ch.allocationPercent,
      "Est CPL": ch.estimatedCpl,
      "CAPI % (Qual)": ch.capiPercent,
      "CAPI to AP %": ch.capiToApPercent,
      "AP to AD %": ch.apToAdPercent
    };
  });

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Media Mix");
  saveFile(wb, `${project.name}_Media_Mix`);
};

export const exportWoWPlan = (project: Project, viewMode: ViewMode) => {
  const data = project.weeks.map(w => ({
    "Week": w.weekLabel,
    "Dates": w.dateRange,
    "Spend Dist %": w.spendDistribution,
    "Lead Dist %": w.leadDistribution,
    "AD Conv %": w.adConversion,
    "Target Leads": Math.round(w.leads),
    "Target AP": Math.round(w.ap),
    "Target AD": Math.round(w.ad),
    "Target Spends": viewMode === ViewMode.AGENCY ? w.spendsAllIn : w.spendsBase
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "WoW Plan");
  saveFile(wb, `${project.name}_WoW_Plan`);
};

export const exportPerformance = (project: Project, viewMode: ViewMode) => {
  const taxMult = viewMode === ViewMode.AGENCY ? (1 + project.plan.taxPercent/100) : 1;

  const data = project.weeks.map(w => {
    const act: WeeklyActuals = project.actuals[w.id] || { weekId: w.id };
    const actSpends = (act.spends || 0) * taxMult;
    const tgtSpends = viewMode === ViewMode.AGENCY ? w.spendsAllIn : w.spendsBase;

    return {
      "Week": w.weekLabel,
      "Dates": w.dateRange,
      "Target Leads": Math.round(w.leads),
      "Actual Leads": act.leads || 0,
      "Target AP": Math.round(w.ap),
      "Actual AP": act.ap || 0,
      "Target AD": Math.round(w.ad),
      "Actual AD": act.ad || 0,
      "Target Spends": tgtSpends,
      "Actual Spends": actSpends,
      "Actual Dig Bookings": act.bookings || 0,
      "Actual Presales": act.presalesBookings || 0,
      "Act CPL": (act.leads || 0) > 0 ? actSpends / (act.leads || 1) : 0,
      "Act CPW": (act.ad || 0) > 0 ? actSpends / (act.ad || 1) : 0
    };
  });

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Performance");
  saveFile(wb, `${project.name}_Performance`);
};

export const exportChannelTracker = (project: Project, viewMode: ViewMode) => {
  const taxMult = viewMode === ViewMode.AGENCY ? (1 + project.plan.taxPercent/100) : 1;

  const data = project.mediaPlan.map(ch => {
    const p = project.channelPerformance?.find(cp => cp.channelId === ch.id) || {
      channelId: ch.id, spends: 0, leads: 0, openAttempted: 0, contacted: 0, assignedToSales: 0, ap: 0, ad: 0, bookings: 0, lost: 0
    };
    
    const displaySpends = p.spends * taxMult;

    return {
      "Channel": ch.name,
      "Spends": displaySpends,
      "Leads": p.leads,
      "CPL": p.leads > 0 ? displaySpends/p.leads : 0,
      "Open/Attempted": p.openAttempted,
      "Contacted": p.contacted,
      "Assigned (CAPI)": p.assignedToSales,
      "AP": p.ap,
      "AD": p.ad,
      "Bookings": p.bookings,
      "Lost": p.lost,
      "CP-CAPI": p.assignedToSales > 0 ? displaySpends/p.assignedToSales : 0,
      "CP-AP": p.ap > 0 ? displaySpends/p.ap : 0,
      "CP-AD": p.ad > 0 ? displaySpends/p.ad : 0
    };
  });

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Channel Tracker");
  saveFile(wb, `${project.name}_Channel_Tracker`);
};

export const exportAnalytics = (projects: Project[], viewMode: ViewMode, selectedProjectId: string) => {
  // Filter logic duplicated from VisualDashboard for export consistency
  const eligibleProjects = projects.filter(p => p.status !== 'Completed');
  const filteredProjects = selectedProjectId === 'all'
    ? eligibleProjects
    : eligibleProjects.filter(p => p.id === selectedProjectId);

  const weeklyTrendMap = new Map<number, { 
    label: string, 
    plannedSpend: number, 
    actualSpend: number,
    actualLeads: number,
    actualWalkins: number,
    actualBookings: number
  }>();

  filteredProjects.forEach(p => {
    const taxMult = viewMode === ViewMode.AGENCY ? (1 + p.plan.taxPercent/100) : 1;
    
    p.weeks.forEach(w => {
      const wPlanSpend = (viewMode === ViewMode.AGENCY ? w.spendsAllIn : w.spendsBase);
      const act = p.actuals[w.id] || { leads: 0, ad: 0, spends: 0, bookings: 0 };
      const wActSpend = (act.spends || 0) * taxMult;

      if (!weeklyTrendMap.has(w.id)) {
        weeklyTrendMap.set(w.id, { 
            label: w.weekLabel, 
            plannedSpend: 0, 
            actualSpend: 0, 
            actualLeads: 0, 
            actualWalkins: 0, 
            actualBookings: 0 
        });
      }
      const trend = weeklyTrendMap.get(w.id)!;
      trend.plannedSpend += wPlanSpend;
      trend.actualSpend += wActSpend;
      trend.actualLeads += (act.leads || 0);
      trend.actualWalkins += (act.ad || 0);
      trend.actualBookings += (act.bookings || 0);
    });
  });

  const data = Array.from(weeklyTrendMap.entries())
    .sort((a, b) => a[0] - b[0])
    .filter(t => t[1].plannedSpend > 0 || t[1].actualSpend > 0)
    .map(t => ({
       "Week": t[1].label,
       "Planned Spend": t[1].plannedSpend,
       "Actual Spend": t[1].actualSpend,
       "Actual Leads": t[1].actualLeads,
       "Actual Walkins": t[1].actualWalkins,
       "Actual Bookings": t[1].actualBookings,
       "Calculated CPL": t[1].actualLeads > 0 ? t[1].actualSpend / t[1].actualLeads : 0
    }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Analytics Data");
  saveFile(wb, `Analytics_Export_${selectedProjectId}`);
};
