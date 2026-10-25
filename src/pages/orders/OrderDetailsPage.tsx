import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, Truck, MapPin, Clock } from 'lucide-react';
import { useOrder } from '../../hooks/useOrders';
import { useOrderShipments } from '../../hooks/useShipments';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { EmptyState } from '../../components/ui/EmptyState';
import { formatCurrency, formatDate } from '../../utils/format';
import { formatCarrierLabel } from '../../utils/shipmentLabels';
import { SkeletonLoader } from '../../components/ui/SkeletonLoader';

export function OrderDetailsPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { data: order, isLoading, isError } = useOrder(id);
  const { data: shipments = [], isLoading: shipmentsLoading } = useOrderShipments(order?.numericId);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        <div className="h-96 animate-pulse rounded-xl bg-gray-200 dark:bg-gray-700" />
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => navigate('/orders/list')}
          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <EmptyState title="Không tìm thấy đơn hàng" description="Đơn hàng có thể đã bị xóa hoặc không khả dụng." icon="inbox" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/orders/list')}
          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Đơn hàng {order.id}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Đặt ngày {formatDate(order.createdAt)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-xl border border-gray-100 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Sản phẩm trong đơn</h3>
            <div className="mt-4 space-y-4">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center gap-4 rounded-lg bg-gray-50 p-4 dark:bg-gray-700/50">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="h-12 w-12 shrink-0 rounded-lg object-cover bg-gray-200"
                    />
                  ) : (
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gray-200 text-sm font-medium text-gray-600 dark:bg-gray-600 dark:text-gray-300">
                      {item.name.charAt(0)}
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-gray-100">{item.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">SL: {item.quantity}</p>
                  </div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {formatCurrency(item.price * item.quantity)}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-between border-t border-gray-100 pt-4 dark:border-gray-700">
              <span className="font-semibold text-gray-900 dark:text-gray-100">Tổng cộng</span>
              <span className="font-semibold text-gray-900 dark:text-gray-100">{formatCurrency(order.total)}</span>
            </div>
          </div>

          <div className="rounded-xl border border-gray-100 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Tiến trình đơn hàng</h3>
            <div className="mt-4 space-y-4">
              {order.timeline.map((event, index) => (
                <div key={index} className="flex items-center gap-4">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full ${
                      event.completed
                        ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
                        : 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500'
                    }`}
                  >
                    <Clock className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{event.status}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(event.date)}</p>
                  </div>
                  {event.completed && (
                    <span className="text-xs text-emerald-600 dark:text-emerald-400">Hoàn thành</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-gray-100 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Tóm tắt đơn hàng</h3>
            <div className="mt-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Trạng thái</span>
                <StatusBadge status={order.status} />
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Thanh toán</span>
                <StatusBadge status={order.paymentStatus} />
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Sản phẩm</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">{order.items.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Tổng cộng</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">{formatCurrency(order.total)}</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-100 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Khách hàng</h3>
            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Package className="h-4 w-4 text-gray-400" />
                <span className="text-gray-700 dark:text-gray-300">{order.customerName}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-gray-400" />
                <span className="text-gray-700 dark:text-gray-300">{order.shippingAddress}</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-100 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Vận chuyển</h3>
            <div className="mt-4 space-y-3">
              {shipmentsLoading ? (
                <SkeletonLoader type="text" count={2} />
              ) : shipments.length === 0 ? (
                <div className="flex items-center gap-2 text-sm">
                  <Truck className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-700 dark:text-gray-300">
                    Mã vận đơn: {order.trackingNumber}
                  </span>
                </div>
              ) : (
                shipments.map((shipment) => {
                  const trackingCode = shipment.carrierTrackingId || shipment.externalShipmentId;
                  return (
                    <button
                      key={shipment.id}
                      type="button"
                      onClick={() => navigate(`/shipments/${shipment.id}`)}
                      className="w-full rounded-lg border border-gray-100 p-3 text-left hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700/50"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                          <Truck className="h-4 w-4 text-primary-500" />
                          {formatCarrierLabel(shipment.carrierCode, shipment.carrierName)}
                        </div>
                        <StatusBadge status={shipment.status} />
                      </div>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Đơn phụ #{shipment.subOrderId}
                        {trackingCode ? ` · ${trackingCode}` : ''}
                      </p>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
