import { NextResponse } from "next/server";

if (!global.otpStore) {
  global.otpStore = {};
}

export async function POST(request) {
  try {
    const body = await request.json();
    const email = (body.email || "").trim().toLowerCase();
    const otp   = (body.otp   || "").trim();

    if (!email || !otp) {
      return NextResponse.json(
        { success: false, error: "Email and verification code are required." },
        { status: 400 }
      );
    }

    const record = global.otpStore[email];

    // OTP does not exist or was already consumed
    if (!record) {
      return NextResponse.json(
        {
          success: false,
          error: "No verification code found. Please request a new one.",
        },
        { status: 400 }
      );
    }

    // Expired check
    if (Date.now() > record.expiresAt) {
      delete global.otpStore[email];
      return NextResponse.json(
        {
          success: false,
          error: "This verification code has expired. Please request a new one.",
        },
        { status: 400 }
      );
    }

    // Too many wrong attempts (max 5)
    record.attempts = (record.attempts || 0) + 1;
    if (record.attempts > 5) {
      delete global.otpStore[email];
      return NextResponse.json(
        {
          success: false,
          error: "Too many failed attempts. Please request a new verification code.",
        },
        { status: 429 }
      );
    }

    // Wrong code
    if (record.otp !== otp) {
      const remaining = 5 - record.attempts;
      return NextResponse.json(
        {
          success: false,
          error: `Invalid verification code. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`,
        },
        { status: 400 }
      );
    }

    // ✅ Correct — delete the OTP so it cannot be reused
    delete global.otpStore[email];
    console.log(`[OTP] Verified successfully for ${email}`);

    return NextResponse.json({
      success: true,
      message: "Verification successful.",
    });
  } catch (error) {
    console.error("[OTP] Verify error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error." },
      { status: 500 }
    );
  }
}
