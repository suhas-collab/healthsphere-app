import { NextRequest, NextResponse } from 'next/server';
import { otpService } from '@/lib/auth/otpService';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const phone = body?.phone;
    const otp = body?.otp;

    if (!phone || !otp) {
      return NextResponse.json(
        {
          success: false,
          verified: false,
          error: 'BAD_REQUEST',
          message: 'Both phone and 6-digit OTP are required.',
          messageMr: 'मोबाईल नंबर आणि ६-अंकी OTP दोन्ही आवश्यक आहेत.',
        },
        { status: 400 }
      );
    }

    const result = await otpService.verifyOtp(phone, otp);
    return NextResponse.json(
      {
        success: result.success,
        verified: result.verified,
        message: result.message,
        messageMr: result.messageMr,
        isExistingPatient: result.isExistingPatient,
        patient: result.patient,
        token: result.token,
      },
      { status: result.status }
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        verified: false,
        error: 'INTERNAL_ERROR',
        message: err?.message || 'Failed to process OTP verification.',
        messageMr: 'OTP पडताळणी प्रक्रियेत त्रुटी आली.',
      },
      { status: 500 }
    );
  }
}
