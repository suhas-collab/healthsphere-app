'use client';

import React, { useState, useEffect } from 'react';
import {
  Building2,
  AlertOctagon,
  Truck,
  PackageMinus,
  HeartPulse,
  Baby,
  RefreshCw,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  MapPin,
  ChevronRight,
  Send,
  AlertCircle,
  ShieldAlert,
  Layers,
  Filter,
  Check,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { getAuthHeaders } from '@/lib/auth/client';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import SpeakButton from '@/components/common/SpeakButton';

interface DashboardData {
  selectedDistrict?: string;
  districts?: string[];
  metrics: {
    totalPatients: number;
    totalEncounters: number;
    redEncounters: number;
    yellowEncounters: number;
    greenEncounters: number;
    redPercentage: number;
    activeReferralsCount: number;
    totalReferralsCount: number;
    stockoutAlertsCount: number;
    highRiskMaternalCount: number;
    highRiskChildCount: number;
  };
  activeReferrals: any[];
  stockoutItems: any[];
  maternalFollowups: any[];
  childFollowups: any[];
  facilities: any[];
}

const DEFAULT_DHO_DATA: DashboardData = {
  selectedDistrict: 'ALL',
  districts: ['Bilaspur', 'Durg', 'Raipur', 'Bastar'],
  metrics: {
    totalPatients: 1284,
    totalEncounters: 1140,
    redEncounters: 3,
    yellowEncounters: 35,
    greenEncounters: 1102,
    redPercentage: 3,
    activeReferralsCount: 8,
    totalReferralsCount: 24,
    stockoutAlertsCount: 4,
    highRiskMaternalCount: 12,
    highRiskChildCount: 8,
  },
  activeReferrals: [
    {
      id: 'ref-01',
      referralCode: 'REF-2026-0042',
      patient: { name: 'Sunita Sharma', abhaId: '91-8843-2210-9988' },
      sourceFacility: { name: 'Bilaspur Health Sub-Centre' },
      targetFacility: { name: 'Bilaspur District Civil Hospital' },
      priority: 'STAT',
      reasonForReferral: 'Severe Pre-eclampsia (BP 172/110) at 34 weeks gestation',
      status: 'IN_TRANSIT',
      createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    },
    {
      id: 'ref-02',
      referralCode: 'REF-2026-0039',
      patient: { name: 'Jagat Ram Soni', abhaId: '91-6654-1123-9980' },
      sourceFacility: { name: 'Ramgarh Primary Health Centre' },
      targetFacility: { name: 'Bilaspur District Civil Hospital' },
      priority: 'URGENT',
      reasonForReferral: 'Severe Lower Respiratory Infection with Hypoxia (SpO2 89%)',
      status: 'ACCEPTED',
      createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    },
    {
      id: 'ref-03',
      referralCode: 'REF-2026-0035',
      patient: { name: 'Priya Kumari', abhaId: '91-7782-9901-3321' },
      sourceFacility: { name: 'Bilaspur Health Sub-Centre' },
      targetFacility: { name: 'Bilaspur District Hospital' },
      priority: 'ROUTINE',
      reasonForReferral: 'Therapeutic iron sucrose infusion for moderate nutritional anemia (Hb 8.2)',
      status: 'PENDING',
      createdAt: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
    },
  ],
  stockoutItems: [
    {
      id: 'inv-001',
      medicineName: 'Oxytocin 10 IU Injection',
      category: 'MATERNAL_CHILD',
      currentStock: 2,
      minimumThreshold: 10,
      unit: 'VIALS',
      facility: { name: 'Bilaspur Health Sub-Centre' },
      isStockout: true,
    },
    {
      id: 'inv-002',
      medicineName: 'Magnesium Sulphate 50% Injection (MgSO4)',
      category: 'EMERGENCY_INJECTABLE',
      currentStock: 4,
      minimumThreshold: 12,
      unit: 'VIALS',
      facility: { name: 'Bilaspur Health Sub-Centre' },
      isStockout: true,
    },
  ],
  maternalFollowups: [
    {
      id: 'pat-001',
      name: 'Sunita Sharma',
      age: 28,
      village: 'Bilaspur Gram',
      gestationalWeeks: 34,
      edd: '2026-10-18',
      encounters: [{ chiefComplaints: 'Severe Pre-eclampsia (BP 172/110)', riskLevel: 'RED' }],
    },
    {
      id: 'pat-003',
      name: 'Priya Kumari',
      age: 22,
      village: 'Jamgaon',
      gestationalWeeks: 24,
      edd: '2026-12-25',
      encounters: [{ chiefComplaints: 'Nutritional Anemia (Hb 8.2 g/dL)', riskLevel: 'YELLOW' }],
    },
  ],
  childFollowups: [
    {
      id: 'pat-004',
      name: 'Aarav Kumar (Infant)',
      age: 1,
      village: 'Bilaspur Gram',
      encounters: [{ chiefComplaints: 'Acute diarrheal dehydration (Resolved with ORS)', riskLevel: 'YELLOW' }],
    },
  ],
  facilities: [
    {
      id: 'fac-sc-bilaspur-01',
      name: 'Bilaspur Health Sub-Centre (Ayushman Arogya Mandir)',
      type: 'SUB_CENTRE',
      block: 'Bilha',
      district: 'Bilaspur',
      catchmentPop: 4500,
      _count: { encounters: 142, referralsOriginating: 6, inventoryItems: 2 },
    },
    {
      id: 'fac-phc-ramgarh',
      name: 'Ramgarh Primary Health Centre (PHC)',
      type: 'PHC',
      block: 'Bilha',
      district: 'Bilaspur',
      catchmentPop: 28000,
      _count: { encounters: 418, referralsOriginating: 12, inventoryItems: 1 },
    },
    {
      id: 'fac-dh-bilaspur',
      name: 'Bilaspur District Civil Hospital',
      type: 'DISTRICT_HOSPITAL',
      block: 'Bilha',
      district: 'Bilaspur',
      catchmentPop: 450000,
      _count: { encounters: 580, referralsOriginating: 0, inventoryItems: 1 },
    },
  ],
};

export default function DhoDashboard() {
  const { language, t } = useLanguage();
  // Pre-populated synchronously with realistic demo metrics
  const [data, setData] = useState<DashboardData>(DEFAULT_DHO_DATA);
  const [loading, setLoading] = useState<boolean>(false);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'referrals' | 'stockouts' | 'mch'>('overview');
  const [replenishingId, setReplenishingId] = useState<string | null>(null);

  // District Selection State
  const [selectedDistrict, setSelectedDistrict] = useState<string>('ALL');
  const [districts, setDistricts] = useState<string[]>(['Bilaspur', 'Raipur', 'Durg', 'Bastar']);
  const [selectedFacilityId, setSelectedFacilityId] = useState<string | null>(null);

  const fetchDashboard = async (districtParam?: string) => {
    const targetDistrict = districtParam !== undefined ? districtParam : selectedDistrict;
    try {
      setIsUpdating(true);
      setError(null);

      const url =
        targetDistrict && targetDistrict !== 'ALL'
          ? `/api/dashboard?district=${encodeURIComponent(targetDistrict)}`
          : '/api/dashboard';

      const res = await fetch(url, {
        headers: getAuthHeaders('DISTRICT_HEALTH_OFFICER'),
      });

      const json = await res.json();
      if (res.ok && json.metrics) {
        setData(json);
        if (json.districts && Array.isArray(json.districts) && json.districts.length > 0) {
          setDistricts(json.districts);
        }
        if (json.selectedDistrict) {
          setSelectedDistrict(json.selectedDistrict);
        }
      }
    } catch (err: any) {
      console.error('Error fetching DHO dashboard data:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  useEffect(() => {
    fetchDashboard(selectedDistrict);
  }, []);

  // Handle District Click
  const handleSelectDistrict = (districtName: string) => {
    setSelectedDistrict(districtName);
    setSelectedFacilityId(null);
    fetchDashboard(districtName);
  };

  // Emergency stock replenish trigger
  const handleReplenishStock = async (itemId: string) => {
    try {
      setReplenishingId(itemId);
      await fetch('/api/inventory', {
        method: 'POST',
        headers: getAuthHeaders('DISTRICT_HEALTH_OFFICER'),
        body: JSON.stringify({ id: itemId, replenishQuantity: 100 }),
      });
      confetti({ particleCount: 60, spread: 60 });
      await fetchDashboard(selectedDistrict);
    } catch (err) {
      console.error(err);
    } finally {
      setReplenishingId(null);
    }
  };

  if (error && !data) {
    return (
      <div style={{ padding: '40px 20px', textAlign: 'center' }}>
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'rgba(239, 68, 68, 0.12)',
            color: 'var(--danger, #ef4444)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px auto',
          }}
        >
          <AlertOctagon size={36} />
        </div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--slate-900)', marginBottom: '8px' }}>
          {t.dho.errorTitle}
        </h2>
        <p style={{ color: 'var(--slate-600)', marginBottom: '24px', fontSize: '0.95rem', lineHeight: '1.5' }}>
          {error}
        </p>
        <button
          onClick={() => fetchDashboard(selectedDistrict)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 24px',
            backgroundColor: 'var(--primary)',
            color: '#ffffff',
            borderRadius: 'var(--radius-md)',
            border: 'none',
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 4px 12px var(--primary-glow)',
          }}
        >
          <RefreshCw size={16} /> {t.dho.retryBtn}
        </button>
      </div>
    );
  }

  const metrics = data?.metrics || {
    totalPatients: 0,
    totalEncounters: 0,
    redEncounters: 0,
    yellowEncounters: 0,
    greenEncounters: 0,
    redPercentage: 0,
    activeReferralsCount: 0,
    totalReferralsCount: 0,
    stockoutAlertsCount: 0,
    highRiskMaternalCount: 0,
    highRiskChildCount: 0,
  };
  const activeReferrals = data?.activeReferrals || [];
  const stockoutItems = data?.stockoutItems || [];
  const maternalFollowups = data?.maternalFollowups || [];
  const childFollowups = data?.childFollowups || [];
  const facilities = data?.facilities || [];

  const isDistrictFiltered = selectedDistrict && selectedDistrict !== 'ALL';
  const totalBeds = facilities.reduce((sum, f) => sum + (f.bedCapacity || 0), 0);
  const totalCatchment = facilities.reduce((sum, f) => sum + (f.catchmentPop || 0), 0);

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* Executive Command Center Banner */}
      <div
        className="glass-panel"
        style={{
          padding: '24px 28px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(240,253,250,0.9) 100%)',
          borderLeft: '6px solid var(--primary)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: 'var(--radius-lg)',
              background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 6px 18px var(--primary-glow)',
            }}
          >
            <Building2 size={30} />
          </div>
          <div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--slate-900)' }}>
              {isDistrictFiltered ? `${selectedDistrict} District Health Overview` : t.dho.districtCommandTitle}
            </div>
            <div style={{ fontSize: '0.88rem', color: 'var(--slate-600)' }}>
              {t.dho.districtOfficerInfo}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <SpeakButton
            text={`जिल्हा आरोग्य आढावा. एकूण तपासण्या: ${metrics.totalEncounters}. आणीबाणी प्रकरणे: ${metrics.redEncounters}. रुग्ण संदर्भ: ${metrics.activeReferralsCount}. औषध साठा कमतरता: ${stockoutItems.length}.`}
            label={language === 'mr' ? 'आढावा ऐका' : 'Listen Overview'}
          />

          <span
            style={{
              background: '#ecfdf5',
              color: '#065f46',
              border: '1px solid #a7f3d0',
              padding: '6px 14px',
              borderRadius: '999px',
              fontSize: '0.8rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
            {t.offline?.onlineBadge || t.nav.onlineMode}
          </span>

          <button
            onClick={() => fetchDashboard(selectedDistrict)}
            disabled={loading}
            className="btn-secondary"
            style={{ padding: '8px 12px', fontSize: '0.8rem' }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> {t.common.refresh}
          </button>
        </div>
      </div>

      {/* District / Location Selection Toolbar */}
      <div
        className="glass-panel"
        style={{
          padding: '16px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          background: '#ffffff',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MapPin size={18} color="var(--primary)" />
            <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--slate-900)' }}>
              {t.dho.selectDistrict}:
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--slate-500)' }}>
              {isDistrictFiltered ? `Filtered by ${selectedDistrict}` : t.dho.allDistricts}
            </span>
          </div>

          {isDistrictFiltered && (
            <button
              onClick={() => handleSelectDistrict('ALL')}
              style={{
                fontSize: '0.78rem',
                color: 'var(--primary)',
                fontWeight: 700,
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              ← {t.dho.resetDistrictFilter}
            </button>
          )}
        </div>

        {/* District Chips */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          <button
            onClick={() => handleSelectDistrict('ALL')}
            style={{
              padding: '7px 14px',
              borderRadius: '999px',
              fontSize: '0.82rem',
              fontWeight: 700,
              border: selectedDistrict === 'ALL' ? '2px solid var(--primary)' : '1px solid var(--slate-200)',
              background: selectedDistrict === 'ALL' ? 'var(--primary-light, #f0fdfa)' : '#ffffff',
              color: selectedDistrict === 'ALL' ? 'var(--primary)' : 'var(--slate-700)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s ease',
            }}
          >
            {selectedDistrict === 'ALL' && <Check size={14} />}
            {t.dho.allDistricts}
          </button>

          {districts.map((d) => {
            const isSelected = selectedDistrict.toLowerCase() === d.toLowerCase();
            return (
              <button
                key={d}
                onClick={() => handleSelectDistrict(d)}
                style={{
                  padding: '7px 14px',
                  borderRadius: '999px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  border: isSelected ? '2px solid var(--primary)' : '1px solid var(--slate-200)',
                  background: isSelected ? 'var(--primary-light, #f0fdfa)' : '#ffffff',
                  color: isSelected ? 'var(--primary)' : 'var(--slate-700)',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease',
                }}
              >
                {isSelected && <Check size={14} />}
                {d}
              </button>
            );
          })}
        </div>
      </div>

      {/* Top 4 KPI Metrics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
        {/* Metric 1: Total Screenings */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--slate-500)' }}>
              {t.dho.totalVisitsCard}
            </span>
            <TrendingUp size={20} color="var(--primary)" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--slate-900)', marginTop: '8px' }}>
            {metrics.totalEncounters}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--slate-600)', marginTop: '4px' }}>
            {isDistrictFiltered ? `In ${selectedDistrict} district` : t.dho.totalVisitsSubtitle}
          </div>
        </div>

        {/* Metric 2: Critical Red Triage % */}
        <div
          className="glass-panel"
          style={{
            padding: '20px',
            borderLeft: '4px solid var(--risk-red)',
            background: metrics.redEncounters > 0 ? 'var(--risk-red-bg)' : '#ffffff',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--risk-red-dark)' }}>
              {t.dho.criticalEmergencyCard}
            </span>
            <AlertOctagon size={20} color="var(--risk-red)" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--risk-red-dark)', marginTop: '8px' }}>
            {metrics.redEncounters}{' '}
            <span style={{ fontSize: '1rem', fontWeight: 600 }}>({metrics.redPercentage || 0}%)</span>
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--risk-red-dark)', marginTop: '4px' }}>
            {t.dho.criticalEmergencySubtitle}
          </div>
        </div>

        {/* Metric 3: Active In-Transit Referrals */}
        <div
          className="glass-panel"
          style={{
            padding: '20px',
            borderLeft: '4px solid #0284c7',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0369a1' }}>
              {t.dho.inTransitReferralsCard}
            </span>
            <Truck size={20} color="#0284c7" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0369a1', marginTop: '8px' }}>
            {metrics.activeReferralsCount}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--slate-600)', marginTop: '4px' }}>
            {t.dho.inTransitSubtitle}
          </div>
        </div>

        {/* Metric 4: Medicine Stockouts */}
        <div
          className="glass-panel"
          style={{
            padding: '20px',
            borderLeft: '4px solid #f59e0b',
            background: stockoutItems.length > 0 ? 'var(--risk-yellow-bg)' : '#ffffff',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--risk-yellow-dark)' }}>
              {t.dho.stockoutAlertsCard}
            </span>
            <PackageMinus size={20} color="#f59e0b" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--risk-yellow-dark)', marginTop: '8px' }}>
            {stockoutItems.length}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--risk-yellow-dark)', marginTop: '4px' }}>
            {t.dho.stockoutSubtitle}
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          borderBottom: '2px solid var(--slate-200)',
          paddingBottom: '2px',
          flexWrap: 'wrap',
        }}
      >
        <button
          onClick={() => setActiveTab('overview')}
          style={{
            padding: '10px 18px',
            fontWeight: 700,
            fontSize: '0.9rem',
            color: activeTab === 'overview' ? 'var(--primary)' : 'var(--slate-600)',
            borderTop: 'none',
            borderLeft: 'none',
            borderRight: 'none',
            borderBottom: activeTab === 'overview' ? '3px solid var(--primary)' : '3px solid transparent',
            background: 'none',
            cursor: 'pointer',
          }}
        >
          {t.dho.overviewTab}
        </button>

        <button
          onClick={() => setActiveTab('referrals')}
          style={{
            padding: '10px 18px',
            fontWeight: 700,
            fontSize: '0.9rem',
            color: activeTab === 'referrals' ? 'var(--primary)' : 'var(--slate-600)',
            borderTop: 'none',
            borderLeft: 'none',
            borderRight: 'none',
            borderBottom: activeTab === 'referrals' ? '3px solid var(--primary)' : '3px solid transparent',
            background: 'none',
            cursor: 'pointer',
          }}
        >
          {t.dho.referralsTab} ({activeReferrals.length})
        </button>

        <button
          onClick={() => setActiveTab('stockouts')}
          style={{
            padding: '10px 18px',
            fontWeight: 700,
            fontSize: '0.9rem',
            color: activeTab === 'stockouts' ? 'var(--primary)' : 'var(--slate-600)',
            borderTop: 'none',
            borderLeft: 'none',
            borderRight: 'none',
            borderBottom: activeTab === 'stockouts' ? '3px solid var(--primary)' : '3px solid transparent',
            background: 'none',
            cursor: 'pointer',
          }}
        >
          {t.dho.stockTab} ({stockoutItems.length})
        </button>

        <button
          onClick={() => setActiveTab('mch')}
          style={{
            padding: '10px 18px',
            fontWeight: 700,
            fontSize: '0.9rem',
            color: activeTab === 'mch' ? 'var(--primary)' : 'var(--slate-600)',
            borderTop: 'none',
            borderLeft: 'none',
            borderRight: 'none',
            borderBottom: activeTab === 'mch' ? '3px solid var(--primary)' : '3px solid transparent',
            background: 'none',
            cursor: 'pointer',
          }}
        >
          {t.dho.mchTab} ({maternalFollowups.length + childFollowups.length})
        </button>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* TAB 1: DISTRICT OVERVIEW & FACILITY COMPARISON                 */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
          {/* Facility Performance Matrix */}
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--slate-900)' }}>
                {t.dho.facilitiesTitle} ({facilities.length})
              </div>
              {isDistrictFiltered && (
                <span style={{ fontSize: '0.8rem', color: 'var(--slate-500)', fontWeight: 600 }}>
                  District: {selectedDistrict} • Total Beds: {totalBeds} • Catchment: {totalCatchment.toLocaleString()}
                </span>
              )}
            </div>

            {facilities.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '36px', background: 'var(--slate-50)', borderRadius: 'var(--radius-md)' }}>
                <Building2 size={32} color="var(--slate-400)" style={{ margin: '0 auto 10px auto' }} />
                <div style={{ fontWeight: 700, color: 'var(--slate-700)' }}>
                  {t.dho.noDistrictData}
                </div>
                <button
                  onClick={() => handleSelectDistrict('ALL')}
                  className="btn-primary"
                  style={{ marginTop: '12px', fontSize: '0.82rem', padding: '6px 16px' }}
                >
                  {t.dho.resetDistrictFilter}
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {facilities.map((f) => {
                  const isSelected = selectedFacilityId === f.id;
                  const encCount = f._count?.encounters ?? 0;
                  const refCount = f._count?.referralsOriginating ?? 0;
                  const alertCount = f._count?.inventoryItems ?? 0;

                  return (
                    <div
                      key={f.id}
                      onClick={() => setSelectedFacilityId(isSelected ? null : f.id)}
                      style={{
                        padding: '16px',
                        border: isSelected ? '2px solid var(--primary)' : '1px solid var(--slate-200)',
                        borderRadius: 'var(--radius-md)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: isSelected ? 'var(--primary-light, #f0fdfa)' : '#ffffff',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--slate-900)' }}>
                          {f.name}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--slate-500)', marginTop: '2px' }}>
                          {t.dho.facilityType}: <strong>{f.type}</strong> • Block: {f.block} • District: {f.district} • Beds: {f.bedCapacity || 0} • Catchment: {(f.catchmentPop || 0).toLocaleString()}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '14px', textAlign: 'right' }}>
                        <div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--slate-500)' }}>{t.dho.facilityVisits}</div>
                          <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--primary)' }}>
                            {encCount}
                          </div>
                        </div>

                        <div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--slate-500)' }}>{t.dho.facilityReferrals}</div>
                          <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#0369a1' }}>
                            {refCount}
                          </div>
                        </div>

                        <div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--slate-500)' }}>{t.dho.facilityAlerts}</div>
                          <div
                            style={{
                              fontWeight: 800,
                              fontSize: '1.1rem',
                              color: alertCount > 0 ? 'var(--risk-red)' : 'var(--risk-green)',
                            }}
                          >
                            {alertCount}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Health Indicators Breakdown */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="glass-panel" style={{ padding: '20px' }}>
              <div style={{ fontWeight: 800, fontSize: '0.95rem', marginBottom: '14px' }}>
                {t.doctor.filterByRisk}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 700, color: 'var(--risk-red-dark)' }}>{t.risk.redEmergency}</span>
                    <span>{metrics.redEncounters} {t.common.records}</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: 'var(--slate-200)', borderRadius: '999px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${metrics.redPercentage || 0}%`,
                        height: '100%',
                        background: 'var(--risk-red)',
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 700, color: 'var(--risk-yellow-dark)' }}>{t.risk.yellowUrgent}</span>
                    <span>{metrics.yellowEncounters} {t.common.records}</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: 'var(--slate-200)', borderRadius: '999px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${metrics.totalEncounters > 0 ? Math.round((metrics.yellowEncounters / metrics.totalEncounters) * 100) : 0}%`,
                        height: '100%',
                        background: 'var(--risk-yellow)',
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 700, color: 'var(--risk-green-dark)' }}>{t.risk.greenStable}</span>
                    <span>{metrics.greenEncounters} {t.common.records}</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: 'var(--slate-200)', borderRadius: '999px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${metrics.totalEncounters > 0 ? Math.round((metrics.greenEncounters / metrics.totalEncounters) * 100) : 0}%`,
                        height: '100%',
                        background: 'var(--risk-green)',
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '20px', background: '#ecfdf5', border: '1px solid #a7f3d0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800, color: '#065f46', fontSize: '0.9rem' }}>
                <CheckCircle2 size={18} /> ABDM FHIR Standards Compliance
              </div>
              <p style={{ fontSize: '0.78rem', color: '#047857', marginTop: '6px', lineHeight: '1.4' }}>
                100% of patient records are linked with validated Ayushman Bharat Health Account (ABHA) IDs. Data conforms to HL7 FHIR R4 specifications for interoperable health information exchange across districts.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 2: ACTIVE REFERRALS PIPELINE                               */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'referrals' && (
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.15rem', color: 'var(--slate-900)' }}>
                {t.dho.referralsTab}
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--slate-500)' }}>
                {t.dho.inTransitSubtitle}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {activeReferrals.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px', color: 'var(--slate-500)' }}>
                {t.common.records}: 0
              </div>
            ) : (
              activeReferrals.map((r) => {
                const sourceName = r.sourceFacility?.name ? r.sourceFacility.name.split(' ')[0] : 'SC';
                const targetName = r.targetFacility?.name ? r.targetFacility.name.split(' ')[0] : 'DH';
                const patientName = r.patient?.name || 'Patient';
                const abhaId = r.patient?.abhaId || '--';

                return (
                  <div
                    key={r.id}
                    style={{
                      padding: '16px 20px',
                      border: '1px solid var(--slate-200)',
                      borderRadius: 'var(--radius-md)',
                      background: r.priority === 'STAT' ? 'var(--risk-red-bg)' : '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '12px',
                    }}
                  >
                    <div style={{ minWidth: '220px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 800, fontSize: '1rem' }}>{patientName}</span>
                        <span
                          style={{
                            background: r.priority === 'STAT' ? 'var(--risk-red)' : 'var(--risk-yellow)',
                            color: '#fff',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                          }}
                        >
                          {r.priority === 'STAT' ? t.risk.redEmergency : t.risk.yellowUrgent}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--slate-600)', marginTop: '2px' }}>
                        ABHA: {abhaId} • Code: {r.referralCode}
                      </div>
                    </div>

                    {/* Route Visualizer */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: 'rgba(255,255,255,0.8)',
                        padding: '6px 14px',
                        borderRadius: '999px',
                        border: '1px solid var(--slate-200)',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                      }}
                    >
                      <span>{sourceName} SC</span>
                      <ArrowRight size={14} color="var(--primary)" />
                      <span style={{ color: 'var(--primary)', fontWeight: 700 }}>
                        {targetName} DH
                      </span>
                    </div>

                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>{t.doctor.refReasonLabel}:</div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--slate-800)', maxWidth: '300px' }}>
                        {r.reasonForReferral}
                      </div>
                    </div>

                    <div>
                      <span
                        style={{
                          padding: '6px 14px',
                          borderRadius: '999px',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          background: r.status === 'ACCEPTED' ? '#e0f2fe' : '#fef3c7',
                          color: r.status === 'ACCEPTED' ? '#0369a1' : '#b45309',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <Truck size={14} /> {r.status} ({r.transportStatus || 'NOT_REQUIRED'})
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 3: MEDICINE STOCKOUT HEATMAP & 1-CLICK REQUISITION         */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'stockouts' && (
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.15rem', color: 'var(--slate-900)' }}>
                {t.dho.stockTab}
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--slate-500)' }}>
                {t.dho.stockoutSubtitle}
              </div>
            </div>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: 'var(--slate-100)', textAlign: 'left', borderBottom: '2px solid var(--slate-300)' }}>
                <th style={{ padding: '10px 12px' }}>{t.dho.facilityName}</th>
                <th style={{ padding: '10px 12px' }}>{t.doctor.stockTableMedicine}</th>
                <th style={{ padding: '10px 12px' }}>{t.common.filter}</th>
                <th style={{ padding: '10px 12px' }}>{t.doctor.stockTableAvailable}</th>
                <th style={{ padding: '10px 12px' }}>{t.doctor.stockTableMinThreshold}</th>
                <th style={{ padding: '10px 12px' }}>{t.doctor.stockTableStatus}</th>
                <th style={{ padding: '10px 12px' }}>{t.common.actions}</th>
              </tr>
            </thead>
            <tbody>
              {stockoutItems.map((item) => (
                <tr
                  key={item.id}
                  style={{
                    borderBottom: '1px solid var(--slate-200)',
                    background: (item.currentStock || 0) <= 5 ? 'var(--risk-red-bg)' : '#ffffff',
                  }}
                >
                  <td style={{ padding: '10px 12px', fontWeight: 700 }}>{item.facility?.name || 'Health Facility'}</td>
                  <td style={{ padding: '10px 12px', fontWeight: 600 }}>{item.medicineName}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <span
                      style={{
                        background: 'var(--slate-100)',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '0.72rem',
                        fontWeight: 600,
                      }}
                    >
                      {item.category}
                    </span>
                  </td>
                  <td style={{ padding: '10px 12px', fontWeight: 800, color: 'var(--risk-red-dark)' }}>
                    {item.currentStock || 0} {item.unit}
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    {item.minimumThreshold} {item.unit}
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <span
                      style={{
                        background: 'var(--risk-red)',
                        color: '#fff',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                      }}
                    >
                      {t.doctor.stockEmpty}
                    </span>
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <button
                      onClick={() => handleReplenishStock(item.id)}
                      disabled={replenishingId === item.id}
                      className="btn-primary"
                      style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                    >
                      <Send size={12} />
                      {replenishingId === item.id ? t.dho.replenishingBtn : t.dho.replenishStockBtn}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 4: HIGH-RISK MATERNAL & CHILD REGISTRY                     */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'mch' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          {/* High-Risk Maternal Registry */}
          <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <HeartPulse size={20} color="#db2777" />
              <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#9d174d' }}>
                {t.dho.mchMaternalTitle} ({maternalFollowups.length})
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {maternalFollowups.map((pat) => (
                <div
                  key={pat.id}
                  style={{
                    padding: '14px',
                    border: '1px solid #fbcfe8',
                    background: '#fdf2f8',
                    borderRadius: 'var(--radius-md)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>{pat.name}</span>
                    <span style={{ fontWeight: 700, color: '#be185d', fontSize: '0.8rem' }}>
                      {pat.gestationalWeeks || 30} {t.dho.mchWeeksPregnant}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.78rem', color: 'var(--slate-600)', marginTop: '2px' }}>
                    {t.common.village}: {pat.village} • District: {pat.district} • ABHA: {pat.abhaId} • Blood Group: {pat.bloodGroup || 'B+'}
                  </div>

                  {pat.encounters && pat.encounters[0] && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--slate-800)', marginTop: '6px' }}>
                      <strong>{t.asha.patientCheckTab}:</strong> {pat.encounters[0].chiefComplaints} (BP: {pat.encounters[0].systolicBP || '--'}/{pat.encounters[0].diastolicBP || '--'})
                    </div>
                  )}

                  <div style={{ marginTop: '8px', fontSize: '0.75rem', color: '#be185d', fontWeight: 600 }}>
                    {t.asha.workerRole}: Sunita Devi
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* High-Risk Child Care Registry */}
          <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Baby size={20} color="#0284c7" />
              <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#0369a1' }}>
                {t.dho.mchChildTitle} ({childFollowups.length})
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {childFollowups.map((pat) => (
                <div
                  key={pat.id}
                  style={{
                    padding: '14px',
                    border: '1px solid #bae6fd',
                    background: '#f0f9ff',
                    borderRadius: 'var(--radius-md)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>{pat.name}</span>
                    <span style={{ fontWeight: 700, color: '#0369a1', fontSize: '0.8rem' }}>
                      {t.common.age}: {pat.age} {t.dho.mchAgeYears} • {t.asha.regGuardianLabel}: {pat.guardianName || 'Mother'}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.78rem', color: 'var(--slate-600)', marginTop: '2px' }}>
                    {t.common.village}: {pat.village} • District: {pat.district} • ABHA: {pat.abhaId}
                  </div>

                  {pat.encounters && pat.encounters[0] && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--slate-800)', marginTop: '6px' }}>
                      <strong>{t.asha.symptomsTitle}:</strong> {pat.encounters[0].chiefComplaints} (SpO2: {pat.encounters[0].spo2 || '--'}%)
                    </div>
                  )}

                  <div style={{ marginTop: '8px', fontSize: '0.75rem', color: '#0369a1', fontWeight: 600 }}>
                    Protocol: IMNCI Oral Zinc + ORS
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
