import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const patientId = searchParams.get('patientId');

    const where: any = {};
    if (patientId) where.patientId = patientId;

    const prescriptions = await prisma.prescription.findMany({
      where,
      include: {
        patient: true,
        doctor: true,
        items: true,
        teleconsultation: true,
      },
      orderBy: { issuedAt: 'desc' },
    });

    return NextResponse.json({ prescriptions });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { patientId, doctorId, encounterId, teleconsultationId, diagnosis, advice, items } = body;

    const prescriptionCode = `RX-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const digitalSignature = `VERIFIED_MD_${doctorId || 'PHC_MO'}_${Date.now().toString(36).toUpperCase()}_DIGISEAL`;

    const prescription = await prisma.prescription.create({
      data: {
        prescriptionCode,
        patientId,
        doctorId,
        encounterId: encounterId || null,
        teleconsultationId: teleconsultationId || null,
        diagnosis: diagnosis || 'Clinical Observation',
        advice: advice || 'Follow instructions on dosage and return if symptoms persist.',
        digitalSignature,
        items: {
          create: (items || []).map((item: any) => ({
            medicineName: item.medicineName,
            dosage: item.dosage || '1 tablet',
            frequency: item.frequency || '1-0-1',
            durationDays: parseInt(item.durationDays) || 5,
            instructions: item.instructions || '',
          })),
        },
      },
      include: {
        patient: true,
        doctor: true,
        items: true,
      },
    });

    // Optionally deduct inventory stock if match found
    if (items && Array.isArray(items)) {
      for (const item of items) {
        try {
          const inv = await prisma.inventory.findFirst({
            where: {
              medicineName: { contains: item.medicineName.split(' ')[0] },
            },
          });
          if (inv && inv.currentStock > 0) {
            const newStock = Math.max(0, inv.currentStock - 1);
            await prisma.inventory.update({
              where: { id: inv.id },
              data: {
                currentStock: newStock,
                isStockout: newStock <= inv.minimumThreshold,
              },
            });
          }
        } catch (invErr) {
          console.warn('Inventory update skip:', invErr);
        }
      }
    }

    return NextResponse.json({ prescription }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
