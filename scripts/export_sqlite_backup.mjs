import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.resolve(__dirname, '..');
const backupPath = path.join(projectRoot, 'prisma', 'sqlite_data_backup.json');
const dbPath = path.join(projectRoot, 'prisma', 'rural_health.db');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: `file:${dbPath.replace(/\\/g, '/')}`,
    },
  },
});

async function exportData() {
  console.log('🔄 Connecting to SQLite database at:', dbPath);

  const [
    facilities,
    healthWorkers,
    patients,
    encounters,
    referrals,
    teleconsultations,
    prescriptions,
    prescriptionItems,
    inventory,
  ] = await Promise.all([
    prisma.facility.findMany({ orderBy: { id: 'asc' } }),
    prisma.healthWorker.findMany({ orderBy: { id: 'asc' } }),
    prisma.patient.findMany({ orderBy: { id: 'asc' } }),
    prisma.encounter.findMany({ orderBy: { encounterDate: 'asc' } }),
    prisma.referral.findMany({ orderBy: { createdAt: 'asc' } }),
    prisma.teleconsultation.findMany({ orderBy: { createdAt: 'asc' } }),
    prisma.prescription.findMany({ orderBy: { issuedAt: 'asc' } }),
    prisma.prescriptionItem.findMany({ orderBy: { id: 'asc' } }),
    prisma.inventory.findMany({ orderBy: { id: 'asc' } }),
  ]);

  const backupData = {
    metadata: {
      exportedAt: new Date().toISOString(),
      sourceDatabase: 'SQLite',
      sourceFilePath: dbPath,
      totalRecordCount:
        facilities.length +
        healthWorkers.length +
        patients.length +
        encounters.length +
        referrals.length +
        teleconsultations.length +
        prescriptions.length +
        prescriptionItems.length +
        inventory.length,
      entityCounts: {
        facilities: facilities.length,
        healthWorkers: healthWorkers.length,
        patients: patients.length,
        encounters: encounters.length,
        referrals: referrals.length,
        teleconsultations: teleconsultations.length,
        prescriptions: prescriptions.length,
        prescriptionItems: prescriptionItems.length,
        inventory: inventory.length,
      },
    },
    data: {
      facilities,
      healthWorkers,
      patients,
      encounters,
      referrals,
      teleconsultations,
      prescriptions,
      prescriptionItems,
      inventory,
    },
  };

  fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2), 'utf-8');

  console.log('✅ Export successfully written to:', backupPath);

  await prisma.$disconnect();
  return backupData;
}

exportData().catch(async (err) => {
  console.error('❌ Export failed:', err);
  await prisma.$disconnect();
  process.exit(1);
});
