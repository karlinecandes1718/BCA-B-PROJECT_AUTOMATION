# OTP Backend Setup

## Free-only dependencies

Install these packages in the backend folder:

```bash
npm install express nodemailer bcrypt dotenv cors express-rate-limit
npm install -D nodemon
```

## Environment variables

Create a .env file in the backend folder based on .env.example and fill in your free SMTP settings.

### Gmail SMTP (recommended free option)

1. Enable 2-Step Verification on your Gmail account.
2. Open Google Account > Security > App Passwords.
3. Generate an app password.
4. Put the Gmail address in EMAIL_USER and the 16-character app password in EMAIL_PASS.

### Brevo SMTP (free fallback)

If Gmail SMTP is unreliable, sign up for a free Brevo account and use the SMTP credentials in BREVO_SMTP_USER and BREVO_SMTP_KEY.

## Run locally

```bash
npm run dev
```

The server will listen on port 5000 and the frontend is already configured to proxy /api requests there.
