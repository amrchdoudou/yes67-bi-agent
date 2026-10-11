import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import {
  TrendingUp,
  Package,
  Globe,
  DollarSign,
  Boxes,
  Database,
  ArrowRight,
} from 'lucide-react';
import { useBIStore } from '../store/useBIStore';
import { KPICard } from '../components/KPICard';
import { FilterBar } from '../components/FilterBar';
import { translations } from '../i18n';

const REGION_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

export const DashboardPage: React.FC = () => {
  const { kpis, language, companySettings, cleanedData, loadDemoData, setActiveTab } = useBIStore();
  const t = translations[language];

  const hasSales = cleanedData.sales.length > 0;

  if (!hasSales) {
    return (
      <div className="py-16 text-center space-y-6 max-w-xl mx-auto">
        <div className="w-20 h-20 mx-auto rounded-3xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-md">
          <Database className="w-10 h-10" />
        </div>
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {t.dashboard.noDataTitle}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
            {t.dashboard.noDataSubtitle}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={loadDemoData}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-600/30 transition-all cursor-pointer"
          >
            {t.app.demoDataBtn}
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-sm transition-all cursor-pointer"
          >
            {t.nav.import}
          </button>
        </div>
      </div>
    );
  }

  // Format currency tooltip helper
  const currencyFormatter = (val: any) =>
    `${companySettings.currencySymbol}${Number(val || 0).toLocaleString()}`;

  return (
    <div className="space-y-6">
      {/* Title & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {t.dashboard.title}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {companySettings.name} • {t.dashboard.subtitle}
          </p>
        </div>
      </div>

      <FilterBar />

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.kpiCards.map(kpi => (
          <KPICard key={kpi.id} kpi={kpi} />
        ))}
      </div>

      {/* Charts Grid: Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue & Profit Area Chart (2 cols) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-850 p-5 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {t.dashboard.revenueTrend}
              </h2>
            </div>
            <span className="text-xs text-slate-400 font-medium">Monthly Trajectory</span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={kpis.revenueByMonth} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorProf" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                <XAxis dataKey="period" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={v => `${companySettings.currencySymbol}${v / 1000}k`} />
                <Tooltip
                  formatter={currencyFormatter}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#3b82f6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRev)" />
                <Area type="monotone" dataKey="profit" name="Gross Profit" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorProf)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Regional Breakdown Donut Chart (1 col) */}
        <div className="bg-white dark:bg-slate-850 p-5 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-indigo-600" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {t.dashboard.regionalBreakdown}
              </h2>
            </div>
          </div>

          <div className="h-72 w-full flex flex-col items-center justify-center">
            <ResponsiveContainer width="100%" height="80%">
              <PieChart>
                <Pie
                  data={kpis.revenueByRegion}
                  dataKey="revenue"
                  nameKey="region"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                >
                  {kpis.revenueByRegion.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={REGION_COLORS[index % REGION_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={currencyFormatter}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Region Legend Pills */}
            <div className="flex flex-wrap justify-center gap-2 mt-2">
              {kpis.revenueByRegion.map((r, i) => (
                <div key={r.region} className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: REGION_COLORS[i % REGION_COLORS.length] }} />
                  <span className="font-semibold">{r.region}</span>
                  <span className="text-slate-400">({r.sharePct}%)</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid: Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products Bar Chart */}
        <div className="bg-white dark:bg-slate-850 p-5 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-emerald-600" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {t.dashboard.topProducts}
              </h2>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={kpis.topProductsByRevenue.slice(0, 5)}
                margin={{ top: 5, right: 20, left: 40, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                <XAxis type="number" stroke="#94a3b8" fontSize={11} tickFormatter={v => `${v / 1000}k`} />
                <YAxis dataKey="product" type="category" stroke="#94a3b8" fontSize={10} width={100} tickLine={false} />
                <Tooltip
                  formatter={currencyFormatter}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="revenue" name="Revenue" fill="#10b981" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Profit vs Operating Expenses */}
        <div className="bg-white dark:bg-slate-850 p-5 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-amber-500" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {t.dashboard.profitVsExpense}
              </h2>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={kpis.revenueByMonth} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                <XAxis dataKey="period" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={v => `${v / 1000}k`} />
                <Tooltip
                  formatter={currencyFormatter}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="profit" name="Gross Profit" fill="#10b981" radius={[6, 6, 0, 0]} />
                <Bar dataKey="expenses" name="Operating Expenses" fill="#f43f5e" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 3: Inventory Health (if inventory loaded) */}
      {kpis.inventorySummary && (
        <div className="bg-white dark:bg-slate-850 p-5 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Boxes className="w-5 h-5 text-cyan-600" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {t.dashboard.inventoryHealth}
              </h2>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="text-amber-600 dark:text-amber-400 font-bold">
                Low Stock: {kpis.inventorySummary.lowStockCount} items
              </span>
              <span className="text-indigo-600 dark:text-indigo-400 font-bold">
                Overstock: {kpis.inventorySummary.overstockCount} items
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={kpis.inventorySummary.items.slice(0, 10)}
                margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                <XAxis dataKey="product" stroke="#94a3b8" fontSize={9} angle={-25} textAnchor="end" interval={0} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="stockQuantity" name="Current Stock" fill="#06b6d4" radius={[6, 6, 0, 0]} />
                <Bar dataKey="minStock" name="Safety Minimum" fill="#f59e0b" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};
