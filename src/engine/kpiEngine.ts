import {
  CleanedSalesRecord,
  CleanedExpenseRecord,
  CleanedInventoryRecord,
  CleanedCustomerRecord,
  ComputedKPIs,
  KPICardData,
  PeriodSummary,
  ProductPerformance,
  RegionPerformance,
  CustomerPerformance,
  SparklinePoint,
  FilterState,
} from '../types';

/**
 * Filter sales records by date range, region, and category
 */
export function filterSales(
  sales: CleanedSalesRecord[],
  filters: FilterState
): CleanedSalesRecord[] {
  return sales.filter(row => {
    if (filters.dateRange?.start && row.date < filters.dateRange.start) return false;
    if (filters.dateRange?.end && row.date > filters.dateRange.end) return false;
    if (filters.selectedRegion && filters.selectedRegion !== 'all' && row.region !== filters.selectedRegion) return false;
    if (filters.selectedCategory && filters.selectedCategory !== 'all' && row.category !== filters.selectedCategory) return false;
    return true;
  });
}

/**
 * Filter expenses records by date range
 */
export function filterExpenses(
  expenses: CleanedExpenseRecord[],
  filters: FilterState
): CleanedExpenseRecord[] {
  return expenses.filter(row => {
    if (filters.dateRange?.start && row.date < filters.dateRange.start) return false;
    if (filters.dateRange?.end && row.date > filters.dateRange.end) return false;
    return true;
  });
}

/**
 * Format currency amount with symbol
 */
export function formatCurrency(amount: number, symbol = '$'): string {
  return `${symbol}${amount.toLocaleString('en-US', {
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Format percentage
 */
export function formatPercent(pct: number): string {
  const sign = pct > 0 ? '+' : '';
  return `${sign}${pct.toFixed(1)}%`;
}

/**
 * Pure deterministic KPI computation engine
 */
export function computeKPIs(
  sales: CleanedSalesRecord[],
  expenses: CleanedExpenseRecord[] = [],
  inventory: CleanedInventoryRecord[] = [],
  customers: CleanedCustomerRecord[] = [],
  currencySymbol = '$'
): ComputedKPIs {
  // If no sales, return empty zero state
  if (sales.length === 0) {
    return {
      totalRevenue: 0,
      grossProfit: 0,
      grossMarginPct: 0,
      totalExpenses: 0,
      netProfit: 0,
      netMarginPct: 0,
      aov: 0,
      orderCount: 0,
      activeCustomerCount: 0,
      newCustomersCount: 0,
      returningCustomersCount: 0,
      momGrowthPct: 0,
      yoyGrowthPct: 0,
      revenueByMonth: [],
      revenueByRegion: [],
      topProductsByRevenue: [],
      bottomProductsByRevenue: [],
      topProductsByQuantity: [],
      topCustomers: [],
      expenseByCategory: [],
      inventorySummary: null,
      kpiCards: [],
    };
  }

  // 1. Basic aggregates
  let totalRevenue = 0;
  let totalCost = 0;
  const orderSet = new Set<string>();
  const customerOrderCounts: Record<string, { count: number; firstDate: string; lastDate: string; revenue: number }> = {};
  const productAggs: Record<string, { category: string; revenue: number; quantity: number; profit: number }> = {};
  const regionAggs: Record<string, { revenue: number; orders: Set<string> }> = {};
  const monthlyAggs: Record<string, { revenue: number; cost: number; orders: Set<string> }> = {};

  for (const row of sales) {
    totalRevenue += row.revenue;
    totalCost += row.cost;
    orderSet.add(row.orderId);

    // Customer tracking
    if (!customerOrderCounts[row.customer]) {
      customerOrderCounts[row.customer] = {
        count: 0,
        firstDate: row.date,
        lastDate: row.date,
        revenue: 0,
      };
    }
    const cData = customerOrderCounts[row.customer];
    cData.count++;
    cData.revenue += row.revenue;
    if (row.date < cData.firstDate) cData.firstDate = row.date;
    if (row.date > cData.lastDate) cData.lastDate = row.date;

    // Product tracking
    if (!productAggs[row.product]) {
      productAggs[row.product] = {
        category: row.category,
        revenue: 0,
        quantity: 0,
        profit: 0,
      };
    }
    const pData = productAggs[row.product];
    pData.revenue += row.revenue;
    pData.quantity += row.quantity;
    pData.profit += row.profit;

    // Region tracking
    if (!regionAggs[row.region]) {
      regionAggs[row.region] = { revenue: 0, orders: new Set() };
    }
    regionAggs[row.region].revenue += row.revenue;
    regionAggs[row.region].orders.add(row.orderId);

    // Monthly tracking (YYYY-MM)
    const monthKey = row.date.substring(0, 7);
    if (!monthlyAggs[monthKey]) {
      monthlyAggs[monthKey] = { revenue: 0, cost: 0, orders: new Set() };
    }
    monthlyAggs[monthKey].revenue += row.revenue;
    monthlyAggs[monthKey].cost += row.cost;
    monthlyAggs[monthKey].orders.add(row.orderId);
  }

  totalRevenue = Math.round(totalRevenue * 100) / 100;
  totalCost = Math.round(totalCost * 100) / 100;
  const grossProfit = Math.round((totalRevenue - totalCost) * 100) / 100;
  const grossMarginPct = totalRevenue > 0 ? Math.round((grossProfit / totalRevenue) * 1000) / 10 : 0;
  const orderCount = orderSet.size;
  const aov = orderCount > 0 ? Math.round((totalRevenue / orderCount) * 100) / 100 : 0;

  // 2. Expenses breakdown
  let totalExpenses = 0;
  const expenseCatMap: Record<string, number> = {};
  const monthlyExpenseMap: Record<string, number> = {};

  for (const exp of expenses) {
    totalExpenses += exp.amount;
    expenseCatMap[exp.category] = (expenseCatMap[exp.category] || 0) + exp.amount;

    const mKey = exp.date.substring(0, 7);
    monthlyExpenseMap[mKey] = (monthlyExpenseMap[mKey] || 0) + exp.amount;
  }
  totalExpenses = Math.round(totalExpenses * 100) / 100;
  const netProfit = Math.round((grossProfit - totalExpenses) * 100) / 100;
  const netMarginPct = totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 1000) / 10 : 0;

  const expenseByCategory = Object.entries(expenseCatMap)
    .map(([category, amount]) => ({
      category,
      amount: Math.round(amount * 100) / 100,
      sharePct: totalExpenses > 0 ? Math.round((amount / totalExpenses) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  // 3. Customers
  const activeCustomerCount = Object.keys(customerOrderCounts).length;
  let newCustomersCount = 0;
  let returningCustomersCount = 0;

  const topCustomers: CustomerPerformance[] = Object.entries(customerOrderCounts)
    .map(([customer, data]) => {
      const isNew = data.count === 1;
      if (isNew) newCustomersCount++;
      else returningCustomersCount++;

      return {
        customer,
        revenue: Math.round(data.revenue * 100) / 100,
        orders: data.count,
        firstOrderDate: data.firstDate,
        lastOrderDate: data.lastDate,
        isNew,
      };
    })
    .sort((a, b) => b.revenue - a.revenue);

  // 4. Products performance
  const allProducts: ProductPerformance[] = Object.entries(productAggs)
    .map(([product, d]) => ({
      product,
      category: d.category,
      revenue: Math.round(d.revenue * 100) / 100,
      quantity: d.quantity,
      profit: Math.round(d.profit * 100) / 100,
      marginPct: d.revenue > 0 ? Math.round((d.profit / d.revenue) * 1000) / 10 : 0,
    }));

  const topProductsByRevenue = [...allProducts].sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  const bottomProductsByRevenue = [...allProducts]
    .filter(p => p.revenue > 0)
    .sort((a, b) => a.revenue - b.revenue)
    .slice(0, 5);
  const topProductsByQuantity = [...allProducts].sort((a, b) => b.quantity - a.quantity).slice(0, 5);

  // 5. Regional performance
  const revenueByRegion: RegionPerformance[] = Object.entries(regionAggs)
    .map(([region, d]) => ({
      region,
      revenue: Math.round(d.revenue * 100) / 100,
      orders: d.orders.size,
      sharePct: totalRevenue > 0 ? Math.round((d.revenue / totalRevenue) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue);

  // 6. Monthly trend and MoM / YoY growth
  const sortedMonths = Object.keys(monthlyAggs).sort();
  const revenueByMonth: PeriodSummary[] = sortedMonths.map(month => {
    const rev = Math.round(monthlyAggs[month].revenue * 100) / 100;
    const c = Math.round(monthlyAggs[month].cost * 100) / 100;
    const p = Math.round((rev - c) * 100) / 100;
    const exp = Math.round((monthlyExpenseMap[month] || 0) * 100) / 100;
    const np = Math.round((p - exp) * 100) / 100;

    return {
      period: month,
      revenue: rev,
      cost: c,
      profit: p,
      expenses: exp,
      netProfit: np,
      orders: monthlyAggs[month].orders.size,
    };
  });

  // Calculate MoM growth for the latest month vs previous month
  let momGrowthPct = 0;
  if (revenueByMonth.length >= 2) {
    const current = revenueByMonth[revenueByMonth.length - 1].revenue;
    const prev = revenueByMonth[revenueByMonth.length - 2].revenue;
    momGrowthPct = prev > 0 ? Math.round(((current - prev) / prev) * 1000) / 10 : 0;
  }

  // Calculate YoY growth if at least 12 months available
  let yoyGrowthPct = 0;
  if (revenueByMonth.length >= 12) {
    const current = revenueByMonth[revenueByMonth.length - 1].revenue;
    const yearAgo = revenueByMonth[revenueByMonth.length - 12].revenue;
    yoyGrowthPct = yearAgo > 0 ? Math.round(((current - yearAgo) / yearAgo) * 1000) / 10 : 0;
  }

  // 7. Inventory status
  let inventorySummary: ComputedKPIs['inventorySummary'] = null;
  if (inventory.length > 0) {
    let totalStockUnits = 0;
    let totalStockValue = 0;
    let lowStockCount = 0;
    let overstockCount = 0;

    // Calculate daily sales velocity per product (from sales in the period)
    const productDaysRange = 365;
    const productSalesUnits: Record<string, number> = {};
    for (const s of sales) {
      productSalesUnits[s.product] = (productSalesUnits[s.product] || 0) + s.quantity;
    }

    const enhancedItems = inventory.map(item => {
      totalStockUnits += item.stockQuantity;
      totalStockValue += item.stockValue;

      const totalSold = productSalesUnits[item.product] || 0;
      const dailyVelocity = Math.max(0.05, totalSold / productDaysRange);
      const daysRemaining = Math.round(item.stockQuantity / dailyVelocity);

      if (item.stockQuantity <= item.minStock || daysRemaining < 14) {
        lowStockCount++;
      }
      if (daysRemaining > 180) {
        overstockCount++;
      }

      return {
        ...item,
        dailyVelocity: Math.round(dailyVelocity * 10) / 10,
        daysRemaining,
      };
    });

    // Stock turnover = COGS / Average Inventory Value
    const stockTurnover = totalStockValue > 0 ? Math.round((totalCost / totalStockValue) * 10) / 10 : 0;

    inventorySummary = {
      totalStockUnits,
      totalStockValue: Math.round(totalStockValue * 100) / 100,
      stockTurnover,
      lowStockCount,
      overstockCount,
      items: enhancedItems,
    };
  }

  // 8. Generate Sparklines & KPI Cards
  const sparklineRevenue: SparklinePoint[] = revenueByMonth.map(m => ({ date: m.period, value: m.revenue }));
  const sparklineProfit: SparklinePoint[] = revenueByMonth.map(m => ({ date: m.period, value: m.profit }));
  const sparklineExpenses: SparklinePoint[] = revenueByMonth.map(m => ({ date: m.period, value: m.expenses }));
  const sparklineOrders: SparklinePoint[] = revenueByMonth.map(m => ({ date: m.period, value: m.orders }));

  const prevMonthRevenue = revenueByMonth.length >= 2 ? revenueByMonth[revenueByMonth.length - 2].revenue : totalRevenue;
  const prevMonthProfit = revenueByMonth.length >= 2 ? revenueByMonth[revenueByMonth.length - 2].profit : grossProfit;
  const prevMonthExpenses = revenueByMonth.length >= 2 ? revenueByMonth[revenueByMonth.length - 2].expenses : totalExpenses;
  const prevMonthOrders = revenueByMonth.length >= 2 ? revenueByMonth[revenueByMonth.length - 2].orders : orderCount;

  const kpiCards: KPICardData[] = [
    {
      id: 'total_revenue',
      title: 'Total Revenue',
      value: totalRevenue,
      formattedValue: formatCurrency(totalRevenue, currencySymbol),
      previousValue: prevMonthRevenue,
      changePct: momGrowthPct,
      trend: momGrowthPct >= 0 ? 'up' : 'down',
      isPositive: momGrowthPct >= 0,
      sparkline: sparklineRevenue,
      category: 'financial',
    },
    {
      id: 'gross_profit',
      title: 'Gross Profit',
      value: grossProfit,
      formattedValue: formatCurrency(grossProfit, currencySymbol),
      previousValue: prevMonthProfit,
      changePct: prevMonthProfit > 0 ? Math.round(((grossProfit - prevMonthProfit) / prevMonthProfit) * 100) : 0,
      trend: grossProfit >= prevMonthProfit ? 'up' : 'down',
      isPositive: grossProfit >= prevMonthProfit,
      sparkline: sparklineProfit,
      category: 'financial',
    },
    {
      id: 'gross_margin',
      title: 'Gross Margin %',
      value: grossMarginPct,
      formattedValue: `${grossMarginPct}%`,
      previousValue: 0,
      changePct: 0,
      trend: grossMarginPct >= 30 ? 'up' : 'neutral',
      isPositive: grossMarginPct >= 30,
      sparkline: sparklineProfit.map(p => ({ date: p.date, value: grossMarginPct })),
      category: 'financial',
    },
    {
      id: 'total_expenses',
      title: 'Operating Expenses',
      value: totalExpenses,
      formattedValue: formatCurrency(totalExpenses, currencySymbol),
      previousValue: prevMonthExpenses,
      changePct: prevMonthExpenses > 0 ? Math.round(((totalExpenses - prevMonthExpenses) / prevMonthExpenses) * 100) : 0,
      trend: totalExpenses > prevMonthExpenses ? 'up' : 'down',
      isPositive: totalExpenses <= prevMonthExpenses, // for expenses, lower is positive
      sparkline: sparklineExpenses,
      category: 'financial',
    },
    {
      id: 'net_profit',
      title: 'Net Profit',
      value: netProfit,
      formattedValue: formatCurrency(netProfit, currencySymbol),
      previousValue: 0,
      changePct: netMarginPct,
      trend: netProfit >= 0 ? 'up' : 'down',
      isPositive: netProfit >= 0,
      sparkline: revenueByMonth.map(m => ({ date: m.period, value: m.netProfit })),
      category: 'financial',
    },
    {
      id: 'aov',
      title: 'Avg Order Value (AOV)',
      value: aov,
      formattedValue: formatCurrency(aov, currencySymbol),
      previousValue: 0,
      changePct: 0,
      trend: 'neutral',
      isPositive: true,
      sparkline: sparklineRevenue.map(p => ({ date: p.date, value: aov })),
      category: 'operations',
    },
    {
      id: 'orders',
      title: 'Total Orders',
      value: orderCount,
      formattedValue: orderCount.toLocaleString(),
      previousValue: prevMonthOrders,
      changePct: prevMonthOrders > 0 ? Math.round(((orderCount - prevMonthOrders) / prevMonthOrders) * 100) : 0,
      trend: orderCount >= prevMonthOrders ? 'up' : 'down',
      isPositive: true,
      sparkline: sparklineOrders,
      category: 'operations',
    },
    {
      id: 'active_customers',
      title: 'Active Customers',
      value: activeCustomerCount,
      formattedValue: activeCustomerCount.toLocaleString(),
      previousValue: 0,
      changePct: 0,
      trend: 'neutral',
      isPositive: true,
      sparkline: sparklineOrders.map(p => ({ date: p.date, value: activeCustomerCount })),
      category: 'customers',
    },
  ];

  if (inventorySummary) {
    kpiCards.push(
      {
        id: 'stock_value',
        title: 'Inventory Value',
        value: inventorySummary.totalStockValue,
        formattedValue: formatCurrency(inventorySummary.totalStockValue, currencySymbol),
        previousValue: 0,
        changePct: 0,
        trend: 'neutral',
        isPositive: true,
        sparkline: sparklineRevenue.map(p => ({ date: p.date, value: inventorySummary!.totalStockValue })),
        category: 'inventory',
      },
      {
        id: 'stock_turnover',
        title: 'Stock Turnover',
        value: inventorySummary.stockTurnover,
        formattedValue: `${inventorySummary.stockTurnover}x`,
        previousValue: 0,
        changePct: 0,
        trend: inventorySummary.stockTurnover >= 4 ? 'up' : 'neutral',
        isPositive: inventorySummary.stockTurnover >= 3,
        sparkline: sparklineRevenue.map(p => ({ date: p.date, value: inventorySummary!.stockTurnover })),
        category: 'inventory',
      }
    );
  }

  return {
    totalRevenue,
    grossProfit,
    grossMarginPct,
    totalExpenses,
    netProfit,
    netMarginPct,
    aov,
    orderCount,
    activeCustomerCount,
    newCustomersCount,
    returningCustomersCount,
    momGrowthPct,
    yoyGrowthPct,
    revenueByMonth,
    revenueByRegion,
    topProductsByRevenue,
    bottomProductsByRevenue,
    topProductsByQuantity,
    topCustomers,
    expenseByCategory,
    inventorySummary,
    kpiCards,
  };
}
