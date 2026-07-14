const { initializeApp } = require('firebase/app');
const { getAuth } = require('firebase/auth');

// Firebase configuration - loaded from environment variables
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
  measurementId: process.env.FIREBASE_MEASUREMENT_ID
};

// Validate Firebase configuration
function validateFirebaseConfig() {
  const requiredKeys = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
  const missing = requiredKeys.filter(key => !firebaseConfig[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing Firebase configuration: ${missing.join(', ')}. Please check your .env file.`);
  }
}

// Initialize Firebase
let app = null;
let auth = null;

function initializeFirebase() {
  if (!app) {
    validateFirebaseConfig();
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    console.log('✅ Firebase initialized successfully');
  }
  return { app, auth };
}

module.exports = {
  initializeFirebase,
  firebaseConfig
};