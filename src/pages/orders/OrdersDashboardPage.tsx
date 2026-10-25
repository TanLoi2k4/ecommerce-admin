import { ShoppingCart, Package, Truck, RotateCcw } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useOrderStats } from '../../hooks/useOrders';
import { useStatsPeriodFilter } from '../../hooks/useStatsPeriodFilter';
import { AnalyticsPeriodBar } from '../../components/analytics/AnalyticsPeriodBar';
import { DashboardCard } from '../../components/ui/DashboardCard';
import { ChartCard } from '../../components/ui/ChartCard';
import { EmptyState } from '../../components/ui/EmptyState';
import { SkeletonLoader } from '../../components/ui/SkeletonLoader';
import { formatNumber } from '../../utils/format';

interface StatusChartTooltipProps {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number | string; color?: string }>;
  label?: string;
}

function StatusChartTooltip({ active, payload, label }: StatusChartTooltipProps) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-lg dark:border-gray-700 dark:bg-gray-800">
      <p className="font-medium text-gray-900 dark:text-gray-100">{label}</p>
      {payload.map((entry, index) => (
        <p key={index} className="text-sm" style={{ color: entry.color }}>
          {entry.name}: {typeof entry.value === 'number' ? entry.value.toLocaleString('vi-VN') : entry.value}
        </p>
      ))}
    </div>
  );
}

export function OrdersDashboardPage() {
  const { period, anchor, periodLabel, onPeriodChange, onAnchorChange } = useStatsPeriodFilter();
  const { data: stats, isLoading, isError } = useOrderStats({ period, anchor });

  const orderStatusData = stats
    ? [
        { name: 'Chờ xử lý', value: stats.pending },
        { name: 'Đang xử lý', value: stats.processing },
        { name: 'Đang giao hàng', value: stats.shipped },
        { name: 'Đã giao', value: stats.delivered },
        { name: 'Đã hủy', value: stats.cancelled },
        { name: 'Hoàn tiền', value: stats.refundRequested },
      ]
    : [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Bảng điều khiển đơn hàng</h1>
      <AnalyticsPeriodBar
        period={period}
        anchor={anchor}
        periodLabel={periodLabel}
        onPeriodChange={onPeriodChange}
        onAnchorChange={onAnchorChange}
      />

      {isLoading && !stats ? (
        <>
          <SkeletonLoader type="card" count={4} />
          <div className="h-80 animate-pulse rounded-xl bg-gray-200 dark:bg-gray-700" />
        </>
      ) : isError || !stats ? (
        <EmptyState
          title="Không thể tải thống kê đơn hàng"
          description="Hãy đảm bảo order-service đang chạy và bạn đã đăng nhập với quyền quản trị."
          icon="inbox"
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <DashboardCard
              title="Tổng đơn hàng"
              value={formatNumber(stats.totalOrders)}
              icon={ShoppingCart}
              iconColor="text-primary-600"
              iconBgColor="bg-primary-50 dark:bg-primary-950/50"
            />
            <DashboardCard
              title="Chờ xử lý"
              value={formatNumber(stats.pending)}
              icon={Package}
              iconColor="text-amber-600"
              iconBgColor="bg-amber-50 dark:bg-amber-900/20"
            />
            <DashboardCard
              title="Đang giao hàng"
              value={formatNumber(stats.shipped)}
              icon={Truck}
              iconColor="text-emerald-600"
              iconBgColor="bg-emerald-50 dark:bg-emerald-900/20"
            />
            <DashboardCard
              title="Yêu cầu hoàn tiền"
              value={formatNumber(stats.refundRequested)}
              icon={RotateCcw}
              iconColor="text-red-600"
              iconBgColor="bg-red-50 dark:bg-red-900/20"
            />
          </div>

          <ChartCard title={`Đơn hàng theo trạng thái (${periodLabel})`}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={orderStatusData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} allowDecimals={false} />
                <Tooltip
                  content={<StatusChartTooltip />}
                  cursor={{ fill: '#9ca3af', fillOpacity: 0.16 }}
                />
                <Bar dataKey="value" name={periodLabel} fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </>
      )}
    </div>
  );
}
