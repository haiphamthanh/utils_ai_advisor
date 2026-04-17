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

  async createSession(userId = "demo-user", provider) {
    const userProfile = await this.dataStore.getOrCreateUserProfile(userId);
    const resolvedProvider = this.llmService.resolveProviderSelection(provider);
    const session = await this.dataStore.createSession(userId, resolvedProvider);

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

  async askQuestion({ userId = "demo-user", sessionId, question, provider }) {
    if (!question || !String(question).trim()) {
      throw new Error("Question is required.");
    }

    let activeSessionId = sessionId;
    let activeProvider = null;

    if (!activeSessionId) {
      const session = await this.dataStore.createSession(
        userId,
        this.llmService.resolveProviderSelection(provider)
      );
      activeSessionId = session.sessionId;
      activeProvider = session.currentProvider;
    } else {
      const activeSession = await this.dataStore.getSession(activeSessionId);
      activeProvider =
        provider ||
        activeSession?.currentProvider ||
        this.llmService.resolveProviderSelection();
    }

    const profile = await this.dataStore.getOrCreateUserProfile(userId);
    const insight = await this.llmService.generateInitialInsight({
      question,
      profile,
      provider: activeProvider,
    });
    const topicLabel = insight.topicLabel;
    const topicKey = this.createTopicKey(topicLabel);
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
          topicKey,
          topicLabel,
          responseSource: insight.source,
          provider: activeProvider,
        },
      },
      {
        id: createId("msg"),
        role: "assistant",
        kind: "reflection",
        content: insight.reflectionQuestion,
        createdAt: timestamp,
        meta: {
          topicKey,
          topicLabel,
          actionState: "pending",
          responseSource: insight.source,
          provider: activeProvider,
          knowledgeGaps: insight.knowledgeGaps,
          followUpSuggestions: insight.followUpSuggestions,
        },
      },
    ];

    await this.dataStore.appendMessages(activeSessionId, messages, {
      currentTopicKey: topicKey,
      currentTopicLabel: topicLabel,
      currentProvider: activeProvider,
    });

    await this.dataStore.recordInitialExchange({
      userId,
      sessionId: activeSessionId,
      topicKey,
      topicLabel,
      question: question.trim(),
      answer: insight.shortAnswer,
      reflectionQuestion: insight.reflectionQuestion,
      followUpSuggestions: insight.followUpSuggestions,
      knowledgeGaps: insight.knowledgeGaps,
      source: insight.source,
      provider: activeProvider,
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

    const profile = await this.dataStore.getOrCreateUserProfile(userId);
    const session = await this.dataStore.getSession(sessionId);
    const topicKey = resolvedReflection.meta.topicKey;
    const topicLabel = resolvedReflection.meta.topicLabel;
    const activeProvider =
      session?.currentProvider || resolvedReflection.meta.provider || this.llmService.resolveProviderSelection();
    const reflection = await this.llmService.generateReflectionInsight({
      provider: activeProvider,
      topicLabel,
      understandingStatus,
      profile,
      question: this.getLatestQuestionContent(session),
      answer: this.getLatestAnswerContent(session),
      knowledgeGaps: resolvedReflection.meta.knowledgeGaps || [],
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
        content: reflection.coachMessage,
        createdAt: timestamp,
        meta: {
          topicKey,
          topicLabel,
          responseSource: reflection.source,
          provider: activeProvider,
        },
      });
    }

    messages.push({
      id: createId("msg"),
      role: "assistant",
      kind: "recommendations",
      content: reflection.nextQuestion,
      createdAt: timestamp,
      meta: {
        topicKey,
        topicLabel,
        responseSource: reflection.source,
        provider: activeProvider,
        followUpSuggestions: reflection.followUpSuggestions,
        knowledgeGaps: reflection.knowledgeGaps,
        coachMessage: reflection.coachMessage,
        understandingStatus,
      },
    });

    await this.dataStore.appendMessages(sessionId, messages, {
      currentTopicKey: topicKey,
      currentTopicLabel: topicLabel,
      currentProvider: activeProvider,
    });

    await this.dataStore.recordReflection({
      userId,
      sessionId,
      topicKey,
      topicLabel,
      understandingStatus,
      knowledgeGaps: reflection.knowledgeGaps,
      clarification: reflection.coachMessage,
      followUpSuggestions: reflection.followUpSuggestions,
      source: reflection.source,
      provider: activeProvider,
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

  async getConfig() {
    return this.llmService.getConfigSnapshot();
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
        provider: session.currentProvider,
        currentTopicLabel: session.currentTopicLabel,
        messages: session.messages || [],
        interactive: this.buildInteractiveState(session.messages || [], session.currentTopicLabel),
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

  buildInteractiveState(messages, currentTopicLabel) {
    const welcomeMessage = this.findLatestMessage(messages, "welcome");
    const latestQuestion = this.findLatestMessage(messages, "question");
    const latestAnswer = this.findLatestMessage(messages, "answer");
    const pendingReflection = [...messages]
      .reverse()
      .find(
        (message) =>
          message.kind === "reflection" &&
          message.meta &&
          message.meta.actionState === "pending"
      );
    const latestFeedback = this.findLatestMessage(messages, "reflection-feedback");
    const latestClarification = this.findLatestMessage(messages, "clarification");
    const latestRecommendations = this.findLatestMessage(messages, "recommendations");

    if (!latestQuestion || !latestAnswer) {
      return {
        stage: "idle",
        topicLabel: currentTopicLabel,
        quickPrompts: welcomeMessage?.meta?.suggestedPrompts || [],
        introMessage: welcomeMessage?.content || "",
      };
    }

    if (pendingReflection) {
      return {
        stage: "awaiting_reflection",
        topicLabel: pendingReflection.meta?.topicLabel || currentTopicLabel,
        question: latestQuestion.content,
        primaryMessage: latestAnswer.content,
        primarySource: latestAnswer.meta?.responseSource,
        reflectionPrompt: pendingReflection.content,
        quickPrompts: welcomeMessage?.meta?.suggestedPrompts || [],
        suggestions: pendingReflection.meta?.followUpSuggestions || [],
        knowledgeGaps: pendingReflection.meta?.knowledgeGaps || [],
      };
    }

    return {
      stage: "guided_next_step",
      topicLabel:
        latestRecommendations?.meta?.topicLabel ||
        latestClarification?.meta?.topicLabel ||
        currentTopicLabel,
      question: latestQuestion.content,
      primaryMessage: latestClarification?.content || latestAnswer.content,
      primarySource:
        latestClarification?.meta?.responseSource || latestAnswer.meta?.responseSource,
      confirmation: {
        status: latestFeedback?.meta?.understandingStatus || null,
        label: latestFeedback?.content || null,
      },
      nextQuestion: latestRecommendations?.content || "",
      coachMessage: latestRecommendations?.meta?.coachMessage || "",
      suggestions: latestRecommendations?.meta?.followUpSuggestions || [],
      knowledgeGaps: latestRecommendations?.meta?.knowledgeGaps || [],
      quickPrompts: welcomeMessage?.meta?.suggestedPrompts || [],
    };
  }

  findLatestMessage(messages, kind) {
    return [...messages].reverse().find((message) => message.kind === kind) || null;
  }

  getLatestQuestionContent(session) {
    return this.findLatestMessage(session?.messages || [], "question")?.content || "";
  }

  getLatestAnswerContent(session) {
    return this.findLatestMessage(session?.messages || [], "answer")?.content || "";
  }

  createTopicKey(topicLabel) {
    return String(topicLabel || "learning-topic")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "learning-topic";
  }
}

module.exports = {
  InsightService,
};
