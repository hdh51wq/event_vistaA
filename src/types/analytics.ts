export interface MonthlyData {
  month: string;
  amount: number;
}

export interface EventTypeData {
  type: string;
  amount: number;
  percentage: number;
}

export interface YearComparisonData {
  month: string;
  current: number;
  previous: number;
}

export interface RevenueData {
  total: number;
  monthly: MonthlyData[];
  byEventType: EventTypeData[];
  byMonth: YearComparisonData[];
  comparison: { value: number; percentage: number };
}

export interface StatusData {
  status: string;
  count: number;
}

export interface TypeData {
  type: string;
  count: number;
}

export interface ProjectAnalytics {
  total: number;
  byStatus: StatusData[];
  byType: TypeData[];
  completed: number;
  inProgress: number;
  averageDuration: number;
  conversionRate: number;
}

export interface TopClient {
  name: string;
  projects: number;
  revenue: number;
  averageProjectValue: number;
  lastProject: string;
}

export interface IndustryData {
  industry: string;
  percentage: number;
}

export interface ClientAnalytics {
  total: number;
  new: number;
  returning: number;
  topClients: TopClient[];
  byIndustry: IndustryData[];
}

export interface CategoryData {
  category: string;
  amount: number;
  percentage: number;
}

export interface BudgetAnalytics {
  average: number;
  byCategory: CategoryData[];
  actualVsBudget: number;
}

export interface MonthlySeasonalData {
  month: string;
  projects: number;
  revenue: number;
}

export interface SeasonalData {
  peakMonth: string;
  lowMonth: string;
  growthRate: number;
  seasonalData: MonthlySeasonalData[];
}

export interface AnalyticsData {
  revenue: RevenueData;
  projects: ProjectAnalytics;
  clients: ClientAnalytics;
  budget: BudgetAnalytics;
  trends: SeasonalData;
}

export type DateRange = "this_month" | "this_quarter" | "this_year" | "last_30" | "last_90" | "last_year" | "custom";

export interface AnalyticsFilters {
  dateRange: DateRange;
  startDate?: string;
  endDate?: string;
  eventType: string;
  client: string;
}
