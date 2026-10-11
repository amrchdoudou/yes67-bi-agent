import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { DatasetType, StandardField } from '../types';

/**
 * Fuzzy column dictionary across English, French, and Arabic
 */
export const FUZZY_MAPPING_DICTIONARY: Record<StandardField, string[]> = {
  date: [
    'date', 'order date', 'order_date', 'sale date', 'transaction date', 'invoice date',
    'date commande', 'date de vente', 'date_commande', 'date_vente',
    'تاريخ', 'التاريخ', 'تاريخ الطلب', 'تاريخ الفاتورة', 'تاريخ العملية'
  ],
  product: [
    'product', 'product name', 'product_name', 'item', 'item name', 'sku name', 'title',
    'produit', 'nom produit', 'nom du produit', 'article', 'designation', 'désignation',
    'المنتج', 'اسم المنتج', 'الصنف', 'المادة', 'اسم الصنف'
  ],
  category: [
    'category', 'product category', 'cat', 'segment', 'type', 'group',
    'categorie', 'catégorie', 'famille', 'rayon',
    'الفئة', 'التصنيف', 'القسم', 'نوع المنتج'
  ],
  quantity: [
    'quantity', 'qty', 'count', 'units', 'volume', 'pieces',
    'quantite', 'quantité', 'qte', 'qté', 'nombre',
    'الكمية', 'عدد', 'العدد', 'الكميه', 'الوحدات'
  ],
  unit_price: [
    'price', 'unit price', 'unit_price', 'rate', 'selling price',
    'prix', 'prix unitaire', 'pu', 'pu ht', 'prix_unitaire',
    'السعر', 'سعر الوحدة', 'السعر الإفرادي', 'سعر البيع'
  ],
  unit_cost: [
    'cost', 'unit cost', 'unit_cost', 'cogs', 'purchase price', 'buying price',
    'cout', 'coût', 'cout unitaire', 'coût unitaire', 'prix achat', 'prix d achat',
    'التكلفة', 'تكلفة الوحدة', 'سعر الشراء', 'التكلفه'
  ],
  total_amount: [
    'amount', 'total', 'total amount', 'total_amount', 'revenue', 'sum', 'net amount',
    'montant', 'total ttc', 'total ht', 'chiffre daffaire', 'valeur',
    'المبلغ', 'الإجمالي', 'المجموع', 'القيمة', 'صافي المبلغ'
  ],
  customer: [
    'customer', 'customer name', 'client', 'client name', 'account', 'buyer', 'company',
    'nom client', 'nom du client', 'raison sociale', 'acheteur',
    'العميل', 'اسم العميل', 'الزبون', 'اسم الزبون', 'المشتري', 'الشركة'
  ],
  region: [
    'region', 'zone', 'area', 'territory', 'location', 'city', 'country', 'state',
    'région', 'region', 'zone geographique', 'secteur', 'territoire', 'ville',
    'المنطقة', 'الإقليم', 'المحافظة', 'الولاية', 'المدينة', 'الموقع'
  ],
  order_id: [
    'order id', 'order_id', 'order number', 'invoice', 'invoice no', 'ref', 'reference',
    'numero commande', 'n commande', 'numéro de commande', 'facture', 'n facture',
    'رقم الطلب', 'معرف الطلب', 'رقم الفاتورة', 'المرجع'
  ],
  expense_category: [
    'expense category', 'category', 'expense type', 'cost center',
    'categorie depense', 'catégorie dépense', 'poste', 'rubrique',
    'فئة المصروف', 'نوع المصروف', 'بند المصروف', 'مركز التكلفة'
  ],
  expense_description: [
    'description', 'expense description', 'memo', 'details', 'notes', 'purpose',
    'libelle', 'libellé', 'intitule', 'intitulé', 'motif', 'details',
    'الوصف', 'البيان', 'التفاصيل', 'ملاحظات', 'الغرض'
  ],
  stock_quantity: [
    'stock', 'stock quantity', 'in stock', 'quantity available', 'on hand', 'units in stock',
    'qte stock', 'quantite en stock', 'stock actuel', 'disponible',
    'المخزون', 'كمية المخزون', 'المتاح في المستودع', 'الرصيد'
  ],
  min_stock: [
    'min stock', 'safety stock', 'minimum stock', 'reorder level', 'reorder point',
    'stock minimum', 'seuil alerte', 'stock de securite', 'seuil',
    'الحد الأدنى', 'مخزون الأمان', 'نقطة إعادة الطلب', 'حد الإنذار'
  ],
  supplier: [
    'supplier', 'vendor', 'provider', 'manufacturer',
    'fournisseur', 'prestataire', 'fabricant',
    'المورد', 'المزود', 'المصنع'
  ],
};

/**
 * Clean string for fuzzy comparison
 */
function normalizeHeaderName(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\u0621-\u064A]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Find best matching column for a standard field
 */
export function suggestColumnMatch(
  field: StandardField,
  headers: string[]
): string | null {
  const dictionary = FUZZY_MAPPING_DICTIONARY[field] || [];
  const normalizedHeaders = headers.map(h => ({
    original: h,
    normalized: normalizeHeaderName(h),
  }));

  // 1. Exact match
  for (const nh of normalizedHeaders) {
    if (dictionary.some(d => normalizeHeaderName(d) === nh.normalized)) {
      return nh.original;
    }
  }

  // 2. Partial substring inclusion match
  for (const nh of normalizedHeaders) {
    if (dictionary.some(d => nh.normalized.includes(normalizeHeaderName(d)) || normalizeHeaderName(d).includes(nh.normalized))) {
      return nh.original;
    }
  }

  return null;
}

/**
 * Detect dataset type from column headers
 */
export function detectDatasetType(headers: string[]): DatasetType {
  const normalized = headers.map(h => normalizeHeaderName(h)).join(' ');

  if (
    normalized.includes('stock') ||
    normalized.includes('inventaire') ||
    normalized.includes('sku') ||
    normalized.includes('safety') ||
    normalized.includes('مخزون')
  ) {
    return 'inventory';
  }

  if (
    normalized.includes('depense') ||
    normalized.includes('expense') ||
    normalized.includes('invoice') ||
    normalized.includes('facture') ||
    normalized.includes('مصروف')
  ) {
    return 'expenses';
  }

  if (
    normalized.includes('tier') ||
    normalized.includes('customer directory') ||
    (normalized.includes('client') && !normalized.includes('order') && !normalized.includes('vente') && !normalized.includes('price'))
  ) {
    return 'customers';
  }

  // Default to sales
  return 'sales';
}

/**
 * Parse CSV file into rows using PapaParse
 */
export async function parseCsvFile(file: File): Promise<{ headers: string[]; rows: Record<string, any>[] }> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: 'greedy',
      transformHeader: h => h.trim(),
      complete: results => {
        const headers = results.meta.fields || [];
        resolve({ headers, rows: results.data as Record<string, any>[] });
      },
      error: err => reject(err),
    });
  });
}

/**
 * Parse Excel file into rows using SheetJS
 */
export async function parseExcelFile(file: File): Promise<{ headers: string[]; rows: Record<string, any>[] }> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: '' });

  if (jsonData.length === 0) {
    return { headers: [], rows: [] };
  }

  const headers = Object.keys(jsonData[0]);
  return { headers, rows: jsonData };
}

/**
 * Unified file parser supporting both CSV and Excel (.xlsx, .xls)
 */
export async function parseUploadedFile(file: File): Promise<{
  fileName: string;
  fileSize: number;
  headers: string[];
  rows: Record<string, any>[];
  detectedType: DatasetType;
  suggestedMapping: Record<string, string>;
}> {
  const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
  const result = isExcel ? await parseExcelFile(file) : await parseCsvFile(file);

  const detectedType = detectDatasetType(result.headers);

  // Generate suggested mappings based on detected type
  const suggestedMapping: Record<string, string> = {};
  const relevantFields: StandardField[] =
    detectedType === 'sales'
      ? ['order_id', 'date', 'product', 'category', 'quantity', 'unit_price', 'unit_cost', 'customer', 'region']
      : detectedType === 'expenses'
      ? ['date', 'expense_category', 'expense_description', 'total_amount']
      : detectedType === 'inventory'
      ? ['product', 'category', 'stock_quantity', 'min_stock', 'unit_cost']
      : ['customer', 'region'];

  for (const field of relevantFields) {
    const match = suggestColumnMatch(field, result.headers);
    if (match) {
      suggestedMapping[field] = match;
    }
  }

  return {
    fileName: file.name,
    fileSize: file.size,
    headers: result.headers,
    rows: result.rows,
    detectedType,
    suggestedMapping,
  };
}
