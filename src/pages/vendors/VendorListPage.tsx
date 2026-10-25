import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Ban } from 'lucide-react';
import { useVendors, useUpdateVendorStatus } from '../../hooks/useVendors';
import type { VendorListItem, VendorStatus } from '../../types/vendor';
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

export function VendorListPage() {
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [suspendModal, setSuspendModal] = useState<{ open: boolean; vendor: VendorListItem | null }>({
    open: false,
    vendor: null,
  });
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    setPage(1);
  }, [searchQuery, filters]);

  const { data, isLoading, error: queryError } = useVendors({
    page,
    size: 10,
    search: searchQuery || undefined,
    status: filters.status as VendorStatus | undefined,
  });
  const suspendMutation = useUpdateVendorStatus();

  const vendors = data?.data ?? [];
  const pagination = { page: data?.page ?? 1, totalPages: data?.totalPages ?? 1, total: data?.total ?? 0 };
  const listError = error ?? (queryError ? extractApiError(queryError, 'Không thể tải danh sách nhà bán hàng') : null);

  const handleSuspend = async () => {
    if (!suspendModal.vendor) return;
    setError(null);
    try {
      await suspendMutation.mutateAsync({
        id: Number(suspendModal.vendor.id),
        status: 'SUSPENDED',
      });
      setSuspendModal({ open: false, vendor: null });
    } catch (err) {
      setError(extractApiError(err, 'Không thể đình chỉ nhà bán hàng'));
    }
  };

  const filterOptions = [
    {
      key: 'status',
      label: 'Trạng thái',
      type: 'select' as const,
      options: [
        { value: 'ACTIVE', label: 'Hoạt động' },
        { value: 'INACTIVE', label: 'Không hoạt động' },
        { value: 'SUSPENDED', label: 'Đã đình chỉ' },
        { value: 'DELETED', label: 'Đã xóa' },
      ],
    },
  ];

  const columns = [
    {
      key: 'shopName',
      header: 'Nhà bán hàng',
      render: (row: VendorListItem) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-sm font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
            {row.shopName.charAt(0)}
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-gray-100">{row.shopName}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{row.ownerName}</p>
          </div>
        </div>
      ),
    },
    { key: 'email', header: 'Email' },
    { key: 'phone', header: 'Số điện thoại', render: (row: VendorListItem) => row.phone ?? '—' },
    {
      key: 'createdAt',
      header: 'Ngày tham gia',
      render: (row: VendorListItem) => formatDate(row.createdAt),
    },
    { key: 'status', header: 'Trạng thái', render: (row: VendorListItem) => <StatusBadge status={row.status} /> },
    {
      key: 'actions',
      header: '',
      render: (row: VendorListItem) => (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/vendors/${row.id}`);
            }}
            className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-primary-600 dark:hover:bg-gray-700"
          >
            <Eye className="h-4 w-4" />
          </button>
          {row.status === 'active' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSuspendModal({ open: true, vendor: row });
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
      <PageTitle title="Nhà bán hàng" />

      {listError && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
          {listError}
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchBar placeholder="Tìm kiếm nhà bán hàng..." onSearch={setSearchQuery} className="flex-1" />
        <FilterPanel filters={filterOptions} onFilterChange={setFilters} />
      </div>

      {isLoading ? (
        <SkeletonLoader type="table" />
      ) : vendors.length === 0 ? (
        <EmptyState title="Không tìm thấy nhà bán hàng" description="Thử điều chỉnh tìm kiếm hoặc bộ lọc." icon="search" />
      ) : (
        <>
          <DataTable
            columns={columns}
            data={vendors}
            keyExtractor={(row) => String((row as VendorListItem).id)}
            onRowClick={(row) => navigate(`/vendors/${(row as VendorListItem).id}`)}
          />
          <Pagination currentPage={pagination.page} totalPages={pagination.totalPages} onPageChange={setPage} />
        </>
      )}

      <Modal
        isOpen={suspendModal.open}
        onClose={() => setSuspendModal({ open: false, vendor: null })}
        title="Đình chỉ nhà bán hàng"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Bạn có chắc muốn đình chỉ <strong>{suspendModal.vendor?.shopName}</strong>?
          </p>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setSuspendModal({ open: false, vendor: null })}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Hủy
            </button>
            <button
              onClick={handleSuspend}
              disabled={suspendMutation.isPending}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              Đình chỉ
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
