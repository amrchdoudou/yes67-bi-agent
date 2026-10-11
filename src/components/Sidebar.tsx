import React from 'react';
import {
  UploadCloud,
  Sparkles,
  LayoutDashboard,
  AlertTriangle,
  Lightbulb,
  MessageSquareText,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { useBIStore } from '../store/useBIStore';
import { translations, isRTL } from '../i18n';

export const Sidebar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    language,
    rawDatasets,
    cleanedData,
    anomalies,
    aiInsights,
  } = useBIStore();

  const t = translations[language];
  const rtl = isRTL(language);

  const criticalAnomalies = anomalies.filter(a => a.severity === 'critical').length;
  const totalCleanedRows = cleanedData.sales.length + cleanedData.expenses.length;

  const navItems = [
    {
      id: 'import' as const,
      label: t.nav.import,
      icon: UploadCloud,
      badge: rawDatasets.length > 0 ? `${rawDatasets.length}` : null,
      badgeColor: 'bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300',
    },
    {
      id: 'cleaning' as const,
      label: t.nav.cleaning,
      icon: Sparkles,
      badge: totalCleanedRows > 0 ? '✓' : null,
      badgeColor: 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300',
    },
    {
      id: 'dashboard' as const,
      label: t.nav.dashboard,
      icon: LayoutDashboard,
      badge: null,
      badgeColor: '',
    },
    {
      id: 'alerts' as const,
      label: t.nav.alerts,
      icon: AlertTriangle,
      badge: anomalies.length > 0 ? `${anomalies.length}` : null,
      badgeColor:
        criticalAnomalies > 0
          ? 'bg-rose-100 dark:bg-rose-900/70 text-rose-700 dark:text-rose-300 animate-pulse'
          : 'bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300',
    },
    {
      id: 'insights' as const,
      label: t.nav.insights,
      icon: Lightbulb,
      badge: aiInsights ? 'Ready' : null,
      badgeColor: 'bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300',
    },
    {
      id: 'chat' as const,
      label: t.nav.chat,
      icon: MessageSquareText,
      badge: null,
      badgeColor: '',
    },
    {
      id: 'reports' as const,
      label: t.nav.reports,
      icon: FileSpreadsheet,
      badge: null,
      badgeColor: '',
    },
  ];

  return (
    <aside className="w-64 bg-slate-50/80 dark:bg-slate-900/60 border-r border-slate-200 dark:border-slate-800 p-4 flex flex-col justify-between shrink-0 transition-colors">
      <div className="space-y-1">
        <p className="px-3 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
          {language === 'ar' ? 'وحدات التحليل' : language === 'fr' ? 'MODULES D\'ANALYSE' : 'ANALYTIC MODULES'}
        </p>

        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/20'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
                <span>{item.label}</span>
              </div>

              {item.badge && (
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    isActive ? 'bg-white/20 text-white' : item.badgeColor
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom Status Box */}
      <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
        <div className="p-3 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 shadow-xs space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-medium">
              {language === 'ar' ? 'حالة السجلات' : language === 'fr' ? 'État des données' : 'Data Status'}
            </span>
            {totalCleanedRows > 0 ? (
              <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {totalCleanedRows} {language === 'ar' ? 'سجل منقى' : 'rows'}
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                <AlertCircle className="w-3.5 h-3.5" />
                {language === 'ar' ? 'بانتظار البيانات' : 'Awaiting data'}
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-tight">
            Deterministic Engine • TypeScript 5.8
          </p>
        </div>
      </div>
    </aside>
  );
};
