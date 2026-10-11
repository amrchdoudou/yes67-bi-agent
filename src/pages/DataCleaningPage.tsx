import React, { useState } from 'react';
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Download,
  ArrowRight,
  ShieldAlert,
  Layers,
  Settings2,
  RefreshCw,
  FileCheck2,
} from 'lucide-react';
import { useBIStore } from '../store/useBIStore';
import { translations } from '../i18n';
import Papa from 'papaparse';

export const DataCleaningPage: React.FC = () => {
  const {
    cleaningOptions,
    updateCleaningOptions,
    runCleaning,
    cleanedData,
    rawDatasets,
    setActiveTab,
    language,
  } = useBIStore();

  const t = translations[language];
  const [isRunning, setIsRunning] = useState(false);
  const [cleaningDone, setCleaningDone] = useState(false);

  const reportsList = Object.values(cleanedData.reports);
  const totalOriginal = reportsList.reduce((acc, r) => acc + r.totalRowsOriginal, 0);
  const totalCleaned = reportsList.reduce((acc, r) => acc + r.totalRowsCleaned, 0);
  const totalDuplicates = reportsList.reduce((acc, r) => acc + r.duplicatesRemoved, 0);
  const totalFixed = reportsList.reduce((acc, r) => acc + r.valuesFixed, 0);
  const totalRejected = reportsList.reduce((acc, r) => acc + r.rowsRejected, 0);

  // Aggregate rejected reasons
  const allRejections = reportsList.flatMap(r =>
    r.rejectedReasons.map(rej => ({ ...rej, datasetName: r.datasetName }))
  );

  const handleRunCleaning = () => {
    setIsRunning(true);
    setTimeout(() => {
      runCleaning();
      setIsRunning(false);
      setCleaningDone(true);
    }, 400);
  };

  const downloadCleanedCsv = () => {
    if (cleanedData.sales.length === 0) return;
    const csv = Papa.unparse(cleanedData.sales);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Cleaned_SME_Sales_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const hasRawData = rawDatasets.length > 0;
  const hasCleaned = cleanedData.sales.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {t.cleaning.title}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t.cleaning.subtitle}
          </p>
        </div>

        {hasCleaned && (
          <button
            onClick={downloadCleanedCsv}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors cursor-pointer self-start sm:self-auto"
          >
            <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>{t.cleaning.downloadCleaned}</span>
          </button>
        )}
      </div>

      {/* Rules Configuration & Trigger */}
      <div className="bg-white dark:bg-slate-850 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
        <div className="flex items-center gap-2">
          <Settings2 className="w-5 h-5 text-blue-600" />
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            {t.cleaning.rulesTitle}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Rule 1: Remove duplicates */}
          <label className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 cursor-pointer hover:border-slate-300">
            <input
              type="checkbox"
              checked={cleaningOptions.removeDuplicates}
              onChange={e => updateCleaningOptions({ removeDuplicates: e.target.checked })}
              className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-white block">
                {t.cleaning.removeDuplicates}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Purges identical transactions & redundant order identifiers
              </span>
            </div>
          </label>

          {/* Rule 2: Trim whitespace */}
          <label className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 cursor-pointer hover:border-slate-300">
            <input
              type="checkbox"
              checked={cleaningOptions.trimWhitespace}
              onChange={e => updateCleaningOptions({ trimWhitespace: e.target.checked })}
              className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-white block">
                {t.cleaning.trimWhitespace}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Removes trailing spaces, collapses tabs and aligns casing
              </span>
            </div>
          </label>

          {/* Rule 3: Standardize dates */}
          <label className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 cursor-pointer hover:border-slate-300">
            <input
              type="checkbox"
              checked={cleaningOptions.standardizeDates}
              onChange={e => updateCleaningOptions({ standardizeDates: e.target.checked })}
              className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-white block">
                {t.cleaning.standardizeDates}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Converts EU/US/Excel serials to ISO YYYY-MM-DD
              </span>
            </div>
          </label>

          {/* Rule 4: Sanitize numbers */}
          <label className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 cursor-pointer hover:border-slate-300">
            <input
              type="checkbox"
              checked={cleaningOptions.sanitizeNumbers}
              onChange={e => updateCleaningOptions({ sanitizeNumbers: e.target.checked })}
              className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-white block">
                {t.cleaning.sanitizeNumbers}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Removes $, €, commas, thousand separators, and spaces
              </span>
            </div>
          </label>

          {/* Rule 5: Flag invalid rows */}
          <label className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 cursor-pointer hover:border-slate-300">
            <input
              type="checkbox"
              checked={cleaningOptions.flagInvalidRows}
              onChange={e => updateCleaningOptions({ flagInvalidRows: e.target.checked })}
              className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-white block">
                {t.cleaning.flagInvalid}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Quarantines negative quantities, negative prices & future dates
              </span>
            </div>
          </label>

          {/* Rule 6: Missing values action */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-1">
            <span className="text-xs font-bold text-slate-900 dark:text-white block">
              {t.cleaning.missingValues}
            </span>
            <select
              value={cleaningOptions.missingValueAction}
              onChange={e => updateCleaningOptions({ missingValueAction: e.target.value as any })}
              className="w-full bg-white dark:bg-slate-850 px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white cursor-pointer"
            >
              <option value="fill_median">{t.cleaning.fillMedian}</option>
              <option value="fill_zero">{t.cleaning.fillZero}</option>
              <option value="drop">{t.cleaning.dropRows}</option>
            </select>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100 dark:border-slate-800">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {hasRawData
              ? `${rawDatasets.length} datasets ready for processing.`
              : 'Upload files in Data Import or click Load Demo Data first.'}
          </p>

          <button
            disabled={!hasRawData || isRunning}
            onClick={handleRunCleaning}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white transition-all cursor-pointer ${
              !hasRawData || isRunning
                ? 'bg-slate-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/30 active:scale-95'
            }`}
          >
            {isRunning ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Running Engine...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>{hasCleaned ? t.cleaning.reRunCleaning : t.cleaning.runCleaning}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Audit Report Metrics */}
      {hasCleaned && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileCheck2 className="w-5 h-5 text-emerald-600" />
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
                {t.cleaning.auditReport}
              </h2>
            </div>

            <button
              onClick={() => setActiveTab('dashboard')}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-sm transition-all cursor-pointer"
            >
              <span>{t.cleaning.gotoDashboard}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {t.cleaning.originalRows}
              </span>
              <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
                {totalOriginal.toLocaleString()}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800">
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                {t.cleaning.cleanedRows}
              </span>
              <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                {totalCleaned.toLocaleString()}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800">
              <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                {t.cleaning.duplicatesRemoved}
              </span>
              <p className="text-2xl font-extrabold text-blue-600 dark:text-blue-400 mt-1">
                {totalDuplicates}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800">
              <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                {t.cleaning.valuesSanitized}
              </span>
              <p className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-1">
                {totalFixed}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800">
              <span className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                {t.cleaning.rowsRejected}
              </span>
              <p className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 mt-1">
                {totalRejected}
              </p>
            </div>
          </div>

          {/* Rejection Log Table */}
          <div className="bg-white dark:bg-slate-850 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-600" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {t.cleaning.rejectionLog}
              </h3>
            </div>

            {allRejections.length === 0 ? (
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{t.cleaning.noRejections}</span>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-bold">
                    <tr>
                      <th className="p-3 border-b border-slate-200 dark:border-slate-800">File</th>
                      <th className="p-3 border-b border-slate-200 dark:border-slate-800">Row #</th>
                      <th className="p-3 border-b border-slate-200 dark:border-slate-800">{t.cleaning.reason}</th>
                      <th className="p-3 border-b border-slate-200 dark:border-slate-800">{t.cleaning.rowDetails}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[11px]">
                    {allRejections.map((rej, idx) => (
                      <tr key={idx} className="hover:bg-rose-50/40 dark:hover:bg-rose-950/20">
                        <td className="p-3 font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                          {rej.datasetName}
                        </td>
                        <td className="p-3 text-slate-500 whitespace-nowrap">
                          #{rej.rowIndex}
                        </td>
                        <td className="p-3 text-rose-600 dark:text-rose-400 font-bold">
                          {rej.reason}
                        </td>
                        <td className="p-3 text-slate-600 dark:text-slate-400 max-w-md truncate">
                          {JSON.stringify(rej.rowData)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
