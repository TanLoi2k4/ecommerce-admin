import type { CustomerListItem, CustomerResponse } from '../../types/customer';

const STATUS_UI_MAP: Record<string, string> = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  SUSPENDED: 'suspended',
  DELETED: 'deleted',
};

export function toUiStatus(status?: string | null): string {
  if (!status) return 'inactive';
  return STATUS_UI_MAP[status] ?? status.toLowerCase();
}

export function toCustomerListItem(customer: CustomerResponse): CustomerListItem {
  return {
    id: String(customer.id),
    keycloakId: customer.keycloakId,
    name: `${customer.lastName} ${customer.firstName}`.trim(),
    email: customer.email,
    username: customer.username,
    phone: customer.phone,
    status: toUiStatus(customer.status),
    createdAt: customer.createdAt,
  };
}
