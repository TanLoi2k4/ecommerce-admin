export type VendorStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'DELETED';

export type AccountVerificationStatus = 'PENDING' | 'VERIFIED' | 'FAILED' | 'REJECTED';

export interface VendorResponse {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  shopName: string;
  logoUrl?: string;
  logoPublicId?: string;
  phone?: string;
  status: VendorStatus;
  keycloakId: string;
  createdAt: string;
  updatedAt: string;
}

export interface VendorListParams {
  page?: number;
  size?: number;
  status?: VendorStatus;
  search?: string;
  sortBy?: string;
}

export interface VendorUpdateRequest {
  username?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  shopName?: string;
  phone?: string;
}

export interface VendorListItem {
  id: string;
  shopName: string;
  ownerName: string;
  email: string;
  username: string;
  phone?: string;
  status: string;
  keycloakId: string;
  createdAt: string;
}

export interface VendorBankAccountResponse {
  id: number;
  vendorKeycloakId: string;
  accountNumber: string;
  accountName: string;
  bankCode: string;
  bankName: string;
  accountType?: string;
  isVerified?: boolean;
  verificationStatus: string;
  verifiedAt?: string;
  verificationNotes?: string;
}

export interface VendorBankAccountListParams {
  page?: number;
  size?: number;
  bankCode?: string;
  vendorName?: string;
  accountName?: string;
  bankName?: string;
  verificationStatus?: AccountVerificationStatus;
}

export interface VendorStatsResponse {
  total: number;
  inactive: number;
}
