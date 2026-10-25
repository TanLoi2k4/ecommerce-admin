import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, X, Eye } from 'lucide-react';
import { DataTable } from '../../components/ui/DataTable';
import { Modal } from '../../components/ui/Modal';
import { EmptyState } from '../../components/ui/EmptyState';
import { SkeletonLoader } from '../../components/ui/SkeletonLoader';
import { formatCurrency, formatDate } from '../../utils/format';
import { orderService } from '../../services/orderService';
import {
  RETURN_REASON_LABELS,
  RETURN_STATUS_LABELS,
  type ReturnRequestDto,
  type ReturnRequestStatus,
} from '../../types/order';

const FILTERS: { id: ReturnRequestStatus | 'all'; label: string }[] = [
  { id: 'DISPUTED', label: 'Khiếu nại' },
  { id: 'REJECTED', label: 'Shop từ chối' },
  { id: 'REQUESTED', label: 'Chờ shop' },
  { id: 'REFUNDED', label: 'Đã hoàn' },
  { id: 'all', label: 'Tất cả' },
];

export function RefundRequestsPage() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<ReturnRequestStatus | 'all'>('DISPUTED');
  const [selected, setSelected] = useState<ReturnRequestDto | null>(null);
  const [note, setNote] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['orders', 'admin', 'returns', status],
    queryFn: () =>
      orderService.listReturns({
        size: 50,
        status: status === 'all' ? undefined : status,
      }),
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['orders', 'admin', 'returns'] });
  };

  const approveMutation = useMutation({
    mutationFn: () => orderService.approveReturn(selected!.id, note.trim() || undefined),
    onSuccess: () => {
      setSelected(null);
      setNote('');
      invalidate();
    },
  });

  const rejectMutation = useMutation({
    mutationFn: () => orderService.rejectReturn(selected!.id, note.trim()),
    onSuccess: () => {
      setSelected(null);
      setNote('');
      invalidate();
    },
  });

  const returns = data?.items ?? [];
  const canDecide = selected?.status === 'DISPUTED' || selected?.status === 'REJECTED';

  const columns = [
    { key: 'id', header: 'Mã', render: (row: ReturnRequestDto) => `#${row.id}` },
    { key: 'orderCode', header: 'Đơn hàng' },
    {
      key: 'reason',
      header: 'Lý do',
      render: (row: ReturnRequestDto) => RETURN_REASON_LABELS[row.reason],
    },
    {
      key: 'refundAmount',
      header: 'Số tiền',
      render: (row: ReturnRequestDto) => formatCurrency(Number(row.refundAmount)),
    },
    {
      key: 'status',
      header: 'Trạng thái',
      render: (row: ReturnRequestDto) => RETURN_STATUS_LABELS[row.status],
    },
    {
      key: 'createdAt',
      header: 'Yêu cầu lúc',
      render: (row: ReturnRequestDto) => formatDate(row.createdAt),
    },
    {
      key: 'actions',
      header: '',
      render: (row: ReturnRequestDto) => (
        <button
          type="button"
          onClick={() => {
            setSelected(row);
            setNote('');
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
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Trả hàng & hoàn tiền</h1>
          <p className="text-sm text-gray-500">Chỉ phân xử khi khách đưa yêu cầu lên Avora.</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((filter) => (
          <button
            key={filter.id}
            type="button"
            onClick={() => setStatus(filter.id)}
            className={`rounded-full px-3 py-1.5 text-sm ${
              status === filter.id
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <SkeletonLoader type="table" />
      ) : returns.length === 0 ? (
        <EmptyState
          title="Không có yêu cầu"
          description="Yêu cầu trả hàng khiếu nại sẽ hiển thị tại đây."
          icon="inbox"
        />
      ) : (
        <DataTable columns={columns} data={returns} keyExtractor={(row) => String(row.id)} />
      )}

      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title="Chi tiết trả hàng" size="md">
        {selected && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500">Đơn hàng</label>
                <p className="font-medium text-gray-900 dark:text-gray-100">{selected.orderCode}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500">Số tiền hoàn</label>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {formatCurrency(Number(selected.refundAmount))}
                </p>
              </div>
              <div>
                <label className="text-xs text-gray-500">Lý do</label>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {RETURN_REASON_LABELS[selected.reason]}
                </p>
              </div>
              <div>
                <label className="text-xs text-gray-500">Trạng thái</label>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {RETURN_STATUS_LABELS[selected.status]}
                </p>
              </div>
            </div>
            {selected.description && (
              <p className="text-sm text-gray-700 dark:text-gray-300">{selected.description}</p>
            )}
            {selected.sellerNote && (
              <p className="text-sm text-gray-700 dark:text-gray-300">Shop: {selected.sellerNote}</p>
            )}
            {canDecide && (
              <textarea
                className="w-full rounded-lg border border-gray-200 p-2 text-sm dark:border-gray-600 dark:bg-gray-800"
                rows={3}
                placeholder="Ghi chú admin"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            )}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Đóng
              </button>
              {canDecide && (
                <>
                  <button
                    type="button"
                    disabled={rejectMutation.isPending || !note.trim()}
                    onClick={() => rejectMutation.mutate()}
                    className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                  >
                    <X className="h-4 w-4" />
                    Bác yêu cầu
                  </button>
                  <button
                    type="button"
                    disabled={approveMutation.isPending}
                    onClick={() => approveMutation.mutate()}
                    className="inline-flex items-center gap-1 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
                  >
                    <Check className="h-4 w-4" />
                    Chấp nhận trả hàng
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
