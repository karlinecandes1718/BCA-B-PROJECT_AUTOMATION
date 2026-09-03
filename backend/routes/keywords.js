const express = require('express');
const { generateEventDescription } = require('../services/geminiService');

const router = express.Router();

router.post('/', async (req, res, next) => {
  try {
    const { text, image } = req.body;

    if (!text && !image) {
      return res.status(400).json({
        success: false,
        error: 'Request must include either text or an image.',
      });
    }

    if (image) {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(image.mimeType)) {
        return res.status(400).json({
          success: false,
          error: 'Unsupported image format. Allowed formats: JPEG, PNG, WEBP.',
        });
      }
      if (!image.data || typeof image.data !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'Image data must be a base64 encoded string.',
        });
      }
    }

    let parsedKeywords = [];
    if (text && typeof text === 'string') {
      const rawText = text.trim();
      const wordCount = rawText.split(/\s+/).filter((w) => w.length > 0).length;
      
      if (wordCount > 100) {
        return res.status(400).json({
          success: false,
          error: 'Text input exceeds the maximum limit of 100 words.',
        });
      }

      parsedKeywords = rawText
        .split(/[\n,]+/)
        .map((k) => k.trim())
        .filter((k) => k.length > 0);
    }

    const data = await generateEventDescription(parsedKeywords, image);

    return res.status(200).json({
      success: true,
      data,
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message || 'AI processing failed.',
    });
  }
});

module.exports = router;