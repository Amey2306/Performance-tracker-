
export interface PlanningData {
  overallBV: number; // Crores
  ats: number; // Crores
  digitalContributionPercent: number;
  presalesContributionPercent: number;
  ltwPercent: number; // Lead to Walkin
  wtbPercent: number; // Walkin to Booking
  cpl: number; // Cost per Lead (INR)
  taxPercent: number;
  receivedBudget: number; // Now mandatory
}

export interface CalculatedMetrics {
  totalUnits: number;
  digitalUnits: number;
  presalesUnits: number;
  digitalBV: number;
  presalesBV: number;
  targetWalkins: number;
  targetLeads: number;
  baseBudget: number;
  taxAmount: number;
  allInBudget: number;
  cpw: number;
  cpb: number;
  revenue: number; // INR
  targetCOM: number;
}

export interface WeeklyData {
  id: number;
  weekLabel: string;
  dateRange: string;
  // Simulation Inputs (Percentages)
  spendDistribution: number;
  leadDistribution: number;
  adConversion: number; // Planned L2W %
  
  // Calculated Planned Values
  leads: number;
  cumulativeLeads: number;
  ap: number;
  cumulativeAp: number;
  ad: number;
  cumulativeAd: number;
  spendsBase: number;
  spendsAllIn: number;
}

// New Interface for Actual Performance Data
export interface WeeklyActuals {
  weekId: number;
  leads?: number;
  ap?: number;
  ad?: number;
  spends?: number; // Actual Base Spend
  bookings?: number; // Digital Bookings
  presalesBookings?: number; // New: Presales/Offline Bookings
}

export interface MediaChannel {
  id: string;
  name: string;
  allocationPercent: number;
  estimatedCpl: number;
  budget?: number; 
  leads?: number;
  // Advanced Funnel Metrics
  capiPercent: number; // Qualified Leads %
  capiToApPercent: number; // Conversion to Site Visit Proposed
  apToAdPercent: number; // Conversion to Walkin
  isCustom?: boolean;
}

export interface Poc {
  id: string;
  name: string;
}

export interface Project {
  id: string;
  name: string;
  location: string;
  poc: string;
  status: 'Planning' | 'Active' | 'Completed';
  plan: PlanningData;
  otherSpends: number; // New: Non-performance marketing spends
  manualMediaBudget?: number; // Override for simulation
  mediaPlan: MediaChannel[]; 
  weeks: WeeklyData[];
  actuals: Record<number, WeeklyActuals>; 
  isLocked: boolean; 
}

export enum ViewMode {
  BRAND = 'BRAND', // Shows Base Spends
  AGENCY = 'AGENCY' // Shows All-in Spends
}

export enum TabView {
  PLANNING = 'PLANNING',
  MEDIA_MIX = 'MEDIA_MIX',
  WOW_PLAN = 'WOW_PLAN',
  PERFORMANCE = 'PERFORMANCE'
}
