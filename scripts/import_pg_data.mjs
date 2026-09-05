import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const backupPath = path.join(projectRoot, 'prisma', 'sqlite_data_backup.json');

async function main() {
  console.log('🚀 Preparing PostgreSQL Data Import from SQLite Backup...');

  // 1. Verify DATABASE_URL
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl || (!dbUrl.startsWith('postgresql://') && !dbUrl.startsWith('postgres://'))) {
    console.error('❌ ERROR: DATABASE_URL must be set to a valid PostgreSQL connection string.');
    console.error('   Format: postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require');
    process.exit(1);
  }

  // 2. Verify Backup File Exists
  if (!fs.existsSync(backupPath)) {
    console.error(`❌ ERROR: Backup file not found at: ${backupPath}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(backupPath, 'utf-8');
  const backup = JSON.parse(raw);
  const { data, metadata } = backup;

  console.log(`📦 Loaded backup created at: ${metadata.exportedAt}`);
  console.log(`   Expected records to import: ${metadata.totalRecordCount}`);

  const prisma = new PrismaClient();

  try {
    // -------------------------------------------------------------------------
    // Step 1: Facilities (Root organization / location nodes)
    // -------------------------------------------------------------------------
    console.log(`\n🏥 [1/9] Restoring Facilities (${data.facilities.length})...`);
    for (const f of data.facilities) {
      await prisma.facility.upsert({
        where: { id: f.id },
        update: { ...f },
        create: { ...f },
      });
    }

    // -------------------------------------------------------------------------
    // Step 2: HealthWorkers (Practitioners assigned to facilities)
    // -------------------------------------------------------------------------
    console.log(`👩‍⚕️ [2/9] Restoring Health Workers (${data.healthWorkers.length})...`);
    for (const hw of data.healthWorkers) {
      await prisma.healthWorker.upsert({
        where: { id: hw.id },
        update: { ...hw },
        create: { ...hw },
      });
    }

    // -------------------------------------------------------------------------
    // Step 3: Patients (Citizens with ABHA IDs and demographics)
    // -------------------------------------------------------------------------
    console.log(`👥 [3/9] Restoring Patients (${data.patients.length})...`);
    for (const p of data.patients) {
      await prisma.patient.upsert({
        where: { id: p.id },
        update: {
          ...p,
          createdAt: new Date(p.createdAt),
          updatedAt: new Date(p.updatedAt),
        },
        create: {
          ...p,
          createdAt: new Date(p.createdAt),
          updatedAt: new Date(p.updatedAt),
        },
      });
    }

    // -------------------------------------------------------------------------
    // Step 4: Encounters (Clinical triage records and vitals)
    // -------------------------------------------------------------------------
    console.log(`🩺 [4/9] Restoring Clinical Encounters (${data.encounters.length})...`);
    for (const e of data.encounters) {
      await prisma.encounter.upsert({
        where: { id: e.id },
        update: {
          ...e,
          encounterDate: new Date(e.encounterDate),
        },
        create: {
          ...e,
          encounterDate: new Date(e.encounterDate),
        },
      });
    }

    // -------------------------------------------------------------------------
    // Step 5: Referrals (Downstream hospital transfers)
    // -------------------------------------------------------------------------
    console.log(`🚑 [5/9] Restoring Downstream Referrals (${data.referrals.length})...`);
    for (const r of data.referrals) {
      await prisma.referral.upsert({
        where: { id: r.id },
        update: {
          ...r,
          createdAt: new Date(r.createdAt),
          acceptedAt: r.acceptedAt ? new Date(r.acceptedAt) : null,
          completedAt: r.completedAt ? new Date(r.completedAt) : null,
        },
        create: {
          ...r,
          createdAt: new Date(r.createdAt),
          acceptedAt: r.acceptedAt ? new Date(r.acceptedAt) : null,
          completedAt: r.completedAt ? new Date(r.completedAt) : null,
        },
      });
    }

    // -------------------------------------------------------------------------
    // Step 6: Teleconsultations (Virtual consultations)
    // -------------------------------------------------------------------------
    console.log(`💻 [6/9] Restoring Teleconsultations (${data.teleconsultations.length})...`);
    for (const tc of data.teleconsultations) {
      await prisma.teleconsultation.upsert({
        where: { id: tc.id },
        update: {
          ...tc,
          scheduledAt: new Date(tc.scheduledAt),
          startedAt: tc.startedAt ? new Date(tc.startedAt) : null,
          endedAt: tc.endedAt ? new Date(tc.endedAt) : null,
          createdAt: new Date(tc.createdAt),
        },
        create: {
          ...tc,
          scheduledAt: new Date(tc.scheduledAt),
          startedAt: tc.startedAt ? new Date(tc.startedAt) : null,
          endedAt: tc.endedAt ? new Date(tc.endedAt) : null,
          createdAt: new Date(tc.createdAt),
        },
      });
    }

    // -------------------------------------------------------------------------
    // Step 7: Prescriptions (Medication orders)
    // -------------------------------------------------------------------------
    console.log(`💊 [7/9] Restoring Digital Prescriptions (${data.prescriptions.length})...`);
    for (const rx of data.prescriptions) {
      await prisma.prescription.upsert({
        where: { id: rx.id },
        update: {
          ...rx,
          issuedAt: new Date(rx.issuedAt),
        },
        create: {
          ...rx,
          issuedAt: new Date(rx.issuedAt),
        },
      });
    }

    // -------------------------------------------------------------------------
    // Step 8: Prescription Items (Dosage and duration line items)
    // -------------------------------------------------------------------------
    console.log(`📋 [8/9] Restoring Prescription Items (${data.prescriptionItems.length})...`);
    for (const item of data.prescriptionItems) {
      await prisma.prescriptionItem.upsert({
        where: { id: item.id },
        update: { ...item },
        create: { ...item },
      });
    }

    // -------------------------------------------------------------------------
    // Step 9: Inventory (Facility medicine stocks)
    // -------------------------------------------------------------------------
    console.log(`📦 [9/9] Restoring Facility Inventory (${data.inventory.length})...`);
    for (const inv of data.inventory) {
      await prisma.inventory.upsert({
        where: { id: inv.id },
        update: {
          ...inv,
          updatedAt: new Date(inv.updatedAt),
        },
        create: {
          ...inv,
          updatedAt: new Date(inv.updatedAt),
        },
      });
    }

    // -------------------------------------------------------------------------
    // Verification & Integrity Confirmation
    // -------------------------------------------------------------------------
    console.log('\n🔍 Verifying PostgreSQL Database Record Counts...');
    const [
      cFacilities,
      cWorkers,
      cPatients,
      cEncounters,
      cReferrals,
      cTele,
      cRx,
      cItems,
      cInv,
    ] = await Promise.all([
      prisma.facility.count(),
      prisma.healthWorker.count(),
      prisma.patient.count(),
      prisma.encounter.count(),
      prisma.referral.count(),
      prisma.teleconsultation.count(),
      prisma.prescription.count(),
      prisma.prescriptionItem.count(),
      prisma.inventory.count(),
    ]);

    const verificationReport = {
      facilities: { expected: data.facilities.length, actual: cFacilities, match: data.facilities.length === cFacilities },
      healthWorkers: { expected: data.healthWorkers.length, actual: cWorkers, match: data.healthWorkers.length === cWorkers },
      patients: { expected: data.patients.length, actual: cPatients, match: data.patients.length === cPatients },
      encounters: { expected: data.encounters.length, actual: cEncounters, match: data.encounters.length === cEncounters },
      referrals: { expected: data.referrals.length, actual: cReferrals, match: data.referrals.length === cReferrals },
      teleconsultations: { expected: data.teleconsultations.length, actual: cTele, match: data.teleconsultations.length === cTele },
      prescriptions: { expected: data.prescriptions.length, actual: cRx, match: data.prescriptions.length === cRx },
      prescriptionItems: { expected: data.prescriptionItems.length, actual: cItems, match: data.prescriptionItems.length === cItems },
      inventory: { expected: data.inventory.length, actual: cInv, match: data.inventory.length === cInv },
    };

    console.log(JSON.stringify(verificationReport, null, 2));

    const allPassed = Object.values(verificationReport).every((v) => v.match);
    if (allPassed) {
      console.log('\n🎉 ALL RECORDS RESTORED AND VERIFIED 100% INTO POSTGRESQL!');
    } else {
      console.warn('\n⚠️ WARNING: Some record counts did not match expected values.');
    }
  } catch (err) {
    console.error('❌ Data import error:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
