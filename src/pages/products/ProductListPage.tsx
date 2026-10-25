import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Trash2 } from 'lucide-react';
import { useDeleteProduct, useProducts } from '../../hooks/useProducts';
import type { ProductListItem, ProductStatus } from '../../types/product';
import { DataTable } from '../../components/ui/DataTable';
import { SearchBar } from '../../components/ui/SearchBar';
import { FilterPanel } from '../../components/ui/FilterPanel';
import { Pagination } from '../../components/ui/Pagination';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { EmptyState } from '../../components/ui/EmptyState';
import { SkeletonLoader } from '../../components/ui/SkeletonLoader';
import { PageTitle } from '../../components/ui/PageTitle';
import { Modal } from '../../components/ui/Modal';
import { formatCurrency } from '../../utils/format';
import { extractApiError } from '../../utils/apiError';

export function ProductListPage() {
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; product: ProductListItem | null }>({
    open: false,
    product: null,
  });
  const navigate = useNavigate();
  const deleteMutation = useDeleteProduct();

  useEffect(() => {
    setPage(1);
  }, [searchQuery, filters]);

  const { data, isLoading, error: queryError } = useProducts({
    page,
    size: 10,
    search: searchQuery || undefined,
    status: filters.status as ProductStatus | undefined,
  });

  const products = data?.data ?? [];
  const pagination = { page: data?.page ?? 1, totalPages: data?.totalPages ?? 1, total: data?.total ?? 0 };
  const listError = error ?? (queryError ? extractApiError(queryError, 'Không thể tải danh sách sản phẩm') : null);

  const handleDelete = async () => {
    if (!deleteModal.product) return;
    setError(null);
    try {
      await deleteMutation.mutateAsync(Number(deleteModal.product.id));
      setDeleteModal({ open: false, product: null });
    } catch (err) {
      setError(extractApiError(err, 'Không thể xóa sản phẩm'));
    }
  };

  const filterOptions = [
    {
      key: 'status',
      label: 'Trạng thái',
      type: 'select' as const,
      options: [
        { value: 'active', label: 'Hoạt động' },
        { value: 'out_of_stock', label: 'Hết hàng' },
        { value: 'deleted', label: 'Đã xóa' },
      ],
    },
  ];

  const columns = [
    {
      key: 'name',
      header: 'Sản phẩm',
      render: (row: ProductListItem) => (
        <div className="flex items-center gap-3">
          {row.imageUrl ? (
            <img src={row.imageUrl} alt="" className="h-10 w-10 rounded-lg object-cover" />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-sm font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
              {row.name.charAt(0)}
            </div>
          )}
          <div>
            <p className="font-medium text-gray-900 dark:text-gray-100">{row.name}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{row.vendorName}</p>
          </div>
        </div>
      ),
    },
    { key: 'category', header: 'Danh mục' },
    { key: 'price', header: 'Giá', render: (row: ProductListItem) => formatCurrency(row.price) },
    { key: 'stock', header: 'Tồn kho' },
    { key: 'status', header: 'Trạng thái', render: (row: ProductListItem) => <StatusBadge status={row.status} /> },
    {
      key: 'actions',
      header: '',
      render: (row: ProductListItem) => (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/products/${row.id}`);
            }}
            className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-primary-600 dark:hover:bg-gray-700"
          >
            <Eye className="h-4 w-4" />
          </button>
          {row.status !== 'deleted' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setDeleteModal({ open: true, product: row });
              }}
              className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <PageTitle title="Sản phẩm" />

      {listError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          {listError}
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchBar placeholder="Tìm kiếm sản phẩm..." onSearch={setSearchQuery} className="flex-1" />
        <FilterPanel filters={filterOptions} onFilterChange={setFilters} />
      </div>

      {isLoading ? (
        <SkeletonLoader type="table" />
      ) : products.length === 0 ? (
        <EmptyState title="Không tìm thấy sản phẩm" description="Thử điều chỉnh tìm kiếm hoặc bộ lọc." icon="search" />
      ) : (
        <>
          <DataTable
            columns={columns}
            data={products}
            keyExtractor={(row) => row.id}
            onRowClick={(row) => navigate(`/products/${row.id}`)}
          />
          <Pagination currentPage={pagination.page} totalPages={pagination.totalPages} onPageChange={setPage} />
        </>
      )}

      <Modal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, product: null })}
        title="Xóa sản phẩm"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Bạn có chắc muốn xóa sản phẩm <strong>{deleteModal.product?.name}</strong>? Sản phẩm sẽ được đánh dấu là
            đã xóa và không còn hiển thị trên marketplace.
          </p>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setDeleteModal({ open: false, product: null })}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Hủy
            </button>
            <button
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              {deleteMutation.isPending ? 'Đang xóa...' : 'Xóa'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
