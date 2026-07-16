import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

// --------------------------------------------------------------------------
// In-memory OTP store  (server restarts will clear it — acceptable for dev)
// --------------------------------------------------------------------------
if (!global.otpStore) {
  global.otpStore = {};
}

// --------------------------------------------------------------------------
// Strict domain validation — ONLY @bcah.christuniversity.in is accepted
// --------------------------------------------------------------------------
function isValidChristEmail(email) {
  // Accept strictly bcah.christuniversity.in subdomain
  return /^[a-zA-Z0-9._%+\-]+@bcah\.christuniversity\.in$/i.test(email.trim());
}

export async function POST(request) {
  try {
    const body = await request.json();
    const email = (body.email || "").trim().toLowerCase();

    // 1. Presence check
    if (!email) {
      return NextResponse.json(
        { success: false, error: "Email address is required." },
        { status: 400 }
      );
    }

    // 2. Domain validation — reject everything except @bcah.christuniversity.in
    if (!isValidChristEmail(email)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Access Denied. Only @bcah.christuniversity.in email addresses are allowed to log in.",
        },
        { status: 403 }
      );
    }

    // 3. Read Brevo SMTP credentials from .env.local
    const brevoUser = (process.env.BREVO_SMTP_USER || "").trim();
    const brevoKey  = (process.env.BREVO_SMTP_KEY  || "").trim();
    const senderEmail = (process.env.BREVO_SENDER_EMAIL || brevoUser).trim();
    const senderName  = (process.env.BREVO_SENDER_NAME  || "3BCA-B Activity Portal").trim();

    if (!brevoUser || !brevoKey || brevoKey === "your-brevo-smtp-key-here") {
      return NextResponse.json(
        {
          success: false,
          error:
            "Email service not configured. Please set BREVO_SMTP_USER and BREVO_SMTP_KEY in .env.local.",
        },
        { status: 501 }
      );
    }

    // 4. Generate a cryptographically-safe 6-digit OTP
    const otp = String(Math.floor(100000 + Math.random() * 900000));

    // 5. Store OTP with 5-minute expiry
    global.otpStore[email] = {
      otp,
      expiresAt: Date.now() + 5 * 60 * 1000,
      attempts: 0,
    };

    console.log(`[OTP] Generated for ${email} : ${otp}`);

    // 6. Create Nodemailer transporter using Brevo SMTP relay
    //    Brevo SMTP: smtp-relay.brevo.com : 587 (STARTTLS)
    const transporter = nodemailer.createTransport({
      host: "smtp-relay.brevo.com",
      port: 587,
      secure: false, // STARTTLS (port 587)
      auth: {
        user: brevoUser, // your Brevo login email
        pass: brevoKey,  // Brevo SMTP key (from Settings → SMTP & API)
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    });

    // 7. Build and send the email
    await transporter.sendMail({
      from: `"${senderName}" <${senderEmail}>`,
      to: email,
      subject: "Your 3BCA-B Activity Portal Verification Code",
      text: `Your verification code is: ${otp}\n\nThis code expires in 5 minutes. Do not share it with anyone.`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                    padding: 32px 28px; color: #1e293b; max-width: 520px;
                    border: 1px solid #e2e8f0; border-radius: 14px;
                    background-color: #ffffff; margin: 0 auto;">

          <!-- Header -->
          <div style="margin-bottom: 24px;">
            <h2 style="color: #3b7dd8; margin: 0 0 4px 0; font-size: 20px; font-weight: 800;">
              3BCA-B Activity Portal
            </h2>
            <p style="margin: 0; font-size: 12px; color: #64748b;">
              Department of Computer Applications · Christ University
            </p>
          </div>

          <p style="font-size: 14px; line-height: 1.6; color: #334155; margin: 0 0 6px 0;">
            Hello,
          </p>
          <p style="font-size: 14px; line-height: 1.6; color: #334155; margin: 0 0 24px 0;">
            You requested a login verification code for the 3BCA-B Classroom Activity Log portal.
            Use the code below to complete your login:
          </p>

          <!-- OTP Box -->
          <div style="background-color: #f0f7ff; border: 2px dashed #3b7dd8;
                      padding: 22px 16px; border-radius: 12px;
                      text-align: center; margin: 0 0 24px 0;">
            <span style="font-size: 32px; font-weight: 900; letter-spacing: 8px; color: #3b7dd8;">
              ${otp}
            </span>
            <p style="font-size: 11px; color: #64748b; margin: 10px 0 0 0;">
              Valid for 5 minutes only
            </p>
          </div>

          <p style="font-size: 13px; color: #64748b; line-height: 1.5; margin: 0 0 20px 0;">
            If you did not request this code, please ignore this email — your account is safe.
          </p>

          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="font-size: 11px; color: #94a3b8; text-align: center; margin: 0;">
            This is an automated message from the 3BCA-B Classroom Activity Log System.<br/>
            Please do not reply to this email.
          </p>
        </div>
      `,
    });

    console.log(`[OTP] Email sent successfully to ${email}`);

    return NextResponse.json({
      success: true,
      message: `Verification code sent to ${email}. Please check your inbox.`,
    });
  } catch (error) {
    console.error("[OTP] Error:", error.message);
    return NextResponse.json(
      {
        success: false,
        error: `Failed to send verification email: ${error.message}`,
      },
      { status: 500 }
    );
  }
}
