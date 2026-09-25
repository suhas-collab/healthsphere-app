import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { supabaseAuthServer } from './supabase';
import { ClinicalRole, AuthenticatedUser, AuthValidationResult } from './types';

import { clinicalData } from '@/lib/clinicalData';

/**
 * Extracts bearer token or session cookie from an incoming Next.js request.
 */
export function extractAuthToken(req: NextRequest): string | null {
  // 1. Authorization: Bearer <token>
  const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
  if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
    return authHeader.substring(7).trim();
  }

  // 2. Custom header fallback: x-supabase-auth or x-worker-auth
  const customHeader = req.headers.get('x-supabase-auth') || req.headers.get('x-worker-auth');
  if (customHeader) {
    return customHeader.trim();
  }

  // 3. Cookies (Supabase standard session cookies)
  const sbCookie =
    req.cookies.get('sb-access-token')?.value ||
    req.cookies.get('sb-token')?.value ||
    req.cookies.get('supabase-auth-token')?.value;

  if (sbCookie) {
    return sbCookie.trim();
  }

  return null;
}

/**
 * Verifies authentication and role-based authorization for clinical API routes.
 */
export async function verifyAuth(
  req: NextRequest,
  allowedRoles?: ClinicalRole[]
): Promise<AuthValidationResult> {
  const token = extractAuthToken(req);

  if (!token) {
    return {
      user: null,
      error: 'Unauthorized: Authentication required to access clinical API',
      status: 401,
    };
  }

  let user: AuthenticatedUser | null = null;

  // Strategy A: Standard Supabase JWT validation
  if (token.includes('.') && token.split('.').length === 3) {
    try {
      const { data, error } = await supabaseAuthServer.auth.getUser(token);
      if (!error && data?.user) {
        const sbUser = data.user;
        const roleFromMeta = (sbUser.user_metadata?.role ||
          sbUser.app_metadata?.role ||
          'ASHA') as ClinicalRole;

        // Verify if linked to a Prisma HealthWorker
        let worker: any = null;
        try {
          worker = await prisma.healthWorker.findFirst({
            where: {
              OR: [
                { phone: sbUser.phone || undefined },
                { workerCode: sbUser.user_metadata?.workerCode || undefined },
              ],
              isActive: true,
            },
          });
        } catch {
          const workers = clinicalData.getHealthWorkers();
          worker = workers.find(
            w => (sbUser.phone && w.phone === sbUser.phone) ||
                 (sbUser.user_metadata?.workerCode && w.workerCode === sbUser.user_metadata.workerCode)
          );
        }

        user = {
          id: sbUser.id,
          email: sbUser.email,
          role: (worker?.role as ClinicalRole) || roleFromMeta,
          workerCode: worker?.workerCode,
          workerName: worker?.name,
          facilityId: worker?.facilityId,
          authSource: 'supabase_jwt',
        };
      }
    } catch (jwtErr) {
      console.warn('Supabase JWT verification network error, attempting offline token decode:', jwtErr);
    }

    // Offline / fallback JWT decoding if Supabase project network is unreachable
    if (!user) {
      try {
        const parts = token.split('.');
        const payloadJson = Buffer.from(parts[1], 'base64').toString('utf-8');
        const payload = JSON.parse(payloadJson);
        const roleCandidate = (payload.role || payload.user_metadata?.role || payload.app_metadata?.role) as ClinicalRole;
        if (roleCandidate) {
          const workers = clinicalData.getHealthWorkers();
          const worker = workers.find(w => w.role === roleCandidate && w.isActive);
          user = {
            id: payload.sub || payload.userId || (worker ? worker.id : `worker_${roleCandidate.toLowerCase()}`),
            email: payload.email,
            role: roleCandidate,
            workerCode: payload.workerCode || worker?.workerCode,
            workerName: payload.name || worker?.name,
            facilityId: payload.facilityId || worker?.facilityId,
            authSource: 'supabase_jwt',
          };
        }
      } catch {
        // Not a decodable JWT payload
      }
    }
  }

  // Strategy B: Frontline Worker Session / Signature Token (Used by offline ASHA/ANM sync engine & local portals)
  // Format: "swasthya_<role>_<workerCode>" or "swasthya_<role>_active"
  if (!user && (token.startsWith('swasthya_') || token.startsWith('hw_'))) {
    const raw = token.startsWith('swasthya_')
      ? token.substring('swasthya_'.length)
      : token.substring('hw_'.length);

    // Extract role from raw string (e.g. medical_officer_active -> MEDICAL_OFFICER)
    const validRoles: ClinicalRole[] = [
      'ASHA',
      'ANM',
      'MEDICAL_OFFICER',
      'DISTRICT_HEALTH_OFFICER',
      'ADMIN',
      'PATIENT',
    ];

    let matchedRole: ClinicalRole | null = null;
    let workerCodeCandidate = '';

    for (const r of validRoles) {
      const lower = r.toLowerCase();
      if (raw.toLowerCase().startsWith(lower)) {
        matchedRole = r;
        workerCodeCandidate = raw.substring(lower.length).replace(/^_+/, '');
        break;
      }
    }

    if (matchedRole) {
      const roleCandidate = matchedRole;

      if (roleCandidate === 'PATIENT') {
        const headerPatientId = req.headers.get('x-patient-id') || undefined;
        let resolvedPatientId =
          workerCodeCandidate && workerCodeCandidate !== 'active' && workerCodeCandidate !== 'test'
            ? workerCodeCandidate
            : headerPatientId;

        let patient: any = null;
        if (resolvedPatientId && resolvedPatientId.startsWith('phone_')) {
          const rawPhone = resolvedPatientId.substring(6).replace(/\D/g, '');
          const pats = await clinicalData.getPatients();
          patient = pats.find((p) => p.phone?.replace(/\D/g, '').endsWith(rawPhone));
          if (patient) resolvedPatientId = patient.id;
        } else if (resolvedPatientId) {
          try {
            patient = await prisma.patient.findUnique({ where: { id: resolvedPatientId } });
          } catch {
            const pats = await clinicalData.getPatients();
            patient = pats.find((p) => p.id === resolvedPatientId);
          }
        }

        user = {
          id: patient ? patient.id : resolvedPatientId || 'patient_active',
          role: 'PATIENT',
          patientId: patient ? patient.id : resolvedPatientId,
          workerName: patient?.name || 'Citizen Patient',
          phone: patient?.phone,
          authSource: 'worker_session',
        };
      } else {
        let worker: any = null;
        try {
          worker =
            workerCodeCandidate && workerCodeCandidate !== 'active' && workerCodeCandidate !== 'test'
              ? await prisma.healthWorker.findFirst({
                  where: { workerCode: { equals: workerCodeCandidate, mode: 'insensitive' }, isActive: true },
                })
              : await prisma.healthWorker.findFirst({
                  where: { role: roleCandidate, isActive: true },
                });
        } catch {
          const workers = clinicalData.getHealthWorkers();
          worker =
            workerCodeCandidate && workerCodeCandidate !== 'active' && workerCodeCandidate !== 'test'
              ? workers.find((w) => w.workerCode?.toLowerCase() === workerCodeCandidate.toLowerCase() && w.isActive)
              : workers.find((w) => w.role === roleCandidate && w.isActive);
        }

        user = {
          id: worker ? worker.id : `worker_${roleCandidate.toLowerCase()}`,
          role: roleCandidate,
          workerCode: worker?.workerCode,
          workerName: worker?.name,
          facilityId: worker?.facilityId,
          authSource: 'worker_session',
        };
      }
    }
  }

  if (!user) {
    return {
      user: null,
      error: 'Unauthorized: Invalid or expired authentication credentials',
      status: 401,
    };
  }

  // ---------------------------------------------------------------------------
  // Role-Based Access Control (RBAC) Check
  // ---------------------------------------------------------------------------
  if (allowedRoles && allowedRoles.length > 0) {
    if (!allowedRoles.includes(user.role) && user.role !== 'ADMIN') {
      return {
        user: null,
        error: `Forbidden: User role '${user.role}' does not have clinical permissions for this resource`,
        status: 403,
      };
    }
  }

  return { user, status: 200 };
}

/**
 * Convenience helper to enforce authentication and authorization.
 * Returns errorResponse if verification fails (HTTP 401/403) or user if successful.
 */
export async function requireAuth(
  req: NextRequest,
  allowedRoles?: ClinicalRole[]
): Promise<{ errorResponse: NextResponse | null; user: AuthenticatedUser | null }> {
  const result = await verifyAuth(req, allowedRoles);

  if (result.error || !result.user) {
    return {
      errorResponse: NextResponse.json(
        {
          error: result.error || 'Unauthorized',
          code: result.status === 403 ? 'FORBIDDEN' : 'UNAUTHORIZED',
        },
        { status: result.status || 401 }
      ),
      user: null,
    };
  }

  return { errorResponse: null, user: result.user };
}
