const { extractJsonObject, uniqueItems } = require("../utils/json");

class LlmService {
  constructor({ openAiApiKey, openAiModel }) {
    this.openAiApiKey = openAiApiKey;
    this.openAiModel = openAiModel;
  }

  async generateInitialInsight({ question, topic, profile }) {
    const fallback = {
      shortAnswer: topic.shortAnswer,
      reflectionQuestion: topic.reflectionQuestion,
      knowledgeGaps: topic.knowledgeGaps,
      followUpSuggestions: topic.followUpSuggestions,
      source: "local-knowledge-base",
    };

    if (!this.openAiApiKey) {
      return fallback;
    }

    const prompt = [
      "You are Insight Companion, an AI learning assistant.",
      "Answer briefly, clearly, and in Vietnamese without markdown.",
      "Return strict JSON with keys:",
      "shortAnswer, reflectionQuestion, knowledgeGaps, followUpSuggestions.",
      `User question: ${question}`,
      `Detected topic: ${topic.label}`,
      `Preferred style: ${profile.preferredStyle}`,
      `Known weak areas: ${Object.keys(profile.topics || {}).join(", ") || "none"}`,
      "knowledgeGaps must contain 1 or 2 short concepts.",
      "followUpSuggestions must contain exactly 3 short learning questions.",
    ].join("\n");

    const modelResult = await this.requestJson(prompt);

    if (!modelResult) {
      return fallback;
    }

    return {
      shortAnswer: modelResult.shortAnswer || fallback.shortAnswer,
      reflectionQuestion: modelResult.reflectionQuestion || fallback.reflectionQuestion,
      knowledgeGaps: uniqueItems(modelResult.knowledgeGaps || fallback.knowledgeGaps).slice(
        0,
        2
      ),
      followUpSuggestions: uniqueItems(
        modelResult.followUpSuggestions || fallback.followUpSuggestions
      ).slice(0, 3),
      source: "openai",
    };
  }

  async generateReflectionInsight({
    topic,
    understandingStatus,
    profile,
    question,
    answer,
    knowledgeGaps,
  }) {
    const fallback = {
      coachMessage:
        understandingStatus === "understood"
          ? "Tot. Minh se day nhanh hon sang phan lien quan de mo rong chu de nay."
          : topic.simplerAnswer,
      nextQuestion:
        understandingStatus === "understood"
          ? `Ban muon dao sau tiep phan nao cua ${topic.label}?`
          : "Trong 3 huong nay, ban muon go ro phan nao truoc?",
      followUpSuggestions: topic.followUpSuggestions,
      knowledgeGaps:
        understandingStatus === "understood"
          ? []
          : (knowledgeGaps || topic.knowledgeGaps).slice(0, 2),
      source: "local-knowledge-base",
    };

    if (!this.openAiApiKey) {
      return fallback;
    }

    const prompt = [
      "You are Insight Companion, an AI learning assistant.",
      "Return strict JSON with keys: coachMessage, nextQuestion, followUpSuggestions, knowledgeGaps.",
      `Topic: ${topic.label}`,
      `Understanding status: ${understandingStatus}`,
      `Original user question: ${question}`,
      `Previous short answer: ${answer}`,
      `Detected knowledge gaps so far: ${(knowledgeGaps || []).join(", ") || "none"}`,
      `Preferred style: ${profile.preferredStyle}`,
      understandingStatus === "understood"
        ? "coachMessage should briefly acknowledge the user understood and shift to a deeper learning direction."
        : "coachMessage should explain in Vietnamese with a simpler analogy and one concrete example.",
      "nextQuestion should be one short question that naturally guides the next step based on the confirmation.",
      "followUpSuggestions must contain exactly 3 short next questions.",
      "knowledgeGaps should be empty if understood, otherwise 1 or 2 concepts.",
    ].join("\n");

    const modelResult = await this.requestJson(prompt);

    if (!modelResult) {
      return fallback;
    }

    return {
      coachMessage: modelResult.coachMessage || fallback.coachMessage,
      nextQuestion: modelResult.nextQuestion || fallback.nextQuestion,
      followUpSuggestions: uniqueItems(
        modelResult.followUpSuggestions || fallback.followUpSuggestions
      ).slice(0, 3),
      knowledgeGaps: uniqueItems(modelResult.knowledgeGaps || fallback.knowledgeGaps).slice(
        0,
        2
      ),
      source: "openai",
    };
  }

  async requestJson(prompt) {
    try {
      const response = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.openAiApiKey}`,
        },
        body: JSON.stringify({
          model: this.openAiModel,
          input: prompt,
        }),
      });

      if (!response.ok) {
        return null;
      }

      const payload = await response.json();
      const rawText = payload.output_text || "";
      return extractJsonObject(rawText);
    } catch (error) {
      return null;
    }
  }
}

module.exports = {
  LlmService,
};
