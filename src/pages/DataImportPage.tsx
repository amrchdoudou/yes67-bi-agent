import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  Trash2,
  Table as TableIcon,
  SlidersHorizontal,
  ArrowRight,
  Database,
  FileCheck,
} from 'lucide-react';
import { useBIStore } from '../store/useBIStore';
import { parseUploadedFile } from '../utils/fileParser';
import { RawDataset, DatasetType, StandardField } from '../types';
import { translations } from '../i18n';

const STANDARD_FIELDS: Record<DatasetType, { field: StandardField; label: string; required: boolean }[]> = {
  sales: [
    { field: 'date', label: 'Order / Sale Date', required: true },
    { field: 'product', label: 'Product / Item Name', required: true },
    { field: 'quantity', label: 'Quantity Sold', required: true },
    { field: 'unit_price', label: 'Unit Price', required: true },
    { field: 'unit_cost', label: 'Unit Cost (COGS)', required: false },
    { field: 'customer', label: 'Customer / Buyer Name', required: false },
    { field: 'region', label: 'Sales Region / Zone', required: false },
    { field: 'category', label: 'Product Category', required: false },
    { field: 'order_id', label: 'Order / Invoice ID', required: false },
  ],
  expenses: [
    { field: 'date', label: 'Expense Date', required: true },
    { field: 'total_amount', label: 'Expense Amount', required: true },
    { field: 'expense_category', label: 'Category / Department', required: true },
    { field: 'expense_description', label: 'Description / Notes', required: false },
  ],
  inventory: [
    { field: 'product', label: 'Product / SKU Title', required: true },
    { field: 'stock_quantity', label: 'Stock Quantity On Hand', required: true },
    { field: 'min_stock', label: 'Safety Minimum Stock', required: false },
    { field: 'unit_cost', label: 'Unit Cost', required: false },
    { field: 'category', label: 'Category', required: false },
  ],
  customers: [
    { field: 'customer', label: 'Customer / Account Name', required: true },
    { field: 'region', label: 'Region / Territory', required: false },
  ],
};

export const DataImportPage: React.FC = () => {
  const {
    rawDatasets,
    addRawDataset,
    removeRawDataset,
    updateColumnMapping,
    setActiveTab,
    language,
    loadDemoData,
  } = useBIStore();

  const t = translations[language];
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedDatasetId, setSelectedDatasetId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);

  const currentDataset = rawDatasets.find(d => d.id === selectedDatasetId) || rawDatasets[0];

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsParsing(true);
    setParseError(null);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const parsed = await parseUploadedFile(file);

        const newDataset: RawDataset = {
          id: `dataset-${Date.now()}-${i}`,
          name: parsed.fileName,
          type: parsed.detectedType,
          fileName: parsed.fileName,
          fileSize: parsed.fileSize,
          uploadedAt: new Date().toISOString(),
          headers: parsed.headers,
          rows: parsed.rows,
          mapping: parsed.suggestedMapping,
        };

        addRawDataset(newDataset);
        if (!selectedDatasetId) {
          setSelectedDatasetId(newDataset.id);
        }
      }
    } catch (err: any) {
      setParseError(err.message || 'Error parsing file format');
    } finally {
      setIsParsing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {t.import.title}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t.import.subtitle}
          </p>
        </div>

        {/* Load Demo Data Quick Action */}
        <button
          onClick={loadDemoData}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Database className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span>{t.app.demoDataBtn}</span>
        </button>
      </div>

      {/* Upload Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center transition-all cursor-pointer ${
          isDragging
            ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20'
            : 'border-slate-300 dark:border-slate-750 hover:border-blue-400 dark:hover:border-blue-600 bg-white dark:bg-slate-850/80'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".csv,.xlsx,.xls"
          className="hidden"
          onChange={e => handleFiles(e.target.files)}
        />
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-xs">
          <UploadCloud className="w-8 h-8" />
        </div>
        <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
          {t.import.dragDrop}
        </h3>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-lg mx-auto">
          {t.import.supportedTypes}
        </p>

        {isParsing && (
          <div className="mt-4 flex items-center justify-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400">
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            <span>Parsing file contents and detecting columns...</span>
          </div>
        )}

        {parseError && (
          <p className="mt-4 text-xs font-semibold text-rose-600 dark:text-rose-400">
            {parseError}
          </p>
        )}
      </div>

      {/* Uploaded Datasets Management */}
      {rawDatasets.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Datasets List */}
          <div className="lg:col-span-1 space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              {t.import.uploadedDatasets} ({rawDatasets.length})
            </h3>

            <div className="space-y-2">
              {rawDatasets.map(ds => {
                const isSelected = currentDataset?.id === ds.id;
                return (
                  <div
                    key={ds.id}
                    onClick={() => setSelectedDatasetId(ds.id)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 text-blue-900 dark:text-white shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <FileSpreadsheet
                        className={`w-5 h-5 shrink-0 ${
                          isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'
                        }`}
                      />
                      <div className="truncate">
                        <p className="text-sm font-semibold truncate">{ds.name}</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 capitalize">
                          {ds.type} • {ds.rows.length} rows • {(ds.fileSize / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={e => {
                        e.stopPropagation();
                        removeRawDataset(ds.id);
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                      title="Remove file"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Column Mapping & Preview for Selected Dataset */}
          {currentDataset && (
            <div className="lg:col-span-2 space-y-6">
              {/* Mapping Box */}
              <div className="bg-white dark:bg-slate-850 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4 text-blue-600" />
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {t.import.mapColumns}: {currentDataset.name}
                    </h3>
                  </div>

                  {/* Dataset Type Selector */}
                  <select
                    value={currentDataset.type}
                    onChange={e => {
                      const updated = {
                        ...currentDataset,
                        type: e.target.value as DatasetType,
                      };
                      addRawDataset(updated);
                    }}
                    className="text-xs font-semibold bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer"
                  >
                    <option value="sales">{t.import.sales}</option>
                    <option value="expenses">{t.import.expenses}</option>
                    <option value="inventory">{t.import.inventory}</option>
                    <option value="customers">{t.import.customers}</option>
                  </select>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {t.import.mappingDescription}
                </p>

                {/* Mapping Grid */}
                <div className="space-y-2.5">
                  {(STANDARD_FIELDS[currentDataset.type] || []).map(fieldDef => {
                    const currentMatch = currentDataset.mapping[fieldDef.field] || '';
                    const sampleVal =
                      currentMatch && currentDataset.rows[0]
                        ? currentDataset.rows[0][currentMatch]
                        : null;

                    return (
                      <div
                        key={fieldDef.field}
                        className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                      >
                        <div className="sm:w-1/3">
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {fieldDef.label}
                          </span>
                          {fieldDef.required && (
                            <span className="text-rose-500 ml-1 font-bold">*</span>
                          )}
                        </div>

                        {/* Select source column */}
                        <div className="sm:w-1/3">
                          <select
                            value={currentMatch}
                            onChange={e => {
                              updateColumnMapping(currentDataset.id, {
                                [fieldDef.field]: e.target.value,
                              });
                            }}
                            className="w-full bg-white dark:bg-slate-850 px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 font-medium text-slate-900 dark:text-slate-100 cursor-pointer"
                          >
                            <option value="">{t.import.selectColumn}</option>
                            {currentDataset.headers.map(h => (
                              <option key={h} value={h}>
                                {h}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Sample Value Preview */}
                        <div className="sm:w-1/3 text-slate-500 dark:text-slate-400 truncate font-mono text-[11px]">
                          {sampleVal !== null && sampleVal !== undefined ? (
                            <span className="bg-slate-200/60 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                              Ex: {String(sampleVal).slice(0, 20)}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">No mapping</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Data Table Preview (First 5 rows) */}
              <div className="bg-white dark:bg-slate-850 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
                <div className="flex items-center gap-2">
                  <TableIcon className="w-4 h-4 text-blue-600" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {t.import.previewRows} ({Math.min(5, currentDataset.rows.length)} of {currentDataset.rows.length})
                  </h3>
                </div>

                <div className="overflow-x-auto max-h-60 rounded-xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-bold sticky top-0">
                      <tr>
                        {currentDataset.headers.map(h => (
                          <th key={h} className="p-2.5 border-b border-slate-200 dark:border-slate-800 whitespace-nowrap">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {currentDataset.rows.slice(0, 5).map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 font-mono text-[11px]">
                          {currentDataset.headers.map(h => (
                            <td key={h} className="p-2 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                              {String(row[h] ?? '')}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Proceed to Data Cleaning Action Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md shadow-blue-500/20">
                <div>
                  <h4 className="font-bold text-sm sm:text-base">
                    {t.import.readyToClean}
                  </h4>
                  <p className="text-xs text-blue-100 mt-0.5">
                    Our deterministic cleaning engine will deduplicate, sanitize numbers and dates, and audit rows.
                  </p>
                </div>

                <button
                  onClick={() => setActiveTab('cleaning')}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white text-blue-700 font-bold text-xs sm:text-sm hover:bg-blue-50 active:scale-95 transition-all shadow-sm cursor-pointer shrink-0"
                >
                  <span>{t.import.gotoCleaning}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
