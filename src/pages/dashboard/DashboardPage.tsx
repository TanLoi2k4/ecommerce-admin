import {
  Users,
  Store,
  Package,
  ShoppingCart,
  DollarSign,
  TrendingUp,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { DashboardCard } from '../../components/ui/DashboardCard';
import { ChartCard } from '../../components/ui/ChartCard';
import { EmptyState } from '../../components/ui/EmptyState';
import { SkeletonLoader } from '../../components/ui/SkeletonLoader';
import { AnalyticsPeriodBar } from '../../components/analytics/AnalyticsPeriodBar';
import { useAdminDashboard, useAdminRevenueChart, useTopVendorsWithNames } from '../../hooks/useAnalytics';
import { useProductStats } from '../../hooks/useProducts';
import { useStatsPeriodFilter } from '../../hooks/useStatsPeriodFilter';
import { preferredChartSeries } from '../../utils/analyticsMappers';
import { formatGrowthLabel } from '../../utils/analyticsPeriod';
import { formatChartDateLabel, formatCurrency, formatNumber } from '../../utils/format';

export function DashboardPage() {
  const { period, anchor, periodLabel, onPeriodChange, onAnchorChange } = useStatsPeriodFilter();
  const periodQuery = { period, anchor };
  const growthLabel = formatGrowthLabel(period);
  const { data: dashboard, isLoading: dashboardLoading, isError: dashboardError } = useAdminDashboard(periodQuery);
  const { data: revenueData, isLoading: revenueLoading } = useAdminRevenueChart(periodQuery);
  const { data: topVendors = [], isLoading: vendorsLoading } = useTopVendorsWithNames(7, periodQuery);
  const { data: totalProducts = 0, isLoading: productStatsLoading } = useProductStats();

  const isLoading = dashboardLoading || revenueLoading || vendorsLoading || productStatsLoading;
  const revenueChart = revenueData
    ? preferredChartSeries(revenueData.chartData, revenueData.weeklyData)
    : [];
  const topVendorChart = topVendors.map((vendor) => ({
    name: vendor.shopName,
    revenue: vendor.revenue,
    orders: vendor.orders,
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Bảng điều khiển</h1>
      <AnalyticsPeriodBar
        period={period}
        anchor={anchor}
        periodLabel={periodLabel}
        onPeriodChange={onPeriodChange}
        onAnchorChange={onAnchorChange}
      />

      {isLoading && !dashboard ? (
        <>
          <SkeletonLoader type="card" count={4} />
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <SkeletonLoader type="card" count={2} />
          </div>
        </>
      ) : dashboardError || !dashboard ? (
        <EmptyState
          title="Không thể tải dữ liệu phân tích"
          description="Đảm bảo dịch vụ phân tích đang chạy và bạn đã đăng nhập với quyền quản trị."
          icon="inbox"
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <DashboardCard
              title="Tổng người dùng"
              value={formatNumber(dashboard.totalUsers)}
              icon={Users}
              trend={dashboard.userGrowth ?? undefined}
              trendLabel={period === 'ALL' ? undefined : growthLabel}
              iconColor="text-primary-600"
              iconBgColor="bg-primary-50 dark:bg-primary-950/50"
            />
            <DashboardCard
              title="Nhà bán có doanh số"
              value={formatNumber(dashboard.totalVendors)}
              icon={Store}
              iconColor="text-emerald-600"
              iconBgColor="bg-emerald-50 dark:bg-emerald-900/20"
            />
            <DashboardCard
              title="Tổng sản phẩm"
              value={formatNumber(totalProducts)}
              icon={Package}
              iconColor="text-violet-600"
              iconBgColor="bg-violet-50 dark:bg-violet-900/20"
            />
            <DashboardCard
              title="Tổng đơn hàng"
              value={formatNumber(dashboard.totalOrders)}
              icon={ShoppingCart}
              trend={dashboard.ordersGrowth ?? undefined}
              trendLabel={period === 'ALL' ? undefined : growthLabel}
              iconColor="text-amber-600"
              iconBgColor="bg-amber-50 dark:bg-amber-900/20"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <DashboardCard
              title="GMV nền tảng"
              value={formatCurrency(dashboard.gmv)}
              icon={DollarSign}
              trend={dashboard.gmvGrowth ?? undefined}
              trendLabel={period === 'ALL' ? undefined : growthLabel}
              iconColor="text-emerald-600"
              iconBgColor="bg-emerald-50 dark:bg-emerald-900/20"
            />
            <DashboardCard
              title="Hoa hồng thu được"
              value={formatCurrency(dashboard.commissionEarned)}
              icon={TrendingUp}
              iconColor="text-primary-600"
              iconBgColor="bg-primary-50 dark:bg-primary-950/50"
            />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <ChartCard title={`Tổng quan doanh thu (${periodLabel})`}>
              {revenueChart.length === 0 ? (
                <EmptyState title="Không có dữ liệu doanh thu" description="Hoàn thành đơn hàng để hiển thị dữ liệu phân tích." icon="inbox" />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={revenueChart}>
                    <defs>
                      <linearGradient id="revenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.1} />
                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} tickFormatter={formatChartDateLabel} />
                    <YAxis stroke="#9ca3af" fontSize={12} tickFormatter={(v) => `${(v / 1000000).toFixed(0)}tr`} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                      labelFormatter={formatChartDateLabel}
                      formatter={(value) => [formatCurrency(Number(value)), 'Doanh thu']}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#f43f5e" strokeWidth={2} fill="url(#revenue)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </ChartCard>

            <ChartCard title={`Nhà bán hàng hàng đầu (${periodLabel})`}>
              {topVendorChart.length === 0 ? (
                <EmptyState title="Không có dữ liệu nhà bán hàng" description="Dữ liệu phân tích nhà bán hàng sẽ hiển thị sau khi có doanh số." icon="inbox" />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={topVendorChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
                    <YAxis stroke="#9ca3af" fontSize={12} tickFormatter={(v) => `${(v / 1000000).toFixed(0)}tr`} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                      formatter={(value) => [formatCurrency(Number(value)), 'Doanh thu']}
                    />
                    <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ChartCard>
          </div>
        </>
      )}
    </div>
  );
}
