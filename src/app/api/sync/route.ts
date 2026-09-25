import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/guards';
import { clinicalData } from '@/lib/clinicalData';

export async function POST(req: NextRequest) {
  // Offline sync queue restricted to frontline ASHAs, ANMs, and Admins
  const { errorResponse } = await requireAuth(req, ['ASHA', 'ANM', 'ADMIN']);
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const items = body.items || [];

    const syncedIds = await clinicalData.batchSync(items);

    return NextResponse.json({
      success: true,
      syncedCount: syncedIds.length,
      syncedIds,
    });
  } catch (error: any) {
    console.error('Batch Sync API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Sync Error' }, { status: 500 });
  }
}
