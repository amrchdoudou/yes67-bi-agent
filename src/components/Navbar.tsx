import React, { useState } from 'react';
import {
  ShieldCheck,
  Moon,
  Sun,
  Globe,
  Database,
  Building2,
  Trash2,
  Sparkles,
  Info,
} from 'lucide-react';
import { useBIStore } from '../store/useBIStore';
import { translations, isRTL } from '../i18n';
import { Language } from '../types';

interface NavbarProps {
  onOpenSettings: () => void;
  onOpenPrivacy: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenSettings, onOpenPrivacy }) => {
  const {
    language,
    setLanguage,
    darkMode,
    toggleDarkMode,
    companySettings,
    loadDemoData,
    resetAllData,
    cleanedData,
  } = useBIStore();

  const t = translations[language];
  const rtl = isRTL(language);
  const [showDemoNotification, setShowDemoNotification] = useState(false);

  const handleLoadDemo = () => {
    loadDemoData();
    setShowDemoNotification(true);
    setTimeout(() => setShowDemoNotification(false), 3500);
  };

  const hasData = cleanedData.sales.length > 0;

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Branding & Tagline */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20 font-bold text-lg tracking-tight">
            Y67
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-slate-900 dark:text-white text-lg tracking-tight">
                {t.app.name}
              </span>
              <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                <Sparkles className="w-3 h-3" />
                BI Engine
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
              {companySettings.name} • {t.app.tagline}
            </p>
          </div>
        </div>

        {/* Center: Privacy Notice Pill */}
        <button
          onClick={onOpenPrivacy}
          className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/80 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors"
          title="Click to view privacy architecture details"
        >
          <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span className="max-w-xs truncate">100% Client-Side Engine • Privacy Protected</span>
          <Info className="w-3.5 h-3.5 opacity-70" />
        </button>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Load Demo Data Button */}
          <button
            onClick={handleLoadDemo}
            className="flex items-center gap-2 px-3 sm:px-3.5 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white shadow-sm shadow-blue-600/30 transition-all cursor-pointer"
          >
            <Database className="w-4 h-4" />
            <span className="hidden sm:inline">{t.app.demoDataBtn}</span>
            <span className="sm:hidden">Demo</span>
          </button>

          {/* Clear Data (if loaded) */}
          {hasData && (
            <button
              onClick={() => {
                if (window.confirm('Reset and clear all uploaded and cleaned data?')) {
                  resetAllData();
                }
              }}
              title={t.app.resetData}
              className="p-2 text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          {/* Language Switcher */}
          <div className="relative flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 border border-slate-200 dark:border-slate-700">
            <Globe className="w-3.5 h-3.5 text-slate-400 ml-1.5 mr-0.5 hidden md:block" />
            {(['en', 'fr', 'ar'] as Language[]).map(lang => (
              <button
                key={lang}
                onClick={() => setLanguage(lang)}
                className={`px-2 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  language === lang
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {lang === 'en' ? 'EN' : lang === 'fr' ? 'FR' : 'عربي'}
              </button>
            ))}
          </div>

          {/* Dark Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle theme"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Company Settings */}
          <button
            onClick={onOpenSettings}
            className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            title={t.app.settings}
          >
            <Building2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Floating Demo Data Alert Banner */}
      {showDemoNotification && (
        <div className="bg-emerald-600 text-white text-xs sm:text-sm font-medium py-2 px-4 text-center transition-all animate-in fade-in slide-in-from-top-1">
          ✓ {t.app.demoDataLoaded} 12 months, 4 datasets, and 3 anomalies initialized.
        </div>
      )}
    </header>
  );
};
