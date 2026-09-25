import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/guards';
import { clinicalData } from '@/lib/clinicalData';

export async function GET(req: NextRequest) {
  const { user, errorResponse } = await requireAuth(req, [
    'ASHA',
    'ANM',
    'MEDICAL_OFFICER',
    'DISTRICT_HEALTH_OFFICER',
    'ADMIN',
    'PATIENT',
  ]);
  if (errorResponse) return errorResponse;

  try {
    const { searchParams } = new URL(req.url);
    const riskLevel = searchParams.get('riskLevel');
    const facilityId = searchParams.get('facilityId');
    const requestedPatientId = searchParams.get('patientId');

    // IDOR Protection: Patient can only access their own encounters
    if (user?.role === 'PATIENT') {
      const authPatientId = user.patientId;
      if (requestedPatientId && authPatientId && requestedPatientId !== authPatientId) {
        return NextResponse.json(
          { error: "Forbidden: You are not authorized to view another patient's clinical encounters" },
          { status: 403 }
        );
      }
      const effectivePatientId = requestedPatientId || authPatientId;
      const encounters = await clinicalData.getEncounters({ riskLevel, facilityId, patientId: effectivePatientId });
      return NextResponse.json({ encounters });
    }

    const encounters = await clinicalData.getEncounters({ riskLevel, facilityId, patientId: requestedPatientId });
    return NextResponse.json({ encounters });
  } catch (err: any) {
    console.error('Error fetching encounters:', err);
    return NextResponse.json({ error: err.message || 'Failed to fetch encounters' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { user, errorResponse } = await requireAuth(req, [
    'ASHA',
    'ANM',
    'MEDICAL_OFFICER',
    'ADMIN',
    'PATIENT',
  ]);
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();

    // IDOR Protection: Patient can only create encounters for themselves
    if (user?.role === 'PATIENT') {
      const authPatientId = user.patientId;
      if (body.patientId && authPatientId && body.patientId !== authPatientId) {
        return NextResponse.json(
          { error: "Forbidden: You are not authorized to book an encounter for another patient" },
          { status: 403 }
        );
      }
      if (!body.patientId && authPatientId) {
        body.patientId = authPatientId;
      }
    }

    const encounter = await clinicalData.createEncounter(body);
    return NextResponse.json({ encounter }, { status: 201 });
  } catch (err: any) {
    console.error('Error creating encounter:', err);
    return NextResponse.json({ error: err.message || 'Failed to create encounter' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const { errorResponse } = await requireAuth(req, [
    'ASHA',
    'ANM',
    'MEDICAL_OFFICER',
    'ADMIN',
  ]);
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const id = body.id || body.encounterId;
    if (!id) {
      return NextResponse.json({ error: 'Encounter ID is required' }, { status: 400 });
    }

    const updated = await clinicalData.updateEncounter(id, body);
    if (!updated) {
      return NextResponse.json({ error: 'Encounter not found' }, { status: 404 });
    }

    return NextResponse.json({ encounter: updated }, { status: 200 });
  } catch (err: any) {
    console.error('Error updating encounter:', err);
    return NextResponse.json({ error: err.message || 'Failed to update encounter' }, { status: 500 });
  }
}

