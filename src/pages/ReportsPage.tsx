import React, { useState } from 'react';
import {
  FileSpreadsheet,
  FileText,
  Calendar,
  Clock,
  Plus,
  Trash2,
  Download,
  Building2,
  CheckCircle2,
  Send,
  Sparkles,
} from 'lucide-react';
import { useBIStore } from '../store/useBIStore';
import { exportToExcel, exportToPDF } from '../utils/exporters';
import { translations } from '../i18n';

interface ReportsPageProps {
  onOpenSettings: () => void;
}

export const ReportsPage: React.FC<ReportsPageProps> = ({ onOpenSettings }) => {
  const {
    kpis,
    anomalies,
    cleanedData,
    aiInsights,
    companySettings,
    language,
    scheduledReports,
    addSchedule,
    removeSchedule,
  } = useBIStore();

  const t = translations[language];

  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);

  // New schedule form state
  const [title, setTitle] = useState('');
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [format, setFormat] = useState<'pdf' | 'excel'>('pdf');
  const [recipient, setRecipient] = useState('');
  const [showAddSchedule, setShowAddSchedule] = useState(false);

  const handleExportPdf = () => {
    setIsExportingPdf(true);
    setTimeout(() => {
      exportToPDF(companySettings, kpis, anomalies, aiInsights);
      setIsExportingPdf(false);
    }, 400);
  };

  const handleExportExcel = () => {
    setIsExportingExcel(true);
    setTimeout(() => {
      exportToExcel(companySettings.name, kpis, cleanedData, anomalies);
      setIsExportingExcel(false);
    }, 400);
  };

  const handleCreateSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    addSchedule({
      title: title.trim(),
      frequency,
      format,
      nextRunDate:
        frequency === 'daily'
          ? 'Tomorrow at 08:00 AM'
          : frequency === 'weekly'
          ? 'Next Monday at 08:00 AM'
          : '1st of next month',
      recipients: recipient ? recipient.split(',').map(s => s.trim()).filter(Boolean) : [],
      active: true,
      lastGenerated: 'Pending first scheduled trigger',
    });

    setTitle('');
    setRecipient('');
    setShowAddSchedule(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {t.reports.title}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t.reports.subtitle}
          </p>
        </div>

        <button
          onClick={onOpenSettings}
          className="flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Building2 className="w-4 h-4 text-blue-600" />
          <span>{t.reports.companySettingsTitle}</span>
        </button>
      </div>

      {/* Instant Export Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* PDF Executive Report Card */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>

          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {t.reports.exportPdf}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Multi-page PDF featuring executive cover with {companySettings.name}, AI executive summary, formatted KPI matrix, product breakdowns, and risk audit tables.
            </p>
          </div>

          <button
            disabled={isExportingPdf}
            onClick={handleExportPdf}
            className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm shadow-md shadow-rose-600/20 active:scale-95 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>{isExportingPdf ? t.reports.generatingPdf : t.reports.exportPdf}</span>
          </button>
        </div>

        {/* Multi-Sheet Excel Card */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <FileSpreadsheet className="w-6 h-6" />
          </div>

          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {t.reports.exportExcel}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Comprehensive XLSX workbook with 5 dedicated sheets: "KPI Summary", "Cleaned Sales", "Cleaned Expenses", "Inventory & Stock", and "Anomalies & Alerts".
            </p>
          </div>

          <button
            disabled={isExportingExcel}
            onClick={handleExportExcel}
            className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 active:scale-95 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>{isExportingExcel ? t.reports.generatingExcel : t.reports.exportExcel}</span>
          </button>
        </div>
      </div>

      {/* Automated Report Scheduling Section */}
      <div className="bg-white dark:bg-slate-850 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              {t.reports.schedulingTitle}
            </h2>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              Demo Simulation
            </span>
          </div>

          <button
            onClick={() => setShowAddSchedule(!showAddSchedule)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-colors cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule New Report</span>
          </button>
        </div>

        {/* Add Schedule Form */}
        {showAddSchedule && (
          <form
            onSubmit={handleCreateSchedule}
            className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-4 animate-in fade-in"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Report Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Weekly KPI Briefing"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-850 border border-slate-300 dark:border-slate-700"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {t.reports.frequency}
                </label>
                <select
                  value={frequency}
                  onChange={e => setFrequency(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-850 border border-slate-300 dark:border-slate-700 cursor-pointer"
                >
                  <option value="daily">{t.reports.daily}</option>
                  <option value="weekly">{t.reports.weekly}</option>
                  <option value="monthly">{t.reports.monthly}</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Format
                </label>
                <select
                  value={format}
                  onChange={e => setFormat(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-850 border border-slate-300 dark:border-slate-700 cursor-pointer"
                >
                  <option value="pdf">Executive PDF</option>
                  <option value="excel">Excel XLSX Workbook</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {t.reports.recipients}
                </label>
                <input
                  type="text"
                  placeholder="ceo@sme.com, ops@sme.com"
                  value={recipient}
                  onChange={e => setRecipient(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-850 border border-slate-300 dark:border-slate-700"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddSchedule(false)}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg text-slate-500 hover:bg-slate-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-bold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 cursor-pointer"
              >
                {t.reports.saveSchedule}
              </button>
            </div>
          </form>
        )}

        {/* Existing Schedules Table */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            {t.reports.activeSchedules} ({scheduledReports.length})
          </h3>

          <div className="space-y-2">
            {scheduledReports.map(sched => (
              <div
                key={sched.id}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-white text-sm">
                      {sched.title}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                      {sched.frequency}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      {sched.format.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400">
                    Next run: <strong className="text-slate-700 dark:text-slate-300">{sched.nextRunDate}</strong> • Recipients: {sched.recipients.join(', ')}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (sched.format === 'pdf') handleExportPdf();
                      else handleExportExcel();
                    }}
                    className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 font-semibold hover:border-blue-400 text-slate-700 dark:text-slate-200 cursor-pointer"
                  >
                    Run Now
                  </button>
                  <button
                    onClick={() => removeSchedule(sched.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
