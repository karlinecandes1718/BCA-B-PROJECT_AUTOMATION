const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const otpRoutes = require('./routes/otpRoutes');

const app = express();

// 1. Enable CORS for local Next.js frontend calls
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3001',
  ],
  credentials: true
}));

// 2. Parse JSON bodies
app.use(express.json());

// 3. Define Rate Limiter to prevent spam-abuse (e.g. max 15 requests per 10 mins per IP)
const otpRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 15, // limit each IP to 15 requests per windowMs
  message: {
    success: false,
    error: "Too many requests from this device. Please try again after 10 minutes."
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// 4. Attach OTP Routes with rate limiting applied
app.use('/api', otpRateLimiter, otpRoutes);

// Simple healthcheck endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'OTP Server is healthy and running.' });
});

// 5. Global 404 Route handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: "Endpoint not found." });
});

// 6. Global Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('[SERVER ERROR] Global exception caught:', err.stack);
  res.status(500).json({ success: false, error: "Something went wrong on the server." });
});

// 7. Bind to configured port
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`[SERVER] Secure OTP backend listening on port ${PORT}`);
});
