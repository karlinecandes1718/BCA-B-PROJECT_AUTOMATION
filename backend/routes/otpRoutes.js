const express = require('express');
const router = express.Router();
const otpController = require('../controllers/otpController');

// Define OTP endpoints
router.post('/send-otp', otpController.sendOtp);
router.post('/verify-otp', otpController.verifyOtp);
router.post('/resend-otp', otpController.resendOtp);
router.get('/check-email', otpController.checkEmail);

module.exports = router;
