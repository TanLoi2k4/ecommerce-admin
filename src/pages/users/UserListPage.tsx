import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Ban } from 'lucide-react';
import { useCustomers, useUpdateCustomerStatus } from '../../hooks/useCustomers';
import type { CustomerListItem, CustomerStatus } from '../../types/customer';
import { DataTable } from '../../components/ui/DataTable';
import { SearchBar } from '../../components/ui/SearchBar';
import { FilterPanel } from '../../components/ui/FilterPanel';
import { Pagination } from '../../components/ui/Pagination';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Modal } from '../../components/ui/Modal';
import { EmptyState } from '../../components/ui/EmptyState';
import { SkeletonLoader } from '../../components/ui/SkeletonLoader';
import { PageTitle } from '../../components/ui/PageTitle';
import { formatDate } from '../../utils/format';
import { extractApiError } from '../../utils/apiError';

export function UserListPage() {
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [suspendModal, setSuspendModal] = useState<{ open: boolean; user: CustomerListItem | null }>({
    open: false,
    user: null,
  });
  const [suspendReason, setSuspendReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    setPage(1);
  }, [searchQuery, filters]);

  const { data, isLoading, error: queryError } = useCustomers({
    page,
    size: 10,
    search: searchQuery || undefined,
    status: filters.status as CustomerStatus | undefined,
  });
  const suspendMutation = useUpdateCustomerStatus();

  const users = data?.data ?? [];
  const pagination = { page: data?.page ?? 1, totalPages: data?.totalPages ?? 1, total: data?.total ?? 0 };
  const listError = error ?? (queryError ? extractApiError(queryError, 'Không thể tải danh sách khách hàng') : null);

  const handleSuspend = async () => {
    if (!suspendModal.user) return;
    setError(null);
    try {
      await suspendMutation.mutateAsync({
        id: Number(suspendModal.user.id),
        status: 'SUSPENDED',
        reason: suspendReason || undefined,
      });
      setSuspendModal({ open: false, user: null });
      setSuspendReason('');
    } catch (err) {
      setError(extractApiError(err, 'Không thể đình chỉ khách hàng'));
    }
  };

  const filterOptions = [
    {
      key: 'status',
      label: 'Trạng thái',
      type: 'select' as const,
      options: [
        { value: 'ACTIVE', label: 'Hoạt động' },
        { value: 'SUSPENDED', label: 'Đã đình chỉ' },
        { value: 'INACTIVE', label: 'Không hoạt động' },
        { value: 'DELETED', label: 'Đã xóa' },
      ],
    },
  ];

  const columns = [
    {
      key: 'name',
      header: 'Khách hàng',
      render: (row: CustomerListItem) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-100 text-sm font-medium text-primary-700 dark:bg-primary-950/50 dark:text-primary-300">
            {row.name.charAt(0)}
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-gray-100">{row.name}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{row.email}</p>
          </div>
        </div>
      ),
    },
    { key: 'username', header: 'Tên đăng nhập' },
    { key: 'status', header: 'Trạng thái', render: (row: CustomerListItem) => <StatusBadge status={row.status} /> },
    {
      key: 'phone',
      header: 'Số điện thoại',
      render: (row: CustomerListItem) => row.phone ?? '—',
    },
    { key: 'createdAt', header: 'Ngày tham gia', render: (row: CustomerListItem) => formatDate(row.createdAt) },
    {
      key: 'actions',
      header: '',
      render: (row: CustomerListItem) => (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/users/${row.id}`);
            }}
            className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-primary-600 dark:hover:bg-gray-700"
          >
            <Eye className="h-4 w-4" />
          </button>
          {row.status !== 'suspended' && row.status !== 'deleted' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSuspendModal({ open: true, user: row });
              }}
              className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
            >
              <Ban className="h-4 w-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <PageTitle title="Khách hàng" />

      {listError && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
          {listError}
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchBar
          placeholder="Tìm theo tên đăng nhập hoặc email..."
          onSearch={setSearchQuery}
          className="flex-1"
        />
        <FilterPanel filters={filterOptions} onFilterChange={setFilters} />
      </div>

      {isLoading ? (
        <SkeletonLoader type="table" />
      ) : users.length === 0 ? (
        <EmptyState title="Không tìm thấy khách hàng" description="Thử điều chỉnh tìm kiếm hoặc bộ lọc." icon="search" />
      ) : (
        <>
          <DataTable
            columns={columns}
            data={users}
            keyExtractor={(row) => String((row as CustomerListItem).id)}
            onRowClick={(row) => navigate(`/users/${(row as CustomerListItem).id}`)}
          />
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={setPage}
          />
        </>
      )}

      <Modal
        isOpen={suspendModal.open}
        onClose={() => setSuspendModal({ open: false, user: null })}
        title="Đình chỉ khách hàng"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Bạn có chắc muốn đình chỉ <strong>{suspendModal.user?.name}</strong>?
          </p>
          <textarea
            value={suspendReason}
            onChange={(e) => setSuspendReason(e.target.value)}
            placeholder="Lý do đình chỉ (tùy chọn)..."
            className="h-24 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setSuspendModal({ open: false, user: null })}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Hủy
            </button>
            <button
              onClick={handleSuspend}
              disabled={suspendMutation.isPending}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              {suspendMutation.isPending ? 'Đang đình chỉ...' : 'Đình chỉ'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
