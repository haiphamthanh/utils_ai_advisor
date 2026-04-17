class OpenAiApiClient {
  constructor({ apiKey, model }) {
    this.apiKey = apiKey;
    this.model = model || "gpt-5";
  }

  async generateStructuredObject({ systemInstruction, userPrompt, schema }) {
    if (!this.apiKey) {
      throw new Error("OPENAI_API_KEY is not configured.");
    }

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        instructions: systemInstruction,
        input: userPrompt,
        text: {
          format: {
            type: "json_schema",
            name: "insight_companion_response",
            strict: true,
            schema,
          },
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API request failed: ${response.status} ${errorText}`);
    }

    const payload = await response.json();
    const rawText = this.extractText(payload);

    if (!rawText) {
      throw new Error("OpenAI API returned an empty response.");
    }

    try {
      return JSON.parse(rawText);
    } catch (error) {
      throw new Error("OpenAI API returned invalid JSON.");
    }
  }

  extractText(payload) {
    if (payload.output_text) {
      return payload.output_text.trim();
    }

    const outputs = payload.output || [];

    return outputs
      .flatMap((item) => item.content || [])
      .map((content) => content.text || "")
      .join("")
      .trim();
  }
}

module.exports = {
  OpenAiApiClient,
};
