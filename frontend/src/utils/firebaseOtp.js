import { auth } from '../config/firebase';
import { 
  RecaptchaVerifier, 
  signInWithPhoneNumber,
  signInWithCustomToken,
  createUserWithEmailAndPassword,
  sendEmailVerification
} from 'firebase/auth';

/**
 * Initialize reCAPTCHA verifier for phone authentication
 */
export const initializeRecaptcha = (containerId = 'recaptcha-container') => {
  if (typeof window === 'undefined') return null;
  
  try {
    return new RecaptchaVerifier(auth, containerId, {
      size: 'invisible',
      callback: (response) => {
        console.log('reCAPTCHA verified');
      }
    });
  } catch (error) {
    console.error('Error initializing reCAPTCHA:', error);
    return null;
  }
};

/**
 * Send OTP to phone number using Firebase Auth
 */
export const sendPhoneOTP = async (phoneNumber, recaptchaVerifier) => {
  try {
    const confirmationResult = await signInWithPhoneNumber(
      auth, 
      phoneNumber, 
      recaptchaVerifier
    );
    
    console.log('OTP sent successfully');
    return confirmationResult;
  } catch (error) {
    console.error('Error sending OTP:', error);
    throw error;
  }
};

/**
 * Verify phone OTP code
 */
export const verifyPhoneOTP = async (confirmationResult, otpCode) => {
  try {
    const result = await confirmationResult.confirm(otpCode);
    console.log('Phone number verified successfully');
    return result;
  } catch (error) {
    console.error('Error verifying OTP:', error);
    throw error;
  }
};

/**
 * Send OTP via backend API (for email-based OTP)
 */
export const sendEmailOTP = async (email) => {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5003';
    const response = await fetch(`${apiUrl}/api/send-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to send OTP');
    }

    return data;
  } catch (error) {
    console.error('Error sending email OTP:', error);
    throw error;
  }
};

/**
 * Verify email OTP via backend API
 */
export const verifyEmailOTP = async (email, otpCode) => {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5003';
    const response = await fetch(`${apiUrl}/api/verify-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, otp: otpCode })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to verify OTP');
    }

    return data;
  } catch (error) {
    console.error('Error verifying email OTP:', error);
    throw error;
  }
};

/**
 * Validate Christ University email format
 */
export const validateChristEmail = (email) => {
  const christEmailRegex = /^[a-zA-Z0-9._%+-]+@bcah\.christuniversity\.in$/;
  return christEmailRegex.test(email);
};

/**
 * Convert phone number to international format
 */
export const formatPhoneNumber = (phoneNumber, countryCode = '+91') => {
  // Remove any non-digit characters
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  // Add country code if not present
  if (!cleaned.startsWith(countryCode.replace('+', ''))) {
    return `${countryCode}${cleaned}`;
  }
  
  return `+${cleaned}`;
};