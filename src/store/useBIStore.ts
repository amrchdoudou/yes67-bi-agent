import { create } from 'zustand';
import {
  Language,
  RawDataset,
  CleanedDataState,
  CleaningOptions,
  ComputedKPIs,
  AnomalyItem,
  TrendAnalysis,
  FilterState,
  AIInsightsResponse,
  ChatMessage,
  CompanySettings,
  ScheduledReport,
} from '../types';
import { cleanDataset, DEFAULT_CLEANING_OPTIONS } from '../engine/dataCleaner';
import { computeKPIs, filterSales, filterExpenses } from '../engine/kpiEngine';
import { detectAnomalies } from '../engine/anomalyEngine';
import { generateDemoDatasets } from '../engine/demoData';

interface BIState {
  language: Language;
  darkMode: boolean;
  activeTab: 'import' | 'cleaning' | 'dashboard' | 'alerts' | 'insights' | 'chat' | 'reports';
  companySettings: CompanySettings;
  rawDatasets: RawDataset[];
  cleanedData: CleanedDataState;
  cleaningOptions: CleaningOptions;
  filters: FilterState;
  kpis: ComputedKPIs;
  anomalies: AnomalyItem[];
  trendAnalysis: TrendAnalysis | null;
  aiInsights: AIInsightsResponse | null;
  isGeneratingInsights: boolean;
  insightsError: string | null;
  chatMessages: ChatMessage[];
  isChatLoading: boolean;
  chatError: string | null;
  scheduledReports: ScheduledReport[];

  // Actions
  setLanguage: (lang: Language) => void;
  toggleDarkMode: () => void;
  setActiveTab: (tab: BIState['activeTab']) => void;
  updateCompanySettings: (settings: Partial<CompanySettings>) => void;
  addRawDataset: (dataset: RawDataset) => void;
  removeRawDataset: (id: string) => void;
  updateColumnMapping: (datasetId: string, mapping: Record<string, string>) => void;
  updateCleaningOptions: (options: Partial<CleaningOptions>) => void;
  runCleaning: () => void;
  loadDemoData: () => void;
  setFilters: (filters: Partial<FilterState>) => void;
  resetFilters: () => void;
  generateAIInsights: () => Promise<void>;
  sendChatMessage: (text: string) => Promise<void>;
  clearChat: () => void;
  addSchedule: (schedule: Omit<ScheduledReport, 'id'>) => void;
  removeSchedule: (id: string) => void;
  resetAllData: () => void;
}

const initialCompanySettings: CompanySettings = {
  name: 'My Company',
  currency: 'USD',
  currencySymbol: '$',
  taxRate: 0,
};

const initialFilters: FilterState = {
  dateRange: null,
  selectedRegion: 'all',
  selectedCategory: 'all',
};

const initialEmptyKPIs: ComputedKPIs = {
  totalRevenue: 0,
  grossProfit: 0,
  grossMarginPct: 0,
  totalExpenses: 0,
  netProfit: 0,
  netMarginPct: 0,
  aov: 0,
  orderCount: 0,
  activeCustomerCount: 0,
  newCustomersCount: 0,
  returningCustomersCount: 0,
  momGrowthPct: 0,
  yoyGrowthPct: 0,
  revenueByMonth: [],
  revenueByRegion: [],
  topProductsByRevenue: [],
  bottomProductsByRevenue: [],
  topProductsByQuantity: [],
  topCustomers: [],
  expenseByCategory: [],
  inventorySummary: null,
  kpiCards: [],
};

export const useBIStore = create<BIState>((set, get) => ({
  language: 'en',
  darkMode: false,
  activeTab: 'import',
  companySettings: initialCompanySettings,
  rawDatasets: [],
  cleanedData: {
    sales: [],
    expenses: [],
    inventory: [],
    customers: [],
    reports: {},
  },
  cleaningOptions: DEFAULT_CLEANING_OPTIONS,
  filters: initialFilters,
  kpis: initialEmptyKPIs,
  anomalies: [],
  trendAnalysis: null,
  aiInsights: null,
  isGeneratingInsights: false,
  insightsError: null,
  chatMessages: [
    {
      id: 'welcome',
      sender: 'agent',
      text: "Hello! I am your Yes67 BI Agent. All figures are computed deterministically by our TypeScript engine. Upload your SME files in Data Import to get started, or click 'Load Demo SME Data' to test with a realistic sample dataset.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ],
  isChatLoading: false,
  chatError: null,
  scheduledReports: [],

  setLanguage: (lang: Language) => {
    set({ language: lang });
    // Adjust HTML dir attribute for RTL support
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
      document.documentElement.setAttribute('lang', lang);
    }
  },

  toggleDarkMode: () => {
    set(state => {
      const next = !state.darkMode;
      if (typeof document !== 'undefined') {
        if (next) document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
      }
      return { darkMode: next };
    });
  },

  setActiveTab: tab => set({ activeTab: tab }),

  updateCompanySettings: settings =>
    set(state => {
      const updated = { ...state.companySettings, ...settings };
      // Recompute formatted currency cards
      const kpis = computeKPIs(
        state.cleanedData.sales,
        state.cleanedData.expenses,
        state.cleanedData.inventory,
        state.cleanedData.customers,
        updated.currencySymbol
      );
      return { companySettings: updated, kpis };
    }),

  addRawDataset: dataset =>
    set(state => {
      const existing = state.rawDatasets.filter(d => d.id !== dataset.id);
      return { rawDatasets: [...existing, dataset] };
    }),

  removeRawDataset: id =>
    set(state => ({
      rawDatasets: state.rawDatasets.filter(d => d.id !== id),
    })),

  updateColumnMapping: (datasetId, mapping) =>
    set(state => ({
      rawDatasets: state.rawDatasets.map(d => (d.id === datasetId ? { ...d, mapping: { ...d.mapping, ...mapping } } : d)),
    })),

  updateCleaningOptions: opts =>
    set(state => ({
      cleaningOptions: { ...state.cleaningOptions, ...opts },
    })),

  runCleaning: () => {
    const { rawDatasets, cleaningOptions, companySettings, filters } = get();

    const cleanedData: CleanedDataState = {
      sales: [],
      expenses: [],
      inventory: [],
      customers: [],
      reports: {},
    };

    for (const dataset of rawDatasets) {
      const { cleanedRows, report } = cleanDataset(dataset, cleaningOptions);
      cleanedData.reports[dataset.id] = report;

      if (dataset.type === 'sales') {
        cleanedData.sales = [...cleanedData.sales, ...cleanedRows];
      } else if (dataset.type === 'expenses') {
        cleanedData.expenses = [...cleanedData.expenses, ...cleanedRows];
      } else if (dataset.type === 'inventory') {
        cleanedData.inventory = [...cleanedData.inventory, ...cleanedRows];
      } else if (dataset.type === 'customers') {
        cleanedData.customers = [...cleanedData.customers, ...cleanedRows];
      }
    }

    const filteredSales = filterSales(cleanedData.sales, filters);
    const filteredExpenses = filterExpenses(cleanedData.expenses, filters);

    const kpis = computeKPIs(
      filteredSales,
      filteredExpenses,
      cleanedData.inventory,
      cleanedData.customers,
      companySettings.currencySymbol
    );

    const { anomalies, trendAnalysis } = detectAnomalies(kpis, filteredSales, filteredExpenses);

    set({
      cleanedData,
      kpis,
      anomalies,
      trendAnalysis,
      aiInsights: null, // Reset insights on new clean
    });
  },

  loadDemoData: () => {
    const demo = generateDemoDatasets();
    const demoDatasets = [demo.sales, demo.expenses, demo.inventory, demo.customers];

    const cleaningOptions = DEFAULT_CLEANING_OPTIONS;
    const companySettings = {
      name: 'Apex Horizon SME Group',
      currency: 'USD',
      currencySymbol: '$',
      taxRate: 20,
    };

    const cleanedData: CleanedDataState = {
      sales: [],
      expenses: [],
      inventory: [],
      customers: [],
      reports: {},
    };

    for (const dataset of demoDatasets) {
      const { cleanedRows, report } = cleanDataset(dataset, cleaningOptions);
      cleanedData.reports[dataset.id] = report;

      if (dataset.type === 'sales') cleanedData.sales = cleanedRows;
      else if (dataset.type === 'expenses') cleanedData.expenses = cleanedRows;
      else if (dataset.type === 'inventory') cleanedData.inventory = cleanedRows;
      else if (dataset.type === 'customers') cleanedData.customers = cleanedRows;
    }

    const kpis = computeKPIs(
      cleanedData.sales,
      cleanedData.expenses,
      cleanedData.inventory,
      cleanedData.customers,
      companySettings.currencySymbol
    );

    const { anomalies, trendAnalysis } = detectAnomalies(kpis, cleanedData.sales, cleanedData.expenses);

    set({
      rawDatasets: demoDatasets,
      cleanedData,
      companySettings,
      kpis,
      anomalies,
      trendAnalysis,
      filters: initialFilters,
      activeTab: 'dashboard',
      aiInsights: null,
      chatMessages: [
        {
          id: 'welcome',
          sender: 'agent',
          text: `Demo data for "${companySettings.name}" loaded! Total revenue of $${kpis.totalRevenue.toLocaleString()} across ${kpis.orderCount} orders and ${kpis.activeCustomerCount} clients has been deterministically computed. You can explore the Dashboard, check Anomalies, or ask me questions.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ],
    });
  },

  setFilters: newFilters => {
    set(state => {
      const updatedFilters = { ...state.filters, ...newFilters };
      const filteredSales = filterSales(state.cleanedData.sales, updatedFilters);
      const filteredExpenses = filterExpenses(state.cleanedData.expenses, updatedFilters);

      const kpis = computeKPIs(
        filteredSales,
        filteredExpenses,
        state.cleanedData.inventory,
        state.cleanedData.customers,
        state.companySettings.currencySymbol
      );

      const { anomalies, trendAnalysis } = detectAnomalies(kpis, filteredSales, filteredExpenses);

      return {
        filters: updatedFilters,
        kpis,
        anomalies,
        trendAnalysis,
      };
    });
  },

  resetFilters: () => {
    const { cleanedData, companySettings } = get();
    const kpis = computeKPIs(
      cleanedData.sales,
      cleanedData.expenses,
      cleanedData.inventory,
      cleanedData.customers,
      companySettings.currencySymbol
    );
    const { anomalies, trendAnalysis } = detectAnomalies(kpis, cleanedData.sales, cleanedData.expenses);
    set({ filters: initialFilters, kpis, anomalies, trendAnalysis });
  },

  generateAIInsights: async () => {
    const { kpis, anomalies, trendAnalysis, language, companySettings } = get();
    if (kpis.orderCount === 0) return;

    set({ isGeneratingInsights: true, insightsError: null });

    // Send ONLY computed summary JSON (never raw unaggregated rows)
    const payload = {
      companyName: companySettings.name,
      currency: companySettings.currencySymbol,
      language,
      kpiSummary: {
        totalRevenue: kpis.totalRevenue,
        grossProfit: kpis.grossProfit,
        grossMarginPct: kpis.grossMarginPct,
        totalExpenses: kpis.totalExpenses,
        netProfit: kpis.netProfit,
        netMarginPct: kpis.netMarginPct,
        aov: kpis.aov,
        orderCount: kpis.orderCount,
        activeCustomerCount: kpis.activeCustomerCount,
        momGrowthPct: kpis.momGrowthPct,
        topProducts: kpis.topProductsByRevenue.slice(0, 5),
        bottomProducts: kpis.bottomProductsByRevenue.slice(0, 3),
        regionalShare: kpis.revenueByRegion,
        monthlyRevenueTrend: kpis.revenueByMonth.map(m => ({ period: m.period, revenue: m.revenue, profit: m.profit })),
        inventorySummary: kpis.inventorySummary ? {
          totalValue: kpis.inventorySummary.totalStockValue,
          stockTurnover: kpis.inventorySummary.stockTurnover,
          lowStockCount: kpis.inventorySummary.lowStockCount,
          overstockCount: kpis.inventorySummary.overstockCount,
        } : null,
      },
      anomalies: anomalies.slice(0, 6).map(a => ({
        severity: a.severity,
        title: a.title,
        description: a.description,
        metric: a.metric,
        baseline: a.baselineValue,
        actual: a.actualValue,
        zScore: a.zScore,
        recommendation: a.recommendation,
      })),
      trend: trendAnalysis ? {
        direction: trendAnalysis.direction,
        growthRatePct: trendAnalysis.growthRatePct,
        forecasts: trendAnalysis.forecasts,
      } : null,
    };

    try {
      const res = await fetch('/api/ai/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to generate insights (${res.status})`);
      }

      const data: AIInsightsResponse = await res.json();
      set({ aiInsights: data, isGeneratingInsights: false });
    } catch (err: any) {
      set({
        isGeneratingInsights: false,
        insightsError: err.message || 'Failed to communicate with AI insights agent.',
      });
    }
  },

  sendChatMessage: async (userText: string) => {
    if (!userText.trim()) return;

    const { chatMessages, language, companySettings, kpis, anomalies, cleanedData } = get();

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    set({
      chatMessages: [...chatMessages, userMessage],
      isChatLoading: true,
      chatError: null,
    });

    const contextData = {
      companyName: companySettings.name,
      currency: companySettings.currencySymbol,
      kpis,
      anomalies,
      salesCount: cleanedData.sales.length,
      inventoryCount: cleanedData.inventory.length,
    };

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userText,
          language,
          contextData,
          history: chatMessages.slice(-6).map(m => ({
            role: m.sender === 'user' ? 'user' : 'model',
            text: m.text,
          })),
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Agent error (${res.status})`);
      }

      const data = await res.json();
      const agentMessage: ChatMessage = {
        id: `agent-${Date.now()}`,
        sender: 'agent',
        text: data.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        toolCall: data.toolCall,
      };

      set(state => ({
        chatMessages: [...state.chatMessages, agentMessage],
        isChatLoading: false,
      }));
    } catch (err: any) {
      const errorMessage: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'agent',
        text: `Error communicating with AI engine: ${err.message || 'Unknown network error'}. Please verify server connection.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      set(state => ({
        chatMessages: [...state.chatMessages, errorMessage],
        isChatLoading: false,
        chatError: err.message,
      }));
    }
  },

  clearChat: () =>
    set({
      chatMessages: [
        {
          id: 'welcome-reset',
          sender: 'agent',
          text: "Chat history cleared. What questions can I answer about your SME data?",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ],
    }),

  addSchedule: schedule =>
    set(state => ({
      scheduledReports: [...state.scheduledReports, { ...schedule, id: `sched-${Date.now()}` }],
    })),

  removeSchedule: id =>
    set(state => ({
      scheduledReports: state.scheduledReports.filter(s => s.id !== id),
    })),

  resetAllData: () =>
    set({
      activeTab: 'import',
      companySettings: initialCompanySettings,
      rawDatasets: [],
      cleanedData: {
        sales: [],
        expenses: [],
        inventory: [],
        customers: [],
        reports: {},
      },
      kpis: initialEmptyKPIs,
      anomalies: [],
      trendAnalysis: null,
      aiInsights: null,
      filters: initialFilters,
      scheduledReports: [],
      chatMessages: [
        {
          id: 'welcome-reset',
          sender: 'agent',
          text: "All data cleared. Upload your SME files in Data Import or load demo data anytime.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ],
    }),
}));
