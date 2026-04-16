const { GeminiApiClient } = require("./geminiApiClient");

function createModelClient({ provider, geminiApiKey, geminiModel }) {
  switch (provider) {
    case "gemini":
      return new GeminiApiClient({
        apiKey: geminiApiKey,
        model: geminiModel,
      });
    default:
      throw new Error(`Unsupported LLM provider: ${provider}`);
  }
}

module.exports = {
  createModelClient,
};
