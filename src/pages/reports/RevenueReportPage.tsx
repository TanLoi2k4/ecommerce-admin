import { DollarSign, Percent, ShoppingCart, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useAdminRevenueReport } from '../../hooks/useAnalytics';
import { useStatsPeriodFilter } from '../../hooks/useStatsPeriodFilter';
import { AnalyticsPeriodBar } from '../../components/analytics/AnalyticsPeriodBar';
import { ChartCard } from '../../components/ui/ChartCard';
import { DashboardCard } from '../../components/ui/DashboardCard';
import { SkeletonLoader } from '../../components/ui/SkeletonLoader';
import { EmptyState } from '../../components/ui/EmptyState';
import { categoryToPieData } from '../../utils/analyticsMappers';
import { formatGrowthLabel } from '../../utils/analyticsPeriod';
import { formatCurrency, formatNumber } from '../../utils/format';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

export function RevenueReportPage() {
  const { period, anchor, periodLabel, onPeriodChange, onAnchorChange } = useStatsPeriodFilter();
  const { data: report, isLoading, isError } = useAdminRevenueReport({ period, anchor });
  const growthLabel = formatGrowthLabel(period);
  const categoryData = report ? categoryToPieData(report.categoryData) : [];
  const chartData = (report?.chartData ?? []).map((point) => ({
    name: point.name ?? point.date ?? '—',
    revenue: point.revenue,
    orders: point.orders,
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Báo cáo doanh thu</h1>
      <AnalyticsPeriodBar
        period={period}
        anchor={anchor}
        periodLabel={periodLabel}
        onPeriodChange={onPeriodChange}
        onAnchorChange={onAnchorChange}
      />

      {isLoading && !report ? (
        <SkeletonLoader type="card" count={3} />
      ) : isError || !report ? (
        <EmptyState
          title="Không thể tải báo cáo doanh thu"
          description="Đảm bảo dịch vụ analytics đang chạy."
          icon="inbox"
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <DashboardCard
              title="Tổng doanh thu"
              value={formatCurrency(report.summary.totalRevenue)}
              icon={DollarSign}
              trend={period === 'ALL' ? undefined : report.summary.growth}
              trendLabel={period === 'ALL' ? undefined : growthLabel}
            />
            <DashboardCard
              title="Tổng đơn hàng"
              value={formatNumber(report.summary.totalOrders)}
              icon={ShoppingCart}
            />
            <DashboardCard
              title="Giá trị đơn TB"
              value={formatCurrency(report.summary.avgOrderValue)}
              icon={TrendingUp}
            />
            <DashboardCard
              title="Hoa hồng"
              value={formatCurrency(report.summary.commission ?? 0)}
              icon={Percent}
            />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <ChartCard title={`Doanh thu (${periodLabel})`}>
              {chartData.length === 0 ? (
                <EmptyState title="Không có dữ liệu doanh thu" description="Không có đơn hàng nào được ghi nhận trong kỳ này." icon="inbox" />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
                    <YAxis stroke="#9ca3af" fontSize={12} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '12px' }}
                      formatter={(value) => [formatCurrency(Number(value)), 'Doanh thu']}
                    />
                    <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ChartCard>

            <ChartCard title={`Doanh thu theo danh mục (${periodLabel})`}>
              {categoryData.length === 0 ? (
                <EmptyState title="Không có dữ liệu danh mục" description="Phân tích theo danh mục sẽ hiển thị sau khi có doanh số." icon="inbox" />
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie data={categoryData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                        {categoryData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '12px' }}
                        formatter={(value) => [`${Number(value).toFixed(1)}%`, 'Tỷ lệ']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="mt-4 flex flex-wrap justify-center gap-4">
                    {categoryData.map((entry, index) => (
                      <div key={entry.name} className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                        <span className="text-xs text-gray-600 dark:text-gray-400">{entry.name}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </ChartCard>
          </div>
        </>
      )}
    </div>
  );
}
