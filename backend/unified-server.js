const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Import routes
const otpRoutes = require('./routes/otpRoutes');
const authRouter = require('./routes/auth.js');
const keywordsRouter = require('./routes/keywords.js');

const app = express();

// 1. Enable CORS for frontend calls
app.use(cors({
  origin: function (origin, callback) {
    // Allow all origins (Vercel, Localhost, etc) for this project
    callback(null, true);
  },
  credentials: true
}));

// 2. Parse JSON bodies
app.use(express.json({ limit: '10mb' }));

// 3. Define Rate Limiter to prevent spam-abuse
const otpRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 15, // limit each IP to 15 requests per windowMs
  message: {
    success: false,
    error: "Too many requests from this device. Please try again after 10 minutes."
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// 4. Attach OTP Routes with rate limiting applied
app.use('/api', otpRateLimiter, otpRoutes);

// 5. Attach Auth Routes
app.use('/api/auth', authRouter);

// 6. Attach Keywords/AI Routes
app.use('/api/keywords', keywordsRouter);

// Simple healthcheck endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Unified server is healthy and running.' });
});

// 6. Global 404 Route handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: "Endpoint not found." });
});

// 7. Global Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('[SERVER ERROR] Global exception caught:', err.stack);
  res.status(500).json({ success: false, error: "Something went wrong on the server." });
});

// 8. Bind to configured port (only if not running on Vercel)
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 5003;
  app.listen(PORT, () => {
    console.log(`[UNIFIED SERVER] Backend listening on port ${PORT}`);
    console.log(`✅ OTP endpoints: /api/send-otp, /api/verify-otp, /api/resend-otp`);
    console.log(`✅ Auth endpoints: /api/auth/admin`);
    console.log(`✅ Health check: /health`);
  });
}

// Export for Vercel serverless
module.exports = app;