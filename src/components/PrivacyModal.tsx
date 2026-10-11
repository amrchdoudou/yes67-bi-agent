import React from 'react';
import { X, ShieldCheck, Lock, Cpu, Database, EyeOff } from 'lucide-react';

interface PrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyModal: React.FC<PrivacyModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-slate-850 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full p-6 sm:p-7 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-emerald-600" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Data Privacy & Security Architecture
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 flex items-start gap-3">
            <Lock className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-emerald-900 dark:text-emerald-200 block text-sm font-bold">
                100% In-Browser Execution
              </strong>
              <span>
                All raw CSV and Excel files are parsed locally inside your browser using PapaParse and SheetJS. Raw transaction records, customer names, and individual invoice rows never leave your computer.
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 flex items-start gap-3">
            <Cpu className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-blue-900 dark:text-blue-200 block text-sm font-bold">
                Deterministic TypeScript Math
              </strong>
              <span>
                Every single metric (revenues, gross margins, Z-score standard deviations, stock turnover) is computed mathematically by pure TypeScript code. The Gemini AI model does not compute math or hallucinate figures.
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/60 flex items-start gap-3">
            <EyeOff className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-indigo-900 dark:text-indigo-200 block text-sm font-bold">
                Strict Aggregation Boundary
              </strong>
              <span>
                When you click "Generate Insights" or chat with the agent, only high-level summary JSON (e.g. Total Revenue: $876k, Margin: 41%) is provided to the server model for natural-language synthesis.
              </span>
            </div>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white dark:text-slate-900 text-white font-bold text-xs cursor-pointer shadow-sm"
          >
            Understood
          </button>
        </div>
      </div>
    </div>
  );
};
