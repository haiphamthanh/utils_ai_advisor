const express = require("express");

const env = require("./config/env");
const { InsightController } = require("./controllers/insightController");
const { errorHandler, notFoundHandler } = require("./middleware/errorHandler");
const { createRoutes } = require("./routes");
const { createInsightRoutes } = require("./routes/insightRoutes");
const { InsightService } = require("./services/insightService");
const { LlmService } = require("./services/llmService");
const {
  buildProviderCatalog,
  createModelClients,
} = require("./services/modelClients/createModelClient");
const { DataStore } = require("./stores/dataStore");

async function createApp() {
  const app = express();
  const dataStore = new DataStore(env.dataFilePath);
  await dataStore.init();

  const providerCatalog = buildProviderCatalog({
    defaultProvider: env.llmProvider,
    geminiApiKey: env.geminiApiKey,
    geminiModel: env.geminiModel,
    openAiApiKey: env.openAiApiKey,
    openAiModel: env.openAiModel,
  });
  const modelClients = createModelClients({
    geminiApiKey: env.geminiApiKey,
    geminiModel: env.geminiModel,
    openAiApiKey: env.openAiApiKey,
    openAiModel: env.openAiModel,
  });
  const llmService = new LlmService({
    modelClients,
    providerCatalog,
  });
  const insightService = new InsightService({ dataStore, llmService });
  const insightController = new InsightController(insightService);
  const routes = createRoutes({
    insightRoutes: createInsightRoutes(insightController),
  });

  app.use(express.json());
  app.use("/api", routes);
  app.use(express.static(env.publicDir));
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

module.exports = {
  createApp,
};
