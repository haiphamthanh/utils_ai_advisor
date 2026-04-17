const { GeminiApiClient } = require("./geminiApiClient");
const { OpenAiApiClient } = require("./openAiApiClient");

function buildProviderCatalog({
  defaultProvider,
  geminiApiKey,
  geminiModel,
  openAiApiKey,
  openAiModel,
}) {
  return {
    defaultProvider,
    providers: {
      gemini: {
        id: "gemini",
        label: "Gemini",
        model: geminiModel || "gemini-2.5-flash",
        isConfigured: Boolean(geminiApiKey),
        status: geminiApiKey ? "connected" : "missing_api_key",
      },
      openai: {
        id: "openai",
        label: "OpenAI",
        model: openAiModel || "gpt-5",
        isConfigured: Boolean(openAiApiKey),
        status: openAiApiKey ? "connected" : "missing_api_key",
      },
    },
  };
}

function createModelClients({ geminiApiKey, geminiModel, openAiApiKey, openAiModel }) {
  return {
    gemini: new GeminiApiClient({
      apiKey: geminiApiKey,
      model: geminiModel,
    }),
    openai: new OpenAiApiClient({
      apiKey: openAiApiKey,
      model: openAiModel,
    }),
  };
}

module.exports = {
  buildProviderCatalog,
  createModelClients,
};
