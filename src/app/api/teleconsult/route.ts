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
  ]);
  if (errorResponse) return errorResponse;

  try {
    const teleconsults = await clinicalData.getTeleconsultations();
    return NextResponse.json({ teleconsultations: teleconsults });
  } catch (err: any) {
    console.error('Error fetching teleconsultations:', err);
    return NextResponse.json({ error: err?.message || 'Failed to fetch teleconsultations' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    const allowedRoles = action === 'UPDATE_STATUS'
      ? ['MEDICAL_OFFICER', 'ADMIN']
      : ['ASHA', 'ANM', 'MEDICAL_OFFICER', 'ADMIN'];

    const { errorResponse } = await requireAuth(req, allowedRoles as any);
    if (errorResponse) return errorResponse;

    const result = await clinicalData.updateOrCreateTeleconsult(body);
    return NextResponse.json({ teleconsultation: result }, { status: action === 'UPDATE_STATUS' ? 200 : 201 });
  } catch (err: any) {
    console.error('Error processing teleconsultation:', err);
    return NextResponse.json({ error: err?.message || 'Failed to process teleconsultation' }, { status: 500 });
  }
}
