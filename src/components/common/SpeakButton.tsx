'use client';

import React from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface SpeakButtonProps {
  text: string;
  label?: string;
  lang?: string;
  size?: 'sm' | 'md';
  style?: React.CSSProperties;
}

export default function SpeakButton({
  text,
  label = 'ऐका (Listen)',
  lang = 'mr-IN',
  size = 'sm',
  style,
}: SpeakButtonProps) {
  const { speakText, stopSpeaking, isSpeaking, currentSpeakingText } = useLanguage();

  const isCurrentSpeaking = isSpeaking && currentSpeakingText === text.trim();

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isCurrentSpeaking) {
      stopSpeaking();
    } else {
      speakText(text, lang);
    }
  };

  const isSm = size === 'sm';

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={isCurrentSpeaking ? 'Stop speaking' : `Read aloud: ${label}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: isSm ? '4px' : '6px',
        padding: isSm ? '3px 8px' : '5px 12px',
        borderRadius: '6px',
        fontSize: isSm ? '0.74rem' : '0.82rem',
        fontWeight: 700,
        background: isCurrentSpeaking ? '#fee2e2' : '#f0f9ff',
        color: isCurrentSpeaking ? '#b91c1c' : '#0369a1',
        border: `1px solid ${isCurrentSpeaking ? '#fca5a5' : '#bae6fd'}`,
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        ...style,
      }}
      title={isCurrentSpeaking ? 'आवाज थांबवा' : 'मराठीमध्ये ऐका'}
    >
      {isCurrentSpeaking ? (
        <>
          <VolumeX size={isSm ? 13 : 16} />
          <span>थांबवा</span>
        </>
      ) : (
        <>
          <Volume2 size={isSm ? 13 : 16} />
          <span>{label}</span>
        </>
      )}
    </button>
  );
}
