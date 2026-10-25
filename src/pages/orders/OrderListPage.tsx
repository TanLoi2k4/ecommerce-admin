import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye } from 'lucide-react';
import { useOrders } from '../../hooks/useOrders';
import { DataTable } from '../../components/ui/DataTable';
import { SearchBar } from '../../components/ui/SearchBar';
import { FilterPanel } from '../../components/ui/FilterPanel';
import { Pagination } from '../../components/ui/Pagination';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { EmptyState } from '../../components/ui/EmptyState';
import { SkeletonLoader } from '../../components/ui/SkeletonLoader';
import { formatCurrency, formatDate } from '../../utils/format';
import type { OrderListItem } from '../../types/order';

export function OrderListPage() {
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const navigate = useNavigate();

  useEffect(() => {
    setPage(1);
  }, [searchQuery, filters]);

  const { data, isLoading } = useOrders({ page, size: 10, search: searchQuery, status: filters.status });
  const orders = data?.data ?? [];
  const pagination = { page: data?.page ?? 1, totalPages: data?.totalPages ?? 1, total: data?.total ?? 0 };

  const filterOptions = [
    {
      key: 'status',
      label: 'Trạng thái',
      type: 'select' as const,
      options: [
        { value: 'pending', label: 'Chờ xử lý' },
        { value: 'processing', label: 'Đang xử lý' },
        { value: 'shipped', label: 'Đang giao hàng' },
        { value: 'delivered', label: 'Đã giao' },
        { value: 'cancelled', label: 'Đã hủy' },
        { value: 'refund_requested', label: 'Yêu cầu hoàn tiền' },
      ],
    },
  ];

  const columns = [
    { key: 'id', header: 'Mã đơn hàng' },
    {
      key: 'customerName',
      header: 'Khách hàng',
      render: (row: OrderListItem) => (
        <div>
          <p className="font-medium text-gray-900 dark:text-gray-100">{row.customerName}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{row.vendorName}</p>
        </div>
      ),
    },
    { key: 'items', header: 'Sản phẩm' },
    { key: 'total', header: 'Tổng cộng', render: (row: OrderListItem) => formatCurrency(row.total) },
    { key: 'status', header: 'Trạng thái', render: (row: OrderListItem) => <StatusBadge status={row.status} /> },
    { key: 'paymentStatus', header: 'Thanh toán', render: (row: OrderListItem) => <StatusBadge status={row.paymentStatus} /> },
    { key: 'createdAt', header: 'Ngày', render: (row: OrderListItem) => formatDate(row.createdAt) },
    {
      key: 'actions',
      header: '',
      render: (row: OrderListItem) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/orders/${row.id}`);
          }}
          className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-primary-600 dark:hover:bg-gray-700"
        >
          <Eye className="h-4 w-4" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Đơn hàng</h1>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchBar placeholder="Tìm kiếm đơn hàng..." onSearch={setSearchQuery} className="flex-1" />
        <FilterPanel filters={filterOptions} onFilterChange={setFilters} />
      </div>

      {isLoading ? (
        <SkeletonLoader type="table" />
      ) : orders.length === 0 ? (
        <EmptyState title="Không tìm thấy đơn hàng" description="Thử điều chỉnh tìm kiếm hoặc bộ lọc." icon="search" />
      ) : (
        <>
          <DataTable
            columns={columns}
            data={orders}
            keyExtractor={(row) => String((row as OrderListItem).id)}
            onRowClick={(row) => navigate(`/orders/${(row as OrderListItem).id}`)}
          />
          <Pagination currentPage={pagination.page} totalPages={pagination.totalPages} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
