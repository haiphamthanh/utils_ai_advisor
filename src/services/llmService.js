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
      description: "Adaptive coaching response in Vietnamese based on the confirmation.",
    },
    nextQuestion: {
      type: "string",
      description: "One short next guiding question in Vietnamese.",
    },
    knowledgeGaps: {
      type: "array",
      description: "Empty if user understood, otherwise one or two weak concepts.",
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
  required: ["coachMessage", "nextQuestion", "knowledgeGaps", "followUpSuggestions"],
};

class LlmService {
  constructor({ modelClient }) {
    this.modelClient = modelClient;
  }

  async generateInitialInsight({ question, profile }) {
    const systemInstruction = [
      "You are Insight Companion, an AI learning coach.",
      "Always answer in Vietnamese without markdown.",
      "Keep the explanation short, easy to understand, and directly useful for learning.",
      "Your job is not only to answer, but also to identify what the learner may not fully understand yet.",
    ].join("\n");

    const userPrompt = [
      `User question: ${question}`,
      `Preferred style: ${profile.preferredStyle}`,
      `Known profile summary: ${this.buildProfileContext(profile)}`,
      "Generate a concise answer, one reflection question, one short topic label, one or two likely knowledge gaps, and exactly three next-step suggestions.",
    ].join("\n");

    const result = await this.modelClient.generateStructuredObject({
      systemInstruction,
      userPrompt,
      schema: INITIAL_RESPONSE_SCHEMA,
    });

    return {
      topicLabel: this.normalizeLine(result.topicLabel, "Learning Topic"),
      shortAnswer: this.normalizeLine(
        result.shortAnswer,
        "Minh se giai thich ngan gon, sau do xac nhan muc do hieu cua ban."
      ),
      reflectionQuestion: this.normalizeLine(
        result.reflectionQuestion,
        "Ban da nam duoc y chinh cua phan nay chua?"
      ),
      knowledgeGaps: this.normalizeList(result.knowledgeGaps, 2),
      followUpSuggestions: this.normalizeList(result.followUpSuggestions, 3),
      source: "gemini-api",
    };
  }

  async generateReflectionInsight({
    topicLabel,
    understandingStatus,
    profile,
    question,
    answer,
    knowledgeGaps,
  }) {
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

    const result = await this.modelClient.generateStructuredObject({
      systemInstruction,
      userPrompt,
      schema: REFLECTION_RESPONSE_SCHEMA,
    });

    return {
      coachMessage: this.normalizeLine(
        result.coachMessage,
        "Minh se dieu chinh buoc tiep theo dua tren xac nhan cua ban."
      ),
      nextQuestion: this.normalizeLine(
        result.nextQuestion,
        "Ban muon hoc tiep phan nao truoc?"
      ),
      knowledgeGaps:
        understandingStatus === "understood"
          ? []
          : this.normalizeList(result.knowledgeGaps, 2),
      followUpSuggestions: this.normalizeList(result.followUpSuggestions, 3),
      source: "gemini-api",
    };
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
          `${topic.topicLabel}: asked ${topic.questionsAsked}, clarified ${topic.clarificationCount}, understood ${topic.understoodCount}`
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
        : []
    );

    return items.slice(0, limit);
  }
}

module.exports = {
  LlmService,
};
