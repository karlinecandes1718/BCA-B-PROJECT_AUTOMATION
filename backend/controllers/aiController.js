require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');

exports.formatActivity = async (req, res) => {
  try {
    const { text, image } = req.body;

    if (!text && !image) {
      return res.status(400).json({ success: false, error: 'Request must include text or an image.' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey.includes('YOUR_') || apiKey.includes('PLACE_YOUR_') || apiKey.trim() === '') {
      return res.status(503).json({ success: false, error: 'AI formatting is not configured yet. Please set up the Gemini API key in the backend .env file.' });
    }

    const ai = new GoogleGenAI({ apiKey });

    let contentsPayload = [];
    
    // Add image if present
    if (image && image.data && image.mimeType) {
      // Strip base64 prefix if the frontend didn't already
      const base64Data = image.data.replace(/^data:image\/\w+;base64,/, "");
      contentsPayload.push({
        inlineData: { mimeType: image.mimeType, data: base64Data }
      });
    }

    // Add prompt instructions
    const prompt = `You are an AI assistant that formats raw activity notes for an institutional log.
You will be provided with raw text notes and/or an image from an activity.
Your job is to generate a well-structured description that summarizes the event.
If there are text notes, organize them into clear paragraphs or bullet points.
If there is an image, describe its key contents or context relevant to the activity.
If there are BOTH, merge the information into one cohesive summary.

Output format requested:
[Catchy Event Title]
Overview: [1-2 sentence intro]
Key Details:
  - What to Expect: [bullet]
  - Who It's For: [bullet]
Call to Action: [punchy sentence]

Ensure your response is ONLY the final formatted description (no extra conversational text).
Keep it concise, professional, and within 100 words.

${text ? `Raw notes: ${text}` : ''}`;
    
    contentsPayload.push({ text: prompt });

    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash', // Using 1.5 flash since it supports multimodality better across free tier
      contents: contentsPayload,
    });

    const description = response.text || '';
    
    // In @google/genai, token count might be in usageMetadata
    const usage = response.usageMetadata?.totalTokenCount || 0;

    return res.status(200).json({
      success: true,
      data: {
        description: description.trim(),
        usage: usage
      }
    });

  } catch (error) {
    console.error('[aiController] Error:', error.message);
    const isImageError = /image|format|safety|content/i.test(error.message);
    if (isImageError && req.body.image) {
      return res.status(400).json({ success: false, error: 'Unable to process the image. Please use a different image or rely on text.' });
    }
    return res.status(500).json({ success: false, error: 'Failed to format activity: ' + (error.message || 'Unknown error') });
  }
};
