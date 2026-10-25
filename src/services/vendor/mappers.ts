import type { VendorListItem, VendorResponse } from '../../types/vendor';

const STATUS_UI_MAP: Record<string, string> = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  SUSPENDED: 'suspended',
  DELETED: 'deleted',
};

export function toUiVendorStatus(status?: string | null): string {
  if (!status) return 'inactive';
  return STATUS_UI_MAP[status] ?? status.toLowerCase();
}

export function toVendorListItem(vendor: VendorResponse): VendorListItem {
  return {
    id: String(vendor.id),
    shopName: vendor.shopName,
    ownerName: `${vendor.lastName} ${vendor.firstName}`.trim(),
    email: vendor.email,
    username: vendor.username,
    phone: vendor.phone,
    status: toUiVendorStatus(vendor.status),
    keycloakId: vendor.keycloakId,
    createdAt: vendor.createdAt,
  };
}
