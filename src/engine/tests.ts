import { sanitizeNumber, sanitizeDate, cleanDataset, DEFAULT_CLEANING_OPTIONS } from './dataCleaner';
import { computeKPIs } from './kpiEngine';
import { detectAnomalies } from './anomalyEngine';
import { generateDemoDatasets } from './demoData';
import { CleanedSalesRecord } from '../types';

let passed = 0;
let failed = 0;

function assert(description: string, condition: boolean, details?: string) {
  if (condition) {
    passed++;
    console.log(`  ✓ ${description}`);
  } else {
    failed++;
    console.error(`  ✗ FAIL: ${description} ${details ? `(${details})` : ''}`);
  }
}

function runTests() {
  console.log('\n--- Running Yes67 BI Agent Deterministic Engine Tests ---\n');

  // Test 1: Number Sanitization
  console.log('Testing sanitizeNumber:');
  assert('Parses clean integers', sanitizeNumber(1250).num === 1250);
  assert('Parses US currency string "$1,250.50"', sanitizeNumber('$1,250.50').num === 1250.5);
  assert('Parses European currency string "2 350,75 €"', sanitizeNumber('2 350,75 €').num === 2350.75);
  assert('Handles Arabic currency "150 دج"', sanitizeNumber('150 دج').num === 150);
  assert('Handles null with fallback', sanitizeNumber(null, 10).num === 10);

  // Test 2: Date Sanitization
  console.log('\nTesting sanitizeDate:');
  assert('Handles ISO date "2024-05-18"', sanitizeDate('2024-05-18').dateStr === '2024-05-18');
  assert('Standardizes EU date "25/11/2024"', sanitizeDate('25/11/2024').dateStr === '2024-11-25');
  assert('Standardizes slash date "2024/03/09"', sanitizeDate('2024/03/09').dateStr === '2024-03-09');
  assert('Flags invalid date string as null', sanitizeDate('not-a-date').dateStr === null);

  // Test 3: Data Cleaning on Demo Data
  console.log('\nTesting Data Cleaner on Injected Dirty Data:');
  const demo = generateDemoDatasets();
  const salesCleanResult = cleanDataset(demo.sales, DEFAULT_CLEANING_OPTIONS);

  assert(
    'Identified and removed exact duplicates',
    salesCleanResult.report.duplicatesRemoved >= 4,
    `Removed: ${salesCleanResult.report.duplicatesRemoved}`
  );
  assert(
    'Rejected invalid negative/future rows',
    salesCleanResult.report.rowsRejected >= 3,
    `Rejected: ${salesCleanResult.report.rowsRejected}`
  );
  assert(
    'Sanitized numeric and date values',
    salesCleanResult.report.valuesFixed > 0,
    `Fixed: ${salesCleanResult.report.valuesFixed}`
  );
  assert(
    'All cleaned rows have positive revenue',
    salesCleanResult.cleanedRows.every(r => r.revenue >= 0)
  );

  // Test 4: KPI Engine
  console.log('\nTesting Deterministic KPI Engine:');
  const sampleSales: CleanedSalesRecord[] = [
    {
      orderId: 'SO-1',
      date: '2024-01-10',
      product: 'Laptop',
      category: 'Hardware',
      quantity: 2,
      unitPrice: 1000,
      unitCost: 600,
      revenue: 2000,
      cost: 1200,
      profit: 800,
      customer: 'Acme Corp',
      region: 'North',
    },
    {
      orderId: 'SO-2',
      date: '2024-01-15',
      product: 'Mouse',
      category: 'Accessories',
      quantity: 5,
      unitPrice: 40,
      unitCost: 20,
      revenue: 200,
      cost: 100,
      profit: 100,
      customer: 'Beta LLC',
      region: 'South',
    },
  ];

  const kpis = computeKPIs(sampleSales, [], [], [], '$');
  assert('Total revenue is exact sum (2200)', kpis.totalRevenue === 2200);
  assert('Gross profit is exact sum (900)', kpis.grossProfit === 900);
  assert('Gross margin % matches (40.9%)', kpis.grossMarginPct === 40.9, `Got: ${kpis.grossMarginPct}`);
  assert('Total orders count is 2', kpis.orderCount === 2);
  assert('Average Order Value is 1100', kpis.aov === 1100);
  assert('Active customers count is 2', kpis.activeCustomerCount === 2);

  // Test 5: Anomaly Engine
  console.log('\nTesting Anomaly Engine on Cleaned Demo Data:');
  const expCleanResult = cleanDataset(demo.expenses, DEFAULT_CLEANING_OPTIONS);
  const invCleanResult = cleanDataset(demo.inventory, DEFAULT_CLEANING_OPTIONS);
  const fullKpis = computeKPIs(salesCleanResult.cleanedRows, expCleanResult.cleanedRows, invCleanResult.cleanedRows);
  const anomalyResults = detectAnomalies(fullKpis, salesCleanResult.cleanedRows, expCleanResult.cleanedRows);

  const spike = anomalyResults.anomalies.find(a => a.type === 'spike');
  assert('Detected November sales spike anomaly', !!spike, spike?.title);

  const drop = anomalyResults.anomalies.find(a => a.type === 'drop');
  assert('Detected February sales drop anomaly', !!drop, drop?.title);

  const unusualExp = anomalyResults.anomalies.find(a => a.type === 'unusual_expense');
  assert('Detected July software expense surge', !!unusualExp, unusualExp?.title);

  const stockout = anomalyResults.anomalies.find(a => a.type === 'stockout_risk');
  assert('Detected critical stockout risk', !!stockout, stockout?.title);

  const overstock = anomalyResults.anomalies.find(a => a.type === 'overstock_risk');
  assert('Detected excess overstock risk', !!overstock, overstock?.title);

  assert('Produced deterministic forecast periods', anomalyResults.trendAnalysis.forecasts.length === 3);

  console.log(`\nTest Summary: ${passed} Passed, ${failed} Failed.`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
