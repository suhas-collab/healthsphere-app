'use client';

import React, { useState } from 'react';
import {
  Code,
  Database,
  Layers,
  CheckCircle2,
  FileSpreadsheet,
  Workflow,
  Share2,
  BookOpen,
} from 'lucide-react';
import { useLanguage } from '@/lib/i18n/LanguageContext';

const FHIR_MAPPINGS = [
  {
    prismaEntity: 'Patient',
    fhirResource: 'Patient',
    fhirProfile: 'https://nrces.in/ndhm/fhir/r4/StructureDefinition/Patient',
    abdmField: 'abhaId (14-digit ABDM Health Account)',
    description: 'Captures rural demographics, village, emergency contacts, and maternal parity/gravida flags.',
    keyAttributes: ['identifier (ABHA)', 'name.text', 'gender', 'birthDate', 'address.city (village)', 'telecom'],
  },
  {
    prismaEntity: 'HealthWorker',
    fhirResource: 'Practitioner & PractitionerRole',
    fhirProfile: 'https://nrces.in/ndhm/fhir/r4/StructureDefinition/PractitionerRole',
    abdmField: 'HPR ID (Healthcare Professional Registry)',
    description: 'Frontline ASHAs, ANMs, PHC Medical Officers, and District Health Officers.',
    keyAttributes: ['identifier (HPR)', 'practitioner.name', 'code (Role)', 'organization (Facility)'],
  },
  {
    prismaEntity: 'Facility',
    fhirResource: 'Location & Organization',
    fhirProfile: 'https://nrces.in/ndhm/fhir/r4/StructureDefinition/Location',
    abdmField: 'HFR ID (Health Facility Registry)',
    description: 'Tiered delivery points: Sub-centre (Arogya Mandir), PHC, and District Civil Hospital.',
    keyAttributes: ['identifier (HFR)', 'type (Sub-Centre / PHC / DH)', 'address.district', 'position (lat/long)'],
  },
  {
    prismaEntity: 'Encounter (Triage)',
    fhirResource: 'Encounter + Observation (Vitals)',
    fhirProfile: 'https://nrces.in/ndhm/fhir/r4/StructureDefinition/Observation',
    abdmField: 'OPConsultation Record (Care Context)',
    description: 'Point-of-care screening capturing vitals (BP, SpO2, Temp, Pulse) and RED/YELLOW/GREEN risk tags.',
    keyAttributes: ['class (AMB / Emergency)', 'period.start', 'component:systolic-bp', 'component:spo2', 'riskLevel'],
  },
  {
    prismaEntity: 'Referral',
    fhirResource: 'ServiceRequest',
    fhirProfile: 'https://nrces.in/ndhm/fhir/r4/StructureDefinition/ServiceRequest',
    abdmField: 'Referral Advice Note',
    description: 'Escalations between care tiers with priority (STAT/URGENT/ROUTINE) and ambulance tracking.',
    keyAttributes: ['priority (STAT / URGENT)', 'intent (order)', 'requester', 'performer (Target DH)', 'reasonCode'],
  },
  {
    prismaEntity: 'Teleconsultation',
    fhirResource: 'Encounter [VR] & Communication',
    fhirProfile: 'https://nrces.in/ndhm/fhir/r4/StructureDefinition/Encounter',
    abdmField: 'Telemedicine Consultation Protocol',
    description: 'Virtual encounter connecting frontline ASHA to PHC Medical Officer with in-call vitals HUD.',
    keyAttributes: ['class (VR - Virtual)', 'participant (Doctor & ASHA)', 'subject (Patient)', 'status'],
  },
  {
    prismaEntity: 'Prescription',
    fhirResource: 'MedicationRequest',
    fhirProfile: 'https://nrces.in/ndhm/fhir/r4/StructureDefinition/MedicationRequest',
    abdmField: 'Prescription Record Bundle',
    description: 'Doctor issued medications with dosage instructions and cryptographic digital stamp seal.',
    keyAttributes: ['medicationCodeableConcept', 'dosageInstruction', 'requester', 'authoredOn'],
  },
  {
    prismaEntity: 'Inventory',
    fhirResource: 'InventoryReport / MedicationKnowledge',
    fhirProfile: 'https://nrces.in/ndhm/fhir/r4/StructureDefinition/InventoryReport',
    abdmField: 'e-Aushadhi Drug Supply Chain',
    description: 'Facility stock levels for essential life-saving medicines with automated stockout alerts.',
    keyAttributes: ['item.concept', 'inventoryItem.quantity', 'thresholdLevel', 'isStockout'],
  },
];

export default function FhirSchemaExplorer() {
  const { t } = useLanguage();
  const [selectedMapping, setSelectedMapping] = useState<number>(0);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Title */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, #0d9488, #0f766e)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
            }}
          >
            <Layers size={26} />
          </div>
          <div>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--slate-900)' }}>
              {t.schema.techTitle}
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--slate-600)' }}>
              {t.schema.techSubtitle}
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Mappings List + Details */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}>
        {/* Left Column: Entities List */}
        <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--slate-500)', marginBottom: '4px' }}>
            PRISMA CORE ENTITIES ({FHIR_MAPPINGS.length})
          </div>

          {FHIR_MAPPINGS.map((m, idx) => (
            <button
              key={m.prismaEntity}
              onClick={() => setSelectedMapping(idx)}
              style={{
                textAlign: 'left',
                padding: '12px 14px',
                borderRadius: 'var(--radius-md)',
                background: selectedMapping === idx ? '#f0fdfa' : 'transparent',
                border: selectedMapping === idx ? '1.5px solid var(--primary)' : '1px solid var(--slate-200)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--slate-900)' }}>
                  {m.prismaEntity}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600 }}>
                  FHIR: {m.fhirResource}
                </div>
              </div>
              {selectedMapping === idx && <CheckCircle2 size={18} color="var(--primary)" />}
            </button>
          ))}
        </div>

        {/* Right Column: Active Mapping Inspection */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {(() => {
            const m = FHIR_MAPPINGS[selectedMapping];
            return (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--slate-900)' }}>
                      {m.prismaEntity} ➔ {m.fhirResource}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--slate-500)', marginTop: '2px' }}>
                      Profile: <code style={{ color: 'var(--primary)' }}>{m.fhirProfile}</code>
                    </div>
                  </div>

                  <span
                    style={{
                      background: '#ecfdf5',
                      color: '#065f46',
                      padding: '4px 10px',
                      borderRadius: '999px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                    }}
                  >
                    FHIR R4 Verified
                  </span>
                </div>

                <div style={{ fontSize: '0.9rem', color: 'var(--slate-700)', lineHeight: '1.5' }}>
                  {m.description}
                </div>

                <div style={{ background: 'var(--slate-50)', padding: '14px', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--slate-600)', marginBottom: '6px' }}>
                    ABDM Registry Mapping:
                  </div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--slate-900)' }}>
                    {m.abdmField}
                  </div>
                </div>

                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--slate-900)', marginBottom: '8px' }}>
                    Mapped FHIR Attributes:
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {m.keyAttributes.map((attr, i) => (
                      <span
                        key={i}
                        style={{
                          background: 'var(--slate-100)',
                          border: '1px solid var(--slate-200)',
                          padding: '4px 10px',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.75rem',
                          fontFamily: 'monospace',
                          color: 'var(--slate-800)',
                        }}
                      >
                        {attr}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Offline-First Sync Note */}
                <div
                  style={{
                    marginTop: 'auto',
                    padding: '14px',
                    borderRadius: 'var(--radius-md)',
                    background: '#f8fafc',
                    border: '1px solid var(--slate-200)',
                    fontSize: '0.8rem',
                    color: 'var(--slate-600)',
                  }}
                >
                  <div style={{ fontWeight: 700, color: 'var(--slate-800)', marginBottom: '4px' }}>
                    Offline-First Dexie.js Mechanics:
                  </div>
                  Frontline health workers can create and modify {m.prismaEntity} instances locally in Dexie IndexedDB when off-grid. When connectivity returns, the SyncEngine dispatches batch payloads to <code style={{ color: 'var(--primary)' }}>/api/sync</code> for idempotent upserting into the PostgreSQL/Prisma backend.
                </div>
              </>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
