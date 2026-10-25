import { MapPin, Clock, User, Phone, Car } from 'lucide-react';
import { useAdminShipmentTracking } from '../../hooks/useShipments';
import { formatDateTime } from '../../utils/format';
import { extractApiError } from '../../utils/apiError';
import { EmptyState } from '../ui/EmptyState';
import { SkeletonLoader } from '../ui/SkeletonLoader';

type ShipmentTrackingTimelineProps = {
  shipmentId: number;
};

export function ShipmentTrackingTimeline({ shipmentId }: ShipmentTrackingTimelineProps) {
  const { data: events = [], isLoading, isError, error, refetch } = useAdminShipmentTracking(shipmentId);

  if (isLoading && events.length === 0) {
    return <SkeletonLoader type="table" />;
  }

  if (isError && events.length === 0) {
    return (
      <EmptyState
        icon="alert"
        title="Không tải được hành trình"
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
    );
  }

  if (events.length === 0) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Chưa có cập nhật hành trình. Thông tin sẽ hiển thị khi đơn vị vận chuyển quét mã.
      </p>
    );
  }

  return (
    <ol className="relative ml-2 space-y-4 border-l border-gray-200 dark:border-gray-700">
      {events.map((event, index) => (
        <li key={event.id} className="ml-4">
          <span
            className={`absolute -left-1.5 flex h-3 w-3 rounded-full ${
              index === 0 ? 'bg-primary-500' : 'bg-gray-300 dark:bg-gray-600'
            }`}
          />
          <div className="text-sm">
            <p className="font-medium text-gray-900 dark:text-gray-100">
              {event.location || 'Cập nhật trạng thái'}
            </p>
            <p className="mt-0.5 text-xs text-gray-500">
              {formatDateTime(event.createdAt)}
              {event.trackingId ? ` · ${event.trackingId}` : ''}
            </p>

            <div className="mt-1 space-y-0.5 text-xs text-gray-500 dark:text-gray-400">
              {event.eta && (
                <p className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Dự kiến: {formatDateTime(event.eta)}
                </p>
              )}
              {event.driverName && (
                <p className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {event.driverName}
                </p>
              )}
              {event.driverPhone && (
                <p className="flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {event.driverPhone}
                </p>
              )}
              {event.vehicle && (
                <p className="flex items-center gap-1">
                  <Car className="h-3 w-3" />
                  {event.vehicle}
                </p>
              )}
              {event.location && (
                <p className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {event.location}
                </p>
              )}
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}
