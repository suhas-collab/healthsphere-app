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
    const requestedPatientId = searchParams.get('patientId');

    // IDOR Protection: Patient can only access their own prescriptions
    if (user?.role === 'PATIENT') {
      const authPatientId = user.patientId;
      if (requestedPatientId && authPatientId && requestedPatientId !== authPatientId) {
        return NextResponse.json(
          { error: "Forbidden: You are not authorized to view another patient's prescriptions" },
          { status: 403 }
        );
      }
      const effectivePatientId = requestedPatientId || authPatientId;
      const prescriptions = await clinicalData.getPrescriptions(effectivePatientId);
      return NextResponse.json({ prescriptions });
    }

    const prescriptions = await clinicalData.getPrescriptions(requestedPatientId);
    return NextResponse.json({ prescriptions });
  } catch (err: any) {
    console.error('Error fetching prescriptions:', err);
    return NextResponse.json({ error: err?.message || 'Failed to fetch prescriptions' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { errorResponse } = await requireAuth(req, ['MEDICAL_OFFICER', 'ADMIN']);
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const prescription = await clinicalData.createPrescription(body);
    return NextResponse.json({ prescription }, { status: 201 });
  } catch (err: any) {
    console.error('Error creating prescription:', err);
    return NextResponse.json({ error: err?.message || 'Failed to create prescription' }, { status: 500 });
  }
}
