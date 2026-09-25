import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/guards';
import { clinicalData } from '@/lib/clinicalData';

export async function GET(req: NextRequest) {
  const { errorResponse } = await requireAuth(req, [
    'ASHA',
    'ANM',
    'MEDICAL_OFFICER',
    'DISTRICT_HEALTH_OFFICER',
    'ADMIN',
    'PATIENT',
  ]);
  if (errorResponse) return errorResponse;

  try {
    const facilities = await clinicalData.getFacilities();
    return NextResponse.json({ facilities });
  } catch (err: any) {
    console.error('Error fetching facilities:', err);
    return NextResponse.json({ error: err.message || 'Failed to fetch facilities' }, { status: 500 });
  }
}
