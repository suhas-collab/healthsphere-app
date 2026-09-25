import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/guards';
import { clinicalData } from '@/lib/clinicalData';

export async function GET(req: NextRequest) {
  // District-wide surveillance command dashboard requires DHO or Admin role
  const { errorResponse } = await requireAuth(req, ['DISTRICT_HEALTH_OFFICER', 'ADMIN']);
  if (errorResponse) return errorResponse;

  try {
    const { searchParams } = new URL(req.url);
    const district = searchParams.get('district')?.trim() || null;

    const dashboard = await clinicalData.getDashboardData(district);

    return NextResponse.json(dashboard);
  } catch (err: any) {
    console.error('Error fetching dashboard surveillance metrics:', err);
    return NextResponse.json({ error: err?.message || 'Failed to fetch dashboard metrics' }, { status: 500 });
  }
}
