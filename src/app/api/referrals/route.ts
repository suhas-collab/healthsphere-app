import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    const where: any = {};
    if (status && status !== 'ALL') where.status = status;

    const referrals = await prisma.referral.findMany({
      where,
      include: {
        patient: true,
        sourceFacility: true,
        targetFacility: true,
        referringWorker: true,
        encounter: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ referrals });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const referralCode = `REF-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const referral = await prisma.referral.create({
      data: {
        referralCode,
        patientId: body.patientId,
        encounterId: body.encounterId || null,
        sourceFacilityId: body.sourceFacilityId,
        targetFacilityId: body.targetFacilityId,
        referringWorkerId: body.referringWorkerId,
        priority: body.priority || 'ROUTINE',
        reasonForReferral: body.reasonForReferral,
        clinicalSummary: body.clinicalSummary || null,
        preReferralTreatment: body.preReferralTreatment || null,
        transportStatus: body.transportStatus || 'NOT_REQUIRED',
        status: body.status || 'PENDING',
      },
      include: {
        patient: true,
        sourceFacility: true,
        targetFacility: true,
      },
    });

    return NextResponse.json({ referral }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, status, transportStatus, receivingNotes } = body;

    const updateData: any = {};
    if (status) {
      updateData.status = status;
      if (status === 'ACCEPTED') updateData.acceptedAt = new Date();
      if (status === 'COMPLETED') updateData.completedAt = new Date();
    }
    if (transportStatus) updateData.transportStatus = transportStatus;
    if (receivingNotes) updateData.receivingNotes = receivingNotes;

    const updated = await prisma.referral.update({
      where: { id },
      data: updateData,
      include: {
        patient: true,
        sourceFacility: true,
        targetFacility: true,
      },
    });

    return NextResponse.json({ referral: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
