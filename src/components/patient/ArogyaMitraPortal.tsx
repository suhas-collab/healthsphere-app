'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Heart,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  User,
  Pill,
  Calendar,
  Building2,
  FileText,
  PhoneCall,
  ArrowLeft,
  ChevronRight,
  Check,
  Plus,
  LogOut,
  ShieldCheck,
  Info,
  Clock,
  Activity,
  AlertCircle,
  Stethoscope,
  X,
  Sparkles,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { useSyncEngine } from '@/lib/offline/useSyncEngine';
import { offlineDb, LocalPatient, LocalEncounter } from '@/lib/offline/db';
import { getAuthHeaders, setClientAuth } from '@/lib/auth/client';
import { patientAuth, PatientSession } from '@/lib/auth/patientAuth';
import { DEMO_PATIENTS, DEMO_ENCOUNTERS, DEMO_PRESCRIPTIONS, DEMO_APPOINTMENTS } from '@/lib/demoData';

const DEFAULT_DEMO_SESSION: PatientSession = {
  patientId: 'pat-1',
  name: 'Ramesh Patel',
  phone: '+91 98261 77889',
  village: 'Ramgarh',
  loginTime: '2026-03-24T10:00:00.000Z',
};

const DEFAULT_PATIENT_RECORD = {
  id: 'pat-1',
  name: 'Ramesh Patel',
  age: 45,
  gender: 'male' as const,
  phone: '+91 98261 77889',
  village: 'Ramgarh',
  block: 'Bilha',
  district: 'Bilaspur',
  abhaId: '91-5555-6666-7777',
  bloodGroup: 'B+',
  chronicConditions: ['Hypertension (Stage 1)', 'Mild Asthma'],
  allergies: ['Penicillin (Mild rash)'],
  syncStatus: 'synced' as const,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export default function ArogyaMitraPortal() {
  const { language, setLanguage, speakText, stopSpeaking, isSpeaking, getSymptomLabel } = useLanguage();
  const { isOnline, saveLocalPatient, saveLocalEncounter } = useSyncEngine();

  const isMarathi = language === 'mr';

  // Session State (Direct Evaluation Bypass: Pre-populated with Ramesh Patel)
  const [session, setSession] = useState<PatientSession | null>(DEFAULT_DEMO_SESSION);
  const [loginStep, setLoginStep] = useState<'phone' | 'otp'>('phone');
  const [loginPhone, setLoginPhone] = useState('');
  const [loginOtp, setLoginOtp] = useState('');
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

  // Clinical records (Synchronously populated immediately for evaluation)
  const [patientRecord, setPatientRecord] = useState<any>(DEFAULT_PATIENT_RECORD);
  const [prescriptions, setPrescriptions] = useState<any[]>(DEMO_PRESCRIPTIONS);
  const [encounters, setEncounters] = useState<any[]>(DEMO_ENCOUNTERS.filter(e => e.patientId === 'pat-1'));

  // Appointment Booking Modals
  const [showVoiceBooking, setShowVoiceBooking] = useState(false);
  const [showManualBooking, setShowManualBooking] = useState(false);

  // Voice Booking State Machine
  const [voiceStep, setVoiceStep] = useState<'listening' | 'followup' | 'confirm' | 'booked'>('listening');
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [detectedSymptoms, setDetectedSymptoms] = useState<string[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState('General Medicine');
  const [followupAnswer, setFollowupAnswer] = useState('');
  const [isListeningSpeech, setIsListeningSpeech] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Manual Booking State
  const [manualSymptoms, setManualSymptoms] = useState('');
  const [manualDept, setManualDept] = useState('General Medicine');
  const [manualDate, setManualDate] = useState('Tomorrow Morning, 10:00 AM');
  const [manualNotes, setManualNotes] = useState('');
  const [isBookingManual, setIsBookingManual] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  // Register New Patient State
  const [showRegister, setShowRegister] = useState(false);
  const [regForm, setRegForm] = useState({
    name: '',
    age: '',
    gender: 'female' as 'female' | 'male' | 'other',
    phone: '',
    village: '',
  });

  // Countdown timer for OTP
  useEffect(() => {
    if (otpCountdown > 0) {
      const timer = setTimeout(() => setOtpCountdown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpCountdown]);

  // Load patient clinical data
  const loadPatientData = useCallback(async (patientId: string) => {
    try {
      // 1. Patient profile
      const localPat = await offlineDb.patients.get(patientId);
      if (localPat) setPatientRecord(localPat);

      if (typeof window !== 'undefined' && navigator.onLine) {
        try {
          const patRes = await fetch(`/api/patients?id=${encodeURIComponent(patientId)}`, {
            headers: getAuthHeaders('PATIENT'),
          });
          if (patRes.ok) {
            const data = await patRes.json();
            const found = data.patients?.find((p: any) => p.id === patientId) || data.patients?.[0];
            if (found) setPatientRecord(found);
          }
        } catch {}
      }

      // 2. Prescriptions
      try {
        const rxRes = await fetch(`/api/prescriptions?patientId=${encodeURIComponent(patientId)}`, {
          headers: getAuthHeaders('PATIENT'),
        });
        if (rxRes.ok) {
          const rxData = await rxRes.json();
          if (rxData.prescriptions && rxData.prescriptions.length > 0) {
            setPrescriptions(rxData.prescriptions);
          }
        }
      } catch {}

      // 3. Encounters & Appointments
      try {
        const encRes = await fetch(`/api/encounters?patientId=${encodeURIComponent(patientId)}`, {
          headers: getAuthHeaders('PATIENT'),
        });
        if (encRes.ok) {
          const encData = await encRes.json();
          if (encData.encounters && encData.encounters.length > 0) {
            setEncounters(encData.encounters);
          }
        }
      } catch {}
    } catch (err) {
      console.error('Failed to load patient data:', err);
    }
  }, []);

  // Load existing session on mount and background refresh
  useEffect(() => {
    let existing = patientAuth.getSession();
    if (!existing) {
      patientAuth.saveSession(DEFAULT_DEMO_SESSION);
      existing = DEFAULT_DEMO_SESSION;
    }
    const pid = existing.patientId;
    setClientAuth('PATIENT', `swasthya_patient_${pid}`);
    loadPatientData(pid);
  }, [loadPatientData]);

  useEffect(() => {
    if (session?.patientId) {
      loadPatientData(session.patientId);
    }
  }, [session, loadPatientData]);

  // Handle Quick Demo Login (for evaluators)
  const handleDemoLogin = async (demoName: string, demoPhone: string, demoVillage: string) => {
    try {
      const allLocal = await offlineDb.patients.toArray();
      let match = allLocal.find((p) => p.name.toLowerCase().includes(demoName.toLowerCase().split(' ')[0]));

      if (!match) {
        // Create demo patient if not yet present
        const demoPatient = {
          abhaId: `91-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`,
          name: demoName,
          age: demoName.includes('Ravi') ? 42 : 36,
          gender: (demoName.includes('Ravi') ? 'male' : 'female') as 'male' | 'female',
          phone: demoPhone,
          village: demoVillage,
          block: 'Bilha',
          district: 'Bilaspur',
          isPregnant: demoName.includes('Lakshmi') ? true : false,
        };
        match = await saveLocalPatient(demoPatient);
      }

      const newSession: PatientSession = {
        patientId: match.id,
        name: match.name,
        phone: match.phone || demoPhone,
        village: match.village || demoVillage,
        loginTime: new Date().toISOString(),
      };

      patientAuth.saveSession(newSession);
      setSession(newSession);
      setClientAuth('PATIENT', `swasthya_patient_${match.id}`);
      setPatientRecord(match);
      loadPatientData(match.id);
    } catch (err) {
      console.error('Demo login error:', err);
    }
  };

  // OTP Login
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    const cleanDigits = loginPhone.trim().replace(/\D/g, '').slice(-10);

    if (cleanDigits.length < 10) {
      setLoginError(isMarathi ? 'कृपया १० अंकांचा मोबाईल नंबर टाका.' : 'Please enter a 10-digit mobile number.');
      return;
    }

    setIsLoggingIn(true);
    try {
      const res = await patientAuth.sendOtp(cleanDigits);
      if (res.success) {
        setLoginStep('otp');
        setOtpCountdown(60);
      } else {
        setLoginError(isMarathi ? res.messageMr : res.message);
      }
    } catch {
      setLoginError('Could not send OTP. Please try demo login.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    const cleanDigits = loginPhone.trim().replace(/\D/g, '').slice(-10);
    const cleanOtp = loginOtp.trim().replace(/\D/g, '');

    setIsVerifyingOtp(true);
    try {
      const res = await patientAuth.verifyOtp(cleanDigits, cleanOtp);
      if (res.verified && res.patient) {
        const newSession: PatientSession = {
          patientId: res.patient.id,
          name: res.patient.name,
          phone: res.patient.phone || cleanDigits,
          village: res.patient.village,
          loginTime: new Date().toISOString(),
        };
        patientAuth.saveSession(newSession);
        setSession(newSession);
        setClientAuth('PATIENT', res.token || `swasthya_patient_${res.patient.id}`);
        setPatientRecord(res.patient as any);
        loadPatientData(res.patient.id);
      } else {
        setLoginError(isMarathi ? res.messageMr : res.message);
      }
    } catch {
      setLoginError('OTP verification failed.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleLogout = () => {
    stopSpeaking();
    patientAuth.clearSession();
    // For evaluation build: immediately reset to demo session rather than blank login screen
    setSession(DEFAULT_DEMO_SESSION);
    setPatientRecord(DEFAULT_PATIENT_RECORD);
    setPrescriptions(DEMO_PRESCRIPTIONS);
    setEncounters(DEMO_ENCOUNTERS.filter((e) => e.patientId === 'pat-1'));
  };

  // Voice-Assisted Booking Handlers
  const handleVoiceInput = (text: string) => {
    setVoiceTranscript(text);
    const lower = text.toLowerCase();

    const symptoms: string[] = [];
    if (lower.includes('ताप') || lower.includes('fever') || lower.includes('hot')) symptoms.push('Fever');
    if (lower.includes('खोकला') || lower.includes('cough')) symptoms.push('Cough');
    if (lower.includes('डोकेदुखी') || lower.includes('headache')) symptoms.push('Severe Headache');
    if (lower.includes('पोट') || lower.includes('stomach') || lower.includes('vomit') || lower.includes('उलटी')) symptoms.push('Abdominal Pain / Vomiting');
    if (lower.includes('श्वास') || lower.includes('breath')) symptoms.push('Breathlessness');
    if (lower.includes('बाळ') || lower.includes('baby') || lower.includes('child')) symptoms.push('Pediatric Fever');

    if (symptoms.length === 0) symptoms.push('General Malaise / Fever');

    setDetectedSymptoms(symptoms);

    // Map department
    if (lower.includes('बाळ') || lower.includes('child') || lower.includes('baby')) {
      setSelectedDepartment('Pediatrics (बालरोग विभाग)');
    } else if (lower.includes('गर्भवती') || lower.includes('pregnant') || lower.includes(' ANC')) {
      setSelectedDepartment('Gynecology & Obstetrics (स्त्रीरोग विभाग)');
    } else if (lower.includes('श्वास') || lower.includes('छाती') || lower.includes('chest')) {
      setSelectedDepartment('Emergency / Chest Medicine');
    } else {
      setSelectedDepartment('General Medicine (सामान्य औषधोपचार विभाग)');
    }

    setVoiceStep('followup');

    const spokenPrompt = isMarathi
      ? 'लक्षणे नोंदवली आहेत: ताप व खोकला. काही दिवसांपासून इतर काही त्रास किंवा श्वास घेण्यास त्रास आहे का?'
      : 'Symptoms noted: fever and cough. Any chest pain or difficulty breathing?';
    speakText(spokenPrompt, isMarathi ? 'mr-IN' : 'en-IN');
  };

  const handleConfirmVoiceBooking = async () => {
    if (!session?.patientId) return;

    try {
      const newEncounterData: Omit<LocalEncounter, 'id' | 'syncStatus'> = {
        patientId: session.patientId,
        patientAbhaId: patientRecord?.abhaId || '91-1000-2000-3000',
        patientName: patientRecord?.name || session.name,
        patientAge: patientRecord?.age || 30,
        patientGender: patientRecord?.gender || 'female',
        patientVillage: patientRecord?.village || session.village || 'Bilha',
        facilityId: 'PHC-RAMGARH',
        facilityName: 'Ramgarh Primary Health Centre',
        healthWorkerId: 'HW-PATIENT-PORTAL',
        healthWorkerName: 'Patient Self-Service Portal',
        encounterDate: new Date().toISOString(),
        chiefComplaints: [detectedSymptoms.join(', ')],
        riskLevel: detectedSymptoms.includes('Breathlessness') ? 'RED' : 'GREEN',
        triageRationale: `Voice-assisted booking. Department: ${selectedDepartment}. Follow-up note: ${followupAnswer || 'None'}`,
        isHighRiskMaternal: false,
        isHighRiskChild: false,
        status: 'WAITING_FOR_DOCTOR',
      };

      await saveLocalEncounter(newEncounterData);
      confetti({ particleCount: 70, spread: 60 });
      setVoiceStep('booked');
      loadPatientData(session.patientId);

      const successMsg = isMarathi
        ? 'तुमची डॉक्टरांची भेट निश्चित झाली आहे! डॉक्टर लवकरच केस तपासतील.'
        : 'Appointment booked successfully! Doctor will review your case shortly.';
      speakText(successMsg, isMarathi ? 'mr-IN' : 'en-IN');

      setTimeout(() => {
        setShowVoiceBooking(false);
        setVoiceStep('listening');
        setVoiceTranscript('');
      }, 2500);
    } catch (err) {
      console.error('Error booking voice appointment:', err);
    }
  };

  // Manual Booking Submit
  const handleManualBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.patientId || !manualSymptoms) return;

    try {
      setIsBookingManual(true);
      const newEncounterData: Omit<LocalEncounter, 'id' | 'syncStatus'> = {
        patientId: session.patientId,
        patientAbhaId: patientRecord?.abhaId || '91-1000-2000-3000',
        patientName: patientRecord?.name || session.name,
        patientAge: patientRecord?.age || 30,
        patientGender: patientRecord?.gender || 'female',
        patientVillage: patientRecord?.village || session.village || 'Bilha',
        facilityId: 'PHC-RAMGARH',
        facilityName: 'Ramgarh Primary Health Centre',
        healthWorkerId: 'HW-PATIENT-PORTAL',
        healthWorkerName: 'Patient Self-Service Portal',
        encounterDate: new Date().toISOString(),
        chiefComplaints: [manualSymptoms],
        riskLevel: manualSymptoms.toLowerCase().includes('chest') ? 'RED' : 'GREEN',
        triageRationale: `Manual Patient Booking for ${manualDept}. Preferred time: ${manualDate}. Notes: ${manualNotes || 'None'}`,
        isHighRiskMaternal: false,
        isHighRiskChild: false,
        status: 'WAITING_FOR_DOCTOR',
      };

      await saveLocalEncounter(newEncounterData);
      confetti({ particleCount: 70, spread: 60 });
      setBookingSuccess(true);
      loadPatientData(session.patientId);

      setTimeout(() => {
        setBookingSuccess(false);
        setShowManualBooking(false);
        setManualSymptoms('');
        setManualNotes('');
      }, 2000);
    } catch (err) {
      console.error('Manual booking error:', err);
    } finally {
      setIsBookingManual(false);
    }
  };

  // ---------------------------------------------------------------------------
  // 1. LOGIN SCREEN (IF NO SESSION & EVALUATION BYPASS DISABLED)
  // ---------------------------------------------------------------------------
  // Requirement 4: For current MVP evaluation, remove patient login/OTP requirement.
  // The patient interface opens directly for evaluation with pre-populated demo patient.
  // Real authentication & OTP service code is preserved for production.
  const EVALUATION_BYPASS_PATIENT_LOGIN = true;
  if (!session && !EVALUATION_BYPASS_PATIENT_LOGIN) {
    return (
      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '24px 16px' }}>
        <div
          className="glass-panel"
          style={{
            padding: '32px 24px',
            border: '2px solid #0d9488',
            borderRadius: '24px',
            boxShadow: '0 8px 30px rgba(13, 148, 136, 0.15)',
          }}
        >
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '20px',
                background: 'linear-gradient(135deg, #0d9488 0%, #065f46 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 14px auto',
                boxShadow: '0 4px 14px rgba(13, 148, 136, 0.35)',
              }}
            >
              <Heart size={36} fill="#ffffff" />
            </div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0f172a', margin: '0 0 6px 0' }}>
              Arogya Mitra
            </h1>
            <div style={{ fontSize: '1rem', color: '#0d9488', fontWeight: 700 }}>
              {isMarathi ? 'नागरिक / रुग्ण आरोग्य पोर्टल' : 'Patient & Citizen Health Portal'}
            </div>
          </div>

          {/* Quick Demo Login Option for Evaluators */}
          <div
            style={{
              padding: '16px',
              borderRadius: '16px',
              background: '#f0fdfa',
              border: '1px solid #99f6e4',
              marginBottom: '24px',
            }}
          >
            <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f766e', marginBottom: '10px' }}>
              ⚡ {isMarathi ? 'त्वरित डेमो लॉगिन (मूल्यांकनसाठी):' : 'Quick Demo Login (For Evaluation):'}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button
                type="button"
                onClick={() => handleDemoLogin('Ravi Kumar', '+91 98261 11223', 'Ramgarh')}
                style={{
                  padding: '10px 12px',
                  borderRadius: '10px',
                  background: '#ffffff',
                  border: '1px solid #0d9488',
                  color: '#0f766e',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                👤 Ravi Kumar
                <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>42y • Ramgarh</div>
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin('Lakshmi Devi', '+91 98261 44556', 'Bilha')}
                style={{
                  padding: '10px 12px',
                  borderRadius: '10px',
                  background: '#ffffff',
                  border: '1px solid #0d9488',
                  color: '#0f766e',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                🤰 Lakshmi Devi
                <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>28y • Bilha (ANC)</div>
              </button>
            </div>
          </div>

          {/* Mobile Login Form */}
          {loginStep === 'phone' ? (
            <form onSubmit={handleRequestOtp} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
                  {isMarathi ? 'तुमचा १०-अंकी मोबाईल नंबर टाका:' : 'Enter 10-digit Mobile Number:'}
                </label>
                <div style={{ display: 'flex', alignItems: 'center', border: '2px solid #cbd5e1', borderRadius: '12px', overflow: 'hidden' }}>
                  <span style={{ padding: '12px 14px', background: '#f1f5f9', fontWeight: 800, color: '#334155' }}>🇮🇳 +91</span>
                  <input
                    type="tel"
                    value={loginPhone}
                    onChange={(e) => setLoginPhone(e.target.value)}
                    placeholder="98261 00000"
                    style={{ flex: 1, padding: '12px', border: 'none', outline: 'none', fontSize: '1.1rem', fontWeight: 700 }}
                    required
                  />
                </div>
                {loginError && <div style={{ color: '#dc2626', fontSize: '0.85rem', fontWeight: 700, marginTop: '6px' }}>⚠️ {loginError}</div>}
              </div>

              <button
                type="submit"
                disabled={isLoggingIn}
                className="btn-primary"
                style={{ padding: '14px', fontSize: '1.1rem', fontWeight: 800 }}
              >
                {isLoggingIn ? 'Sending OTP...' : isMarathi ? 'OTP पाठवा ➔' : 'Send OTP ➔'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ textAlign: 'center' }}>
                <ShieldCheck size={36} color="#0d9488" style={{ margin: '0 auto 8px auto' }} />
                <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>
                  {isMarathi ? '६-अंकी OTP टाका' : 'Enter 6-digit OTP'}
                </div>
                <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                  Sent to +91 {loginPhone.slice(-10)}
                </div>
              </div>

              <input
                type="text"
                maxLength={6}
                value={loginOtp}
                onChange={(e) => setLoginOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="— — — — — —"
                style={{
                  textAlign: 'center',
                  fontSize: '1.8rem',
                  letterSpacing: '8px',
                  padding: '12px',
                  borderRadius: '12px',
                  border: '2px solid #0d9488',
                  fontWeight: 900,
                  outline: 'none',
                }}
                required
              />

              {loginError && <div style={{ color: '#dc2626', fontSize: '0.85rem', fontWeight: 700, textAlign: 'center' }}>⚠️ {loginError}</div>}

              <button
                type="submit"
                disabled={isVerifyingOtp || loginOtp.length !== 6}
                className="btn-primary"
                style={{ padding: '14px', fontSize: '1.1rem', fontWeight: 800 }}
              >
                {isVerifyingOtp ? 'Verifying...' : isMarathi ? 'सत्यापित करा' : 'Verify & Enter'}
              </button>

              <button
                type="button"
                onClick={() => setLoginStep('phone')}
                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 700 }}
              >
                ← {isMarathi ? 'मोबाईल नंबर बदला' : 'Change Mobile Number'}
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // 2. PATIENT MAIN HOME INTERFACE (LOGGED IN)
  // ---------------------------------------------------------------------------
  const currentSession = session || DEFAULT_DEMO_SESSION;
  const upcomingCases = encounters.filter((e) => e.status !== 'COMPLETED');
  const pastCompletedCases = encounters.filter((e) => e.status === 'COMPLETED');

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px', padding: '16px 12px 60px 12px' }}>
      {/* Patient Welcome Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0d9488 0%, #065f46 100%)',
          borderRadius: '24px',
          padding: '24px',
          color: '#ffffff',
          boxShadow: '0 8px 24px rgba(13, 148, 136, 0.25)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.8rem', fontWeight: 900 }}>
                {isMarathi ? `नमस्कार, ${patientRecord?.name || currentSession.name}!` : `Welcome, ${patientRecord?.name || currentSession.name}!`}
              </span>
            </div>
            <div style={{ fontSize: '0.95rem', opacity: 0.9, marginTop: '4px', fontWeight: 600 }}>
              📍 {patientRecord?.village || currentSession.village} • {patientRecord?.age || 30} {isMarathi ? 'वर्षे' : 'years'}
              {patientRecord?.isPregnant && ' • 🤰 गर्भवती माता (ANC)'}
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '10px',
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              color: '#ffffff',
              fontSize: '0.85rem',
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            <LogOut size={16} />
            <span>{isMarathi ? 'लॉगआउट' : 'Logout'}</span>
          </button>
        </div>

        {/* Big Appointment Booking Buttons */}
        <div style={{ marginTop: '22px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
          {/* OPTION A: VOICE-ASSISTED BOOKING */}
          <button
            type="button"
            onClick={() => {
              setShowVoiceBooking(true);
              setVoiceStep('listening');
              setVoiceTranscript('');
              const speech = isMarathi
                ? 'माईक सुरू आहे. तुमचे लक्षणे सांगा, जसे की मला ३ दिवसांपासून ताप आणि खोकला आहे.'
                : 'Microphone ready. Please describe your symptoms.';
              speakText(speech, isMarathi ? 'mr-IN' : 'en-IN');
            }}
            style={{
              padding: '16px 20px',
              borderRadius: '16px',
              border: 'none',
              background: '#fef08a',
              color: '#854d0e',
              fontSize: '1.05rem',
              fontWeight: 900,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
              transition: 'transform 0.15s ease',
            }}
          >
            <Mic size={24} />
            <span>{isMarathi ? '🎤 बोलून अपॉइंटमेंट बुक करा' : '🎤 Book Appointment by Voice'}</span>
          </button>

          {/* OPTION B: MANUAL BOOKING */}
          <button
            type="button"
            onClick={() => setShowManualBooking(true)}
            style={{
              padding: '16px 20px',
              borderRadius: '16px',
              border: '2px solid rgba(255,255,255,0.6)',
              background: 'rgba(255,255,255,0.15)',
              color: '#ffffff',
              fontSize: '1.05rem',
              fontWeight: 900,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
            }}
          >
            <Calendar size={22} />
            <span>{isMarathi ? '📝 स्वतः तारीख व डॉक्टर निवडा' : '📝 Manual Booking'}</span>
          </button>
        </div>
      </div>

      {/* --------------------------------------------------------------- */}
      {/* 1. UPCOMING APPOINTMENTS / ACTIVE CASES                        */}
      {/* --------------------------------------------------------------- */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={20} color="#0d9488" />
            <span>{isMarathi ? 'आगामी भेटी व तपासणी (Upcoming Appointments)' : 'Upcoming Appointments & Consultations'}</span>
          </h2>
          <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0d9488' }}>
            {upcomingCases.length} Active
          </span>
        </div>

        {upcomingCases.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px 12px', color: '#64748b' }}>
            <div style={{ fontSize: '1.8rem', marginBottom: '6px' }}>✨</div>
            <div style={{ fontWeight: 700 }}>{isMarathi ? 'सध्या कोणतीही प्रलंबित भेट नाही.' : 'No pending appointments.'}</div>
            <div style={{ fontSize: '0.85rem', marginTop: '4px' }}>
              {isMarathi ? 'डॉक्टरांशी बोलण्यासाठी वर दिलेल्या पिवळ्या बटनावर क्लिक करा.' : 'Use the button above to book an appointment with our PHC doctor.'}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {upcomingCases.map((enc) => (
              <div
                key={enc.id}
                style={{
                  padding: '16px',
                  borderRadius: '16px',
                  background: '#f8fafc',
                  borderTop: '1px solid #e2e8f0',
                  borderRight: '1px solid #e2e8f0',
                  borderBottom: '1px solid #e2e8f0',
                  borderLeft: `5px solid ${
                    enc.status === 'DOCTOR_RESPONDED' ? '#10b981' : enc.status === 'FOLLOWUP_REQUIRED' ? '#f59e0b' : '#3b82f6'
                  }`,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#0f172a' }}>
                      🩺 {enc.chiefComplaints}
                    </div>
                    <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '2px' }}>
                      {new Date(enc.encounterDate).toLocaleDateString()} • {enc.facility?.name || 'Ramgarh Primary Health Centre'}
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div>
                    {enc.status === 'DOCTOR_RESPONDED' ? (
                      <span style={{ background: '#dcfce7', color: '#15803d', padding: '4px 10px', borderRadius: '10px', fontSize: '0.78rem', fontWeight: 800 }}>
                        🟢 {isMarathi ? 'डॉक्टरांचा सल्ला आला' : 'Doctor Responded'}
                      </span>
                    ) : enc.status === 'FOLLOWUP_REQUIRED' ? (
                      <span style={{ background: '#ffedd5', color: '#9a3412', padding: '4px 10px', borderRadius: '10px', fontSize: '0.78rem', fontWeight: 800 }}>
                        🟠 {isMarathi ? 'आशा पाठपुरावा' : 'ASHA Follow-up'}
                      </span>
                    ) : (
                      <span style={{ background: '#fef9c3', color: '#854d0e', padding: '4px 10px', borderRadius: '10px', fontSize: '0.78rem', fontWeight: 800 }}>
                        🟡 {isMarathi ? 'डॉक्टर तपासणी प्रतीक्षेत' : 'Waiting for Doctor'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Doctor's note if responded */}
                {(enc.doctorNotes || enc.doctorAdvice) && (
                  <div style={{ marginTop: '10px', padding: '10px 12px', background: '#f0fdf4', borderRadius: '10px', border: '1px solid #bbf7d0', fontSize: '0.88rem' }}>
                    <div style={{ fontWeight: 800, color: '#166534', marginBottom: '2px' }}>
                      👨‍⚕️ {isMarathi ? 'डॉक्टरांचा सल्ला (Doctor Advice):' : 'Doctor Advice:'}
                    </div>
                    <div style={{ color: '#14532d' }}>{enc.doctorAdvice || enc.doctorNotes}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* --------------------------------------------------------------- */}
      {/* 2. ACTIVE MEDICINES & RECOMMENDATIONS                          */}
      {/* --------------------------------------------------------------- */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0f172a', margin: '0 0 14px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Pill size={20} color="#f59e0b" />
          <span>{isMarathi ? '💊 चालू औषधे (Prescriptions & Medicines)' : 'Current Medicines & Recommendations'}</span>
        </h2>

        {prescriptions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>
            <div style={{ fontWeight: 700 }}>{isMarathi ? 'सध्या कोणतीही औषधे नोंदवलेली नाहीत.' : 'No active prescriptions recorded.'}</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {prescriptions.flatMap((rx) => rx.items || []).map((item: any, idx: number) => (
              <div
                key={idx}
                style={{
                  padding: '14px 16px',
                  borderRadius: '14px',
                  background: '#fffbeb',
                  border: '1px solid #fde68a',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '8px',
                }}
              >
                <div>
                  <div style={{ fontWeight: 900, fontSize: '1.05rem', color: '#92400e' }}>
                    {item.medicineName}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#78350f', marginTop: '2px', fontWeight: 600 }}>
                    {item.dosage} • {item.instructions}
                  </div>
                </div>

                <div style={{ background: '#ffffff', padding: '6px 12px', borderRadius: '8px', fontWeight: 800, color: '#b45309', fontSize: '0.85rem', border: '1px solid #fcd34d' }}>
                  🕒 {item.frequency} ({item.durationDays} days)
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* --------------------------------------------------------------- */}
      {/* 3. BASIC HEALTH HISTORY                                        */}
      {/* --------------------------------------------------------------- */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0f172a', margin: '0 0 14px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileText size={20} color="#6366f1" />
          <span>{isMarathi ? '📋 आरोग्य इतिहास (Health History)' : 'Basic Health History'}</span>
        </h2>

        {pastCompletedCases.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>
            <div style={{ fontWeight: 700 }}>
              {isMarathi ? 'मागील पूर्ण झालेल्या उपचारांची नोंद नाही.' : 'No completed past records yet.'}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {pastCompletedCases.map((enc) => (
              <div
                key={enc.id}
                style={{
                  padding: '12px 14px',
                  borderRadius: '12px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a' }}>
                    🩺 {enc.chiefComplaints}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                    {new Date(enc.encounterDate).toLocaleDateString()} • {isMarathi ? 'उपचार पूर्ण' : 'Completed'}
                  </div>
                </div>

                <span style={{ background: '#f1f5f9', color: '#475569', padding: '4px 10px', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 800 }}>
                  ✓ {isMarathi ? 'पूर्ण' : 'Resolved'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Emergency Assistance Footer Card */}
      <div
        style={{
          padding: '16px 20px',
          borderRadius: '18px',
          background: '#fee2e2',
          border: '1px solid #f87171',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <div style={{ fontWeight: 900, color: '#991b1b', fontSize: '1.05rem' }}>
            🚨 {isMarathi ? 'तातडीची वैद्यकीय मदत हवे असल्यास' : 'Need Immediate Emergency Help?'}
          </div>
          <div style={{ fontSize: '0.85rem', color: '#7f1d1d', marginTop: '2px' }}>
            {isMarathi ? 'मोफत १०८ रुग्णवाहिका किंवा १०४ आरोग्य हेल्पलाइन' : 'Free 108 Ambulance or 104 National Health Helpline'}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <a
            href="tel:108"
            style={{
              padding: '10px 16px',
              borderRadius: '10px',
              background: '#ef4444',
              color: '#ffffff',
              fontWeight: 900,
              textDecoration: 'none',
              fontSize: '0.9rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <PhoneCall size={16} /> 108
          </a>
          <a
            href="tel:104"
            style={{
              padding: '10px 16px',
              borderRadius: '10px',
              background: '#b91c1c',
              color: '#ffffff',
              fontWeight: 900,
              textDecoration: 'none',
              fontSize: '0.9rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <PhoneCall size={16} /> 104
          </a>
        </div>
      </div>

      {/* --------------------------------------------------------------- */}
      {/* MODAL 1: VOICE-ASSISTED APPOINTMENT BOOKING                    */}
      {/* --------------------------------------------------------------- */}
      {showVoiceBooking && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            zIndex: 100,
          }}
        >
          <div
            className="glass-panel"
            style={{
              maxWidth: '560px',
              width: '100%',
              padding: '28px',
              background: '#ffffff',
              borderRadius: '24px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
              position: 'relative',
            }}
          >
            <button
              onClick={() => setShowVoiceBooking(false)}
              style={{ position: 'absolute', top: '18px', right: '18px', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
            >
              <X size={24} />
            </button>

            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: '#fef08a',
                  color: '#854d0e',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 12px auto',
                }}
              >
                <Mic size={32} />
              </div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0f172a', margin: '0 0 6px 0' }}>
                {isMarathi ? 'बोलून अपॉइंटमेंट बुक करा' : 'Voice-Assisted Doctor Booking'}
              </h2>
              <div style={{ fontSize: '0.9rem', color: '#64748b' }}>
                {isMarathi ? 'मराठीत बोला. एआय लक्षणे समजून योग्य डॉक्टरांची निवड करेल.' : 'Speak in Marathi. AI will assist with symptoms & department.'}
              </div>
            </div>

            {/* Quick Sample Prompts to tap */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', marginBottom: '8px' }}>
                {isMarathi ? 'किंवा खालील पर्यायावर टॅप करा (Sample Speech):' : 'Or tap a sample patient symptom:'}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                  { mr: '“मला ३ दिवसांपासून ताप आणि खोकला आहे”', en: '“I have fever and cough for three days”' },
                  { mr: '“पोटात तीव्र दुखत आहे आणि उलटी होत आहे”', en: '“Severe stomach pain and vomiting”' },
                  { mr: '“डोकेदुखी आहे आणि चक्कर येत आहे”', en: '“Headache and dizziness”' },
                  { mr: '“बाळाला जास्त ताप आला आहे”', en: '“Baby has high fever”' },
                ].map((sample, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleVoiceInput(isMarathi ? sample.mr : sample.en)}
                    style={{
                      padding: '10px 14px',
                      borderRadius: '12px',
                      border: '1px solid #cbd5e1',
                      background: '#f8fafc',
                      color: '#0f172a',
                      fontSize: '0.9rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    🗣️ {isMarathi ? sample.mr : sample.en}
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2: Followup & Proposed Details */}
            {voiceStep === 'followup' && (
              <div style={{ padding: '16px', borderRadius: '16px', background: '#f0fdf4', border: '1px solid #86efac', marginBottom: '20px' }}>
                <div style={{ fontWeight: 800, color: '#166534', fontSize: '0.95rem' }}>
                  ✓ {isMarathi ? 'लक्षणे नोंदवली:' : 'Symptoms Understood:'}
                </div>
                <div style={{ fontWeight: 900, fontSize: '1.1rem', color: '#14532d', marginTop: '2px' }}>
                  {detectedSymptoms.join(', ')}
                </div>

                <div style={{ marginTop: '10px', fontSize: '0.85rem', color: '#166534' }}>
                  <strong>{isMarathi ? 'विभाग:' : 'Department:'}</strong> {selectedDepartment}
                </div>

                <div style={{ marginTop: '10px' }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#166534', marginBottom: '4px' }}>
                    {isMarathi ? 'काही दिवसांपासून औषध घेतले आहे का?' : 'Have you taken any medication?'}
                  </label>
                  <input
                    type="text"
                    value={followupAnswer}
                    onChange={(e) => setFollowupAnswer(e.target.value)}
                    placeholder={isMarathi ? 'उदा. काल पॅरासिटामॉल घेतली होती...' : 'e.g. Took paracetamol yesterday...'}
                    className="input-field"
                    style={{ background: '#ffffff' }}
                  />
                </div>
              </div>
            )}

            {/* Step 3: Booked state */}
            {voiceStep === 'booked' ? (
              <div style={{ textAlign: 'center', padding: '20px', color: '#15803d', fontWeight: 800 }}>
                🎉 {isMarathi ? 'अपॉइंटमेंट यशस्वीरित्या नोंदवली गेली!' : 'Appointment Booked Successfully!'}
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowVoiceBooking(false)} className="btn-secondary">
                  {isMarathi ? 'रद्द करा' : 'Cancel'}
                </button>
                {voiceStep === 'followup' && (
                  <button
                    type="button"
                    onClick={handleConfirmVoiceBooking}
                    className="btn-primary"
                    style={{ padding: '10px 24px', fontWeight: 900 }}
                  >
                    ✓ {isMarathi ? 'खात्री करा व अपॉइंटमेंट बुक करा' : 'Confirm & Book'}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------- */}
      {/* MODAL 2: MANUAL APPOINTMENT BOOKING                            */}
      {/* --------------------------------------------------------------- */}
      {showManualBooking && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            zIndex: 100,
          }}
        >
          <div
            className="glass-panel"
            style={{
              maxWidth: '540px',
              width: '100%',
              padding: '28px',
              background: '#ffffff',
              borderRadius: '24px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
              position: 'relative',
            }}
          >
            <button
              onClick={() => setShowManualBooking(false)}
              style={{ position: 'absolute', top: '18px', right: '18px', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
            >
              <X size={24} />
            </button>

            <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0f172a', margin: '0 0 16px 0' }}>
              📝 {isMarathi ? 'अपॉइंटमेंट बुकिंग' : 'Manual Appointment Booking'}
            </h2>

            {bookingSuccess ? (
              <div style={{ padding: '24px', textAlign: 'center', color: '#15803d', fontWeight: 800, fontSize: '1.1rem' }}>
                🎉 {isMarathi ? 'अपॉइंटमेंट यशस्वीरित्या नोंदवली गेली!' : 'Appointment booked successfully!'}
              </div>
            ) : (
              <form onSubmit={handleManualBookingSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    {isMarathi ? 'लक्षणे (Symptoms):' : 'Symptoms:'}
                  </label>
                  <input
                    type="text"
                    value={manualSymptoms}
                    onChange={(e) => setManualSymptoms(e.target.value)}
                    placeholder={isMarathi ? 'उदा. ताप, खोकला, अंगदुखी...' : 'e.g. Fever, cough, body pain...'}
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    {isMarathi ? 'विभाग / डॉक्टर निवडा:' : 'Department:'}
                  </label>
                  <select
                    value={manualDept}
                    onChange={(e) => setManualDept(e.target.value)}
                    className="input-field"
                  >
                    <option value="General Medicine">General Medicine (सामान्य औषधोपचार विभाग)</option>
                    <option value="Pediatrics">Pediatrics (बालरोग विभाग)</option>
                    <option value="Gynecology & Obstetrics">Gynecology & Obstetrics (स्त्रीरोग विभाग)</option>
                    <option value="Emergency">Emergency / Casualty (तातडीचा विभाग)</option>
                    <option value="General OPD">General OPD (सामान्य ओपीडी)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    {isMarathi ? 'सोयीची तारीख व वेळ:' : 'Preferred Date & Time:'}
                  </label>
                  <select
                    value={manualDate}
                    onChange={(e) => setManualDate(e.target.value)}
                    className="input-field"
                  >
                    <option value="Tomorrow Morning, 10:00 AM">उद्या सकाळी १०:०० वाजता (Tomorrow Morning 10:00 AM)</option>
                    <option value="Tomorrow Afternoon, 02:00 PM">उद्या दुपारी ०२:०० वाजता (Tomorrow Afternoon 02:00 PM)</option>
                    <option value="Day After Tomorrow, 11:00 AM">परवा सकाळी ११:०० वाजता (Day After Tomorrow 11:00 AM)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    {isMarathi ? 'इतर माहिती / टीप:' : 'Additional Notes:'}
                  </label>
                  <textarea
                    rows={2}
                    value={manualNotes}
                    onChange={(e) => setManualNotes(e.target.value)}
                    placeholder={isMarathi ? 'इतर काही सांगायचे असल्यास...' : 'Any additional details...'}
                    className="input-field"
                  />
                </div>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
                  <button type="button" onClick={() => setShowManualBooking(false)} className="btn-secondary">
                    {isMarathi ? 'रद्द करा' : 'Cancel'}
                  </button>
                  <button type="submit" disabled={isBookingManual} className="btn-primary" style={{ padding: '10px 24px', fontWeight: 900 }}>
                    {isBookingManual ? 'Booking...' : isMarathi ? '📅 अपॉइंटमेंट बुक करा' : 'Book Appointment'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
