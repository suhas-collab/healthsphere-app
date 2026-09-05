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
    const teleconsults = await prisma.teleconsultation.findMany({
      include: {
        patient: true,
        encounter: true,
        requestingWorker: {
          include: { facility: true },
        },
        doctor: true,
        prescriptions: {
          include: { items: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ teleconsultations: teleconsults });
  } catch (err: any) {
    console.error('Error fetching teleconsultations:', err);
    return NextResponse.json({ error: err?.message || 'Failed to fetch teleconsultations' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, id, status, doctorDiagnosis, doctorAdvice, doctorId } = body;

    // Doctor/Admin required for updating status/diagnosis, frontline allowed to request
    const allowedRoles = action === 'UPDATE_STATUS'
      ? ['MEDICAL_OFFICER', 'ADMIN']
      : ['ASHA', 'ANM', 'MEDICAL_OFFICER', 'ADMIN'];

    const { errorResponse } = await requireAuth(req, allowedRoles as any);
    if (errorResponse) return errorResponse;

    if (action === 'UPDATE_STATUS' && id) {
      const updated = await prisma.teleconsultation.update({
        where: { id },
        data: {
          status: status || undefined,
          doctorDiagnosis: doctorDiagnosis || undefined,
          doctorAdvice: doctorAdvice || undefined,
          doctorId: doctorId || undefined,
          startedAt: status === 'IN_PROGRESS' ? new Date() : undefined,
          endedAt: status === 'COMPLETED' ? new Date() : undefined,
        },
        include: {
          patient: true,
          encounter: true,
          requestingWorker: true,
          doctor: true,
        },
      });
      return NextResponse.json({ teleconsultation: updated });
    }

    // Otherwise create new teleconsultation request
    const teleconsult = await prisma.teleconsultation.create({
      data: {
        teleconsultId: `TC-${Date.now().toString().slice(-6)}`,
        patientId: body.patientId,
        encounterId: body.encounterId || null,
        requestingWorkerId: body.requestingWorkerId,
        doctorId: body.doctorId || null,
        status: body.status || 'REQUESTED',
        roomSessionId: `ROOM-${Date.now().toString().slice(-6)}`,
        chiefComplaint: body.chiefComplaint,
        doctorDiagnosis: body.doctorDiagnosis || null,
        doctorAdvice: body.doctorAdvice || null,
      },
      include: {
        patient: true,
        encounter: true,
      },
    });

    return NextResponse.json({ teleconsultation: teleconsult }, { status: 201 });
  } catch (err: any) {
    console.error('Error creating/updating teleconsultation:', err);
    return NextResponse.json({ error: err?.message || 'Failed to process teleconsultation' }, { status: 500 });
  }
}
