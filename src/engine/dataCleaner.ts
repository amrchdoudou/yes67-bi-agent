import {
  CleaningOptions,
  CleaningReport,
  CleanedSalesRecord,
  CleanedExpenseRecord,
  CleanedInventoryRecord,
  CleanedCustomerRecord,
  RawDataset,
} from '../types';

export const DEFAULT_CLEANING_OPTIONS: CleaningOptions = {
  removeDuplicates: true,
  trimWhitespace: true,
  standardizeDates: true,
  sanitizeNumbers: true,
  normalizeTextCase: true,
  missingValueAction: 'fill_median',
  flagInvalidRows: true,
  maxFutureDays: 1,
};

/**
 * Parses numeric values safely from strings with currencies, thousand separators, commas.
 */
export function sanitizeNumber(value: any, fallback = 0): { num: number; modified: boolean } {
  if (value === null || value === undefined || value === '') {
    return { num: fallback, modified: false };
  }
  if (typeof value === 'number') {
    return { num: isNaN(value) ? fallback : value, modified: false };
  }

  const originalStr = String(value);
  // Remove currency signs, spaces, common formatting without removing decimal dots
  let clean = originalStr
    .replace(/[$€£¥₹\s\u00A0]/g, '')
    .replace(/(DA|دج|SAR|ر\.س)/gi, '')
    .trim();

  // Handle European number format "1.250,50" -> "1250.50"
  if (clean.includes('.') && clean.includes(',')) {
    if (clean.indexOf('.') < clean.indexOf(',')) {
      // 1.250,50
      clean = clean.replace(/\./g, '').replace(',', '.');
    } else {
      // 1,250.50
      clean = clean.replace(/,/g, '');
    }
  } else if (clean.includes(',')) {
    // Single comma: could be 1250,50 or 1,250
    // If followed by 1 or 2 digits, usually decimal: 50,5 -> 50.5
    // If followed by 3 digits, usually thousand: 1,250 -> 1250
    const parts = clean.split(',');
    if (parts.length === 2 && parts[1].length !== 3) {
      clean = parts[0] + '.' + parts[1];
    } else {
      clean = clean.replace(/,/g, '');
    }
  }

  const parsed = parseFloat(clean);
  const isValid = !isNaN(parsed) && isFinite(parsed);
  return {
    num: isValid ? parsed : fallback,
    modified: isValid && clean !== originalStr,
  };
}

/**
 * Standardizes dates into ISO 'YYYY-MM-DD'.
 * Handles Excel serial numbers (e.g. 45200), ISO, DD/MM/YYYY, MM/DD/YYYY, and Arabic digits.
 */
export function sanitizeDate(value: any): { dateStr: string | null; modified: boolean } {
  if (!value) return { dateStr: null, modified: false };

  // Handle Excel date serial number (e.g. 45000 is ~2023)
  if (typeof value === 'number' && value > 20000 && value < 70000) {
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const d = new Date(excelEpoch.getTime() + value * 86400000);
    return { dateStr: d.toISOString().split('T')[0], modified: true };
  }

  let str = String(value).trim();
  // Convert Eastern Arabic numerals to Western
  str = str.replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString());

  // Check if already ISO YYYY-MM-DD
  const isoMatch = str.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (isoMatch) {
    const y = isoMatch[1];
    const m = isoMatch[2].padStart(2, '0');
    const d = isoMatch[3].padStart(2, '0');
    return { dateStr: `${y}-${m}-${d}`, modified: str !== `${y}-${m}-${d}` };
  }

  // Check DD/MM/YYYY or DD-MM-YYYY
  const euMatch = str.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
  if (euMatch) {
    const d = euMatch[1].padStart(2, '0');
    const m = euMatch[2].padStart(2, '0');
    const y = euMatch[3];
    return { dateStr: `${y}-${m}-${d}`, modified: true };
  }

  // Native Date parsing fallback
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    return { dateStr: parsed.toISOString().split('T')[0], modified: true };
  }

  return { dateStr: null, modified: false };
}

/**
 * Clean string text: trim whitespace, collapse multi-spaces, format cleanly.
 */
export function sanitizeText(val: any): string {
  if (val === null || val === undefined) return '';
  return String(val)
    .trim()
    .replace(/\s+/g, ' ');
}

/**
 * Computes median of an array of numbers.
 */
function calculateMedian(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  const sorted = [...numbers].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * Deterministically cleans and validates raw datasets according to chosen options.
 */
export function cleanDataset(
  dataset: RawDataset,
  options: CleaningOptions = DEFAULT_CLEANING_OPTIONS
): {
  cleanedRows: any[];
  report: CleaningReport;
} {
  const { type, rows, mapping } = dataset;
  const totalRowsOriginal = rows.length;

  let duplicatesRemoved = 0;
  let valuesFixed = 0;
  let missingValuesHandled = 0;
  const rejectedReasons: CleaningReport['rejectedReasons'] = [];

  const seenKeys = new Set<string>();
  const validIntermediateRows: any[] = [];

  const today = new Date();
  const maxFutureAllowed = new Date(today.getTime() + options.maxFutureDays * 86400000);

  // Collect numeric arrays for median imputation
  const quantityValues: number[] = [];
  const priceValues: number[] = [];
  const costValues: number[] = [];
  const amountValues: number[] = [];

  // Pass 1: Deduplication & Raw Field Extraction
  for (let idx = 0; idx < rows.length; idx++) {
    const raw = rows[idx];

    // Check exact duplicate across all mapped values
    if (options.removeDuplicates) {
      const rowSignature = Object.keys(mapping)
        .map(k => `${k}:${String(raw[mapping[k]] || '').trim()}`)
        .join('|');
      if (seenKeys.has(rowSignature)) {
        duplicatesRemoved++;
        continue;
      }
      seenKeys.add(rowSignature);
    }

    validIntermediateRows.push({ raw, originalIdx: idx });

    // Collect numeric values for imputation stats
    if (mapping.quantity && raw[mapping.quantity]) {
      const q = sanitizeNumber(raw[mapping.quantity]).num;
      if (q > 0) quantityValues.push(q);
    }
    if (mapping.unit_price && raw[mapping.unit_price]) {
      const p = sanitizeNumber(raw[mapping.unit_price]).num;
      if (p > 0) priceValues.push(p);
    }
    if (mapping.unit_cost && raw[mapping.unit_cost]) {
      const c = sanitizeNumber(raw[mapping.unit_cost]).num;
      if (c > 0) costValues.push(c);
    }
    if (mapping.total_amount && raw[mapping.total_amount]) {
      const a = sanitizeNumber(raw[mapping.total_amount]).num;
      if (a > 0) amountValues.push(a);
    }
  }

  const medianQuantity = calculateMedian(quantityValues) || 1;
  const medianPrice = calculateMedian(priceValues) || 10;
  const medianCost = calculateMedian(costValues) || 5;
  const medianAmount = calculateMedian(amountValues) || 50;

  const finalCleanedRows: any[] = [];

  // Pass 2: Field Standardization, Missing Value Handling & Validation
  for (const item of validIntermediateRows) {
    const { raw, originalIdx } = item;
    let isRowRejected = false;
    let rejectionReason = '';

    if (type === 'sales') {
      const rawDate = mapping.date ? raw[mapping.date] : null;
      const rawProduct = mapping.product ? raw[mapping.product] : null;
      const rawQty = mapping.quantity ? raw[mapping.quantity] : null;
      const rawPrice = mapping.unit_price ? raw[mapping.unit_price] : null;
      const rawCost = mapping.unit_cost ? raw[mapping.unit_cost] : null;
      const rawCustomer = mapping.customer ? raw[mapping.customer] : null;
      const rawRegion = mapping.region ? raw[mapping.region] : null;
      const rawOrderId = mapping.order_id ? raw[mapping.order_id] : null;
      const rawCategory = mapping.category ? raw[mapping.category] : null;

      // Date check
      let { dateStr, modified: dateMod } = sanitizeDate(rawDate);
      if (dateMod) valuesFixed++;

      if (!dateStr) {
        if (options.missingValueAction === 'drop') {
          isRowRejected = true;
          rejectionReason = 'Missing or invalid transaction date';
        } else {
          dateStr = new Date().toISOString().split('T')[0];
          missingValuesHandled++;
        }
      } else if (options.flagInvalidRows) {
        const dObj = new Date(dateStr);
        if (dObj > maxFutureAllowed) {
          isRowRejected = true;
          rejectionReason = `Future transaction date detected (${dateStr})`;
        }
      }

      // Product check
      let product = sanitizeText(rawProduct);
      if (!product) {
        if (options.missingValueAction === 'drop') {
          isRowRejected = true;
          rejectionReason = rejectionReason || 'Missing product description';
        } else {
          product = 'Unspecified Product';
          missingValuesHandled++;
        }
      }

      // Quantity check
      let qtyResult = sanitizeNumber(rawQty, options.missingValueAction === 'fill_median' ? medianQuantity : 1);
      if (qtyResult.modified) valuesFixed++;
      let quantity = qtyResult.num;

      if (rawQty === null || rawQty === undefined || rawQty === '') {
        missingValuesHandled++;
      }

      if (options.flagInvalidRows && quantity <= 0) {
        isRowRejected = true;
        rejectionReason = rejectionReason || `Invalid non-positive quantity (${quantity})`;
      }

      // Price & Cost check
      let priceResult = sanitizeNumber(rawPrice, options.missingValueAction === 'fill_median' ? medianPrice : 0);
      if (priceResult.modified) valuesFixed++;
      let unitPrice = priceResult.num;

      if (options.flagInvalidRows && unitPrice < 0) {
        isRowRejected = true;
        rejectionReason = rejectionReason || `Negative unit price (${unitPrice})`;
      }

      let costResult = sanitizeNumber(rawCost, options.missingValueAction === 'fill_median' ? medianCost : unitPrice * 0.6);
      if (costResult.modified) valuesFixed++;
      let unitCost = costResult.num;
      if (unitCost < 0) unitCost = 0;

      // Revenue and Profit
      const revenue = Math.round(quantity * unitPrice * 100) / 100;
      const cost = Math.round(quantity * unitCost * 100) / 100;
      const profit = Math.round((revenue - cost) * 100) / 100;

      const customer = sanitizeText(rawCustomer) || 'Direct Retail';
      const region = sanitizeText(rawRegion) || 'Central';
      const category = sanitizeText(rawCategory) || 'General';
      const orderId = sanitizeText(rawOrderId) || `ORD-${originalIdx + 1000}`;

      if (isRowRejected) {
        rejectedReasons.push({
          rowIndex: originalIdx + 1,
          reason: rejectionReason,
          rowData: raw,
        });
      } else {
        const cleaned: CleanedSalesRecord = {
          orderId,
          date: dateStr!,
          product,
          category,
          quantity,
          unitPrice,
          unitCost,
          revenue,
          cost,
          profit,
          customer,
          region,
        };
        finalCleanedRows.push(cleaned);
      }
    } else if (type === 'expenses') {
      const rawDate = mapping.date ? raw[mapping.date] : null;
      const rawCategory = mapping.expense_category ? raw[mapping.expense_category] : null;
      const rawDesc = mapping.expense_description ? raw[mapping.expense_description] : null;
      const rawAmount = mapping.total_amount ? raw[mapping.total_amount] : null;

      let { dateStr, modified: dateMod } = sanitizeDate(rawDate);
      if (dateMod) valuesFixed++;
      if (!dateStr) {
        dateStr = new Date().toISOString().split('T')[0];
        missingValuesHandled++;
      }

      const category = sanitizeText(rawCategory) || 'Operations';
      const description = sanitizeText(rawDesc) || 'General Expense';

      const amountRes = sanitizeNumber(rawAmount, options.missingValueAction === 'fill_median' ? medianAmount : 0);
      if (amountRes.modified) valuesFixed++;
      const amount = Math.abs(amountRes.num);

      if (amount <= 0 && options.missingValueAction === 'drop') {
        rejectedReasons.push({
          rowIndex: originalIdx + 1,
          reason: 'Zero or invalid expense amount',
          rowData: raw,
        });
      } else {
        const cleaned: CleanedExpenseRecord = {
          id: `EXP-${originalIdx + 1000}`,
          date: dateStr,
          category,
          description,
          amount: Math.round(amount * 100) / 100,
        };
        finalCleanedRows.push(cleaned);
      }
    } else if (type === 'inventory') {
      const rawProduct = mapping.product ? raw[mapping.product] : null;
      const rawCategory = mapping.category ? raw[mapping.category] : null;
      const rawStock = mapping.stock_quantity ? raw[mapping.stock_quantity] : null;
      const rawMinStock = mapping.min_stock ? raw[mapping.min_stock] : null;
      const rawCost = mapping.unit_cost ? raw[mapping.unit_cost] : null;

      const product = sanitizeText(rawProduct);
      if (!product) {
        rejectedReasons.push({
          rowIndex: originalIdx + 1,
          reason: 'Missing inventory product SKU or title',
          rowData: raw,
        });
        continue;
      }

      const stockRes = sanitizeNumber(rawStock, 0);
      const minStockRes = sanitizeNumber(rawMinStock, 10);
      const costRes = sanitizeNumber(rawCost, 0);

      const stockQuantity = Math.max(0, stockRes.num);
      const minStock = Math.max(0, minStockRes.num);
      const unitCost = Math.max(0, costRes.num);
      const stockValue = Math.round(stockQuantity * unitCost * 100) / 100;

      const cleaned: CleanedInventoryRecord = {
        id: `INV-${originalIdx + 1000}`,
        product,
        category: sanitizeText(rawCategory) || 'General',
        stockQuantity,
        minStock,
        unitCost,
        stockValue,
      };
      finalCleanedRows.push(cleaned);
    } else if (type === 'customers') {
      const rawName = mapping.customer ? raw[mapping.customer] : null;
      const rawRegion = mapping.region ? raw[mapping.region] : null;
      const name = sanitizeText(rawName);

      if (!name) {
        rejectedReasons.push({
          rowIndex: originalIdx + 1,
          reason: 'Missing customer name or identifier',
          rowData: raw,
        });
        continue;
      }

      const cleaned: CleanedCustomerRecord = {
        id: `CUST-${originalIdx + 1000}`,
        name,
        region: sanitizeText(rawRegion) || 'Central',
        type: 'Standard',
      };
      finalCleanedRows.push(cleaned);
    }
  }

  const report: CleaningReport = {
    datasetId: dataset.id,
    datasetName: dataset.name,
    totalRowsOriginal,
    totalRowsCleaned: finalCleanedRows.length,
    duplicatesRemoved,
    valuesFixed,
    missingValuesHandled,
    rowsRejected: rejectedReasons.length,
    rejectedReasons,
    cleanedAt: new Date().toISOString(),
  };

  return { cleanedRows: finalCleanedRows, report };
}
