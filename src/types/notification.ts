/** Mirrors communication-service enums/DTOs for the notification module. */

export type BroadcastSeverity = 'INFO' | 'WARNING' | 'SUCCESS' | 'ERROR';
export type BroadcastAudience = 'ALL' | 'CUSTOMERS' | 'VENDORS' | 'USER';
export type BroadcastStatus = 'DRAFT' | 'SENT';

export interface BroadcastNotificationResponse {
  id: number;
  title: string;
  message: string;
  severity: BroadcastSeverity;
  audience: BroadcastAudience;
  recipientId?: string | null;
  recipientLabel?: string | null;
  status: BroadcastStatus;
  createdBy: string;
  recipientCount: number;
  readCount: number;
  createdAt: string;
  sentAt: string | null;
}

export interface CreateBroadcastNotificationRequest {
  title: string;
  message: string;
  severity: BroadcastSeverity;
  audience: BroadcastAudience;
  recipientId?: string;
  recipientLabel?: string;
}

export const BROADCAST_SEVERITY_OPTIONS: { value: BroadcastSeverity; label: string }[] = [
  { value: 'INFO', label: 'Thông tin' },
  { value: 'WARNING', label: 'Cảnh báo' },
  { value: 'SUCCESS', label: 'Thành công' },
  { value: 'ERROR', label: 'Lỗi' },
];

export const BROADCAST_AUDIENCE_OPTIONS: { value: BroadcastAudience; label: string }[] = [
  { value: 'ALL', label: 'Tất cả người dùng' },
  { value: 'VENDORS', label: 'Nhà bán' },
  { value: 'CUSTOMERS', label: 'Khách hàng' },
  { value: 'USER', label: 'Người cụ thể' },
];

/** Mirrors communication-service NotificationType enum. */
export type PersonalNotificationType = 'ORDER' | 'PAYMENT' | 'SHIPMENT' | 'CHAT' | 'REPORT' | 'SYSTEM';

export interface PersonalNotificationResponse {
  id: number;
  type: PersonalNotificationType;
  title: string;
  content: string;
  link?: string | null;
  metadata?: string | null;
  /** Lombok/Jackson may serialize boolean isRead as "read" in JSON. */
  isRead?: boolean;
  read?: boolean;
  createdAt: string;
}
