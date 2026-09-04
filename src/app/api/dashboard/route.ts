import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const [
      totalPatients,
      totalEncounters,
      redEncounters,
      yellowEncounters,
      greenEncounters,
      referrals,
      stockouts,
      maternalHighRisk,
      childHighRisk,
      facilities,
    ] = await Promise.all([
      prisma.patient.count(),
      prisma.encounter.count(),
      prisma.encounter.count({ where: { riskLevel: 'RED' } }),
      prisma.encounter.count({ where: { riskLevel: 'YELLOW' } }),
      prisma.encounter.count({ where: { riskLevel: 'GREEN' } }),
      prisma.referral.findMany({
        include: {
          patient: true,
          sourceFacility: true,
          targetFacility: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.inventory.findMany({
        where: { isStockout: true },
        include: { facility: true },
      }),
      prisma.patient.findMany({
        where: {
          isPregnant: true,
          encounters: {
            some: {
              OR: [{ riskLevel: 'RED' }, { isHighRiskMaternal: true }],
            },
          },
        },
        include: {
          encounters: {
            orderBy: { encounterDate: 'desc' },
            take: 1,
          },
        },
      }),
      prisma.patient.findMany({
        where: {
          age: { lte: 5 },
          encounters: {
            some: {
              OR: [{ riskLevel: 'RED' }, { isHighRiskChild: true }],
            },
          },
        },
        include: {
          encounters: {
            orderBy: { encounterDate: 'desc' },
            take: 1,
          },
        },
      }),
      prisma.facility.findMany({
        include: {
          _count: {
            select: {
              encounters: true,
              referralsOriginating: true,
              inventoryItems: { where: { isStockout: true } },
            },
          },
        },
      }),
    ]);

    const activeReferrals = referrals.filter(
      (r) => r.status === 'PENDING' || r.status === 'ACCEPTED' || r.status === 'IN_TRANSIT'
    );

    return NextResponse.json({
      metrics: {
        totalPatients,
        totalEncounters,
        redEncounters,
        yellowEncounters,
        greenEncounters,
        redPercentage: totalEncounters > 0 ? Math.round((redEncounters / totalEncounters) * 100) : 0,
        activeReferralsCount: activeReferrals.length,
        totalReferralsCount: referrals.length,
        stockoutAlertsCount: stockouts.length,
        highRiskMaternalCount: maternalHighRisk.length,
        highRiskChildCount: childHighRisk.length,
      },
      activeReferrals,
      stockoutItems: stockouts,
      maternalFollowups: maternalHighRisk,
      childFollowups: childHighRisk,
      facilities,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
