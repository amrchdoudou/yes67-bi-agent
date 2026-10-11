import {
  AnomalyItem,
  ComputedKPIs,
  CleanedSalesRecord,
  CleanedExpenseRecord,
  TrendAnalysis,
  ForecastItem,
} from '../types';

/**
 * Calculates mean and sample standard deviation of an array
 */
function calculateMeanAndStdDev(values: number[]): { mean: number; stdDev: number } {
  if (values.length === 0) return { mean: 0, stdDev: 0 };
  const mean = values.reduce((acc, v) => acc + v, 0) / values.length;
  if (values.length === 1) return { mean, stdDev: 0 };
  const variance = values.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / (values.length - 1);
  return { mean, stdDev: Math.sqrt(variance) };
}

/**
 * Computes simple linear regression (slope and intercept)
 */
function linearRegression(points: { x: number; y: number }[]): { slope: number; intercept: number } {
  const n = points.length;
  if (n < 2) return { slope: 0, intercept: points[0]?.y || 0 };

  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;

  for (const p of points) {
    sumX += p.x;
    sumY += p.y;
    sumXY += p.x * p.y;
    sumXX += p.x * p.x;
  }

  const denominator = n * sumXX - sumX * sumX;
  if (denominator === 0) return { slope: 0, intercept: sumY / n };

  const slope = (n * sumXY - sumX * sumY) / denominator;
  const intercept = (sumY - slope * sumX) / n;
  return { slope, intercept };
}

/**
 * Detects anomalies across sales, expenses, and inventory deterministically.
 */
export function detectAnomalies(
  kpis: ComputedKPIs,
  sales: CleanedSalesRecord[],
  expenses: CleanedExpenseRecord[] = [],
  zScoreThreshold = 1.5
): {
  anomalies: AnomalyItem[];
  trendAnalysis: TrendAnalysis;
} {
  const anomalies: AnomalyItem[] = [];

  // 1. Sales spikes and drops by month using Z-score
  const monthlyRevenues = kpis.revenueByMonth.map(m => m.revenue);
  if (monthlyRevenues.length >= 3) {
    const { mean, stdDev } = calculateMeanAndStdDev(monthlyRevenues);
    if (stdDev > 0) {
      kpis.revenueByMonth.forEach(m => {
        const z = (m.revenue - mean) / stdDev;
        const roundedZ = Math.round(z * 100) / 100;

        if (z >= zScoreThreshold) {
          anomalies.push({
            id: `spike-${m.period}`,
            type: 'spike',
            severity: z >= 2.5 ? 'critical' : 'warning',
            title: `Revenue Spike in ${m.period}`,
            description: `Revenue reached ${m.revenue.toLocaleString()} vs monthly baseline average of ${Math.round(mean).toLocaleString()} (Z-score: +${roundedZ}).`,
            date: m.period,
            affectedItem: 'Total Revenue',
            metric: 'Monthly Revenue',
            baselineValue: Math.round(mean),
            actualValue: m.revenue,
            zScore: roundedZ,
            recommendation: 'Audit inventory buffer and operational capacity to sustain demand peaks.',
          });
        } else if (z <= -zScoreThreshold) {
          anomalies.push({
            id: `drop-${m.period}`,
            type: 'drop',
            severity: z <= -2.5 ? 'critical' : 'warning',
            title: `Revenue Drop in ${m.period}`,
            description: `Revenue plummeted to ${m.revenue.toLocaleString()} vs monthly baseline average of ${Math.round(mean).toLocaleString()} (Z-score: ${roundedZ}).`,
            date: m.period,
            affectedItem: 'Total Revenue',
            metric: 'Monthly Revenue',
            baselineValue: Math.round(mean),
            actualValue: m.revenue,
            zScore: roundedZ,
            recommendation: 'Investigate potential supply disruption, lost key accounts, or seasonal dip.',
          });
        }
      });
    }
  }

  // 2. Unusual expenses (Category-level Z-score)
  if (expenses.length >= 5) {
    const catAmounts: Record<string, number[]> = {};
    for (const exp of expenses) {
      if (!catAmounts[exp.category]) catAmounts[exp.category] = [];
      catAmounts[exp.category].push(exp.amount);
    }

    for (const [cat, amounts] of Object.entries(catAmounts)) {
      if (amounts.length >= 3) {
        const { mean, stdDev } = calculateMeanAndStdDev(amounts);
        if (stdDev > 0) {
          for (const exp of expenses.filter(e => e.category === cat)) {
            const z = (exp.amount - mean) / stdDev;
            if (z >= zScoreThreshold) {
              const roundedZ = Math.round(z * 100) / 100;
              anomalies.push({
                id: `exp-${exp.id}`,
                type: 'unusual_expense',
                severity: z >= 2.5 ? 'critical' : 'warning',
                title: `Unusual Expense in ${cat}`,
                description: `${exp.description} of ${exp.amount.toLocaleString()} is significantly higher than category baseline average of ${Math.round(mean).toLocaleString()} (Z-score: +${roundedZ}).`,
                date: exp.date,
                affectedItem: `${cat} - ${exp.description}`,
                metric: 'Expense Amount',
                baselineValue: Math.round(mean),
                actualValue: exp.amount,
                zScore: roundedZ,
                recommendation: 'Review vendor invoice and recurring subscription authorizations.',
              });
            }
          }
        }
      }
    }
  }

  // 3. Inventory Stockout and Overstock risk
  if (kpis.inventorySummary?.items) {
    for (const item of kpis.inventorySummary.items) {
      const days = item.daysRemaining ?? 999;
      const isUnderSafetyStock = item.minStock > 0 && item.stockQuantity <= item.minStock;
      if (days < 15 || isUnderSafetyStock) {
        anomalies.push({
          id: `stockout-${item.id}`,
          type: 'stockout_risk',
          severity: 'critical',
          title: `Imminent Stockout Risk: ${item.product}`,
          description: `Only ${item.stockQuantity} units in stock (Safety Minimum: ${item.minStock}). Sales velocity: ${item.dailyVelocity} units/day, estimated ${days} days of stock remaining.`,
          affectedItem: item.product,
          metric: 'Days of Stock Remaining',
          baselineValue: item.minStock,
          actualValue: item.stockQuantity,
          recommendation: 'Expedite purchase order immediately to avoid stock exhaustion.',
        });
      } else if (days > 180 && item.stockQuantity > 50) {
        anomalies.push({
          id: `overstock-${item.id}`,
          type: 'overstock_risk',
          severity: 'warning',
          title: `Excess Overstock: ${item.product}`,
          description: `Holding ${item.stockQuantity} units (${Math.round(item.stockValue).toLocaleString()} in tied-up capital). Current velocity represents ${days} days of supply.`,
          affectedItem: item.product,
          metric: 'Days of Stock Remaining',
          baselineValue: 90,
          actualValue: days,
          recommendation: 'Consider promotional bundling, clearance discount, or renegotiating minimum order quantities.',
        });
      }
    }
  }

  // 4. Trend Analysis & Linear Regression Forecast
  const monthlyData = kpis.revenueByMonth;
  const regressionPoints = monthlyData.map((m, idx) => ({ x: idx, y: m.revenue }));
  const { slope, intercept } = linearRegression(regressionPoints);

  const direction: TrendAnalysis['direction'] =
    slope > 500 ? 'rising' : slope < -500 ? 'falling' : 'flat';

  const avgRev = monthlyData.length > 0
    ? monthlyData.reduce((acc, m) => acc + m.revenue, 0) / monthlyData.length
    : 0;
  const growthRatePct = avgRev > 0 ? Math.round(((slope * 12) / avgRev) * 1000) / 10 : 0;

  // Generate deterministic forecast for next 3 periods
  const forecasts: ForecastItem[] = [];
  const lastIndex = monthlyData.length;
  const lastPeriodStr = monthlyData[monthlyData.length - 1]?.period || '2024-12';

  // Helper to get next month string
  function getNextMonth(str: string, offset: number): string {
    const parts = str.split('-');
    if (parts.length < 2) return `Month +${offset}`;
    let year = parseInt(parts[0], 10);
    let month = parseInt(parts[1], 10) + offset;
    while (month > 12) {
      year += 1;
      month -= 12;
    }
    return `${year}-${String(month).padStart(2, '0')}`;
  }

  // Rolling 3-month average
  const last3 = monthlyData.slice(-3).map(m => m.revenue);
  const rolling3Avg = last3.length > 0 ? last3.reduce((a, b) => a + b, 0) / last3.length : avgRev;

  for (let step = 1; step <= 3; step++) {
    const futureX = lastIndex + step - 1;
    const trendProj = Math.max(0, intercept + slope * futureX);
    // Combine 60% linear trend + 40% rolling average for SME stability
    const projectedRevenue = Math.round(0.6 * trendProj + 0.4 * rolling3Avg);
    const uncertaintyBand = Math.round(projectedRevenue * 0.12 * Math.sqrt(step));

    forecasts.push({
      period: getNextMonth(lastPeriodStr, step),
      projectedRevenue,
      lowerBound: Math.max(0, projectedRevenue - uncertaintyBand),
      upperBound: projectedRevenue + uncertaintyBand,
      method: 'linear_regression',
      isEstimate: true,
    });
  }

  // Sort anomalies by severity: critical first, then warning, then info
  const severityRank: Record<AnomalyItem['severity'], number> = {
    critical: 0,
    warning: 1,
    info: 2,
  };
  anomalies.sort((a, b) => severityRank[a.severity] - severityRank[b.severity]);

  return {
    anomalies,
    trendAnalysis: {
      slope: Math.round(slope * 100) / 100,
      direction,
      growthRatePct,
      forecasts,
    },
  };
}
