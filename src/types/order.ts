/** Types aligned with order-service admin DTOs */

export type OrderPaymentStatus =
  | 'PENDING'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'FAILED'
  | 'REFUNDED'
  | 'PARTIALLY_REFUNDED';

export type OrderFulfillmentStatus =
  | 'pending'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refund_requested';

export interface AdminOrderSummaryDto {
  orderCode: string;
  customerName: string;
  customerKeycloakId: string;
  vendorKeycloakIds: string[];
  itemCount: number;
  totalPayableAmount: number;
  fulfillmentStatus: OrderFulfillmentStatus;
  paymentStatus: OrderPaymentStatus;
  createdAt: string;
}

export interface AdminOrderStatsDto {
  totalOrders: number;
  pending: number;
  processing: number;
  shipped: number;
  delivered: number;
  cancelled: number;
  refundRequested: number;
}

export interface OrderItemDto {
  id: number;
  productId: number;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  status: string;
}

export interface SubOrderDto {
  id: number;
  vendorKeycloakId: string;
  status: string;
  items: OrderItemDto[];
}

export interface OrderDetailDto {
  id: number;
  orderCode: string;
  customerKeycloakId: string;
  customerName: string;
  customerPhone?: string | null;
  shippingAddress?: string | null;
  totalPayableAmount: number;
  paymentStatus: OrderPaymentStatus;
  paymentMethod?: string | null;
  createdAt: string;
  subOrders: SubOrderDto[];
}

export type ReturnRequestStatus =
  | 'REQUESTED'
  | 'APPROVED'
  | 'SHIPPED'
  | 'RECEIVED'
  | 'REFUNDED'
  | 'REJECTED'
  | 'DISPUTED'
  | 'CLOSED';

export type ReturnReason =
  | 'WRONG_ITEM'
  | 'DAMAGED'
  | 'NOT_AS_DESCRIBED'
  | 'MISSING_PARTS'
  | 'CHANGED_MIND'
  | 'OTHER';

export interface ReturnRequestItemDto {
  id: number;
  orderItemId: number;
  productId: number;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface ReturnRequestDto {
  id: number;
  subOrderId: number;
  orderCode: string;
  customerKeycloakId: string;
  vendorKeycloakId: string;
  status: ReturnRequestStatus;
  reason: ReturnReason;
  description?: string | null;
  sellerNote?: string | null;
  customerShipNote?: string | null;
  adminNote?: string | null;
  refundAmount: number;
  currency: string;
  items: ReturnRequestItemDto[];
  createdAt: string;
  updatedAt?: string | null;
}

export interface ReturnRequestPage {
  items: ReturnRequestDto[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export const RETURN_STATUS_LABELS: Record<ReturnRequestStatus, string> = {
  REQUESTED: 'Chờ shop duyệt',
  APPROVED: 'Chờ lấy hàng hoàn',
  SHIPPED: 'Đang hoàn về shop',
  RECEIVED: 'Đối tác vận chuyển đã giao tới shop',
  REFUNDED: 'Đã hoàn tiền',
  REJECTED: 'Shop từ chối',
  DISPUTED: 'Khiếu nại',
  CLOSED: 'Đã đóng',
};

export const RETURN_REASON_LABELS: Record<ReturnReason, string> = {
  WRONG_ITEM: 'Sai sản phẩm',
  DAMAGED: 'Hàng hỏng / lỗi',
  NOT_AS_DESCRIBED: 'Không đúng mô tả',
  MISSING_PARTS: 'Thiếu phụ kiện',
  CHANGED_MIND: 'Đổi ý',
  OTHER: 'Lý do khác',
};

export interface AdminOrderDetailDto {
  order: OrderDetailDto;
  trackingNumber?: string | null;
}

export interface OrderListItem {
  id: string;
  customerName: string;
  vendorName: string;
  items: number;
  total: number;
  status: OrderFulfillmentStatus;
  paymentStatus: string;
  createdAt: string;
}

export interface OrderProductInfo {
  name: string;
  imageUrl: string;
}

export interface OrderLineItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  imageUrl?: string;
}

export interface OrderTimelineEvent {
  status: string;
  date: string;
  completed: boolean;
}

export interface OrderDetail {
  id: string;
  numericId: number;
  customerName: string;
  shippingAddress: string;
  total: number;
  status: OrderFulfillmentStatus;
  paymentStatus: string;
  createdAt: string;
  items: OrderLineItem[];
  timeline: OrderTimelineEvent[];
  trackingNumber: string;
}

export interface TransactionListItem {
  id: string;
  orderId: string;
  type: 'payment' | 'refund' | 'payout' | 'commission';
  amount: number;
  fee: number;
  method: string;
  status: 'completed' | 'pending' | 'failed';
  createdAt: string;
}

export interface OrderListParams {
  page?: number;
  size?: number;
  search?: string;
  status?: OrderFulfillmentStatus | string;
}

export interface OrderPageResponse {
  items: AdminOrderSummaryDto[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}
