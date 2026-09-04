'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Stethoscope,
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  FileText,
  Send,
  AlertTriangle,
  Clock,
  User,
  Activity,
  CheckCircle,
  Plus,
  Trash2,
  Printer,
  Ambulance,
  Heart,
  Thermometer,
  Droplets,
  Search,
  Filter,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface Patient {
  id: string;
  abhaId: string;
  name: string;
  age: number;
  gender: string;
  phone: string;
  village: string;
  isPregnant: boolean;
  gestationalWeeks?: number;
}

interface Encounter {
  id: string;
  patientId: string;
  patient: Patient;
  facility: { name: string; type: string };
  healthWorker: { name: string; role: string };
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
  isHighRiskMaternal: boolean;
  isHighRiskChild: boolean;
}

interface Teleconsult {
  id: string;
  teleconsultId: string;
  patientId: string;
  patient: Patient;
  encounter?: Encounter;
  requestingWorker: { name: string; phone: string; facility?: { name: string } };
  chiefComplaint: string;
  status: 'REQUESTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  roomSessionId?: string;
  doctorDiagnosis?: string;
  doctorAdvice?: string;
  createdAt: string;
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
  patient: Patient;
  diagnosis: string;
  advice: string;
  digitalSignature: string;
  issuedAt: string;
  items: PrescriptionItem[];
}

interface Referral {
  id: string;
  referralCode: string;
  patient: Patient;
  sourceFacility: { name: string };
  targetFacility: { name: string };
  priority: 'STAT' | 'URGENT' | 'ROUTINE';
  reasonForReferral: string;
  clinicalSummary?: string;
  preReferralTreatment?: string;
  transportStatus: string;
  status: 'PENDING' | 'ACCEPTED' | 'IN_TRANSIT' | 'COMPLETED' | 'REJECTED';
  createdAt: string;
}

interface InventoryItem {
  id: string;
  medicineName: string;
  currentStock: number;
  unit: string;
  isStockout: boolean;
}

export default function DoctorPortal() {
  const [activeTab, setActiveTab] = useState<'queue' | 'teleconsult' | 'prescribe' | 'referrals'>('queue');
  const [encounters, setEncounters] = useState<Encounter[]>([]);
  const [teleconsults, setTeleconsults] = useState<Teleconsult[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [riskFilter, setRiskFilter] = useState<'ALL' | 'RED' | 'YELLOW' | 'GREEN'>('ALL');

  // Active video call state
  const [activeCall, setActiveCall] = useState<Teleconsult | null>(null);
  const [callDuration, setCallDuration] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isVideoOff, setIsVideoOff] = useState<boolean>(false);
  const [callNotes, setCallNotes] = useState<string>('');
  const [callDiagnosis, setCallDiagnosis] = useState<string>('');
  const localVideoRef = useRef<HTMLVideoElement | null>(null);

  // Prescription Form State
  const [selectedPatientForRx, setSelectedPatientForRx] = useState<Patient | null>(null);
  const [rxDiagnosis, setRxDiagnosis] = useState<string>('');
  const [rxAdvice, setRxAdvice] = useState<string>('');
  const [rxItems, setRxItems] = useState<PrescriptionItem[]>([
    { medicineName: 'Amoxicillin 500mg Capsules', dosage: '1 capsule', frequency: '1-0-1 (Twice daily after food)', durationDays: 5, instructions: 'Complete full course with water' },
  ]);
  const [previewRx, setPreviewRx] = useState<Prescription | null>(null);

  // Referral Form State
  const [selectedPatientForRef, setSelectedPatientForRef] = useState<Patient | null>(null);
  const [refPriority, setRefPriority] = useState<'STAT' | 'URGENT' | 'ROUTINE'>('STAT');
  const [refReason, setRefReason] = useState<string>('');
  const [refClinicalSummary, setRefClinicalSummary] = useState<string>('');
  const [refPreTreatment, setRefPreTreatment] = useState<string>('');
  const [refTransport, setRefTransport] = useState<string>('AMBULANCE_DISPATCHED');

  // Load backend data
  const fetchData = async () => {
    try {
      setLoading(true);
      const [encRes, teleRes, rxRes, refRes, invRes] = await Promise.all([
        fetch('/api/encounters'),
        fetch('/api/teleconsult'),
        fetch('/api/prescriptions'),
        fetch('/api/referrals'),
        fetch('/api/inventory'),
      ]);

      const [encData, teleData, rxData, refData, invData] = await Promise.all([
        encRes.json(),
        teleRes.json(),
        rxRes.json(),
        refRes.json(),
        invRes.json(),
      ]);

      setEncounters(encData.encounters || []);
      setTeleconsults(teleData.teleconsultations || []);
      setPrescriptions(rxData.prescriptions || []);
      setReferrals(refData.referrals || []);
      setInventory(invData.inventory || []);

      if (encData.encounters && encData.encounters.length > 0 && !selectedPatientForRx) {
        setSelectedPatientForRx(encData.encounters[0].patient);
        setSelectedPatientForRef(encData.encounters[0].patient);
      }
    } catch (err) {
      console.error('Doctor portal fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Video call timer
  useEffect(() => {
    let timer: any;
    if (activeCall) {
      timer = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      setCallDuration(0);
    }
    return () => clearInterval(timer);
  }, [activeCall]);

  // Launch Video Call
  const handleStartCall = async (tc: Teleconsult) => {
    setActiveCall(tc);
    setActiveTab('teleconsult');
    setCallDiagnosis(tc.doctorDiagnosis || '');
    setCallNotes(tc.doctorAdvice || '');

    // Update status to IN_PROGRESS
    try {
      await fetch('/api/teleconsult', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'UPDATE_STATUS',
          id: tc.id,
          status: 'IN_PROGRESS',
        }),
      });
    } catch (e) {
      console.error(e);
    }

    // Try starting camera stream
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      }
    } catch {
      // User or browser denied camera: handled gracefully by simulated video feed
    }
  };

  // End Video Call
  const handleEndCall = async () => {
    if (!activeCall) return;

    try {
      await fetch('/api/teleconsult', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'UPDATE_STATUS',
          id: activeCall.id,
          status: 'COMPLETED',
          doctorDiagnosis: callDiagnosis,
          doctorAdvice: callNotes,
        }),
      });

      // Stop camera tracks
      if (localVideoRef.current && localVideoRef.current.srcObject) {
        const stream = localVideoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
    } catch (e) {
      console.error(e);
    }

    confetti({ particleCount: 50, spread: 60 });
    setActiveCall(null);
    fetchData();
  };

  // Issue Digital Prescription
  const handleIssuePrescription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientForRx) return;

    try {
      const res = await fetch('/api/prescriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: selectedPatientForRx.id,
          doctorId: 'HW-MO-001',
          diagnosis: rxDiagnosis || 'Acute Respiratory Infection / Hypertension Monitoring',
          advice: rxAdvice || 'Rest adequately, drink clean boiled water, and return if symptoms worsen.',
          items: rxItems,
        }),
      });

      const data = await res.json();
      if (data.prescription) {
        confetti({ particleCount: 70, spread: 70 });
        setPreviewRx(data.prescription);
        fetchData();
      }
    } catch (err) {
      console.error('Prescription issue error:', err);
    }
  };

  // Add Item to Prescription
  const addRxItem = () => {
    setRxItems([
      ...rxItems,
      { medicineName: 'Paracetamol 500mg Tablets', dosage: '1 tablet', frequency: '1-1-1 (Thrice daily PRN)', durationDays: 3, instructions: 'For fever above 100°F' },
    ]);
  };

  const removeRxItem = (index: number) => {
    setRxItems(rxItems.filter((_, i) => i !== index));
  };

  // Create Referral to District Hospital
  const handleCreateReferral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientForRef) return;

    try {
      const res = await fetch('/api/referrals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: selectedPatientForRef.id,
          sourceFacilityId: 'PHC-RAMGARH', // Ramgarh PHC
          targetFacilityId: 'DH-BILASPUR', // District Hospital
          referringWorkerId: 'HW-MO-001',
          priority: refPriority,
          reasonForReferral: refReason || 'Emergency escalation requiring ICU / Obstetric surgical setup',
          clinicalSummary: refClinicalSummary,
          preReferralTreatment: refPreTreatment || 'Stabilizing IV line secured, emergency drug loaded.',
          transportStatus: refTransport,
          status: 'PENDING',
        }),
      });

      const data = await res.json();
      if (data.referral) {
        confetti({ particleCount: 80, spread: 80 });
        setRefReason('');
        setRefClinicalSummary('');
        setRefPreTreatment('');
        fetchData();
        setActiveTab('referrals');
      }
    } catch (err) {
      console.error('Referral creation error:', err);
    }
  };

  // Update Referral Status (e.g. Accepted / In Transit / Completed)
  const handleUpdateReferralStatus = async (id: string, newStatus: string) => {
    try {
      await fetch('/api/referrals', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredEncounters = encounters.filter((e) => {
    if (riskFilter === 'ALL') return true;
    return e.riskLevel === riskFilter;
  });

  const redAlertCount = encounters.filter((e) => e.riskLevel === 'RED').length;
  const pendingTeleCount = teleconsults.filter((t) => t.status === 'REQUESTED').length;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Doctor Header Banner */}
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
              width: '52px',
              height: '52px',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, #0f766e 0%, #0d9488 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 4px 12px var(--primary-glow)',
            }}
          >
            <Stethoscope size={28} />
          </div>
          <div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--slate-900)' }}>
              Dr. Arun Verma, MBBS, MD
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--slate-600)' }}>
              Medical Officer • Ramgarh Primary Health Centre (PHC) • Reg # MCI-67821
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {redAlertCount > 0 && (
            <div
              style={{
                background: 'var(--risk-red-bg)',
                border: '1px solid var(--risk-red-border)',
                padding: '8px 14px',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: 'var(--risk-red-dark)',
                fontWeight: 700,
                fontSize: '0.85rem',
              }}
            >
              <span className="beacon-red" style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--risk-red)' }} />
              {redAlertCount} Critical Emergency Triage
            </div>
          )}

          {pendingTeleCount > 0 && (
            <div
              style={{
                background: 'var(--risk-yellow-bg)',
                border: '1px solid var(--risk-yellow-border)',
                padding: '8px 14px',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: 'var(--risk-yellow-dark)',
                fontWeight: 700,
                fontSize: '0.85rem',
              }}
            >
              <Video size={16} />
              {pendingTeleCount} Teleconsult Requests
            </div>
          )}
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          borderBottom: '2px solid var(--slate-200)',
          paddingBottom: '2px',
        }}
      >
        <button
          onClick={() => setActiveTab('queue')}
          style={{
            padding: '10px 18px',
            fontWeight: 700,
            fontSize: '0.9rem',
            color: activeTab === 'queue' ? 'var(--primary)' : 'var(--slate-600)',
            borderBottom: activeTab === 'queue' ? '3px solid var(--primary)' : 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Activity size={18} /> Incoming Triage Queue ({encounters.length})
        </button>

        <button
          onClick={() => setActiveTab('teleconsult')}
          style={{
            padding: '10px 18px',
            fontWeight: 700,
            fontSize: '0.9rem',
            color: activeTab === 'teleconsult' ? 'var(--primary)' : 'var(--slate-600)',
            borderBottom: activeTab === 'teleconsult' ? '3px solid var(--primary)' : 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Video size={18} /> Teleconsultation Room {activeCall && <span className="beacon-red" style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--risk-red)' }} />}
        </button>

        <button
          onClick={() => setActiveTab('prescribe')}
          style={{
            padding: '10px 18px',
            fontWeight: 700,
            fontSize: '0.9rem',
            color: activeTab === 'prescribe' ? 'var(--primary)' : 'var(--slate-600)',
            borderBottom: activeTab === 'prescribe' ? '3px solid var(--primary)' : 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <FileText size={18} /> Digital Prescriptions ({prescriptions.length})
        </button>

        <button
          onClick={() => setActiveTab('referrals')}
          style={{
            padding: '10px 18px',
            fontWeight: 700,
            fontSize: '0.9rem',
            color: activeTab === 'referrals' ? 'var(--primary)' : 'var(--slate-600)',
            borderBottom: activeTab === 'referrals' ? '3px solid var(--primary)' : 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Ambulance size={18} /> Downstream Referrals ({referrals.length})
        </button>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* TAB 1: INCOMING TRIAGE QUEUE                                   */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'queue' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Filter Bar */}
          <div
            className="glass-panel"
            style={{
              padding: '12px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--slate-600)' }}>
                Filter by Risk Level:
              </span>
              {(['ALL', 'RED', 'YELLOW', 'GREEN'] as const).map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setRiskFilter(lvl)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    background:
                      riskFilter === lvl
                        ? lvl === 'RED'
                          ? 'var(--risk-red)'
                          : lvl === 'YELLOW'
                          ? 'var(--risk-yellow)'
                          : lvl === 'GREEN'
                          ? 'var(--risk-green)'
                          : 'var(--slate-800)'
                        : 'var(--slate-100)',
                    color: riskFilter === lvl ? '#ffffff' : 'var(--slate-700)',
                  }}
                >
                  {lvl}
                </button>
              ))}
            </div>

            <div style={{ fontSize: '0.85rem', color: 'var(--slate-500)' }}>
              Showing {filteredEncounters.length} patients sorted by clinical urgency
            </div>
          </div>

          {/* Triage Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '16px' }}>
            {filteredEncounters.map((enc) => (
              <div
                key={enc.id}
                className="glass-panel"
                style={{
                  padding: '18px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  borderTop: `5px solid ${
                    enc.riskLevel === 'RED'
                      ? 'var(--risk-red)'
                      : enc.riskLevel === 'YELLOW'
                      ? 'var(--risk-yellow)'
                      : 'var(--risk-green)'
                  }`,
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--slate-900)' }}>
                        {enc.patient.name}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--slate-500)' }}>
                        ABHA: {enc.patient.abhaId} • {enc.patient.age}y, {enc.patient.gender} • {enc.patient.village}
                      </div>
                    </div>
                    <span
                      className={`badge-${enc.riskLevel.toLowerCase()}`}
                      style={{ padding: '4px 10px', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem' }}
                    >
                      {enc.riskLevel} TAG
                    </span>
                  </div>

                  {/* Vitals Ribbon */}
                  <div
                    style={{
                      marginTop: '12px',
                      background: 'var(--slate-50)',
                      padding: '10px',
                      borderRadius: 'var(--radius-md)',
                      display: 'grid',
                      gridTemplateColumns: 'repeat(4, 1fr)',
                      gap: '8px',
                      textAlign: 'center',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--slate-500)' }}>BP (mmHg)</div>
                      <div
                        style={{
                          fontWeight: 800,
                          fontSize: '0.9rem',
                          color: (enc.systolicBP || 0) >= 160 ? 'var(--risk-red)' : 'inherit',
                        }}
                      >
                        {enc.systolicBP || '--'}/{enc.diastolicBP || '--'}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--slate-500)' }}>SpO2</div>
                      <div
                        style={{
                          fontWeight: 800,
                          fontSize: '0.9rem',
                          color: (enc.spo2 || 100) < 92 ? 'var(--risk-red)' : 'inherit',
                        }}
                      >
                        {enc.spo2 || '--'}%
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--slate-500)' }}>Pulse</div>
                      <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>{enc.pulseRate || '--'} bpm</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--slate-500)' }}>Temp</div>
                      <div
                        style={{
                          fontWeight: 800,
                          fontSize: '0.9rem',
                          color: (enc.temperatureF || 0) >= 101 ? 'var(--risk-red)' : 'inherit',
                        }}
                      >
                        {enc.temperatureF || '--'}°F
                      </div>
                    </div>
                  </div>

                  {/* Complaints & Rationale */}
                  <div style={{ marginTop: '12px', fontSize: '0.82rem' }}>
                    <div style={{ fontWeight: 700, color: 'var(--slate-700)' }}>Chief Complaints:</div>
                    <div style={{ color: 'var(--slate-800)', marginTop: '2px' }}>{enc.chiefComplaints}</div>
                  </div>

                  {enc.triageRationale && (
                    <div
                      style={{
                        marginTop: '8px',
                        padding: '8px',
                        borderRadius: 'var(--radius-sm)',
                        background:
                          enc.riskLevel === 'RED'
                            ? 'var(--risk-red-bg)'
                            : enc.riskLevel === 'YELLOW'
                            ? 'var(--risk-yellow-bg)'
                            : 'var(--risk-green-bg)',
                        fontSize: '0.78rem',
                        color:
                          enc.riskLevel === 'RED'
                            ? 'var(--risk-red-dark)'
                            : enc.riskLevel === 'YELLOW'
                            ? 'var(--risk-yellow-dark)'
                            : 'var(--risk-green-dark)',
                        lineHeight: '1.4',
                      }}
                    >
                      <strong>Rationale:</strong> {enc.triageRationale}
                    </div>
                  )}

                  {enc.patient.isPregnant && (
                    <div
                      style={{
                        marginTop: '8px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        color: '#9d174d',
                        background: '#fdf2f8',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        display: 'inline-block',
                      }}
                    >
                      🤰 High-Risk Pregnancy ANC Follow-up
                    </div>
                  )}

                  <div style={{ marginTop: '10px', fontSize: '0.75rem', color: 'var(--slate-500)' }}>
                    Referral by {enc.healthWorker.name} ({enc.healthWorker.role}) • {enc.facility.name}
                  </div>
                </div>

                {/* Actions */}
                <div
                  style={{
                    marginTop: '16px',
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1fr',
                    gap: '6px',
                    paddingTop: '12px',
                    borderTop: '1px solid var(--slate-200)',
                  }}
                >
                  <button
                    onClick={() => {
                      const tc = teleconsults.find((t) => t.patientId === enc.patient.id);
                      if (tc) {
                        handleStartCall(tc);
                      } else {
                        // Create mock teleconsult object to launch immediately
                        handleStartCall({
                          id: 'temp-tc',
                          teleconsultId: `TC-${Date.now().toString().slice(-4)}`,
                          patientId: enc.patient.id,
                          patient: enc.patient,
                          encounter: enc,
                          requestingWorker: { name: enc.healthWorker.name, phone: '+91 98261 12345' },
                          chiefComplaint: enc.chiefComplaints,
                          status: 'IN_PROGRESS',
                          createdAt: new Date().toISOString(),
                        });
                      }
                    }}
                    className="btn-primary"
                    style={{ fontSize: '0.75rem', padding: '8px 6px' }}
                  >
                    <Video size={14} /> Video Call
                  </button>

                  <button
                    onClick={() => {
                      setSelectedPatientForRx(enc.patient);
                      setRxDiagnosis(`${enc.riskLevel} Case: ${enc.chiefComplaints}`);
                      setActiveTab('prescribe');
                    }}
                    className="btn-secondary"
                    style={{ fontSize: '0.75rem', padding: '8px 6px' }}
                  >
                    <FileText size={14} /> Prescribe
                  </button>

                  <button
                    onClick={() => {
                      setSelectedPatientForRef(enc.patient);
                      setRefReason(`${enc.riskLevel} Triage: ${enc.triageRationale || enc.chiefComplaints}`);
                      setRefClinicalSummary(
                        `BP: ${enc.systolicBP || '--'}/${enc.diastolicBP || '--'} mmHg, SpO2: ${enc.spo2 || '--'}%, Pulse: ${enc.pulseRate || '--'} bpm`
                      );
                      setRefPriority(enc.riskLevel === 'RED' ? 'STAT' : 'URGENT');
                      setActiveTab('referrals');
                    }}
                    className="btn-danger"
                    style={{ fontSize: '0.75rem', padding: '8px 6px' }}
                  >
                    <Ambulance size={14} /> Refer DH
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 2: INTERACTIVE VIDEO TELECONSULTATION ROOM                 */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'teleconsult' && (
        <div style={{ display: 'grid', gridTemplateColumns: activeCall ? '2fr 1fr' : '1fr', gap: '20px' }}>
          {/* Main Video Screen */}
          <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {activeCall ? (
              <>
                {/* Active Call Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span
                      style={{
                        background: 'var(--risk-red)',
                        color: '#fff',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        marginRight: '8px',
                      }}
                    >
                      LIVE CALL
                    </span>
                    <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>
                      {activeCall.patient.name} (ABHA: {activeCall.patient.abhaId})
                    </span>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontFamily: 'monospace',
                      fontSize: '1rem',
                      fontWeight: 700,
                      color: 'var(--slate-700)',
                    }}
                  >
                    <Clock size={16} />
                    {Math.floor(callDuration / 60)
                      .toString()
                      .padStart(2, '0')}
                    :
                    {(callDuration % 60).toString().padStart(2, '0')}
                  </div>
                </div>

                {/* Video Streams Container */}
                <div
                  style={{
                    position: 'relative',
                    width: '100%',
                    height: '420px',
                    borderRadius: 'var(--radius-lg)',
                    background: '#0f172a',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {/* Remote Stream: Frontline ASHA worker & Rural Patient */}
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ffffff',
                    }}
                  >
                    <div
                      style={{
                        width: '90px',
                        height: '90px',
                        borderRadius: '50%',
                        background: '#0d9488',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '2rem',
                        fontWeight: 700,
                        marginBottom: '12px',
                      }}
                    >
                      👩‍⚕️
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>
                      Frontline ASHA: {activeCall.requestingWorker.name}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                      Transmitting live from Bilaspur Sub-Centre Point-of-Care
                    </div>
                    <div
                      style={{
                        marginTop: '12px',
                        background: 'rgba(255,255,255,0.1)',
                        backdropFilter: 'blur(8px)',
                        padding: '6px 14px',
                        borderRadius: '999px',
                        fontSize: '0.78rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
                      WebRTC Encrypted Peer Stream (720p @ 30fps)
                    </div>
                  </div>

                  {/* Picture-in-Picture: Doctor's Local Camera Preview */}
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '20px',
                      right: '20px',
                      width: '150px',
                      height: '110px',
                      borderRadius: 'var(--radius-md)',
                      border: '2px solid #ffffff',
                      background: '#000000',
                      overflow: 'hidden',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                    }}
                  >
                    <video
                      ref={localVideoRef}
                      autoPlay
                      muted
                      playsInline
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: isVideoOff ? 'none' : 'block',
                      }}
                    />
                    {isVideoOff && (
                      <div
                        style={{
                          width: '100%',
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#94a3b8',
                          fontSize: '0.75rem',
                        }}
                      >
                        Camera Off
                      </div>
                    )}
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '4px',
                        left: '6px',
                        fontSize: '0.65rem',
                        color: '#fff',
                        fontWeight: 700,
                        textShadow: '0 1px 3px rgba(0,0,0,0.8)',
                      }}
                    >
                      You (Dr. Verma)
                    </div>
                  </div>
                </div>

                {/* Call Controls Bar */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '14px',
                    padding: '8px',
                  }}
                >
                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '50%',
                      background: isMuted ? 'var(--risk-red)' : 'var(--slate-200)',
                      color: isMuted ? '#ffffff' : 'var(--slate-800)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
                  </button>

                  <button
                    onClick={() => setIsVideoOff(!isVideoOff)}
                    style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '50%',
                      background: isVideoOff ? 'var(--risk-red)' : 'var(--slate-200)',
                      color: isVideoOff ? '#ffffff' : 'var(--slate-800)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {isVideoOff ? <VideoOff size={20} /> : <Video size={20} />}
                  </button>

                  <button
                    onClick={handleEndCall}
                    className="btn-danger"
                    style={{
                      borderRadius: '999px',
                      padding: '10px 24px',
                      gap: '8px',
                      fontWeight: 700,
                    }}
                  >
                    <PhoneOff size={18} /> End Teleconsultation
                  </button>
                </div>
              </>
            ) : (
              /* Teleconsult Requests Queue */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--slate-900)' }}>
                  Pending Teleconsultation Requests
                </div>

                {teleconsults.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: 'var(--slate-500)' }}>
                    No pending teleconsultation calls right now.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {teleconsults.map((tc) => (
                      <div
                        key={tc.id}
                        style={{
                          padding: '16px',
                          border: '1px solid var(--slate-200)',
                          borderRadius: 'var(--radius-md)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          background: tc.status === 'REQUESTED' ? '#f0fdfa' : '#ffffff',
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                            {tc.patient.name} ({tc.patient.age}y, {tc.patient.gender})
                          </div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--slate-600)', marginTop: '2px' }}>
                            ABHA: {tc.patient.abhaId} • ASHA: {tc.requestingWorker.name}
                          </div>
                          <div style={{ fontSize: '0.82rem', color: 'var(--slate-800)', marginTop: '4px' }}>
                            <strong>Reason:</strong> {tc.chiefComplaint}
                          </div>
                        </div>

                        <button onClick={() => handleStartCall(tc)} className="btn-primary">
                          <Video size={16} /> Launch Video Call
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* In-Call Clinical HUD (Sidebar) */}
          {activeCall && (
            <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--slate-900)' }}>
                🩺 Live In-Call Clinical HUD
              </div>

              {activeCall.encounter && (
                <div
                  style={{
                    background: 'var(--slate-50)',
                    padding: '12px',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    fontSize: '0.82rem',
                  }}
                >
                  <div style={{ fontWeight: 700, color: 'var(--slate-700)' }}>Vitals Measured by ASHA:</div>
                  <div>BP: <strong>{activeCall.encounter.systolicBP || '--'}/{activeCall.encounter.diastolicBP || '--'} mmHg</strong></div>
                  <div>SpO2: <strong>{activeCall.encounter.spo2 || '--'}%</strong></div>
                  <div>Pulse: <strong>{activeCall.encounter.pulseRate || '--'} bpm</strong></div>
                  <div>Temp: <strong>{activeCall.encounter.temperatureF || '--'}°F</strong></div>
                </div>
              )}

              <div>
                <label className="form-label">Doctor's Clinical Impression / Diagnosis</label>
                <input
                  type="text"
                  value={callDiagnosis}
                  onChange={(e) => setCallDiagnosis(e.target.value)}
                  placeholder="e.g. Acute Bronchitis, Gestational HTN"
                  className="form-input"
                />
              </div>

              <div>
                <label className="form-label">Clinical Advice / Treatment Given</label>
                <textarea
                  rows={4}
                  value={callNotes}
                  onChange={(e) => setCallNotes(e.target.value)}
                  placeholder="Instructions for frontline worker and patient..."
                  className="form-input"
                  style={{ resize: 'none' }}
                />
              </div>

              <button
                onClick={() => {
                  setSelectedPatientForRx(activeCall.patient);
                  setRxDiagnosis(callDiagnosis || activeCall.chiefComplaint);
                  setActiveTab('prescribe');
                }}
                className="btn-secondary"
                style={{ width: '100%', marginTop: 'auto' }}
              >
                <FileText size={16} /> Open Prescription Pad
              </button>
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 3: DIGITAL PRESCRIPTION PAD (FHIR MedicationRequest)       */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'prescribe' && (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
          {/* Prescription Pad Form */}
          <form
            onSubmit={handleIssuePrescription}
            className="glass-panel"
            style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--slate-900)' }}>
                  Digital Prescription Pad
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--slate-500)' }}>
                  Standardized ABDM & FHIR MedicationRequest with Official Digital Signature
                </div>
              </div>
            </div>

            {/* Patient Selector */}
            <div>
              <label className="form-label">Patient</label>
              <select
                value={selectedPatientForRx?.id || ''}
                onChange={(e) => {
                  const pat = encounters.map((enc) => enc.patient).find((p) => p.id === e.target.value);
                  if (pat) setSelectedPatientForRx(pat);
                }}
                className="form-input"
                style={{ fontWeight: 600 }}
              >
                {encounters.map((enc) => (
                  <option key={enc.patient.id} value={enc.patient.id}>
                    {enc.patient.name} ({enc.patient.age}y, {enc.patient.gender}) • ABHA: {enc.patient.abhaId}
                  </option>
                ))}
              </select>
            </div>

            {/* Diagnosis */}
            <div>
              <label className="form-label">Clinical Diagnosis</label>
              <input
                type="text"
                required
                value={rxDiagnosis}
                onChange={(e) => setRxDiagnosis(e.target.value)}
                placeholder="e.g. Severe Pre-eclampsia / Gestational Anemia / Bronchopneumonia"
                className="form-input"
              />
              {/* Quick Tags */}
              <div style={{ display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
                {['Severe Pre-eclampsia', 'Moderate Anemia (MCH)', 'Acute Gastroenteritis', 'Bronchopneumonia', 'Hypertension'].map(
                  (tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setRxDiagnosis(tag)}
                      style={{
                        padding: '3px 8px',
                        background: 'var(--slate-100)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.72rem',
                        fontWeight: 600,
                      }}
                    >
                      + {tag}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Prescribed Medicines (Linked to Facility Inventory) */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label className="form-label" style={{ margin: 0 }}>
                  Prescribed Medicines & Dosages
                </label>
                <button
                  type="button"
                  onClick={addRxItem}
                  style={{
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    color: 'var(--primary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <Plus size={14} /> Add Medicine
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {rxItems.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: 'var(--slate-50)',
                      border: '1px solid var(--slate-200)',
                      padding: '12px',
                      borderRadius: 'var(--radius-md)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                    }}
                  >
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <div style={{ flex: 1 }}>
                        <select
                          value={item.medicineName}
                          onChange={(e) => {
                            const newItems = [...rxItems];
                            newItems[idx].medicineName = e.target.value;
                            setRxItems(newItems);
                          }}
                          className="form-input"
                          style={{ padding: '6px 10px', fontSize: '0.85rem', fontWeight: 600 }}
                        >
                          <option value="Amoxicillin 500mg Capsules">Amoxicillin 500mg Capsules</option>
                          <option value="Iron Folic Acid (IFA) Tablets">Iron Folic Acid (IFA) Tablets</option>
                          <option value="Paracetamol 500mg Tablets">Paracetamol 500mg Tablets</option>
                          <option value="Oral Rehydration Salts (ORS)">Oral Rehydration Salts (ORS)</option>
                          <option value="Zinc Sulfate 20mg Tablets">Zinc Sulfate 20mg Tablets</option>
                          <option value="Amlodipine 5mg Tablets">Amlodipine 5mg Tablets</option>
                          <option value="Oxytocin Injection 10 IU">Oxytocin Injection 10 IU</option>
                          <option value="Magnesium Sulfate 50% Injection">Magnesium Sulfate 50% Injection</option>
                        </select>
                      </div>

                      {rxItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeRxItem(idx)}
                          style={{ color: 'var(--risk-red)', padding: '6px' }}
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                      <input
                        type="text"
                        placeholder="Dosage (e.g. 1 tab)"
                        value={item.dosage}
                        onChange={(e) => {
                          const newItems = [...rxItems];
                          newItems[idx].dosage = e.target.value;
                          setRxItems(newItems);
                        }}
                        className="form-input"
                        style={{ padding: '6px 8px', fontSize: '0.8rem' }}
                      />
                      <input
                        type="text"
                        placeholder="Frequency (1-0-1)"
                        value={item.frequency}
                        onChange={(e) => {
                          const newItems = [...rxItems];
                          newItems[idx].frequency = e.target.value;
                          setRxItems(newItems);
                        }}
                        className="form-input"
                        style={{ padding: '6px 8px', fontSize: '0.8rem' }}
                      />
                      <input
                        type="number"
                        placeholder="Days (5)"
                        value={item.durationDays}
                        onChange={(e) => {
                          const newItems = [...rxItems];
                          newItems[idx].durationDays = parseInt(e.target.value) || 1;
                          setRxItems(newItems);
                        }}
                        className="form-input"
                        style={{ padding: '6px 8px', fontSize: '0.8rem' }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="form-label">General Advice / Special Instructions</label>
              <textarea
                rows={3}
                value={rxAdvice}
                onChange={(e) => setRxAdvice(e.target.value)}
                placeholder="Dietary precautions, signs of alarm, mandatory follow-up..."
                className="form-input"
                style={{ resize: 'none' }}
              />
            </div>

            <button type="submit" className="btn-primary" style={{ padding: '12px', fontSize: '0.95rem' }}>
              <CheckCircle size={18} /> Issue & Sign Digital Prescription
            </button>
          </form>

          {/* Side Panel: PHC Medicine Stock Tracker & Recent Prescriptions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="glass-panel" style={{ padding: '16px' }}>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '8px' }}>
                📦 Ramgarh PHC Stock Inventory
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.78rem' }}>
                {inventory.slice(0, 6).map((inv) => (
                  <div
                    key={inv.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '6px 8px',
                      background: inv.isStockout ? '#fef2f2' : 'var(--slate-50)',
                      borderRadius: 'var(--radius-sm)',
                    }}
                  >
                    <span>{inv.medicineName}</span>
                    <span
                      style={{
                        fontWeight: 700,
                        color: inv.isStockout ? 'var(--risk-red-dark)' : 'var(--risk-green-dark)',
                      }}
                    >
                      {inv.currentStock} {inv.unit} {inv.isStockout && '⚠️ LOW'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Issued Prescriptions List */}
            <div className="glass-panel" style={{ padding: '16px' }}>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '8px' }}>
                Issued Prescriptions ({prescriptions.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {prescriptions.slice(0, 4).map((rx) => (
                  <div
                    key={rx.id}
                    onClick={() => setPreviewRx(rx)}
                    style={{
                      padding: '10px',
                      background: '#ffffff',
                      border: '1px solid var(--slate-200)',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '0.82rem' }}>
                      <span>{rx.patient.name}</span>
                      <span style={{ color: 'var(--primary)' }}>{rx.prescriptionCode}</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--slate-600)', marginTop: '2px' }}>
                      {rx.diagnosis}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Prescription Preview Modal */}
      {previewRx && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '20px',
          }}
        >
          <div
            className="glass-panel"
            style={{
              maxWidth: '600px',
              width: '100%',
              background: '#ffffff',
              padding: '30px',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--card-shadow-lg)',
            }}
          >
            {/* Official Header */}
            <div
              style={{
                textAlign: 'center',
                borderBottom: '2px solid #0d9488',
                paddingBottom: '14px',
                marginBottom: '16px',
              }}
            >
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0d9488', letterSpacing: '1px' }}>
                AYUSHMAN BHARAT DIGITAL MISSION (ABDM) • DIGITAL HEALTHCARE
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--slate-900)' }}>
                RAMGARH PRIMARY HEALTH CENTRE
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--slate-600)' }}>
                Block Bilha, Dist. Bilaspur, Chhattisgarh • Contact: +91 7752 289450
              </div>
            </div>

            {/* Patient Bar */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '8px',
                fontSize: '0.82rem',
                background: 'var(--slate-50)',
                padding: '10px',
                borderRadius: 'var(--radius-sm)',
                marginBottom: '16px',
              }}
            >
              <div><strong>Patient:</strong> {previewRx.patient.name} ({previewRx.patient.age}y, {previewRx.patient.gender})</div>
              <div><strong>ABHA ID:</strong> {previewRx.patient.abhaId}</div>
              <div><strong>Date:</strong> {new Date(previewRx.issuedAt).toLocaleDateString()}</div>
              <div><strong>Rx Code:</strong> {previewRx.prescriptionCode}</div>
            </div>

            <div style={{ marginBottom: '14px', fontSize: '0.85rem' }}>
              <strong>Clinical Diagnosis:</strong> {previewRx.diagnosis}
            </div>

            {/* Medicines List */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '6px' }}>℞ Medications:</div>
              <table style={{ width: '100%', fontSize: '0.8rem', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--slate-100)', textAlign: 'left' }}>
                    <th style={{ padding: '6px' }}>Medicine</th>
                    <th style={{ padding: '6px' }}>Dosage</th>
                    <th style={{ padding: '6px' }}>Frequency</th>
                    <th style={{ padding: '6px' }}>Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {previewRx.items.map((it, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--slate-200)' }}>
                      <td style={{ padding: '6px', fontWeight: 600 }}>{it.medicineName}</td>
                      <td style={{ padding: '6px' }}>{it.dosage}</td>
                      <td style={{ padding: '6px' }}>{it.frequency}</td>
                      <td style={{ padding: '6px' }}>{it.durationDays} Days</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ fontSize: '0.82rem', color: 'var(--slate-700)', marginBottom: '20px' }}>
              <strong>Advice:</strong> {previewRx.advice}
            </div>

            {/* Digital Stamp */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingTop: '16px',
                borderTop: '1px dashed var(--slate-300)',
              }}
            >
              <div style={{ fontSize: '0.72rem', color: 'var(--slate-500)' }}>
                Cryptographic Signature: {previewRx.digitalSignature.slice(0, 32)}...
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#0f766e' }}>Dr. Arun Verma, MD</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--slate-500)' }}>Medical Officer • Ramgarh PHC</div>
              </div>
            </div>

            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button onClick={() => window.print()} className="btn-secondary">
                <Printer size={16} /> Print
              </button>
              <button onClick={() => setPreviewRx(null)} className="btn-primary">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 4: DOWNSTREAM REFERRALS (ServiceRequest)                   */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'referrals' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}>
          {/* Create Referral Form */}
          <form
            onSubmit={handleCreateReferral}
            className="glass-panel"
            style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}
          >
            <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--slate-900)' }}>
              Create Referral to District Hospital
            </div>

            <div>
              <label className="form-label">Patient</label>
              <select
                value={selectedPatientForRef?.id || ''}
                onChange={(e) => {
                  const pat = encounters.map((enc) => enc.patient).find((p) => p.id === e.target.value);
                  if (pat) setSelectedPatientForRef(pat);
                }}
                className="form-input"
                style={{ fontWeight: 600 }}
              >
                {encounters.map((enc) => (
                  <option key={enc.patient.id} value={enc.patient.id}>
                    {enc.patient.name} (ABHA: {enc.patient.abhaId})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label">Referral Priority</label>
              <select
                value={refPriority}
                onChange={(e) => setRefPriority(e.target.value as any)}
                className="form-input"
                style={{ fontWeight: 700 }}
              >
                <option value="STAT">🚨 STAT (Immediate Emergency)</option>
                <option value="URGENT">⚠️ URGENT (Within 12 Hours)</option>
                <option value="ROUTINE">📅 ROUTINE (Within 48 Hours)</option>
              </select>
            </div>

            <div>
              <label className="form-label">Target Facility</label>
              <select className="form-input" disabled value="DH-BILASPUR">
                <option value="DH-BILASPUR">Bilaspur District Civil Hospital (350 Beds)</option>
              </select>
            </div>

            <div>
              <label className="form-label">Clinical Justification / Reason *</label>
              <textarea
                rows={2}
                required
                value={refReason}
                onChange={(e) => setRefReason(e.target.value)}
                placeholder="e.g. Impending eclampsia, Severe acute respiratory distress..."
                className="form-input"
                style={{ resize: 'none' }}
              />
            </div>

            <div>
              <label className="form-label">Pre-Referral Treatment & Stabilization Notes</label>
              <textarea
                rows={2}
                value={refPreTreatment}
                onChange={(e) => setRefPreTreatment(e.target.value)}
                placeholder="e.g. Loading dose MgSO4 given, IV drip running, O2 on 4L/min..."
                className="form-input"
                style={{ resize: 'none' }}
              />
            </div>

            <div>
              <label className="form-label">Ambulance / Transportation Status</label>
              <select
                value={refTransport}
                onChange={(e) => setRefTransport(e.target.value)}
                className="form-input"
              >
                <option value="AMBULANCE_DISPATCHED">108 Emergency Ambulance Dispatched</option>
                <option value="IN_TRANSIT">Patient In Transit</option>
                <option value="SELF_ARRANGED">Family Transport</option>
                <option value="NOT_REQUIRED">Not Required</option>
              </select>
            </div>

            <button type="submit" className="btn-danger" style={{ padding: '12px' }}>
              <Send size={16} /> Submit Downstream Referral
            </button>
          </form>

          {/* Active Referrals Pipeline & Tracking */}
          <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--slate-900)' }}>
                Active District Referrals Tracking ({referrals.length})
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {referrals.map((ref) => (
                <div
                  key={ref.id}
                  style={{
                    padding: '16px',
                    border: '1px solid var(--slate-200)',
                    borderRadius: 'var(--radius-md)',
                    background: ref.status === 'ACCEPTED' ? '#ecfdf5' : '#ffffff',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>{ref.patient.name}</span>
                      <span
                        style={{
                          background: ref.priority === 'STAT' ? 'var(--risk-red)' : 'var(--risk-yellow)',
                          color: '#fff',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                        }}
                      >
                        {ref.priority}
                      </span>
                    </div>

                    <span
                      style={{
                        padding: '4px 10px',
                        borderRadius: '999px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        background:
                          ref.status === 'COMPLETED'
                            ? '#d1fae5'
                            : ref.status === 'ACCEPTED'
                            ? '#e0f2fe'
                            : ref.status === 'IN_TRANSIT'
                            ? '#fef3c7'
                            : '#fee2e2',
                        color:
                          ref.status === 'COMPLETED'
                            ? '#065f46'
                            : ref.status === 'ACCEPTED'
                            ? '#0369a1'
                            : ref.status === 'IN_TRANSIT'
                            ? '#b45309'
                            : '#b91c1c',
                      }}
                    >
                      ● {ref.status}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.8rem', color: 'var(--slate-600)' }}>
                    <strong>Route:</strong> {ref.sourceFacility.name} ➔ {ref.targetFacility.name}
                  </div>

                  <div style={{ fontSize: '0.82rem', color: 'var(--slate-800)' }}>
                    <strong>Reason:</strong> {ref.reasonForReferral}
                  </div>

                  {ref.preReferralTreatment && (
                    <div style={{ fontSize: '0.78rem', color: 'var(--slate-600)', background: 'var(--slate-50)', padding: '6px', borderRadius: '4px' }}>
                      <strong>Stabilization:</strong> {ref.preReferralTreatment}
                    </div>
                  )}

                  {/* Status update buttons */}
                  <div style={{ display: 'flex', gap: '8px', marginTop: '6px', paddingTop: '8px', borderTop: '1px solid var(--slate-100)' }}>
                    <button
                      onClick={() => handleUpdateReferralStatus(ref.id, 'ACCEPTED')}
                      style={{
                        padding: '4px 10px',
                        borderRadius: 'var(--radius-sm)',
                        background: '#e0f2fe',
                        color: '#0369a1',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                      }}
                    >
                      Mark Accepted
                    </button>
                    <button
                      onClick={() => handleUpdateReferralStatus(ref.id, 'IN_TRANSIT')}
                      style={{
                        padding: '4px 10px',
                        borderRadius: 'var(--radius-sm)',
                        background: '#fef3c7',
                        color: '#b45309',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                      }}
                    >
                      Mark In Transit
                    </button>
                    <button
                      onClick={() => handleUpdateReferralStatus(ref.id, 'COMPLETED')}
                      style={{
                        padding: '4px 10px',
                        borderRadius: 'var(--radius-sm)',
                        background: '#d1fae5',
                        color: '#065f46',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                      }}
                    >
                      Mark Completed / Admitted
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
