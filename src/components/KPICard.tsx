import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { KPICardData } from '../types';

interface KPICardProps {
  kpi: KPICardData;
}

export const KPICard: React.FC<KPICardProps> = ({ kpi }) => {
  const isUp = kpi.trend === 'up';
  const isDown = kpi.trend === 'down';

  // SVG Sparkline calculation
  const values = kpi.sparkline.map(s => s.value);
  const minVal = values.length > 0 ? Math.min(...values) : 0;
  const maxVal = values.length > 0 ? Math.max(...values) : 1;
  const range = maxVal - minVal === 0 ? 1 : maxVal - minVal;

  const width = 80;
  const height = 28;
  const points = values
    .map((val, idx) => {
      const x = (idx / (values.length - 1 || 1)) * width;
      const y = height - ((val - minVal) / range) * (height - 6) - 3;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  const strokeColor = kpi.isPositive ? '#10b981' : isDown ? '#f43f5e' : '#64748b';

  return (
    <div className="bg-white dark:bg-slate-850 p-4 sm:p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          {kpi.title}
        </span>
        {/* Trend Pill */}
        {kpi.changePct !== 0 && (
          <span
            className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-bold ${
              kpi.isPositive
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
            }`}
          >
            {isUp ? (
              <ArrowUpRight className="w-3 h-3" />
            ) : isDown ? (
              <ArrowDownRight className="w-3 h-3" />
            ) : (
              <Minus className="w-3 h-3" />
            )}
            {kpi.changePct > 0 ? `+${kpi.changePct}%` : `${kpi.changePct}%`}
          </span>
        )}
      </div>

      <div className="flex items-end justify-between gap-2 mt-1">
        <div>
          <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {kpi.formattedValue}
          </span>
        </div>

        {/* Micro Sparkline */}
        {values.length >= 2 && (
          <div className="shrink-0">
            <svg width={width} height={height} className="overflow-visible">
              <polyline
                fill="none"
                stroke={strokeColor}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={points}
              />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
};
