import type { ShipmentStatus } from '../types/shipment';

export const shipmentStatusLabel: Record<ShipmentStatus, string> = {
  CREATED: 'Đã tạo vận đơn',
  BOOKING_FAILED: 'Đặt vận chuyển thất bại',
  BOOKED: 'Đã đặt vận chuyển',
  PICKED_UP: 'Shipper đã lấy hàng',
  IN_TRANSIT: 'Đang vận chuyển',
  DELIVERED: 'Đã giao hàng',
  FAILED_DELIVERY: 'Giao hàng thất bại',
  RETURNING: 'Đang hoàn trả',
  RETURNED: 'Đã hoàn trả',
  CANCELLED: 'Đã hủy vận chuyển',
};

export const carrierCodeLabel: Record<string, string> = {
  GIAOHANG_NHANH: 'Giao Hàng Nhanh',
  GHTK: 'Giao Hàng Tiết Kiệm',
  VIETTEL_POST: 'Viettel Post',
};

export const KNOWN_CARRIER_CODES = ['VIETTEL_POST'] as const;

export function formatCarrierLabel(
  carrierCode?: string | null,
  carrierName?: string | null,
): string {
  if (carrierName?.trim()) return carrierName;
  if (!carrierCode) return 'Đơn vị vận chuyển';
  return carrierCodeLabel[carrierCode] ?? carrierCode;
}

export function maskApiKey(apiKey?: string | null): string {
  if (!apiKey) return '—';
  if (apiKey.length <= 4) return '••••';
  return `••••${apiKey.slice(-4)}`;
}
