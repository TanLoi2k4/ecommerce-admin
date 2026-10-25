import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Flag } from 'lucide-react';
import { useReports } from '../../hooks/useReports';
import { DataTable } from '../../components/ui/DataTable';
import { SearchBar } from '../../components/ui/SearchBar';
import { FilterPanel } from '../../components/ui/FilterPanel';
import { Pagination } from '../../components/ui/Pagination';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { EmptyState } from '../../components/ui/EmptyState';
import { SkeletonLoader } from '../../components/ui/SkeletonLoader';
import { PageTitle } from '../../components/ui/PageTitle';
import { formatDateTime } from '../../utils/format';
import { extractApiError } from '../../utils/apiError';
import { REPORT_TYPE_LABELS, type ReportResponse } from '../../types/report';

const PAGE_SIZE = 10;

function shortId(id: string) {
  if (!id) return '—';
  if (id.length <= 12) return id;
  return `${id.slice(0, 8)}…`;
}

export function ComplaintReportsPage() {
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const navigate = useNavigate();

  const { data, isLoading, error } = useReports({ page: 1, size: 200 });
  const allReports = data?.data ?? [];

  useEffect(() => {
    setPage(1);
  }, [searchQuery, filters]);

  const filtered = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return allReports.filter((report) => {
      if (filters.status && report.status !== filters.status) return false;
      if (filters.type && report.type !== filters.type) return false;
      if (!query) return true;
      return (
        report.reason.toLowerCase().includes(query) ||
        report.description.toLowerCase().includes(query) ||
        report.reporterKeycloakId.toLowerCase().includes(query) ||
        (report.reporterName ?? '').toLowerCase().includes(query) ||
        (report.targetName ?? '').toLowerCase().includes(query) ||
        (report.assignedAdminName ?? '').toLowerCase().includes(query) ||
        String(report.id).includes(query)
      );
    });
  }, [allReports, filters, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  const filterOptions = [
    {
      key: 'status',
      label: 'Trạng thái',
      type: 'select' as const,
      options: [
        { value: 'OPEN', label: 'Mở' },
        { value: 'IN_PROGRESS', label: 'Đang xử lý' },
        { value: 'RESOLVED', label: 'Đã giải quyết' },
        { value: 'REJECTED', label: 'Từ chối' },
      ],
    },
    {
      key: 'type',
      label: 'Loại',
      type: 'select' as const,
      options: [
        { value: 'PRODUCT', label: 'Sản phẩm' },
        { value: 'VENDOR', label: 'Nhà bán' },
        { value: 'ORDER', label: 'Đơn hàng' },
        { value: 'OTHER', label: 'Khác' },
      ],
    },
  ];

  const columns = [
    {
      key: 'reason',
      header: 'Khiếu nại',
      render: (row: ReportResponse) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300">
            <Flag className="h-4 w-4" />
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-gray-100">{row.reason}</p>
            <p className="max-w-xs truncate text-xs text-gray-500 dark:text-gray-400">
              {row.description}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Loại',
      render: (row: ReportResponse) => (
        <span>
          {REPORT_TYPE_LABELS[row.type]}
          {row.targetName
            ? ` · ${row.targetName}`
            : row.targetId != null
              ? ` #${row.targetId}`
              : ''}
        </span>
      ),
    },
    {
      key: 'reporter',
      header: 'Người báo cáo',
      render: (row: ReportResponse) => (
        <div>
          <p className="font-medium text-gray-900 dark:text-gray-100">
            {row.reporterName ?? shortId(row.reporterKeycloakId)}
          </p>
          <p className="text-xs text-gray-400">{row.reporterRole}</p>
        </div>
      ),
    },
    {
      key: 'assignedAdmin',
      header: 'Quản trị viên xử lý',
      render: (row: ReportResponse) => (
        <span className="text-sm text-gray-700 dark:text-gray-300">
          {row.assignedAdminName ?? shortId(row.assignedAdminId ?? '')}
        </span>
      ),
    },
    { key: 'status', header: 'Trạng thái', render: (row: ReportResponse) => <StatusBadge status={row.status.toLowerCase()} /> },
    { key: 'createdAt', header: 'Ngày tạo', render: (row: ReportResponse) => formatDateTime(row.createdAt) },
    {
      key: 'actions',
      header: '',
      render: (row: ReportResponse) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/reports/complaints/${row.id}`);
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
      <PageTitle
        title="Khiếu nại"
        subtitle="Xem xét và xử lý báo cáo khiếu nại từ khách hàng và nhà bán"
      />

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
          {extractApiError(error, 'Không thể tải danh sách khiếu nại')}
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchBar placeholder="Tìm theo lý do, mô tả, mã..." onSearch={setSearchQuery} className="flex-1" />
        <FilterPanel filters={filterOptions} onFilterChange={setFilters} />
      </div>

      {isLoading ? (
        <SkeletonLoader type="table" />
      ) : paginated.length === 0 ? (
        <EmptyState title="Không tìm thấy khiếu nại" description="Thử điều chỉnh tìm kiếm hoặc bộ lọc." icon="search" />
      ) : (
        <>
          <DataTable
            columns={columns}
            data={paginated}
            keyExtractor={(row) => String((row as ReportResponse).id)}
            onRowClick={(row) => navigate(`/reports/complaints/${(row as ReportResponse).id}`)}
          />
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
