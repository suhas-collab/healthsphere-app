// Realistic Seeded Demo Dataset for Arogya Mitra Evaluation

export interface DemoPatient {
  id: string;
  name: string;
  age: number;
  gender: 'female' | 'male' | 'other';
  phone: string;
  village: string;
  block: string;
  district: string;
  state: string;
  bloodGroup: string;
  abhaId: string;
  isPregnant?: boolean;
  gestationalWeeks?: number;
  chronicConditions?: string[];
  allergies?: string[];
}

export interface DemoEncounter {
  id: string;
  encounterDate: string;
  patientId: string;
  patientName: string;
  patientAge: number;
  patientGender: string;
  patientVillage: string;
  facilityId: string;
  facilityName: string;
  healthWorkerId: string;
  healthWorkerName: string;
  chiefComplaints: string;
  durationDays?: number;
  riskLevel: 'RED' | 'YELLOW' | 'GREEN';
  systolicBP?: number;
  diastolicBP?: number;
  temperatureF?: number;
  pulseRate?: number;
  spo2?: number;
  bloodGlucoseMgDl?: number;
  triageRationale?: string;
  clinicalNotes?: string;
  diagnosis?: string;
  treatmentPlan?: string;
  notes?: string;
  status: 'WAITING_FOR_DOCTOR' | 'UNDER_REVIEW' | 'DOCTOR_RESPONDED' | 'COMPLETED' | 'REFERRED';
  followUpRequired?: boolean;
  followUpDate?: string;
  dangerSigns?: string;
  isHighRiskMaternal?: boolean;
  isHighRiskChild?: boolean;
  source?: string;
}

export interface DemoAppointment {
  id: string;
  patientId: string;
  doctorName: string;
  department: string;
  facilityName: string;
  scheduledTime: string;
  status: 'CONFIRMED' | 'SCHEDULED' | 'COMPLETED';
  type: 'In-Person' | 'Teleconsultation' | 'Voice-Assisted';
  notes?: string;
}

export interface DemoPrescription {
  id: string;
  patientId: string;
  doctorName: string;
  encounterId: string;
  date: string;
  medicines: Array<{
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions: string;
  }>;
  status: 'ACTIVE' | 'COMPLETED';
}

// -----------------------------------------------------------------------------
// 1. REALISTIC DEMO PATIENTS
// -----------------------------------------------------------------------------
export const DEMO_PATIENTS: DemoPatient[] = [
  {
    id: 'pat-1',
    name: 'Ramesh Patel',
    age: 45,
    gender: 'male',
    phone: '+91 98261 77889',
    village: 'Ramgarh',
    block: 'Bilha',
    district: 'Bilaspur',
    state: 'Chhattisgarh',
    bloodGroup: 'B+',
    abhaId: '91-5555-6666-7777',
    isPregnant: false,
    chronicConditions: ['Hypertension (Stage 1)', 'Mild Asthma'],
    allergies: ['Penicillin (Mild rash)'],
  },
  {
    id: 'pat-001',
    name: 'Sunita Sharma',
    age: 28,
    gender: 'female',
    phone: '+91 97555 10101',
    village: 'Bilaspur Gram',
    block: 'Bilha',
    district: 'Bilaspur',
    state: 'Chhattisgarh',
    bloodGroup: 'B+',
    abhaId: '91-8843-2210-9988',
    isPregnant: true,
    gestationalWeeks: 34,
    chronicConditions: ['Gestational Hypertension'],
    allergies: [],
  },
  {
    id: 'pat-003',
    name: 'Priya Kumari',
    age: 22,
    gender: 'female',
    phone: '+91 97555 30303',
    village: 'Jamgaon',
    block: 'Bilha',
    district: 'Bilaspur',
    state: 'Chhattisgarh',
    bloodGroup: 'A+',
    abhaId: '91-7782-9901-3321',
    isPregnant: true,
    gestationalWeeks: 24,
    chronicConditions: ['Nutritional Anemia'],
    allergies: [],
  },
  {
    id: 'pat-005',
    name: 'Jagat Ram Soni',
    age: 64,
    gender: 'male',
    phone: '+91 97555 50505',
    village: 'Songaon',
    block: 'Bilha',
    district: 'Bilaspur',
    state: 'Chhattisgarh',
    bloodGroup: 'AB+',
    abhaId: '91-6654-1123-9980',
    isPregnant: false,
    chronicConditions: ['COPD / Chronic Bronchitis', 'Osteoarthritis'],
    allergies: ['Sulfa drugs'],
  },
  {
    id: 'pat-004',
    name: 'Aarav Kumar (Infant)',
    age: 1,
    gender: 'male',
    phone: '+91 97555 40404',
    village: 'Bilaspur Gram',
    block: 'Bilha',
    district: 'Bilaspur',
    state: 'Chhattisgarh',
    bloodGroup: 'O+',
    abhaId: '91-3341-6672-8812',
    isPregnant: false,
    chronicConditions: [],
    allergies: [],
  },
  {
    id: 'pat-007',
    name: 'Mohan Lal Verma',
    age: 52,
    gender: 'male',
    phone: '+91 97555 70707',
    village: 'Patan Kalan',
    block: 'Patan',
    district: 'Durg',
    state: 'Chhattisgarh',
    bloodGroup: 'O+',
    abhaId: '91-5521-9984-3310',
    isPregnant: false,
    chronicConditions: ['Type 2 Diabetes (Diet controlled)'],
    allergies: [],
  },
];

// -----------------------------------------------------------------------------
// 2. REALISTIC DEMO ENCOUNTERS (Full Workflow Lifecycle)
// -----------------------------------------------------------------------------
export const DEMO_ENCOUNTERS: DemoEncounter[] = [
  // 1. EMERGENCY / CRITICAL - WAITING FOR DOCTOR (RED)
  {
    id: 'enc-101',
    encounterDate: new Date(Date.now() - 1000 * 60 * 35).toISOString(), // 35 min ago
    patientId: 'pat-001',
    patientName: 'Sunita Sharma',
    patientAge: 28,
    patientGender: 'female',
    patientVillage: 'Bilaspur Gram',
    facilityId: 'fac-phc-ramgarh',
    facilityName: 'Ramgarh Primary Health Centre',
    healthWorkerId: 'worker-asha-001',
    healthWorkerName: 'Sunita Devi (ASHA)',
    chiefComplaints: 'Severe throbbing headache, blurred vision, epigastric pain, pedal edema (34 weeks pregnant)',
    durationDays: 2,
    riskLevel: 'RED',
    systolicBP: 172,
    diastolicBP: 110,
    temperatureF: 99.1,
    pulseRate: 106,
    spo2: 97,
    bloodGlucoseMgDl: 112,
    dangerSigns: 'Hypertensive Emergency (BP 172/110), Pre-eclampsia neurological signs',
    isHighRiskMaternal: true,
    triageRationale: 'CRITICAL: Severe Pre-eclampsia at 34 weeks. High risk of convulsions. Requires immediate Doctor review and magnesium sulfate protocol.',
    status: 'WAITING_FOR_DOCTOR',
    source: 'ASHA Home Visit Referral',
  },

  // 2. ACUTE RESPIRATORY - UNDER DOCTOR REVIEW (RED)
  {
    id: 'enc-102',
    encounterDate: new Date(Date.now() - 1000 * 60 * 90).toISOString(), // 1.5 hr ago
    patientId: 'pat-005',
    patientName: 'Jagat Ram Soni',
    patientAge: 64,
    patientGender: 'male',
    patientVillage: 'Songaon',
    facilityId: 'fac-phc-ramgarh',
    facilityName: 'Ramgarh Primary Health Centre',
    healthWorkerId: 'worker-asha-001',
    healthWorkerName: 'Sunita Devi (ASHA)',
    chiefComplaints: 'Acute breathlessness, chest tightness, productive cough with rust-colored sputum',
    durationDays: 3,
    riskLevel: 'RED',
    systolicBP: 140,
    diastolicBP: 90,
    temperatureF: 101.8,
    pulseRate: 112,
    spo2: 89,
    dangerSigns: 'Severe Hypoxia (SpO2 89%), Tachypnea (RR 28)',
    triageRationale: 'CRITICAL: Acute exacerbation with lower respiratory infection. Oxygen support initiated at Sub-Centre.',
    status: 'UNDER_REVIEW',
    source: 'ASHA Urgent Triage',
  },

  // 3. MODERATE ANEMIA - PENDING DOCTOR (YELLOW)
  {
    id: 'enc-103',
    encounterDate: new Date(Date.now() - 1000 * 60 * 180).toISOString(), // 3 hrs ago
    patientId: 'pat-003',
    patientName: 'Priya Kumari',
    patientAge: 22,
    patientGender: 'female',
    patientVillage: 'Jamgaon',
    facilityId: 'fac-sc-bilaspur-01',
    facilityName: 'Bilaspur Health Sub-Centre',
    healthWorkerId: 'worker-asha-001',
    healthWorkerName: 'Sunita Devi (ASHA)',
    chiefComplaints: 'Severe fatigue, paleness, dizziness on exertion, 24 weeks ANC check',
    durationDays: 14,
    riskLevel: 'YELLOW',
    systolicBP: 112,
    diastolicBP: 74,
    temperatureF: 98.4,
    pulseRate: 84,
    spo2: 98,
    isHighRiskMaternal: true,
    dangerSigns: 'Moderate Anemia (Hb 8.2 g/dL)',
    triageRationale: 'MODERATE RISK: Second trimester pregnancy with Hb 8.2 g/dL. Needs physician prescription for therapeutic iron supplementation.',
    status: 'WAITING_FOR_DOCTOR',
    source: 'ASHA Routine ANC Survey',
  },

  // 4. DOCTOR RESPONDED / ASHA FOLLOW-UP REQUIRED
  {
    id: 'enc-104',
    encounterDate: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    patientId: 'pat-1',
    patientName: 'Ramesh Patel',
    patientAge: 45,
    patientGender: 'male',
    patientVillage: 'Ramgarh',
    facilityId: 'fac-phc-ramgarh',
    facilityName: 'Ramgarh Primary Health Centre',
    healthWorkerId: 'worker-asha-001',
    healthWorkerName: 'Sunita Devi (ASHA)',
    chiefComplaints: 'High fever, persistent dry cough, body pain, headache for 4 days',
    durationDays: 4,
    riskLevel: 'YELLOW',
    systolicBP: 136,
    diastolicBP: 86,
    temperatureF: 101.4,
    pulseRate: 90,
    spo2: 97,
    triageRationale: 'Persistent fever with myalgia. ASHA initiated triage for Medical Officer review.',
    diagnosis: 'Acute Viral Pyrexia with Upper Respiratory Tract Infection',
    treatmentPlan: 'Tab Paracetamol 650mg TDS x 3 days, Tab Cetirizine 10mg OD HS x 5 days, Warm salt water gargles, Hydration',
    notes: 'Prescribed antipyretics and antihistamines. ASHA Sunita Bai instructed to re-check temperature and vitals in 48 hours.',
    status: 'DOCTOR_RESPONDED',
    followUpRequired: true,
    followUpDate: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString().split('T')[0],
    source: 'ASHA Triage',
  },

  // 5. COMPLETED CASE (INFANT REHYDRATION)
  {
    id: 'enc-105',
    encounterDate: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(), // 1.5 days ago
    patientId: 'pat-004',
    patientName: 'Aarav Kumar (Infant)',
    patientAge: 1,
    patientGender: 'male',
    patientVillage: 'Bilaspur Gram',
    facilityId: 'fac-phc-ramgarh',
    facilityName: 'Ramgarh Primary Health Centre',
    healthWorkerId: 'worker-asha-001',
    healthWorkerName: 'Sunita Devi (ASHA)',
    chiefComplaints: 'Watery loose stools 5-6 times/day, mild vomiting, thirst',
    durationDays: 2,
    riskLevel: 'YELLOW',
    systolicBP: 86,
    diastolicBP: 56,
    temperatureF: 99.6,
    pulseRate: 122,
    spo2: 98,
    isHighRiskChild: true,
    triageRationale: 'Acute diarrheal dehydration in 12-month child (IMNCI Plan B).',
    diagnosis: 'Acute Gastroenteritis with Mild to Moderate Dehydration (Resolved)',
    treatmentPlan: 'Oral Rehydration Solution (ORS) 500ml/day + Zinc Sulphate syrup 20mg OD x 14 days',
    notes: 'Follow-up visit completed by ASHA. Child active, drinking normally, hydration fully restored.',
    status: 'COMPLETED',
    followUpRequired: false,
    source: 'ASHA Home Visit',
  },

  // 6. COMPLETED CASE IN HISTORY (LIFESTYLE & HYPERTENSION REVIEW)
  {
    id: 'enc-106',
    encounterDate: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(), // 3 days ago
    patientId: 'pat-007',
    patientName: 'Mohan Lal Verma',
    patientAge: 52,
    patientGender: 'male',
    patientVillage: 'Patan Kalan',
    facilityId: 'fac-sc-patan',
    facilityName: 'Patan Sub-Centre',
    healthWorkerId: 'worker-anm-001',
    healthWorkerName: 'Kavita Sahu (ANM)',
    chiefComplaints: 'Routine non-communicable disease (NCD) screening, mild headache',
    durationDays: 10,
    riskLevel: 'GREEN',
    systolicBP: 128,
    diastolicBP: 82,
    temperatureF: 98.4,
    pulseRate: 74,
    spo2: 98,
    bloodGlucoseMgDl: 106,
    triageRationale: 'NCD screening: Blood pressure and fasting glucose within controlled target range.',
    diagnosis: 'Essential Hypertension - Stable on Medication',
    treatmentPlan: 'Continue Tab Amlodipine 5mg OD morning, dietary low-salt counselling given',
    notes: 'Annual screening completed. Next follow-up in 3 months.',
    status: 'COMPLETED',
    source: 'Sub-Centre NCD Clinic',
  },
];

// -----------------------------------------------------------------------------
// 3. REALISTIC UPCOMING & PAST APPOINTMENTS (Patient Portal)
// -----------------------------------------------------------------------------
export const DEMO_APPOINTMENTS: DemoAppointment[] = [
  {
    id: 'apt-01',
    patientId: 'pat-1',
    doctorName: 'Dr. Ravi Kumar (MBBS, MD)',
    department: 'General Medicine & Fevers',
    facilityName: 'Ramgarh Primary Health Centre',
    scheduledTime: 'Tomorrow, 10:30 AM',
    status: 'CONFIRMED',
    type: 'In-Person',
    notes: 'Follow-up review for viral pyrexia and blood pressure monitoring.',
  },
  {
    id: 'apt-02',
    patientId: 'pat-1',
    doctorName: 'Dr. Ananya Sharma (MD, Obstetrics)',
    department: 'Teleconsultation Clinic',
    facilityName: 'Bilaspur District Civil Hospital',
    scheduledTime: 'Friday, 2:15 PM',
    status: 'SCHEDULED',
    type: 'Teleconsultation',
    notes: 'General wellness & seasonal respiratory advice.',
  },
  {
    id: 'apt-03',
    patientId: 'pat-1',
    doctorName: 'Dr. Ravi Kumar',
    department: 'Primary Care Consultation',
    facilityName: 'Ramgarh PHC',
    scheduledTime: '10 days ago',
    status: 'COMPLETED',
    type: 'Voice-Assisted',
    notes: 'Routine health checkup and vitals assessment.',
  },
];

// -----------------------------------------------------------------------------
// 4. REALISTIC ACTIVE PRESCRIPTIONS (Patient Portal)
// -----------------------------------------------------------------------------
export const DEMO_PRESCRIPTIONS: DemoPrescription[] = [
  {
    id: 'rx-01',
    patientId: 'pat-1',
    doctorName: 'Dr. Ravi Kumar',
    encounterId: 'enc-104',
    date: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString().split('T')[0],
    status: 'ACTIVE',
    medicines: [
      {
        name: 'Paracetamol 650mg',
        dosage: '1 tablet',
        frequency: 'Thrice daily (TDS)',
        duration: '3 days',
        instructions: 'Take after meals for fever and body ache',
      },
      {
        name: 'Cetirizine 10mg',
        dosage: '1 tablet',
        frequency: 'Once daily at bedtime (OD HS)',
        duration: '5 days',
        instructions: 'Take with warm water before sleep',
      },
      {
        name: 'Amlodipine 5mg',
        dosage: '1 tablet',
        frequency: 'Once daily morning (OD)',
        duration: '30 days',
        instructions: 'Take regularly at 8:00 AM for BP management',
      },
    ],
  },
];

// -----------------------------------------------------------------------------
// 5. REALISTIC DHO DISTRICT STATISTICS (Official Portal)
// -----------------------------------------------------------------------------
export const DEMO_DHO_STATS = {
  registeredPatients: 1284,
  activeCases: 38,
  pendingDoctorReviews: 14,
  followupsDue: 26,
  emergencyCases: 3,
  completedCases: 1102,
  highRiskMaternal: 12,
  highRiskChild: 8,
  stockoutAlerts: 4,
  facilityCount: 8,
  districts: ['Bilaspur', 'Durg', 'Raipur', 'Bastar'],
};

export const DEMO_DOCTOR_ENCOUNTERS: any[] = DEMO_ENCOUNTERS.map((e) => ({
  ...e,
  patient: {
    id: e.patientId,
    name: e.patientName,
    age: e.patientAge,
    gender: e.patientGender,
    phone: '+91 98261 77889',
    village: e.patientVillage,
    district: 'Bilaspur',
    abhaId: '91-5555-6666-7777',
  },
  facility: { name: e.facilityName, type: 'PHC' },
  healthWorker: { name: e.healthWorkerName, role: 'ASHA' },
}));

