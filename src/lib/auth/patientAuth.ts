// Patient Authentication Service for ArogyaMitra
// Standardized on Indian Mobile OTP & ABDM Patient Identity Linking

export interface PatientSession {
  patientId: string;
  name: string;
  phone: string;
  village?: string;
  loginTime: string;
}

export interface OtpSendResponse {
  success: boolean;
  status: number;
  message: string;
  messageMr: string;
  provider: string;
  isConfigured: boolean;
}

export interface OtpVerifyResponse {
  success: boolean;
  status: number;
  verified: boolean;
  message: string;
  messageMr: string;
  isExistingPatient: boolean;
  patient?: {
    id: string;
    name: string;
    phone: string;
    village?: string;
    age?: number;
    gender?: string;
  };
  token?: string;
}

export const patientAuth = {
  /**
   * Request phone verification / OTP dispatch from server.
   */
  async sendOtp(phone: string): Promise<OtpSendResponse> {
    const cleanDigits = phone.trim().replace(/\D/g, '').slice(-10);

    if (cleanDigits.length !== 10) {
      return {
        success: false,
        status: 400,
        message: 'Please enter a valid 10-digit mobile number.',
        messageMr: 'कृपया १० अंकांचा वैध मोबाईल नंबर टाका.',
        provider: 'CLIENT_VALIDATION',
        isConfigured: false,
      };
    }

    try {
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanDigits }),
      });
      const data = await res.json();
      return {
        success: Boolean(data.success),
        status: res.status,
        message: data.message || 'OTP request processed.',
        messageMr: data.messageMr || 'OTP विनंती प्रक्रिया झाली.',
        provider: data.provider || 'UNKNOWN',
        isConfigured: Boolean(data.isConfigured),
      };
    } catch (err: any) {
      return {
        success: false,
        status: 500,
        message: err?.message || 'Network error while requesting OTP.',
        messageMr: 'इंटरनेट कनेक्शन तपासा. तुमची माहिती सुरक्षित आहे.',
        provider: 'NETWORK_ERROR',
        isConfigured: false,
      };
    }
  },

  /**
   * Verify submitted OTP code with server.
   */
  async verifyOtp(phone: string, otp: string): Promise<OtpVerifyResponse> {
    const cleanDigits = phone.trim().replace(/\D/g, '').slice(-10);
    const cleanOtp = otp.trim().replace(/\D/g, '');

    if (cleanDigits.length !== 10 || cleanOtp.length !== 6) {
      return {
        success: false,
        status: 400,
        verified: false,
        message: 'Valid 10-digit mobile number and 6-digit OTP code are required.',
        messageMr: '१०-अंकी मोबाईल नंबर आणि ६-अंकी OTP आवश्यक आहे.',
        isExistingPatient: false,
      };
    }

    try {
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanDigits, otp: cleanOtp }),
      });
      const data = await res.json();
      return {
        success: Boolean(data.success),
        status: res.status,
        verified: Boolean(data.verified),
        message: data.message || (res.ok ? 'Verified successfully' : 'Verification failed'),
        messageMr: data.messageMr || (res.ok ? 'सत्यापन यशस्वी झाले' : 'सत्यापन अयशस्वी'),
        isExistingPatient: Boolean(data.isExistingPatient),
        patient: data.patient,
        token: data.token,
      };
    } catch (err: any) {
      return {
        success: false,
        status: 500,
        verified: false,
        message: err?.message || 'Network error while verifying OTP.',
        messageMr: 'इंटरनेट कनेक्शन तपासा. तुमची माहिती सुरक्षित आहे.',
        isExistingPatient: false,
      };
    }
  },

  /**
   * Store verified patient session securely in localStorage
   */
  saveSession(session: PatientSession): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('arogya_patient_session', JSON.stringify(session));
      localStorage.setItem('swasthya_active_token', `swasthya_patient_${session.patientId}`);
      localStorage.setItem('swasthya_active_role', 'PATIENT');
    }
  },

  /**
   * Get active patient session
   */
  getSession(): PatientSession | null {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem('arogya_patient_session');
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  /**
   * Clear active patient session (Explicit Logout)
   */
  clearSession(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('arogya_patient_session');
      localStorage.removeItem('swasthya_active_token');
      localStorage.removeItem('swasthya_active_role');
    }
  },
};
