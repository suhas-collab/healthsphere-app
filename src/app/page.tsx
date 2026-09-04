'use client';

import React, { useState } from 'react';
import {
  Heart,
  Stethoscope,
  Building2,
  Layers,
  Smartphone,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import AshaPortal from '@/components/asha/AshaPortal';
import DoctorPortal from '@/components/doctor/DoctorPortal';
import DhoDashboard from '@/components/dho/DhoDashboard';
import FhirSchemaExplorer from '@/components/schema/FhirSchemaExplorer';

export default function Home() {
  const [activeRole, setActiveRole] = useState<'asha' | 'doctor' | 'dho' | 'schema'>('asha');

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Application Header & Role Switcher */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          background: 'rgba(255, 255, 255, 0.94)',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid var(--slate-200)',
          padding: '12px 24px',
        }}
      >
        <div
          style={{
            maxWidth: '1400px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          {/* Logo & Platform Name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                boxShadow: '0 4px 10px rgba(13, 148, 136, 0.25)',
              }}
            >
              <Heart size={20} fill="#ffffff" />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.15rem', color: 'var(--slate-900)', letterSpacing: '-0.3px' }}>
                SwasthyaSeva <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', background: 'var(--primary-light)', padding: '2px 8px', borderRadius: '4px', marginLeft: '4px' }}>MVP</span>
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--slate-500)' }}>
                Tiered Rural Public Healthcare & Frontline PWA
              </div>
            </div>
          </div>

          {/* Unified Role Switcher Pills */}
          <nav
            style={{
              display: 'flex',
              background: 'var(--slate-100)',
              padding: '4px',
              borderRadius: 'var(--radius-lg)',
              gap: '4px',
            }}
          >
            <button
              onClick={() => setActiveRole('asha')}
              style={{
                padding: '8px 14px',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.82rem',
                fontWeight: 700,
                background: activeRole === 'asha' ? '#ffffff' : 'transparent',
                color: activeRole === 'asha' ? 'var(--primary)' : 'var(--slate-600)',
                boxShadow: activeRole === 'asha' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Smartphone size={16} /> 1. ASHA / ANM PWA
            </button>

            <button
              onClick={() => setActiveRole('doctor')}
              style={{
                padding: '8px 14px',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.82rem',
                fontWeight: 700,
                background: activeRole === 'doctor' ? '#ffffff' : 'transparent',
                color: activeRole === 'doctor' ? 'var(--primary)' : 'var(--slate-600)',
                boxShadow: activeRole === 'doctor' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Stethoscope size={16} /> 2. PHC Doctor Portal
            </button>

            <button
              onClick={() => setActiveRole('dho')}
              style={{
                padding: '8px 14px',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.82rem',
                fontWeight: 700,
                background: activeRole === 'dho' ? '#ffffff' : 'transparent',
                color: activeRole === 'dho' ? 'var(--primary)' : 'var(--slate-600)',
                boxShadow: activeRole === 'dho' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Building2 size={16} /> 3. District DHO Dashboard
            </button>

            <button
              onClick={() => setActiveRole('schema')}
              style={{
                padding: '8px 14px',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.82rem',
                fontWeight: 700,
                background: activeRole === 'schema' ? '#ffffff' : 'transparent',
                color: activeRole === 'schema' ? 'var(--primary)' : 'var(--slate-600)',
                boxShadow: activeRole === 'schema' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Layers size={16} /> 4. FHIR & Schema
            </button>
          </nav>

          {/* Standards Badges */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.72rem',
                fontWeight: 700,
                background: '#f0fdfa',
                color: '#0f766e',
                border: '1px solid #99f6e4',
                padding: '4px 8px',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              <ShieldCheck size={13} /> ABDM & FHIR R4
            </span>
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.72rem',
                fontWeight: 700,
                background: '#eff6ff',
                color: '#1d4ed8',
                border: '1px solid #bfdbfe',
                padding: '4px 8px',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              <Zap size={13} /> Dexie.js Offline Sync
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main style={{ flex: 1, padding: '24px 16px', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
        {activeRole === 'asha' && <AshaPortal />}
        {activeRole === 'doctor' && <DoctorPortal />}
        {activeRole === 'dho' && <DhoDashboard />}
        {activeRole === 'schema' && <FhirSchemaExplorer />}
      </main>

      {/* Footer */}
      <footer
        style={{
          borderTop: '1px solid var(--slate-200)',
          background: '#ffffff',
          padding: '16px 24px',
          textAlign: 'center',
          fontSize: '0.78rem',
          color: 'var(--slate-500)',
        }}
      >
        SwasthyaSeva Rural Public Healthcare MVP • HL7 FHIR R4 Specification • Ayushman Bharat Digital Mission (ABDM) • Offline-First Progressive Web App Architecture
      </footer>
    </div>
  );
}
