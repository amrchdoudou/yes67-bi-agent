import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  ComputedKPIs,
  CleanedDataState,
  AnomalyItem,
  CompanySettings,
  AIInsightsResponse,
} from '../types';

/**
 * Exports all SME BI data into a formatted multi-sheet Excel (.xlsx) workbook
 */
export function exportToExcel(
  companyName: string,
  kpis: ComputedKPIs,
  cleanedData: CleanedDataState,
  anomalies: AnomalyItem[]
) {
  const wb = XLSX.utils.book_new();

  // 1. KPI Summary Sheet
  const kpiData = [
    ['Yes67 BI Agent — SME Executive Performance Summary'],
    ['Company:', companyName],
    ['Report Date:', new Date().toISOString().split('T')[0]],
    [''],
    ['Metric Name', 'Computed Value', 'Previous / Benchmark', 'Period Change'],
    ...kpis.kpiCards.map(c => [c.title, c.formattedValue, c.previousValue || 'N/A', `${c.changePct}%`]),
    [''],
    ['Top 5 Products by Revenue', 'Category', 'Revenue', 'Units Sold', 'Profit Margin %'],
    ...kpis.topProductsByRevenue.map(p => [p.product, p.category, p.revenue, p.quantity, `${p.marginPct}%`]),
    [''],
    ['Regional Performance', 'Revenue', 'Orders', 'Revenue Share %'],
    ...kpis.revenueByRegion.map(r => [r.region, r.revenue, r.orders, `${r.sharePct}%`]),
  ];
  const wsKpis = XLSX.utils.aoa_to_sheet(kpiData);
  XLSX.utils.book_append_sheet(wb, wsKpis, 'KPI Summary');

  // 2. Cleaned Sales Sheet
  if (cleanedData.sales.length > 0) {
    const wsSales = XLSX.utils.json_to_sheet(cleanedData.sales);
    XLSX.utils.book_append_sheet(wb, wsSales, 'Cleaned Sales');
  }

  // 3. Cleaned Expenses Sheet
  if (cleanedData.expenses.length > 0) {
    const wsExp = XLSX.utils.json_to_sheet(cleanedData.expenses);
    XLSX.utils.book_append_sheet(wb, wsExp, 'Cleaned Expenses');
  }

  // 4. Inventory Sheet
  if (cleanedData.inventory.length > 0) {
    const wsInv = XLSX.utils.json_to_sheet(cleanedData.inventory);
    XLSX.utils.book_append_sheet(wb, wsInv, 'Inventory & Stock');
  }

  // 5. Anomalies & Alerts Sheet
  if (anomalies.length > 0) {
    const anomalyExport = anomalies.map(a => ({
      ID: a.id,
      Severity: a.severity.toUpperCase(),
      Title: a.title,
      Metric: a.metric,
      Baseline: a.baselineValue,
      Actual: a.actualValue,
      ZScore: a.zScore || 'N/A',
      Description: a.description,
      Recommendation: a.recommendation || '',
    }));
    const wsAlerts = XLSX.utils.json_to_sheet(anomalyExport);
    XLSX.utils.book_append_sheet(wb, wsAlerts, 'Anomalies & Alerts');
  }

  // Trigger file download
  const cleanName = companyName.replace(/[^a-zA-Z0-9]/g, '_');
  XLSX.writeFile(wb, `${cleanName}_BI_Executive_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
}

/**
 * Exports executive PDF report with cover, KPI tables, alerts, and AI insights
 */
export function exportToPDF(
  settings: CompanySettings,
  kpis: ComputedKPIs,
  anomalies: AnomalyItem[],
  insights?: AIInsightsResponse | null
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const primaryColor = [15, 23, 42]; // Slate 900
  const accentColor = [37, 99, 235]; // Blue 600

  // Header Banner
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, pageWidth, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('YES67 BI AGENT — EXECUTIVE REPORT', 14, 13);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(203, 213, 225);
  doc.text(`Company: ${settings.name}  |  Generated: ${new Date().toLocaleDateString()}  |  Currency: ${settings.currencySymbol}`, 14, 21);

  let currentY = 36;

  // AI Executive Summary
  if (insights?.executiveSummary) {
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('1. AI Strategic Executive Summary', 14, currentY);

    currentY += 5;
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, currentY, pageWidth - 28, 22, 2, 2, 'FD');

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    const splitSummary = doc.splitTextToSize(insights.executiveSummary, pageWidth - 34);
    doc.text(splitSummary, 17, currentY + 5);

    currentY += 28;
  }

  // Key Performance Indicators Table
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('2. Core Performance Metrics (Deterministic Engine)', 14, currentY);
  currentY += 4;

  const kpiTableBody = [
    [
      'Total Revenue',
      kpis.kpiCards.find(k => k.id === 'total_revenue')?.formattedValue || '$0',
      'Gross Profit',
      kpis.kpiCards.find(k => k.id === 'gross_profit')?.formattedValue || '$0',
    ],
    [
      'Gross Margin %',
      `${kpis.grossMarginPct}%`,
      'Total Expenses',
      kpis.kpiCards.find(k => k.id === 'total_expenses')?.formattedValue || '$0',
    ],
    [
      'Net Profit',
      kpis.kpiCards.find(k => k.id === 'net_profit')?.formattedValue || '$0',
      'Net Margin %',
      `${kpis.netMarginPct}%`,
    ],
    [
      'Total Orders',
      kpis.orderCount.toLocaleString(),
      'Avg Order Value',
      `${settings.currencySymbol}${kpis.aov.toFixed(2)}`,
    ],
    [
      'Active Customers',
      kpis.activeCustomerCount.toLocaleString(),
      'MoM Growth Rate',
      `${kpis.momGrowthPct > 0 ? '+' : ''}${kpis.momGrowthPct}%`,
    ],
  ];

  autoTable(doc, {
    startY: currentY,
    head: [['Metric', 'Value', 'Metric', 'Value']],
    body: kpiTableBody,
    theme: 'grid',
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontSize: 8.5 },
    styles: { fontSize: 8, cellPadding: 2.5 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 45 },
      1: { textColor: [15, 23, 42], cellWidth: 45 },
      2: { fontStyle: 'bold', cellWidth: 45 },
      3: { textColor: [15, 23, 42], cellWidth: 45 },
    },
  });

  currentY = (doc as any).lastAutoTable.finalY + 10;

  // Top Products Table
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('3. Top Products Performance', 14, currentY);
  currentY += 4;

  const productRows = kpis.topProductsByRevenue.slice(0, 5).map(p => [
    p.product,
    p.category,
    `${settings.currencySymbol}${p.revenue.toLocaleString()}`,
    p.quantity.toString(),
    `${p.marginPct}%`,
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['Product Name', 'Category', 'Revenue', 'Units Sold', 'Margin %']],
    body: productRows,
    theme: 'striped',
    headStyles: { fillColor: [51, 65, 85], textColor: [255, 255, 255], fontSize: 8 },
    styles: { fontSize: 7.5, cellPadding: 2 },
  });

  currentY = (doc as any).lastAutoTable.finalY + 10;

  // Anomalies Table
  if (anomalies.length > 0) {
    if (currentY > pageHeight - 50) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('4. Detected Anomalies & Risk Alerts', 14, currentY);
    currentY += 4;

    const alertRows = anomalies.slice(0, 5).map(a => [
      a.severity.toUpperCase(),
      a.title,
      a.affectedItem,
      `${a.actualValue.toLocaleString()} vs ${a.baselineValue.toLocaleString()}`,
      a.recommendation || 'Review data',
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['Severity', 'Alert Title', 'Target', 'Actual vs Baseline', 'Action Recommendation']],
      body: alertRows,
      theme: 'grid',
      headStyles: { fillColor: [185, 28, 28], textColor: [255, 255, 255], fontSize: 8 },
      styles: { fontSize: 7, cellPadding: 2 },
    });

    currentY = (doc as any).lastAutoTable.finalY + 8;
  }

  // Footer on all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Yes67 BI Agent • SME Intelligence System • Page ${i} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - 8,
      { align: 'center' }
    );
  }

  const cleanName = settings.name.replace(/[^a-zA-Z0-9]/g, '_');
  doc.save(`${cleanName}_Executive_Report_${new Date().toISOString().split('T')[0]}.pdf`);
}
