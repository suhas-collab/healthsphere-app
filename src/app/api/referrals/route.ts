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
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    const referrals = await clinicalData.getReferrals(status);
    return NextResponse.json({ referrals });
  } catch (err: any) {
    console.error('Error fetching referrals:', err);
    return NextResponse.json({ error: err?.message || 'Failed to fetch referrals' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { errorResponse } = await requireAuth(req, [
    'ASHA',
    'ANM',
    'MEDICAL_OFFICER',
    'ADMIN',
  ]);
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const referral = await clinicalData.createReferral(body);
    return NextResponse.json({ referral }, { status: 201 });
  } catch (err: any) {
    console.error('Error creating referral:', err);
    return NextResponse.json({ error: err?.message || 'Failed to create referral' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const { errorResponse } = await requireAuth(req, [
    'MEDICAL_OFFICER',
    'DISTRICT_HEALTH_OFFICER',
    'ADMIN',
  ]);
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const { id, ...updates } = body;
    const referral = await clinicalData.updateReferral(id, updates);
    return NextResponse.json({ referral });
  } catch (err: any) {
    console.error('Error updating referral:', err);
    return NextResponse.json({ error: err?.message || 'Failed to update referral' }, { status: 500 });
  }
}
