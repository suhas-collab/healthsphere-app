// Type definitions for Clinical RBAC & Supabase Auth

export type ClinicalRole =
  | 'ASHA'
  | 'ANM'
  | 'MEDICAL_OFFICER'
  | 'DISTRICT_HEALTH_OFFICER'
  | 'ADMIN'
  | 'PATIENT';

export interface AuthenticatedUser {
  id: string;
  email?: string;
  role: ClinicalRole;
  workerCode?: string;
  workerName?: string;
  facilityId?: string;
  patientId?: string;
  phone?: string;
  authSource: 'supabase_jwt' | 'worker_session';
}

export interface AuthValidationResult {
  user: AuthenticatedUser | null;
  error?: string;
  status?: number;
}
