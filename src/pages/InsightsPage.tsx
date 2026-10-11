import React, { useState } from 'react';
import {
  Sparkles,
  Lightbulb,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  ShieldCheck,
  RefreshCw,
  TrendingUp,
  Target,
} from 'lucide-react';
import { useBIStore } from '../store/useBIStore';
import { translations } from '../i18n';

export const InsightsPage: React.FC = () => {
  const {
    aiInsights,
    isGeneratingInsights,
    insightsError,
    generateAIInsights,
    kpis,
    companySettings,
    language,
    loadDemoData,
    cleanedData,
  } = useBIStore();

  const t = translations[language];
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!aiInsights) return;
    const text = `
=== ${companySettings.name} — AI Executive Insights ===
Generated: ${new Date(aiInsights.generatedAt).toLocaleString()}

[EXECUTIVE SUMMARY]
${aiInsights.executiveSummary}

[KEY BUSINESS FINDINGS]
${aiInsights.keyFindings.map(f => `• ${f}`).join('\n')}

[CRITICAL RISKS & BOTTLENECK]
${aiInsights.criticalRisks.map(r => `• ${r}`).join('\n')}

[ACTIONABLE RECOMMENDATIONS]
${aiInsights.actionableRecommendations.map(rec => `• ${rec}`).join('\n')}
    `.trim();

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const hasData = cleanedData.sales.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <span>{t.insights.title}</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
              Gemini 3.8
            </span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t.insights.subtitle}
          </p>
        </div>

        {/* Action button */}
        <div className="flex items-center gap-2">
          {aiInsights && (
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-bold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? t.insights.copied : t.insights.copyText}</span>
            </button>
          )}

          <button
            disabled={!hasData || isGeneratingInsights}
            onClick={generateAIInsights}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white transition-all cursor-pointer ${
              !hasData || isGeneratingInsights
                ? 'bg-slate-400 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/30 active:scale-95'
            }`}
          >
            {isGeneratingInsights ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>{t.insights.generating}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>{t.insights.generateBtn}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Privacy Notice Banner */}
      <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-900/60 flex items-start gap-3 text-xs text-indigo-900 dark:text-indigo-200">
        <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          {t.insights.disclaimer} All numbers like total revenue ({companySettings.currencySymbol}{kpis.totalRevenue.toLocaleString()}), profit margin ({kpis.grossMarginPct}%), and Z-score anomalies were computed deterministically before prompt transmission.
        </p>
      </div>

      {insightsError && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 text-xs font-medium">
          {insightsError}
        </div>
      )}

      {/* Content */}
      {!aiInsights && !isGeneratingInsights ? (
        <div className="py-16 text-center space-y-4 max-w-md mx-auto">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Lightbulb className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            {t.insights.notGeneratedYet}
          </h3>
          <p className="text-xs text-slate-500">
            Click the button above to generate a synthesized executive brief for {companySettings.name}.
          </p>
          {!hasData && (
            <button
              onClick={loadDemoData}
              className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-sm shadow-sm cursor-pointer"
            >
              {t.app.demoDataBtn}
            </button>
          )}
        </div>
      ) : isGeneratingInsights ? (
        <div className="py-20 text-center space-y-4">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-indigo-600 text-white flex items-center justify-center animate-bounce">
            <Sparkles className="w-6 h-6" />
          </div>
          <p className="text-sm font-bold text-slate-900 dark:text-white">
            Synthesizing executive findings with Gemini 3.8 Flash...
          </p>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Structuring key strengths, bottleneck risks, and actionable recommendations based strictly on your JSON metrics.
          </p>
        </div>
      ) : aiInsights ? (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Executive Summary Card */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                {t.insights.execSummary}
              </h2>
            </div>
            <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-200 pt-1">
              {aiInsights.executiveSummary}
            </p>
          </div>

          {/* Two Columns: Key Findings & Critical Risks */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Key Findings */}
            <div className="p-6 rounded-3xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/60 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold">{t.insights.keyFindings}</h3>
              </div>
              <ul className="space-y-2.5 pt-1">
                {aiInsights.keyFindings.map((finding, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                    <span>{finding}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Critical Risks */}
            <div className="p-6 rounded-3xl bg-rose-50/40 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/60 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-rose-800 dark:text-rose-300">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
                <h3 className="text-base font-bold">{t.insights.risks}</h3>
              </div>
              <ul className="space-y-2.5 pt-1">
                {aiInsights.criticalRisks.map((risk, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                    <span>{risk}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Actionable Recommendations */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-600" />
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                {t.insights.recommendations}
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {aiInsights.actionableRecommendations.map((rec, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 space-y-1"
                >
                  <span className="font-bold text-blue-600 dark:text-blue-400 text-[11px] uppercase tracking-wider block">
                    Action #{idx + 1}
                  </span>
                  <p>{rec}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
