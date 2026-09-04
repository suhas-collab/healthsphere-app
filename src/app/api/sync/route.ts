import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const items = body.items || [];
    const syncedIds: number[] = [];

    // Ensure fallback facility and health worker exist for offline syncing
    let defaultFacility = await prisma.facility.findFirst({
      where: { type: 'SUB_CENTRE' },
    });
    if (!defaultFacility) {
      defaultFacility = await prisma.facility.create({
        data: {
          code: 'SC-OFFLINE-01',
          name: 'Bilaspur Rural Sub-Centre',
          type: 'SUB_CENTRE',
          block: 'Bilha',
          district: 'Bilaspur',
          state: 'Chhattisgarh',
        },
      });
    }

    let defaultWorker = await prisma.healthWorker.findFirst({
      where: { role: 'ASHA' },
    });
    if (!defaultWorker) {
      defaultWorker = await prisma.healthWorker.create({
        data: {
          workerCode: 'HW-ASHA-OFFLINE',
          name: 'Sunita Devi',
          role: 'ASHA',
          phone: '+91 98261 12345',
          facilityId: defaultFacility.id,
        },
      });
    }

    const districtHospital = await prisma.facility.findFirst({
      where: { type: 'DISTRICT_HOSPITAL' },
    });

    const medicalOfficer = await prisma.healthWorker.findFirst({
      where: { role: 'MEDICAL_OFFICER' },
    });

    for (const item of items) {
      try {
        if (item.actionType === 'REGISTER_PATIENT') {
          const p = item.payload;
          await prisma.patient.upsert({
            where: { abhaId: p.abhaId },
            update: {
              name: p.name,
              gender: p.gender,
              age: Number(p.age),
              phone: p.phone,
              village: p.village,
              isPregnant: Boolean(p.isPregnant),
              gestationalWeeks: p.gestationalWeeks ? Number(p.gestationalWeeks) : null,
              edd: p.edd || null,
              bloodGroup: p.bloodGroup || null,
              guardianName: p.guardianName || null,
            },
            create: {
              abhaId: p.abhaId,
              abhaAddress: p.abhaAddress || `${p.name.toLowerCase().replace(/\s+/g, '')}@abdm`,
              name: p.name,
              gender: p.gender,
              age: Number(p.age),
              phone: p.phone,
              village: p.village,
              subCentre: p.subCentre || defaultFacility.name,
              block: p.block || 'Bilha',
              district: p.district || 'Bilaspur',
              state: 'Chhattisgarh',
              isPregnant: Boolean(p.isPregnant),
              gestationalWeeks: p.gestationalWeeks ? Number(p.gestationalWeeks) : null,
              edd: p.edd || null,
              bloodGroup: p.bloodGroup || null,
              guardianName: p.guardianName || null,
            },
          });
          syncedIds.push(item.id);
        } else if (item.actionType === 'TRIAGE_ENCOUNTER') {
          const e = item.payload;

          // Find or create patient
          let patient = await prisma.patient.findUnique({
            where: { abhaId: e.patientAbhaId },
          });

          if (!patient) {
            patient = await prisma.patient.create({
              data: {
                abhaId: e.patientAbhaId,
                name: e.patientName || 'Rural Citizen',
                gender: e.patientGender || 'female',
                age: Number(e.patientAge) || 30,
                phone: '+91 97555 00000',
                village: e.patientVillage || 'Bilaspur Gram',
                block: 'Bilha',
                district: 'Bilaspur',
                state: 'Chhattisgarh',
                isPregnant: Boolean(e.isHighRiskMaternal),
              },
            });
          }

          // Create Encounter
          const encounter = await prisma.encounter.create({
            data: {
              patientId: patient.id,
              healthWorkerId: defaultWorker.id,
              facilityId: defaultFacility.id,
              temperatureF: e.temperatureF ? parseFloat(e.temperatureF) : null,
              systolicBP: e.systolicBP ? parseInt(e.systolicBP) : null,
              diastolicBP: e.diastolicBP ? parseInt(e.diastolicBP) : null,
              pulseRate: e.pulseRate ? parseInt(e.pulseRate) : null,
              respiratoryRate: e.respiratoryRate ? parseInt(e.respiratoryRate) : null,
              spo2: e.spo2 ? parseFloat(e.spo2) : null,
              bloodGlucoseMgDl: e.bloodGlucoseMgDl ? parseFloat(e.bloodGlucoseMgDl) : null,
              weightKg: e.weightKg ? parseFloat(e.weightKg) : null,
              heightCm: e.heightCm ? parseFloat(e.heightCm) : null,
              chiefComplaints: Array.isArray(e.chiefComplaints) ? e.chiefComplaints.join(', ') : e.chiefComplaints || '',
              durationDays: e.durationDays ? parseInt(e.durationDays) : null,
              clinicalNotes: e.clinicalNotes || '',
              riskLevel: e.riskLevel || 'GREEN',
              triageRationale: e.triageRationale || 'Point-of-care clinical assessment',
              isHighRiskMaternal: Boolean(e.isHighRiskMaternal),
              isHighRiskChild: Boolean(e.isHighRiskChild),
              dangerSigns: e.dangerSigns || null,
              status: e.riskLevel === 'RED' ? 'UNDER_REVIEW' : 'COMPLETED',
            },
          });

          // If RED triage or teleconsult requested, initiate teleconsultation or referral
          if (e.requestTeleconsult || e.riskLevel === 'RED') {
            await prisma.teleconsultation.create({
              data: {
                teleconsultId: `TC-${Date.now().toString().slice(-6)}`,
                patientId: patient.id,
                encounterId: encounter.id,
                requestingWorkerId: defaultWorker.id,
                doctorId: medicalOfficer?.id,
                status: 'REQUESTED',
                roomSessionId: `ROOM-LIVE-${Date.now().toString().slice(-4)}`,
                chiefComplaint: `${e.riskLevel} Triage: ${Array.isArray(e.chiefComplaints) ? e.chiefComplaints.join(', ') : e.chiefComplaints}`,
              },
            });
          }

          if (e.createReferral || (e.riskLevel === 'RED' && districtHospital)) {
            await prisma.referral.create({
              data: {
                referralCode: `REF-${Date.now().toString().slice(-6)}`,
                patientId: patient.id,
                encounterId: encounter.id,
                sourceFacilityId: defaultFacility.id,
                targetFacilityId: districtHospital ? districtHospital.id : defaultFacility.id,
                referringWorkerId: defaultWorker.id,
                priority: e.riskLevel === 'RED' ? 'STAT' : 'URGENT',
                reasonForReferral: `${e.riskLevel} Flag: ${e.triageRationale || 'Requires higher level emergency care'}`,
                clinicalSummary: `Vitals: BP ${e.systolicBP || '--'}/${e.diastolicBP || '--'} mmHg, SpO2 ${e.spo2 || '--'}%, Pulse ${e.pulseRate || '--'} bpm`,
                transportStatus: e.riskLevel === 'RED' ? 'AMBULANCE_DISPATCHED' : 'NOT_REQUIRED',
                status: 'PENDING',
              },
            });
          }

          syncedIds.push(item.id);
        }
      } catch (innerErr) {
        console.error('Failed to sync item:', item, innerErr);
      }
    }

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
