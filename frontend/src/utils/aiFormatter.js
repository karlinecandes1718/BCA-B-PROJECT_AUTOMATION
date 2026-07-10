/**
 * Simulates AI formatting of raw activity inputs into a structured report format.
 * This is designed as an asynchronous function to integrate with loading UI states
 * and serve as a direct hook for the final AI implementation.
 * 
 * @param {Object} activity - The raw activity object
 * @returns {Promise<string>} The formatted description text
 */
export const formatActivityWithAI = async (activity) => {
  // Simulate network/inference latency (1.5 seconds)
  await new Promise((resolve) => setTimeout(resolve, 1500));

  const { title, date, category, description, createdBy } = activity;

  // Formatting logic: structure the raw description into a standard institutional report
  let formatted = "";

  // 1. Title & Header
  formatted += `# INSTITUTIONAL ACTIVITY REPORT: ${title.toUpperCase()}\n`;
  formatted += `**Category:** ${category} | **Event Date:** ${date} | **Log By:** ${createdBy || "Admin"}\n`;
  formatted += `**Status:** Verified | **Class:** 3BCA-B\n\n`;
  formatted += `---\n\n`;

  // 2. Main Narrative & Bullet formatting
  formatted += `### I. EXECUTIVE SUMMARY & DESCRIPTION\n`;
  
  // Clean up description: if user put raw paragraphs, separate them and format
  const paragraphs = description
    .split(/\n+/)
    .map(p => p.trim())
    .filter(p => p.length > 0);

  // If the user already wrote markdown, we keep it, otherwise clean it up
  if (description.includes("###") || description.includes("- ") || description.includes("**")) {
    formatted += description;
  } else {
    // Convert regular text paragraphs to structured paragraphs
    paragraphs.forEach((p, idx) => {
      if (idx === 0) {
        formatted += `${p}\n\n`;
      } else if (idx === 1) {
        formatted += `### II. KEY HIGHLIGHTS & OUTCOMES\n`;
        formatted += `- ${p}\n`;
      } else {
        formatted += `- ${p}\n`;
      }
    });

    if (paragraphs.length <= 1) {
      formatted += `\n### II. KEY HIGHLIGHTS & OUTCOMES\n`;
      formatted += `- Activity successfully conducted on the scheduled date.\n`;
      formatted += `- Active participation observed from 3BCA-B students.\n`;
      formatted += `- Logged details archived for college audit records.\n`;
    }
  }

  formatted += `\n\n---\n`;
  formatted += `*Report automatically structured by 3BCA-B AI Reporter on ${new Date().toLocaleDateString()}*`;

  return formatted;
};
