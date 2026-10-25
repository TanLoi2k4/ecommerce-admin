import { useEffect, useState } from 'react';
import { Activity, AlertCircle, BarChart3, Info } from 'lucide-react';
import { FilterPanel } from '../../components/ui/FilterPanel';
import { Pagination } from '../../components/ui/Pagination';
import { DataTable } from '../../components/ui/DataTable';
import { SkeletonLoader } from '../../components/ui/SkeletonLoader';
import { EmptyState } from '../../components/ui/EmptyState';
import { PageTitle } from '../../components/ui/PageTitle';
import { DashboardCard } from '../../components/ui/DashboardCard';
import { logService } from '../../services/logService';
import type { LogLevel, LogResponse, LogStats } from '../../types';
import { extractApiError } from '../../utils/apiError';
import { formatDateTime } from '../../utils/format';

const levelStyles: Record<string, string> = {
  ERROR: 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400',
  WARN: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
  INFO: 'bg-primary-50 text-primary-700 dark:bg-primary-950/50 dark:text-primary-400',
  DEBUG: 'bg-gray-50 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
};

export function SecurityLogsPage() {
  const [logs, setLogs] = useState<LogResponse[]>([]);
  const [stats, setStats] = useState<LogStats | null>(null);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Record<string, string>>({});

  useEffect(() => {
    logService.getStats(24).then(setStats).catch(() => setStats(null));
  }, []);

  const fetchLogs = async (page = 1) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await logService.getLogs({
        page,
        size: 20,
        action: filters.action || undefined,
        resourceType: filters.resourceType || undefined,
        level: (filters.level as LogLevel) || undefined,
      });
      setLogs(result.data);
      setPagination({ page: result.page, totalPages: result.totalPages, total: result.total });
    } catch (err) {
      setError(extractApiError(err, 'Không thể tải nhật ký'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(1);
  }, [filters]);

  const filterOptions = [
    {
      key: 'action',
      label: 'Hành động',
      type: 'select' as const,
      options: [
        { value: 'LOGIN', label: 'Đăng nhập' },
        { value: 'LOGOUT', label: 'Đăng xuất' },
        { value: 'CREATE', label: 'Tạo mới' },
        { value: 'UPDATE', label: 'Cập nhật' },
        { value: 'DELETE', label: 'Xóa' },
      ],
    },
    {
      key: 'resourceType',
      label: 'Tài nguyên',
      type: 'select' as const,
      options: [
        { value: 'USER', label: 'Người dùng' },
        { value: 'ADMIN_USER', label: 'Quản trị viên' },
        { value: 'PRODUCT', label: 'Sản phẩm' },
        { value: 'ORDER', label: 'Đơn hàng' },
      ],
    },
    {
      key: 'level',
      label: 'Mức độ',
      type: 'select' as const,
      options: [
        { value: 'INFO', label: 'Thông tin' },
        { value: 'WARN', label: 'Cảnh báo' },
        { value: 'ERROR', label: 'Lỗi' },
        { value: 'DEBUG', label: 'Gỡ lỗi' },
      ],
    },
  ];

  const columns = [
    {
      key: 'action',
      header: 'Hành động',
      render: (row: LogResponse) => <span className="font-medium">{row.action}</span>,
    },
    {
      key: 'resourceType',
      header: 'Tài nguyên',
      render: (row: LogResponse) => <span>{row.resourceType}</span>,
    },
    {
      key: 'level',
      header: 'Mức độ',
      render: (row: LogResponse) => (
        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${levelStyles[row.level]}`}>
          {row.level}
        </span>
      ),
    },
    { key: 'username', header: 'Người dùng', render: (row: LogResponse) => row.username || '—' },
    { key: 'message', header: 'Nội dung' },
    { key: 'ipAddress', header: 'IP', render: (row: LogResponse) => row.ipAddress || '—' },
    { key: 'createdAt', header: 'Thời gian', render: (row: LogResponse) => formatDateTime(row.createdAt) },
  ];

  return (
    <div className="space-y-4">
      <PageTitle title="Nhật ký hệ thống" subtitle="Theo dõi hoạt động và sự kiện kiểm toán trên nền tảng" />

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {stats && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <DashboardCard title="Tổng số nhật ký" value={String(stats.totalLogs)} icon={BarChart3} />
          <DashboardCard title="Gần đây (24h)" value={String(stats.recentLogs)} icon={Activity} />
          <DashboardCard title="Thông tin" value={String(stats.logsByLevel?.INFO ?? 0)} icon={Info} />
          <DashboardCard
            title="Lỗi"
            value={String(stats.logsByLevel?.ERROR ?? 0)}
            icon={AlertCircle}
            iconColor="text-red-600"
            iconBgColor="bg-red-50"
          />
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
        <FilterPanel filters={filterOptions} onFilterChange={setFilters} />
      </div>

      {isLoading ? (
        <SkeletonLoader type="table" />
      ) : logs.length === 0 ? (
        <EmptyState title="Không tìm thấy nhật ký" description="Thử điều chỉnh bộ lọc." icon="search" />
      ) : (
        <>
          <DataTable columns={columns} data={logs} keyExtractor={(row) => String(row.id)} />
          <Pagination currentPage={pagination.page} totalPages={pagination.totalPages} onPageChange={fetchLogs} />
        </>
      )}
    </div>
  );
}
