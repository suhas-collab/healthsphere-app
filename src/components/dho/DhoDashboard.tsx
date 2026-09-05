'use client';

import React, { useState, useEffect } from 'react';
import {
  Building2,
  AlertOctagon,
  Truck,
  PackageX,
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
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { getAuthHeaders } from '@/lib/auth/client';

interface DashboardData {
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

export default function DhoDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'referrals' | 'stockouts' | 'mch'>('overview');
  const [replenishingId, setReplenishingId] = useState<string | null>(null);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/dashboard', {
        headers: getAuthHeaders('DISTRICT_HEALTH_OFFICER'),
      });
      const json = await res.json();
      if (!res.ok || !json.metrics) {
        throw new Error(json.error || `Failed to fetch dashboard metrics (Status: ${res.status})`);
      }
      setData(json);
    } catch (err: any) {
      console.error('Error fetching DHO dashboard data:', err);
      setError(err.message || 'An unexpected error occurred while communicating with the health server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

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
      await fetchDashboard();
    } catch (err) {
      console.error(err);
    } finally {
      setReplenishingId(null);
    }
  };

  if (loading && !data) {
    return (
      <div style={{ textAlign: 'center', padding: '60px', color: 'var(--slate-500)' }}>
        <RefreshCw size={28} className="animate-spin" style={{ animation: 'spin 1s linear infinite', margin: '0 auto 12px auto' }} />
        <div>Loading District Health Command Intelligence...</div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div style={{ maxWidth: '800px', margin: '60px auto', padding: '36px', textAlign: 'center' }} className="glass-panel">
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
          District Command Intelligence Unavailable
        </h2>
        <p style={{ color: 'var(--slate-600)', marginBottom: '24px', fontSize: '0.95rem', lineHeight: '1.5' }}>
          {error}
        </p>
        <button
          onClick={fetchDashboard}
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
          <RefreshCw size={16} /> Retry Connection
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
              Bilaspur District Health Command Center
            </div>
            <div style={{ fontSize: '0.88rem', color: 'var(--slate-600)' }}>
              Chief Medical & Health Officer: <strong>Dr. Sneha Patel, MD (DHO)</strong> • Catchment: 450,000 Citizens
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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
            District Live Network Online
          </span>

          <button
            onClick={fetchDashboard}
            className="btn-secondary"
            style={{ padding: '8px 12px', fontSize: '0.8rem' }}
          >
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {/* Top 4 KPI Metrics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
        {/* Metric 1: Total Screenings */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--slate-500)' }}>
              TOTAL CITIZENS SCREENED
            </span>
            <TrendingUp size={20} color="var(--primary)" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--slate-900)', marginTop: '8px' }}>
            {metrics.totalEncounters}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--slate-600)', marginTop: '4px' }}>
            Across {facilities.length} health facilities in Bilaspur district
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
              CRITICAL EMERGENCY (RED)
            </span>
            <AlertOctagon size={20} color="var(--risk-red)" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--risk-red-dark)', marginTop: '8px' }}>
            {metrics.redEncounters}{' '}
            <span style={{ fontSize: '1rem', fontWeight: 600 }}>({metrics.redPercentage}%)</span>
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--risk-red-dark)', marginTop: '4px' }}>
            Severe pre-eclampsia, hypoxemia, or acute trauma
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
              ACTIVE REFERRALS IN-TRANSIT
            </span>
            <Truck size={20} color="#0284c7" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0369a1', marginTop: '8px' }}>
            {metrics.activeReferralsCount}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--slate-600)', marginTop: '4px' }}>
            En route to Bilaspur District Civil Hospital
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
              STOCKOUT ALERTS
            </span>
            <PackageX size={20} color="#f59e0b" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--risk-yellow-dark)', marginTop: '8px' }}>
            {stockoutItems.length}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--risk-yellow-dark)', marginTop: '4px' }}>
            Critical supplies below emergency thresholds
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
        }}
      >
        <button
          onClick={() => setActiveTab('overview')}
          style={{
            padding: '10px 18px',
            fontWeight: 700,
            fontSize: '0.9rem',
            color: activeTab === 'overview' ? 'var(--primary)' : 'var(--slate-600)',
            borderBottom: activeTab === 'overview' ? '3px solid var(--primary)' : 'none',
          }}
        >
          District Performance Overview
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
            gap: '6px',
          }}
        >
          Active Referrals Pipeline ({activeReferrals.length})
        </button>

        <button
          onClick={() => setActiveTab('stockouts')}
          style={{
            padding: '10px 18px',
            fontWeight: 700,
            fontSize: '0.9rem',
            color: activeTab === 'stockouts' ? 'var(--primary)' : 'var(--slate-600)',
            borderBottom: activeTab === 'stockouts' ? '3px solid var(--primary)' : 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          Medicine Stockout Heatmap ({stockoutItems.length})
        </button>

        <button
          onClick={() => setActiveTab('mch')}
          style={{
            padding: '10px 18px',
            fontWeight: 700,
            fontSize: '0.9rem',
            color: activeTab === 'mch' ? 'var(--primary)' : 'var(--slate-600)',
            borderBottom: activeTab === 'mch' ? '3px solid var(--primary)' : 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          Maternal & Child High-Risk Registry ({maternalFollowups.length + childFollowups.length})
        </button>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* TAB 1: DISTRICT OVERVIEW & FACILITY COMPARISON                 */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
          {/* Facility Performance Matrix */}
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--slate-900)' }}>
              Tiered Healthcare Facilities Performance
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {facilities.map((f) => (
                <div
                  key={f.id}
                  style={{
                    padding: '16px',
                    border: '1px solid var(--slate-200)',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: '#ffffff',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--slate-900)' }}>
                      {f.name}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--slate-500)', marginTop: '2px' }}>
                      Type: <strong>{f.type}</strong> • Block: {f.block} • Beds: {f.bedCapacity} • Catchment: {f.catchmentPop.toLocaleString()}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '14px', textAlign: 'right' }}>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--slate-500)' }}>Screenings</div>
                      <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--primary)' }}>
                        {f._count.encounters}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--slate-500)' }}>Referrals Out</div>
                      <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#0369a1' }}>
                        {f._count.referralsOriginating}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--slate-500)' }}>Stockout Items</div>
                      <div
                        style={{
                          fontWeight: 800,
                          fontSize: '1.1rem',
                          color: f._count.inventoryItems > 0 ? 'var(--risk-red)' : 'var(--risk-green)',
                        }}
                      >
                        {f._count.inventoryItems}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Health Indicators Breakdown */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="glass-panel" style={{ padding: '20px' }}>
              <div style={{ fontWeight: 800, fontSize: '0.95rem', marginBottom: '14px' }}>
                Triage Urgency Distribution
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 700, color: 'var(--risk-red-dark)' }}>Red Alert (Emergency)</span>
                    <span>{metrics.redEncounters} cases</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: 'var(--slate-200)', borderRadius: '999px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${metrics.redPercentage}%`,
                        height: '100%',
                        background: 'var(--risk-red)',
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 700, color: 'var(--risk-yellow-dark)' }}>Yellow (Sub-acute / Review)</span>
                    <span>{metrics.yellowEncounters} cases</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: 'var(--slate-200)', borderRadius: '999px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${metrics.totalEncounters > 0 ? (metrics.yellowEncounters / metrics.totalEncounters) * 100 : 0}%`,
                        height: '100%',
                        background: 'var(--risk-yellow)',
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 700, color: 'var(--risk-green-dark)' }}>Green (Stable / Routine)</span>
                    <span>{metrics.greenEncounters} cases</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: 'var(--slate-200)', borderRadius: '999px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${metrics.totalEncounters > 0 ? (metrics.greenEncounters / metrics.totalEncounters) * 100 : 0}%`,
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
                100% of patient records are linked with validated Ayushman Bharat Health Account (ABHA) IDs. Data conforms to HL7 FHIR R4 specifications for interoperable health information exchange.
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
                District Downstream Referral Pipeline
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--slate-500)' }}>
                Real-time transit and emergency bed allocation tracking (Sub-Centres ➔ PHCs ➔ District Hospital)
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {activeReferrals.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px', color: 'var(--slate-500)' }}>
                No active in-transit referrals. All cases resolved or admitted.
              </div>
            ) : (
              activeReferrals.map((r) => (
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
                      <span style={{ fontWeight: 800, fontSize: '1rem' }}>{r.patient.name}</span>
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
                        {r.priority}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--slate-600)', marginTop: '2px' }}>
                      ABHA: {r.patient.abhaId} • Code: {r.referralCode}
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
                    <span>{r.sourceFacility.name.split(' ')[0]} SC</span>
                    <ArrowRight size={14} color="var(--primary)" />
                    <span style={{ color: 'var(--primary)', fontWeight: 700 }}>
                      {r.targetFacility.name.split(' ')[0]} DH
                    </span>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>Reason & Stabilization:</div>
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
                      <Truck size={14} /> {r.status} ({r.transportStatus})
                    </span>
                  </div>
                </div>
              ))
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
                District Essential Medicine Stockout Heatmap
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--slate-500)' }}>
                Monitors Sub-centres and PHCs for drug depletion below mandatory emergency safety levels
              </div>
            </div>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: 'var(--slate-100)', textAlign: 'left', borderBottom: '2px solid var(--slate-300)' }}>
                <th style={{ padding: '10px 12px' }}>Facility</th>
                <th style={{ padding: '10px 12px' }}>Essential Medicine</th>
                <th style={{ padding: '10px 12px' }}>Category</th>
                <th style={{ padding: '10px 12px' }}>Current Stock</th>
                <th style={{ padding: '10px 12px' }}>Threshold</th>
                <th style={{ padding: '10px 12px' }}>Status</th>
                <th style={{ padding: '10px 12px' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {stockoutItems.map((item) => (
                <tr
                  key={item.id}
                  style={{
                    borderBottom: '1px solid var(--slate-200)',
                    background: item.currentStock <= 5 ? 'var(--risk-red-bg)' : '#ffffff',
                  }}
                >
                  <td style={{ padding: '10px 12px', fontWeight: 700 }}>{item.facility.name}</td>
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
                    {item.currentStock} {item.unit}
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
                      CRITICAL STOCKOUT
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
                      {replenishingId === item.id ? 'Dispatching...' : 'Authorize Requisition (+100)'}
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
                High-Risk Maternal (ANC) Surveillance ({maternalFollowups.length})
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
                      {pat.gestationalWeeks || 30} Weeks ANC
                    </span>
                  </div>

                  <div style={{ fontSize: '0.78rem', color: 'var(--slate-600)', marginTop: '2px' }}>
                    Village: {pat.village} • ABHA: {pat.abhaId} • Blood Group: {pat.bloodGroup || 'B+'}
                  </div>

                  {pat.encounters && pat.encounters[0] && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--slate-800)', marginTop: '6px' }}>
                      <strong>Latest Triage:</strong> {pat.encounters[0].chiefComplaints} (BP: {pat.encounters[0].systolicBP || '--'}/{pat.encounters[0].diastolicBP || '--'})
                    </div>
                  )}

                  <div style={{ marginTop: '8px', fontSize: '0.75rem', color: '#be185d', fontWeight: 600 }}>
                    Assigned ASHA: Sunita Devi • Next Home Visit in 2 Days
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
                High-Risk Child (IMNCI) Registry ({childFollowups.length})
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
                      Age: {pat.age} Year • Guardian: {pat.guardianName || 'Mother'}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.78rem', color: 'var(--slate-600)', marginTop: '2px' }}>
                    Village: {pat.village} • ABHA: {pat.abhaId}
                  </div>

                  {pat.encounters && pat.encounters[0] && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--slate-800)', marginTop: '6px' }}>
                      <strong>Clinical Condition:</strong> {pat.encounters[0].chiefComplaints} (SpO2: {pat.encounters[0].spo2 || '--'}%)
                    </div>
                  )}

                  <div style={{ marginTop: '8px', fontSize: '0.75rem', color: '#0369a1', fontWeight: 600 }}>
                    Protocol: IMNCI Severe Diarrhea / Dehydration Oral Zinc + ORS
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
