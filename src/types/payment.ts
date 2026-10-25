/** Types aligned with payment-service admin DTOs. */

export type PaymentMethod = 'COD' | 'VNPAY' | 'WALLET';

export type PaymentStatus =
  | 'PENDING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED'
  | 'REFUNDED'
  | 'PARTIALLY_REFUNDED';

export type VendorPayoutStatus =
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'REJECTED'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED'
  | 'FAILED_RECONCILED';

export interface PlatformPayableToVendor {
  id: number;
  orderCode: string;
  orderId?: number | null;
  subOrderId?: number | null;
  vendorKeycloakId?: string | null;
  amount: number;
  status: PaymentStatus;
  paidAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface VendorPayableToPlatform {
  id: number;
  orderCode: string;
  orderId?: number | null;
  subOrderId?: number | null;
  vendorKeycloakId?: string | null;
  amount: number;
  commissionRate: number;
  status: PaymentStatus;
  paidAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

/** Matches payment-service VendorPayout entity */
export interface VendorPayout {
  id: number;
  payoutCode: string;
  vendorKeycloakId: string;
  grossAmount: number;
  transactionFee: number;
  netAmount: number;
  bankCode?: string | null;
  bankName?: string | null;
  bankAccountNumber?: string | null;
  bankAccountName?: string | null;
  providerTransactionId?: string | null;
  status: VendorPayoutStatus;
  rejectionReason?: string | null;
  approvedAt?: string | null;
  rejectedAt?: string | null;
  completedAt?: string | null;
  payableItems?: PlatformPayableToVendor[];
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface PaymentDetail {
  paymentId: number;
  orderCode: string;
  orderId?: number | null;
  customerKeycloakId?: string | null;
  amount: number;
  currency: string;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  provider?: string | null;
  providerPaymentIntentId?: string | null;
  providerCheckoutSessionId?: string | null;
  checkoutUrl?: string | null;
  failureCode?: string | null;
  failureMessage?: string | null;
  requestedAt?: string | null;
  paidAt?: string | null;
  failedAt?: string | null;
  cancelledAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface RejectPayoutRequest {
  reason: string;
}

export interface PayablesFilterParams {
  orderCode?: string;
  subOrderId?: number;
  vendorKeycloakId?: string;
}

export function toMoney(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function normalizeVendorPayout(raw: VendorPayout): VendorPayout {
  return {
    ...raw,
    id: Number(raw.id),
    grossAmount: toMoney(raw.grossAmount),
    transactionFee: toMoney(raw.transactionFee),
    netAmount: toMoney(raw.netAmount),
    payableItems: raw.payableItems?.map((item) => ({
      ...item,
      id: Number(item.id),
      orderId: item.orderId != null ? Number(item.orderId) : item.orderId,
      subOrderId: item.subOrderId != null ? Number(item.subOrderId) : item.subOrderId,
      amount: toMoney(item.amount),
    })),
  };
}

export function normalizePaymentDetail(raw: PaymentDetail): PaymentDetail {
  return {
    ...raw,
    paymentId: Number(raw.paymentId),
    orderId: raw.orderId != null ? Number(raw.orderId) : raw.orderId,
    amount: toMoney(raw.amount),
  };
}

export function normalizePlatformPayable(raw: PlatformPayableToVendor): PlatformPayableToVendor {
  return {
    ...raw,
    id: Number(raw.id),
    orderId: raw.orderId != null ? Number(raw.orderId) : raw.orderId,
    subOrderId: raw.subOrderId != null ? Number(raw.subOrderId) : raw.subOrderId,
    amount: toMoney(raw.amount),
  };
}

export function normalizeVendorPayable(raw: VendorPayableToPlatform): VendorPayableToPlatform {
  return {
    ...raw,
    id: Number(raw.id),
    orderId: raw.orderId != null ? Number(raw.orderId) : raw.orderId,
    subOrderId: raw.subOrderId != null ? Number(raw.subOrderId) : raw.subOrderId,
    amount: toMoney(raw.amount),
    commissionRate: toMoney(raw.commissionRate),
  };
}
