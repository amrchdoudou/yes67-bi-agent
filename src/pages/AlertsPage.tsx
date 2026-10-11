import React, { useState } from 'react';
import {
  AlertTriangle,
  AlertCircle,
  Info,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  Calendar,
  Layers,
} from 'lucide-react';
import { useBIStore } from '../store/useBIStore';
import { translations } from '../i18n';
import { AnomalySeverity } from '../types';

export const AlertsPage: React.FC = () => {
  const { anomalies, trendAnalysis, language, companySettings, cleanedData, loadDemoData } = useBIStore();
  const t = translations[language];

  const [severityFilter, setSeverityFilter] = useState<'all' | AnomalySeverity>('all');

  const filteredAnomalies =
    severityFilter === 'all'
      ? anomalies
      : anomalies.filter(a => a.severity === severityFilter);

  const criticalCount = anomalies.filter(a => a.severity === 'critical').length;
  const warningCount = anomalies.filter(a => a.severity === 'warning').length;
  const infoCount = anomalies.filter(a => a.severity === 'info').length;

  const hasData = cleanedData.sales.length > 0;

  if (!hasData) {
    return (
      <div className="py-16 text-center space-y-4 max-w-md mx-auto">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          {t.alerts.noAlerts}
        </h2>
        <p className="text-xs text-slate-500">
          Load demo data to see detected Z-score anomalies and forecasts.
        </p>
        <button
          onClick={loadDemoData}
          className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-sm shadow-sm cursor-pointer"
        >
          {t.app.demoDataBtn}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          {t.alerts.title}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          {t.alerts.subtitle}
        </p>
      </div>

      {/* Deterministic Forecast Section */}
      {trendAnalysis && (
        <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-3xl shadow-lg border border-indigo-900/40 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              <h2 className="text-base font-bold">
                {t.alerts.forecastTitle}
              </h2>
            </div>
            <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              {t.alerts.forecastNote}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            {trendAnalysis.forecasts.map(fc => (
              <div
                key={fc.period}
                className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm space-y-1.5"
              >
                <div className="flex items-center justify-between text-xs text-indigo-200">
                  <span className="font-semibold">{fc.period}</span>
                  <span className="text-[10px] uppercase tracking-wider text-indigo-400">Estimate</span>
                </div>
                <p className="text-2xl font-black tracking-tight text-white">
                  {companySettings.currencySymbol}{fc.projectedRevenue.toLocaleString()}
                </p>
                <p className="text-[11px] text-indigo-300/80">
                  Expected Band: {companySettings.currencySymbol}{fc.lowerBound.toLocaleString()} – {companySettings.currencySymbol}{fc.upperBound.toLocaleString()}
                </p>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 text-xs text-indigo-200/90 pt-1">
            {trendAnalysis.direction === 'rising' ? (
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            ) : (
              <TrendingDown className="w-4 h-4 text-rose-400" />
            )}
            <span>
              Linear regression slope: <strong className="text-white">+{trendAnalysis.slope}</strong>/month ({trendAnalysis.direction} trajectory). Annualized growth trend: <strong className="text-white">{trendAnalysis.growthRatePct}%</strong>.
            </span>
          </div>
        </div>
      )}

      {/* Severity Filter Pills */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setSeverityFilter('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            severityFilter === 'all'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
          }`}
        >
          {t.alerts.allSeverities} ({anomalies.length})
        </button>

        <button
          onClick={() => setSeverityFilter('critical')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            severityFilter === 'critical'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 border border-slate-200 dark:border-slate-700'
          }`}
        >
          <AlertCircle className="w-3.5 h-3.5" />
          <span>{t.alerts.critical} ({criticalCount})</span>
        </button>

        <button
          onClick={() => setSeverityFilter('warning')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            severityFilter === 'warning'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 border border-slate-200 dark:border-slate-700'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>{t.alerts.warning} ({warningCount})</span>
        </button>
      </div>

      {/* Anomalies Cards List */}
      <div className="space-y-4">
        {filteredAnomalies.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-500 text-sm">
            {t.alerts.noAlerts}
          </div>
        ) : (
          filteredAnomalies.map(anomaly => {
            const isCritical = anomaly.severity === 'critical';
            const isWarning = anomaly.severity === 'warning';

            return (
              <div
                key={anomaly.id}
                className={`p-5 rounded-3xl border transition-all shadow-xs ${
                  isCritical
                    ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/60'
                    : isWarning
                    ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/60'
                    : 'bg-blue-50/40 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/60'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wide ${
                          isCritical
                            ? 'bg-rose-600 text-white'
                            : isWarning
                            ? 'bg-amber-500 text-white'
                            : 'bg-blue-600 text-white'
                        }`}
                      >
                        {isCritical ? <AlertCircle className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                        {anomaly.severity}
                      </span>

                      {anomaly.date && (
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                          Period: {anomaly.date}
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-slate-900 dark:text-white pt-1">
                      {anomaly.title}
                    </h3>

                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      {anomaly.description}
                    </p>
                  </div>

                  {/* Numeric Trigger Stats Box */}
                  <div className="shrink-0 p-3 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-xs space-y-1 sm:w-48">
                    <div className="flex items-center justify-between text-slate-500">
                      <span>{t.alerts.metricTriggered}:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{anomaly.metric}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-500">
                      <span>{t.alerts.actual}:</span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {anomaly.actualValue.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-500">
                      <span>{t.alerts.baseline}:</span>
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        {anomaly.baselineValue.toLocaleString()}
                      </span>
                    </div>
                    {anomaly.zScore !== undefined && (
                      <div className="flex items-center justify-between text-slate-500 pt-0.5 border-t border-slate-100 dark:border-slate-800">
                        <span>{t.alerts.zScore}:</span>
                        <span className={`font-mono font-bold ${Math.abs(anomaly.zScore) >= 2 ? 'text-rose-600' : 'text-amber-600'}`}>
                          {anomaly.zScore > 0 ? `+${anomaly.zScore}` : anomaly.zScore}σ
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Recommendation Pill */}
                {anomaly.recommendation && (
                  <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center gap-2 text-xs">
                    <span className="font-bold text-slate-700 dark:text-slate-300">Action:</span>
                    <span className="text-slate-600 dark:text-slate-400">{anomaly.recommendation}</span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
