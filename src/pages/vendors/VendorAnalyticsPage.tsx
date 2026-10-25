import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useVendorDetailAnalytics } from '../../hooks/useAnalytics';
import { useVendor } from '../../hooks/useVendors';
import { useStatsPeriodFilter } from '../../hooks/useStatsPeriodFilter';
import { AnalyticsPeriodBar } from '../../components/analytics/AnalyticsPeriodBar';
import { ChartCard } from '../../components/ui/ChartCard';
import { SkeletonLoader } from '../../components/ui/SkeletonLoader';
import { EmptyState } from '../../components/ui/EmptyState';
import { formatGrowthLabel } from '../../utils/analyticsPeriod';
import { formatCurrency } from '../../utils/format';

export function VendorAnalyticsPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { period, anchor, periodLabel, onPeriodChange, onAnchorChange } = useStatsPeriodFilter();
  const { data: vendor, isLoading: vendorLoading } = useVendor(id);
  const { data: analytics, isLoading: analyticsLoading, isError } = useVendorDetailAnalytics(
    vendor?.keycloakId,
    { period, anchor }
  );

  const isLoading = vendorLoading || analyticsLoading;
  const growthLabel = formatGrowthLabel(period);

  const revenueChart = (analytics?.revenue ?? []).map((point) => ({
    name: point.name ?? point.date ?? '—',
    value: point.revenue,
  }));

  const ordersChart = (analytics?.orders ?? []).map((point) => ({
    name: point.name ?? point.date ?? '—',
    value: point.orders,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(`/vendors/${id}`)}
          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {vendor?.shopName ?? 'Nhà bán'} — Phân tích
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{periodLabel}</p>
        </div>
      </div>

      <AnalyticsPeriodBar
        period={period}
        anchor={anchor}
        periodLabel={periodLabel}
        onPeriodChange={onPeriodChange}
        onAnchorChange={onAnchorChange}
      />

      {isLoading && !vendor ? (
        <SkeletonLoader type="card" count={3} />
      ) : !vendor ? (
        <EmptyState title="Không tìm thấy nhà bán hàng" description="Nhà bán hàng bạn tìm kiếm không tồn tại." icon="inbox" />
      ) : isLoading && !analytics ? (
        <SkeletonLoader type="card" count={3} />
      ) : isError || !analytics ? (
        <EmptyState
          title="Không thể tải dữ liệu phân tích nhà bán hàng"
          description="Đảm bảo dịch vụ phân tích đang chạy và nhà bán hàng này có dữ liệu doanh số."
          icon="inbox"
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-gray-100 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
              <p className="text-sm text-gray-500 dark:text-gray-400">Doanh thu</p>
              <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-gray-100">
                {formatCurrency(analytics.summary.totalRevenue)}
              </p>
              {period !== 'ALL' && (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {analytics.summary.growth >= 0 ? '+' : ''}
                  {analytics.summary.growth.toFixed(1)}% {growthLabel}
                </p>
              )}
            </div>
            <div className="rounded-xl border border-gray-100 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
              <p className="text-sm text-gray-500 dark:text-gray-400">Đơn hàng</p>
              <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-gray-100">
                {analytics.summary.totalOrders.toLocaleString()}
              </p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
              <p className="text-sm text-gray-500 dark:text-gray-400">Giá trị đơn hàng TB</p>
              <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-gray-100">
                {formatCurrency(analytics.summary.avgOrderValue)}
              </p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
              <p className="text-sm text-gray-500 dark:text-gray-400">Hoa hồng</p>
              <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-gray-100">
                {formatCurrency(analytics.summary.commission ?? 0)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <ChartCard title={`Xu hướng doanh thu (${periodLabel})`}>
              {revenueChart.length === 0 ? (
                <EmptyState title="Không có dữ liệu doanh thu" description="Không có doanh số trong khoảng thời gian đã chọn." icon="inbox" />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={revenueChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
                    <YAxis stroke="#9ca3af" fontSize={12} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '12px' }}
                      formatter={(value) => [formatCurrency(Number(value)), 'Doanh thu']}
                    />
                    <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ChartCard>

            <ChartCard title={`Xu hướng đơn hàng (${periodLabel})`}>
              {ordersChart.length === 0 ? (
                <EmptyState title="Không có dữ liệu đơn hàng" description="Không có đơn hàng trong khoảng thời gian đã chọn." icon="inbox" />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={ordersChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
                    <YAxis stroke="#9ca3af" fontSize={12} />
                    <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '12px' }} />
                    <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ChartCard>
          </div>

          <ChartCard title={`Sản phẩm hàng đầu (${periodLabel})`}>
            {analytics.topProducts.length === 0 ? (
              <EmptyState title="Không có sản phẩm" description="Sản phẩm hàng đầu sẽ hiển thị sau khi có doanh số." icon="inbox" />
            ) : (
              <div className="space-y-4">
                {analytics.topProducts.map((product, index) => (
                  <div key={product.productId} className="flex items-center justify-between rounded-lg bg-gray-50 p-4 dark:bg-gray-700/50">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100 text-sm font-bold text-primary-700 dark:bg-primary-950/50 dark:text-primary-300">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">{product.name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{product.sales} lượt bán</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900 dark:text-gray-100">{formatCurrency(product.revenue)}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Doanh thu</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ChartCard>
        </>
      )}
    </div>
  );
}
