'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Stethoscope,
  Video,
  Phone,
  MessageSquare,
  FileText,
  Clock,
  User,
  Activity,
  CheckCircle2,
  Plus,
  Trash2,
  Ambulance,
  Heart,
  Thermometer,
  Search,
  Filter,
  ArrowLeft,
  AlertTriangle,
  Send,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  Sparkles,
  Calendar,
  Share2,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { getAuthHeaders } from '@/lib/auth/client';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import SpeakButton from '@/components/common/SpeakButton';
import { DEMO_DOCTOR_ENCOUNTERS } from '@/lib/demoData';

interface Patient {
  id: string;
  abhaId?: string;
  name: string;
  age: number;
  gender: string;
  phone?: string;
  village?: string;
  isPregnant?: boolean;
  gestationalWeeks?: number;
}

interface Encounter {
  id: string;
  patientId: string;
  patient: Patient;
  facility?: { name: string; type?: string };
  healthWorker?: { name: string; role?: string };
  encounterDate: string;
  temperatureF?: number;
  systolicBP?: number;
  diastolicBP?: number;
  pulseRate?: number;
  spo2?: number;
  respiratoryRate?: number;
  chiefComplaints: string;
  riskLevel: 'RED' | 'YELLOW' | 'GREEN';
  triageRationale?: string;
  dangerSigns?: string;
  isHighRiskMaternal?: boolean;
  isHighRiskChild?: boolean;
  status?: string; // WAITING_FOR_DOCTOR, DOCTOR_REVIEWING, DOCTOR_RESPONDED, FOLLOWUP_REQUIRED, COMPLETED
  doctorNotes?: string;
  doctorDiagnosis?: string;
  doctorAdvice?: string;
}

interface PrescriptionItem {
  medicineName: string;
  dosage: string;
  frequency: string;
  durationDays: number;
  instructions: string;
}

interface Prescription {
  id: string;
  prescriptionCode: string;
  patientId: string;
  patient?: Patient;
  diagnosis: string;
  advice: string;
  issuedAt: string;
  items: PrescriptionItem[];
}

interface Referral {
  id: string;
  referralCode?: string;
  patientId: string;
  targetFacility?: { name: string };
  priority?: string;
  reasonForReferral: string;
  createdAt: string;
}

const COMMON_MEDICINES = [
  { name: 'Paracetamol 500mg Tablets', dosage: '1 tablet', freq: '1-1-1 (Thrice daily after food)', days: 3, inst: 'Take for fever or pain' },
  { name: 'Amoxicillin 500mg Capsules', dosage: '1 capsule', freq: '1-0-1 (Twice daily after food)', days: 5, inst: 'Complete full antibacterial course' },
  { name: 'ORS (Oral Rehydration Salts)', dosage: '1 packet in 1L water', freq: 'Drink frequently', days: 2, inst: 'Sip throughout the day to avoid dehydration' },
  { name: 'Cetirizine 10mg Tablets', dosage: '1 tablet', freq: '0-0-1 (Once at bedtime)', days: 5, inst: 'For allergy or allergic rhinitis' },
  { name: 'Amlodipine 5mg Tablets', dosage: '1 tablet', freq: '1-0-0 (Morning after food)', days: 30, inst: 'For blood pressure control, do not skip' },
  { name: 'Metformin 500mg Tablets', dosage: '1 tablet', freq: '1-0-1 (With meals)', days: 30, inst: 'Take with morning and evening food' },
  { name: 'Iron & Folic Acid (IFA) Tablets', dosage: '1 tablet', freq: '0-1-0 (Afternoon with lemon water)', days: 30, inst: 'Do not take with milk or tea' },
  { name: 'Antacid Gel / Chewable', dosage: '10 ml', freq: '1-0-1 (Before meals)', days: 5, inst: 'For acid reflux and gastritis' },
];

export default function DoctorPortal() {
  const { language, t, getSymptomLabel } = useLanguage();
  // Clinical records (Synchronously pre-populated with realistic demo cases)
  const [encounters, setEncounters] = useState<Encounter[]>(DEMO_DOCTOR_ENCOUNTERS);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  // View state: 'attention' (Active cases) vs 'history' (Completed cases)
  const [activeTab, setActiveTab] = useState<'attention' | 'history'>('attention');
  const [selectedCase, setSelectedCase] = useState<Encounter | null>(null);

  // Filters
  const [riskFilter, setRiskFilter] = useState<'ALL' | 'RED' | 'YELLOW' | 'GREEN'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Inline Action Modals / Sections inside selected case
  const [activeAction, setActiveAction] = useState<'none' | 'advice' | 'prescribe' | 'refer' | 'followup' | 'video' | 'call' | 'message'>('none');

  // Treatment / Advice form
  const [adviceDiagnosis, setAdviceDiagnosis] = useState('');
  const [adviceText, setAdviceText] = useState('');
  const [isSubmittingAdvice, setIsSubmittingAdvice] = useState(false);

  // Prescription form
  const [rxItems, setRxItems] = useState<PrescriptionItem[]>([
    { medicineName: 'Paracetamol 500mg Tablets', dosage: '1 tablet', frequency: '1-0-1 (Twice daily after food)', durationDays: 3, instructions: 'Take for fever' },
  ]);
  const [rxDiagnosis, setRxDiagnosis] = useState('');
  const [rxAdvice, setRxAdvice] = useState('');
  const [isSubmittingRx, setIsSubmittingRx] = useState(false);

  // Referral form
  const [refDepartment, setRefDepartment] = useState('General Medicine');
  const [refFacility, setRefFacility] = useState('District Hospital Bilaspur');
  const [refPriority, setRefPriority] = useState<'STAT' | 'URGENT' | 'ROUTINE'>('URGENT');
  const [refReason, setRefReason] = useState('');
  const [refPreTreatment, setRefPreTreatment] = useState('');
  const [isSubmittingRef, setIsSubmittingRef] = useState(false);

  // Follow-up form
  const [followupNote, setFollowupNote] = useState('Check blood pressure and temperature in 2 days. Verify medicine compliance.');
  const [isSubmittingFollowup, setIsSubmittingFollowup] = useState(false);

  // Video call state
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);

  // Phone / Message Modal info
  const [messageText, setMessageText] = useState('');
  const [messageSent, setMessageSent] = useState(false);

  // Fetch all clinical data (Background silent refresh)
  const fetchData = async () => {
    try {
      setIsUpdating(true);
      const headers = getAuthHeaders('MEDICAL_OFFICER');
      const [encRes, rxRes, refRes] = await Promise.all([
        fetch('/api/encounters', { headers }),
        fetch('/api/prescriptions', { headers }),
        fetch('/api/referrals', { headers }),
      ]);

      const [encData, rxData, refData] = await Promise.all([
        encRes.json().catch(() => ({ encounters: [] })),
        rxRes.json().catch(() => ({ prescriptions: [] })),
        refRes.json().catch(() => ({ referrals: [] })),
      ]);

      if (encData.encounters && encData.encounters.length > 0) {
        // Merge with demo encounters so demo cases remain present
        const map = new Map<string, Encounter>();
        DEMO_DOCTOR_ENCOUNTERS.forEach((e) => map.set(e.id, e));
        encData.encounters.forEach((e: Encounter) => map.set(e.id, e));
        setEncounters(Array.from(map.values()));
      }

      if (rxData.prescriptions && rxData.prescriptions.length > 0) {
        setPrescriptions(rxData.prescriptions);
      }
      if (refData.referrals && refData.referrals.length > 0) {
        setReferrals(refData.referrals);
      }

      // If a case is currently selected, refresh its data
      if (selectedCase) {
        const updated = (encData.encounters || []).find((e: Encounter) => e.id === selectedCase.id);
        if (updated) setSelectedCase(updated);
      }
    } catch (err) {
      console.error('DoctorPortal fetch error:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Video call timer
  useEffect(() => {
    let timer: any;
    if (activeAction === 'video') {
      timer = setInterval(() => setCallDuration((p) => p + 1), 1000);
    } else {
      setCallDuration(0);
    }
    return () => clearInterval(timer);
  }, [activeAction]);

  // Open Case Handler
  const handleOpenCase = async (enc: Encounter) => {
    setSelectedCase(enc);
    setActiveAction('none');
    setAdviceDiagnosis(enc.doctorDiagnosis || `Case evaluation for ${enc.chiefComplaints}`);
    setAdviceText(enc.doctorAdvice || enc.doctorNotes || '');
    setRxDiagnosis(enc.doctorDiagnosis || enc.chiefComplaints);
    setRxAdvice(enc.doctorAdvice || 'Take prescribed medicines with clean boiled water. Rest adequately.');

    // If status is WAITING_FOR_DOCTOR, automatically mark as DOCTOR_REVIEWING
    if (enc.status === 'WAITING_FOR_DOCTOR' || !enc.status) {
      try {
        await fetch('/api/encounters', {
          method: 'PATCH',
          headers: getAuthHeaders('MEDICAL_OFFICER'),
          body: JSON.stringify({
            id: enc.id,
            status: 'DOCTOR_REVIEWING',
          }),
        });
        setEncounters((prev) =>
          prev.map((e) => (e.id === enc.id ? { ...e, status: 'DOCTOR_REVIEWING' } : e))
        );
        setSelectedCase((prev) => (prev ? { ...prev, status: 'DOCTOR_REVIEWING' } : null));
      } catch (err) {
        console.warn('Status transition notice:', err);
      }
    }
  };

  // 1. Submit Treatment / Advice
  const handleSaveAdvice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCase) return;

    try {
      setIsSubmittingAdvice(true);
      const res = await fetch('/api/encounters', {
        method: 'PATCH',
        headers: getAuthHeaders('MEDICAL_OFFICER'),
        body: JSON.stringify({
          id: selectedCase.id,
          status: 'DOCTOR_RESPONDED',
          doctorNotes: adviceText,
          doctorDiagnosis: adviceDiagnosis,
          doctorAdvice: adviceText,
        }),
      });

      if (res.ok) {
        confetti({ particleCount: 60, spread: 60 });
        setActiveAction('none');
        await fetchData();
      }
    } catch (err) {
      console.error('Error saving doctor advice:', err);
    } finally {
      setIsSubmittingAdvice(false);
    }
  };

  // 2. Submit Digital Prescription
  const handleSavePrescription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCase) return;

    try {
      setIsSubmittingRx(true);
      const res = await fetch('/api/prescriptions', {
        method: 'POST',
        headers: getAuthHeaders('MEDICAL_OFFICER'),
        body: JSON.stringify({
          patientId: selectedCase.patient.id || selectedCase.patientId,
          doctorId: 'HW-MO-001',
          diagnosis: rxDiagnosis || selectedCase.chiefComplaints,
          advice: rxAdvice || 'Complete medications on time as directed.',
          items: rxItems,
        }),
      });

      // Also update encounter status to DOCTOR_RESPONDED
      await fetch('/api/encounters', {
        method: 'PATCH',
        headers: getAuthHeaders('MEDICAL_OFFICER'),
        body: JSON.stringify({
          id: selectedCase.id,
          status: 'DOCTOR_RESPONDED',
          doctorDiagnosis: rxDiagnosis,
          doctorAdvice: rxAdvice,
        }),
      });

      if (res.ok) {
        confetti({ particleCount: 70, spread: 70 });
        setActiveAction('none');
        await fetchData();
      }
    } catch (err) {
      console.error('Prescription issue error:', err);
    } finally {
      setIsSubmittingRx(false);
    }
  };

  // Add Item to Rx
  const addRxItem = (item?: any) => {
    if (item) {
      setRxItems([...rxItems, { medicineName: item.name, dosage: item.dosage, frequency: item.freq, durationDays: item.days, instructions: item.inst }]);
    } else {
      setRxItems([
        ...rxItems,
        { medicineName: 'Paracetamol 500mg Tablets', dosage: '1 tablet', frequency: '1-0-1', durationDays: 3, instructions: 'After food' },
      ]);
    }
  };

  const removeRxItem = (index: number) => {
    setRxItems(rxItems.filter((_, i) => i !== index));
  };

  // 3. Submit Referral
  const handleSaveReferral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCase) return;

    try {
      setIsSubmittingRef(true);
      const res = await fetch('/api/referrals', {
        method: 'POST',
        headers: getAuthHeaders('MEDICAL_OFFICER'),
        body: JSON.stringify({
          patientId: selectedCase.patient.id || selectedCase.patientId,
          sourceFacilityId: selectedCase.facility?.name || 'Primary Health Centre',
          targetFacilityId: refFacility,
          referringWorkerId: 'HW-MO-001',
          priority: refPriority,
          reasonForReferral: `${refDepartment}: ${refReason || 'Specialist consultation required'}`,
          clinicalSummary: `Vitals: BP ${selectedCase.systolicBP || '--'}/${selectedCase.diastolicBP || '--'}, SpO2 ${selectedCase.spo2 || '--'}%, Pulse ${selectedCase.pulseRate || '--'}. Symptoms: ${selectedCase.chiefComplaints}`,
          preReferralTreatment: refPreTreatment || 'First aid given. Patient stabilized.',
          transportStatus: 'SCHEDULED',
          status: 'PENDING',
        }),
      });

      await fetch('/api/encounters', {
        method: 'PATCH',
        headers: getAuthHeaders('MEDICAL_OFFICER'),
        body: JSON.stringify({
          id: selectedCase.id,
          status: 'DOCTOR_RESPONDED',
          doctorNotes: `Referred to ${refDepartment} at ${refFacility}. Reason: ${refReason}`,
        }),
      });

      if (res.ok) {
        confetti({ particleCount: 70, spread: 70 });
        setActiveAction('none');
        await fetchData();
      }
    } catch (err) {
      console.error('Referral issue error:', err);
    } finally {
      setIsSubmittingRef(false);
    }
  };

  // 4. Request ASHA Follow-up
  const handleSaveFollowup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCase) return;

    try {
      setIsSubmittingFollowup(true);
      const res = await fetch('/api/encounters', {
        method: 'PATCH',
        headers: getAuthHeaders('MEDICAL_OFFICER'),
        body: JSON.stringify({
          id: selectedCase.id,
          status: 'FOLLOWUP_REQUIRED',
          doctorNotes: `[ASHA Follow-up Request]: ${followupNote}`,
        }),
      });

      if (res.ok) {
        confetti({ particleCount: 50, spread: 50 });
        setActiveAction('none');
        await fetchData();
      }
    } catch (err) {
      console.error('Follow-up request error:', err);
    } finally {
      setIsSubmittingFollowup(false);
    }
  };

  // 5. Mark Case Complete
  const handleMarkComplete = async () => {
    if (!selectedCase) return;
    const confirmComplete = window.confirm(
      language === 'mr'
        ? 'हा केस पूर्ण (Completed) म्हणून नोंदवायचा आहे का? केस इतिहासात (History) जतन होईल.'
        : 'Are you sure you want to mark this case complete? It will be safely preserved in History.'
    );
    if (!confirmComplete) return;

    try {
      const res = await fetch('/api/encounters', {
        method: 'PATCH',
        headers: getAuthHeaders('MEDICAL_OFFICER'),
        body: JSON.stringify({
          id: selectedCase.id,
          status: 'COMPLETED',
          doctorNotes: selectedCase.doctorNotes
            ? `${selectedCase.doctorNotes} | Case Completed on ${new Date().toLocaleDateString()}`
            : `Case evaluated and completed on ${new Date().toLocaleDateString()}`,
        }),
      });

      if (res.ok) {
        confetti({ particleCount: 90, spread: 90 });
        setSelectedCase(null);
        await fetchData();
      }
    } catch (err) {
      console.error('Case complete error:', err);
    }
  };

  // Filtered lists
  const attentionCases = encounters.filter((e) => e.status !== 'COMPLETED');
  const historyCases = encounters.filter((e) => e.status === 'COMPLETED');

  const currentList = activeTab === 'attention' ? attentionCases : historyCases;

  const filteredCases = currentList.filter((e) => {
    const matchesRisk = riskFilter === 'ALL' || e.riskLevel === riskFilter;
    const pName = e.patient?.name?.toLowerCase() || '';
    const pVillage = e.patient?.village?.toLowerCase() || '';
    const q = searchQuery.toLowerCase().trim();
    const matchesQuery = !q || pName.includes(q) || pVillage.includes(q) || e.chiefComplaints.toLowerCase().includes(q);
    return matchesRisk && matchesQuery;
  });

  // Urgency & Status Counters
  const emergencyCount = attentionCases.filter((e) => e.riskLevel === 'RED').length;
  const urgentCount = attentionCases.filter((e) => e.riskLevel === 'YELLOW').length;
  const waitingReviewCount = attentionCases.filter((e) => !e.status || e.status === 'WAITING_FOR_DOCTOR').length;
  const respondedCount = attentionCases.filter((e) => e.status === 'DOCTOR_RESPONDED').length;
  const followupCount = attentionCases.filter((e) => e.status === 'FOLLOWUP_REQUIRED').length;

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'WAITING_FOR_DOCTOR':
      default:
        return (
          <span style={{ background: '#fef9c3', color: '#854d0e', padding: '4px 10px', borderRadius: '12px', fontSize: '0.78rem', fontWeight: 800 }}>
            🟡 {language === 'mr' ? 'डॉक्टर प्रतीक्षेत' : 'Waiting for Doctor'}
          </span>
        );
      case 'DOCTOR_REVIEWING':
        return (
          <span style={{ background: '#dbeafe', color: '#1e40af', padding: '4px 10px', borderRadius: '12px', fontSize: '0.78rem', fontWeight: 800 }}>
            🔵 {language === 'mr' ? 'डॉक्टर तपासत आहेत' : 'Doctor Reviewing'}
          </span>
        );
      case 'DOCTOR_RESPONDED':
        return (
          <span style={{ background: '#dcfce7', color: '#166534', padding: '4px 10px', borderRadius: '12px', fontSize: '0.78rem', fontWeight: 800 }}>
            🟢 {language === 'mr' ? 'डॉक्टरांचा सल्ला आला' : 'Doctor Responded'}
          </span>
        );
      case 'FOLLOWUP_REQUIRED':
        return (
          <span style={{ background: '#ffedd5', color: '#9a3412', padding: '4px 10px', borderRadius: '12px', fontSize: '0.78rem', fontWeight: 800 }}>
            🟠 {language === 'mr' ? 'आशा पाठपुरावा आवश्यक' : 'Follow-up Required'}
          </span>
        );
      case 'COMPLETED':
        return (
          <span style={{ background: '#f1f5f9', color: '#475569', padding: '4px 10px', borderRadius: '12px', fontSize: '0.78rem', fontWeight: 800 }}>
            ✅ {language === 'mr' ? 'केस पूर्ण (Completed)' : 'Completed'}
          </span>
        );
    }
  };

  const getUrgencyBadge = (riskLevel: string) => {
    if (riskLevel === 'RED') {
      return (
        <span style={{ background: '#fee2e2', color: '#991b1b', padding: '4px 10px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 800, border: '1px solid #f87171' }}>
          🚨 {language === 'mr' ? 'तातडीचा / आपत्कालीन' : 'Emergency (Red)'}
        </span>
      );
    }
    if (riskLevel === 'YELLOW') {
      return (
        <span style={{ background: '#fef3c7', color: '#92400e', padding: '4px 10px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 800, border: '1px solid #fde047' }}>
          ⚠️ {language === 'mr' ? 'महत्त्वाचा' : 'Urgent (Yellow)'}
        </span>
      );
    }
    return (
      <span style={{ background: '#f0fdf4', color: '#166534', padding: '4px 10px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 800, border: '1px solid #86efac' }}>
        🟢 {language === 'mr' ? 'नियमित' : 'Routine (Green)'}
      </span>
    );
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* ------------------------------------------------------------- */}
      {/* 1. DOCTOR HEADER & SUMMARY METRICS                           */}
      {/* ------------------------------------------------------------- */}
      <div
        className="glass-panel"
        style={{
          padding: '20px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '54px',
              height: '54px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 4px 12px rgba(13, 148, 136, 0.3)',
            }}
          >
            <Stethoscope size={30} />
          </div>
          <div>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--slate-900)' }}>
              {t.doctor?.doctorName || 'Dr. Rajesh Sharma, MBBS, MD'}
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--slate-600)', fontWeight: 600 }}>
              {t.doctor?.doctorDesignation || 'Medical Officer • PHC Ramgarh / Bilaspur District Hospital'}
            </div>
          </div>
        </div>

        {/* Action Counters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              padding: '8px 14px',
              borderRadius: '12px',
              fontSize: '0.85rem',
              fontWeight: 800,
              color: '#0f172a',
            }}
          >
            📋 {language === 'mr' ? 'तपासणीसाठी केसेस:' : 'Cases Needing Attention:'}{' '}
            <span style={{ color: '#0d9488', fontSize: '1rem' }}>{attentionCases.length}</span>
          </div>

          {(emergencyCount > 0 || urgentCount > 0) && (
            <div
              style={{
                background: '#fee2e2',
                border: '1px solid #f87171',
                padding: '8px 14px',
                borderRadius: '12px',
                fontSize: '0.85rem',
                fontWeight: 800,
                color: '#991b1b',
              }}
            >
              🚨 {language === 'mr' ? 'तातडीच्या केसेस:' : 'Emergency / Urgent:'}{' '}
              <span>{emergencyCount + urgentCount}</span>
            </div>
          )}

          <div
            style={{
              background: '#fef9c3',
              border: '1px solid #fde047',
              padding: '8px 14px',
              borderRadius: '12px',
              fontSize: '0.85rem',
              fontWeight: 800,
              color: '#854d0e',
            }}
          >
            🟡 {language === 'mr' ? 'प्रतीक्षेत:' : 'Waiting Review:'}{' '}
            <span>{waitingReviewCount}</span>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. CASE DETAIL VIEW (WHEN A CASE IS OPENED)                   */}
      {/* ------------------------------------------------------------- */}
      {selectedCase ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Back button and quick banner */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <button
              onClick={() => {
                setSelectedCase(null);
                setActiveAction('none');
              }}
              className="btn-secondary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 18px', fontWeight: 800 }}
            >
              <ArrowLeft size={18} />
              <span>{language === 'mr' ? 'केस यादीकडे परत जा' : 'Back to Cases List'}</span>
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {getUrgencyBadge(selectedCase.riskLevel)}
              {getStatusBadge(selectedCase.status)}
            </div>
          </div>

          {/* Patient Card & Quick Contact */}
          <div
            className="glass-panel"
            style={{
              padding: '24px',
              borderTop: `6px solid ${
                selectedCase.riskLevel === 'RED'
                  ? '#ef4444'
                  : selectedCase.riskLevel === 'YELLOW'
                  ? '#f59e0b'
                  : '#10b981'
              }`,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <h2 style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--slate-900)', margin: 0 }}>
                    {selectedCase.patient.name}
                  </h2>
                  <span style={{ fontSize: '1rem', color: 'var(--slate-600)', fontWeight: 700 }}>
                    • {selectedCase.patient.age} {language === 'mr' ? 'वर्षे' : 'years'}, {selectedCase.patient.gender}
                  </span>
                </div>
                <div style={{ fontSize: '0.9rem', color: 'var(--slate-600)', marginTop: '4px', fontWeight: 600 }}>
                  📍 {selectedCase.patient.village || 'Bilha Village'} • 📞 {selectedCase.patient.phone || '+91 98261 12345'}
                  {selectedCase.patient.isPregnant && (
                    <span style={{ marginLeft: '10px', background: '#fdf2f8', color: '#be185d', padding: '2px 8px', borderRadius: '6px', fontWeight: 800 }}>
                      🤰 {language === 'mr' ? 'गर्भवती माता (ANC)' : 'Pregnant Mother'}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--slate-500)', marginTop: '4px' }}>
                  {language === 'mr' ? 'नोंदणी:' : 'Submitted by:'} 👩‍⚕️{' '}
                  <strong>{selectedCase.healthWorker?.name || 'ASHA Sunita Devi'}</strong> (
                  {selectedCase.facility?.name || 'Sub-Centre Bilha'}) •{' '}
                  {new Date(selectedCase.encounterDate).toLocaleDateString()}
                </div>
              </div>

              {/* Quick Communication Options inside Case */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setActiveAction('call')}
                  className="btn-secondary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 14px', fontWeight: 800, color: '#15803d' }}
                >
                  <Phone size={16} />
                  <span>{language === 'mr' ? '📞 फोन करा' : 'Call'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveAction('message')}
                  className="btn-secondary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 14px', fontWeight: 800, color: '#0369a1' }}
                >
                  <MessageSquare size={16} />
                  <span>{language === 'mr' ? '💬 संदेश पाठवा' : 'Message'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveAction('video')}
                  className="btn-primary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 16px', fontWeight: 800 }}
                >
                  <Video size={16} />
                  <span>{language === 'mr' ? '🎥 व्हिडिओ तपासणी' : 'Video Consult'}</span>
                </button>
              </div>
            </div>

            {/* Vitals Ribbon */}
            <div
              style={{
                marginTop: '20px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '14px',
                padding: '16px',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                gap: '12px',
                textAlign: 'center',
              }}
            >
              <div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>
                  {language === 'mr' ? 'तापमान (Temp)' : 'Temperature'}
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 900, color: (selectedCase.temperatureF || 0) >= 101 ? '#dc2626' : '#0f172a' }}>
                  {selectedCase.temperatureF ? `${selectedCase.temperatureF}°F` : '--'}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>
                  {language === 'mr' ? 'रक्तदाब (BP)' : 'Blood Pressure'}
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 900, color: (selectedCase.systolicBP || 0) >= 160 ? '#dc2626' : '#0f172a' }}>
                  {selectedCase.systolicBP || '--'}/{selectedCase.diastolicBP || '--'} <span style={{ fontSize: '0.8rem' }}>mmHg</span>
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>
                  {language === 'mr' ? 'ऑक्सिजन (SpO₂)' : 'Oxygen (SpO₂)'}
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 900, color: (selectedCase.spo2 || 100) < 94 ? '#dc2626' : '#0f172a' }}>
                  {selectedCase.spo2 ? `${selectedCase.spo2}%` : '--'}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>
                  {language === 'mr' ? 'नाडीचे ठोके (Pulse)' : 'Pulse Rate'}
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0f172a' }}>
                  {selectedCase.pulseRate ? `${selectedCase.pulseRate} bpm` : '--'}
                </div>
              </div>
            </div>

            {/* Symptoms & Observations */}
            <div style={{ marginTop: '18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#334155' }}>
                  {language === 'mr' ? 'लक्षणे (Symptoms):' : 'Symptoms:'}
                </span>{' '}
                <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
                  {selectedCase.chiefComplaints.split(', ').map(c => getSymptomLabel(c)).join(', ')}
                </span>
              </div>

              {selectedCase.triageRationale && (
                <div
                  style={{
                    padding: '12px 14px',
                    borderRadius: '10px',
                    background: selectedCase.riskLevel === 'RED' ? '#fee2e2' : '#fef3c7',
                    border: `1px solid ${selectedCase.riskLevel === 'RED' ? '#f87171' : '#fde047'}`,
                    fontSize: '0.9rem',
                    color: selectedCase.riskLevel === 'RED' ? '#991b1b' : '#92400e',
                  }}
                >
                  <strong>{language === 'mr' ? 'आशा / प्राथमिक मूल्यांकन:' : 'ASHA / Triage Observations:'}</strong>{' '}
                  {selectedCase.triageRationale}
                </div>
              )}

              {/* Existing Doctor Notes / Advice if already responded */}
              {selectedCase.doctorNotes && (
                <div
                  style={{
                    marginTop: '6px',
                    padding: '14px 16px',
                    borderRadius: '12px',
                    background: '#f0fdf4',
                    border: '1px solid #86efac',
                  }}
                >
                  <div style={{ fontWeight: 800, color: '#166534', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CheckCircle2 size={18} />
                    <span>{language === 'mr' ? 'डॉक्टरांचा सल्ला व उपचार (Doctor Advice on Record):' : 'Doctor Advice on Record:'}</span>
                  </div>
                  <div style={{ marginTop: '6px', fontSize: '0.95rem', color: '#14532d', whiteSpace: 'pre-wrap' }}>
                    {selectedCase.doctorNotes}
                  </div>
                </div>
              )}
            </div>

            {/* Prescriptions issued for this patient */}
            {prescriptions.filter((rx) => rx.patientId === selectedCase.patient.id || rx.patientId === selectedCase.patientId).length > 0 && (
              <div style={{ marginTop: '16px', padding: '14px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#334155', marginBottom: '8px' }}>
                  💊 {language === 'mr' ? 'या रुग्णाला दिलेली औषधे (Prescriptions):' : 'Active Prescriptions for this Patient:'}
                </div>
                {prescriptions
                  .filter((rx) => rx.patientId === selectedCase.patient.id || rx.patientId === selectedCase.patientId)
                  .map((rx) => (
                    <div key={rx.id} style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '8px' }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0d9488' }}>
                        Rx #{rx.prescriptionCode} • {new Date(rx.issuedAt).toLocaleDateString()}
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {rx.items?.map((item, idx) => (
                          <span key={idx} style={{ background: '#f1f5f9', padding: '4px 8px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700 }}>
                            {item.medicineName} ({item.frequency}, {item.durationDays}d)
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            )}

            {/* ----------------------------------------------------------- */}
            {/* DOCTOR ACTION BUTTONS BAR INSIDE CASE                       */}
            {/* ----------------------------------------------------------- */}
            <div
              style={{
                marginTop: '24px',
                paddingTop: '20px',
                borderTop: '2px solid #e2e8f0',
                display: 'flex',
                flexWrap: 'wrap',
                gap: '10px',
              }}
            >
              <button
                type="button"
                onClick={() => setActiveAction(activeAction === 'advice' ? 'none' : 'advice')}
                style={{
                  padding: '12px 18px',
                  borderRadius: '12px',
                  background: activeAction === 'advice' ? '#0d9488' : '#f0fdfa',
                  color: activeAction === 'advice' ? '#ffffff' : '#0d9488',
                  border: '2px solid #0d9488',
                  fontWeight: 800,
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <FileText size={18} />
                <span>{language === 'mr' ? '📋 सल्ला / उपचार द्या' : 'Give Advice / Treatment'}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveAction(activeAction === 'prescribe' ? 'none' : 'prescribe')}
                style={{
                  padding: '12px 18px',
                  borderRadius: '12px',
                  background: activeAction === 'prescribe' ? '#0d9488' : '#f0fdfa',
                  color: activeAction === 'prescribe' ? '#ffffff' : '#0d9488',
                  border: '2px solid #0d9488',
                  fontWeight: 800,
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <span>💊 {language === 'mr' ? 'औषधे लिहून द्या' : 'Prescribe Medicine'}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveAction(activeAction === 'refer' ? 'none' : 'refer')}
                style={{
                  padding: '12px 18px',
                  borderRadius: '12px',
                  background: activeAction === 'refer' ? '#f59e0b' : '#fffbeb',
                  color: activeAction === 'refer' ? '#ffffff' : '#b45309',
                  border: '2px solid #f59e0b',
                  fontWeight: 800,
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <Ambulance size={18} />
                <span>{language === 'mr' ? '🔄 रुग्ण / विभाग रेफर करा' : 'Refer Patient'}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveAction(activeAction === 'followup' ? 'none' : 'followup')}
                style={{
                  padding: '12px 18px',
                  borderRadius: '12px',
                  background: activeAction === 'followup' ? '#ea580c' : '#fff7ed',
                  color: activeAction === 'followup' ? '#ffffff' : '#c2410c',
                  border: '2px solid #ea580c',
                  fontWeight: 800,
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <span>🟠 {language === 'mr' ? 'आशा पाठपुरावा सांगा' : 'Request ASHA Follow-up'}</span>
              </button>

              <button
                type="button"
                onClick={handleMarkComplete}
                style={{
                  padding: '12px 18px',
                  borderRadius: '12px',
                  background: '#15803d',
                  color: '#ffffff',
                  border: 'none',
                  fontWeight: 800,
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginLeft: 'auto',
                }}
              >
                <CheckCircle2 size={18} />
                <span>{language === 'mr' ? '✅ केस पूर्ण करा (Mark Complete)' : 'Mark Case Complete'}</span>
              </button>
            </div>
          </div>

          {/* ----------------------------------------------------------- */}
          {/* INLINE ACTION 1: GIVE TREATMENT / ADVICE                    */}
          {/* ----------------------------------------------------------- */}
          {activeAction === 'advice' && (
            <div className="glass-panel" style={{ padding: '24px', border: '2px solid #0d9488' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--slate-900)', marginTop: 0, marginBottom: '16px' }}>
                📋 {language === 'mr' ? 'डॉक्टरांचा सल्ला व उपचार योजना' : 'Doctor Diagnosis & Treatment Advice'}
              </h3>
              <form onSubmit={handleSaveAdvice} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 700, color: 'var(--slate-700)', marginBottom: '6px' }}>
                    {language === 'mr' ? 'निदान (Diagnosis):' : 'Clinical Diagnosis / Assessment:'}
                  </label>
                  <input
                    type="text"
                    value={adviceDiagnosis}
                    onChange={(e) => setAdviceDiagnosis(e.target.value)}
                    placeholder="e.g. Acute Viral Bronchitis / Stage 1 Hypertension"
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 700, color: 'var(--slate-700)', marginBottom: '6px' }}>
                    {language === 'mr' ? 'डॉक्टरांचा सल्ला (Treatment Advice for Patient & ASHA):' : 'Treatment & Management Advice:'}
                  </label>
                  <textarea
                    rows={4}
                    value={adviceText}
                    onChange={(e) => setAdviceText(e.target.value)}
                    placeholder={
                      language === 'mr'
                        ? 'उदा. भरपूर उकळलेले पाणी प्यावे, ३ दिवस आराम करावा, ताप वाढल्यास पुन्हा तपासावे...'
                        : 'e.g. Rest for 3 days, drink boiled water, sponge with lukewarm water if fever exceeds 101°F...'
                    }
                    className="input-field"
                    required
                  />
                </div>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  <button type="button" onClick={() => setActiveAction('none')} className="btn-secondary">
                    {language === 'mr' ? 'रद्द करा' : 'Cancel'}
                  </button>
                  <button type="submit" disabled={isSubmittingAdvice} className="btn-primary" style={{ padding: '10px 24px' }}>
                    {isSubmittingAdvice ? 'Saving...' : language === 'mr' ? '💾 सल्ला सेव्ह करा' : 'Save Advice & Update Case'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ----------------------------------------------------------- */}
          {/* INLINE ACTION 2: PRESCRIBE MEDICINE                         */}
          {/* ----------------------------------------------------------- */}
          {activeAction === 'prescribe' && (
            <div className="glass-panel" style={{ padding: '24px', border: '2px solid #0d9488' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--slate-900)', margin: 0 }}>
                  💊 {language === 'mr' ? 'डिजिटल औषध प्रिस्क्रिप्शन' : 'Digital Prescription'}
                </h3>
                <span style={{ fontSize: '0.85rem', color: 'var(--slate-500)' }}>
                  {language === 'mr' ? 'रुग्ण:' : 'Patient:'} {selectedCase.patient.name}
                </span>
              </div>

              {/* Quick rural medicine chips */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--slate-600)', marginBottom: '8px' }}>
                  {language === 'mr' ? '+ जलद औषध जोडा (Quick Essential Medicines):' : '+ Quick Add Essential Medicine:'}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {COMMON_MEDICINES.map((med, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => addRxItem(med)}
                      style={{
                        padding: '6px 10px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        background: '#f8fafc',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        color: '#0f172a',
                      }}
                    >
                      + {med.name.split(' ')[0]} {med.name.split(' ')[1]}
                    </button>
                  ))}
                </div>
              </div>

              <form onSubmit={handleSavePrescription} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Medicines List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {rxItems.map((item, index) => (
                    <div
                      key={index}
                      style={{
                        padding: '14px',
                        borderRadius: '12px',
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        display: 'grid',
                        gridTemplateColumns: '2fr 1fr 1.5fr 1fr auto',
                        gap: '10px',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>Medicine Name</label>
                        <input
                          type="text"
                          value={item.medicineName}
                          onChange={(e) => {
                            const updated = [...rxItems];
                            updated[index].medicineName = e.target.value;
                            setRxItems(updated);
                          }}
                          className="input-field"
                          style={{ padding: '8px', fontSize: '0.85rem' }}
                          required
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>Dosage</label>
                        <input
                          type="text"
                          value={item.dosage}
                          onChange={(e) => {
                            const updated = [...rxItems];
                            updated[index].dosage = e.target.value;
                            setRxItems(updated);
                          }}
                          className="input-field"
                          style={{ padding: '8px', fontSize: '0.85rem' }}
                          placeholder="1 tablet"
                          required
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>Frequency</label>
                        <input
                          type="text"
                          value={item.frequency}
                          onChange={(e) => {
                            const updated = [...rxItems];
                            updated[index].frequency = e.target.value;
                            setRxItems(updated);
                          }}
                          className="input-field"
                          style={{ padding: '8px', fontSize: '0.85rem' }}
                          placeholder="1-0-1 after food"
                          required
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>Days</label>
                        <input
                          type="number"
                          value={item.durationDays}
                          onChange={(e) => {
                            const updated = [...rxItems];
                            updated[index].durationDays = parseInt(e.target.value) || 1;
                            setRxItems(updated);
                          }}
                          className="input-field"
                          style={{ padding: '8px', fontSize: '0.85rem' }}
                          min={1}
                          required
                        />
                      </div>

                      <div style={{ paddingTop: '18px' }}>
                        <button
                          type="button"
                          onClick={() => removeRxItem(index)}
                          disabled={rxItems.length <= 1}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: rxItems.length <= 1 ? '#cbd5e1' : '#ef4444',
                            cursor: rxItems.length <= 1 ? 'not-allowed' : 'pointer',
                          }}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => addRxItem()}
                    style={{
                      alignSelf: 'flex-start',
                      padding: '8px 14px',
                      borderRadius: '8px',
                      border: '1px dashed #0d9488',
                      background: '#f0fdfa',
                      color: '#0d9488',
                      fontWeight: 800,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <Plus size={16} /> {language === 'mr' ? 'आणखी एक औषध जोडा' : 'Add Another Medicine'}
                  </button>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 700, color: 'var(--slate-700)', marginBottom: '6px' }}>
                    {language === 'mr' ? 'सामान्य सूचना / सल्ला (General Instructions):' : 'General Prescription Advice:'}
                  </label>
                  <input
                    type="text"
                    value={rxAdvice}
                    onChange={(e) => setRxAdvice(e.target.value)}
                    placeholder="Take full course with plenty of clean water"
                    className="input-field"
                  />
                </div>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                  <button type="button" onClick={() => setActiveAction('none')} className="btn-secondary">
                    {language === 'mr' ? 'रद्द करा' : 'Cancel'}
                  </button>
                  <button type="submit" disabled={isSubmittingRx} className="btn-primary" style={{ padding: '10px 24px' }}>
                    {isSubmittingRx ? 'Issuing...' : language === 'mr' ? '💾 प्रिस्क्रिप्शन जारी करा' : 'Issue Prescription'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ----------------------------------------------------------- */}
          {/* INLINE ACTION 3: REFER PATIENT / CHANGE DEPARTMENT          */}
          {/* ----------------------------------------------------------- */}
          {activeAction === 'refer' && (
            <div className="glass-panel" style={{ padding: '24px', border: '2px solid #f59e0b' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--slate-900)', marginTop: 0, marginBottom: '16px' }}>
                🔄 {language === 'mr' ? 'रुग्ण / विभाग रेफर करा' : 'Refer Patient to Hospital or Another Department'}
              </h3>
              <form onSubmit={handleSaveReferral} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 700, color: 'var(--slate-700)', marginBottom: '6px' }}>
                      {language === 'mr' ? 'रेफर विभाग (Department):' : 'Refer to Department:'}
                    </label>
                    <select
                      value={refDepartment}
                      onChange={(e) => setRefDepartment(e.target.value)}
                      className="input-field"
                    >
                      <option value="General Medicine">General Medicine (सामान्य औषधोपचार)</option>
                      <option value="Pediatrics">Pediatrics (बालरोग विभाग)</option>
                      <option value="Gynecology & Obstetrics">Gynecology & Obstetrics (स्त्रीरोग व प्रसूती)</option>
                      <option value="Emergency Medicine">Emergency / Trauma (तातडीचा विभाग)</option>
                      <option value="Surgery">General Surgery (शस्त्रक्रिया विभाग)</option>
                      <option value="Orthopedics">Orthopedics (अस्थिव्यंग विभाग)</option>
                      <option value="Cardiology">Cardiology (हृदयरोग विभाग)</option>
                      <option value="Other">Other Specialist (इतर तज्ज्ञ)</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 700, color: 'var(--slate-700)', marginBottom: '6px' }}>
                      {language === 'mr' ? 'रुग्णालय (Facility):' : 'Target Health Facility:'}
                    </label>
                    <select
                      value={refFacility}
                      onChange={(e) => setRefFacility(e.target.value)}
                      className="input-field"
                    >
                      <option value="District Hospital Bilaspur">District Hospital Bilaspur (जिल्हा रुग्णालय)</option>
                      <option value="Bilha Community Health Centre (CHC)">Bilha CHC (सामुदायिक आरोग्य केंद्र)</option>
                      <option value="Bilaspur Medical College & Hospital">CIMS Medical College Hospital</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 700, color: 'var(--slate-700)', marginBottom: '6px' }}>
                      {language === 'mr' ? 'प्राधान्य (Priority):' : 'Referral Priority:'}
                    </label>
                    <select
                      value={refPriority}
                      onChange={(e) => setRefPriority(e.target.value as any)}
                      className="input-field"
                    >
                      <option value="STAT">🚨 STAT / Emergency</option>
                      <option value="URGENT">⚠️ Urgent (Within 24h)</option>
                      <option value="ROUTINE">🟢 Routine</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 700, color: 'var(--slate-700)', marginBottom: '6px' }}>
                      {language === 'mr' ? 'रेफर करण्याचे कारण (Reason for Referral):' : 'Reason for Referral:'}
                    </label>
                    <input
                      type="text"
                      value={refReason}
                      onChange={(e) => setRefReason(e.target.value)}
                      placeholder="e.g. Suspected severe infection requiring pediatric admission"
                      className="input-field"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 700, color: 'var(--slate-700)', marginBottom: '6px' }}>
                    {language === 'mr' ? 'रेफर करण्यापूर्वी दिलेला उपचार (Pre-Referral Stabilization):' : 'Pre-Referral Treatment Given:'}
                  </label>
                  <input
                    type="text"
                    value={refPreTreatment}
                    onChange={(e) => setRefPreTreatment(e.target.value)}
                    placeholder="e.g. Paracetamol administered, IV fluid 500ml RL initiated"
                    className="input-field"
                  />
                </div>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  <button type="button" onClick={() => setActiveAction('none')} className="btn-secondary">
                    {language === 'mr' ? 'रद्द करा' : 'Cancel'}
                  </button>
                  <button type="submit" disabled={isSubmittingRef} className="btn-primary" style={{ padding: '10px 24px', background: '#f59e0b' }}>
                    {isSubmittingRef ? 'Referring...' : language === 'mr' ? '🚀 रेफर करा' : 'Submit Referral'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ----------------------------------------------------------- */}
          {/* INLINE ACTION 4: REQUEST ASHA FOLLOW-UP                     */}
          {/* ----------------------------------------------------------- */}
          {activeAction === 'followup' && (
            <div className="glass-panel" style={{ padding: '24px', border: '2px solid #ea580c' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#9a3412', marginTop: 0, marginBottom: '16px' }}>
                🟠 {language === 'mr' ? 'आशा कार्यकर्त्यांसाठी पाठपुरावा सूचना' : 'Request Community Follow-up by ASHA'}
              </h3>
              <form onSubmit={handleSaveFollowup} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 700, color: 'var(--slate-700)', marginBottom: '6px' }}>
                    {language === 'mr' ? 'आशा कार्यकर्त्यांनी काय करावे (Follow-up Task):' : 'Follow-up Instructions for ASHA Worker:'}
                  </label>
                  <textarea
                    rows={3}
                    value={followupNote}
                    onChange={(e) => setFollowupNote(e.target.value)}
                    placeholder="e.g. Visit patient home after 2 days. Measure BP and pulse. Verify medication adherence."
                    className="input-field"
                    required
                  />
                </div>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  <button type="button" onClick={() => setActiveAction('none')} className="btn-secondary">
                    {language === 'mr' ? 'रद्द करा' : 'Cancel'}
                  </button>
                  <button type="submit" disabled={isSubmittingFollowup} className="btn-primary" style={{ padding: '10px 24px', background: '#ea580c' }}>
                    {isSubmittingFollowup ? 'Saving...' : language === 'mr' ? '📤 पाठपुरावा विनंती पाठवा' : 'Send Follow-up Request to ASHA'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ----------------------------------------------------------- */}
          {/* INLINE ACTION 5: VIDEO CONSULTATION ROOM                    */}
          {/* ----------------------------------------------------------- */}
          {activeAction === 'video' && (
            <div className="glass-panel" style={{ padding: '24px', border: '2px solid #0d9488' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }} />
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--slate-900)', margin: 0 }}>
                    🎥 {language === 'mr' ? 'थेट व्हिडिओ सल्लामसलत' : 'Live Video Consultation'}
                  </h3>
                </div>
                <div style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '1.1rem', color: '#0f172a' }}>
                  ⏱️ {Math.floor(callDuration / 60).toString().padStart(2, '0')}:{(callDuration % 60).toString().padStart(2, '0')}
                </div>
              </div>

              {/* Video Frame */}
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  height: '380px',
                  borderRadius: '16px',
                  background: '#0f172a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  color: '#ffffff',
                }}
              >
                {/* Simulated Remote Stream (ASHA & Patient at Rural Point of Care) */}
                <div style={{ textAlign: 'center' }}>
                  <div
                    style={{
                      width: '80px',
                      height: '80px',
                      borderRadius: '50%',
                      background: '#0d9488',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '2rem',
                      margin: '0 auto 12px auto',
                    }}
                  >
                    👩‍⚕️
                  </div>
                  <div style={{ fontWeight: 800, fontSize: '1.2rem' }}>
                    {selectedCase.patient.name} & ASHA {selectedCase.healthWorker?.name || 'Sunita'}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '4px' }}>
                    {selectedCase.facility?.name || 'Bilha Sub-Centre'} • WebRTC Encrypted Stream
                  </div>
                </div>

                {/* Picture in Picture Doctor view */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: '16px',
                    right: '16px',
                    width: '130px',
                    height: '95px',
                    background: '#1e293b',
                    borderRadius: '12px',
                    border: '2px solid #ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#94a3b8',
                    fontSize: '0.75rem',
                  }}
                >
                  👨‍⚕️ Dr. Rajesh
                </div>
              </div>

              {/* Video Controls */}
              <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'center', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setIsMuted(!isMuted)}
                  style={{
                    padding: '10px 16px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    background: isMuted ? '#fee2e2' : '#ffffff',
                    color: isMuted ? '#991b1b' : '#0f172a',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {isMuted ? <MicOff size={18} /> : <Mic size={18} />} {isMuted ? 'Unmute' : 'Mute'}
                </button>

                <button
                  type="button"
                  onClick={() => setIsVideoOff(!isVideoOff)}
                  style={{
                    padding: '10px 16px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    background: isVideoOff ? '#fee2e2' : '#ffffff',
                    color: isVideoOff ? '#991b1b' : '#0f172a',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {isVideoOff ? <VideoOff size={18} /> : <Video size={18} />} {isVideoOff ? 'Start Video' : 'Stop Video'}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveAction('none')}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '10px',
                    border: 'none',
                    background: '#ef4444',
                    color: '#ffffff',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <PhoneOff size={18} /> {language === 'mr' ? 'कॉल समाप्त करा' : 'End Call'}
                </button>
              </div>
            </div>
          )}

          {/* ----------------------------------------------------------- */}
          {/* INLINE ACTION 6: CALL / PHONE OPTIONS                       */}
          {/* ----------------------------------------------------------- */}
          {activeAction === 'call' && (
            <div className="glass-panel" style={{ padding: '24px', border: '2px solid #16a34a' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#15803d', marginTop: 0, marginBottom: '12px' }}>
                📞 {language === 'mr' ? 'थेट फोन कॉल संपर्क' : 'Direct Telephone Call'}
              </h3>
              <p style={{ color: '#475569', fontSize: '0.95rem' }}>
                {language === 'mr'
                  ? 'रुग्ण किंवा त्यांच्या आशा कार्यकर्त्यांशी थेट फोनद्वारे संपर्क साधा:'
                  : 'Connect instantly via voice call with the frontline ASHA worker or patient:'}
              </p>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '16px' }}>
                <a
                  href={`tel:${selectedCase.patient.phone || '+919826112345'}`}
                  className="btn-primary"
                  style={{ background: '#16a34a', textDecoration: 'none', padding: '12px 20px', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                >
                  <Phone size={18} />
                  <span>{language === 'mr' ? 'रुग्णाला कॉल करा' : 'Call Patient'} ({selectedCase.patient.phone || '+91 98261 12345'})</span>
                </a>
                <a
                  href="tel:+919826199999"
                  className="btn-secondary"
                  style={{ textDecoration: 'none', padding: '12px 20px', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                >
                  <Phone size={18} />
                  <span>{language === 'mr' ? 'आशा कार्यकर्त्यांना कॉल करा' : 'Call ASHA Worker'} ({selectedCase.healthWorker?.name || 'Sunita'})</span>
                </a>
                <button type="button" onClick={() => setActiveAction('none')} className="btn-secondary">
                  {language === 'mr' ? 'बंद करा' : 'Close'}
                </button>
              </div>
            </div>
          )}

          {/* ----------------------------------------------------------- */}
          {/* INLINE ACTION 7: MESSAGE OPTIONS                            */}
          {/* ----------------------------------------------------------- */}
          {activeAction === 'message' && (
            <div className="glass-panel" style={{ padding: '24px', border: '2px solid #0284c7' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0369a1', marginTop: 0, marginBottom: '12px' }}>
                💬 {language === 'mr' ? 'एसएमएस / संदेश पाठवा' : 'Send SMS / Alert to ASHA'}
              </h3>
              {messageSent ? (
                <div style={{ padding: '14px', background: '#dcfce7', borderRadius: '10px', color: '#166534', fontWeight: 800 }}>
                  ✓ {language === 'mr' ? 'संदेश यशस्वीरित्या पाठवला आहे.' : 'Message sent successfully to ASHA & Patient.'}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <textarea
                    rows={3}
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="e.g. Please bring patient to PHC tomorrow morning for blood tests."
                    className="input-field"
                  />
                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                    <button type="button" onClick={() => setActiveAction('none')} className="btn-secondary">
                      {language === 'mr' ? 'रद्द करा' : 'Cancel'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMessageSent(true);
                        setTimeout(() => {
                          setMessageSent(false);
                          setActiveAction('none');
                        }, 2000);
                      }}
                      className="btn-primary"
                      style={{ padding: '10px 20px', background: '#0284c7' }}
                    >
                      <Send size={16} /> {language === 'mr' ? 'संदेश पाठवा' : 'Send Message'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* ------------------------------------------------------------- */
        /* 3. CASE LIST VIEW (CASES NEEDING ATTENTION / HISTORY)         */
        /* ------------------------------------------------------------- */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Sub Navigation: Cases Needing Attention vs History */}
          <div
            style={{
              display: 'flex',
              gap: '8px',
              borderBottom: '2px solid #e2e8f0',
              paddingBottom: '2px',
              flexWrap: 'wrap',
            }}
          >
            <button
              onClick={() => setActiveTab('attention')}
              style={{
                padding: '12px 20px',
                fontWeight: 800,
                fontSize: '1rem',
                color: activeTab === 'attention' ? 'var(--primary)' : 'var(--slate-600)',
                borderTop: 'none',
                borderLeft: 'none',
                borderRight: 'none',
                borderBottom: activeTab === 'attention' ? '3px solid var(--primary)' : '3px solid transparent',
                background: 'transparent',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Activity size={18} />
              <span>
                {language === 'mr' ? '📋 तपासणीसाठी केसेस' : 'Cases Needing Attention'} ({attentionCases.length})
              </span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              style={{
                padding: '12px 20px',
                fontWeight: 800,
                fontSize: '1rem',
                color: activeTab === 'history' ? 'var(--primary)' : 'var(--slate-600)',
                borderTop: 'none',
                borderLeft: 'none',
                borderRight: 'none',
                borderBottom: activeTab === 'history' ? '3px solid var(--primary)' : '3px solid transparent',
                background: 'transparent',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <CheckCircle2 size={18} />
              <span>
                {language === 'mr' ? '📜 इतिहास / पूर्ण केसेस (History)' : 'History (Completed)'} ({historyCases.length})
              </span>
            </button>
          </div>

          {/* Filter & Search Bar */}
          <div
            className="glass-panel"
            style={{
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            {/* Search Input */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1 1 260px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  borderRadius: '10px',
                  padding: '8px 12px',
                  width: '100%',
                }}
              >
                <Search size={16} color="#64748b" />
                <input
                  type="text"
                  placeholder={language === 'mr' ? 'रुग्णाचे नाव किंवा गाव शोधा...' : 'Search patient name or village...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    outline: 'none',
                    width: '100%',
                    fontSize: '0.88rem',
                    fontWeight: 600,
                  }}
                />
              </div>
            </div>

            {/* Urgency Filter Chips */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--slate-600)' }}>
                {language === 'mr' ? 'प्राधान्य:' : 'Urgency:'}
              </span>
              {(['ALL', 'RED', 'YELLOW', 'GREEN'] as const).map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setRiskFilter(lvl)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    border: 'none',
                    cursor: 'pointer',
                    background:
                      riskFilter === lvl
                        ? lvl === 'RED'
                          ? '#ef4444'
                          : lvl === 'YELLOW'
                          ? '#f59e0b'
                          : lvl === 'GREEN'
                          ? '#10b981'
                          : '#0f172a'
                        : '#f1f5f9',
                    color: riskFilter === lvl ? '#ffffff' : '#334155',
                  }}
                >
                  {lvl === 'ALL'
                    ? language === 'mr'
                      ? 'सर्व (All)'
                      : 'All'
                    : lvl === 'RED'
                    ? language === 'mr'
                      ? '🚨 तातडीचा (Emergency)'
                      : '🚨 Emergency'
                    : lvl === 'YELLOW'
                    ? language === 'mr'
                      ? '⚠️ महत्त्वाचा (Urgent)'
                      : '⚠️ Urgent'
                    : language === 'mr'
                    ? '🟢 नियमित (Routine)'
                    : '🟢 Routine'}
                </button>
              ))}
            </div>
          </div>

          {/* Empty State */}
          {filteredCases.length === 0 ? (
            <div
              className="glass-panel"
              style={{
                padding: '48px 24px',
                textAlign: 'center',
                color: '#64748b',
              }}
            >
              <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>
                {activeTab === 'attention' ? '🎉' : '📂'}
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: '0 0 6px 0' }}>
                {activeTab === 'attention'
                  ? language === 'mr'
                    ? 'सध्या कोणतीही प्रलंबित केस नाही!'
                    : 'No pending cases waiting for attention!'
                  : language === 'mr'
                  ? 'इतिहास रिक्त आहे.'
                  : 'No completed cases in history.'}
              </h3>
              <p style={{ fontSize: '0.9rem', maxWidth: '420px', margin: '0 auto' }}>
                {activeTab === 'attention'
                  ? language === 'mr'
                    ? 'आशा कार्यकर्त्यांनी नोंदवलेले नवीन रुग्ण येथे तात्काळ दिसतील.'
                    : 'Cases submitted by ASHA workers will appear here immediately for medical review.'
                  : language === 'mr'
                  ? 'डॉक्टरांनी पूर्ण केलेले सर्व केस येथे सुरक्षित राहतील.'
                  : 'Cases marked as complete by the doctor will be preserved here permanently.'}
              </p>
            </div>
          ) : (
            /* Case Cards Grid */
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '16px' }}>
              {filteredCases.map((enc) => (
                <div
                  key={enc.id}
                  className="glass-panel"
                  style={{
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    borderTop: `5px solid ${
                      enc.riskLevel === 'RED'
                        ? '#ef4444'
                        : enc.riskLevel === 'YELLOW'
                        ? '#f59e0b'
                        : '#10b981'
                    }`,
                  }}
                >
                  <div>
                    {/* Header: Name, Urgency, Status */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                      <div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--slate-900)' }}>
                          {enc.patient.name}
                        </div>
                        <div style={{ fontSize: '0.82rem', color: 'var(--slate-600)', fontWeight: 600, marginTop: '2px' }}>
                          {enc.patient.age}y, {enc.patient.gender} • {enc.patient.village || 'Bilha'}
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                        {getUrgencyBadge(enc.riskLevel)}
                        {getStatusBadge(enc.status)}
                      </div>
                    </div>

                    {/* Vitals Summary Strip */}
                    <div
                      style={{
                        marginTop: '12px',
                        background: '#f8fafc',
                        padding: '10px',
                        borderRadius: '10px',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(4, 1fr)',
                        gap: '6px',
                        textAlign: 'center',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700 }}>BP</div>
                        <div style={{ fontWeight: 800, fontSize: '0.85rem', color: (enc.systolicBP || 0) >= 160 ? '#ef4444' : 'inherit' }}>
                          {enc.systolicBP || '--'}/{enc.diastolicBP || '--'}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700 }}>SpO₂</div>
                        <div style={{ fontWeight: 800, fontSize: '0.85rem', color: (enc.spo2 || 100) < 94 ? '#ef4444' : 'inherit' }}>
                          {enc.spo2 || '--'}%
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700 }}>Pulse</div>
                        <div style={{ fontWeight: 800, fontSize: '0.85rem' }}>{enc.pulseRate || '--'}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700 }}>Temp</div>
                        <div style={{ fontWeight: 800, fontSize: '0.85rem', color: (enc.temperatureF || 0) >= 101 ? '#ef4444' : 'inherit' }}>
                          {enc.temperatureF || '--'}°F
                        </div>
                      </div>
                    </div>

                    {/* Symptoms */}
                    <div style={{ marginTop: '12px', fontSize: '0.85rem' }}>
                      <span style={{ fontWeight: 700, color: 'var(--slate-700)' }}>
                        {language === 'mr' ? 'लक्षणे:' : 'Symptoms:'}
                      </span>{' '}
                      <span style={{ color: 'var(--slate-900)', fontWeight: 600 }}>
                        {enc.chiefComplaints.split(', ').map(c => getSymptomLabel(c)).join(', ')}
                      </span>
                    </div>

                    {/* Submitted by ASHA */}
                    <div style={{ marginTop: '10px', fontSize: '0.78rem', color: 'var(--slate-500)' }}>
                      👩‍⚕️ Submitted by {enc.healthWorker?.name || 'ASHA Sunita'} • {new Date(enc.encounterDate).toLocaleDateString()}
                    </div>
                  </div>

                  {/* Open Case Action */}
                  <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #e2e8f0' }}>
                    <button
                      type="button"
                      onClick={() => handleOpenCase(enc)}
                      className="btn-primary"
                      style={{
                        width: '100%',
                        padding: '10px',
                        fontSize: '0.9rem',
                        fontWeight: 800,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                      }}
                    >
                      <span>📂 {language === 'mr' ? 'केस उघडा व उपचार करा' : 'Open Case'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
