import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useTopVendorsWithNames } from '../../hooks/useAnalytics';
import { useVendorStats } from '../../hooks/useVendors';
import { useStatsPeriodFilter } from '../../hooks/useStatsPeriodFilter';
import { AnalyticsPeriodBar } from '../../components/analytics/AnalyticsPeriodBar';
import { ChartCard } from '../../components/ui/ChartCard';
import { SkeletonLoader } from '../../components/ui/SkeletonLoader';
import { EmptyState } from '../../components/ui/EmptyState';
import { formatCurrency } from '../../utils/format';

export function VendorReportPage() {
  const { period, anchor, periodLabel, onPeriodChange, onAnchorChange } = useStatsPeriodFilter();
  const { data: topVendors = [], isLoading: vendorsLoading, isError } = useTopVendorsWithNames(10, { period, anchor });
  const { data: vendorStats, isLoading: statsLoading } = useVendorStats();

  const isLoading = vendorsLoading || statsLoading;
  const chartData = topVendors.map((vendor) => ({
    name: vendor.shopName,
    vendorId: vendor.vendorId,
    revenue: vendor.revenue,
    orders: vendor.orders,
    itemsSold: vendor.itemsSold,
    commission: vendor.commission,
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Báo cáo nhà bán</h1>
      <AnalyticsPeriodBar
        period={period}
        anchor={anchor}
        periodLabel={periodLabel}
        onPeriodChange={onPeriodChange}
        onAnchorChange={onAnchorChange}
      />

      {isLoading && topVendors.length === 0 && !vendorStats ? (
        <SkeletonLoader type="card" count={3} />
      ) : isError ? (
        <EmptyState title="Không thể tải phân tích nhà bán" description="Đảm bảo dịch vụ analytics đang chạy." icon="inbox" />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-gray-100 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
              <p className="text-sm text-gray-500 dark:text-gray-400">Tổng số nhà bán</p>
              <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-gray-100">{vendorStats?.total ?? 0}</p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
              <p className="text-sm text-gray-500 dark:text-gray-400">Nhà bán đang hoạt động</p>
              <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-gray-100">
                {Math.max((vendorStats?.total ?? 0) - (vendorStats?.inactive ?? 0), 0)}
              </p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
              <p className="text-sm text-gray-500 dark:text-gray-400">Không hoạt động</p>
              <p className="mt-2 text-2xl font-bold text-amber-600 dark:text-amber-400">{vendorStats?.inactive ?? 0}</p>
            </div>
          </div>

          <ChartCard title={`Nhà bán hiệu suất cao nhất (${periodLabel})`}>
            {chartData.length === 0 ? (
              <EmptyState title="Không có dữ liệu bán hàng" description="Danh sách nhà bán hàng đầu sẽ hiển thị sau khi có đơn hàng hoàn thành." icon="inbox" />
            ) : (
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={chartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis type="number" stroke="#9ca3af" fontSize={12} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <YAxis dataKey="name" type="category" stroke="#9ca3af" fontSize={12} width={120} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '12px' }}
                    formatter={(value) => [formatCurrency(Number(value)), 'Doanh thu']}
                  />
                  <Bar dataKey="revenue" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          <div className="rounded-xl border border-gray-100 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Tóm tắt hiệu suất nhà bán</h3>
            {chartData.length === 0 ? (
              <EmptyState title="Không có dữ liệu" description="Chưa có dữ liệu hiệu suất nhà bán." icon="inbox" />
            ) : (
              <div className="mt-4 space-y-3">
                {chartData.slice(0, 5).map((vendor, index) => (
                  <div key={vendor.vendorId} className="flex items-center justify-between rounded-lg bg-gray-50 p-4 dark:bg-gray-700/50">
                    <div className="flex items-center gap-4">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-sm font-bold text-primary-700 dark:bg-primary-950/50 dark:text-primary-300">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">{vendor.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {vendor.orders} đơn hàng | {vendor.itemsSold} sản phẩm đã bán
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900 dark:text-gray-100">{formatCurrency(vendor.revenue)}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Hoa hồng: {formatCurrency(vendor.commission)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
