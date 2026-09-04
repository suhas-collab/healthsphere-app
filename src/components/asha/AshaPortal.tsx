'use client';

import React, { useState, useEffect } from 'react';
import {
  Heart,
  Activity,
  Thermometer,
  Wind,
  Droplets,
  AlertTriangle,
  CheckCircle,
  Wifi,
  WifiOff,
  RefreshCw,
  UserPlus,
  ClipboardList,
  Database,
  Phone,
  Smartphone,
  Maximize2,
  Calendar,
  Send,
  Baby,
  ShieldAlert,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useSyncEngine } from '@/lib/offline/useSyncEngine';
import { offlineDb, evaluateClinicalRisk, LocalPatient, LocalEncounter } from '@/lib/offline/db';

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

  // View mode: simulated phone frame vs full screen
  const [isPhoneFrame, setIsPhoneFrame] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'triage' | 'register' | 'offline_vault'>('triage');

  // Local state for registered patients
  const [localPatients, setLocalPatients] = useState<LocalPatient[]>([]);
  const [vaultEncounters, setVaultEncounters] = useState<LocalEncounter[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Triage Form State
  const [tempF, setTempF] = useState<string>('98.6');
  const [systolicBP, setSystolicBP] = useState<string>('120');
  const [diastolicBP, setDiastolicBP] = useState<string>('80');
  const [pulseRate, setPulseRate] = useState<string>('76');
  const [spo2, setSpo2] = useState<string>('98');
  const [respRate, setRespRate] = useState<string>('18');
  const [bloodSugar, setBloodSugar] = useState<string>('');
  const [selectedComplaints, setSelectedComplaints] = useState<string[]>([]);
  const [durationDays, setDurationDays] = useState<string>('2');
  const [clinicalNotes, setClinicalNotes] = useState<string>('');

  // Maternal & Child Checks
  const [isPregnantCheck, setIsPregnantCheck] = useState<boolean>(false);
  const [gestationalWeeks, setGestationalWeeks] = useState<string>('28');
  const [isChildCheck, setIsChildCheck] = useState<boolean>(false);

  // Registration Form State
  const [regName, setRegName] = useState<string>('');
  const [regAbha, setRegAbha] = useState<string>('');
  const [regAge, setRegAge] = useState<string>('');
  const [regGender, setRegGender] = useState<'female' | 'male' | 'other'>('female');
  const [regPhone, setRegPhone] = useState<string>('');
  const [regGuardian, setRegGuardian] = useState<string>('');
  const [regVillage, setRegVillage] = useState<string>('Bilaspur Gram');
  const [regBloodGroup, setRegBloodGroup] = useState<string>('B+');
  const [regIsPregnant, setRegIsPregnant] = useState<boolean>(false);
  const [regWeeks, setRegWeeks] = useState<string>('');
  const [regEdd, setRegEdd] = useState<string>('');

  // Toast / notification
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'alert'; text: string } | null>(null);

  const showToast = (text: string, type: 'success' | 'alert' = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 4000);
  };

  // Load patients and encounters from Dexie
  const loadLocalData = async () => {
    try {
      const pats = await offlineDb.patients.toArray();
      setLocalPatients(pats);
      if (pats.length > 0 && !selectedPatientId) {
        setSelectedPatientId(pats[0].id);
        setIsPregnantCheck(pats[0].isPregnant);
      }

      const encs = await offlineDb.triageEncounters.orderBy('encounterDate').reverse().toArray();
      setVaultEncounters(encs);
    } catch (e) {
      console.error('Dexie load error:', e);
    }
  };

  useEffect(() => {
    loadLocalData();
  }, [pendingCount]);

  // When patient selection changes
  const handleSelectPatient = (pId: string) => {
    setSelectedPatientId(pId);
    const pat = localPatients.find((p) => p.id === pId);
    if (pat) {
      setIsPregnantCheck(pat.isPregnant);
      if (pat.gestationalWeeks) setGestationalWeeks(String(pat.gestationalWeeks));
      setIsChildCheck(pat.age <= 5);
    }
  };

  // Evaluate clinical risk in real-time
  const selectedPatient = localPatients.find((p) => p.id === selectedPatientId);

  const riskAssessment = evaluateClinicalRisk({
    temperatureF: tempF ? parseFloat(tempF) : undefined,
    systolicBP: systolicBP ? parseInt(systolicBP) : undefined,
    diastolicBP: diastolicBP ? parseInt(diastolicBP) : undefined,
    pulseRate: pulseRate ? parseInt(pulseRate) : undefined,
    spo2: spo2 ? parseFloat(spo2) : undefined,
    respiratoryRate: respRate ? parseInt(respRate) : undefined,
    chiefComplaints: selectedComplaints,
    isPregnant: isPregnantCheck,
    gestationalWeeks: gestationalWeeks ? parseInt(gestationalWeeks) : undefined,
    age: selectedPatient ? selectedPatient.age : 30,
  });

  const toggleComplaint = (complaint: string) => {
    if (selectedComplaints.includes(complaint)) {
      setSelectedComplaints(selectedComplaints.filter((c) => c !== complaint));
    } else {
      setSelectedComplaints([...selectedComplaints, complaint]);
    }
  };

  // Generate valid 14-digit ABHA ID format
  const generateDemoAbha = () => {
    const p1 = Math.floor(10 + Math.random() * 89);
    const p2 = Math.floor(1000 + Math.random() * 9000);
    const p3 = Math.floor(1000 + Math.random() * 9000);
    const p4 = Math.floor(1000 + Math.random() * 9000);
    setRegAbha(`${p1}-${p2}-${p3}-${p4}`);
  };

  // Submit Patient Registration
  const handleRegisterPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName || !regPhone) {
      showToast('Please enter patient name and phone number', 'alert');
      return;
    }

    const abhaToUse =
      regAbha ||
      `91-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`;

    const saved = await saveLocalPatient({
      abhaId: abhaToUse,
      abhaAddress: `${regName.toLowerCase().replace(/\s+/g, '')}@abdm`,
      name: regName,
      gender: regGender,
      age: parseInt(regAge) || 28,
      phone: regPhone,
      guardianName: regGuardian,
      village: regVillage,
      subCentre: 'Bilaspur Health Sub-Centre',
      block: 'Bilha',
      district: 'Bilaspur',
      bloodGroup: regBloodGroup,
      isPregnant: regIsPregnant,
      gestationalWeeks: regWeeks ? parseInt(regWeeks) : undefined,
      edd: regEdd,
    });

    confetti({ particleCount: 40, spread: 60, origin: { y: 0.8 } });
    showToast(`Patient ${saved.name} registered (ABHA: ${saved.abhaId})!`);

    // Reset and switch to triage
    setRegName('');
    setRegAbha('');
    setRegAge('');
    setRegPhone('');
    setSelectedPatientId(saved.id);
    await loadLocalData();
    setActiveTab('triage');
  };

  // Submit Clinical Triage Form
  const handleSubmitTriage = async (options?: { requestTeleconsult?: boolean; createReferral?: boolean }) => {
    if (!selectedPatient) {
      showToast('Please select or register a patient first', 'alert');
      return;
    }

    const newEncounter = await saveLocalEncounter({
      patientId: selectedPatient.id,
      patientAbhaId: selectedPatient.abhaId,
      patientName: selectedPatient.name,
      patientAge: selectedPatient.age,
      patientGender: selectedPatient.gender,
      patientVillage: selectedPatient.village,
      healthWorkerId: 'HW-ASHA-001',
      healthWorkerName: 'Sunita Devi (ASHA)',
      facilityId: 'SC-BILASPUR-01',
      facilityName: 'Bilaspur Health Sub-Centre',
      encounterDate: new Date().toISOString(),
      temperatureF: tempF ? parseFloat(tempF) : undefined,
      systolicBP: systolicBP ? parseInt(systolicBP) : undefined,
      diastolicBP: diastolicBP ? parseInt(diastolicBP) : undefined,
      pulseRate: pulseRate ? parseInt(pulseRate) : undefined,
      spo2: spo2 ? parseFloat(spo2) : undefined,
      respiratoryRate: respRate ? parseInt(respRate) : undefined,
      bloodGlucoseMgDl: bloodSugar ? parseFloat(bloodSugar) : undefined,
      chiefComplaints: selectedComplaints,
      durationDays: durationDays ? parseInt(durationDays) : 1,
      clinicalNotes,
      riskLevel: riskAssessment.riskLevel,
      triageRationale: riskAssessment.rationale.join('; '),
      isHighRiskMaternal: riskAssessment.isMaternalHighRisk || isPregnantCheck,
      isHighRiskChild: riskAssessment.isChildHighRisk || isChildCheck,
      dangerSigns: riskAssessment.dangerSigns.join(', '),
      requestTeleconsult: Boolean(options?.requestTeleconsult || riskAssessment.riskLevel === 'RED'),
      createReferral: Boolean(options?.createReferral || riskAssessment.riskLevel === 'RED'),
      referralPriority: riskAssessment.riskLevel === 'RED' ? 'STAT' : 'URGENT',
    });

    confetti({ particleCount: 70, spread: 70, origin: { y: 0.7 } });
    showToast(
      `Triage saved offline! Tagged as ${riskAssessment.riskLevel} ${
        isOnline ? 'and auto-syncing with PHC...' : '(Queued in Dexie offline)'
      }`
    );

    // Reset complaints
    setSelectedComplaints([]);
    setClinicalNotes('');
    await loadLocalData();
  };

  const content = (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Top Frontline Worker Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#ffffff',
          padding: '12px 14px',
          borderRadius: 'var(--radius-md)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #0d9488, #0f766e)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 700,
              fontSize: '1rem',
            }}
          >
            SD
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--slate-900)' }}>Sunita Devi</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>
              ASHA Worker • Bilaspur Sub-Centre
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsPhoneFrame(!isPhoneFrame)}
          title="Toggle phone frame preview"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '6px 10px',
            background: 'var(--slate-100)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.75rem',
            fontWeight: 600,
            color: 'var(--slate-700)',
          }}
        >
          {isPhoneFrame ? <Maximize2 size={14} /> : <Smartphone size={14} />}
          {isPhoneFrame ? 'Expand' : 'Phone View'}
        </button>
      </div>

      {/* Online / Offline Sync Status Bar */}
      <div
        className={`sync-statusbar ${isOnline ? (isSyncing ? 'syncing' : 'online') : 'offline'}`}
        style={{ borderRadius: 'var(--radius-md)' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isOnline ? (
            isSyncing ? (
              <RefreshCw size={16} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
            ) : (
              <Wifi size={16} />
            )
          ) : (
            <WifiOff size={16} />
          )}
          <span>
            {isOnline
              ? isSyncing
                ? 'Syncing with PHC server...'
                : 'Online Mode (Auto-Sync Active)'
              : 'Offline Mode (Dexie IDB Active)'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {pendingCount > 0 && (
            <span
              style={{
                background: '#f59e0b',
                color: '#fff',
                padding: '2px 8px',
                borderRadius: '999px',
                fontSize: '0.72rem',
                fontWeight: 700,
              }}
            >
              {pendingCount} pending
            </span>
          )}

          <button
            onClick={() => syncNow()}
            disabled={isSyncing || !isOnline}
            style={{
              padding: '3px 8px',
              borderRadius: 'var(--radius-sm)',
              background: '#0d9488',
              color: '#fff',
              fontSize: '0.75rem',
              fontWeight: 600,
            }}
          >
            Sync Now
          </button>
        </div>
      </div>

      {/* Quick Tabs: Triage | New Patient | Offline Vault */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: '6px',
          background: 'var(--slate-100)',
          padding: '4px',
          borderRadius: 'var(--radius-md)',
        }}
      >
        <button
          onClick={() => setActiveTab('triage')}
          style={{
            padding: '8px',
            borderRadius: 'var(--radius-sm)',
            fontWeight: 700,
            fontSize: '0.8rem',
            background: activeTab === 'triage' ? '#ffffff' : 'transparent',
            color: activeTab === 'triage' ? 'var(--primary)' : 'var(--slate-600)',
            boxShadow: activeTab === 'triage' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
          }}
        >
          <Activity size={15} /> Triage
        </button>
        <button
          onClick={() => setActiveTab('register')}
          style={{
            padding: '8px',
            borderRadius: 'var(--radius-sm)',
            fontWeight: 700,
            fontSize: '0.8rem',
            background: activeTab === 'register' ? '#ffffff' : 'transparent',
            color: activeTab === 'register' ? 'var(--primary)' : 'var(--slate-600)',
            boxShadow: activeTab === 'register' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
          }}
        >
          <UserPlus size={15} /> Register
        </button>
        <button
          onClick={() => setActiveTab('offline_vault')}
          style={{
            padding: '8px',
            borderRadius: 'var(--radius-sm)',
            fontWeight: 700,
            fontSize: '0.8rem',
            background: activeTab === 'offline_vault' ? '#ffffff' : 'transparent',
            color: activeTab === 'offline_vault' ? 'var(--primary)' : 'var(--slate-600)',
            boxShadow: activeTab === 'offline_vault' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
          }}
        >
          <Database size={15} /> Vault ({vaultEncounters.length})
        </button>
      </div>

      {/* Toast Notification Alert */}
      {toastMsg && (
        <div
          style={{
            padding: '10px 14px',
            borderRadius: 'var(--radius-md)',
            background: toastMsg.type === 'alert' ? '#fef2f2' : '#ecfdf5',
            color: toastMsg.type === 'alert' ? '#991b1b' : '#065f46',
            border: `1px solid ${toastMsg.type === 'alert' ? '#fecdd3' : '#a7f3d0'}`,
            fontSize: '0.85rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          {toastMsg.type === 'alert' ? <AlertTriangle size={16} /> : <CheckCircle size={16} />}
          {toastMsg.text}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 1: CLINICAL TRIAGE SCREEN                                 */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'triage' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Patient Selection Dropdown */}
          <div className="glass-panel" style={{ padding: '14px' }}>
            <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Select Patient for Triage</span>
              <span style={{ color: 'var(--primary)', cursor: 'pointer' }} onClick={() => setActiveTab('register')}>
                + New Patient
              </span>
            </label>
            <select
              value={selectedPatientId}
              onChange={(e) => handleSelectPatient(e.target.value)}
              className="form-input"
              style={{ fontWeight: 600 }}
            >
              {localPatients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.age}y, {p.gender}) • ABHA: {p.abhaId} • {p.village}
                </option>
              ))}
            </select>

            {selectedPatient && (
              <div
                style={{
                  marginTop: '10px',
                  display: 'flex',
                  gap: '8px',
                  flexWrap: 'wrap',
                  fontSize: '0.78rem',
                  color: 'var(--slate-600)',
                }}
              >
                <span
                  style={{
                    background: 'var(--slate-100)',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontWeight: 600,
                  }}
                >
                  📍 {selectedPatient.village}
                </span>
                <span
                  style={{
                    background: 'var(--slate-100)',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontWeight: 600,
                  }}
                >
                  📞 {selectedPatient.phone}
                </span>
                {selectedPatient.isPregnant && (
                  <span
                    style={{
                      background: '#fdf2f8',
                      color: '#db2777',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontWeight: 700,
                    }}
                  >
                    🤰 ANC ({selectedPatient.gestationalWeeks || 24}w)
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Point-of-Care Vitals Grid */}
          <div className="glass-panel" style={{ padding: '14px' }}>
            <div
              style={{
                fontSize: '0.9rem',
                fontWeight: 700,
                color: 'var(--slate-900)',
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Heart size={18} color="var(--primary)" /> Vital Signs Measurement
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {/* Temperature */}
              <div>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Thermometer size={14} color="#f59e0b" /> Temp (°F)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={tempF}
                  onChange={(e) => setTempF(e.target.value)}
                  className="form-input"
                  style={{
                    borderColor: parseFloat(tempF) >= 100.4 ? 'var(--risk-red)' : 'var(--slate-200)',
                    fontWeight: 700,
                  }}
                />
                <span style={{ fontSize: '0.7rem', color: 'var(--slate-500)' }}>
                  {parseFloat(tempF) >= 100.4 ? '⚠️ Fever' : 'Normal: 97-99°F'}
                </span>
              </div>

              {/* Pulse Rate with heart animation */}
              <div>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span className="animate-pulse-heart">❤️</span> Pulse (bpm)
                </label>
                <input
                  type="number"
                  value={pulseRate}
                  onChange={(e) => setPulseRate(e.target.value)}
                  className="form-input"
                  style={{
                    borderColor:
                      parseInt(pulseRate) > 105 || parseInt(pulseRate) < 50
                        ? 'var(--risk-red)'
                        : 'var(--slate-200)',
                    fontWeight: 700,
                  }}
                />
                <span style={{ fontSize: '0.7rem', color: 'var(--slate-500)' }}>
                  {parseInt(pulseRate) > 105 ? '⚠️ Tachycardia' : 'Normal: 60-100'}
                </span>
              </div>

              {/* Systolic BP */}
              <div>
                <label className="form-label">BP Systolic (mmHg)</label>
                <input
                  type="number"
                  value={systolicBP}
                  onChange={(e) => setSystolicBP(e.target.value)}
                  className="form-input"
                  style={{
                    borderColor: parseInt(systolicBP) >= 140 ? 'var(--risk-red)' : 'var(--slate-200)',
                    fontWeight: 700,
                  }}
                />
                <span style={{ fontSize: '0.7rem', color: 'var(--slate-500)' }}>
                  {parseInt(systolicBP) >= 160 ? '🚨 Hypertensive Crisis' : 'Target: <120'}
                </span>
              </div>

              {/* Diastolic BP */}
              <div>
                <label className="form-label">BP Diastolic (mmHg)</label>
                <input
                  type="number"
                  value={diastolicBP}
                  onChange={(e) => setDiastolicBP(e.target.value)}
                  className="form-input"
                  style={{
                    borderColor: parseInt(diastolicBP) >= 90 ? 'var(--risk-red)' : 'var(--slate-200)',
                    fontWeight: 700,
                  }}
                />
                <span style={{ fontSize: '0.7rem', color: 'var(--slate-500)' }}>Target: &lt;80 mmHg</span>
              </div>

              {/* SpO2 */}
              <div>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Droplets size={14} color="#0284c7" /> SpO2 (%)
                </label>
                <input
                  type="number"
                  value={spo2}
                  onChange={(e) => setSpo2(e.target.value)}
                  className="form-input"
                  style={{
                    borderColor: parseFloat(spo2) < 94 ? 'var(--risk-red)' : 'var(--slate-200)',
                    fontWeight: 700,
                  }}
                />
                <span style={{ fontSize: '0.7rem', color: 'var(--slate-500)' }}>
                  {parseFloat(spo2) < 92 ? '🚨 Hypoxia Alert' : 'Normal: >=95%'}
                </span>
              </div>

              {/* Respiratory Rate */}
              <div>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Wind size={14} color="#64748b" /> Resp Rate (/min)
                </label>
                <input
                  type="number"
                  value={respRate}
                  onChange={(e) => setRespRate(e.target.value)}
                  className="form-input"
                  style={{ fontWeight: 700 }}
                />
                <span style={{ fontSize: '0.7rem', color: 'var(--slate-500)' }}>Normal: 12-20</span>
              </div>
            </div>
          </div>

          {/* Chief Complaints Multi-Select Pills */}
          <div className="glass-panel" style={{ padding: '14px' }}>
            <label className="form-label">Chief Complaints / Presenting Symptoms</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
              {COMMON_COMPLAINTS.map((c) => {
                const isSelected = selectedComplaints.includes(c);
                const isUrgent =
                  c.includes('Chest Pain') ||
                  c.includes('Bleeding') ||
                  c.includes('Convulsions') ||
                  c.includes('Breathlessness');

                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => toggleComplaint(c)}
                    style={{
                      padding: '6px 10px',
                      borderRadius: '999px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      background: isSelected
                        ? isUrgent
                          ? 'var(--risk-red)'
                          : 'var(--primary)'
                        : 'var(--slate-100)',
                      color: isSelected ? '#ffffff' : 'var(--slate-700)',
                      border: isSelected ? 'none' : '1px solid var(--slate-200)',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {isSelected ? '✓ ' : '+ '}
                    {c}
                  </button>
                );
              })}
            </div>

            <div style={{ marginTop: '12px' }}>
              <label className="form-label">Clinical Notes / Field Observations</label>
              <textarea
                rows={2}
                value={clinicalNotes}
                onChange={(e) => setClinicalNotes(e.target.value)}
                placeholder="Observed signs, pedal edema, skin turgor, home medications given..."
                className="form-input"
                style={{ resize: 'none' }}
              />
            </div>
          </div>

          {/* Maternal / Child Health High-Risk Check */}
          <div
            className="glass-panel"
            style={{
              padding: '12px 14px',
              borderLeft: '4px solid #db2777',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#9d174d' }}>
                🤰 Maternal (ANC) & Child Health Surveillance
              </span>
              <input
                type="checkbox"
                checked={isPregnantCheck}
                onChange={(e) => setIsPregnantCheck(e.target.checked)}
                style={{ width: '18px', height: '18px' }}
              />
            </div>

            {isPregnantCheck && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '4px' }}>
                <div>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>
                    Gestational Weeks
                  </label>
                  <input
                    type="number"
                    value={gestationalWeeks}
                    onChange={(e) => setGestationalWeeks(e.target.value)}
                    className="form-input"
                    style={{ padding: '6px 10px', fontSize: '0.85rem' }}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', paddingTop: '18px' }}>
                  <input
                    type="checkbox"
                    checked={riskAssessment.isMaternalHighRisk}
                    readOnly
                    style={{ accentColor: 'var(--risk-red)' }}
                  />
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--risk-red-dark)' }}>
                    High-Risk Pregnancy Flag
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Automated Clinical Triage Risk Card */}
          <div
            style={{
              padding: '16px',
              borderRadius: 'var(--radius-lg)',
              background:
                riskAssessment.riskLevel === 'RED'
                  ? 'var(--risk-red-bg)'
                  : riskAssessment.riskLevel === 'YELLOW'
                  ? 'var(--risk-yellow-bg)'
                  : 'var(--risk-green-bg)',
              border: `2px solid ${
                riskAssessment.riskLevel === 'RED'
                  ? 'var(--risk-red)'
                  : riskAssessment.riskLevel === 'YELLOW'
                  ? 'var(--risk-yellow)'
                  : 'var(--risk-green)'
              }`,
              boxShadow:
                riskAssessment.riskLevel === 'RED'
                  ? '0 0 16px var(--risk-red-glow)'
                  : 'none',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    width: '14px',
                    height: '14px',
                    borderRadius: '50%',
                    background:
                      riskAssessment.riskLevel === 'RED'
                        ? 'var(--risk-red)'
                        : riskAssessment.riskLevel === 'YELLOW'
                        ? 'var(--risk-yellow)'
                        : 'var(--risk-green)',
                  }}
                  className={riskAssessment.riskLevel === 'RED' ? 'beacon-red' : ''}
                />
                <span
                  style={{
                    fontWeight: 800,
                    fontSize: '1.1rem',
                    color:
                      riskAssessment.riskLevel === 'RED'
                        ? 'var(--risk-red-dark)'
                        : riskAssessment.riskLevel === 'YELLOW'
                        ? 'var(--risk-yellow-dark)'
                        : 'var(--risk-green-dark)',
                  }}
                >
                  {riskAssessment.riskLevel} TAG • {riskAssessment.riskLevel === 'RED' ? 'EMERGENCY' : riskAssessment.riskLevel === 'YELLOW' ? 'MODERATE RISK' : 'STABLE'}
                </span>
              </div>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase' }}>
                Algorithmic Triage
              </span>
            </div>

            <div style={{ marginTop: '10px' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '4px' }}>
                Clinical Rationale:
              </div>
              <ul style={{ paddingLeft: '18px', fontSize: '0.78rem', lineHeight: '1.4' }}>
                {riskAssessment.rationale.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>

            <div
              style={{
                marginTop: '10px',
                paddingTop: '8px',
                borderTop: '1px dashed rgba(0,0,0,0.15)',
                fontSize: '0.8rem',
                fontWeight: 600,
              }}
            >
              Action: {riskAssessment.recommendedAction}
            </div>
          </div>

          {/* Submission & Action Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
              onClick={() => handleSubmitTriage()}
              className="btn-primary"
              style={{ width: '100%', padding: '14px' }}
            >
              <CheckCircle size={18} /> Save Triage (Offline Safe)
            </button>

            {riskAssessment.riskLevel === 'RED' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <button
                  onClick={() => handleSubmitTriage({ requestTeleconsult: true })}
                  className="btn-danger"
                  style={{ fontSize: '0.8rem', padding: '10px 8px' }}
                >
                  <Phone size={14} /> Request Video MO
                </button>
                <button
                  onClick={() => handleSubmitTriage({ createReferral: true })}
                  className="btn-secondary"
                  style={{
                    borderColor: 'var(--risk-red-border)',
                    color: 'var(--risk-red-dark)',
                    fontSize: '0.8rem',
                    padding: '10px 8px',
                  }}
                >
                  <Send size={14} /> Referral to DH
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 2: PATIENT REGISTRATION FORM                              */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'register' && (
        <form onSubmit={handleRegisterPatient} className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--slate-900)' }}>
              ABDM Patient Registration
            </div>
            <button
              type="button"
              onClick={generateDemoAbha}
              style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                color: 'var(--primary)',
                background: 'var(--primary-light)',
                padding: '4px 8px',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              Generate Demo ABHA
            </button>
          </div>

          <div>
            <label className="form-label">ABHA ID (Ayushman Bharat Health Account)</label>
            <input
              type="text"
              placeholder="e.g. 91-4523-8891-2341"
              value={regAbha}
              onChange={(e) => setRegAbha(e.target.value)}
              className="form-input"
            />
          </div>

          <div>
            <label className="form-label">Full Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Meena Bai Patel"
              value={regName}
              onChange={(e) => setRegName(e.target.value)}
              className="form-input"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label className="form-label">Age (Years) *</label>
              <input
                type="number"
                required
                placeholder="28"
                value={regAge}
                onChange={(e) => setRegAge(e.target.value)}
                className="form-input"
              />
            </div>
            <div>
              <label className="form-label">Gender</label>
              <select
                value={regGender}
                onChange={(e) => setRegGender(e.target.value as any)}
                className="form-input"
              >
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label className="form-label">Phone Number *</label>
              <input
                type="tel"
                required
                placeholder="+91 98261..."
                value={regPhone}
                onChange={(e) => setRegPhone(e.target.value)}
                className="form-input"
              />
            </div>
            <div>
              <label className="form-label">Blood Group</label>
              <select
                value={regBloodGroup}
                onChange={(e) => setRegBloodGroup(e.target.value)}
                className="form-input"
              >
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
              </select>
            </div>
          </div>

          <div>
            <label className="form-label">Father / Husband Name</label>
            <input
              type="text"
              placeholder="e.g. Santosh Patel (Husband)"
              value={regGuardian}
              onChange={(e) => setRegGuardian(e.target.value)}
              className="form-input"
            />
          </div>

          <div>
            <label className="form-label">Village / Habitation</label>
            <select
              value={regVillage}
              onChange={(e) => setRegVillage(e.target.value)}
              className="form-input"
            >
              <option value="Bilaspur Gram">Bilaspur Gram</option>
              <option value="Khaira">Khaira</option>
              <option value="Jamgaon">Jamgaon</option>
              <option value="Bilha Town">Bilha Town</option>
            </select>
          </div>

          {/* Maternal Enrollment */}
          <div
            style={{
              padding: '10px',
              background: '#fdf2f8',
              borderRadius: 'var(--radius-md)',
              border: '1px solid #fbcfe8',
            }}
          >
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={regIsPregnant}
                onChange={(e) => setRegIsPregnant(e.target.checked)}
                style={{ width: '16px', height: '16px' }}
              />
              <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#9d174d' }}>
                Enroll as Pregnant Mother (ANC Tracker)
              </span>
            </label>

            {regIsPregnant && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '8px' }}>
                <div>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>
                    Gestational Weeks
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 24"
                    value={regWeeks}
                    onChange={(e) => setRegWeeks(e.target.value)}
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>
                    Expected Delivery Date (EDD)
                  </label>
                  <input
                    type="date"
                    value={regEdd}
                    onChange={(e) => setRegEdd(e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>
            )}
          </div>

          <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '6px' }}>
            <UserPlus size={16} /> Register & Save (Offline Dexie)
          </button>
        </form>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 3: OFFLINE VAULT & DEXIE DATABASE INSPECTOR               */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'offline_vault' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div className="glass-panel" style={{ padding: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Dexie.js IndexedDB Records</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>
                {vaultEncounters.length} triage records cached
              </span>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--slate-600)' }}>
              All records below are stored locally inside the frontline worker's device storage (IndexedDB). They are available 100% offline and automatically sync when network is restored.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {vaultEncounters.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px', color: 'var(--slate-400)', fontSize: '0.85rem' }}>
                No triage encounters captured on this device yet.
              </div>
            ) : (
              vaultEncounters.map((enc) => (
                <div
                  key={enc.id}
                  className="glass-panel"
                  style={{
                    padding: '12px',
                    borderLeft: `4px solid ${
                      enc.riskLevel === 'RED'
                        ? 'var(--risk-red)'
                        : enc.riskLevel === 'YELLOW'
                        ? 'var(--risk-yellow)'
                        : 'var(--risk-green)'
                    }`,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>{enc.patientName}</span>
                    <span
                      className={`badge-${enc.riskLevel.toLowerCase()}`}
                      style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '0.72rem' }}
                    >
                      {enc.riskLevel}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)', marginTop: '4px' }}>
                    ABHA: {enc.patientAbhaId} • {new Date(enc.encounterDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>

                  <div style={{ fontSize: '0.78rem', color: 'var(--slate-700)', marginTop: '4px' }}>
                    Vitals: BP {enc.systolicBP || '--'}/{enc.diastolicBP || '--'} | SpO2 {enc.spo2 || '--'}% | Temp {enc.temperatureF || '--'}°F | Pulse {enc.pulseRate || '--'} bpm
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--slate-600)' }}>
                      Complaints: {enc.chiefComplaints.slice(0, 2).join(', ')}
                    </span>
                    <span
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        color: enc.syncStatus === 'synced' ? 'var(--risk-green-dark)' : '#b45309',
                      }}
                    >
                      {enc.syncStatus === 'synced' ? '✓ Synced' : '⏳ Pending Sync'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div style={{ width: '100%' }}>
      {isPhoneFrame ? (
        <div className="mobile-device-frame">
          <div className="mobile-notch" />
          <div style={{ height: 'calc(100% - 22px)', overflowY: 'auto' }}>{content}</div>
        </div>
      ) : (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>{content}</div>
      )}
    </div>
  );
}
