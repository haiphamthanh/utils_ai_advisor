class GeminiApiClient {
  constructor({ apiKey, model }) {
    this.apiKey = apiKey;
    this.model = model || "gemini-2.5-flash";
  }

  async generateStructuredObject({ systemInstruction, userPrompt, schema }) {
    if (!this.apiKey) {
      throw new Error("GEMINI_API_KEY is not configured.");
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": this.apiKey,
        },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: systemInstruction }],
          },
          contents: [
            {
              role: "user",
              parts: [{ text: userPrompt }],
            },
          ],
          generationConfig: {
            responseMimeType: "application/json",
            responseJsonSchema: schema,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API request failed: ${response.status} ${errorText}`);
    }

    const payload = await response.json();
    const rawText = this.extractText(payload);

    if (!rawText) {
      throw new Error("Gemini API returned an empty response.");
    }

    try {
      return JSON.parse(rawText);
    } catch (error) {
      throw new Error("Gemini API returned invalid JSON.");
    }
  }

  extractText(payload) {
    const parts = payload?.candidates?.[0]?.content?.parts || [];
    return parts
      .map((part) => part.text || "")
      .join("")
      .trim();
  }
}

module.exports = {
  GeminiApiClient,
};
