# Firebase OTP Backend

## Firebase-based OTP System

This backend uses Firebase Authentication for OTP delivery and verification.

## Dependencies

Install the required packages:

```bash
npm install
```

## Environment Configuration

Create a `.env` file in the backend folder based on `.env.example`:

```env
# Firebase Configuration
FIREBASE_API_KEY=your-firebase-api-key
FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
FIREBASE_MESSAGING_SENDER_ID=your-sender-id
FIREBASE_APP_ID=your-app-id
FIREBASE_MEASUREMENT_ID=your-measurement-id

# Development Settings
DEV_MODE=true
SHOW_OTP_IN_CONSOLE=true
```

## Firebase Setup

1. Create a Firebase project at https://console.firebase.google.com
2. Enable Authentication in Firebase Console
3. Configure authentication providers (Email/Phone)
4. Copy your Firebase config from Project Settings > General > Your apps

## Development Mode

When `DEV_MODE=true`, OTP codes are displayed in the console for easy testing:

```
🔥 DEVELOPMENT MODE - OTP FOR TESTING:
🔑 EMAIL: student@bcah.christuniversity.in
🔑 OTP CODE: 123456
```

## Run Locally

```bash
npm run dev
```

The server will listen on port 5002. The frontend is configured to make API calls to this endpoint.

## API Endpoints

- `POST /api/send-otp` - Send OTP to email
- `POST /api/verify-otp` - Verify OTP code
- `GET /health` - Health check endpoint

## Production Deployment

For production:
1. Set `DEV_MODE=false`
2. Configure Firebase Auth providers properly
3. Set up proper CORS origins
4. Use environment variables for sensitive config
