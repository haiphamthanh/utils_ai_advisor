const fs = require("fs/promises");
const os = require("os");
const path = require("path");
const test = require("node:test");
const assert = require("node:assert/strict");

const { InsightService } = require("../src/services/insightService");
const { LlmService } = require("../src/services/llmService");
const { DataStore } = require("../src/stores/dataStore");

async function createTestService() {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "insight-companion-"));
  const dataStore = new DataStore(path.join(tempDir, "learning-data.json"));
  await dataStore.init();

  const insightService = new InsightService({
    dataStore,
    llmService: new LlmService({
      openAiApiKey: "",
      openAiModel: "gpt-5",
    }),
  });

  return {
    tempDir,
    insightService,
  };
}

test("askQuestion creates an answer flow and updates profile summary", async () => {
  const { insightService } = await createTestService();
  const sessionSnapshot = await insightService.createSession("tester");
  const sessionId = sessionSnapshot.session.sessionId;
  const result = await insightService.askQuestion({
    userId: "tester",
    sessionId,
    question: "RAG la gi?",
  });

  assert.equal(result.profile.summary.totalQuestions, 1);
  assert.equal(result.session.messages.length, 4);
  assert.equal(result.session.currentTopicLabel, "RAG");
  assert.equal(result.session.messages.at(-1).kind, "reflection");
});

test("submitReflection adds clarification when user is still confused", async () => {
  const { insightService } = await createTestService();
  const sessionSnapshot = await insightService.createSession("tester");
  const sessionId = sessionSnapshot.session.sessionId;

  await insightService.askQuestion({
    userId: "tester",
    sessionId,
    question: "Embedding la gi?",
  });

  const result = await insightService.submitReflection({
    userId: "tester",
    sessionId,
    understandingStatus: "partial",
  });

  assert.equal(result.profile.summary.clarificationCount, 1);
  assert.equal(result.session.messages.at(-2).kind, "clarification");
  assert.equal(result.session.messages.at(-1).kind, "recommendations");
});
