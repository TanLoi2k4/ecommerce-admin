import type { AccountVerificationStatus } from '../types/vendor';
import type { PaymentStatus, VendorPayoutStatus } from '../types/payment';

export const VENDOR_PAYOUT_STATUS_LABELS: Record<VendorPayoutStatus, string> = {
  PENDING_APPROVAL: 'Chờ phê duyệt',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Từ chối',
  PROCESSING: 'Đang xử lý',
  COMPLETED: 'Hoàn thành',
  FAILED: 'Thất bại',
  FAILED_RECONCILED: 'Thất bại (đã đối soát)',
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  PENDING: 'Chờ xử lý',
  COMPLETED: 'Hoàn thành',
  FAILED: 'Thất bại',
  CANCELLED: 'Đã hủy',
  REFUNDED: 'Đã hoàn tiền',
  PARTIALLY_REFUNDED: 'Hoàn tiền một phần',
};

export const BANK_VERIFICATION_LABELS: Record<AccountVerificationStatus, string> = {
  PENDING: 'Chờ xác minh',
  VERIFIED: 'Đã xác minh',
  FAILED: 'Thất bại',
  REJECTED: 'Từ chối',
};

export const TRANSACTION_TYPE_LABELS: Record<'payment' | 'refund' | 'payout' | 'commission', string> = {
  payment: 'Thanh toán khách',
  refund: 'Hoàn tiền',
  payout: 'Chi trả nhà bán',
  commission: 'Phí hoa hồng',
};

export function shortVendorId(id?: string | null) {
  if (!id) return '—';
  if (id.length <= 12) return id;
  return `${id.slice(0, 8)}…`;
}

export function vendorShopLabel(id: string | null | undefined, names: Map<string, string>) {
  if (!id) return '—';
  return names.get(id) ?? shortVendorId(id);
}

export function maskBankAccount(accountNumber?: string | null) {
  if (!accountNumber) return '—';
  if (accountNumber.length <= 4) return accountNumber;
  return `•••${accountNumber.slice(-4)}`;
}
