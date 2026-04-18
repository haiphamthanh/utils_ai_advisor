const { uniqueItems } = require("../utils/json");

const INITIAL_RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    topicLabel: {
      type: "string",
      description: "Short topic label in Vietnamese, 2 to 4 words.",
    },
    shortAnswer: {
      type: "string",
      description: "A brief, clear answer in Vietnamese.",
    },
    reflectionQuestion: {
      type: "string",
      description: "One short follow-up question to confirm understanding.",
    },
    knowledgeGaps: {
      type: "array",
      description: "One or two short concepts the user may still be weak on.",
      items: {
        type: "string",
      },
    },
    followUpSuggestions: {
      type: "array",
      description: "Three short next learning questions in Vietnamese.",
      items: {
        type: "string",
      },
    },
  },
  required: [
    "topicLabel",
    "shortAnswer",
    "reflectionQuestion",
    "knowledgeGaps",
    "followUpSuggestions",
  ],
};

const REFLECTION_RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    coachMessage: {
      type: "string",
      description:
        "Adaptive coaching response in Vietnamese based on the confirmation.",
    },
    nextQuestion: {
      type: "string",
      description: "One short next guiding question in Vietnamese.",
    },
    knowledgeGaps: {
      type: "array",
      description:
        "Empty if user understood, otherwise one or two weak concepts.",
      items: {
        type: "string",
      },
    },
    followUpSuggestions: {
      type: "array",
      description: "Three short next learning questions in Vietnamese.",
      items: {
        type: "string",
      },
    },
  },
  required: [
    "coachMessage",
    "nextQuestion",
    "knowledgeGaps",
    "followUpSuggestions",
  ],
};

const ROADMAP_RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    title: {
      type: "string",
    },
    overview: {
      type: "string",
    },
    lessons: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          summary: { type: "string" },
          questionPrompt: { type: "string" },
        },
        required: ["title", "summary", "questionPrompt"],
      },
    },
  },
  required: ["title", "overview", "lessons"],
};

const KNOWLEDGE_SUMMARY_SCHEMA = {
  type: "object",
  properties: {
    title: {
      type: "string",
    },
    summary: {
      type: "string",
    },
    keyPoints: {
      type: "array",
      items: {
        type: "string",
      },
    },
  },
  required: ["title", "summary", "keyPoints"],
};

class LlmService {
  constructor({ modelClients, providerCatalog }) {
    this.modelClients = modelClients;
    this.providerCatalog = providerCatalog;
  }

  async generateInitialInsight({ question, profile, provider, topicHint }) {
    const client = this.getModelClient(provider);
    const systemInstruction = [
      "You are Insight Companion, an AI learning coach.",
      "Always answer in Vietnamese without markdown.",
      "Keep the explanation short, easy to understand, and directly useful for learning.",
      "Your job is not only to answer, but also to identify what the learner may not fully understand yet.",
    ].join("\n");

    const userPrompt = [
      `User question: ${question}`,
      `Topic hint: ${topicHint || "none"}`,
      `Preferred style: ${profile.preferredStyle}`,
      `Known profile summary: ${this.buildProfileContext(profile)}`,
      "Generate a concise answer, one reflection question, one short topic label, one or two likely knowledge gaps, and exactly three next-step suggestions.",
    ].join("\n");

    const result = await client.generateStructuredObject({
      systemInstruction,
      userPrompt,
      schema: INITIAL_RESPONSE_SCHEMA,
    });

    return {
      topicLabel: this.normalizeLine(result.topicLabel, "Learning Topic"),
      shortAnswer: this.normalizeLine(
        result.shortAnswer,
        "Minh se giai thich ngan gon, sau do xac nhan muc do hieu cua ban.",
      ),
      reflectionQuestion: this.normalizeLine(
        result.reflectionQuestion,
        "Ban da nam duoc y chinh cua phan nay chua?",
      ),
      knowledgeGaps: this.normalizeList(result.knowledgeGaps, 2),
      followUpSuggestions: this.normalizeList(result.followUpSuggestions, 3),
      source: this.getSourceLabel(provider),
    };
  }

  async generateReflectionInsight({
    provider,
    topicLabel,
    understandingStatus,
    profile,
    question,
    answer,
    knowledgeGaps,
  }) {
    const client = this.getModelClient(provider);
    const systemInstruction = [
      "You are Insight Companion, an AI learning coach.",
      "Always answer in Vietnamese without markdown.",
      "Use the learner confirmation to adapt the next step.",
      "If the learner is still unclear, simplify with one analogy or concrete example.",
      "If the learner understood, move one level deeper with better next-step suggestions.",
    ].join("\n");

    const userPrompt = [
      `Topic label: ${topicLabel}`,
      `Original user question: ${question}`,
      `Previous answer: ${answer}`,
      `Understanding status: ${understandingStatus}`,
      `Known weak areas: ${(knowledgeGaps || []).join(", ") || "none"}`,
      `Learner profile summary: ${this.buildProfileContext(profile)}`,
      "Return one adaptive coaching message, one next guiding question, zero to two knowledge gaps, and exactly three short next suggestions.",
    ].join("\n");

    const result = await client.generateStructuredObject({
      systemInstruction,
      userPrompt,
      schema: REFLECTION_RESPONSE_SCHEMA,
    });

    return {
      coachMessage: this.normalizeLine(
        result.coachMessage,
        "Minh se dieu chinh buoc tiep theo dua tren xac nhan cua ban.",
      ),
      nextQuestion: this.normalizeLine(
        result.nextQuestion,
        "Ban muon hoc tiep phan nao truoc?",
      ),
      knowledgeGaps:
        understandingStatus === "understood"
          ? []
          : this.normalizeList(result.knowledgeGaps, 2),
      followUpSuggestions: this.normalizeList(result.followUpSuggestions, 3),
      source: this.getSourceLabel(provider),
    };
  }

  async generateRoadmap({ provider, topicLabel, profile }) {
    const client = this.getModelClient(provider);
    const systemInstruction = [
      "You are Insight Companion, an AI learning planner.",
      "Always answer in Vietnamese without markdown.",
      "Create a short learning roadmap made of small lessons, not a long curriculum.",
      "Lessons should be clear, practical, and easy to continue from inside a learning assistant.",
    ].join("\n");

    const userPrompt = [
      `Topic label: ${topicLabel}`,
      `Learner profile summary: ${this.buildProfileContext(profile)}`,
      "Return one roadmap title, one short overview, and 4 to 6 concise lessons.",
      "Each lesson needs a title, a short summary, and a questionPrompt to continue learning in chat.",
    ].join("\n");

    const result = await client.generateStructuredObject({
      systemInstruction,
      userPrompt,
      schema: ROADMAP_RESPONSE_SCHEMA,
    });

    return {
      title: this.normalizeLine(result.title, `Lộ trình học ${topicLabel}`),
      overview: this.normalizeLine(
        result.overview,
        "Một lộ trình ngắn để bạn học tiếp từng bước."
      ),
      lessons: (Array.isArray(result.lessons) ? result.lessons : [])
        .map((lesson) => ({
          title: this.normalizeLine(lesson.title, "Bài học"),
          summary: this.normalizeLine(
            lesson.summary,
            "Một mẩu kiến thức ngắn để bạn mở rộng chủ đề."
          ),
          questionPrompt: this.normalizeLine(
            lesson.questionPrompt,
            `Giải thích ${lesson.title || topicLabel} cho người mới.`
          ),
        }))
        .slice(0, 6),
    };
  }

  async generateKnowledgeSummary({ provider, topicLabel, interactions }) {
    const client = this.getModelClient(provider);
    const systemInstruction = [
      "You are Insight Companion, an AI learning summarizer.",
      "Always answer in Vietnamese without markdown.",
      "Summarize learning progress into a short popup-friendly knowledge card.",
    ].join("\n");

    const userPrompt = [
      `Topic label: ${topicLabel}`,
      "Recent learning interactions:",
      interactions.join("\n"),
      "Return one short summary title, one compact summary paragraph, and exactly 3 key points.",
    ].join("\n");

    const result = await client.generateStructuredObject({
      systemInstruction,
      userPrompt,
      schema: KNOWLEDGE_SUMMARY_SCHEMA,
    });

    return {
      title: this.normalizeLine(result.title, topicLabel),
      summary: this.normalizeLine(
        result.summary,
        "Tóm tắt ngắn gọn phần kiến thức đã học."
      ),
      keyPoints: this.normalizeList(result.keyPoints, 3),
    };
  }

  getConfigSnapshot() {
    const providers = Object.values(this.providerCatalog.providers).map(
      (provider) => ({
        ...provider,
      }),
    );
    const selectedDefault = this.resolveProviderSelection(
      this.providerCatalog.defaultProvider,
    );

    return {
      defaultProvider: selectedDefault,
      providers,
    };
  }

  resolveProviderSelection(provider) {
    if (provider && this.providerCatalog.providers[provider]) {
      return provider;
    }

    if (this.providerCatalog.providers[this.providerCatalog.defaultProvider]) {
      return this.providerCatalog.defaultProvider;
    }

    return Object.keys(this.providerCatalog.providers)[0] || null;
  }

  getModelClient(provider) {
    const resolvedProvider = this.resolveProviderSelection(provider);
    const providerConfig = this.providerCatalog.providers[resolvedProvider];

    if (!providerConfig) {
      throw new Error(`Unsupported provider: ${provider}`);
    }

    if (!providerConfig.isConfigured) {
      const keyName =
        resolvedProvider === "gemini" ? "GEMINI_API_KEY" : "OPENAI_API_KEY";
      throw new Error(`${keyName} is not configured.`);
    }

    return this.modelClients[resolvedProvider];
  }

  getSourceLabel(provider) {
    const resolvedProvider = this.resolveProviderSelection(provider);
    return resolvedProvider === "gemini"
      ? "gemini-api"
      : "openai-responses-api";
  }

  buildProfileContext(profile) {
    const summary = [
      `totalQuestions=${profile.summary?.totalQuestions || 0}`,
      `understood=${profile.summary?.understoodCount || 0}`,
      `clarifications=${profile.summary?.clarificationCount || 0}`,
    ];
    const topicEntries = Object.values(profile.topics || {});

    if (!topicEntries.length) {
      summary.push("trackedTopics=none");
      return summary.join("; ");
    }

    const trackedTopics = topicEntries
      .slice(0, 5)
      .map(
        (topic) =>
          `${topic.topicLabel}: asked ${topic.questionsAsked}, clarified ${topic.clarificationCount}, understood ${topic.understoodCount}`,
      )
      .join(" | ");

    summary.push(`trackedTopics=${trackedTopics}`);
    return summary.join("; ");
  }

  normalizeLine(value, fallback) {
    const text = String(value || "")
      .trim()
      .replace(/\s+/g, " ");

    return text || fallback;
  }

  normalizeList(values, limit) {
    const items = uniqueItems(
      Array.isArray(values)
        ? values.map((value) => String(value || "").trim()).filter(Boolean)
        : [],
    );

    return items.slice(0, limit);
  }
}

module.exports = {
  LlmService,
};
