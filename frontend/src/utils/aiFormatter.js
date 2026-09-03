/**
 * Calls the backend AI endpoint to format a raw activity into a structured
 * institutional report. Sends text keywords and/or an image for analysis.
 *
 * @param {Object} activity - The raw activity object from ActivityForm
 * @returns {Promise<{ description: string, usage: number }>}
 */
export const formatActivityWithAI = async (activity) => {
  const { description, photos } = activity;

  // ── Build the request payload ───────────────────────────────────────────────
  const payload = {};

  // Include text description if provided
  if (description && description.trim().length > 0) {
    payload.text = description.trim();
  }

  // Include the first photo as base64 image if provided
  if (photos && photos.length > 0) {
    const firstPhoto = photos[0];
    // Photos are stored as data URLs: "data:image/jpeg;base64,..."
    if (typeof firstPhoto === 'string' && firstPhoto.startsWith('data:image/')) {
      const mimeMatch = firstPhoto.match(/^data:(image\/[a-zA-Z]+);base64,/);
      if (mimeMatch) {
        const mimeType = mimeMatch[1];
        // Only send supported MIME types
        if (['image/jpeg', 'image/png', 'image/webp'].includes(mimeType)) {
          payload.image = {
            mimeType,
            data: firstPhoto, // Backend strips the prefix itself
          };
        }
      }
    }
  }

  // Must have at least one input
  if (!payload.text && !payload.image) {
    throw new Error('No content to format. Please add a description or a photo.');
  }

  // ── Call backend ────────────────────────────────────────────────────────────
  const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5003';

  const response = await fetch(`${API_BASE}/api/keywords`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.error || `AI formatting failed (HTTP ${response.status})`);
  }

  return {
    description: result.data?.description ?? '',
    usage: result.data?.usage ?? 0,
  };
};
