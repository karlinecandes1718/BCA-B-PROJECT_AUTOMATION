# 🔐 OTP Testing Guide

## Current Status
✅ **Supabase**: Connected  
✅ **Backend Server**: Running on port 5001  
✅ **Frontend Server**: Running on port 3001  
⚠️ **Brevo Email**: Account needs activation  
✅ **Fallback System**: Working (shows OTP in console)  

## How to Test OTP Login

### Method 1: Use Current OTP (Immediate Testing)
1. **Current OTP Code**: `308453`
2. **Email**: `shruthika.sharon@bcah.christuniversity.in`
3. Open: http://localhost:3001
4. Enter your email and click "Send Verification Code"
5. When prompted, enter: `308453`
6. You should be logged in successfully!

### Method 2: Generate New OTP
1. Open: http://localhost:3001
2. Enter any `@bcah.christuniversity.in` email
3. Click "Send Verification Code"
4. **Check the backend console** (where you ran `npm run dev`) 
5. Look for lines like:
   ```
   🔥 DEVELOPMENT MODE - OTP FOR TESTING:
   🔑 OTP CODE: 123456
   ```
6. Enter that code in the website

## Current Configuration

### Email Service Status
- **Primary**: Brevo (needs activation)
- **Fallback**: Ethereal (test service) 
- **Development**: Always shows OTP in console

### Brevo Account Issue
The error message was:
> "Your SMTP account is not yet activated. Please contact us at contact@sendinblue.com to request activation."

**Solutions**:
1. **Contact Brevo Support**: Email contact@sendinblue.com to activate your account
2. **Use Console OTP**: For now, OTP codes are shown in backend console
3. **Alternative Email Service**: We can configure Gmail SMTP if needed

## File Cleanup Completed
✅ Removed duplicate OTP controller files  
✅ Removed backup context files  
✅ Removed unnecessary test files  
✅ Updated configuration files  

## Next Steps for Production

### To Fix Brevo Email (Recommended)
1. Contact support@sendinblue.com with your account details
2. Request SMTP activation for account: `b18c87001@smtp-brevo.com`
3. Once activated, change `.env` to use `EMAIL_SERVICE=brevo`

### Alternative: Use Gmail SMTP
1. Enable 2-Factor Authentication on your Gmail
2. Generate App Password: https://myaccount.google.com/apppasswords
3. Update `.env` file with Gmail credentials
4. Change `EMAIL_SERVICE=gmail`

## Testing URLs
- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:5001/api
- **Health Check**: http://localhost:5001/health

## Troubleshooting

### If OTP doesn't work:
1. Check backend console for error messages
2. Ensure you're using a `@bcah.christuniversity.in` email
3. Use the exact OTP code shown in console
4. OTP expires in 90 seconds

### If servers stop:
```bash
# Restart backend
cd backend
npm run dev

# Restart frontend  
cd frontend
npm run dev
```

---

## Current Working Setup Summary
🎉 **Everything is working!** The OTP system is functional with console-based OTP delivery. Users can successfully login using OTP codes displayed in the backend console. Once Brevo is activated, emails will be delivered to actual inboxes.