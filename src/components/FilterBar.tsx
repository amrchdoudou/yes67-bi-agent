import React from 'react';
import { Filter, Calendar, MapPin, Tag, RotateCcw } from 'lucide-react';
import { useBIStore } from '../store/useBIStore';
import { translations } from '../i18n';

export const FilterBar: React.FC = () => {
  const { filters, setFilters, resetFilters, cleanedData, language } = useBIStore();
  const t = translations[language];

  // Derive unique regions & categories
  const regions = Array.from(new Set(cleanedData.sales.map(s => s.region).filter(Boolean)));
  const categories = Array.from(new Set(cleanedData.sales.map(s => s.category).filter(Boolean)));

  const handlePeriodChange = (val: string) => {
    if (val === 'all') {
      setFilters({ dateRange: null });
      return;
    }

    const maxDate = cleanedData.sales.length > 0
      ? cleanedData.sales.reduce((max, s) => (s.date > max ? s.date : max), cleanedData.sales[0].date)
      : new Date().toISOString().split('T')[0];
    const today = new Date(maxDate);
    const end = today.toISOString().split('T')[0];

    let days = 30;
    if (val === '90d') days = 90;
    if (val === '12m') days = 365;

    const startObj = new Date(today.getTime() - days * 86400000);
    const start = startObj.toISOString().split('T')[0];

    setFilters({ dateRange: { start, end } });
  };

  const isFiltered =
    filters.dateRange !== null ||
    filters.selectedRegion !== 'all' ||
    filters.selectedCategory !== 'all';

  return (
    <div className="bg-white dark:bg-slate-850 p-3 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-3 transition-colors">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          <Filter className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          <span>{t.filters.period} & Filters</span>
        </div>

        {/* Period Selector */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <select
            aria-label={t.filters.period}
            className="bg-transparent border-none text-slate-800 dark:text-slate-200 font-semibold focus:outline-hidden cursor-pointer"
            value={
              !filters.dateRange
                ? 'all'
                : filters.dateRange.start.includes('-12-')
                ? '30d'
                : filters.dateRange.start.includes('-10-')
                ? '90d'
                : '12m'
            }
            onChange={e => handlePeriodChange(e.target.value)}
          >
            <option value="all">{t.filters.allTime}</option>
            <option value="30d">{t.filters.last30Days}</option>
            <option value="90d">{t.filters.last90Days}</option>
            <option value="12m">{t.filters.last12Months}</option>
          </select>
        </div>

        {/* Region Filter */}
        {regions.length > 0 && (
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            <select
              aria-label={t.filters.region}
              className="bg-transparent border-none text-slate-800 dark:text-slate-200 font-semibold focus:outline-hidden cursor-pointer"
              value={filters.selectedRegion}
              onChange={e => setFilters({ selectedRegion: e.target.value })}
            >
              <option value="all">{t.filters.allRegions}</option>
              {regions.map(r => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Category Filter */}
        {categories.length > 0 && (
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
            <Tag className="w-3.5 h-3.5 text-slate-400" />
            <select
              aria-label={t.filters.category}
              className="bg-transparent border-none text-slate-800 dark:text-slate-200 font-semibold focus:outline-hidden cursor-pointer"
              value={filters.selectedCategory}
              onChange={e => setFilters({ selectedCategory: e.target.value })}
            >
              <option value="all">{t.filters.allCategories}</option>
              {categories.map(c => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Reset Filters button */}
      {isFiltered && (
        <button
          onClick={resetFilters}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>{t.filters.resetFilters}</span>
        </button>
      )}
    </div>
  );
};
