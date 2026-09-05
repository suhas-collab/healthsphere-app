import { ClinicalRole } from './types';

const AUTH_TOKEN_KEY = 'swasthya_active_token';
const AUTH_ROLE_KEY = 'swasthya_active_role';

export function getClientAuthToken(defaultRole: ClinicalRole = 'ASHA'): string {
  if (typeof window === 'undefined') {
    return `swasthya_${defaultRole.toLowerCase()}_active`;
  }
  const stored = localStorage.getItem(AUTH_TOKEN_KEY);
  if (stored) return stored;
  return `swasthya_${defaultRole.toLowerCase()}_active`;
}

export function setClientAuth(role: ClinicalRole, token?: string) {
  if (typeof window !== 'undefined') {
    const finalToken = token || `swasthya_${role.toLowerCase()}_active`;
    localStorage.setItem(AUTH_TOKEN_KEY, finalToken);
    localStorage.setItem(AUTH_ROLE_KEY, role);
  }
}

export function getAuthHeaders(role: ClinicalRole = 'ASHA'): Record<string, string> {
  const token = getClientAuthToken(role);
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}
