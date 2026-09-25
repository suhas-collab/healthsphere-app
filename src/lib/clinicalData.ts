import { prisma } from './prisma';

export interface ClinicalFacility {
  id: string;
  code: string;
  name: string;
  type: string;
  block: string;
  district: string;
  state: string;
  catchmentPop: number;
  bedCapacity: number;
  contactPhone?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  _count?: {
    encounters: number;
    referralsOriginating: number;
    inventoryItems: number;
  };
}

export interface ClinicalHealthWorker {
  id: string;
  workerCode: string;
  name: string;
  role: string;
  qualification?: string | null;
  phone?: string | null;
  facilityId: string;
  isActive: boolean;
}

// Initial clinical dataset
const initialFacilities: ClinicalFacility[] = [
  {
    id: 'fac-sc-bilaspur-01',
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
  {
    id: 'fac-phc-ramgarh',
    code: 'PHC-RAMGARH',
    name: 'Ramgarh Primary Health Centre (PHC)',
    type: 'PHC',
    block: 'Bilha',
    district: 'Bilaspur',
    state: 'Chhattisgarh',
    catchmentPop: 28000,
    bedCapacity: 12,
    contactPhone: '+91 7752 289450',
    latitude: 22.145,
    longitude: 82.201,
  },
  {
    id: 'fac-dh-bilaspur',
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
  {
    id: 'fac-dh-raipur',
    code: 'DH-RAIPUR-01',
    name: 'Dr. B.R. Ambedkar Memorial District Hospital',
    type: 'DISTRICT_HOSPITAL',
    block: 'Raipur Urban',
    district: 'Raipur',
    state: 'Chhattisgarh',
    catchmentPop: 650000,
    bedCapacity: 500,
    contactPhone: '+91 771 223400',
    latitude: 21.2514,
    longitude: 81.6296,
  },
  {
    id: 'fac-phc-abhanpur',
    code: 'PHC-ABHANPUR',
    name: 'Abhanpur Community Health Centre',
    type: 'PHC',
    block: 'Abhanpur',
    district: 'Raipur',
    state: 'Chhattisgarh',
    catchmentPop: 42000,
    bedCapacity: 30,
    contactPhone: '+91 771 289123',
    latitude: 21.0543,
    longitude: 81.7612,
  },
  {
    id: 'fac-dh-durg',
    code: 'DH-DURG-01',
    name: 'Durg District Hospital',
    type: 'DISTRICT_HOSPITAL',
    block: 'Durg Sadar',
    district: 'Durg',
    state: 'Chhattisgarh',
    catchmentPop: 520000,
    bedCapacity: 400,
    contactPhone: '+91 788 232145',
    latitude: 21.1904,
    longitude: 81.2849,
  },
  {
    id: 'fac-sc-patan',
    code: 'SC-PATAN-02',
    name: 'Patan Ayushman Arogya Mandir Sub-Centre',
    type: 'SUB_CENTRE',
    block: 'Patan',
    district: 'Durg',
    state: 'Chhattisgarh',
    catchmentPop: 5200,
    bedCapacity: 2,
    contactPhone: '+91 788 276543',
    latitude: 21.0421,
    longitude: 81.5342,
  },
  {
    id: 'fac-dh-bastar',
    code: 'DH-BASTAR-01',
    name: 'Jagdalpur Maharani District Hospital',
    type: 'DISTRICT_HOSPITAL',
    block: 'Jagdalpur',
    district: 'Bastar',
    state: 'Chhattisgarh',
    catchmentPop: 380000,
    bedCapacity: 250,
    contactPhone: '+91 7782 222100',
    latitude: 19.0731,
    longitude: 82.0234,
  },
];

const initialWorkers = [
  {
    id: 'worker-asha-001',
    workerCode: 'HW-ASHA-001',
    name: 'Sunita Devi',
    role: 'ASHA',
    qualification: 'Matriculation + Certified ASHA Frontline Worker',
    phone: '+91 98261 12345',
    facilityId: 'fac-sc-bilaspur-01',
    isActive: true,
  },
  {
    id: 'worker-anm-001',
    workerCode: 'HW-ANM-001',
    name: 'Rekha Sharma',
    role: 'ANM',
    qualification: 'Auxiliary Nurse Midwife (ANM), GNM Registered',
    phone: '+91 98261 54321',
    facilityId: 'fac-sc-bilaspur-01',
    isActive: true,
  },
  {
    id: 'worker-mo-001',
    workerCode: 'HW-MO-001',
    name: 'Dr. Arun Verma',
    role: 'MEDICAL_OFFICER',
    qualification: 'MBBS, MD (Community Medicine)',
    phone: '+91 94252 88990',
    facilityId: 'fac-phc-ramgarh',
    isActive: true,
  },
  {
    id: 'worker-dho-001',
    workerCode: 'HW-DHO-001',
    name: 'Dr. Sneha Patel',
    role: 'DISTRICT_HEALTH_OFFICER',
    qualification: 'MBBS, DPH (Chief Medical & Health Officer)',
    phone: '+91 94250 11223',
    facilityId: 'fac-dh-bilaspur',
    isActive: true,
  },
];

const initialPatients = [
  {
    id: 'pat-1',
    abhaId: '91-5555-6666-7777',
    abhaAddress: 'ramesh.patel@abdm',
    abhaStatus: 'VERIFIED',
    name: 'Ramesh Patel',
    gender: 'male',
    age: 45,
    birthDate: '1981-04-12',
    phone: '+91 98261 77889',
    guardianName: 'Sarita Patel (Wife)',
    village: 'Ramgarh',
    subCentre: 'Bilaspur Health Sub-Centre',
    block: 'Bilha',
    district: 'Bilaspur',
    state: 'Chhattisgarh',
    bloodGroup: 'B+',
    isPregnant: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'pat-001',
    abhaId: '91-4523-8891-2341',
    abhaAddress: 'sunita.bai@abdm',
    abhaStatus: 'VERIFIED',
    name: 'Sunita Bai Sahu',
    gender: 'female',
    age: 28,
    birthDate: '1998-05-14',
    phone: '+91 97555 10101',
    guardianName: 'Ramesh Sahu (Husband)',
    village: 'Bilaspur Gram',
    subCentre: 'Bilaspur Health Sub-Centre',
    block: 'Bilha',
    district: 'Bilaspur',
    state: 'Chhattisgarh',
    bloodGroup: 'B+',
    isPregnant: true,
    gestationalWeeks: 34,
    edd: '2026-10-18',
    gravida: 2,
    parity: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'pat-002',
    abhaId: '91-1092-4432-8765',
    abhaAddress: 'ramesh.yadav@abdm',
    abhaStatus: 'VERIFIED',
    name: 'Ramesh Yadav',
    gender: 'male',
    age: 58,
    birthDate: '1968-11-20',
    phone: '+91 97555 20202',
    guardianName: 'Santosh Yadav (Son)',
    village: 'Khaira',
    subCentre: 'Bilaspur Health Sub-Centre',
    block: 'Bilha',
    district: 'Bilaspur',
    state: 'Chhattisgarh',
    bloodGroup: 'O+',
    isPregnant: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'pat-003',
    abhaId: '91-7782-9901-3321',
    abhaAddress: 'priya.k@abdm',
    abhaStatus: 'VERIFIED',
    name: 'Priya Kumari',
    gender: 'female',
    age: 22,
    birthDate: '2004-02-10',
    phone: '+91 97555 30303',
    guardianName: 'Dinesh Kumar (Husband)',
    village: 'Jamgaon',
    subCentre: 'Bilaspur Health Sub-Centre',
    block: 'Bilha',
    district: 'Bilaspur',
    state: 'Chhattisgarh',
    bloodGroup: 'A+',
    isPregnant: true,
    gestationalWeeks: 24,
    edd: '2026-12-25',
    gravida: 1,
    parity: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'pat-004',
    abhaId: '91-3341-6672-8812',
    abhaAddress: 'aarav.meena@abdm',
    abhaStatus: 'VERIFIED',
    name: 'Aarav Kumar (Infant)',
    gender: 'male',
    age: 1,
    birthDate: '2025-08-15',
    phone: '+91 97555 40404',
    guardianName: 'Meena Bai (Mother)',
    village: 'Bilaspur Gram',
    subCentre: 'Bilaspur Health Sub-Centre',
    block: 'Bilha',
    district: 'Bilaspur',
    state: 'Chhattisgarh',
    bloodGroup: 'O+',
    isPregnant: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'pat-005',
    abhaId: '91-6654-1123-9980',
    abhaAddress: 'jagat.ram@abdm',
    abhaStatus: 'VERIFIED',
    name: 'Jagat Ram Soni',
    gender: 'male',
    age: 64,
    birthDate: '1962-03-22',
    phone: '+91 97555 50505',
    guardianName: 'Vijay Soni (Son)',
    village: 'Jamgaon',
    subCentre: 'Bilaspur Health Sub-Centre',
    block: 'Bilha',
    district: 'Bilaspur',
    state: 'Chhattisgarh',
    bloodGroup: 'AB+',
    isPregnant: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'pat-006',
    abhaId: '91-8843-2291-7712',
    abhaAddress: 'radha.patel@abdm',
    abhaStatus: 'VERIFIED',
    name: 'Radha Patel',
    gender: 'female',
    age: 26,
    birthDate: '2000-04-12',
    phone: '+91 97555 60606',
    guardianName: 'Amit Patel (Husband)',
    village: 'Abhanpur Gram',
    subCentre: 'Abhanpur CHC',
    block: 'Abhanpur',
    district: 'Raipur',
    state: 'Chhattisgarh',
    bloodGroup: 'B+',
    isPregnant: true,
    gestationalWeeks: 32,
    edd: '2026-11-05',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'pat-007',
    abhaId: '91-5521-9984-3310',
    abhaAddress: 'mohan.lal@abdm',
    abhaStatus: 'VERIFIED',
    name: 'Mohan Lal Verma',
    gender: 'male',
    age: 52,
    birthDate: '1974-09-08',
    phone: '+91 97555 70707',
    guardianName: 'Sanjay Verma (Son)',
    village: 'Patan Kalan',
    subCentre: 'Patan SC',
    block: 'Patan',
    district: 'Durg',
    state: 'Chhattisgarh',
    bloodGroup: 'O+',
    isPregnant: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const initialEncounters = [
  {
    id: 'enc-104',
    encounterDate: new Date(Date.now() - 3600000 * 24).toISOString(),
    status: 'DOCTOR_RESPONDED',
    patientId: 'pat-1',
    healthWorkerId: 'worker-asha-001',
    facilityId: 'fac-phc-ramgarh',
    temperatureF: 101.4,
    systolicBP: 136,
    diastolicBP: 86,
    pulseRate: 90,
    respiratoryRate: 18,
    spo2: 97.0,
    chiefComplaints: 'High fever, persistent dry cough, body pain, headache for 4 days',
    durationDays: 4,
    riskLevel: 'YELLOW',
    triageRationale: 'Persistent fever with myalgia. ASHA initiated triage for Medical Officer review.',
    diagnosis: 'Acute Viral Pyrexia with Upper Respiratory Tract Infection',
    treatmentPlan: 'Tab Paracetamol 650mg TDS x 3 days, Tab Cetirizine 10mg OD HS x 5 days, Warm salt water gargles',
    notes: 'Prescribed antipyretics and antihistamines. ASHA Sunita Bai instructed to re-check temperature in 48 hours.',
    followUpRequired: true,
    followUpDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
  },
  {
    id: 'enc-001',
    encounterDate: new Date(Date.now() - 3600000 * 2).toISOString(),
    status: 'REFERRED',
    patientId: 'pat-001',
    healthWorkerId: 'worker-asha-001',
    facilityId: 'fac-sc-bilaspur-01',
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
    isHighRiskChild: false,
    dangerSigns: 'Severe Pre-eclampsia, Visual disturbances, Epigastric tenderness',
  },
  {
    id: 'enc-002',
    encounterDate: new Date(Date.now() - 3600000 * 4).toISOString(),
    status: 'UNDER_REVIEW',
    patientId: 'pat-002',
    healthWorkerId: 'worker-anm-001',
    facilityId: 'fac-sc-bilaspur-01',
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
    isHighRiskMaternal: false,
    isHighRiskChild: false,
    dangerSigns: 'Hypoxia (SpO2 88%), Respiratory Distress',
  },
  {
    id: 'enc-003',
    encounterDate: new Date(Date.now() - 3600000 * 8).toISOString(),
    status: 'UNDER_REVIEW',
    patientId: 'pat-003',
    healthWorkerId: 'worker-asha-001',
    facilityId: 'fac-sc-bilaspur-01',
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
    isHighRiskChild: false,
    dangerSigns: 'Moderate Anemia (Hb 8.2 g/dL)',
  },
  {
    id: 'enc-004',
    encounterDate: new Date(Date.now() - 3600000 * 12).toISOString(),
    status: 'TRIAGED',
    patientId: 'pat-004',
    healthWorkerId: 'worker-asha-001',
    facilityId: 'fac-sc-bilaspur-01',
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
    isHighRiskMaternal: false,
    isHighRiskChild: true,
    dangerSigns: 'Sunken eyes, prolonged skin pinch retraction',
  },
  {
    id: 'enc-005',
    encounterDate: new Date(Date.now() - 3600000 * 24).toISOString(),
    status: 'COMPLETED',
    patientId: 'pat-005',
    healthWorkerId: 'worker-asha-001',
    facilityId: 'fac-sc-bilaspur-01',
    temperatureF: 98.6,
    systolicBP: 126,
    diastolicBP: 80,
    pulseRate: 72,
    respiratoryRate: 16,
    spo2: 98.0,
    bloodGlucoseMgDl: 104.0,
    weightKg: 64.0,
    heightCm: 162.0,
    chiefComplaints: 'Chronic Joint Pain & Swelling in bilateral knees, worsening with cold weather',
    durationDays: 60,
    clinicalNotes: 'Known non-severe osteoarthritis. Vitals normal. Prescribed Paracetamol OTC and physiotherapeutic knee exercises.',
    riskLevel: 'GREEN',
    triageRationale: 'STABLE: Vital parameters within standard physiological range. Chronic non-communicable pain managed with community analgesia.',
    isHighRiskMaternal: false,
    isHighRiskChild: false,
  },
  {
    id: 'enc-006',
    encounterDate: new Date(Date.now() - 3600000 * 6).toISOString(),
    status: 'UNDER_REVIEW',
    patientId: 'pat-006',
    healthWorkerId: 'worker-asha-001',
    facilityId: 'fac-phc-abhanpur',
    temperatureF: 98.8,
    systolicBP: 142,
    diastolicBP: 92,
    pulseRate: 88,
    respiratoryRate: 18,
    spo2: 97.0,
    chiefComplaints: 'Pedal edema, mild headache, 32 weeks ANC',
    durationDays: 3,
    clinicalNotes: 'Gestational hypertension follow-up at Abhanpur PHC.',
    riskLevel: 'YELLOW',
    triageRationale: 'MODERATE RISK: Gestational hypertension requires specialist ANC monitoring.',
    isHighRiskMaternal: true,
    isHighRiskChild: false,
    dangerSigns: 'Gestational Hypertension',
  },
  {
    id: 'enc-007',
    encounterDate: new Date(Date.now() - 3600000 * 18).toISOString(),
    status: 'COMPLETED',
    patientId: 'pat-007',
    healthWorkerId: 'worker-anm-001',
    facilityId: 'fac-sc-patan',
    temperatureF: 98.4,
    systolicBP: 130,
    diastolicBP: 84,
    pulseRate: 74,
    respiratoryRate: 16,
    spo2: 98.0,
    chiefComplaints: 'Mild joint pain, routine checkup',
    durationDays: 10,
    clinicalNotes: 'Routine screening at Patan Sub-Centre.',
    riskLevel: 'GREEN',
    triageRationale: 'STABLE: All vitals normal.',
    isHighRiskMaternal: false,
    isHighRiskChild: false,
  },
];

const initialReferrals = [
  {
    id: 'ref-001',
    referralCode: 'REF-2026-0042',
    patientId: 'pat-001',
    encounterId: 'enc-001',
    sourceFacilityId: 'fac-sc-bilaspur-01',
    targetFacilityId: 'fac-dh-bilaspur',
    referringWorkerId: 'worker-asha-001',
    priority: 'STAT',
    reasonForReferral: 'CRITICAL: Severe Pre-eclampsia with BP 175/110 mmHg and neurologic signs',
    clinicalSummary: 'Vitals: BP 175/110 mmHg, Pulse 104 bpm, SpO2 97%, 34 weeks ANC. Suspected imminent eclampsia.',
    preReferralTreatment: 'Administered loading dose Inj. Magnesium Sulphate (4g IV + 10g IM) and Oral Labetalol 200mg.',
    transportStatus: 'AMBULANCE_DISPATCHED',
    status: 'IN_TRANSIT',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'ref-002',
    referralCode: 'REF-2026-0039',
    patientId: 'pat-002',
    encounterId: 'enc-002',
    sourceFacilityId: 'fac-sc-bilaspur-01',
    targetFacilityId: 'fac-dh-bilaspur',
    referringWorkerId: 'worker-anm-001',
    priority: 'STAT',
    reasonForReferral: 'CRITICAL: Severe Pneumonia with Hypoxia (SpO2 88%) and Tachypnea',
    clinicalSummary: 'Vitals: SpO2 88% on room air, RR 28/min, Pulse 114 bpm, Temp 102.4°F. Coarse crackles in right base.',
    preReferralTreatment: 'Oxygen via nasal cannula at 4 L/min, first dose Ceftriaxone 1g IV administered.',
    transportStatus: 'IN_TRANSIT',
    status: 'IN_TRANSIT',
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
  },
  {
    id: 'ref-003',
    referralCode: 'REF-2026-0031',
    patientId: 'pat-006',
    encounterId: 'enc-006',
    sourceFacilityId: 'fac-phc-abhanpur',
    targetFacilityId: 'fac-dh-raipur',
    referringWorkerId: 'worker-asha-001',
    priority: 'URGENT',
    reasonForReferral: 'Gestational Hypertension evaluation in third trimester',
    clinicalSummary: 'BP 142/92 mmHg at 32 weeks ANC.',
    transportStatus: 'NOT_REQUIRED',
    status: 'ACCEPTED',
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
];

const initialTeleconsultations = [
  {
    id: 'tc-001',
    teleconsultId: 'TC-2026-0108',
    patientId: 'pat-001',
    encounterId: 'enc-001',
    requestingWorkerId: 'worker-asha-001',
    doctorId: 'worker-mo-001',
    status: 'COMPLETED',
    roomSessionId: 'ROOM-BILASPUR-9912',
    chiefComplaint: 'CRITICAL: Severe Pre-eclampsia Triage (BP 175/110)',
    doctorDiagnosis: 'Severe Gestational Hypertensive Emergency / Imminent Eclampsia',
    doctorAdvice: 'Stabilize immediately with MgSO4 injection as per national guideline. Activate 108 ambulance for immediate transfer to Bilaspur District Hospital.',
    scheduledAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    startedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    endedAt: new Date(Date.now() - 3600000 * 1.5).toISOString(),
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'tc-002',
    teleconsultId: 'TC-2026-0109',
    patientId: 'pat-003',
    encounterId: 'enc-003',
    requestingWorkerId: 'worker-asha-001',
    doctorId: 'worker-mo-001',
    status: 'REQUESTED',
    roomSessionId: 'ROOM-BILASPUR-9914',
    chiefComplaint: 'MODERATE: Severe nutritional anemia in pregnancy (Hb 8.2 g/dL)',
    scheduledAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  },
];

const initialPrescriptions = [
  {
    id: 'rx-101',
    prescriptionCode: 'RX-2026-1044',
    patientId: 'pat-1',
    encounterId: 'enc-104',
    teleconsultationId: null as string | null,
    doctorId: 'worker-mo-001',
    diagnosis: 'Acute Viral Pyrexia with Upper Respiratory Symptoms',
    advice: 'Hydrate well, warm saline gargles. ASHA will visit in 48 hours for vitals follow-up.',
    digitalSignature: 'VERIFIED_MD_DR_RAVI_KUMAR_MCI88204_DIGISEAL',
    issuedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    items: [
      {
        id: 'rx-item-101',
        prescriptionId: 'rx-101',
        medicineName: 'Paracetamol 650mg Tablets',
        dosage: '1 tablet',
        frequency: 'Thrice daily (TDS)',
        durationDays: 3,
        instructions: 'Take after meals for fever and body ache',
      },
      {
        id: 'rx-item-102',
        prescriptionId: 'rx-101',
        medicineName: 'Cetirizine 10mg Tablets',
        dosage: '1 tablet',
        frequency: 'Once daily at bedtime (OD HS)',
        durationDays: 5,
        instructions: 'Take with warm water before sleep',
      },
      {
        id: 'rx-item-103',
        prescriptionId: 'rx-101',
        medicineName: 'Amlodipine 5mg Tablets',
        dosage: '1 tablet',
        frequency: 'Once daily morning (OD)',
        durationDays: 30,
        instructions: 'Regular morning dose at 8:00 AM for BP control',
      },
    ],
  },
  {
    id: 'rx-001',
    prescriptionCode: 'RX-2026-0812',
    patientId: 'pat-005',
    encounterId: 'enc-005',
    teleconsultationId: null as string | null,
    doctorId: 'worker-mo-001',
    diagnosis: 'Mild Osteoarthritis of knee joint & symptomatic joint discomfort',
    advice: 'Take medications with food. Avoid heavy lifting. Regular quadriceps strengthening exercises.',
    digitalSignature: 'VERIFIED_MD_DR_ARUN_VERMA_MCI99421_DIGISEAL',
    issuedAt: new Date(Date.now() - 3600000 * 20).toISOString(),
    items: [
      {
        id: 'rx-item-001',
        prescriptionId: 'rx-001',
        medicineName: 'Paracetamol 650mg Tablets',
        dosage: '1 tablet',
        frequency: '1-0-1 (Twice daily after food)',
        durationDays: 5,
        instructions: 'Take after meals for joint pain as needed',
      },
      {
        id: 'rx-item-002',
        prescriptionId: 'rx-001',
        medicineName: 'Calcium Carbonate + Vitamin D3 Tablets',
        dosage: '1 tablet',
        frequency: '0-1-0 (Once daily after lunch)',
        durationDays: 30,
        instructions: 'Take with a glass of water',
      },
    ],
  },
];

const initialInventory = [
  {
    id: 'inv-001',
    facilityId: 'fac-sc-bilaspur-01',
    medicineName: 'Oxytocin 10 IU Injection',
    category: 'MATERNAL_CHILD',
    batchNumber: 'OXY-2026-B1',
    currentStock: 2,
    minimumThreshold: 10,
    unit: 'VIALS',
    expiryDate: '2027-06-30',
    isStockout: true,
  },
  {
    id: 'inv-002',
    facilityId: 'fac-sc-bilaspur-01',
    medicineName: 'Magnesium Sulphate 50% Injection (MgSO4)',
    category: 'EMERGENCY_INJECTABLE',
    batchNumber: 'MGS-2026-A4',
    currentStock: 4,
    minimumThreshold: 12,
    unit: 'VIALS',
    expiryDate: '2027-09-15',
    isStockout: true,
  },
  {
    id: 'inv-003',
    facilityId: 'fac-sc-bilaspur-01',
    medicineName: 'Iron Folic Acid (IFA) Large Tablets',
    category: 'MATERNAL_CHILD',
    batchNumber: 'IFA-2026-C9',
    currentStock: 450,
    minimumThreshold: 200,
    unit: 'TABLETS',
    expiryDate: '2027-12-31',
    isStockout: false,
  },
  {
    id: 'inv-004',
    facilityId: 'fac-sc-bilaspur-01',
    medicineName: 'Oral Rehydration Salts (ORS) Sachets',
    category: 'MATERNAL_CHILD',
    batchNumber: 'ORS-2026-D2',
    currentStock: 60,
    minimumThreshold: 50,
    unit: 'PACKETS',
    expiryDate: '2028-03-31',
    isStockout: false,
  },
  {
    id: 'inv-005',
    facilityId: 'fac-phc-ramgarh',
    medicineName: 'Amoxicillin 500mg Capsules',
    category: 'ANTIBIOTIC',
    batchNumber: 'AMX-2026-E5',
    currentStock: 120,
    minimumThreshold: 100,
    unit: 'STRIPS',
    expiryDate: '2027-08-31',
    isStockout: false,
  },
  {
    id: 'inv-006',
    facilityId: 'fac-phc-ramgarh',
    medicineName: 'Paracetamol 650mg Tablets',
    category: 'ANALGESIC',
    batchNumber: 'PCM-2026-F1',
    currentStock: 300,
    minimumThreshold: 150,
    unit: 'TABLETS',
    expiryDate: '2027-11-30',
    isStockout: false,
  },
  {
    id: 'inv-007',
    facilityId: 'fac-phc-abhanpur',
    medicineName: 'Zinc Sulfate 20mg Dispersible Tablets',
    category: 'MATERNAL_CHILD',
    batchNumber: 'ZNC-2026-G3',
    currentStock: 3,
    minimumThreshold: 20,
    unit: 'STRIPS',
    expiryDate: '2027-10-15',
    isStockout: true,
  },
  {
    id: 'inv-008',
    facilityId: 'fac-dh-bilaspur',
    medicineName: 'Ceftriaxone 1g Injectable Vials',
    category: 'ANTIBIOTIC',
    batchNumber: 'CEF-2026-H7',
    currentStock: 85,
    minimumThreshold: 50,
    unit: 'VIALS',
    expiryDate: '2027-07-20',
    isStockout: false,
  },
];

// Global in-memory clinical fallback store
const fallbackStore = {
  facilities: [...initialFacilities],
  workers: [...initialWorkers],
  patients: [...initialPatients],
  encounters: [...initialEncounters],
  referrals: [...initialReferrals],
  teleconsultations: [...initialTeleconsultations],
  prescriptions: [...initialPrescriptions],
  inventory: [...initialInventory],
};

/**
 * Clinical Data Access Layer
 * Automatically tries Prisma with graceful fallback to in-memory clinical store
 */
export const clinicalData = {
  // Get health workers
  getHealthWorkers(): ClinicalHealthWorker[] {
    return fallbackStore.workers;
  },

  // Get all unique districts
  async getDistricts(): Promise<string[]> {
    try {
      const fromPrisma = await prisma.facility.findMany({
        select: { district: true },
        distinct: ['district'],
      });
      if (fromPrisma && fromPrisma.length > 0) {
        return Array.from(new Set(fromPrisma.map((f) => f.district).filter(Boolean)));
      }
    } catch {
      // Prisma offline, use fallback store
      }
    const districts = Array.from(new Set(fallbackStore.facilities.map((f) => f.district)));
    return districts.sort();
  },

  // Get facilities (optionally filtered by district)
  async getFacilities(district?: string | null): Promise<ClinicalFacility[]> {
    try {
      const where: any = {};
      if (district && district !== 'ALL') {
        where.district = { equals: district, mode: 'insensitive' };
      }
      const facs = await prisma.facility.findMany({
        where,
        include: {
          _count: {
            select: {
              encounters: true,
              referralsOriginating: true,
              inventoryItems: { where: { isStockout: true } },
            },
          },
        },
      });
      if (facs && facs.length >= 0) return facs as any;
    } catch {
      }

    let filtered = [...fallbackStore.facilities];
    if (district && district !== 'ALL') {
      const dLower = district.toLowerCase();
      filtered = filtered.filter((f) => f.district.toLowerCase() === dLower);
    }

    return filtered.map((f) => {
      const encCount = fallbackStore.encounters.filter((e) => e.facilityId === f.id).length;
      const refCount = fallbackStore.referrals.filter((r) => r.sourceFacilityId === f.id).length;
      const invCount = fallbackStore.inventory.filter((i) => i.facilityId === f.id && i.isStockout).length;
      return {
        ...f,
        _count: {
          encounters: encCount,
          referralsOriginating: refCount,
          inventoryItems: invCount,
        },
      };
    });
  },

  // Get DHO Dashboard metrics (supporting district filter)
  async getDashboardData(district?: string | null) {
    const isFiltered = district && district !== 'ALL' && district.trim() !== '';
    const dLower = (district || '').trim().toLowerCase();

    // Available districts list
    const availableDistricts = await this.getDistricts();

    try {
      // Try Prisma
      const facilityWhere: any = isFiltered ? { district: { equals: district, mode: 'insensitive' } } : {};
      const patientWhere: any = isFiltered ? { district: { equals: district, mode: 'insensitive' } } : {};

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
        prisma.patient.count({ where: patientWhere }),
        prisma.encounter.count({
          where: isFiltered ? { facility: { district: { equals: district, mode: 'insensitive' } } } : {},
        }),
        prisma.encounter.count({
          where: {
            riskLevel: 'RED',
            ...(isFiltered ? { facility: { district: { equals: district, mode: 'insensitive' } } } : {}),
          },
        }),
        prisma.encounter.count({
          where: {
            riskLevel: 'YELLOW',
            ...(isFiltered ? { facility: { district: { equals: district, mode: 'insensitive' } } } : {}),
          },
        }),
        prisma.encounter.count({
          where: {
            riskLevel: 'GREEN',
            ...(isFiltered ? { facility: { district: { equals: district, mode: 'insensitive' } } } : {}),
          },
        }),
        prisma.referral.findMany({
          where: isFiltered ? { sourceFacility: { district: { equals: district, mode: 'insensitive' } } } : {},
          include: {
            patient: true,
            sourceFacility: true,
            targetFacility: true,
          },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.inventory.findMany({
          where: {
            isStockout: true,
            ...(isFiltered ? { facility: { district: { equals: district, mode: 'insensitive' } } } : {}),
          },
          include: { facility: true },
        }),
        prisma.patient.findMany({
          where: {
            isPregnant: true,
            ...patientWhere,
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
            ...patientWhere,
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
          where: facilityWhere,
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

      return {
        selectedDistrict: isFiltered ? district : 'ALL',
        districts: availableDistricts,
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
      };
    } catch {
      // Graceful fallback to memory store
    }

    // Filter fallback store
    const facs = await this.getFacilities(isFiltered ? district : null);
    const facIds = new Set(facs.map((f) => f.id));

    let patients = [...fallbackStore.patients];
    if (isFiltered) {
      patients = patients.filter((p) => p.district.toLowerCase() === dLower);
    }
    const patientIds = new Set(patients.map((p) => p.id));

    let encounters = [...fallbackStore.encounters];
    if (isFiltered) {
      encounters = encounters.filter((e) => facIds.has(e.facilityId));
    }

    const redCount = encounters.filter((e) => e.riskLevel === 'RED').length;
    const yellowCount = encounters.filter((e) => e.riskLevel === 'YELLOW').length;
    const greenCount = encounters.filter((e) => e.riskLevel === 'GREEN').length;
    const totalEncounters = encounters.length;

    let referrals = fallbackStore.referrals
      .filter((r) => !isFiltered || facIds.has(r.sourceFacilityId))
      .map((r) => ({
        ...r,
        patient: fallbackStore.patients.find((p) => p.id === r.patientId) || { name: 'Unknown', abhaId: 'N/A' },
        sourceFacility: fallbackStore.facilities.find((f) => f.id === r.sourceFacilityId) || { name: 'Health Centre' },
        targetFacility: fallbackStore.facilities.find((f) => f.id === r.targetFacilityId) || { name: 'District Hospital' },
      }));

    const activeReferrals = referrals.filter(
      (r) => r.status === 'PENDING' || r.status === 'ACCEPTED' || r.status === 'IN_TRANSIT'
    );

    let stockouts = fallbackStore.inventory
      .filter((i) => i.isStockout && (!isFiltered || facIds.has(i.facilityId)))
      .map((i) => ({
        ...i,
        facility: fallbackStore.facilities.find((f) => f.id === i.facilityId) || { name: 'Health Facility' },
      }));

    let maternalFollowups = patients
      .filter((p) => p.isPregnant)
      .map((p) => ({
        ...p,
        encounters: encounters.filter((e) => e.patientId === p.id),
      }))
      .filter((p) => p.encounters.some((e) => e.riskLevel === 'RED' || e.isHighRiskMaternal));

    let childFollowups = patients
      .filter((p) => p.age <= 5)
      .map((p) => ({
        ...p,
        encounters: encounters.filter((e) => e.patientId === p.id),
      }))
      .filter((p) => p.encounters.some((e) => e.riskLevel === 'RED' || e.isHighRiskChild));

    return {
      selectedDistrict: isFiltered ? district : 'ALL',
      districts: availableDistricts,
      metrics: {
        totalPatients: patients.length,
        totalEncounters,
        redEncounters: redCount,
        yellowEncounters: yellowCount,
        greenEncounters: greenCount,
        redPercentage: totalEncounters > 0 ? Math.round((redCount / totalEncounters) * 100) : 0,
        activeReferralsCount: activeReferrals.length,
        totalReferralsCount: referrals.length,
        stockoutAlertsCount: stockouts.length,
        highRiskMaternalCount: maternalFollowups.length,
        highRiskChildCount: childFollowups.length,
      },
      activeReferrals,
      stockoutItems: stockouts,
      maternalFollowups,
      childFollowups,
      facilities: facs,
    };
  },

  // Get encounters
  async getEncounters(filter?: { riskLevel?: string | null; facilityId?: string | null; patientId?: string | null }) {
    try {
      const where: any = {};
      if (filter?.riskLevel && filter.riskLevel !== 'ALL') {
        where.riskLevel = filter.riskLevel;
      }
      if (filter?.facilityId) {
        where.facilityId = filter.facilityId;
      }
      if (filter?.patientId) {
        where.patientId = filter.patientId;
      }

      const encounters = await prisma.encounter.findMany({
        where,
        include: {
          patient: true,
          healthWorker: true,
          facility: true,
          teleconsultation: true,
          referral: { include: { targetFacility: true } },
          prescriptions: { include: { items: true } },
        },
        orderBy: [{ encounterDate: 'desc' }],
      });

      const priorityOrder: Record<string, number> = { RED: 0, YELLOW: 1, GREEN: 2 };
      return [...encounters].sort((a, b) => {
        const pA = priorityOrder[a.riskLevel] ?? 3;
        const pB = priorityOrder[b.riskLevel] ?? 3;
        if (pA !== pB) return pA - pB;
        return new Date(b.encounterDate).getTime() - new Date(a.encounterDate).getTime();
      });
    } catch {
      // Fallback
    }

    let encs = [...fallbackStore.encounters];
    if (filter?.riskLevel && filter.riskLevel !== 'ALL') {
      encs = encs.filter((e) => e.riskLevel === filter.riskLevel);
    }
    if (filter?.facilityId) {
      encs = encs.filter((e) => e.facilityId === filter.facilityId);
    }
    if (filter?.patientId) {
      encs = encs.filter((e) => e.patientId === filter.patientId);
    }

    const priorityOrder: Record<string, number> = { RED: 0, YELLOW: 1, GREEN: 2 };
    return encs
      .map((e) => ({
        ...e,
        patient: fallbackStore.patients.find((p) => p.id === e.patientId) || { name: 'Unknown', abhaId: 'N/A' },
        healthWorker: fallbackStore.workers.find((w) => w.id === e.healthWorkerId) || { name: 'Health Worker', role: 'ASHA' },
        facility: fallbackStore.facilities.find((f) => f.id === e.facilityId) || { name: 'Sub-Centre', type: 'SUB_CENTRE' },
        referral: fallbackStore.referrals.find((r) => r.encounterId === e.id) || null,
        teleconsultation: fallbackStore.teleconsultations.find((t) => t.encounterId === e.id) || null,
        prescriptions: fallbackStore.prescriptions.filter((p) => p.encounterId === e.id),
      }))
      .sort((a, b) => {
        const pA = priorityOrder[a.riskLevel] ?? 3;
        const pB = priorityOrder[b.riskLevel] ?? 3;
        if (pA !== pB) return pA - pB;
        return new Date(b.encounterDate).getTime() - new Date(a.encounterDate).getTime();
      });
  },

  // Create encounter
  async createEncounter(data: any) {
    try {
      if (data.id) {
        const existing = await prisma.encounter.findUnique({
          where: { id: data.id },
          include: { patient: true, facility: true },
        });
        if (existing) return existing;
      }
      const encounter = await prisma.encounter.create({
        data: {
          ...(data.id ? { id: data.id } : {}),
          encounterDate: data.encounterDate ? new Date(data.encounterDate) : undefined,
          patientId: data.patientId,
          healthWorkerId: data.healthWorkerId,
          facilityId: data.facilityId,
          temperatureF: data.temperatureF ? parseFloat(data.temperatureF) : null,
          systolicBP: data.systolicBP ? parseInt(data.systolicBP) : null,
          diastolicBP: data.diastolicBP ? parseInt(data.diastolicBP) : null,
          pulseRate: data.pulseRate ? parseInt(data.pulseRate) : null,
          respiratoryRate: data.respiratoryRate ? parseInt(data.respiratoryRate) : null,
          spo2: data.spo2 ? parseFloat(data.spo2) : null,
          bloodGlucoseMgDl: data.bloodGlucoseMgDl ? parseFloat(data.bloodGlucoseMgDl) : null,
          weightKg: data.weightKg ? parseFloat(data.weightKg) : null,
          heightCm: data.heightCm ? parseFloat(data.heightCm) : null,
          chiefComplaints: Array.isArray(data.chiefComplaints) ? data.chiefComplaints.join(', ') : data.chiefComplaints || '',
          durationDays: data.durationDays ? parseInt(data.durationDays) : null,
          clinicalNotes: data.clinicalNotes || '',
          riskLevel: data.riskLevel || 'GREEN',
          triageRationale: data.triageRationale || 'Point-of-care clinical assessment',
          isHighRiskMaternal: Boolean(data.isHighRiskMaternal),
          isHighRiskChild: Boolean(data.isHighRiskChild),
          dangerSigns: data.dangerSigns || null,
          status: data.status || 'WAITING_FOR_DOCTOR',
        },
        include: { patient: true, facility: true },
      });
      return encounter;
    } catch {
      // Memory store save
    }

    const existingIdx = fallbackStore.encounters.findIndex((e) => data.id && e.id === data.id);
    if (existingIdx !== -1) {
      return fallbackStore.encounters[existingIdx];
    }

    const newEnc: any = {
      id: data.id || `enc-${Date.now()}`,
      encounterDate: data.encounterDate || new Date().toISOString(),
      ...data,
      status: data.status || 'WAITING_FOR_DOCTOR',
      patient: fallbackStore.patients.find((p) => p.id === data.patientId) || { name: 'Rural Citizen', abhaId: 'N/A' },
      healthWorker: fallbackStore.workers.find((w) => w.id === data.healthWorkerId) || { name: 'Sunita Devi (ASHA)', role: 'ASHA' },
      facility: fallbackStore.facilities.find((f) => f.id === data.facilityId) || { name: 'Bilaspur Health Sub-Centre', type: 'SUB_CENTRE' },
    };
    fallbackStore.encounters.unshift(newEnc);
    return newEnc;
  },

  // Update encounter / case status and doctor notes
  async updateEncounter(id: string, updates: any) {
    try {
      const updated = await prisma.encounter.update({
        where: { id },
        data: {
          status: updates.status || undefined,
          clinicalNotes: updates.clinicalNotes || undefined,
        },
        include: { patient: true, facility: true, healthWorker: true },
      });
      if (updated) return updated;
    } catch {
      // Memory fallback
    }

    const idx = fallbackStore.encounters.findIndex((e) => e.id === id);
    if (idx !== -1) {
      fallbackStore.encounters[idx] = {
        ...fallbackStore.encounters[idx],
        ...updates,
      };
      return fallbackStore.encounters[idx];
    }
    return null;
  },

  // Get patients
  async getPatients(q?: string | null) {
    try {
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
          include: { encounters: { orderBy: { encounterDate: 'desc' }, take: 3 } },
        });
      } else {
        patients = await prisma.patient.findMany({
          orderBy: { createdAt: 'desc' },
          include: { encounters: { orderBy: { encounterDate: 'desc' }, take: 2 } },
        });
      }
      if (patients) return patients;
    } catch {
      // Fallback
    }

    let pats = [...fallbackStore.patients];
    if (q) {
      const qLower = q.toLowerCase();
      pats = pats.filter(
        (p) =>
          p.name.toLowerCase().includes(qLower) ||
          p.abhaId.toLowerCase().includes(qLower) ||
          p.phone.includes(q) ||
          p.village.toLowerCase().includes(qLower)
      );
    }
    return pats.map((p) => ({
      ...p,
      encounters: fallbackStore.encounters.filter((e) => e.patientId === p.id).slice(0, 3),
    }));
  },

  // Create patient
  async createPatient(body: any) {
    const abhaId = body.abhaId || `91-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`;
    const abhaAddress = body.abhaAddress || `${(body.name || 'citizen').toLowerCase().replace(/\s+/g, '')}@abdm`;
    const patientId = body.id || `pat-${Date.now()}`;

    try {
      if (body.id) {
        const existing = await prisma.patient.findUnique({
          where: { id: body.id },
          include: { encounters: { orderBy: { encounterDate: 'desc' }, take: 2 } },
        });
        if (existing) return existing;
      }
      if (body.abhaId) {
        const existingAbha = await prisma.patient.findUnique({
          where: { abhaId: body.abhaId },
          include: { encounters: { orderBy: { encounterDate: 'desc' }, take: 2 } },
        });
        if (existingAbha) return existingAbha;
      }

      const patient = await prisma.patient.create({
        data: {
          ...(body.id ? { id: body.id } : {}),
          abhaId,
          abhaAddress,
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
          state: body.state || 'Chhattisgarh',
          bloodGroup: body.bloodGroup || null,
          isPregnant: Boolean(body.isPregnant),
          gestationalWeeks: body.gestationalWeeks ? parseInt(body.gestationalWeeks) : null,
          edd: body.edd || null,
        },
        include: { encounters: { orderBy: { encounterDate: 'desc' }, take: 2 } },
      });
      return patient;
    } catch {
      // Fallback
    }

    const existingIdx = fallbackStore.patients.findIndex(
      (p) => (body.id && p.id === body.id) || (body.abhaId && p.abhaId === body.abhaId)
    );
    if (existingIdx !== -1) {
      fallbackStore.patients[existingIdx] = {
        ...fallbackStore.patients[existingIdx],
        ...body,
        id: fallbackStore.patients[existingIdx].id,
        updatedAt: new Date().toISOString(),
      };
      return fallbackStore.patients[existingIdx];
    }

    const newPat: any = {
      id: patientId,
      abhaId,
      abhaAddress,
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
      state: body.state || 'Chhattisgarh',
      bloodGroup: body.bloodGroup || 'B+',
      isPregnant: Boolean(body.isPregnant),
      gestationalWeeks: body.gestationalWeeks ? parseInt(body.gestationalWeeks) : null,
      edd: body.edd || null,
      createdAt: body.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      encounters: [],
    };
    fallbackStore.patients.unshift(newPat);
    return newPat;
  },

  // Get referrals
  async getReferrals(status?: string | null) {
    try {
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
      if (referrals) return referrals;
    } catch {
      }

    let refs = [...fallbackStore.referrals];
    if (status && status !== 'ALL') refs = refs.filter((r) => r.status === status);
    return refs.map((r) => ({
      ...r,
      patient: fallbackStore.patients.find((p) => p.id === r.patientId) || { name: 'Unknown', abhaId: 'N/A' },
      sourceFacility: fallbackStore.facilities.find((f) => f.id === r.sourceFacilityId) || { name: 'Sub-Centre' },
      targetFacility: fallbackStore.facilities.find((f) => f.id === r.targetFacilityId) || { name: 'District Hospital' },
      referringWorker: fallbackStore.workers.find((w) => w.id === r.referringWorkerId) || { name: 'ASHA Worker', role: 'ASHA' },
      encounter: fallbackStore.encounters.find((e) => e.id === r.encounterId) || null,
    }));
  },

  // Create referral
  async createReferral(body: any) {
    const referralCode = `REF-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    try {
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
        include: { patient: true, sourceFacility: true, targetFacility: true },
      });
      return referral;
    } catch {
      // Fallback
    }

    const newRef: any = {
      id: `ref-${Date.now()}`,
      referralCode,
      ...body,
      createdAt: new Date().toISOString(),
      patient: fallbackStore.patients.find((p) => p.id === body.patientId) || { name: 'Rural Citizen', abhaId: 'N/A' },
      sourceFacility: fallbackStore.facilities.find((f) => f.id === body.sourceFacilityId) || { name: 'Sub-Centre' },
      targetFacility: fallbackStore.facilities.find((f) => f.id === body.targetFacilityId) || { name: 'District Hospital' },
    };
    fallbackStore.referrals.unshift(newRef);
    return newRef;
  },

  // Update referral
  async updateReferral(id: string, updates: any) {
    try {
      const updateData: any = {};
      if (updates.status) {
        updateData.status = updates.status;
        if (updates.status === 'ACCEPTED') updateData.acceptedAt = new Date();
        if (updates.status === 'COMPLETED') updateData.completedAt = new Date();
      }
      if (updates.transportStatus) updateData.transportStatus = updates.transportStatus;
      if (updates.receivingNotes) updateData.receivingNotes = updates.receivingNotes;

      const updated = await prisma.referral.update({
        where: { id },
        data: updateData,
        include: { patient: true, sourceFacility: true, targetFacility: true },
      });
      return updated;
    } catch {
      // Fallback
    }

    const idx = fallbackStore.referrals.findIndex((r) => r.id === id);
    if (idx !== -1) {
      fallbackStore.referrals[idx] = { ...fallbackStore.referrals[idx], ...updates };
      return {
        ...fallbackStore.referrals[idx],
        patient: fallbackStore.patients.find((p) => p.id === fallbackStore.referrals[idx].patientId),
        sourceFacility: fallbackStore.facilities.find((f) => f.id === fallbackStore.referrals[idx].sourceFacilityId),
        targetFacility: fallbackStore.facilities.find((f) => f.id === fallbackStore.referrals[idx].targetFacilityId),
      };
    }
    return null;
  },

  // Get inventory
  async getInventory(filter?: { facilityId?: string | null; stockoutOnly?: boolean }) {
    try {
      const where: any = {};
      if (filter?.facilityId) where.facilityId = filter.facilityId;
      if (filter?.stockoutOnly) where.isStockout = true;

      const inventory = await prisma.inventory.findMany({
        where,
        include: { facility: true },
        orderBy: [{ isStockout: 'desc' }, { currentStock: 'asc' }],
      });
      if (inventory) return inventory;
    } catch {
      }

    let items = [...fallbackStore.inventory];
    if (filter?.facilityId) items = items.filter((i) => i.facilityId === filter.facilityId);
    if (filter?.stockoutOnly) items = items.filter((i) => i.isStockout);

    return items
      .map((i) => ({
        ...i,
        facility: fallbackStore.facilities.find((f) => f.id === i.facilityId) || { name: 'Health Facility' },
      }))
      .sort((a, b) => (b.isStockout ? 1 : 0) - (a.isStockout ? 1 : 0) || a.currentStock - b.currentStock);
  },

  // Replenish inventory
  async replenishInventory(id: string, qty: number) {
    try {
      const item = await prisma.inventory.findUnique({ where: { id } });
      if (item) {
        const newStock = item.currentStock + qty;
        return await prisma.inventory.update({
          where: { id },
          data: {
            currentStock: newStock,
            isStockout: newStock <= item.minimumThreshold,
          },
          include: { facility: true },
        });
      }
    } catch {
      // Fallback
    }

    const item = fallbackStore.inventory.find((i) => i.id === id);
    if (item) {
      item.currentStock += qty;
      item.isStockout = item.currentStock <= item.minimumThreshold;
      return {
        ...item,
        facility: fallbackStore.facilities.find((f) => f.id === item.facilityId) || { name: 'Health Facility' },
      };
    }
    return null;
  },

  // Get teleconsultations
  async getTeleconsultations() {
    try {
      const teleconsults = await prisma.teleconsultation.findMany({
        include: {
          patient: true,
          encounter: true,
          requestingWorker: { include: { facility: true } },
          doctor: true,
          prescriptions: { include: { items: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
      if (teleconsults) return teleconsults;
    } catch {
      // Fallback
    }

    return fallbackStore.teleconsultations.map((tc) => ({
      ...tc,
      patient: fallbackStore.patients.find((p) => p.id === tc.patientId) || { name: 'Citizen', abhaId: 'N/A' },
      encounter: fallbackStore.encounters.find((e) => e.id === tc.encounterId) || null,
      requestingWorker: fallbackStore.workers.find((w) => w.id === tc.requestingWorkerId) || { name: 'ASHA', facility: { name: 'Sub-Centre' } },
      doctor: fallbackStore.workers.find((w) => w.id === tc.doctorId) || null,
      prescriptions: fallbackStore.prescriptions.filter((p) => p.teleconsultationId === tc.id),
    }));
  },

  // Update or create teleconsultation
  async updateOrCreateTeleconsult(body: any) {
    const { action, id, status, doctorDiagnosis, doctorAdvice, doctorId } = body;
    try {
      if (action === 'UPDATE_STATUS' && id) {
        return await prisma.teleconsultation.update({
          where: { id },
          data: {
            status: status || undefined,
            doctorDiagnosis: doctorDiagnosis || undefined,
            doctorAdvice: doctorAdvice || undefined,
            doctorId: doctorId || undefined,
            startedAt: status === 'IN_PROGRESS' ? new Date() : undefined,
            endedAt: status === 'COMPLETED' ? new Date() : undefined,
          },
          include: { patient: true, encounter: true, requestingWorker: true, doctor: true },
        });
      }

      return await prisma.teleconsultation.create({
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
        include: { patient: true, encounter: true },
      });
    } catch {
      // Fallback
    }

    if (action === 'UPDATE_STATUS' && id) {
      const idx = fallbackStore.teleconsultations.findIndex((tc) => tc.id === id);
      if (idx !== -1) {
        fallbackStore.teleconsultations[idx] = {
          ...fallbackStore.teleconsultations[idx],
          status: status || fallbackStore.teleconsultations[idx].status,
          doctorDiagnosis: doctorDiagnosis || fallbackStore.teleconsultations[idx].doctorDiagnosis,
          doctorAdvice: doctorAdvice || fallbackStore.teleconsultations[idx].doctorAdvice,
          doctorId: doctorId || fallbackStore.teleconsultations[idx].doctorId,
        };
        return fallbackStore.teleconsultations[idx];
      }
    }

    const newTc: any = {
      id: `tc-${Date.now()}`,
      teleconsultId: `TC-${Date.now().toString().slice(-6)}`,
      status: body.status || 'REQUESTED',
      roomSessionId: `ROOM-${Date.now().toString().slice(-6)}`,
      chiefComplaint: body.chiefComplaint,
      patientId: body.patientId,
      encounterId: body.encounterId || null,
      requestingWorkerId: body.requestingWorkerId,
      doctorId: body.doctorId || null,
      createdAt: new Date().toISOString(),
      patient: fallbackStore.patients.find((p) => p.id === body.patientId) || { name: 'Citizen', abhaId: 'N/A' },
      encounter: fallbackStore.encounters.find((e) => e.id === body.encounterId) || null,
    };
    fallbackStore.teleconsultations.unshift(newTc);
    return newTc;
  },

  // Get prescriptions
  async getPrescriptions(patientId?: string | null) {
    try {
      const where: any = {};
      if (patientId) where.patientId = patientId;
      const prescriptions = await prisma.prescription.findMany({
        where,
        include: { patient: true, doctor: true, items: true, teleconsultation: true },
        orderBy: { issuedAt: 'desc' },
      });
      if (prescriptions) return prescriptions;
    } catch {
      // Fallback
    }

    let rxs = [...fallbackStore.prescriptions];
    if (patientId) rxs = rxs.filter((r) => r.patientId === patientId);
    return rxs.map((r) => ({
      ...r,
      patient: fallbackStore.patients.find((p) => p.id === r.patientId) || { name: 'Citizen', abhaId: 'N/A' },
      doctor: fallbackStore.workers.find((w) => w.id === r.doctorId) || { name: 'Medical Officer', role: 'MEDICAL_OFFICER' },
      items: r.items || [],
    }));
  },

  // Create prescription
  async createPrescription(body: any) {
    const prescriptionCode = `RX-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const digitalSignature = `VERIFIED_MD_${body.doctorId || 'PHC_MO'}_${Date.now().toString(36).toUpperCase()}_DIGISEAL`;

    try {
      const prescription = await prisma.prescription.create({
        data: {
          prescriptionCode,
          patientId: body.patientId,
          doctorId: body.doctorId,
          encounterId: body.encounterId || null,
          teleconsultationId: body.teleconsultationId || null,
          diagnosis: body.diagnosis || 'Clinical Observation',
          advice: body.advice || 'Follow instructions on dosage and return if symptoms persist.',
          digitalSignature,
          items: {
            create: (body.items || []).map((item: any) => ({
              medicineName: item.medicineName,
              dosage: item.dosage || '1 tablet',
              frequency: item.frequency || '1-0-1',
              durationDays: parseInt(item.durationDays) || 5,
              instructions: item.instructions || '',
            })),
          },
        },
        include: { patient: true, doctor: true, items: true },
      });
      return prescription;
    } catch {
      // Fallback
    }

    const newRx: any = {
      id: `rx-${Date.now()}`,
      prescriptionCode,
      patientId: body.patientId,
      doctorId: body.doctorId,
      encounterId: body.encounterId || null,
      teleconsultationId: body.teleconsultationId || null,
      diagnosis: body.diagnosis || 'Clinical Observation',
      advice: body.advice || 'Follow dosage and follow up as advised.',
      digitalSignature,
      issuedAt: new Date().toISOString(),
      items: (body.items || []).map((it: any, i: number) => ({
        id: `rx-item-${Date.now()}-${i}`,
        ...it,
      })),
      patient: fallbackStore.patients.find((p) => p.id === body.patientId) || { name: 'Citizen', abhaId: 'N/A' },
      doctor: fallbackStore.workers.find((w) => w.id === body.doctorId) || { name: 'Medical Officer', role: 'MEDICAL_OFFICER' },
    };
    fallbackStore.prescriptions.unshift(newRx);
    return newRx;
  },

  // Batch sync from offline queue
  async batchSync(items: any[]) {
    const syncedIds: number[] = [];

    for (const item of items) {
      try {
        if (item.actionType === 'REGISTER_PATIENT') {
          await this.createPatient(item.payload);
          syncedIds.push(item.id);
        } else if (item.actionType === 'TRIAGE_ENCOUNTER') {
          const e = item.payload;
          await this.createEncounter({
            id: e.id,
            encounterDate: e.encounterDate,
            patientId: e.patientId,
            healthWorkerId: e.healthWorkerId || 'worker-asha-001',
            facilityId: e.facilityId || 'fac-sc-bilaspur-01',
            temperatureF: e.temperatureF,
            systolicBP: e.systolicBP,
            diastolicBP: e.diastolicBP,
            pulseRate: e.pulseRate,
            respiratoryRate: e.respiratoryRate,
            spo2: e.spo2,
            bloodGlucoseMgDl: e.bloodGlucoseMgDl,
            weightKg: e.weightKg,
            heightCm: e.heightCm,
            chiefComplaints: e.chiefComplaints,
            durationDays: e.durationDays,
            clinicalNotes: e.clinicalNotes,
            riskLevel: e.riskLevel,
            triageRationale: e.triageRationale,
            isHighRiskMaternal: e.isHighRiskMaternal,
            isHighRiskChild: e.isHighRiskChild,
            dangerSigns: e.dangerSigns,
            status: e.status || 'WAITING_FOR_DOCTOR',
          });

          if (e.requestTeleconsult || e.riskLevel === 'RED') {
            await this.updateOrCreateTeleconsult({
              patientId: e.patientId,
              encounterId: e.id,
              requestingWorkerId: 'worker-asha-001',
              chiefComplaint: `${e.riskLevel} Triage: ${Array.isArray(e.chiefComplaints) ? e.chiefComplaints.join(', ') : e.chiefComplaints}`,
            });
          }

          if (e.createReferral || e.riskLevel === 'RED') {
            await this.createReferral({
              patientId: e.patientId,
              encounterId: e.id,
              sourceFacilityId: 'fac-sc-bilaspur-01',
              targetFacilityId: 'fac-dh-bilaspur',
              referringWorkerId: 'worker-asha-001',
              priority: e.riskLevel === 'RED' ? 'STAT' : 'URGENT',
              reasonForReferral: `${e.riskLevel} Flag: ${e.triageRationale || 'Emergency care required'}`,
              transportStatus: e.riskLevel === 'RED' ? 'AMBULANCE_DISPATCHED' : 'NOT_REQUIRED',
            });
          }

          syncedIds.push(item.id);
        }
      } catch (e) {
        console.error('Sync item failed:', item, e);
      }
    }

    return syncedIds;
  },
};
