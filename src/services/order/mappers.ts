import type {
  AdminOrderDetailDto,
  AdminOrderSummaryDto,
  OrderDetail,
  OrderFulfillmentStatus,
  OrderLineItem,
  OrderListItem,
  OrderPaymentStatus,
  OrderProductInfo,
  OrderTimelineEvent,
  TransactionListItem,
} from '../../types/order';
import type { PaymentDetail, PaymentStatus } from '../../types/payment';

export function toUiPaymentStatus(status: OrderPaymentStatus | PaymentStatus): string {
  return status.toLowerCase();
}

export function toApiPaymentStatus(status: string): PaymentStatus | undefined {
  const normalized = status.trim().toUpperCase();
  const allowed: PaymentStatus[] = [
    'PENDING',
    'COMPLETED',
    'FAILED',
    'CANCELLED',
    'REFUNDED',
    'PARTIALLY_REFUNDED',
  ];
  return allowed.includes(normalized as PaymentStatus) ? (normalized as PaymentStatus) : undefined;
}

export function toTransactionStatus(status: PaymentStatus): TransactionListItem['status'] {
  switch (status) {
    case 'COMPLETED':
    case 'REFUNDED':
    case 'PARTIALLY_REFUNDED':
      return 'completed';
    case 'PENDING':
      return 'pending';
    default:
      return 'failed';
  }
}

export function toOrderListItem(
  order: AdminOrderSummaryDto,
  vendorNames: Map<string, string>,
): OrderListItem {
  const vendorLabel = order.vendorKeycloakIds
    .map((id) => vendorNames.get(id) ?? shortenId(id))
    .join(', ');

  return {
    id: order.orderCode,
    customerName: order.customerName || 'Unknown customer',
    vendorName: vendorLabel || '—',
    items: order.itemCount,
    total: Number(order.totalPayableAmount),
    status: order.fulfillmentStatus,
    paymentStatus: toUiPaymentStatus(order.paymentStatus),
    createdAt: order.createdAt,
  };
}

export function toOrderDetail(detail: AdminOrderDetailDto, products: Map<number, OrderProductInfo>): OrderDetail {
  const order = detail.order;
  const lineItems: OrderLineItem[] = (order.subOrders ?? []).flatMap((subOrder) =>
    (subOrder.items ?? []).map((item) => {
      const product = products.get(item.productId);
      return {
        id: String(item.id),
        name: product?.name ?? `Product #${item.productId}`,
        quantity: item.quantity,
        price: Number(item.unitPrice),
        imageUrl: product?.imageUrl || undefined,
      };
    }),
  );

  const fulfillmentStatus = deriveFulfillmentStatus(order.subOrders?.map((s) => s.status) ?? [], order.paymentStatus);

  return {
    id: order.orderCode,
    numericId: order.id,
    customerName: order.customerName || 'Unknown customer',
    shippingAddress: order.shippingAddress || '—',
    total: Number(order.totalPayableAmount),
    status: fulfillmentStatus,
    paymentStatus: toUiPaymentStatus(order.paymentStatus),
    createdAt: order.createdAt,
    items: lineItems,
    timeline: buildTimeline(order.subOrders?.map((s) => s.status) ?? [], order.createdAt),
    trackingNumber: detail.trackingNumber || '—',
  };
}

export function toTransactionListItem(payment: PaymentDetail): TransactionListItem {
  return {
    id: String(payment.paymentId),
    orderId: payment.orderCode,
    type: 'payment',
    amount: payment.amount,
    fee: 0,
    method: payment.paymentMethod.toLowerCase(),
    status: toTransactionStatus(payment.status),
    createdAt: payment.createdAt ?? payment.requestedAt ?? new Date().toISOString(),
  };
}

function deriveFulfillmentStatus(subOrderStatuses: string[], paymentStatus: OrderPaymentStatus): OrderFulfillmentStatus {
  if (paymentStatus === 'REFUNDED' || paymentStatus === 'PARTIALLY_REFUNDED') {
    return 'refund_requested';
  }
  if (subOrderStatuses.length === 0) {
    return 'pending';
  }
  if (subOrderStatuses.some((status) => status === 'RETURNED')) {
    return 'refund_requested';
  }
  if (subOrderStatuses.every((status) => status === 'CANCELLED')) {
    return 'cancelled';
  }
  if (subOrderStatuses.every((status) => status === 'COMPLETED')) {
    return 'delivered';
  }
  if (subOrderStatuses.some((status) => status === 'SHIPPING' || status === 'RETURNING')) {
    return 'shipped';
  }
  if (subOrderStatuses.some((status) => status === 'PROCESSING' || status === 'SHIPPING_REQUESTED')) {
    return 'processing';
  }
  return 'pending';
}

function buildTimeline(
  subOrderStatuses: string[],
  createdAt: string,
): OrderTimelineEvent[] {
  const events: OrderTimelineEvent[] = [
    { status: 'Đặt hàng', date: createdAt, completed: true },
  ];

  const processing = subOrderStatuses.some((s) =>
    ['PROCESSING', 'SHIPPING_REQUESTED', 'SHIPPING', 'RETURNING', 'COMPLETED'].includes(s),
  );
  events.push({
    status: 'Đang xử lý',
    date: createdAt,
    completed: processing,
  });

  const shippingRequested = subOrderStatuses.some((s) =>
    ['SHIPPING_REQUESTED', 'SHIPPING', 'RETURNING', 'COMPLETED'].includes(s),
  );
  events.push({
    status: 'Đã gửi yêu cầu vận chuyển',
    date: createdAt,
    completed: shippingRequested,
  });

  const shipping = subOrderStatuses.some((s) => ['SHIPPING', 'RETURNING', 'COMPLETED'].includes(s));
  events.push({
    status: 'Đang giao hàng',
    date: createdAt,
    completed: shipping,
  });

  const delivered = subOrderStatuses.length > 0 && subOrderStatuses.every((s) => s === 'COMPLETED');
  events.push({
    status: 'Đã giao hàng',
    date: createdAt,
    completed: delivered,
  });

  return events;
}

function shortenId(id: string): string {
  if (!id) return 'Nhà bán không xác định';
  if (id.length <= 12) return id;
  return `${id.substring(0, 8)}…`;
}
