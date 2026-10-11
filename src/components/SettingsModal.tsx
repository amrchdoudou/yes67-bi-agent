import React, { useState } from 'react';
import { X, Building2, DollarSign, Percent, Image, Check } from 'lucide-react';
import { useBIStore } from '../store/useBIStore';
import { translations } from '../i18n';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { companySettings, updateCompanySettings, language } = useBIStore();
  const t = translations[language];

  const [name, setName] = useState(companySettings.name);
  const [currency, setCurrency] = useState(companySettings.currency);
  const [currencySymbol, setCurrencySymbol] = useState(companySettings.currencySymbol);
  const [taxRate, setTaxRate] = useState(companySettings.taxRate);
  const [saved, setSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateCompanySettings({
      name: name.trim(),
      currency,
      currencySymbol,
      taxRate: Number(taxRate) || 0,
    });
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 600);
  };

  const CURRENCY_PRESETS = [
    { code: 'USD', symbol: '$', label: 'USD ($)' },
    { code: 'EUR', symbol: '€', label: 'EUR (€)' },
    { code: 'GBP', symbol: '£', label: 'GBP (£)' },
    { code: 'DZD', symbol: 'DA', label: 'Algerian Dinar (DA / دج)' },
    { code: 'SAR', symbol: 'SAR', label: 'Saudi Riyal (SAR / ر.س)' },
    { code: 'AED', symbol: 'AED', label: 'UAE Dirham (AED / د.إ)' },
    { code: 'MAD', symbol: 'MAD', label: 'Moroccan Dirham (MAD / د.م.)' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-slate-850 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {t.reports.companySettingsTitle}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
              {t.reports.companyName}
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-semibold"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Currency Preset
            </label>
            <div className="grid grid-cols-2 gap-2 mb-2">
              {CURRENCY_PRESETS.slice(0, 4).map(c => (
                <button
                  type="button"
                  key={c.code}
                  onClick={() => {
                    setCurrency(c.code);
                    setCurrencySymbol(c.symbol);
                  }}
                  className={`p-2 rounded-xl border text-left cursor-pointer transition-all ${
                    currency === c.code
                      ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3 mt-2">
              <div>
                <label className="text-[11px] text-slate-500 block mb-1">Code</label>
                <input
                  type="text"
                  value={currency}
                  onChange={e => setCurrency(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-mono"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-500 block mb-1">Symbol</label>
                <input
                  type="text"
                  value={currencySymbol}
                  onChange={e => setCurrencySymbol(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-mono font-bold"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Corporate Tax Rate (%)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={taxRate}
              onChange={e => setTaxRate(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-mono"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-sm cursor-pointer"
            >
              {saved && <Check className="w-4 h-4" />}
              <span>{saved ? 'Saved!' : t.reports.saveSettings}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
