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
    const facilityId = searchParams.get('facilityId');
    const stockoutOnly = searchParams.get('stockoutOnly') === 'true';

    const inventory = await clinicalData.getInventory({ facilityId, stockoutOnly });
    return NextResponse.json({ inventory });
  } catch (err: any) {
    console.error('Error fetching inventory:', err);
    return NextResponse.json({ error: err.message || 'Failed to fetch inventory' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { errorResponse } = await requireAuth(req, [
    'DISTRICT_HEALTH_OFFICER',
    'MEDICAL_OFFICER',
    'ADMIN',
  ]);
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const { id, replenishQuantity } = body;
    const qty = parseInt(replenishQuantity) || 50;

    const inventoryItem = await clinicalData.replenishInventory(id, qty);
    if (!inventoryItem) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    return NextResponse.json({ inventoryItem });
  } catch (err: any) {
    console.error('Error replenishing inventory:', err);
    return NextResponse.json({ error: err.message || 'Failed to replenish inventory' }, { status: 500 });
  }
}
