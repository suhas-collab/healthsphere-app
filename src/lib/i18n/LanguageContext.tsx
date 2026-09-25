'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Language, Translations } from './types';
import { en } from './dictionaries/en';
import { hi } from './dictionaries/hi';
import { te } from './dictionaries/te';
import { mr } from './dictionaries/mr';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  isSpeechMode: boolean;
  setIsSpeechMode: (active: boolean) => void;
  isSpeaking: boolean;
  currentSpeakingText: string | null;
  speakText: (text: string, lang?: string) => void;
  stopSpeaking: () => void;
  setMarathiMode: (mode: 'text' | 'speech') => void;
  t: Translations;
  getSymptomLabel: (symptom: string) => string;
}

const dictionaries: Record<Language, Translations> = {
  en,
  hi,
  te,
  mr,
};

const SYMPTOM_TRANSLATIONS: Record<string, Record<Language, string>> = {
  'High Grade Fever (>3 days)': {
    en: 'High Grade Fever (>3 days)',
    hi: 'तेज बुखार (3 दिन से अधिक)',
    te: 'తీవ్ర జ్వరం (3 రోజుల కంటే ఎక్కువ)',
    mr: 'तीव्र ताप (३ दिवसांपेक्षा जास्त)',
  },
  'Severe Breathlessness / Fast Breathing': {
    en: 'Severe Breathlessness / Fast Breathing',
    hi: 'सांस लेने में भारी तकलीफ / तेज सांस',
    te: 'తీవ్ర శ్వాస తీసుకోవడంలో ఇబ్బంది / వేగంగా శ్వాస',
    mr: 'श्वास घेण्यास तीव्र त्रास / जलद श्वास',
  },
  'Chest Pain / Radiating Discomfort': {
    en: 'Chest Pain / Radiating Discomfort',
    hi: 'सीने में दर्द / खिंचाव',
    te: 'ఛాతీ నొప్పి / అసౌకర్యం',
    mr: 'छातीत दुखणे / अस्वस्थता',
  },
  'Acute Watery Diarrhea / Vomiting': {
    en: 'Acute Watery Diarrhea / Vomiting',
    hi: 'दस्त / उल्टी (पानी जैसा दस्त)',
    te: 'తీవ్ర విరేచనాలు / వాంతులు',
    mr: 'तीव्र जुलाब / उलट्या',
  },
  'Severe Throbbing Headache': {
    en: 'Severe Throbbing Headache',
    hi: 'सिर में बहुत तेज दर्द',
    te: 'తీవ్ర తలనొప్పి',
    mr: 'डोक्यात तीव्र वेदना / डोकेदुखी',
  },
  'Blurred Vision / Flashes': {
    en: 'Blurred Vision / Flashes',
    hi: 'आंखों के आगे धुंधलापन या चमक',
    te: 'కళ్లు మసకబారడం / మెరుపులు',
    mr: 'डोळ्यांसमोर अंधारी किंवा चमक',
  },
  'Vaginal Bleeding in Pregnancy': {
    en: 'Vaginal Bleeding in Pregnancy',
    hi: 'गर्भावस्था में रक्तस्राव (ब्लीडिंग)',
    te: 'గర్భధారణ సమయంలో రక్తస్రావం',
    mr: 'गरोदरपणात रक्तस्राव',
  },
  'Convulsions / Fits / Involuntary Shaking': {
    en: 'Convulsions / Fits / Involuntary Shaking',
    hi: 'दौरे पड़ना / झटके आना',
    te: 'మూర్ఛ / వణుకు రావడం',
    mr: 'झटके येणे / फेफरे येणे',
  },
  'Severe Abdominal Pain': {
    en: 'Severe Abdominal Pain',
    hi: 'पेट में बहुत तेज दर्द',
    te: 'తీవ్ర కడుపు నొప్పి',
    mr: 'पोटात तीव्र वेदना',
  },
  'Pediatric Lethargy / Poor Feeding': {
    en: 'Pediatric Lethargy / Poor Feeding',
    hi: 'बच्चे में अत्यधिक सुस्ती / दूध न पीना',
    te: 'పిల్లలలో నీరసం / పాలు తాగకపోవడం',
    mr: 'बाळामध्ये प्रचंड सुस्ती / दूध न पिणे',
  },
  'Chronic Joint Pain & Swelling': {
    en: 'Chronic Joint Pain & Swelling',
    hi: 'जोड़ों में पुराना दर्द व सूजन',
    te: 'కీళ్ల నొప్పులు & వాపు',
    mr: 'सांधेदुखी आणि सांध्यांना सूज',
  },
  'Persistent Cough with Sputum (>2 weeks)': {
    en: 'Persistent Cough with Sputum (>2 weeks)',
    hi: 'लगातार खांसी व बलगम (2 सप्ताह से अधिक)',
    te: 'రెండు వారాల కంటే ఎక్కువ దగ్గు & కఫం',
    mr: '२ आठवड्यांपेक्षा जास्त काळ खोकला व कफ',
  },
};

const STORAGE_KEY = 'swasthya_lang';
const SPEECH_MODE_KEY = 'swasthya_speech_mode';

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');
  const [isSpeechMode, setIsSpeechModeState] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [currentSpeakingText, setCurrentSpeakingText] = useState<string | null>(null);

  // Load language & speech mode from localStorage once mounted
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as Language;
      if (stored && (stored === 'en' || stored === 'hi' || stored === 'te' || stored === 'mr')) {
        setLanguageState(stored);
      }
      const storedSpeech = localStorage.getItem(SPEECH_MODE_KEY);
      if (storedSpeech === 'true') {
        setIsSpeechModeState(true);
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  const setLanguage = useCallback((newLang: Language) => {
    setLanguageState(newLang);
    try {
      localStorage.setItem(STORAGE_KEY, newLang);
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  const setIsSpeechMode = useCallback((active: boolean) => {
    setIsSpeechModeState(active);
    try {
      localStorage.setItem(SPEECH_MODE_KEY, active ? 'true' : 'false');
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  const stopSpeaking = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {
        console.warn('Speech cancellation error:', e);
      }
    }
    setIsSpeaking(false);
    setCurrentSpeakingText(null);
  }, []);

  const speakText = useCallback(
    (textToSpeak: string, langCode: string = 'mr-IN') => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        console.warn('Speech synthesis not supported on this device/browser');
        return;
      }

      try {
        window.speechSynthesis.cancel();

        const cleanText = textToSpeak
          .replace(/[#*`_~]/g, '')
          .replace(/\s+/g, ' ')
          .trim();

        if (!cleanText) return;

        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.lang = langCode;

        // Try finding Marathi voice, or Hindi / Indian English fallback
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice =
          voices.find((v) => v.lang.toLowerCase().includes('mr')) ||
          voices.find((v) => v.lang.toLowerCase().includes('hi')) ||
          voices.find((v) => v.lang.toLowerCase().includes('in'));

        if (preferredVoice) {
          utterance.voice = preferredVoice;
        }

        utterance.rate = 0.9; // Clear, deliberate pacing for rural users
        utterance.pitch = 1.0;

        utterance.onstart = () => {
          setIsSpeaking(true);
          setCurrentSpeakingText(cleanText);
        };

        utterance.onend = () => {
          setIsSpeaking(false);
          setCurrentSpeakingText(null);
        };

        utterance.onerror = (e) => {
          console.warn('SpeechSynthesis error:', e);
          setIsSpeaking(false);
          setCurrentSpeakingText(null);
        };

        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.error('Speech playback failed:', err);
        setIsSpeaking(false);
        setCurrentSpeakingText(null);
      }
    },
    []
  );

  const setMarathiMode = useCallback(
    (mode: 'text' | 'speech') => {
      setLanguage('mr');
      if (mode === 'speech') {
        setIsSpeechMode(true);
        // Play brief intro greeting in Marathi
        setTimeout(() => {
          speakText(
            'मराठी आवाज सेवा सुरू झाली आहे. आरोग्य माहिती ऐकण्यासाठी स्क्रीनवरील आवाज बटनावर दाबा.'
          );
        }, 150);
      } else {
        setIsSpeechMode(false);
        stopSpeaking();
      }
    },
    [setLanguage, setIsSpeechMode, speakText, stopSpeaking]
  );

  const getSymptomLabel = (symptom: string): string => {
    const match = SYMPTOM_TRANSLATIONS[symptom];
    if (match && match[language]) {
      return match[language];
    }
    return symptom;
  };

  const t = dictionaries[language] || dictionaries.en;

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        isSpeechMode,
        setIsSpeechMode,
        isSpeaking,
        currentSpeakingText,
        speakText,
        stopSpeaking,
        setMarathiMode,
        t,
        getSymptomLabel,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

