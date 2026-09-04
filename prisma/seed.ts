import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Clearing existing rural healthcare database tables...');
  await prisma.prescriptionItem.deleteMany();
  await prisma.prescription.deleteMany();
  await prisma.teleconsultation.deleteMany();
  await prisma.referral.deleteMany();
  await prisma.encounter.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.healthWorker.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.facility.deleteMany();

  console.log('🏥 Creating Healthcare Facilities (Sub-centre, PHC, District Hospital)...');
  const subCentre = await prisma.facility.create({
    data: {
      code: 'SC-BILASPUR-01',
      name: 'Bilaspur Health Sub-Centre (Ayushman Arogya Mandir)',
      type: 'SUB_CENTRE',
      block: 'Bilha',
      district: 'Bilaspur',
      state: 'Chhattisgarh',
      catchmentPop: 4500,
      bedCapacity: 2,
      contactPhone: '+91 7752 234101',
      latitude: 22.0797,
      longitude: 82.1409,
    },
  });

  const phc = await prisma.facility.create({
    data: {
      code: 'PHC-RAMGARH',
      name: 'Ramgarh Primary Health Centre (PHC)',
      type: 'PHC',
      block: 'Bilha',
      district: 'Bilaspur',
      state: 'Chhattisgarh',
      catchmentPop: 28000,
      bedCapacity: 12,
      contactPhone: '+91 7752 289450',
      latitude: 22.1450,
      longitude: 82.2010,
    },
  });

  const districtHospital = await prisma.facility.create({
    data: {
      code: 'DH-BILASPUR',
      name: 'Bilaspur District Civil Hospital',
      type: 'DISTRICT_HOSPITAL',
      block: 'Bilha',
      district: 'Bilaspur',
      state: 'Chhattisgarh',
      catchmentPop: 450000,
      bedCapacity: 350,
      contactPhone: '+91 7752 223300',
      latitude: 22.0911,
      longitude: 82.1528,
    },
  });

  console.log('👩‍⚕️ Seeding Health Workers (ASHAs, ANMs, Medical Officers, DHO)...');
  const ashaWorker = await prisma.healthWorker.create({
    data: {
      workerCode: 'HW-ASHA-001',
      name: 'Sunita Devi',
      role: 'ASHA',
      qualification: 'Matriculation + Certified ASHA Frontline Worker',
      phone: '+91 98261 12345',
      facilityId: subCentre.id,
    },
  });

  const anmWorker = await prisma.healthWorker.create({
    data: {
      workerCode: 'HW-ANM-001',
      name: 'Rekha Sharma',
      role: 'ANM',
      qualification: 'Auxiliary Nurse Midwife (ANM), GNM Registered',
      phone: '+91 98261 54321',
      facilityId: subCentre.id,
    },
  });

  const medicalOfficer = await prisma.healthWorker.create({
    data: {
      workerCode: 'HW-MO-001',
      name: 'Dr. Arun Verma',
      role: 'MEDICAL_OFFICER',
      qualification: 'MBBS, MD (Community Medicine)',
      phone: '+91 94252 88990',
      facilityId: phc.id,
    },
  });

  const dho = await prisma.healthWorker.create({
    data: {
      workerCode: 'HW-DHO-001',
      name: 'Dr. Sneha Patel',
      role: 'DISTRICT_HEALTH_OFFICER',
      qualification: 'MBBS, DPH (Chief Medical & Health Officer)',
      phone: '+91 94250 11223',
      facilityId: districtHospital.id,
    },
  });

  console.log('👥 Seeding Patients with ABHA IDs and MCH Demographics...');
  // Patient 1: High Risk Maternal - Severe Pre-eclampsia (RED)
  const patient1 = await prisma.patient.create({
    data: {
      abhaId: '91-4523-8891-2341',
      abhaAddress: 'sunita.bai@abdm',
      name: 'Sunita Bai Sahu',
      gender: 'female',
      age: 28,
      birthDate: '1998-05-14',
      phone: '+91 97555 10101',
      guardianName: 'Ramesh Sahu (Husband)',
      village: 'Bilaspur Gram',
      subCentre: 'Bilaspur SC',
      block: 'Bilha',
      district: 'Bilaspur',
      bloodGroup: 'B+',
      isPregnant: true,
      gestationalWeeks: 34,
      edd: '2026-10-18',
      gravida: 2,
      parity: 1,
    },
  });

  // Patient 2: Acute Respiratory Distress - Pneumonia / Hypoxia (RED)
  const patient2 = await prisma.patient.create({
    data: {
      abhaId: '91-1092-4432-8765',
      abhaAddress: 'ramesh.yadav@abdm',
      name: 'Ramesh Yadav',
      gender: 'male',
      age: 58,
      birthDate: '1968-11-20',
      phone: '+91 97555 20202',
      guardianName: 'Santosh Yadav (Son)',
      village: 'Khaira',
      subCentre: 'Bilaspur SC',
      block: 'Bilha',
      district: 'Bilaspur',
      bloodGroup: 'O+',
      isPregnant: false,
    },
  });

  // Patient 3: High Risk Maternal - Severe Anemia & Gestational Hypertension (YELLOW)
  const patient3 = await prisma.patient.create({
    data: {
      abhaId: '91-7782-9901-3321',
      abhaAddress: 'priya.k@abdm',
      name: 'Priya Kumari',
      gender: 'female',
      age: 22,
      birthDate: '2004-02-10',
      phone: '+91 97555 30303',
      guardianName: 'Dinesh Kumar (Husband)',
      village: 'Jamgaon',
      subCentre: 'Bilaspur SC',
      block: 'Bilha',
      district: 'Bilaspur',
      bloodGroup: 'A+',
      isPregnant: true,
      gestationalWeeks: 24,
      edd: '2026-12-25',
      gravida: 1,
      parity: 0,
    },
  });

  // Patient 4: High Risk Child - Severe Acute Diarrhea & Dehydration (YELLOW)
  const patient4 = await prisma.patient.create({
    data: {
      abhaId: '91-3341-6672-8812',
      abhaAddress: 'aarav.meena@abdm',
      name: 'Aarav Kumar (Infant)',
      gender: 'male',
      age: 1,
      birthDate: '2025-08-15',
      phone: '+91 97555 40404',
      guardianName: 'Meena Bai (Mother)',
      village: 'Bilaspur Gram',
      subCentre: 'Bilaspur SC',
      block: 'Bilha',
      district: 'Bilaspur',
      bloodGroup: 'O+',
      isPregnant: false,
    },
  });

  // Patient 5: Routine Osteoarthritis / Hypertension (GREEN)
  const patient5 = await prisma.patient.create({
    data: {
      abhaId: '91-6654-1123-9980',
      abhaAddress: 'jagat.ram@abdm',
      name: 'Jagat Ram Soni',
      gender: 'male',
      age: 64,
      birthDate: '1962-03-22',
      phone: '+91 97555 50505',
      guardianName: 'Vijay Soni (Son)',
      village: 'Jamgaon',
      subCentre: 'Bilaspur SC',
      block: 'Bilha',
      district: 'Bilaspur',
      bloodGroup: 'AB+',
      isPregnant: false,
    },
  });

  console.log('🩺 Seeding Clinical Encounters & Point-of-Care Triage...');
  // Encounter 1: Sunita Bai - RED Triage (BP 175/110, severe headache, hyperreflexia)
  const enc1 = await prisma.encounter.create({
    data: {
      patientId: patient1.id,
      healthWorkerId: ashaWorker.id,
      facilityId: subCentre.id,
      temperatureF: 99.2,
      systolicBP: 175,
      diastolicBP: 110,
      pulseRate: 104,
      respiratoryRate: 22,
      spo2: 97.0,
      bloodGlucoseMgDl: 110.0,
      weightKg: 62.0,
      heightCm: 154.0,
      chiefComplaints: 'Severe throbbing headache, blurred vision, epigastric pain, pedal edema',
      durationDays: 2,
      clinicalNotes: 'Gravida 2 at 34 weeks. Blood pressure in critical hypertensive emergency zone. Proteinuria detected on dipstick 3+.',
      riskLevel: 'RED',
      triageRationale: 'CRITICAL: Severe Pre-eclampsia (BP >= 160/110 mmHg with neurological warning signs). High risk of eclampsia convulsions. Immediate escalation required.',
      isHighRiskMaternal: true,
      dangerSigns: 'Severe Pre-eclampsia, Visual disturbances, Epigastric tenderness',
      status: 'REFERRED',
    },
  });

  // Encounter 2: Ramesh Yadav - RED Triage (SpO2 88%, RR 28, Acute Dyspnea)
  const enc2 = await prisma.encounter.create({
    data: {
      patientId: patient2.id,
      healthWorkerId: anmWorker.id,
      facilityId: subCentre.id,
      temperatureF: 102.4,
      systolicBP: 135,
      diastolicBP: 85,
      pulseRate: 114,
      respiratoryRate: 28,
      spo2: 88.0,
      bloodGlucoseMgDl: 160.0,
      weightKg: 55.0,
      heightCm: 168.0,
      chiefComplaints: 'High grade fever with chills, productive rust cough, severe breathlessness at rest',
      durationDays: 4,
      clinicalNotes: 'Severe chest indrawing, tachypnea, cyanotic nail beds. Auscultation shows coarse crackles over right base.',
      riskLevel: 'RED',
      triageRationale: 'CRITICAL: Severe Hypoxemia (SpO2 < 90%) and Tachypnea in acute lower respiratory infection. High risk of respiratory failure.',
      isHighRiskChild: false,
      dangerSigns: 'Hypoxia (SpO2 88%), Respiratory Distress',
      status: 'UNDER_REVIEW',
    },
  });

  // Encounter 3: Priya Kumari - YELLOW Triage (Moderate Anemia in Pregnancy)
  const enc3 = await prisma.encounter.create({
    data: {
      patientId: patient3.id,
      healthWorkerId: ashaWorker.id,
      facilityId: subCentre.id,
      temperatureF: 98.4,
      systolicBP: 138,
      diastolicBP: 88,
      pulseRate: 86,
      respiratoryRate: 18,
      spo2: 98.0,
      bloodGlucoseMgDl: 95.0,
      weightKg: 49.0,
      heightCm: 151.0,
      chiefComplaints: 'General fatigue, dizziness upon standing, loss of appetite, pale conjunctiva',
      durationDays: 14,
      clinicalNotes: 'Second trimester ANC. Hemoglobin measured at 8.2 g/dL. Requires supervised iron sucrose or therapeutic high-dose oral IFA.',
      riskLevel: 'YELLOW',
      triageRationale: 'MODERATE RISK: Moderate nutritional anemia in pregnancy with borderline systolic BP. Schedule PHC Medical Officer teleconsultation.',
      isHighRiskMaternal: true,
      dangerSigns: 'Moderate Anemia (Hb 8.2 g/dL)',
      status: 'UNDER_REVIEW',
    },
  });

  // Encounter 4: Baby Aarav - YELLOW Triage (Acute Diarrhea with Some Dehydration)
  const enc4 = await prisma.encounter.create({
    data: {
      patientId: patient4.id,
      healthWorkerId: ashaWorker.id,
      facilityId: subCentre.id,
      temperatureF: 99.8,
      systolicBP: 85,
      diastolicBP: 55,
      pulseRate: 128,
      respiratoryRate: 34,
      spo2: 97.0,
      weightKg: 8.2,
      chiefComplaints: 'Watery loose stools >6 times/day, vomiting twice, sunken fontanelle',
      durationDays: 2,
      clinicalNotes: 'IMNCI Assessment: Child is irritable, drinks eagerly, skin pinch goes back slowly. Some dehydration (Plan B ORS).',
      riskLevel: 'YELLOW',
      triageRationale: 'MODERATE RISK: Acute diarrheal dehydration in infant <12 months. Requires immediate oral rehydration therapy and Zinc.',
      isHighRiskChild: true,
      dangerSigns: 'Sunken eyes, prolonged skin pinch retraction',
      status: 'TRIAGED',
    },
  });

  // Encounter 5: Jagat Ram - GREEN Triage (Stable Osteoarthritis)
  await prisma.encounter.create({
    data: {
      patientId: patient5.id,
      healthWorkerId: ashaWorker.id,
      facilityId: subCentre.id,
      temperatureF: 98.6,
      systolicBP: 126,
      diastolicBP: 80,
      pulseRate: 72,
      respiratoryRate: 16,
      spo2: 99.0,
      bloodGlucoseMgDl: 118.0,
      weightKg: 68.0,
      heightCm: 165.0,
      chiefComplaints: 'Bilateral knee stiffness worse in mornings, mild lower back pain',
      durationDays: 60,
      clinicalNotes: 'No joint swelling or redness. Normal mobility with support. Vitals within healthy normal limits.',
      riskLevel: 'GREEN',
      triageRationale: 'STABLE / ROUTINE: Chronic age-related joint pain without acute red flags. Prescribed physiotherapy exercises and paracetamol PRN.',
      isHighRiskMaternal: false,
      isHighRiskChild: false,
      status: 'RESOLVED',
    },
  });

  console.log('🚨 Creating Downstream Referrals to District Hospital...');
  // Downstream Referral for Sunita Bai (Sub-Centre -> District Hospital)
  await prisma.referral.create({
    data: {
      referralCode: 'REF-2026-0042',
      patientId: patient1.id,
      encounterId: enc1.id,
      sourceFacilityId: subCentre.id,
      targetFacilityId: districtHospital.id,
      referringWorkerId: ashaWorker.id,
      priority: 'STAT',
      reasonForReferral: 'Impending Eclampsia & Severe Pre-eclampsia at 34 weeks gestation',
      clinicalSummary: 'BP 175/110 mmHg, 3+ proteinuria, severe headache & visual blur. Emergency obstetric care and NICU availability required.',
      preReferralTreatment: 'Loaded with Magnesium Sulfate 4g IV + 10g IM as per FOGSI/MoHFW protocol. 108 Ambulance dispatched.',
      transportStatus: 'AMBULANCE_DISPATCHED',
      status: 'ACCEPTED',
      acceptedAt: new Date(),
      receivingNotes: 'Obstetrics team alerted. Labour room bed #4 reserved with eclampsia crash cart ready.',
    },
  });

  // Downstream Referral for Ramesh Yadav (Under review)
  await prisma.referral.create({
    data: {
      referralCode: 'REF-2026-0043',
      patientId: patient2.id,
      encounterId: enc2.id,
      sourceFacilityId: subCentre.id,
      targetFacilityId: phc.id,
      referringWorkerId: anmWorker.id,
      priority: 'STAT',
      reasonForReferral: 'Acute severe hypoxemic pneumonia requiring high-flow oxygen',
      clinicalSummary: 'SpO2 88% on room air, RR 28/min, coarse crepitations, toxic appearance.',
      preReferralTreatment: 'Started on 4 L/min oxygen via portable cylinder at sub-centre.',
      transportStatus: 'IN_TRANSIT',
      status: 'PENDING',
    },
  });

  console.log('💻 Seeding Teleconsultations (ASHA/ANM to PHC Doctor)...');
  const teleconsult1 = await prisma.teleconsultation.create({
    data: {
      teleconsultId: 'TC-2026-0108',
      patientId: patient3.id,
      encounterId: enc3.id,
      requestingWorkerId: ashaWorker.id,
      doctorId: medicalOfficer.id,
      status: 'REQUESTED',
      roomSessionId: 'ROOM-PHC-RAMGARH-0108',
      chiefComplaint: '24 weeks pregnant mother with fatigue and severe pallor (Hb 8.2 g/dL)',
      doctorDiagnosis: 'Moderate Microcytic Hypochromic Anemia in Pregnancy (ICD-10: O99.0)',
      doctorAdvice: 'Double dose Iron Folic Acid, dietary counseling for green leafy vegetables and jaggery. Follow up in 14 days.',
    },
  });

  console.log('💊 Seeding Digital Prescriptions issued by PHC Doctor...');
  const rx1 = await prisma.prescription.create({
    data: {
      prescriptionCode: 'RX-2026-0812',
      patientId: patient3.id,
      encounterId: enc3.id,
      teleconsultationId: teleconsult1.id,
      doctorId: medicalOfficer.id,
      diagnosis: 'Gestational Anemia (Moderate) & Pre-hypertension monitoring',
      advice: 'Ensure daily intake of iron tablets with lemon water (Vitamin C). Do not take with tea/milk. Report immediately if swelling or headache develops.',
      digitalSignature: 'VERIFIED_DIGITAL_SIG:DR_ARUN_VERMA_MCI_67821_RAMGARH_PHC',
      items: {
        create: [
          {
            medicineName: 'Iron Folic Acid (IFA) Large Tablets',
            dosage: '100mg Elemental Iron + 500mcg Folic Acid',
            frequency: '1-0-1 (Twice daily after meals)',
            durationDays: 60,
            instructions: 'Take after major meals with water. May cause dark stools.',
          },
          {
            medicineName: 'Calcium Carbonate + Vitamin D3 Tablets',
            dosage: '500mg Elemental Calcium',
            frequency: '0-1-0 (Once daily after lunch)',
            durationDays: 60,
            instructions: 'Maintain 2 hour gap between iron and calcium tablets.',
          },
        ],
      },
    },
  });

  console.log('📦 Seeding Essential Medicine Inventory & Stockout Alerts across Facilities...');
  // Bilaspur Sub-Centre Stock Levels
  await prisma.inventory.createMany({
    data: [
      {
        facilityId: subCentre.id,
        medicineName: 'Oxytocin Injection 10 IU/ml',
        category: 'MATERNAL_CHILD',
        batchNumber: 'OXY-2026-B12',
        currentStock: 2, // Alert: Minimum is 15!
        minimumThreshold: 15,
        unit: 'VIALS',
        expiryDate: '2026-11-30',
        isStockout: true,
      },
      {
        facilityId: subCentre.id,
        medicineName: 'Iron Folic Acid (IFA) Tablets',
        category: 'MATERNAL_CHILD',
        batchNumber: 'IFA-2025-08',
        currentStock: 45, // Alert: Minimum is 200
        minimumThreshold: 200,
        unit: 'STRIPS',
        expiryDate: '2027-04-15',
        isStockout: true,
      },
      {
        facilityId: subCentre.id,
        medicineName: 'Oral Rehydration Salts (ORS) Sachets',
        category: 'MATERNAL_CHILD',
        batchNumber: 'ORS-2026-A1',
        currentStock: 250,
        minimumThreshold: 80,
        unit: 'STRIPS',
        expiryDate: '2027-12-31',
        isStockout: false,
      },
      {
        facilityId: subCentre.id,
        medicineName: 'Zinc Sulfate Tablets 20mg',
        category: 'MATERNAL_CHILD',
        batchNumber: 'ZN-2025-04',
        currentStock: 180,
        minimumThreshold: 60,
        unit: 'STRIPS',
        expiryDate: '2027-06-30',
        isStockout: false,
      },
      {
        facilityId: subCentre.id,
        medicineName: 'Paracetamol Tablets 500mg',
        category: 'ANALGESIC',
        batchNumber: 'PCM-2026-11',
        currentStock: 650,
        minimumThreshold: 150,
        unit: 'TABLETS',
        expiryDate: '2028-01-10',
        isStockout: false,
      },
      {
        facilityId: subCentre.id,
        medicineName: 'Magnesium Sulfate 50% Injection (2ml)',
        category: 'EMERGENCY_INJECTABLE',
        batchNumber: 'MGSO4-2025-02',
        currentStock: 3, // Alert: Minimum is 10
        minimumThreshold: 10,
        unit: 'VIALS',
        expiryDate: '2026-09-30',
        isStockout: true,
      },
      // Ramgarh PHC Stock Levels
      {
        facilityId: phc.id,
        medicineName: 'Amoxicillin 500mg Capsules',
        category: 'ANTIBIOTIC',
        batchNumber: 'AMX-2026-K09',
        currentStock: 120, // Alert: Minimum 300
        minimumThreshold: 300,
        unit: 'STRIPS',
        expiryDate: '2027-08-20',
        isStockout: true,
      },
      {
        facilityId: phc.id,
        medicineName: 'Anti-Rabies Vaccine (ARV) 2.5 IU',
        category: 'VACCINE',
        batchNumber: 'ARV-2026-X1',
        currentStock: 1, // Critical Alert: Minimum 25
        minimumThreshold: 25,
        unit: 'VIALS',
        expiryDate: '2026-12-15',
        isStockout: true,
      },
      {
        facilityId: phc.id,
        medicineName: 'Metformin 500mg Tablets (NCD)',
        category: 'NCD_CHRONIC',
        batchNumber: 'MET-2025-99',
        currentStock: 800,
        minimumThreshold: 200,
        unit: 'TABLETS',
        expiryDate: '2028-03-31',
        isStockout: false,
      },
      {
        facilityId: phc.id,
        medicineName: 'Amlodipine 5mg Tablets (NCD)',
        category: 'NCD_CHRONIC',
        batchNumber: 'AML-2026-01',
        currentStock: 650,
        minimumThreshold: 150,
        unit: 'TABLETS',
        expiryDate: '2027-10-15',
        isStockout: false,
      },
      {
        facilityId: phc.id,
        medicineName: 'Oxytocin Injection 10 IU/ml',
        category: 'MATERNAL_CHILD',
        batchNumber: 'OXY-PHC-44',
        currentStock: 48,
        minimumThreshold: 30,
        unit: 'VIALS',
        expiryDate: '2027-05-10',
        isStockout: false,
      },
    ],
  });

  console.log('✅ Rural Public Healthcare database successfully seeded!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
