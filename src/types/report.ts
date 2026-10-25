/** Mirrors communication-service ReportType enum. */
export type ReportType = 'PRODUCT' | 'VENDOR' | 'ORDER' | 'OTHER';

/** Mirrors communication-service ReportStatus enum. */
export type ReportStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'REJECTED';

export interface ReportResponse {
  id: number;
  reporterKeycloakId: string;
  reporterName?: string | null;
  reporterRole: string;
  type: ReportType;
  targetId?: number | null;
  targetKeycloakId?: string | null;
  targetName?: string | null;
  reason: string;
  description: string;
  status: ReportStatus;
  assignedAdminId?: string | null;
  assignedAdminName?: string | null;
  chatRoomCode?: string | null;
  createdAt: string;
}

export interface ReportListParams {
  page?: number;
  size?: number;
}

export const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  PRODUCT: 'Sản phẩm',
  VENDOR: 'Nhà bán',
  ORDER: 'Đơn hàng',
  OTHER: 'Khác',
};

export const REPORT_STATUS_OPTIONS: { value: ReportStatus; label: string }[] = [
  { value: 'OPEN', label: 'Mở' },
  { value: 'IN_PROGRESS', label: 'Đang xử lý' },
  { value: 'RESOLVED', label: 'Đã giải quyết' },
  { value: 'REJECTED', label: 'Từ chối' },
];
