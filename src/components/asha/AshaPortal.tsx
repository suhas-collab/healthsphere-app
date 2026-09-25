'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Heart,
  Activity,
  Thermometer,
  Droplets,
  AlertTriangle,
  CheckCircle,
  Wifi,
  WifiOff,
  RefreshCw,
  UserPlus,
  Search,
  Phone,
  Calendar,
  Send,
  UserCheck,
  CheckCircle2,
  Clock,
  ChevronRight,
  X,
  Stethoscope,
  ArrowRight,
  ShieldAlert,
  AlertCircle,
  FileText,
  User,
  MapPin,
  Pill,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useSyncEngine } from '@/lib/offline/useSyncEngine';
import { offlineDb, evaluateClinicalRisk, LocalPatient, LocalEncounter } from '@/lib/offline/db';
import { getAuthHeaders } from '@/lib/auth/client';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import SpeakButton from '@/components/common/SpeakButton';
import { DEMO_PATIENTS, DEMO_ENCOUNTERS } from '@/lib/demoData';

const COMMON_COMPLAINTS = [
  'High Grade Fever (>3 days)',
  'Severe Breathlessness / Fast Breathing',
  'Chest Pain / Radiating Discomfort',
  'Acute Watery Diarrhea / Vomiting',
  'Severe Throbbing Headache',
  'Blurred Vision / Flashes',
  'Vaginal Bleeding in Pregnancy',
  'Convulsions / Fits / Involuntary Shaking',
  'Severe Abdominal Pain',
  'Pediatric Lethargy / Poor Feeding',
  'Chronic Joint Pain & Swelling',
  'Persistent Cough with Sputum (>2 weeks)',
];

export default function AshaPortal() {
  const {
    isOnline,
    isSyncing,
    pendingCount,
    lastSyncTime,
    syncError,
    syncNow,
    saveLocalPatient,
    saveLocalEncounter,
  } = useSyncEngine();

  const { language, t, getSymptomLabel, speakText } = useLanguage();
  const isMarathi = language === 'mr';

  // Navigation mode: 'my_care' | 'find_patient' | 'register_patient' | 'record_case'
  const [activeMode, setActiveMode] = useState<'my_care' | 'find_patient' | 'register_patient' | 'record_case'>('my_care');

  // Care status filter: 'ALL' | 'WAITING_FOR_DOCTOR' | 'DOCTOR_REVIEWING' | 'DOCTOR_RESPONDED' | 'FOLLOWUP_REQUIRED' | 'COMPLETED'
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Patients and Cases (Pre-populated synchronously with realistic demo dataset)
  const [patients, setPatients] = useState<LocalPatient[]>(DEMO_PATIENTS as any);
  const [encounters, setEncounters] = useState<any[]>(DEMO_ENCOUNTERS);
  const [careListPatientIds, setCareListPatientIds] = useState<string[]>([
    'pat-1',
    'pat-001',
    'pat-003',
    'pat-005',
    'pat-004',
  ]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedPatient, setSelectedPatient] = useState<LocalPatient | null>(null);
  const [selectedCaseModal, setSelectedCaseModal] = useState<any | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New Patient Registration Form
  const [regName, setRegName] = useState('');
  const [regAge, setRegAge] = useState('');
  const [regGender, setRegGender] = useState<'female' | 'male' | 'other'>('female');
  const [regPhone, setRegPhone] = useState('');
  const [regVillage, setRegVillage] = useState('Sakarra');
  const [regGuardian, setRegGuardian] = useState('');
  const [regBloodGroup, setRegBloodGroup] = useState('B+');
  const [regIsPregnant, setRegIsPregnant] = useState(false);
  const [regWeeks, setRegWeeks] = useState('24');
  const [regEdd, setRegEdd] = useState('');
  const [isSubmittingPatient, setIsSubmittingPatient] = useState(false);

  // Clinical Symptoms & Vitals Form
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [durationDays, setDurationDays] = useState('2');
  const [tempF, setTempF] = useState('99.0');
  const [systolicBP, setSystolicBP] = useState('120');
  const [diastolicBP, setDiastolicBP] = useState('80');
  const [pulseRate, setPulseRate] = useState('76');
  const [spo2, setSpo2] = useState('98');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [urgencyOverride, setUrgencyOverride] = useState<'RED' | 'YELLOW' | 'GREEN'>('GREEN');
  const [isSubmittingCase, setIsSubmittingCase] = useState(false);

  // Load data from Dexie & Server (Background silent merge)
  const loadData = async () => {
    try {
      const localPats = await offlineDb.patients.toArray();
      const localEncs = await offlineDb.triageEncounters.toArray();

      // If online, fetch latest from server
      if (typeof window !== 'undefined' && navigator.onLine) {
        try {
          const headers = getAuthHeaders('ASHA');
          const [serverPatRes, serverEncRes] = await Promise.all([
            fetch('/api/patients', { headers }),
            fetch('/api/encounters', { headers }),
          ]);
          if (serverPatRes.ok) {
            const data = await serverPatRes.json();
            const serverPatients: LocalPatient[] = data.patients || [];
            // Merge unique, preserving demo records
            const map = new Map<string, LocalPatient>();
            DEMO_PATIENTS.forEach((p: any) => map.set(p.id, p));
            localPats.forEach((p) => map.set(p.id, p));
            serverPatients.forEach((p) => map.set(p.id, p));
            setPatients(Array.from(map.values()));
          }

          if (serverEncRes.ok) {
            const data = await serverEncRes.json();
            const serverEncs = data.encounters || [];
            const encMap = new Map<string, any>();
            DEMO_ENCOUNTERS.forEach((e) => encMap.set(e.id, e));
            localEncs.forEach((e) => encMap.set(e.id, e));
            serverEncs.forEach((e: any) => encMap.set(e.id, e));
            setEncounters(Array.from(encMap.values()));
          }
        } catch {
          // Keep existing populated data
        }
      }
    } catch (e) {
      console.error('Error loading ASHA data:', e);
    }
  };

  useEffect(() => {
    loadData();
    // Load local care list ids
    try {
      const savedCare = localStorage.getItem('asha_care_list');
      if (savedCare) {
        const parsed = JSON.parse(savedCare);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCareListPatientIds((prev) => Array.from(new Set([...prev, ...parsed])));
        }
      }
    } catch {}
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Add/Remove from My Care List
  const toggleCareList = (patientId: string) => {
    const updated = careListPatientIds.includes(patientId)
      ? careListPatientIds.filter((id) => id !== patientId)
      : [...careListPatientIds, patientId];
    setCareListPatientIds(updated);
    try {
      localStorage.setItem('asha_care_list', JSON.stringify(updated));
    } catch {}
    showToast(
      careListPatientIds.includes(patientId)
        ? (isMarathi ? 'रुग्ण काळजी यादीतून काढला.' : 'Patient removed from My Care list.')
        : (isMarathi ? '✓ रुग्ण काळजी यादीत जोडला गेला.' : '✓ Patient added to My Care list.')
    );
  };

  // Handle Register Patient
  const handleRegisterPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regPhone.trim()) {
      showToast(isMarathi ? 'कृपया नाव आणि फोन नंबर टाका.' : 'Please enter patient name and phone.');
      return;
    }

    setIsSubmittingPatient(true);
    try {
      const abhaId = `91-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`;
      const saved = await saveLocalPatient({
        abhaId,
        abhaAddress: `${regName.toLowerCase().replace(/[^a-z0-9]/g, '')}@abdm`,
        name: regName.trim(),
        gender: regGender,
        age: parseInt(regAge) || 30,
        phone: regPhone.trim(),
        guardianName: regGuardian.trim() || undefined,
        village: regVillage.trim() || 'Sakarra',
        subCentre: 'Bilaspur SC',
        block: 'Bilha',
        district: 'Bilaspur',
        bloodGroup: regBloodGroup,
        isPregnant: regIsPregnant,
        gestationalWeeks: regIsPregnant ? parseInt(regWeeks) || 20 : undefined,
        edd: regIsPregnant && regEdd ? regEdd : undefined,
      });

      confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
      showToast(isMarathi ? `✓ ${saved.name} यांची नोंदणी झाली!` : `✓ Registered ${saved.name}!`);

      // Add to Care List automatically
      const updatedCare = Array.from(new Set([...careListPatientIds, saved.id]));
      setCareListPatientIds(updatedCare);
      try {
        localStorage.setItem('asha_care_list', JSON.stringify(updatedCare));
      } catch {}

      await loadData();
      setSelectedPatient(saved);
      setActiveMode('record_case');
    } catch (err: any) {
      showToast(err.message || 'Registration failed');
    } finally {
      setIsSubmittingPatient(false);
    }
  };

  // Dynamic risk calculation
  const computedRisk = useMemo(() => {
    return evaluateClinicalRisk({
      temperatureF: parseFloat(tempF) || 98.6,
      systolicBP: parseInt(systolicBP) || 120,
      diastolicBP: parseInt(diastolicBP) || 80,
      pulseRate: parseInt(pulseRate) || 72,
      spo2: parseFloat(spo2) || 98,
      chiefComplaints: selectedSymptoms,
      isPregnant: selectedPatient?.isPregnant || false,
      gestationalWeeks: selectedPatient?.gestationalWeeks,
      age: selectedPatient?.age || 30,
    });
  }, [tempF, systolicBP, diastolicBP, pulseRate, spo2, selectedSymptoms, selectedPatient]);

  const effectiveRiskLevel = urgencyOverride === 'RED' ? 'RED' : computedRisk.riskLevel;

  // Handle Send to Doctor
  const handleSendToDoctor = async () => {
    if (!selectedPatient) return;
    if (selectedSymptoms.length === 0 && !clinicalNotes.trim()) {
      showToast(isMarathi ? 'कृपया किमान एक लक्षण किंवा निरीक्षण नोंदवा.' : 'Please select at least one symptom or note.');
      return;
    }

    setIsSubmittingCase(true);
    try {
      const newEncounter = await saveLocalEncounter({
        patientId: selectedPatient.id,
        patientAbhaId: selectedPatient.abhaId,
        patientName: selectedPatient.name,
        patientAge: selectedPatient.age,
        patientGender: selectedPatient.gender,
        patientVillage: selectedPatient.village,
        healthWorkerId: 'worker-asha-001',
        healthWorkerName: 'Sunita Devi (ASHA)',
        facilityId: 'fac-sc-bilaspur-01',
        facilityName: 'Bilaspur Health Sub-Centre',
        encounterDate: new Date().toISOString(),
        temperatureF: tempF ? parseFloat(tempF) : undefined,
        systolicBP: systolicBP ? parseInt(systolicBP) : undefined,
        diastolicBP: diastolicBP ? parseInt(diastolicBP) : undefined,
        pulseRate: pulseRate ? parseInt(pulseRate) : undefined,
        spo2: spo2 ? parseFloat(spo2) : undefined,
        chiefComplaints: selectedSymptoms,
        durationDays: parseInt(durationDays) || 2,
        clinicalNotes: clinicalNotes.trim(),
        riskLevel: effectiveRiskLevel,
        triageRationale: computedRisk.rationale.join('; ') || 'Community triage assessment by ASHA',
        isHighRiskMaternal: selectedPatient.isPregnant || computedRisk.isMaternalHighRisk,
        isHighRiskChild: computedRisk.isChildHighRisk,
        dangerSigns: computedRisk.dangerSigns.join(', ') || undefined,
        status: 'WAITING_FOR_DOCTOR',
      });

      confetti({ particleCount: 70, spread: 70, origin: { y: 0.6 } });
      const msg = isMarathi
        ? `🚀 केस प्राथमिक आरोग्य केंद्र डॉक्टरांकडे पाठवली! स्थिती: 🟡 डॉक्टरांची प्रतीक्षा.`
        : `🚀 Case sent to Doctor! Status: 🟡 Waiting for Doctor.`;
      showToast(msg);
      speakText(isMarathi ? 'केस डॉक्टरांकडे पाठवली गेली आहे.' : 'Case sent to Doctor.', isMarathi ? 'mr-IN' : 'en-IN');

      // Add to Care List
      const updatedCare = Array.from(new Set([...careListPatientIds, selectedPatient.id]));
      setCareListPatientIds(updatedCare);
      try {
        localStorage.setItem('asha_care_list', JSON.stringify(updatedCare));
      } catch {}

      // Reset
      setSelectedSymptoms([]);
      setClinicalNotes('');
      await loadData();
      setActiveMode('my_care');
    } catch (err: any) {
      showToast(err.message || 'Failed to submit case to doctor');
    } finally {
      setIsSubmittingCase(false);
    }
  };

  // Search filtered patients
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return patients.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.phone.includes(q) ||
        p.village.toLowerCase().includes(q) ||
        p.abhaId.includes(q)
    );
  }, [patients, searchQuery]);

  // Filtered Care Cases
  const careCases = useMemo(() => {
    // Collect all encounters for patients in careListPatientIds or all recent encounters
    let cases = encounters.map((enc) => {
      const pat = patients.find((p) => p.id === enc.patientId) || enc.patient || { name: 'Patient', age: 30, village: 'Sakarra' };
      return {
        ...enc,
        patientData: pat,
      };
    });

    if (statusFilter !== 'ALL') {
      cases = cases.filter((c) => (c.status || 'WAITING_FOR_DOCTOR') === statusFilter);
    }

    return cases;
  }, [encounters, patients, statusFilter]);

  // Status Badge Component
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'WAITING_FOR_DOCTOR':
      case 'UNDER_REVIEW':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#fef9c3', color: '#854d0e', padding: '4px 10px', borderRadius: '12px', fontSize: '0.82rem', fontWeight: 800 }}>
            🟡 {isMarathi ? 'डॉक्टरांची प्रतीक्षा' : 'Waiting for Doctor'}
          </span>
        );
      case 'DOCTOR_REVIEWING':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#dbeafe', color: '#1e40af', padding: '4px 10px', borderRadius: '12px', fontSize: '0.82rem', fontWeight: 800 }}>
            🔵 {isMarathi ? 'डॉक्टर तपासत आहेत' : 'Doctor Reviewing'}
          </span>
        );
      case 'DOCTOR_RESPONDED':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#dcfce7', color: '#166534', padding: '4px 10px', borderRadius: '12px', fontSize: '0.82rem', fontWeight: 800 }}>
            🟢 {isMarathi ? 'डॉक्टरांचा सल्ला आला' : 'Doctor Responded'}
          </span>
        );
      case 'FOLLOWUP_REQUIRED':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#ffedd5', color: '#9a3412', padding: '4px 10px', borderRadius: '12px', fontSize: '0.82rem', fontWeight: 800 }}>
            🟠 {isMarathi ? 'पुन्हा तपासणी आवश्यक' : 'Follow-up Required'}
          </span>
        );
      case 'COMPLETED':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#f1f5f9', color: '#475569', padding: '4px 10px', borderRadius: '12px', fontSize: '0.82rem', fontWeight: 800 }}>
            ✅ {isMarathi ? 'पूर्ण झाले' : 'Completed'}
          </span>
        );
      default:
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#fef9c3', color: '#854d0e', padding: '4px 10px', borderRadius: '12px', fontSize: '0.82rem', fontWeight: 800 }}>
            🟡 {isMarathi ? 'डॉक्टरांची प्रतीक्षा' : 'Waiting for Doctor'}
          </span>
        );
    }
  };

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div
          role="status"
          style={{
            position: 'fixed',
            top: '76px',
            right: '20px',
            zIndex: 9999,
            background: '#0f172a',
            color: '#ffffff',
            padding: '12px 20px',
            borderRadius: '14px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
            fontSize: '0.92rem',
            fontWeight: 700,
            animation: 'slideIn 0.2s ease',
          }}
        >
          {toastMessage}
        </div>
      )}

      {/* ASHA Header & Overview Card */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)',
          borderRadius: '24px',
          padding: '24px 28px',
          color: '#ffffff',
          boxShadow: '0 8px 24px rgba(13, 148, 136, 0.22)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '4px 10px', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 800 }}>
              {isMarathi ? 'आशा समुदाय आरोग्य सेविका' : 'ASHA Community Health Worker'}
            </span>
            <span style={{ fontSize: '0.8rem', opacity: 0.9 }}>📍 {isMarathi ? 'बिलासपूर उपकेंद्र' : 'Bilaspur Sub-Centre'}</span>
          </div>
          <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 900, letterSpacing: '-0.5px' }}>
            {isMarathi ? 'सुनिता देवी • समुदाय रुग्णसेवा' : 'Sunita Devi • Frontline Community Care'}
          </h1>
          <p style={{ margin: '6px 0 0 0', fontSize: '0.9rem', opacity: 0.9 }}>
            {isMarathi
              ? 'गावातील रुग्णांची नोंदणी करा, लक्षणे तपासा आणि थेट पीएचसी डॉक्टरांकडे पाठवा.'
              : 'Register village patients, record symptoms, and send cases directly to PHC doctors.'}
          </p>
        </div>

        {/* Offline Vault & Sync Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => syncNow()}
            disabled={isSyncing}
            style={{
              background: 'rgba(255,255,255,0.18)',
              border: '1px solid rgba(255,255,255,0.3)',
              color: '#ffffff',
              padding: '8px 14px',
              borderRadius: '12px',
              fontSize: '0.84rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
            <span>{isSyncing ? (isMarathi ? 'सिंक होत आहे...' : 'Syncing...') : (isMarathi ? 'सिंक करा' : 'Sync Now')}</span>
            {pendingCount > 0 && (
              <span style={{ background: '#f59e0b', color: '#ffffff', padding: '1px 6px', borderRadius: '10px', fontSize: '0.72rem' }}>
                {pendingCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Primary Workflow Actions (Find, Register, My Care) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '12px',
        }}
      >
        <button
          type="button"
          onClick={() => setActiveMode('my_care')}
          style={{
            padding: '16px 20px',
            borderRadius: '18px',
            border: activeMode === 'my_care' ? '2.5px solid #0d9488' : '1.5px solid #e2e8f0',
            background: activeMode === 'my_care' ? '#f0fdfa' : '#ffffff',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            cursor: 'pointer',
            boxShadow: activeMode === 'my_care' ? '0 4px 14px rgba(13,148,136,0.15)' : 'none',
            transition: 'all 0.15s ease',
          }}
        >
          <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#ccfbf1', color: '#0f766e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Heart size={22} />
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#0f172a' }}>
              {isMarathi ? 'माझी काळजी यादी' : 'My Care List'}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
              {careCases.length} {isMarathi ? 'सक्रिय केसेस' : 'active cases tracking'}
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveMode('find_patient');
            setSearchQuery('');
          }}
          style={{
            padding: '16px 20px',
            borderRadius: '18px',
            border: activeMode === 'find_patient' ? '2.5px solid #0d9488' : '1.5px solid #e2e8f0',
            background: activeMode === 'find_patient' ? '#f0fdfa' : '#ffffff',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            cursor: 'pointer',
            boxShadow: activeMode === 'find_patient' ? '0 4px 14px rgba(13,148,136,0.15)' : 'none',
            transition: 'all 0.15s ease',
          }}
        >
          <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#e0e7ff', color: '#3730a3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Search size={22} />
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#0f172a' }}>
              {isMarathi ? 'रुग्ण शोधा' : 'Find Patient'}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
              {isMarathi ? 'मोबाईल किंवा नावाने शोधा' : 'Search by phone, name, or ID'}
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveMode('register_patient');
            setSelectedPatient(null);
          }}
          style={{
            padding: '16px 20px',
            borderRadius: '18px',
            border: activeMode === 'register_patient' ? '2.5px solid #0d9488' : '1.5px solid #e2e8f0',
            background: activeMode === 'register_patient' ? '#f0fdfa' : '#ffffff',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            cursor: 'pointer',
            boxShadow: activeMode === 'register_patient' ? '0 4px 14px rgba(13,148,136,0.15)' : 'none',
            transition: 'all 0.15s ease',
          }}
        >
          <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#fef3c7', color: '#92400e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <UserPlus size={22} />
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#0f172a' }}>
              {isMarathi ? 'नवीन रुग्ण नोंदणी' : 'Register New Patient'}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
              {isMarathi ? 'गावातील नवीन व्यक्ती जोडा' : 'Add new village citizen'}
            </div>
          </div>
        </button>
      </div>

      {/* Selected Patient Banner if in record_case mode */}
      {selectedPatient && activeMode === 'record_case' && (
        <div
          style={{
            background: '#ffffff',
            borderRadius: '18px',
            padding: '16px 20px',
            border: '2px solid #0d9488',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: '#ccfbf1', color: '#0f766e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '1.2rem' }}>
              {selectedPatient.name.charAt(0)}
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.15rem', color: '#0f172a' }}>
                {selectedPatient.name} ({selectedPatient.age} {isMarathi ? 'वर्षे' : 'yrs'}, {selectedPatient.gender})
              </div>
              <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                📞 {selectedPatient.phone} • 📍 {selectedPatient.village} {selectedPatient.isPregnant && `• 🤰 ${selectedPatient.gestationalWeeks || 20}w`}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={() => toggleCareList(selectedPatient.id)}
              style={{
                padding: '8px 14px',
                borderRadius: '10px',
                border: '1.5px solid #cbd5e1',
                background: careListPatientIds.includes(selectedPatient.id) ? '#f0fdf4' : '#ffffff',
                color: careListPatientIds.includes(selectedPatient.id) ? '#166534' : '#334155',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {careListPatientIds.includes(selectedPatient.id)
                ? (isMarathi ? '✓ काळजी यादीत आहे' : '✓ In My Care List')
                : (isMarathi ? '📌 काळजी यादीत जोडा' : '📌 Add to Care List')}
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedPatient(null);
                setActiveMode('my_care');
              }}
              style={{
                padding: '8px 12px',
                borderRadius: '10px',
                border: 'none',
                background: '#f1f5f9',
                color: '#64748b',
                cursor: 'pointer',
              }}
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* MODE 1: FIND PATIENT */}
      {/* -------------------------------------------------------------------- */}
      {activeMode === 'find_patient' && (
        <div style={{ background: '#ffffff', borderRadius: '24px', padding: '24px', border: '1.5px solid #e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
          <h2 style={{ margin: '0 0 16px 0', fontSize: '1.35rem', fontWeight: 900, color: '#0f172a' }}>
            {isMarathi ? '🔍 गावातील रुग्ण शोधा' : '🔍 Find Village Patient'}
          </h2>

          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <Search size={18} style={{ position: 'absolute', left: '16px', top: '16px', color: '#94a3b8' }} />
              <input
                type="text"
                placeholder={isMarathi ? 'मोबाईल नंबर किंवा नाव टाका (उदा. 9876543210 / प्रिया)...' : 'Enter mobile number, name, or ABHA ID...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '14px 16px 14px 44px',
                  borderRadius: '14px',
                  border: '2px solid #0d9488',
                  fontSize: '1rem',
                  fontWeight: 600,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
                autoFocus
              />
            </div>
            <button
              type="button"
              onClick={() => {
                setActiveMode('register_patient');
                setRegPhone(searchQuery.replace(/\D/g, '').slice(-10));
              }}
              style={{
                padding: '14px 20px',
                borderRadius: '14px',
                border: 'none',
                background: '#0d9488',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '0.95rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              + {isMarathi ? 'नवीन नोंदणी' : 'Register New'}
            </button>
          </div>

          {/* Search Results */}
          {searchQuery.trim() && (
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#64748b', marginBottom: '10px' }}>
                {searchResults.length} {isMarathi ? 'रुग्ण सापडले' : 'patients found'}
              </div>

              {searchResults.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px', background: '#f8fafc', borderRadius: '16px' }}>
                  <p style={{ margin: '0 0 12px 0', color: '#64748b', fontWeight: 600 }}>
                    {isMarathi ? 'या माहितीचा रुग्ण सापडला नाही.' : 'No registered patient found with these details.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveMode('register_patient');
                      setRegPhone(searchQuery.replace(/\D/g, '').slice(-10));
                      setRegName(searchQuery.replace(/[0-9]/g, '').trim());
                    }}
                    style={{
                      padding: '10px 18px',
                      borderRadius: '12px',
                      border: 'none',
                      background: '#0d9488',
                      color: '#ffffff',
                      fontWeight: 800,
                      cursor: 'pointer',
                    }}
                  >
                    + {isMarathi ? `या नंबरवर नवीन रुग्ण नोंदवा` : `Register new patient now`}
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {searchResults.map((p) => (
                    <div
                      key={p.id}
                      style={{
                        padding: '14px 18px',
                        borderRadius: '14px',
                        border: '1.5px solid #e2e8f0',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: '#ffffff',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '1.05rem' }}>{p.name}</div>
                        <div style={{ fontSize: '0.84rem', color: '#64748b' }}>
                          {p.age} {isMarathi ? 'वर्षे' : 'yrs'} • {p.gender} • 📞 {p.phone} • 📍 {p.village}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedPatient(p);
                            setActiveMode('record_case');
                          }}
                          style={{
                            padding: '8px 16px',
                            borderRadius: '10px',
                            border: 'none',
                            background: '#0d9488',
                            color: '#ffffff',
                            fontWeight: 800,
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                          }}
                        >
                          {isMarathi ? 'तपासा / डॉक्टरांकडे पाठवा ➔' : 'Triage / Send to Doctor ➔'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* MODE 2: REGISTER NEW PATIENT */}
      {/* -------------------------------------------------------------------- */}
      {activeMode === 'register_patient' && (
        <form onSubmit={handleRegisterPatient} style={{ background: '#ffffff', borderRadius: '24px', padding: '24px', border: '1.5px solid #e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 900, color: '#0f172a' }}>
              {isMarathi ? '➕ नवीन रुग्ण नोंदणी' : '➕ Register New Patient'}
            </h2>
            <button type="button" onClick={() => setActiveMode('my_care')} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>
              <X size={20} />
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: '#334155', marginBottom: '6px' }}>
                {isMarathi ? 'पूर्ण नाव *' : 'Full Name *'}
              </label>
              <input
                type="text"
                required
                placeholder={isMarathi ? 'रुग्णाचे नाव' : 'Patient Name'}
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1.5px solid #cbd5e1', fontSize: '0.95rem', fontWeight: 600, outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: '#334155', marginBottom: '6px' }}>
                {isMarathi ? 'मोबाईल नंबर *' : 'Mobile Phone *'}
              </label>
              <input
                type="tel"
                required
                placeholder="9876543210"
                value={regPhone}
                onChange={(e) => setRegPhone(e.target.value)}
                style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1.5px solid #cbd5e1', fontSize: '0.95rem', fontWeight: 600, outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: '#334155', marginBottom: '6px' }}>
                {isMarathi ? 'वय *' : 'Age *'}
              </label>
              <input
                type="number"
                required
                placeholder="30"
                value={regAge}
                onChange={(e) => setRegAge(e.target.value)}
                style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1.5px solid #cbd5e1', fontSize: '0.95rem', fontWeight: 600, outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: '#334155', marginBottom: '6px' }}>
                {isMarathi ? 'लिंग *' : 'Gender *'}
              </label>
              <select
                value={regGender}
                onChange={(e: any) => setRegGender(e.target.value)}
                style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1.5px solid #cbd5e1', fontSize: '0.95rem', fontWeight: 600, outline: 'none', boxSizing: 'border-box' }}
              >
                <option value="female">{isMarathi ? 'स्त्री (Female)' : 'Female'}</option>
                <option value="male">{isMarathi ? 'पुरुष (Male)' : 'Male'}</option>
                <option value="other">{isMarathi ? 'इतर (Other)' : 'Other'}</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: '#334155', marginBottom: '6px' }}>
                {isMarathi ? 'गाव / वस्ती *' : 'Village *'}
              </label>
              <input
                type="text"
                required
                placeholder={isMarathi ? 'गावाचे नाव' : 'Village Name'}
                value={regVillage}
                onChange={(e) => setRegVillage(e.target.value)}
                style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1.5px solid #cbd5e1', fontSize: '0.95rem', fontWeight: 600, outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: '#334155', marginBottom: '6px' }}>
                {isMarathi ? 'पालक / पतीचे नाव' : 'Guardian / Spouse Name'}
              </label>
              <input
                type="text"
                placeholder={isMarathi ? 'पालकांचे नाव' : 'Guardian Name'}
                value={regGuardian}
                onChange={(e) => setRegGuardian(e.target.value)}
                style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1.5px solid #cbd5e1', fontSize: '0.95rem', fontWeight: 600, outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          {/* Maternal Checkbox */}
          <div style={{ background: '#f8fafc', padding: '14px 18px', borderRadius: '14px', marginBottom: '20px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontWeight: 700, color: '#0f172a' }}>
              <input
                type="checkbox"
                checked={regIsPregnant}
                onChange={(e) => setRegIsPregnant(e.target.checked)}
                style={{ width: '18px', height: '18px' }}
              />
              <span>🤰 {isMarathi ? 'रुग्ण गरोदर माता आहे का? (Maternal ANC)' : 'Is patient pregnant? (Maternal Care)'}</span>
            </label>

            {regIsPregnant && (
              <div style={{ display: 'flex', gap: '16px', marginTop: '12px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.8rem', color: '#64748b' }}>{isMarathi ? 'गरोदर आठवडे (Weeks)' : 'Gestational Weeks'}</label>
                  <input
                    type="number"
                    value={regWeeks}
                    onChange={(e) => setRegWeeks(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.8rem', color: '#64748b' }}>{isMarathi ? 'प्रसूतीची अंदाजे तारीख (EDD)' : 'Expected Date of Delivery'}</label>
                  <input
                    type="date"
                    value={regEdd}
                    onChange={(e) => setRegEdd(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                </div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button
              type="button"
              onClick={() => setActiveMode('my_care')}
              style={{ padding: '12px 18px', borderRadius: '12px', border: '1.5px solid #cbd5e1', background: '#ffffff', color: '#475569', fontWeight: 700, cursor: 'pointer' }}
            >
              {isMarathi ? 'रद्द करा' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={isSubmittingPatient}
              style={{ padding: '12px 24px', borderRadius: '12px', border: 'none', background: '#0d9488', color: '#ffffff', fontWeight: 800, fontSize: '1rem', cursor: 'pointer' }}
            >
              {isSubmittingPatient ? (isMarathi ? 'जतन करत आहे...' : 'Saving...') : (isMarathi ? 'जतन करा आणि पुढे जा ➔' : 'Save & Continue ➔')}
            </button>
          </div>
        </form>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* MODE 3: RECORD CASE & SEND TO DOCTOR */}
      {/* -------------------------------------------------------------------- */}
      {selectedPatient && activeMode === 'record_case' && (
        <div style={{ background: '#ffffff', borderRadius: '24px', padding: '24px', border: '1.5px solid #e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <span style={{ background: '#fef3c7', color: '#92400e', padding: '4px 10px', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 800 }}>
                {isMarathi ? 'पायरी २ • लक्षणे नोंदवा व डॉक्टरांकडे पाठवा' : 'Step 2 • Record Symptoms & Send to Doctor'}
              </span>
              <h2 style={{ margin: '6px 0 0 0', fontSize: '1.4rem', fontWeight: 900, color: '#0f172a' }}>
                {selectedPatient.name} {isMarathi ? 'यांचे आरोग्य मूल्यमापन' : '- Clinical Assessment'}
              </h2>
            </div>
            <SpeakButton text={`${selectedPatient.name}. Please select symptoms and vitals.`} />
          </div>

          {/* Quick Symptoms Multi-select */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
              {isMarathi ? '१. प्रमुख लक्षणे निवडा (Chief Symptoms) *' : '1. Select Chief Symptoms *'}
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {COMMON_COMPLAINTS.map((comp) => {
                const isSelected = selectedSymptoms.includes(comp);
                return (
                  <button
                    key={comp}
                    type="button"
                    onClick={() => {
                      setSelectedSymptoms((prev) =>
                        isSelected ? prev.filter((c) => c !== comp) : [...prev, comp]
                      );
                    }}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '12px',
                      border: isSelected ? '2px solid #0d9488' : '1.5px solid #cbd5e1',
                      background: isSelected ? '#ccfbf1' : '#ffffff',
                      color: isSelected ? '#0f766e' : '#334155',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.1s ease',
                    }}
                  >
                    {isSelected && '✓ '}
                    {getSymptomLabel(comp)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Vitals Form */}
          <div style={{ background: '#f8fafc', padding: '18px', borderRadius: '18px', marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 800, color: '#0f172a', marginBottom: '12px' }}>
              {isMarathi ? '२. उपलब्ध शारीरिक नोंदी (Available Vitals)' : '2. Available Patient Vitals'}
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 700 }}>🌡️ {isMarathi ? 'ताप (°F)' : 'Temp (°F)'}</label>
                <input
                  type="number"
                  step="0.1"
                  value={tempF}
                  onChange={(e) => setTempF(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontWeight: 700 }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 700 }}>💓 {isMarathi ? 'सिस्टोलिक बीपी' : 'Systolic BP'}</label>
                <input
                  type="number"
                  value={systolicBP}
                  onChange={(e) => setSystolicBP(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontWeight: 700 }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 700 }}>💓 {isMarathi ? 'डायस्टोलिक बीपी' : 'Diastolic BP'}</label>
                <input
                  type="number"
                  value={diastolicBP}
                  onChange={(e) => setDiastolicBP(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontWeight: 700 }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 700 }}>💨 {isMarathi ? 'ऑक्सिजन SpO₂ (%)' : 'SpO2 (%)'}</label>
                <input
                  type="number"
                  value={spo2}
                  onChange={(e) => setSpo2(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontWeight: 700 }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 700 }}>⏱️ {isMarathi ? 'कालावधी (दिवस)' : 'Duration (Days)'}</label>
                <input
                  type="number"
                  value={durationDays}
                  onChange={(e) => setDurationDays(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontWeight: 700 }}
                />
              </div>
            </div>
          </div>

          {/* Observations and Urgency */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 800, color: '#0f172a', marginBottom: '6px' }}>
              {isMarathi ? '३. आशा सेविकेचे निरीक्षण / नोंद (Observations)' : '3. ASHA Field Observations & Notes'}
            </label>
            <textarea
              rows={2}
              placeholder={isMarathi ? 'उदा. खूप थकवा दिसत आहे, जेवण जात नाही, औषधोपचार आवश्यक वाटतो...' : 'e.g., Patient looks very weak, unable to eat, needs doctor evaluation...'}
              value={clinicalNotes}
              onChange={(e) => setClinicalNotes(e.target.value)}
              style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1.5px solid #cbd5e1', fontSize: '0.95rem', boxSizing: 'border-box', outline: 'none' }}
            />
          </div>

          {/* Urgency Badge Indicator */}
          <div style={{ padding: '14px 18px', borderRadius: '14px', background: effectiveRiskLevel === 'RED' ? '#fef2f2' : effectiveRiskLevel === 'YELLOW' ? '#fffbeb' : '#f0fdf4', border: `1.5px solid ${effectiveRiskLevel === 'RED' ? '#f87171' : effectiveRiskLevel === 'YELLOW' ? '#fde047' : '#86efac'}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
            <div>
              <div style={{ fontWeight: 800, color: effectiveRiskLevel === 'RED' ? '#b91c1c' : effectiveRiskLevel === 'YELLOW' ? '#854d0e' : '#15803d' }}>
                {effectiveRiskLevel === 'RED' ? '🚨 आणीबाणी / तातडीने डॉक्टर हवेत (Emergency / Red Flag)' : effectiveRiskLevel === 'YELLOW' ? '⚠️ मध्यम जोखीम (Doctor Attention Needed)' : '🟢 सामान्य तपासणी (Routine Checkup)'}
              </div>
              <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
                {computedRisk.rationale.join('; ') || (isMarathi ? 'मापदंडांनुसार मूल्यांकन' : 'Calculated by triage engine')}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                type="button"
                onClick={() => setUrgencyOverride('RED')}
                style={{
                  padding: '6px 10px',
                  borderRadius: '8px',
                  border: 'none',
                  background: urgencyOverride === 'RED' ? '#ef4444' : '#fee2e2',
                  color: urgencyOverride === 'RED' ? '#ffffff' : '#991b1b',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                🚨 {isMarathi ? 'तातडीची आणीबाणी' : 'Mark Emergency'}
              </button>
            </div>
          </div>

          {/* Submit to Doctor Button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button
              type="button"
              onClick={() => setActiveMode('my_care')}
              style={{ padding: '14px 20px', borderRadius: '14px', border: '1.5px solid #cbd5e1', background: '#ffffff', color: '#475569', fontWeight: 700, cursor: 'pointer' }}
            >
              {isMarathi ? 'मागे जा' : 'Back'}
            </button>
            <button
              type="button"
              disabled={isSubmittingCase}
              onClick={handleSendToDoctor}
              style={{
                padding: '14px 28px',
                borderRadius: '14px',
                border: 'none',
                background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)',
                color: '#ffffff',
                fontWeight: 900,
                fontSize: '1.05rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(13,148,136,0.3)',
              }}
            >
              <Send size={18} />
              <span>{isSubmittingCase ? (isMarathi ? 'पाठवत आहे...' : 'Sending...') : (isMarathi ? 'डॉक्टरांकडे पाठवा ➔' : 'Send to Doctor ➔')}</span>
            </button>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* MODE 4: MY CARE TRACKING DASHBOARD */}
      {/* -------------------------------------------------------------------- */}
      {activeMode === 'my_care' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Status Filter Pills */}
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
            {[
              { id: 'ALL', labelMr: 'सर्व केसेस', labelEn: 'All Cases' },
              { id: 'WAITING_FOR_DOCTOR', labelMr: '🟡 डॉक्टरांची प्रतीक्षा', labelEn: '🟡 Waiting for Doctor' },
              { id: 'DOCTOR_RESPONDED', labelMr: '🟢 डॉक्टरांचा सल्ला आला', labelEn: '🟢 Doctor Responded' },
              { id: 'FOLLOWUP_REQUIRED', labelMr: '🟠 पुन्हा तपासणी हवी', labelEn: '🟠 Follow-up Due' },
              { id: 'COMPLETED', labelMr: '✅ पूर्ण झालेल्या', labelEn: '✅ Completed' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                style={{
                  padding: '8px 14px',
                  borderRadius: '20px',
                  border: statusFilter === tab.id ? '2px solid #0d9488' : '1.5px solid #cbd5e1',
                  background: statusFilter === tab.id ? '#0d9488' : '#ffffff',
                  color: statusFilter === tab.id ? '#ffffff' : '#334155',
                  fontSize: '0.84rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.1s ease',
                }}
              >
                {isMarathi ? tab.labelMr : tab.labelEn}
              </button>
            ))}
          </div>

          {/* Cases List */}
          {careCases.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', background: '#ffffff', borderRadius: '24px', border: '1.5px solid #e2e8f0' }}>
              <Heart size={44} color="#0d9488" style={{ marginBottom: '12px', opacity: 0.6 }} />
              <h3 style={{ margin: '0 0 8px 0', fontSize: '1.25rem', color: '#0f172a' }}>
                {isMarathi ? 'सध्या या वर्गवारीत कोणतीही केस नाही.' : 'No cases in this status category.'}
              </h3>
              <p style={{ margin: '0 0 16px 0', color: '#64748b', fontSize: '0.9rem' }}>
                {isMarathi ? 'गावातील रुग्ण शोधून किंवा नोंदणी करून थेट डॉक्टरांकडे पाठवा.' : 'Find or register a village patient to send their case to the doctor.'}
              </p>
              <button
                type="button"
                onClick={() => setActiveMode('find_patient')}
                style={{
                  padding: '10px 20px',
                  borderRadius: '12px',
                  border: 'none',
                  background: '#0d9488',
                  color: '#ffffff',
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                🔍 {isMarathi ? 'रुग्ण शोधा किंवा जोडा' : 'Find or Register Patient'}
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: '14px' }}>
              {careCases.map((c) => {
                const pat = c.patientData || {};
                const status = c.status || 'WAITING_FOR_DOCTOR';
                const complaintsStr = Array.isArray(c.chiefComplaints) ? c.chiefComplaints.join(', ') : c.chiefComplaints || 'General malaise';
                const isRed = c.riskLevel === 'RED';

                return (
                  <div
                    key={c.id}
                    style={{
                      background: '#ffffff',
                      borderRadius: '20px',
                      padding: '18px 20px',
                      border: isRed ? '2px solid #f87171' : '1.5px solid #e2e8f0',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '14px',
                    }}
                  >
                    <div>
                      {/* Top status & urgency */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        {renderStatusBadge(status)}
                        {isRed && (
                          <span style={{ background: '#fee2e2', color: '#991b1b', fontSize: '0.72rem', fontWeight: 800, padding: '2px 8px', borderRadius: '6px' }}>
                            🚨 {isMarathi ? 'आणीबाणी' : 'Emergency'}
                          </span>
                        )}
                      </div>

                      {/* Patient Details */}
                      <h3 style={{ margin: '0 0 4px 0', fontSize: '1.2rem', fontWeight: 900, color: '#0f172a' }}>
                        {pat.name}
                      </h3>
                      <div style={{ fontSize: '0.84rem', color: '#64748b', marginBottom: '10px' }}>
                        {pat.age} {isMarathi ? 'वर्षे' : 'yrs'} • {pat.gender} • 📍 {pat.village || 'Sakarra'}
                      </div>

                      {/* Symptoms */}
                      <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '10px', fontSize: '0.86rem', color: '#334155', fontWeight: 600, marginBottom: '10px' }}>
                        🩺 {complaintsStr}
                      </div>

                      {/* Doctor response snippet if available */}
                      {c.doctorAdvice && (
                        <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '10px 12px', borderRadius: '10px', fontSize: '0.85rem', color: '#065f46', fontWeight: 600, marginBottom: '6px' }}>
                          💬 <strong>{isMarathi ? 'डॉक्टरांचा सल्ला:' : 'Doctor Advice:'}</strong> {c.doctorAdvice}
                        </div>
                      )}
                    </div>

                    {/* Action button */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '10px' }}>
                      <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                        {c.encounterDate ? new Date(c.encounterDate).toLocaleDateString() : 'Today'}
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectedCaseModal(c)}
                        style={{
                          padding: '8px 14px',
                          borderRadius: '10px',
                          border: 'none',
                          background: '#0d9488',
                          color: '#ffffff',
                          fontSize: '0.85rem',
                          fontWeight: 800,
                          cursor: 'pointer',
                        }}
                      >
                        {isMarathi ? 'केस पहा ➔' : 'View Case ➔'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Case Details & Follow-up Modal */}
      {selectedCaseModal && (
        <div
          role="dialog"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '24px',
              maxWidth: '600px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '24px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 700 }}>
                  {isMarathi ? 'आशा पाठपुरावा व केस तपशील' : 'ASHA Follow-up & Case Details'}
                </div>
                <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900, color: '#0f172a' }}>
                  {selectedCaseModal.patientData?.name}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCaseModal(null)}
                style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Status pill */}
            <div style={{ marginBottom: '16px' }}>
              {renderStatusBadge(selectedCaseModal.status || 'WAITING_FOR_DOCTOR')}
            </div>

            {/* Vitals Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', background: '#f8fafc', padding: '14px', borderRadius: '14px', marginBottom: '16px' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{isMarathi ? 'तापमान' : 'Temperature'}</span>
                <div style={{ fontWeight: 800 }}>{selectedCaseModal.temperatureF || 98.6}°F</div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>BP</span>
                <div style={{ fontWeight: 800 }}>{selectedCaseModal.systolicBP || 120}/{selectedCaseModal.diastolicBP || 80}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>SpO2</span>
                <div style={{ fontWeight: 800 }}>{selectedCaseModal.spo2 || 98}%</div>
              </div>
            </div>

            {/* Symptoms & Notes */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#334155', marginBottom: '4px' }}>
                {isMarathi ? 'लक्षणे व आशा नोंद:' : 'Symptoms & Field Notes:'}
              </div>
              <div style={{ color: '#0f172a', fontWeight: 600 }}>
                {Array.isArray(selectedCaseModal.chiefComplaints) ? selectedCaseModal.chiefComplaints.join(', ') : selectedCaseModal.chiefComplaints}
              </div>
              {selectedCaseModal.clinicalNotes && (
                <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '4px' }}>
                  {selectedCaseModal.clinicalNotes}
                </div>
              )}
            </div>

            {/* Doctor Advice / Treatment */}
            <div style={{ background: '#f0fdf4', border: '1.5px solid #86efac', padding: '16px', borderRadius: '16px', marginBottom: '20px' }}>
              <div style={{ fontWeight: 800, color: '#166534', fontSize: '0.95rem', marginBottom: '6px' }}>
                🩺 {isMarathi ? 'डॉक्टरांचा सल्ला व उपचार (Doctor Advice)' : 'Doctor Advice & Plan'}
              </div>
              <div style={{ fontSize: '0.9rem', color: '#14532d' }}>
                {selectedCaseModal.doctorAdvice || (isMarathi ? 'डॉक्टरांनी अद्याप सल्ला दिलेला नाही. केस प्रतीक्षेत आहे.' : 'Case is currently waiting for doctor evaluation.')}
              </div>
            </div>

            {/* Follow-up actions */}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await fetch('/api/encounters', {
                      method: 'PATCH',
                      headers: {
                        'Content-Type': 'application/json',
                        ...getAuthHeaders('ASHA'),
                      },
                      body: JSON.stringify({
                        id: selectedCaseModal.id,
                        status: 'COMPLETED',
                        clinicalNotes: `${selectedCaseModal.clinicalNotes || ''} [ASHA Follow-up completed]`,
                      }),
                    });
                    showToast(isMarathi ? '✓ केस पूर्ण म्हणून चिन्हांकित केली!' : '✓ Case marked completed!');
                    setSelectedCaseModal(null);
                    await loadData();
                  } catch (e) {
                    showToast('Failed to update case');
                  }
                }}
                style={{
                  padding: '12px 20px',
                  borderRadius: '12px',
                  border: 'none',
                  background: '#0d9488',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                }}
              >
                ✓ {isMarathi ? 'पाठपुरावा पूर्ण झाला (Mark Complete)' : 'Mark Follow-up Completed'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
