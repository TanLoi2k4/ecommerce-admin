export type CustomerStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'DELETED';

export interface CustomerResponse {
  id: number;
  keycloakId: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  phone?: string;
  profileImageUrl?: string;
  profileImagePublicId?: string;
  status: CustomerStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerListParams {
  page?: number;
  size?: number;
  status?: CustomerStatus;
  search?: string;
  sortBy?: string;
}

export interface CustomerUpdateRequest {
  firstName?: string;
  lastName?: string;
  username?: string;
  email?: string;
  phone?: string;
}

export interface CustomerStatsResponse {
  total: number;
  active: number;
  inactive: number;
  suspended: number;
  deleted: number;
}

export interface AddressResponse {
  id: number;
  street: string;
  city: string;
  country: string;
  isDefault: boolean;
}

export interface CustomerListItem {
  id: string;
  keycloakId: string;
  name: string;
  email: string;
  username: string;
  phone?: string;
  status: string;
  createdAt: string;
}
