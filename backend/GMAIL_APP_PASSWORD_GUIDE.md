# Gmail App Password Setup Guide

## Step 1: Enable 2-Step Verification
1. Go to: https://myaccount.google.com/security
2. Under "Signing in to Google", click "2-Step Verification"
3. Follow the prompts to enable 2-Step Verification
4. Use your phone to verify

## Step 2: Generate App Password
1. Go to: https://myaccount.google.com/apppasswords
2. Select "Mail" from the dropdown
3. Select "Other" for device
4. Enter "BCA-B OTP System" as the name
5. Click "Generate"
6. Copy the 16-character password (e.g., `abcd efgh ijkl mnop`)

## Step 3: Update .env File
1. Open `backend/.env` file
2. Find the line: `EMAIL_PASS=YOUR_16_CHAR_APP_PASSWORD_HERE`
3. Replace with your 16-character password **without spaces**
   Example: `EMAIL_PASS=abcdefghijklmnop`

## Step 4: Test Gmail SMTP
Run this command to test:
```bash
cd backend
node test_gmail_simple.js
```

## Step 5: Start the System
1. Start backend: `cd backend && npm run dev`
2. Start frontend: `cd frontend && npm run dev`
3. Go to: http://localhost:3000
4. Enter your Christ University email
5. Check your Gmail for OTP!

## Troubleshooting

### If you get "Invalid login" error:
1. Verify 2-Step Verification is enabled
2. Make sure you copied the app password correctly (no spaces)
3. Try regenerating the app password

### If emails go to spam:
1. Check your Gmail spam folder
2. Mark the email as "Not spam"
3. Future OTPs should go to inbox

### If still not working:
1. Try using your personal Gmail instead of university email
2. Or switch back to Brevo with correct SMTP credentials
3. For development, you can use Ethereal (no setup needed)