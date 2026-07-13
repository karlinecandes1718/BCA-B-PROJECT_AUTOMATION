# BCA-B Activity Portal - Setup Guide

## Project Overview
This is a secure OTP-based login system for Christ University BCA-B students with Supabase database integration.

## Files Created/Updated

### 1. Database Schema
- `supabase_schema.sql` - Complete Supabase database schema with 4 tables:
  - `users` - Student information with duplicate prevention
  - `otp_logs` - OTP attempt tracking
  - `activity_logs` - User activity logging
  - `admin_users` - Admin access management

### 2. Backend Updates
- `backend/controllers/otpController.js` - Updated with:
  - Strict email validation for `@bcah.christuniversity.in`
  - Supabase database integration
  - Duplicate email prevention
  - Enhanced error handling for email authentication
- `backend/utils/supabaseClient.js` - Supabase database helper
- `backend/.env.updated` - Updated environment configuration
- `backend/package.json` - Added `@supabase/supabase-js` dependency

### 3. Frontend Updates
- `frontend/src/app/page.js` - Updated email validation regex

## Setup Instructions

### Step 1: Database Setup (Supabase)

1. **Create Supabase Account**
   - Go to [https://supabase.com](https://supabase.com)
   - Sign up for free account
   - Create a new project

2. **Run Database Schema**
   - In Supabase Dashboard, go to **SQL Editor**
   - Copy entire content of `supabase_schema.sql`
   - Paste and run the SQL

3. **Get Supabase Credentials**
   - Go to **Settings > API**
   - Copy:
     - `Project URL` → `SUPABASE_URL`
     - `anon public` key → `SUPABASE_ANON_KEY`
     - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (for admin operations)

### Step 2: Email Service Setup

#### Option A: Brevo (Recommended - More reliable)
1. Sign up at [https://app.brevo.com](https://app.brevo.com)
2. Go to **Settings > SMTP & API > SMTP**
3. Copy:
   - SMTP Login → `BREVO_SMTP_USER`
   - SMTP Key → `BREVO_SMTP_KEY`
4. Verify sender email in **Senders & IPs** section

#### Option B: Gmail (Alternative)
1. Enable **2-Step Verification** on Google Account
2. Go to **Security > App Passwords**
3. Generate app password for "Mail"
4. Use 16-character password (no spaces)

### Step 3: Backend Configuration

1. **Update Environment File**
   ```bash
   cd backend
   cp .env.updated .env
   ```
   
2. **Edit `.env` file with your credentials:**
   ```
   # Email Service (choose one)
   EMAIL_SERVICE=brevo  # or "gmail"
   
   # Brevo Credentials
   BREVO_SMTP_USER=your-brevo-email@example.com
   BREVO_SMTP_KEY=your-brevo-smtp-key
   BREVO_SENDER_EMAIL=verified-email@example.com
   BREVO_SENDER_NAME="3BCA-B Activity Portal"
   
   # OR Gmail Credentials
   # EMAIL_USER=your-gmail@gmail.com
   # EMAIL_PASS=your-16-char-app-password
   
   # Supabase Credentials
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

3. **Install Dependencies**
   ```bash
   cd backend
   npm install
   ```

### Step 4: Frontend Setup

1. **Install Dependencies** (if not already)
   ```bash
   cd frontend
   npm install
   ```

### Step 5: Run the Application

1. **Start Backend Server**
   ```bash
   cd backend
   npm run dev
   ```
   Server runs on: `http://localhost:5000`

2. **Start Frontend**
   ```bash
   cd frontend
   npm run dev
   ```
   Frontend runs on: `http://localhost:3000`

## Testing the OTP System

### Test 1: Email Validation
- Try: `student@bcah.christuniversity.in` → Should be accepted
- Try: `student@gmail.com` → Should be rejected
- Try: `student@christuniversity.in` → Should be rejected

### Test 2: OTP Flow
1. Enter valid Christ email
2. Click "Send Verification Code"
3. Check email for 6-digit OTP
4. Enter OTP and verify

### Test 3: Duplicate Prevention
1. First student registers → Creates new user in Supabase
2. Same student logs in again → Updates login count, doesn't create duplicate
3. Check Supabase `users` table to verify

## Database Tables Structure

### 1. `users` Table
- `id` (UUID) - Primary key
- `email` (VARCHAR) - Unique, validated for Christ domain
- `full_name` (VARCHAR) - Extracted from email
- `roll_number` (VARCHAR) - Optional
- `department` (VARCHAR) - Default: 'BCA-B'
- `login_count` (INTEGER) - Tracks logins
- `first_login_at`, `last_login_at` (TIMESTAMP)

### 2. `otp_logs` Table
- Tracks all OTP attempts
- Prevents brute force attacks
- Logs verification status

### 3. `activity_logs` Table
- Tracks user activities
- Useful for auditing

### 4. `admin_users` Table
- Admin authentication
- Default admin: username='admin', password='0987'

## Error Troubleshooting

### 1. "Invalid login: 535 5.7.8 Authentication failed"
- **Cause**: Incorrect email service credentials
- **Solution**: 
  - For Gmail: Regenerate app password
  - For Brevo: Verify SMTP credentials and sender email

### 2. "Email service configuration error"
- Check `.env` file credentials
- Verify email service is properly configured

### 3. Database Connection Issues
- Verify Supabase credentials in `.env`
- Check if tables were created successfully
- Ensure internet connection

### 4. Frontend-Backend Connection
- Ensure both servers are running
- Check CORS configuration in `server.js`
- Verify API endpoints in frontend

## Security Features Implemented

1. **Email Domain Validation**: Strict `@bcah.christuniversity.in` validation
2. **Duplicate Prevention**: No duplicate users in database
3. **OTP Rate Limiting**: 15 requests per 10 minutes per IP
4. **Brute Force Protection**: Account lock after 5 failed attempts
5. **Secure OTP Storage**: Hashed OTPs in database
6. **Activity Logging**: All user activities tracked
7. **Input Validation**: Both frontend and backend validation

## API Endpoints

- `POST /api/send-otp` - Send OTP to email
- `POST /api/verify-otp` - Verify OTP code
- `POST /api/resend-otp` - Resend OTP
- `GET /api/check-email` - Validate email format and check duplicates
- `GET /health` - Server health check

## Next Steps

1. **Add User Profiles**: Allow students to update profile information
2. **Activity Management**: Add activity submission functionality
3. **Admin Dashboard**: Enhanced admin features
4. **Email Templates**: Customizable email templates
5. **SMS OTP**: Add SMS as alternative verification method
6. **Analytics Dashboard**: User activity analytics

## Support

For issues:
1. Check error logs in backend console
2. Verify database connection in Supabase
3. Test email service with simple SMTP test
4. Check browser console for frontend errors