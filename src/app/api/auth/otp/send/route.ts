import { NextRequest, NextResponse } from 'next/server';
import { otpService } from '@/lib/auth/otpService';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const phone = body?.phone;

    if (!phone || typeof phone !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'BAD_REQUEST',
          message: 'Mobile number is required.',
          messageMr: 'मोबाईल नंबर आवश्यक आहे.',
        },
        { status: 400 }
      );
    }

    const result = await otpService.sendOtp(phone);
    return NextResponse.json(
      {
        success: result.success,
        message: result.message,
        messageMr: result.messageMr,
        provider: result.provider,
        isConfigured: result.isConfigured,
        missingVars: result.missingVars,
      },
      { status: result.status }
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: 'INTERNAL_ERROR',
        message: err?.message || 'Failed to process OTP request.',
        messageMr: 'OTP विनंती प्रक्रियेत त्रुटी आली.',
      },
      { status: 500 }
    );
  }
}
