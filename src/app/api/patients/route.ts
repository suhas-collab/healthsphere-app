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
    const q = searchParams.get('q');
    const requestedId = searchParams.get('id') || searchParams.get('patientId');

    // IDOR Protection: A patient can only view their own patient record!
    if (user?.role === 'PATIENT') {
      const authPatientId = user.patientId;
      if (requestedId && authPatientId && requestedId !== authPatientId) {
        return NextResponse.json(
          { error: "Forbidden: You are not authorized to view another patient's records" },
          { status: 403 }
        );
      }

      const allPatients = await clinicalData.getPatients(q);
      const effectiveId = requestedId || authPatientId;
      const ownPatients = effectiveId
        ? allPatients.filter((p) => p.id === effectiveId)
        : allPatients;
      return NextResponse.json({ patients: ownPatients });
    }

    const patients = await clinicalData.getPatients(q);
    return NextResponse.json({ patients });
  } catch (err: any) {
    console.error('Error fetching patients:', err);
    return NextResponse.json({ error: err.message || 'Failed to fetch patients' }, { status: 500 });
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

    // If registering as a PATIENT, check if this mobile number is already linked to another patient account
    if (user?.role === 'PATIENT' && body.phone) {
      const cleanPhone = String(body.phone).replace(/\D/g, '').slice(-10);
      if (cleanPhone.length === 10) {
        const allPatients = await clinicalData.getPatients();
        const existingWithPhone = allPatients.find(
          (p) => p.phone && String(p.phone).replace(/\D/g, '').endsWith(cleanPhone)
        );
        if (existingWithPhone && (!body.id || existingWithPhone.id !== body.id)) {
          return NextResponse.json(
            {
              error: 'This mobile number is already linked to an ArogyaMitra account.',
              errorMr: 'या मोबाईल नंबरशी आधीच आरोग्य खाते जोडलेले आहे.',
              code: 'PHONE_ALREADY_LINKED',
              existingPatient: {
                id: existingWithPhone.id,
                name: existingWithPhone.name,
                phone: existingWithPhone.phone,
              },
            },
            { status: 409 }
          );
        }
      }
    }

    const patient = await clinicalData.createPatient(body);
    return NextResponse.json({ patient }, { status: 201 });
  } catch (err: any) {
    console.error('Error creating patient:', err);
    return NextResponse.json({ error: err.message || 'Failed to create patient' }, { status: 500 });
  }
}
