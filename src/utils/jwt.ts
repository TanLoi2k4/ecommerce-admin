import type { AdminRole } from '../types';

interface JwtPayload {
  sub?: string;
  exp?: number;
  realm_access?: { roles?: string[] };
  preferred_username?: string;
  email?: string;
}

/** Keycloak subject (`sub`) from the access token. */
export function getKeycloakIdFromToken(token: string | null | undefined): string | null {
  if (!token) return null;
  return decodeJwtPayload(token)?.sub ?? null;
}

export function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const decoded = atob(payload.padEnd(payload.length + ((4 - (payload.length % 4)) % 4), '='));
    return JSON.parse(decoded) as JwtPayload;
  } catch {
    return null;
  }
}

export function extractAdminRoles(token: string): AdminRole[] {
  const payload = decodeJwtPayload(token);
  const roles = payload?.realm_access?.roles ?? [];
  const adminRoles: AdminRole[] = [];
  if (roles.includes('SUPER_ADMIN')) adminRoles.push('SUPER_ADMIN');
  if (roles.includes('ADMIN')) adminRoles.push('ADMIN');
  return adminRoles;
}

/** JWT `exp` claim in milliseconds, or null if unavailable. */
export function getJwtExpiryMs(token: string): number | null {
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return null;
  return payload.exp * 1000;
}
