export type DatasetType = 'sales' | 'expenses' | 'inventory' | 'customers';

export type Language = 'en' | 'fr' | 'ar';

export interface CompanySettings {
  name: string;
  logoUrl?: string;
  currency: string;
  currencySymbol: string;
  taxRate: number;
}

export interface RawDataset {
  id: string;
  name: string;
  type: DatasetType;
  fileName: string;
  fileSize: number;
  uploadedAt: string;
  headers: string[];
  rows: Record<string, any>[];
  mapping: Record<string, string>; // standardField -> originalColumn
}

export type StandardField =
  | 'date'
  | 'product'
  | 'category'
  | 'quantity'
  | 'unit_price'
  | 'unit_cost'
  | 'total_amount'
  | 'customer'
  | 'region'
  | 'order_id'
  | 'expense_category'
  | 'expense_description'
  | 'stock_quantity'
  | 'min_stock'
  | 'supplier';

export interface ColumnDefinition {
  field: StandardField;
  label: Record<Language, string>;
  required: boolean;
  types: DatasetType[];
  description: string;
}

export interface CleaningOptions {
  removeDuplicates: boolean;
  trimWhitespace: boolean;
  standardizeDates: boolean;
  sanitizeNumbers: boolean;
  normalizeTextCase: boolean;
  missingValueAction: 'drop' | 'fill_median' | 'fill_zero';
  flagInvalidRows: boolean;
  maxFutureDays: number;
}

export interface CleaningReport {
  datasetId: string;
  datasetName: string;
  totalRowsOriginal: number;
  totalRowsCleaned: number;
  duplicatesRemoved: number;
  valuesFixed: number;
  missingValuesHandled: number;
  rowsRejected: number;
  rejectedReasons: { rowIndex: number; reason: string; rowData: Record<string, any> }[];
  cleanedAt: string;
}

export interface CleanedSalesRecord {
  orderId: string;
  date: string; // ISO YYYY-MM-DD
  product: string;
  category: string;
  quantity: number;
  unitPrice: number;
  unitCost: number;
  revenue: number;
  cost: number;
  profit: number;
  customer: string;
  region: string;
}

export interface CleanedExpenseRecord {
  id: string;
  date: string; // ISO YYYY-MM-DD
  category: string;
  description: string;
  amount: number;
}

export interface CleanedInventoryRecord {
  id: string;
  product: string;
  category: string;
  stockQuantity: number;
  minStock: number;
  unitCost: number;
  stockValue: number;
  dailyVelocity?: number;
  daysRemaining?: number;
}

export interface CleanedCustomerRecord {
  id: string;
  name: string;
  region: string;
  type: string;
}

export interface CleanedDataState {
  sales: CleanedSalesRecord[];
  expenses: CleanedExpenseRecord[];
  inventory: CleanedInventoryRecord[];
  customers: CleanedCustomerRecord[];
  reports: Record<string, CleaningReport>;
}

export interface SparklinePoint {
  date: string;
  value: number;
}

export interface KPICardData {
  id: string;
  title: string;
  value: number;
  formattedValue: string;
  previousValue: number;
  changePct: number;
  trend: 'up' | 'down' | 'neutral';
  isPositive: boolean; // whether positive change is good (e.g. expenses up is bad)
  sparkline: SparklinePoint[];
  category: 'financial' | 'operations' | 'inventory' | 'customers';
}

export interface PeriodSummary {
  period: string; // e.g. "2024-01" or "2024-W12"
  revenue: number;
  cost: number;
  profit: number;
  expenses: number;
  netProfit: number;
  orders: number;
}

export interface ProductPerformance {
  product: string;
  category: string;
  revenue: number;
  quantity: number;
  profit: number;
  marginPct: number;
}

export interface RegionPerformance {
  region: string;
  revenue: number;
  orders: number;
  sharePct: number;
}

export interface CustomerPerformance {
  customer: string;
  revenue: number;
  orders: number;
  firstOrderDate: string;
  lastOrderDate: string;
  isNew: boolean;
}

export interface ComputedKPIs {
  totalRevenue: number;
  grossProfit: number;
  grossMarginPct: number;
  totalExpenses: number;
  netProfit: number;
  netMarginPct: number;
  aov: number;
  orderCount: number;
  activeCustomerCount: number;
  newCustomersCount: number;
  returningCustomersCount: number;
  momGrowthPct: number;
  yoyGrowthPct: number;
  revenueByMonth: PeriodSummary[];
  revenueByRegion: RegionPerformance[];
  topProductsByRevenue: ProductPerformance[];
  bottomProductsByRevenue: ProductPerformance[];
  topProductsByQuantity: ProductPerformance[];
  topCustomers: CustomerPerformance[];
  expenseByCategory: { category: string; amount: number; sharePct: number }[];
  inventorySummary: {
    totalStockUnits: number;
    totalStockValue: number;
    stockTurnover: number;
    lowStockCount: number;
    overstockCount: number;
    items: CleanedInventoryRecord[];
  } | null;
  kpiCards: KPICardData[];
}

export type AnomalySeverity = 'info' | 'warning' | 'critical';
export type AnomalyType = 'spike' | 'drop' | 'unusual_expense' | 'stockout_risk' | 'overstock_risk' | 'margin_compression';

export interface AnomalyItem {
  id: string;
  type: AnomalyType;
  severity: AnomalySeverity;
  title: string;
  description: string;
  date?: string;
  affectedItem: string;
  metric: string;
  baselineValue: number;
  actualValue: number;
  zScore?: number;
  recommendation?: string;
}

export interface ForecastItem {
  period: string;
  projectedRevenue: number;
  lowerBound: number;
  upperBound: number;
  method: 'moving_average' | 'linear_regression';
  isEstimate: true;
}

export interface TrendAnalysis {
  slope: number;
  direction: 'rising' | 'falling' | 'flat';
  growthRatePct: number;
  forecasts: ForecastItem[];
}

export interface AIInsightsResponse {
  executiveSummary: string;
  keyFindings: string[];
  criticalRisks: string[];
  actionableRecommendations: string[];
  generatedAt: string;
  language: Language;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  timestamp: string;
  toolCall?: {
    name: string;
    args: Record<string, any>;
    result: any;
    explanation?: string;
  };
}

export interface FilterState {
  dateRange: { start: string; end: string } | null;
  selectedRegion: string;
  selectedCategory: string;
}

export interface ScheduledReport {
  id: string;
  title: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  format: 'pdf' | 'excel';
  nextRunDate: string;
  recipients: string[];
  active: boolean;
  lastGenerated?: string;
}
