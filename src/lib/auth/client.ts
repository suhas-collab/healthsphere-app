import { ClinicalRole } from './types';

const AUTH_TOKEN_KEY = 'swasthya_active_token';
const AUTH_ROLE_KEY = 'swasthya_active_role';

export function getClientAuthToken(role: ClinicalRole = 'ASHA'): string {
  if (typeof window === 'undefined') {
    return `swasthya_${role.toLowerCase()}_active`;
  }

  // If role is PATIENT, check for bound patient identity
  if (role === 'PATIENT') {
    const rawSession = localStorage.getItem('arogya_patient_session');
    if (rawSession) {
      try {
        const session = JSON.parse(rawSession);
        if (session.patientId) {
          return `swasthya_patient_${session.patientId}`;
        }
      } catch {}
    }
  }

  const storedRole = localStorage.getItem(AUTH_ROLE_KEY) as ClinicalRole | null;
  const storedToken = localStorage.getItem(AUTH_TOKEN_KEY);

  // If stored token belongs to the requested role, use it
  if (storedRole === role && storedToken) {
    return storedToken;
  }

  // Otherwise generate role-specific token for the current role
  return `swasthya_${role.toLowerCase()}_active`;
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
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  if (role === 'PATIENT' && typeof window !== 'undefined') {
    const rawSession = localStorage.getItem('arogya_patient_session');
    if (rawSession) {
      try {
        const session = JSON.parse(rawSession);
        if (session.patientId) {
          headers['x-patient-id'] = session.patientId;
        }
      } catch {}
    }
  }

  return headers;
}
