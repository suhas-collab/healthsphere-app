import Dexie, { Table } from 'dexie';

export interface LocalPatient {
  id: string;
  abhaId: string;
  abhaAddress?: string;
  name: string;
  gender: 'female' | 'male' | 'other';
  age: number;
  phone: string;
  guardianName?: string;
  village: string;
  subCentre?: string;
  block: string;
  district: string;
  bloodGroup?: string;
  isPregnant: boolean;
  gestationalWeeks?: number;
  edd?: string;
  syncStatus: 'synced' | 'pending_sync';
  createdAt: string;
}

export interface LocalEncounter {
  id: string; // e.g. "local_enc_171000..."
  patientId: string;
  patientAbhaId: string;
  patientName: string;
  patientAge: number;
  patientGender: string;
  patientVillage: string;
  healthWorkerId: string;
  healthWorkerName: string;
  facilityId: string;
  facilityName: string;
  encounterDate: string;

  // Vitals
  temperatureF?: number;
  systolicBP?: number;
  diastolicBP?: number;
  pulseRate?: number;
  respiratoryRate?: number;
  spo2?: number;
  bloodGlucoseMgDl?: number;
  weightKg?: number;
  heightCm?: number;

  // Complaints & Notes
  chiefComplaints: string[];
  durationDays?: number;
  clinicalNotes?: string;

  // Triage assessment
  riskLevel: 'RED' | 'YELLOW' | 'GREEN';
  triageRationale: string;
  isHighRiskMaternal: boolean;
  isHighRiskChild: boolean;
  dangerSigns?: string;

  // Actions triggered at triage
  requestTeleconsult?: boolean;
  createReferral?: boolean;
  referralPriority?: 'STAT' | 'URGENT' | 'ROUTINE';

  // Case Lifecycle & Doctor Notes
  status?: string;
  doctorNotes?: string;
  doctorDiagnosis?: string;
  doctorAdvice?: string;

  // Offline Sync metadata
  syncStatus: 'synced' | 'pending_sync' | 'sync_error';
  syncError?: string;
  syncedAt?: string;
}

export interface SyncQueueItem {
  id?: number;
  actionType: 'REGISTER_PATIENT' | 'TRIAGE_ENCOUNTER';
  entityId: string;
  payload: any;
  createdAt: number;
  retryCount: number;
  status: 'pending' | 'processing' | 'failed';
  lastError?: string;
}

// Dexie Database Class
export class RuralHealthDB extends Dexie {
  patients!: Table<LocalPatient, string>;
  triageEncounters!: Table<LocalEncounter, string>;
  syncQueue!: Table<SyncQueueItem, number>;

  constructor() {
    super('RuralHealthOfflineDB');
    this.version(1).stores({
      patients: 'id, abhaId, name, phone, village, syncStatus',
      triageEncounters: 'id, patientId, patientAbhaId, riskLevel, encounterDate, syncStatus',
      syncQueue: '++id, actionType, entityId, status, createdAt',
    });
  }
}

// Singleton database instance
export const offlineDb = new RuralHealthDB();

// -----------------------------------------------------------------------------
// Automated Clinical Risk Calculation Engine (FHIR Clinical Assessment)
// -----------------------------------------------------------------------------
export interface TriageInput {
  temperatureF?: number;
  systolicBP?: number;
  diastolicBP?: number;
  pulseRate?: number;
  spo2?: number;
  respiratoryRate?: number;
  bloodGlucoseMgDl?: number;
  chiefComplaints: string[];
  isPregnant?: boolean;
  gestationalWeeks?: number;
  age?: number;
}

export interface TriageResult {
  riskLevel: 'RED' | 'YELLOW' | 'GREEN';
  rationale: string[];
  dangerSigns: string[];
  isMaternalHighRisk: boolean;
  isChildHighRisk: boolean;
  recommendedAction: string;
}

export function evaluateClinicalRisk(input: TriageInput): TriageResult {
  const redFlags: string[] = [];
  const yellowFlags: string[] = [];
  const dangerSigns: string[] = [];
  let isMaternalHighRisk = false;
  let isChildHighRisk = false;

  const {
    temperatureF,
    systolicBP,
    diastolicBP,
    pulseRate,
    spo2,
    respiratoryRate,
    chiefComplaints = [],
    isPregnant,
    age = 30,
  } = input;

  // 1. Blood Pressure Evaluation
  if (systolicBP !== undefined && diastolicBP !== undefined) {
    if (systolicBP >= 160 || diastolicBP >= 110) {
      if (isPregnant) {
        redFlags.push(`Critical: Severe Pre-eclampsia / Hypertensive Crisis (BP ${systolicBP}/${diastolicBP} mmHg)`);
        dangerSigns.push('Severe Pre-eclampsia Danger');
        isMaternalHighRisk = true;
      } else {
        redFlags.push(`Hypertensive Emergency (BP ${systolicBP}/${diastolicBP} mmHg)`);
      }
    } else if (systolicBP >= 140 || diastolicBP >= 90) {
      if (isPregnant) {
        yellowFlags.push(`Gestational Hypertension (BP ${systolicBP}/${diastolicBP} mmHg)`);
        isMaternalHighRisk = true;
      } else {
        yellowFlags.push(`Stage 2 Hypertension (BP ${systolicBP}/${diastolicBP} mmHg)`);
      }
    } else if (systolicBP < 90 || diastolicBP < 60) {
      redFlags.push(`Hypotension / Shock Warning (BP ${systolicBP}/${diastolicBP} mmHg)`);
    }
  }

  // 2. Oxygen Saturation (SpO2)
  if (spo2 !== undefined) {
    if (spo2 < 90) {
      redFlags.push(`Severe Hypoxemia (SpO2 ${spo2}%) - Critical Oxygen Need`);
      dangerSigns.push('Severe Hypoxia');
    } else if (spo2 < 94) {
      yellowFlags.push(`Sub-optimal Oxygen (SpO2 ${spo2}%) - Requires Doctor Review`);
    }
  }

  // 3. Heart Rate / Pulse
  if (pulseRate !== undefined) {
    if (pulseRate > 125) {
      redFlags.push(`Severe Tachycardia (Pulse ${pulseRate} bpm)`);
    } else if (pulseRate > 105) {
      yellowFlags.push(`Elevated Pulse (Pulse ${pulseRate} bpm)`);
    } else if (pulseRate < 45) {
      redFlags.push(`Severe Bradycardia (Pulse ${pulseRate} bpm)`);
    }
  }

  // 4. Body Temperature
  if (temperatureF !== undefined) {
    if (temperatureF >= 103.0) {
      redFlags.push(`Hyperpyrexia / Very High Fever (${temperatureF}°F)`);
    } else if (temperatureF >= 100.4) {
      yellowFlags.push(`Fever (${temperatureF}°F)`);
    } else if (temperatureF < 95.0) {
      redFlags.push(`Hypothermia danger (${temperatureF}°F)`);
    }
  }

  // 5. Respiratory Rate
  if (respiratoryRate !== undefined) {
    if (respiratoryRate >= 30) {
      redFlags.push(`Severe Tachypnea (Respiratory Rate ${respiratoryRate}/min)`);
    } else if (respiratoryRate >= 24) {
      yellowFlags.push(`Elevated Breathing (Respiratory Rate ${respiratoryRate}/min)`);
    }
  }

  // 6. Critical Symptoms Checklist
  chiefComplaints.forEach((c) => {
    const lower = c.toLowerCase();
    if (lower.includes('convulsion') || lower.includes('seizure') || lower.includes('fit')) {
      redFlags.push('Active Seizures / Convulsions reported');
      dangerSigns.push('Neurological Danger');
    }
    if (lower.includes('bleeding') || lower.includes('hemorrhage') || lower.includes('vaginal bleeding')) {
      redFlags.push('Active / Severe Bleeding reported');
      dangerSigns.push('Severe Bleeding');
      if (isPregnant) isMaternalHighRisk = true;
    }
    if (lower.includes('chest pain') || lower.includes('radiating to arm')) {
      redFlags.push('Acute Anginal Chest Pain / ACS Risk');
      dangerSigns.push('Cardiac Red Flag');
    }
    if (lower.includes('breathless') || lower.includes('gasping')) {
      if (redFlags.length === 0) redFlags.push('Acute severe respiratory distress');
    }
    if (lower.includes('watery diarrhea') || lower.includes('sunken eyes') || lower.includes('dehydration')) {
      if (age <= 5) {
        yellowFlags.push('Pediatric Diarrhea with dehydration risk');
        isChildHighRisk = true;
      } else {
        yellowFlags.push('Dehydrating acute diarrheal illness');
      }
    }
    if (lower.includes('blur') || lower.includes('vision') || lower.includes('headache')) {
      if (isPregnant) {
        yellowFlags.push('Imminent pre-eclampsia symptoms (visual/headache)');
        isMaternalHighRisk = true;
      }
    }
  });

  // Decision logic
  if (redFlags.length > 0) {
    return {
      riskLevel: 'RED',
      rationale: redFlags,
      dangerSigns,
      isMaternalHighRisk,
      isChildHighRisk,
      recommendedAction: 'IMMEDIATE EMERGENCY: Connect MO Teleconsultation & Dispatch Ambulance to District Hospital.',
    };
  }

  if (yellowFlags.length > 0) {
    return {
      riskLevel: 'YELLOW',
      rationale: yellowFlags,
      dangerSigns,
      isMaternalHighRisk,
      isChildHighRisk,
      recommendedAction: 'MODERATE RISK: Schedule PHC Medical Officer Review within 24-48 hours. Start supportive care.',
    };
  }

  return {
    riskLevel: 'GREEN',
    rationale: ['All physiological vitals and symptoms within standard safe ranges.'],
    dangerSigns: [],
    isMaternalHighRisk,
    isChildHighRisk,
    recommendedAction: 'ROUTINE CARE: Standard community counseling, oral OTC medications if indicated, routine follow-up.',
  };
}
