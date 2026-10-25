import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Package, Truck } from 'lucide-react';
import { useAdminShipment } from '../../hooks/useShipments';
import { ShipmentTrackingTimeline } from '../../components/shipments/ShipmentTrackingTimeline';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { EmptyState } from '../../components/ui/EmptyState';
import { extractApiError } from '../../utils/apiError';
import { formatDateTime } from '../../utils/format';
import { formatCarrierLabel } from '../../utils/shipmentLabels';

export function ShipmentDetailsPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const shipmentId = Number(id);
  const { data: shipment, isLoading, isError, error } = useAdminShipment(
    Number.isFinite(shipmentId) ? shipmentId : undefined,
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        <div className="h-96 animate-pulse rounded-xl bg-gray-200 dark:bg-gray-700" />
      </div>
    );
  }

  if (isError || !shipment) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => navigate('/shipments')}
          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <EmptyState
          icon="alert"
          title="Không tìm thấy vận đơn"
          description={extractApiError(error, 'Vận đơn có thể đã bị xóa hoặc không khả dụng.')}
        />
      </div>
    );
  }

  const trackingCode = shipment.carrierTrackingId || shipment.externalShipmentId;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/shipments')}
          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Vận đơn #{shipment.id}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Cập nhật {formatDateTime(shipment.updatedAt)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-xl border border-gray-100 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Hành trình</h3>
            <div className="mt-4">
              <ShipmentTrackingTimeline shipmentId={shipment.id} />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-gray-100 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Thông tin vận đơn</h3>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-gray-500 dark:text-gray-400">Trạng thái</span>
                <StatusBadge status={shipment.status} />
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-gray-500 dark:text-gray-400">Đơn vị VC</span>
                <span className="text-right font-medium text-gray-900 dark:text-gray-100">
                  {formatCarrierLabel(shipment.carrierCode, shipment.carrierName)}
                </span>
              </div>
              {shipment.serviceLevel && (
                <div className="flex items-center justify-between gap-3">
                  <span className="text-gray-500 dark:text-gray-400">Dịch vụ</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">{shipment.serviceLevel}</span>
                </div>
              )}
              <div className="flex items-start justify-between gap-3">
                <span className="text-gray-500 dark:text-gray-400">Mã vận đơn</span>
                <code className="rounded bg-gray-100 px-2 py-1 font-mono text-xs dark:bg-gray-700">
                  {trackingCode || '—'}
                </code>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-100 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Liên kết đơn hàng</h3>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-gray-400" />
                <span className="text-gray-500 dark:text-gray-400">Đơn phụ</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">#{shipment.subOrderId}</span>
              </div>
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-gray-400" />
                <span className="text-gray-500 dark:text-gray-400">Đơn hàng (ID)</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {shipment.orderId ? `#${shipment.orderId}` : '—'}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Tạo lúc {formatDateTime(shipment.createdAt)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
