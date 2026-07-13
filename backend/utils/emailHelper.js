const nodemailer = require('nodemailer');

function buildMailOptions(toEmail, otpCode) {
  return {
    to: toEmail,
    subject: 'Verification Code for 3BCA-B Activity Portal',
    text: `Your verification code is: ${otpCode}. It expires in 90 seconds. Do not share it with anyone.`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 25px; color: #1e293b; max-width: 500px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <h2 style="color: #3b7dd8; margin-top: 0; margin-bottom: 8px; font-size: 20px; font-weight: 800;">3BCA-B Activity Portal</h2>
        <p style="font-size: 12px; color: #64748b; margin-bottom: 24px;">Department of Computer Applications, Christ University</p>

        <p style="font-size: 14px; line-height: 1.5; color: #334155;">Hello,</p>
        <p style="font-size: 14px; line-height: 1.5; color: #334155;">You requested a login verification code for the Classroom 3BCA-B Activity Log portal.</p>

        <div style="background-color: #f0f7ff; border: 1px dashed #3b7dd8; padding: 20px; border-radius: 10px; text-align: center; margin: 24px 0;">
          <span style="font-size: 28px; font-weight: 800; letter-spacing: 6px; color: #3b7dd8;">${otpCode}</span>
        </div>

        <p style="font-size: 13px; color: #64748b; line-height: 1.5;">This verification code is valid for 90 seconds. If you did not request this, you can safely ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        <p style="font-size: 11px; color: #94a3b8; text-align: center; margin: 0;">This is an automated institutional message. Please do not reply to this email.</p>
      </div>
    `,
  };
}

/**
 * Sends an OTP email using the configured SMTP service (Gmail or Brevo fallback).
 * @param {string} toEmail - The recipient's email address
 * @param {string} otpCode - The 6-digit OTP code to send
 * @returns {Promise<boolean>} - Resolves to true if successful, rejects on error
 */
async function sendOtpEmail(toEmail, otpCode) {
  const service = (process.env.EMAIL_SERVICE || 'gmail').trim().toLowerCase();
  const mailOptions = buildMailOptions(toEmail, otpCode);

  const brevoUser = (process.env.BREVO_SMTP_USER || '').trim();
  const brevoKey = (process.env.BREVO_SMTP_KEY || '').trim();
  const senderEmail = (process.env.BREVO_SENDER_EMAIL || brevoUser).trim();
  const senderName = (process.env.BREVO_SENDER_NAME || '3BCA-B Activity Portal').trim();

  if (service === 'brevo') {
    if (!brevoUser || !brevoKey) {
      throw new Error('Brevo SMTP credentials are not configured in backend/.env');
    }

    const transporter = nodemailer.createTransport({
      host: 'smtp-relay.brevo.com',
      port: 587,
      secure: false,
      auth: {
        user: brevoUser,
        pass: brevoKey,
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    });

    mailOptions.from = `"${senderName}" <${senderEmail}>`;
    await transporter.sendMail(mailOptions);
    return true;
  }

  const gmailUser = (process.env.EMAIL_USER || '').trim();
  const gmailPass = (process.env.EMAIL_PASS || '').trim();

  if (!gmailUser || !gmailPass) {
    throw new Error('Gmail SMTP credentials are not configured in backend/.env');
  }

  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: gmailUser,
        pass: gmailPass,
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    });

    mailOptions.from = `"3BCA-B Activity Portal" <${gmailUser}>`;
    await transporter.sendMail(mailOptions);
    return true;
  } catch (gmailError) {
    if (!brevoUser || !brevoKey) {
      throw gmailError;
    }

    console.warn(`[EMAIL] Gmail SMTP failed, falling back to Brevo: ${gmailError.message}`);
    const fallbackTransporter = nodemailer.createTransport({
      host: 'smtp-relay.brevo.com',
      port: 587,
      secure: false,
      auth: {
        user: brevoUser,
        pass: brevoKey,
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    });

    mailOptions.from = `"${senderName}" <${senderEmail}>`;
    await fallbackTransporter.sendMail(mailOptions);
    return true;
  }
}

module.exports = { sendOtpEmail };
