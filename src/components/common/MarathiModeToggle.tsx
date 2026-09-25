'use client';

import React from 'react';
import { FileText, Volume2, VolumeX, Mic } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/LanguageContext';

export default function MarathiModeToggle() {
  const {
    language,
    isSpeechMode,
    isSpeaking,
    currentSpeakingText,
    stopSpeaking,
    setMarathiMode,
    t,
  } = useLanguage();

  const isMarathiActive = language === 'mr';

  return (
    <>
      {/* Top Navbar Toggle Button Group */}
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          background: '#f8fafc',
          border: '1.5px solid var(--slate-300, #cbd5e1)',
          borderRadius: '10px',
          padding: '2px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
          gap: '2px',
        }}
        role="group"
        aria-label="Marathi Text / Voice Mode Switcher"
      >
        {/* Marathi Text Mode Button */}
        <button
          id="marathi-text-mode-btn"
          type="button"
          onClick={() => setMarathiMode('text')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            minHeight: '38px',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            fontSize: '0.8rem',
            fontWeight: 700,
            background:
              isMarathiActive && !isSpeechMode
                ? 'var(--primary, #0d9488)'
                : 'transparent',
            color:
              isMarathiActive && !isSpeechMode
                ? '#ffffff'
                : 'var(--slate-700, #334155)',
            boxShadow:
              isMarathiActive && !isSpeechMode
                ? '0 2px 6px rgba(13, 148, 136, 0.3)'
                : 'none',
            transition: 'all 0.15s ease',
            whiteSpace: 'nowrap',
          }}
          title="मराठी मजकूर मोड (Marathi Text Mode)"
          aria-pressed={isMarathiActive && !isSpeechMode}
        >
          <FileText size={15} />
          <span>मराठी मजकूर (Text)</span>
        </button>

        {/* Marathi Speech / Voice Mode Button */}
        <button
          id="marathi-speech-mode-btn"
          type="button"
          onClick={() => setMarathiMode('speech')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            minHeight: '38px',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            fontSize: '0.8rem',
            fontWeight: 700,
            background:
              isMarathiActive && isSpeechMode
                ? '#0284c7'
                : 'transparent',
            color:
              isMarathiActive && isSpeechMode
                ? '#ffffff'
                : 'var(--slate-700, #334155)',
            boxShadow:
              isMarathiActive && isSpeechMode
                ? '0 2px 6px rgba(2, 132, 199, 0.35)'
                : 'none',
            transition: 'all 0.15s ease',
            whiteSpace: 'nowrap',
          }}
          title="मराठी आवाज / बोलणे मोड (Marathi Speech / Voice Mode)"
          aria-pressed={isMarathiActive && isSpeechMode}
        >
          <Volume2
            size={16}
            style={{
              animation: isSpeaking ? 'pulse 1s infinite' : 'none',
            }}
          />
          <span>मराठी आवाज (Voice)</span>
          {isSpeaking && (
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: '#38bdf8',
                display: 'inline-block',
              }}
            />
          )}
        </button>
      </div>

      {/* Floating Active Voice Bar when Speech Mode is active */}
      {isMarathiActive && isSpeechMode && (
        <div
          role="region"
          aria-label="Marathi Voice Playback Bar"
          style={{
            position: 'fixed',
            bottom: '84px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9998,
            background: 'rgba(15, 23, 42, 0.95)',
            backdropFilter: 'blur(12px)',
            color: '#f8fafc',
            padding: '10px 18px',
            borderRadius: '30px',
            boxShadow: '0 6px 24px rgba(0, 0, 0, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontSize: '0.82rem',
            fontWeight: 600,
            maxWidth: '92vw',
            border: '1.5px solid rgba(56, 189, 248, 0.5)',
            animation: 'slideUp 0.25s ease',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: '#38bdf8',
            }}
          >
            <Mic size={16} />
            <span>मराठी आवाज मोड सुरू आहे</span>
          </div>

          {isSpeaking && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: '#e2e8f0',
                fontSize: '0.78rem',
              }}
            >
              <span
                style={{
                  maxWidth: '220px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {currentSpeakingText || 'बोलत आहे...'}
              </span>

              <button
                type="button"
                onClick={stopSpeaking}
                style={{
                  background: '#ef4444',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '20px',
                  padding: '3px 10px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
                title="आवाज थांबवा (Stop Voice)"
              >
                <VolumeX size={12} /> आवाज थांबवा
              </button>
            </div>
          )}

          {!isSpeaking && (
            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
              आरोग्य माहिती ऐकण्यासाठी कोणत्याही कार्डवरील "🔊 ऐका" बटण दाबा.
            </span>
          )}
        </div>
      )}
    </>
  );
}
