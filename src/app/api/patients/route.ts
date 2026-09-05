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
    const q = searchParams.get('q');

    let patients;
    if (q) {
      patients = await prisma.patient.findMany({
        where: {
          OR: [
            { abhaId: { contains: q } },
            { name: { contains: q } },
            { phone: { contains: q } },
            { village: { contains: q } },
          ],
        },
        orderBy: { createdAt: 'desc' },
        include: {
          encounters: {
            orderBy: { encounterDate: 'desc' },
            take: 3,
          },
        },
      });
    } else {
      patients = await prisma.patient.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          encounters: {
            orderBy: { encounterDate: 'desc' },
            take: 2,
          },
        },
      });
    }

    return NextResponse.json({ patients });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
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

    const patient = await prisma.patient.create({
      data: {
        abhaId: body.abhaId || `91-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`,
        abhaAddress: body.abhaAddress || `${(body.name || 'citizen').toLowerCase().replace(/\s+/g, '')}@abdm`,
        name: body.name,
        gender: body.gender || 'female',
        age: parseInt(body.age) || 25,
        birthDate: body.birthDate || null,
        phone: body.phone,
        guardianName: body.guardianName || null,
        village: body.village || 'Bilaspur Gram',
        subCentre: body.subCentre || 'Bilaspur Sub-Centre',
        block: body.block || 'Bilha',
        district: body.district || 'Bilaspur',
        state: 'Chhattisgarh',
        bloodGroup: body.bloodGroup || null,
        isPregnant: Boolean(body.isPregnant),
        gestationalWeeks: body.gestationalWeeks ? parseInt(body.gestationalWeeks) : null,
        edd: body.edd || null,
      },
    });

    return NextResponse.json({ patient }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
