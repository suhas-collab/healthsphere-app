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
    const riskLevel = searchParams.get('riskLevel');
    const facilityId = searchParams.get('facilityId');

    const whereClause: any = {};
    if (riskLevel && riskLevel !== 'ALL') {
      whereClause.riskLevel = riskLevel;
    }
    if (facilityId) {
      whereClause.facilityId = facilityId;
    }

    const encounters = await prisma.encounter.findMany({
      where: whereClause,
      include: {
        patient: true,
        healthWorker: true,
        facility: true,
        teleconsultation: true,
        referral: {
          include: {
            targetFacility: true,
          },
        },
        prescriptions: {
          include: {
            items: true,
          },
        },
      },
      orderBy: [
        // Custom priority: Red first, then Yellow, then Green, then latest
        { encounterDate: 'desc' },
      ],
    });

    // Custom clinical sort: RED -> YELLOW -> GREEN
    const priorityOrder: Record<string, number> = { RED: 0, YELLOW: 1, GREEN: 2 };
    const sorted = [...encounters].sort((a, b) => {
      const pA = priorityOrder[a.riskLevel] ?? 3;
      const pB = priorityOrder[b.riskLevel] ?? 3;
      if (pA !== pB) return pA - pB;
      return new Date(b.encounterDate).getTime() - new Date(a.encounterDate).getTime();
    });

    return NextResponse.json({ encounters: sorted });
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

    const encounter = await prisma.encounter.create({
      data: {
        patientId: body.patientId,
        healthWorkerId: body.healthWorkerId,
        facilityId: body.facilityId,
        temperatureF: body.temperatureF ? parseFloat(body.temperatureF) : null,
        systolicBP: body.systolicBP ? parseInt(body.systolicBP) : null,
        diastolicBP: body.diastolicBP ? parseInt(body.diastolicBP) : null,
        pulseRate: body.pulseRate ? parseInt(body.pulseRate) : null,
        respiratoryRate: body.respiratoryRate ? parseInt(body.respiratoryRate) : null,
        spo2: body.spo2 ? parseFloat(body.spo2) : null,
        bloodGlucoseMgDl: body.bloodGlucoseMgDl ? parseFloat(body.bloodGlucoseMgDl) : null,
        weightKg: body.weightKg ? parseFloat(body.weightKg) : null,
        heightCm: body.heightCm ? parseFloat(body.heightCm) : null,
        chiefComplaints: Array.isArray(body.chiefComplaints) ? body.chiefComplaints.join(', ') : body.chiefComplaints,
        durationDays: body.durationDays ? parseInt(body.durationDays) : null,
        clinicalNotes: body.clinicalNotes || '',
        riskLevel: body.riskLevel || 'GREEN',
        triageRationale: body.triageRationale || 'Point-of-care clinical assessment',
        isHighRiskMaternal: Boolean(body.isHighRiskMaternal),
        isHighRiskChild: Boolean(body.isHighRiskChild),
        dangerSigns: body.dangerSigns || null,
        status: body.status || 'COMPLETED',
      },
      include: {
        patient: true,
        facility: true,
      },
    });

    return NextResponse.json({ encounter }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
