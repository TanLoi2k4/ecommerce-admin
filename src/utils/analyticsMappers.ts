import type {
  AdminDashboardResponse,
  CategoryBreakdownDto,
  ChartPointDto,
  RevenueReportResponse,
  SalesAnalyticsResponse,
  SummaryStatsDto,
  TopProductDto,
  TopVendorDto,
  VendorDetailAnalyticsResponse,
} from '../types/analytics';

export function toNumber(value: unknown, fallback = 0): number {
  if (value == null) return fallback;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

export function mapSummaryStats(raw: Record<string, unknown> | null | undefined): SummaryStatsDto {
  return {
    totalRevenue: toNumber(raw?.totalRevenue),
    totalOrders: toNumber(raw?.totalOrders),
    growth: raw?.growth != null ? toNumber(raw.growth) : 0,
    avgOrderValue: toNumber(raw?.avgOrderValue),
    totalCustomers: raw?.totalCustomers != null ? toNumber(raw.totalCustomers) : null,
    newCustomers: raw?.newCustomers != null ? toNumber(raw.newCustomers) : null,
    commission: raw?.commission != null ? toNumber(raw.commission) : null,
    netRevenue: raw?.netRevenue != null ? toNumber(raw.netRevenue) : null,
  };
}

export function mapChartPoint(raw: Record<string, unknown>): ChartPointDto {
  return {
    date: typeof raw.date === 'string' ? raw.date : null,
    name: typeof raw.name === 'string' ? raw.name : null,
    revenue: toNumber(raw.revenue),
    orders: toNumber(raw.orders),
    value: raw.value != null ? toNumber(raw.value) : null,
  };
}

export function mapTopProduct(raw: Record<string, unknown>): TopProductDto {
  return {
    productId: toNumber(raw.productId),
    name: typeof raw.name === 'string' ? raw.name : 'Unknown product',
    quantity: toNumber(raw.quantity),
    sales: toNumber(raw.sales),
    revenue: toNumber(raw.revenue),
    stock: raw.stock != null ? toNumber(raw.stock) : null,
    rating: raw.rating != null ? toNumber(raw.rating) : null,
    imageUrl: typeof raw.imageUrl === 'string' ? raw.imageUrl : null,
    categoryName: typeof raw.categoryName === 'string' ? raw.categoryName : null,
  };
}

export function mapCategoryBreakdown(raw: Record<string, unknown>): CategoryBreakdownDto {
  return {
    name: typeof raw.name === 'string' ? raw.name : 'Other',
    revenue: toNumber(raw.revenue),
    quantitySold: toNumber(raw.quantitySold),
    value: toNumber(raw.value),
  };
}

export function mapTopVendor(raw: Record<string, unknown>): TopVendorDto {
  return {
    vendorId: typeof raw.vendorId === 'string' ? raw.vendorId : '',
    revenue: toNumber(raw.revenue),
    orders: toNumber(raw.orders),
    itemsSold: toNumber(raw.itemsSold),
    commission: toNumber(raw.commission),
  };
}

export function mapAdminDashboard(raw: Record<string, unknown>): AdminDashboardResponse {
  return {
    gmv: toNumber(raw.gmv),
    totalOrders: toNumber(raw.totalOrders),
    totalUsers: toNumber(raw.totalUsers),
    totalVendors: toNumber(raw.totalVendors),
    gmvGrowth: raw.gmvGrowth != null ? toNumber(raw.gmvGrowth) : null,
    ordersGrowth: raw.ordersGrowth != null ? toNumber(raw.ordersGrowth) : null,
    userGrowth: raw.userGrowth != null ? toNumber(raw.userGrowth) : null,
    commissionEarned: toNumber(raw.commissionEarned),
  };
}

export function mapSalesAnalytics(raw: Record<string, unknown>): SalesAnalyticsResponse {
  const summary = raw.summary as Record<string, unknown> | undefined;
  const chartData = Array.isArray(raw.chartData)
    ? raw.chartData.map((item) => mapChartPoint(item as Record<string, unknown>))
    : [];
  const weeklyData = Array.isArray(raw.weeklyData)
    ? raw.weeklyData.map((item) => mapChartPoint(item as Record<string, unknown>))
    : [];
  return { summary: mapSummaryStats(summary), chartData, weeklyData };
}

export function mapRevenueReport(raw: Record<string, unknown>): RevenueReportResponse {
  const summary = raw.summary as Record<string, unknown> | undefined;
  const chartData = Array.isArray(raw.chartData)
    ? raw.chartData.map((item) => mapChartPoint(item as Record<string, unknown>))
    : [];
  const categoryData = Array.isArray(raw.categoryData)
    ? raw.categoryData.map((item) => mapCategoryBreakdown(item as Record<string, unknown>))
    : [];
  return { summary: mapSummaryStats(summary), chartData, categoryData };
}

export function mapVendorDetailAnalytics(raw: Record<string, unknown>): VendorDetailAnalyticsResponse {
  const summary = raw.summary as Record<string, unknown> | undefined;
  const revenue = Array.isArray(raw.revenue)
    ? raw.revenue.map((item) => mapChartPoint(item as Record<string, unknown>))
    : [];
  const orders = Array.isArray(raw.orders)
    ? raw.orders.map((item) => mapChartPoint(item as Record<string, unknown>))
    : [];
  const topProducts = Array.isArray(raw.topProducts)
    ? raw.topProducts.map((item) => mapTopProduct(item as Record<string, unknown>))
    : [];
  return {
    vendorId: typeof raw.vendorId === 'string' ? raw.vendorId : '',
    summary: mapSummaryStats(summary),
    revenue,
    orders,
    topProducts,
  };
}

export function chartPointsToSeries(points: ChartPointDto[]): { name: string; revenue: number; orders: number }[] {
  return points.map((point) => ({
    name: point.name ?? point.date ?? '—',
    revenue: point.revenue,
    orders: point.orders,
  }));
}

export function preferredChartSeries(daily: ChartPointDto[], aggregated?: ChartPointDto[]) {
  if (aggregated && aggregated.length > 0) {
    return chartPointsToSeries(aggregated);
  }
  return chartPointsToSeries(daily);
}

export function categoryToPieData(categories: CategoryBreakdownDto[]): { name: string; value: number }[] {
  return categories.map((cat) => ({ name: cat.name, value: cat.value }));
}

export function formatVendorLabel(vendorId: string): string {
  if (!vendorId) return 'Unknown vendor';
  if (vendorId.length <= 12) return vendorId;
  return `${vendorId.substring(0, 8)}…`;
}
