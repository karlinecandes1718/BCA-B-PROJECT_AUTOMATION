/**
 * Formats activity details into a structured report using the backend AI service.
 *
 * @param {Object} activity - The raw activity object
 * @returns {Promise<string>} The formatted description text
 */
export const formatActivityWithAI = async (activity) => {
  const { description, photos } = activity;

  const payload = {};

  if (description && description.trim()) {
    payload.text = description.trim();
  }

  if (photos && photos.length > 0) {
    const photoDataUrl = photos[0];
    const mimeTypeMatch = photoDataUrl.match(/^data:(image\/\w+);base64,/);
    if (mimeTypeMatch) {
      payload.image = {
        mimeType: mimeTypeMatch[1],
        data: photoDataUrl,
      };
    }
  }

  if (!payload.text && !payload.image) {
    throw new Error("No text or image provided for AI formatting.");
  }

  const response = await fetch("http://localhost:5000/api/keywords", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.error || "Failed to generate AI description");
  }

  return result.data;
};
