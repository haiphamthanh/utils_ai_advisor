const fs = require("fs/promises");
const os = require("os");
const path = require("path");
const test = require("node:test");
const assert = require("node:assert/strict");

const { InsightService } = require("../src/services/insightService");
const { LlmService } = require("../src/services/llmService");
const { DataStore } = require("../src/stores/dataStore");

class FakeModelClient {
  async generateStructuredObject({ schema, userPrompt }) {
    if (schema.required.includes("reflectionQuestion")) {
      if (userPrompt.includes("RAG la gi?")) {
        return {
          topicLabel: "RAG",
          shortAnswer: "RAG ket hop tim tai lieu lien quan va mo hinh de tra loi tot hon.",
          reflectionQuestion: "Ban da hieu retrieval trong RAG chua?",
          knowledgeGaps: ["retrieval", "embedding"],
          followUpSuggestions: [
            "Retrieval la gi?",
            "Embedding la gi?",
            "RAG khac fine-tuning the nao?",
          ],
        };
      }

      return {
        topicLabel: "Embedding",
        shortAnswer: "Embedding bien noi dung thanh vector de so sanh y nghia.",
        reflectionQuestion: "Ban da hieu vi sao can vector hoa text chua?",
        knowledgeGaps: ["vector space", "similarity search"],
        followUpSuggestions: [
          "Similarity search la gi?",
          "Vector database la gi?",
          "Embedding dung de lam gi?",
        ],
      };
    }

    if (schema.required.includes("overview")) {
      return {
        title: "Lộ trình học RAG",
        overview: "Đi từng bước từ khái niệm đến ứng dụng.",
        lessons: [
          {
            title: "Retrieval cơ bản",
            summary: "Hiểu cách truy xuất tài liệu liên quan.",
            questionPrompt: "Giải thích retrieval trong RAG cho người mới.",
          },
          {
            title: "Embedding nhập môn",
            summary: "Hiểu text được biểu diễn như thế nào.",
            questionPrompt: "Embedding là gì trong hệ thống tìm kiếm ngữ nghĩa?",
          },
        ],
      };
    }

    if (schema.required.includes("keyPoints")) {
      return {
        title: "Tóm tắt RAG",
        summary: "RAG kết hợp truy xuất tài liệu và mô hình để trả lời tốt hơn.",
        keyPoints: [
          "Cần truy xuất đúng tài liệu",
          "Embedding hỗ trợ tìm kiếm ngữ nghĩa",
          "RAG phù hợp khi kiến thức thay đổi",
        ],
      };
    }

    return {
      coachMessage:
        "Hay hinh dung embedding la cach dat cac cau co y nghia giong nhau gan nhau tren mot ban do.",
      nextQuestion: "Ban muon go ro phan nao truoc trong 3 huong nay?",
      knowledgeGaps: ["vector space", "similarity search"],
      followUpSuggestions: [
        "Similarity search la gi?",
        "Vector database la gi?",
        "Embedding dung de lam gi?",
      ],
    };
  }
}

async function createTestService() {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "insight-companion-"));
  const dataStore = new DataStore(path.join(tempDir, "learning-data.json"));
  await dataStore.init();

  const insightService = new InsightService({
    dataStore,
    llmService: new LlmService({
      modelClients: {
        gemini: new FakeModelClient(),
        openai: new FakeModelClient(),
      },
      providerCatalog: {
        defaultProvider: "gemini",
        providers: {
          gemini: {
            id: "gemini",
            label: "Gemini",
            model: "gemini-2.5-flash",
            isConfigured: true,
            status: "connected",
          },
          openai: {
            id: "openai",
            label: "OpenAI",
            model: "gpt-5",
            isConfigured: true,
            status: "connected",
          },
        },
      },
    }),
  });

  return {
    tempDir,
    insightService,
  };
}

test("askQuestion creates an answer flow and updates profile summary", async () => {
  const { insightService } = await createTestService();
  const sessionSnapshot = await insightService.createSession("tester", "openai");
  const sessionId = sessionSnapshot.session.sessionId;
  const result = await insightService.askQuestion({
    userId: "tester",
    sessionId,
    question: "RAG la gi?",
    provider: "openai",
  });

  assert.equal(result.profile.summary.totalQuestions, 1);
  assert.equal(result.session.messages.length, 4);
  assert.equal(result.session.currentTopicLabel, "RAG");
  assert.equal(result.session.provider, "openai");
  assert.equal(result.session.messages.at(-1).kind, "reflection");
  assert.equal(result.session.interactive.stage, "awaiting_reflection");
  assert.equal(result.session.interactive.question, "RAG la gi?");
});

test("submitReflection adds clarification when user is still confused", async () => {
  const { insightService } = await createTestService();
  const sessionSnapshot = await insightService.createSession("tester", "gemini");
  const sessionId = sessionSnapshot.session.sessionId;

  await insightService.askQuestion({
    userId: "tester",
    sessionId,
    question: "Embedding la gi?",
    provider: "gemini",
  });

  const result = await insightService.submitReflection({
    userId: "tester",
    sessionId,
    understandingStatus: "partial",
  });

  assert.equal(result.profile.summary.clarificationCount, 1);
  assert.equal(result.session.messages.at(-2).kind, "clarification");
  assert.equal(result.session.messages.at(-1).kind, "recommendations");
  assert.equal(result.session.interactive.stage, "guided_next_step");
  assert.equal(result.session.interactive.confirmation.status, "partial");
  assert.equal(result.session.interactive.suggestions.length, 3);
});

test("createNote and createRoadmap add workspace data to snapshot", async () => {
  const { insightService } = await createTestService();
  const sessionSnapshot = await insightService.createSession("tester", "gemini");
  const sessionId = sessionSnapshot.session.sessionId;

  const asked = await insightService.askQuestion({
    userId: "tester",
    sessionId,
    question: "RAG la gi?",
    provider: "gemini",
  });

  const noteSnapshot = await insightService.createNote({
    userId: "tester",
    sessionId,
    content: "Can nho phan retrieval.",
  });

  const roadmapSnapshot = await insightService.createRoadmap({
    userId: "tester",
    sessionId,
    topicLabel: asked.session.currentTopicLabel,
    provider: "gemini",
  });

  assert.equal(noteSnapshot.notes.active.length, 1);
  assert.equal(noteSnapshot.notes.active[0].content, "Can nho phan retrieval.");
  assert.equal(roadmapSnapshot.roadmaps.length, 1);
  assert.equal(roadmapSnapshot.roadmaps[0].lessons.length, 2);
});
