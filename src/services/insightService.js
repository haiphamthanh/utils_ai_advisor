const { findTopicByQuestion, getTopicByKey } = require("../data/knowledgeBase");
const { createId } = require("../utils/ids");
const { uniqueItems } = require("../utils/json");

const REFLECTION_LABELS = {
  understood: "Da hieu",
  partial: "Can don gian hon",
  confused: "Van con mo ho",
};

class InsightService {
  constructor({ dataStore, llmService }) {
    this.dataStore = dataStore;
    this.llmService = llmService;
  }

  async createSession(userId = "demo-user") {
    const userProfile = await this.dataStore.getOrCreateUserProfile(userId);
    const session = await this.dataStore.createSession(userId);

    const welcomeMessage = {
      id: createId("msg"),
      role: "assistant",
      kind: "welcome",
      content:
        "Hoi minh mot khai niem ban dang hoc. Minh se tra loi ngan gon, kiem tra muc do hieu, roi goi y ban hoc tiep.",
      createdAt: new Date().toISOString(),
      meta: {
        suggestedPrompts: [
          "RAG la gi?",
          "Embedding la gi?",
          "AI agent khac chatbot the nao?",
        ],
      },
    };

    await this.dataStore.appendMessages(session.sessionId, [welcomeMessage]);

    return this.buildSnapshot({
      userId,
      sessionId: session.sessionId,
      existingProfile: userProfile,
    });
  }

  async askQuestion({ userId = "demo-user", sessionId, question }) {
    if (!question || !String(question).trim()) {
      throw new Error("Question is required.");
    }

    let activeSessionId = sessionId;

    if (!activeSessionId) {
      const session = await this.dataStore.createSession(userId);
      activeSessionId = session.sessionId;
    }

    const profile = await this.dataStore.getOrCreateUserProfile(userId);
    const topic = findTopicByQuestion(question);
    const insight = await this.llmService.generateInitialInsight({
      question,
      topic,
      profile,
    });
    const timestamp = new Date().toISOString();

    const messages = [
      {
        id: createId("msg"),
        role: "user",
        kind: "question",
        content: question.trim(),
        createdAt: timestamp,
        meta: {},
      },
      {
        id: createId("msg"),
        role: "assistant",
        kind: "answer",
        content: insight.shortAnswer,
        createdAt: timestamp,
        meta: {
          topicKey: topic.key,
          topicLabel: topic.label,
          responseSource: insight.source,
        },
      },
      {
        id: createId("msg"),
        role: "assistant",
        kind: "reflection",
        content: insight.reflectionQuestion,
        createdAt: timestamp,
        meta: {
          topicKey: topic.key,
          topicLabel: topic.label,
          actionState: "pending",
          responseSource: insight.source,
          knowledgeGaps: insight.knowledgeGaps,
          followUpSuggestions: insight.followUpSuggestions,
        },
      },
    ];

    await this.dataStore.appendMessages(activeSessionId, messages, {
      currentTopicKey: topic.key,
      currentTopicLabel: topic.label,
    });

    await this.dataStore.recordInitialExchange({
      userId,
      sessionId: activeSessionId,
      topicKey: topic.key,
      topicLabel: topic.label,
      question: question.trim(),
      answer: insight.shortAnswer,
      reflectionQuestion: insight.reflectionQuestion,
      followUpSuggestions: insight.followUpSuggestions,
      knowledgeGaps: insight.knowledgeGaps,
      source: insight.source,
    });

    return this.buildSnapshot({
      userId,
      sessionId: activeSessionId,
    });
  }

  async submitReflection({ userId = "demo-user", sessionId, understandingStatus }) {
    if (!sessionId) {
      throw new Error("Session id is required.");
    }

    if (!REFLECTION_LABELS[understandingStatus]) {
      throw new Error("Unsupported understanding status.");
    }

    const resolvedReflection = await this.dataStore.resolvePendingReflection(
      sessionId,
      understandingStatus
    );

    if (!resolvedReflection) {
      throw new Error("No pending reflection was found for this session.");
    }

    const topic = getTopicByKey(resolvedReflection.meta.topicKey);
    const profile = await this.dataStore.getOrCreateUserProfile(userId);
    const reflection = await this.llmService.generateReflectionInsight({
      topic,
      understandingStatus,
      profile,
    });
    const timestamp = new Date().toISOString();

    const messages = [
      {
        id: createId("msg"),
        role: "user",
        kind: "reflection-feedback",
        content: REFLECTION_LABELS[understandingStatus],
        createdAt: timestamp,
        meta: {
          understandingStatus,
        },
      },
    ];

    if (understandingStatus !== "understood") {
      messages.push({
        id: createId("msg"),
        role: "assistant",
        kind: "clarification",
        content: reflection.clarification,
        createdAt: timestamp,
        meta: {
          topicKey: topic.key,
          topicLabel: topic.label,
          responseSource: reflection.source,
        },
      });
    }

    messages.push({
      id: createId("msg"),
      role: "assistant",
      kind: "recommendations",
      content:
        understandingStatus === "understood"
          ? "Tot. Day la 3 huong hoc tiep theo de mo rong chu de."
          : "Ban co the hoc tiep theo tung buoc qua 3 cau hoi nay.",
      createdAt: timestamp,
      meta: {
        topicKey: topic.key,
        topicLabel: topic.label,
        responseSource: reflection.source,
        followUpSuggestions: reflection.followUpSuggestions,
        knowledgeGaps: reflection.knowledgeGaps,
      },
    });

    await this.dataStore.appendMessages(sessionId, messages, {
      currentTopicKey: topic.key,
      currentTopicLabel: topic.label,
    });

    await this.dataStore.recordReflection({
      userId,
      sessionId,
      topicKey: topic.key,
      topicLabel: topic.label,
      understandingStatus,
      knowledgeGaps: reflection.knowledgeGaps,
      clarification: reflection.clarification,
      followUpSuggestions: reflection.followUpSuggestions,
      source: reflection.source,
    });

    return this.buildSnapshot({
      userId,
      sessionId,
    });
  }

  async getDashboard(userId = "demo-user") {
    const userProfile = await this.dataStore.getOrCreateUserProfile(userId);

    return this.buildSnapshot({
      userId,
      sessionId: userProfile.currentSessionId,
      existingProfile: userProfile,
    });
  }

  async buildSnapshot({ userId, sessionId, existingProfile = null }) {
    const snapshot = await this.dataStore.getSnapshot(userId, sessionId);
    const session = snapshot.session || {
      sessionId: null,
      messages: [],
      currentTopicLabel: null,
    };
    const userProfile = existingProfile || snapshot.userProfile;
    const topics = Object.values(userProfile.topics || {});
    const focusAreas = topics
      .map((topic) => ({
        topicKey: topic.topicKey,
        topicLabel: topic.topicLabel,
        clarificationCount: topic.clarificationCount,
        understoodCount: topic.understoodCount,
        knowledgeGaps: topic.knowledgeGaps,
        score: topic.clarificationCount - topic.understoodCount,
      }))
      .sort((left, right) => right.score - left.score || right.clarificationCount - left.clarificationCount)
      .slice(0, 4);
    const strengths = topics
      .filter((topic) => topic.understoodCount > 0)
      .sort((left, right) => right.understoodCount - left.understoodCount)
      .slice(0, 3)
      .map((topic) => ({
        topicKey: topic.topicKey,
        topicLabel: topic.topicLabel,
        understoodCount: topic.understoodCount,
      }));
    const recentTopics = topics
      .filter((topic) => topic.lastAskedAt)
      .sort((left, right) => right.lastAskedAt.localeCompare(left.lastAskedAt))
      .slice(0, 5)
      .map((topic) => ({
        topicKey: topic.topicKey,
        topicLabel: topic.topicLabel,
        questionsAsked: topic.questionsAsked,
        knowledgeGaps: uniqueItems(topic.knowledgeGaps).slice(0, 3),
      }));

    return {
      userId,
      session: {
        sessionId: session.sessionId,
        currentTopicLabel: session.currentTopicLabel,
        messages: session.messages || [],
      },
      profile: {
        preferredStyle: userProfile.preferredStyle,
        summary: userProfile.summary,
        focusAreas,
        strengths,
        recentTopics,
      },
    };
  }
}

module.exports = {
  InsightService,
};
