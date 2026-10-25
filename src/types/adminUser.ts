export type AdminUserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

export interface AdminUserResponse {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  status: AdminUserStatus;
  keycloakId?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface AdminUserCreateRequest {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  password: string;
}

export interface AdminUpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
}

export interface AdminUpdateAccountRequest {
  username?: string;
  email?: string;
  password?: string;
  currentPassword: string;
}

export interface AdminUserUpdateAccountRequest {
  email?: string;
  password?: string;
  status?: AdminUserStatus;
}
