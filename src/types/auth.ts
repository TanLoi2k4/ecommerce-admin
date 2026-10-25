export type AdminRole = 'ADMIN' | 'SUPER_ADMIN';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  scope: string;
}

export interface LogoutRequest {
  accessToken: string;
  refreshToken: string;
}

export interface ForgetPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
  confirmPassword: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  name: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  status: string;
  roles: AdminRole[];
  isSuperAdmin: boolean;
  createdAt?: string;
}
