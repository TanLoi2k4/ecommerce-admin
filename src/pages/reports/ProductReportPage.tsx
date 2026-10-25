import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useProductsByCategory, useTopProducts } from '../../hooks/useAnalytics';
import { useStatsPeriodFilter } from '../../hooks/useStatsPeriodFilter';
import { AnalyticsPeriodBar } from '../../components/analytics/AnalyticsPeriodBar';
import { ChartCard } from '../../components/ui/ChartCard';
import { DataTable } from '../../components/ui/DataTable';
import { SkeletonLoader } from '../../components/ui/SkeletonLoader';
import { EmptyState } from '../../components/ui/EmptyState';
import { formatCurrency } from '../../utils/format';
import type { TopProductDto } from '../../types/analytics';

function ProductThumb({ name, imageUrl }: { name: string; imageUrl?: string | null }) {
  const [failed, setFailed] = useState(false);
  if (imageUrl && !failed) {
    return (
      <img
        src={imageUrl}
        alt=""
        className="h-10 w-10 shrink-0 rounded-lg object-cover"
        onError={() => setFailed(true)}
      />
    );
  }
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-sm font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
      {name.charAt(0)}
    </div>
  );
}

export function ProductReportPage() {
  const { period, anchor, periodLabel, onPeriodChange, onAnchorChange } = useStatsPeriodFilter();
  const periodQuery = { period, anchor };
  const { data: products = [], isLoading: productsLoading, isError: productsError } = useTopProducts(20, periodQuery);
  const { data: categories = [], isLoading: categoriesLoading } = useProductsByCategory(periodQuery);
  const navigate = useNavigate();

  const isLoading = productsLoading || categoriesLoading;
  const categoryChart = categories.map((cat) => ({
    name: cat.name,
    sales: cat.quantitySold,
    revenue: cat.revenue,
  }));

  const columns = [
    {
      key: 'name',
      header: 'Sản phẩm',
      render: (row: TopProductDto) => (
        <div className="flex items-center gap-3">
          <ProductThumb name={row.name} imageUrl={row.imageUrl} />
          <div className="min-w-0">
            <p className="truncate font-medium text-gray-900 dark:text-gray-100">{row.name}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">ID: {row.productId}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'sales',
      header: 'Số lượng bán',
      render: (row: TopProductDto) => row.sales.toLocaleString(),
    },
    {
      key: 'revenue',
      header: 'Doanh thu',
      render: (row: TopProductDto) => formatCurrency(row.revenue),
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Báo cáo sản phẩm</h1>
      <AnalyticsPeriodBar
        period={period}
        anchor={anchor}
        periodLabel={periodLabel}
        onPeriodChange={onPeriodChange}
        onAnchorChange={onAnchorChange}
      />

      {isLoading && products.length === 0 && categories.length === 0 ? (
        <SkeletonLoader type="card" count={2} />
      ) : productsError ? (
        <EmptyState title="Không thể tải phân tích sản phẩm" description="Đảm bảo dịch vụ analytics đang chạy." icon="inbox" />
      ) : (
        <>
          <ChartCard title={`Doanh số theo danh mục (${periodLabel})`}>
            {categoryChart.length === 0 ? (
              <EmptyState title="Không có dữ liệu danh mục" description="Doanh số theo danh mục sẽ hiển thị sau khi đơn hàng hoàn thành." icon="inbox" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={categoryChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
                  <YAxis stroke="#9ca3af" fontSize={12} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '12px' }}
                    formatter={(value, name) => [
                      name === 'revenue' ? formatCurrency(Number(value)) : Number(value).toLocaleString(),
                      name === 'revenue' ? 'Doanh thu' : 'Số lượng bán',
                    ]}
                  />
                  <Bar dataKey="sales" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          <div className="rounded-xl border border-gray-100 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Sản phẩm bán chạy ({periodLabel})
            </h3>
            {products.length === 0 ? (
              <EmptyState title="Không có sản phẩm" description="Sản phẩm bán chạy sẽ hiển thị sau khi có doanh số." icon="inbox" />
            ) : (
              <div className="mt-4">
                <DataTable
                  columns={columns}
                  data={products}
                  keyExtractor={(row) => String(row.productId)}
                  onRowClick={(row) => navigate(`/products/${row.productId}`)}
                />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
