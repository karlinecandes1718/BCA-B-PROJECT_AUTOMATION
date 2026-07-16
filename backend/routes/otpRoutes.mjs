import express from 'express';
import otpController from '../controllers/otpController.js';

const router = express.Router();

// Define OTP endpoints
router.post('/send-otp', otpController.sendOtp);
router.post('/verify-otp', otpController.verifyOtp);
router.post('/resend-otp', otpController.resendOtp);
router.get('/check-email', otpController.checkEmail);

export default router;