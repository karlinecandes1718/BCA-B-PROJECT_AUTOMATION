const { GoogleGenAI } = require('@google/genai');

const ALLOWED_MODELS = ['gemini-3.6-flash', 'gemini-1.5-flash'];
const DEFAULT_MODEL = 'gemini-3.6-flash';

function resolveModel(requestedModel) {
  if (requestedModel !== undefined) {
    if (!ALLOWED_MODELS.includes(requestedModel)) {
      throw new Error(
        `Model "${requestedModel}" is not permitted. Only free-tier flash models are allowed: ${ALLOWED_MODELS.join(', ')}.`
      );
    }
    return requestedModel;
  }
  return DEFAULT_MODEL;
}

const SYSTEM_PROMPT = `You are an AI assistant built into an event management portal. Your job is to analyze the provided inputs—which may be a list of keywords, an uploaded image (like a flyer or photo), or a mix of both—and generate a structured event description.

You must strictly adhere to the following rules:

Length: Keep the entire response under 150 words.

Tone: Engaging, informative, and professional.

Missing Info: If the image or keywords lack specific details (like exact time or date), write the description smoothly without inventing fake dates. Use placeholders like "[Date]" only if absolutely necessary, but prefer natural phrasing like "Coming this weekend."

You MUST use this exact layout for the output:

[Catchy Event Title]

Overview:
[A 1-2 sentence introduction explaining what the event/workshop/announcement is about based on the image or text details.]

Key Details:

What to Expect: [A brief bullet point detailing the main activity or takeaway.]

Who It's For: [A brief bullet point defining the target audience or a major highlight like "Beginner friendly" or "Free Entry".]

Call to Action:
[A final punchy sentence inviting users to register, join, or learn more.]`;

async function generateEventDescription(keywordList, image, model) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === '' || apiKey.includes('YOUR_GEMINI_API_KEY')) {
    throw new Error('Gemini API key is not configured in backend/.env file. Please add your GEMINI_API_KEY.');
  }

  const ai = new GoogleGenAI({ apiKey });

  const sanitizedKeywords = Array.isArray(keywordList) 
    ? keywordList.map((k) => String(k).trim()).filter((k) => k.length > 0)
    : [];

  if (sanitizedKeywords.length === 0 && !image) {
    throw new Error('You must provide either valid keywords or an image to analyze.');
  }

  const resolvedModel = resolveModel(model);

  let contentsPayload = [];
  
  let userInput = '';
  if (sanitizedKeywords.length > 0) {
    userInput = `User Input Keywords: ${sanitizedKeywords.join(', ')}`;
  } else if (image) {
    userInput = `User Input: (No keywords provided. Please analyze the image and generate the description based entirely on what you see in the flyer/photo.)`;
  }

  contentsPayload.push(SYSTEM_PROMPT);

  if (image) {
    const base64Data = image.data.replace(/^data:image\/\w+;base64,/, "");
    contentsPayload.push({ inlineData: { mimeType: image.mimeType, data: base64Data } });
  }

  if (userInput) {
    contentsPayload.push(userInput);
  }

  try {
    const response = await ai.models.generateContent({
      model: resolvedModel,
      contents: contentsPayload,
    });

    const rawText = response.text;
    const usage = response.usageMetadata?.totalTokenCount || 0;

    if (!rawText || rawText.trim() === '') {
      throw new Error('Gemini returned an empty response body.');
    }

    return { description: rawText.trim(), usage };

  } catch (error) {
    console.error('[geminiService] Gemini API error:', error.message || error);
    
    if (error && typeof error === 'object') {
      const err = error;
      if (err.status === 403 || (err.error && err.error.code === 403) || err.message?.includes('API key')) {
        throw new Error('Invalid or leaked API key. Please update your backend .env file with a valid GEMINI_API_KEY.');
      }
    }

    const rawMessage = error instanceof Error ? error.message : String(error);
    const isImageError = /image|format|safety|content/i.test(rawMessage);
    if (image && isImageError) {
      throw new Error("Unable to read the image. Please delete it and add a clearer image, or add a text description instead.");
    }

    throw new Error(rawMessage || "Gemini API call failed. Please try again later.");
  }
}

module.exports = { generateEventDescription, ALLOWED_MODELS, DEFAULT_MODEL };