import { useEffect, useMemo, useState, type ElementType } from 'react';
import { Package, Truck, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { useAdminShipments } from '../../hooks/useShipments';
import { ShipmentTable } from '../../components/shipments/ShipmentTable';
import { SearchBar } from '../../components/ui/SearchBar';
import { FilterPanel } from '../../components/ui/FilterPanel';
import { Pagination } from '../../components/ui/Pagination';
import { EmptyState } from '../../components/ui/EmptyState';
import { SkeletonLoader } from '../../components/ui/SkeletonLoader';
import { PageTitle } from '../../components/ui/PageTitle';
import { extractApiError } from '../../utils/apiError';
import { shipmentStatusLabel } from '../../utils/shipmentLabels';
import { filterShipments, SHIPMENT_STATUSES, type ShipmentStatus } from '../../types/shipment';
import { cn } from '../../utils/cn';

const PAGE_SIZE = 10;

type SummaryKey = 'ALL' | 'IN_TRANSIT' | 'DELIVERED' | 'ISSUES' | 'CANCELLED';

const SUMMARY_CARDS: {
  key: SummaryKey;
  label: string;
  icon: ElementType;
  statuses?: ShipmentStatus[];
}[] = [
  { key: 'ALL', label: 'Tất cả', icon: Package },
  { key: 'IN_TRANSIT', label: 'Đang giao', icon: Truck, statuses: ['BOOKED', 'PICKED_UP', 'IN_TRANSIT'] },
  { key: 'DELIVERED', label: 'Đã giao', icon: CheckCircle, statuses: ['DELIVERED'] },
  { key: 'ISSUES', label: 'Sự cố', icon: AlertTriangle, statuses: ['BOOKING_FAILED', 'FAILED_DELIVERY', 'RETURNING', 'RETURNED'] },
  { key: 'CANCELLED', label: 'Đã hủy', icon: XCircle, statuses: ['CANCELLED'] },
];

export function ShipmentListPage() {
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [summaryKey, setSummaryKey] = useState<SummaryKey>('ALL');
  const { data: shipments = [], isLoading, isError, error, refetch } = useAdminShipments();

  const statusFilter = filters.status || undefined;

  const filtered = useMemo(() => {
    const summary = SUMMARY_CARDS.find((card) => card.key === summaryKey);
    const bySummary = summary?.statuses
      ? shipments.filter((shipment) => summary.statuses!.includes(shipment.status))
      : shipments;
    return filterShipments(bySummary, searchQuery, statusFilter);
  }, [shipments, searchQuery, statusFilter, summaryKey]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, statusFilter, summaryKey]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const filterOptions = [
    {
      key: 'status',
      label: 'Trạng thái',
      type: 'select' as const,
      options: SHIPMENT_STATUSES.map((status) => ({
        value: status,
        label: shipmentStatusLabel[status],
      })),
    },
  ];

  return (
    <div className="space-y-4">
      <PageTitle title="Vận đơn" subtitle="Theo dõi mọi vận đơn trên nền tảng." />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {SUMMARY_CARDS.map((card) => {
          const Icon = card.icon;
          const count = card.statuses
            ? shipments.filter((shipment) => card.statuses!.includes(shipment.status)).length
            : shipments.length;
          const active = summaryKey === card.key;
          return (
            <button
              key={card.key}
              type="button"
              onClick={() => setSummaryKey(card.key)}
              className={cn(
                'flex items-center gap-3 rounded-xl border p-4 text-left transition-shadow hover:shadow-md',
                active
                  ? 'border-primary-300 ring-2 ring-primary-500 dark:border-primary-700'
                  : 'border-gray-100 bg-white dark:border-gray-700 dark:bg-gray-800',
              )}
            >
              <div className="rounded-lg bg-primary-100 p-2 text-primary-600 dark:bg-primary-900/30">
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs text-gray-500">{card.label}</p>
                <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {isLoading ? '—' : count}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchBar
          placeholder="Tìm theo mã vận đơn, đơn hàng, đơn vị VC..."
          onSearch={setSearchQuery}
          className="flex-1"
        />
        <FilterPanel filters={filterOptions} onFilterChange={setFilters} />
      </div>

      {isLoading ? (
        <SkeletonLoader type="table" />
      ) : isError ? (
        <EmptyState
          icon="alert"
          title="Không tải được danh sách vận đơn"
          description={extractApiError(error, 'Vui lòng thử lại')}
          action={
            <button
              type="button"
              onClick={() => void refetch()}
              className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
            >
              Thử lại
            </button>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="Chưa có vận đơn"
          description={
            searchQuery || statusFilter || summaryKey !== 'ALL'
              ? 'Không có vận đơn nào khớp bộ lọc này.'
              : 'Vận đơn sẽ xuất hiện sau khi nhà bán gửi yêu cầu vận chuyển.'
          }
          icon="package"
        />
      ) : (
        <>
          <ShipmentTable shipments={paginated} />
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
