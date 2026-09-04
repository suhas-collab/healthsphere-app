import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
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
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, id, status, doctorDiagnosis, doctorAdvice, doctorId } = body;

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
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
