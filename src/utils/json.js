function safeJsonParse(value, fallback = null) {
  try {
    return JSON.parse(value);
  } catch (error) {
    return fallback;
  }
}

function extractJsonObject(rawText) {
  if (!rawText) {
    return null;
  }

  const firstBrace = rawText.indexOf("{");
  const lastBrace = rawText.lastIndexOf("}");

  if (firstBrace === -1 || lastBrace === -1 || lastBrace < firstBrace) {
    return null;
  }

  return safeJsonParse(rawText.slice(firstBrace, lastBrace + 1), null);
}

function uniqueItems(items = []) {
  return [...new Set(items.filter(Boolean))];
}

module.exports = {
  extractJsonObject,
  safeJsonParse,
  uniqueItems,
};
