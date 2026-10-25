import { useEffect, useState } from 'react';
import { useTransactions } from '../../hooks/useTransactions';
import { DataTable } from '../../components/ui/DataTable';
import { SearchBar } from '../../components/ui/SearchBar';
import { FilterPanel } from '../../components/ui/FilterPanel';
import { Pagination } from '../../components/ui/Pagination';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { EmptyState } from '../../components/ui/EmptyState';
import { SkeletonLoader } from '../../components/ui/SkeletonLoader';
import { PageTitle } from '../../components/ui/PageTitle';
import { formatCurrency, formatDate } from '../../utils/format';
import { TRANSACTION_TYPE_LABELS } from '../../utils/paymentLabels';
import type { TransactionListItem } from '../../types/order';

export function TransactionListPage() {
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});

  useEffect(() => {
    setPage(1);
  }, [searchQuery, filters]);

  const { data, isLoading } = useTransactions({ page, size: 10, search: searchQuery, ...filters });
  const transactions = data?.data ?? [];
  const pagination = { page: data?.page ?? 1, totalPages: data?.totalPages ?? 1, total: data?.total ?? 0 };

  const filterOptions = [
    {
      key: 'status',
      label: 'Trạng thái',
      type: 'select' as const,
      options: [
        { value: 'completed', label: 'Hoàn thành' },
        { value: 'pending', label: 'Chờ xử lý' },
        { value: 'failed', label: 'Thất bại' },
      ],
    },
  ];

  const columns = [
    { key: 'id', header: 'Mã giao dịch' },
    { key: 'orderId', header: 'Đơn hàng' },
    {
      key: 'type',
      header: 'Loại',
      render: (row: TransactionListItem) => TRANSACTION_TYPE_LABELS[row.type] ?? row.type,
    },
    { key: 'amount', header: 'Số tiền', render: (row: TransactionListItem) => formatCurrency(row.amount) },
    {
      key: 'method',
      header: 'Phương thức',
      render: (row: TransactionListItem) => (
        <span className="capitalize">{row.method?.replace('_', ' ') ?? '—'}</span>
      ),
    },
    { key: 'status', header: 'Trạng thái', render: (row: TransactionListItem) => <StatusBadge status={row.status} /> },
    { key: 'createdAt', header: 'Ngày', render: (row: TransactionListItem) => formatDate(row.createdAt) },
  ];

  return (
    <div className="space-y-6">
      <PageTitle
        title="Giao dịch khách"
        subtitle="Thanh toán đơn hàng của khách — tách biệt với chi trả nhà bán và phí sàn"
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchBar placeholder="Tìm kiếm giao dịch..." onSearch={setSearchQuery} className="flex-1" />
        <FilterPanel filters={filterOptions} onFilterChange={setFilters} />
      </div>

      {isLoading ? (
        <SkeletonLoader type="table" />
      ) : transactions.length === 0 ? (
        <EmptyState title="Không tìm thấy giao dịch" description="Thử điều chỉnh tìm kiếm hoặc bộ lọc." icon="search" />
      ) : (
        <>
          <DataTable
            columns={columns}
            data={transactions}
            keyExtractor={(row) => String((row as TransactionListItem).id)}
          />
          <Pagination currentPage={pagination.page} totalPages={pagination.totalPages} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
