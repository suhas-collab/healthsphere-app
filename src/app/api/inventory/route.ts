import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/guards';

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

    const where: any = {};
    if (facilityId) where.facilityId = facilityId;
    if (stockoutOnly) where.isStockout = true;

    const inventory = await prisma.inventory.findMany({
      where,
      include: {
        facility: true,
      },
      orderBy: [
        { isStockout: 'desc' },
        { currentStock: 'asc' },
      ],
    });

    return NextResponse.json({ inventory });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
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

    const item = await prisma.inventory.findUnique({ where: { id } });
    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    const newStock = item.currentStock + (parseInt(replenishQuantity) || 50);
    const updated = await prisma.inventory.update({
      where: { id },
      data: {
        currentStock: newStock,
        isStockout: newStock <= item.minimumThreshold,
      },
      include: { facility: true },
    });

    return NextResponse.json({ inventoryItem: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
