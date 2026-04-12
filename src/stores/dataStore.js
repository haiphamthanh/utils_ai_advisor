const fs = require("fs/promises");
const path = require("path");

const { createSession, createUserProfile } = require("../models/builders");
const { createId } = require("../utils/ids");
const { uniqueItems } = require("../utils/json");

class DataStore {
  constructor(filePath) {
    this.filePath = filePath;
  }

  async init() {
    await fs.mkdir(path.dirname(this.filePath), { recursive: true });

    try {
      await fs.access(this.filePath);
    } catch (error) {
      await this.persist(this.createDefaultState());
    }
  }

  createDefaultState() {
    const timestamp = new Date().toISOString();

    return {
      meta: {
        createdAt: timestamp,
        updatedAt: timestamp,
      },
      users: {},
      sessions: {},
      interactions: [],
    };
  }

  async load() {
    await this.init();
    const rawContent = await fs.readFile(this.filePath, "utf8");
    return JSON.parse(rawContent);
  }

  async persist(state) {
    state.meta.updatedAt = new Date().toISOString();
    await fs.writeFile(this.filePath, JSON.stringify(state, null, 2), "utf8");
  }

  ensureUser(state, userId) {
    if (!state.users[userId]) {
      state.users[userId] = createUserProfile(userId);
    }

    state.users[userId].lastActiveAt = new Date().toISOString();
    return state.users[userId];
  }

  ensureTopicProgress(userProfile, topicKey, topicLabel) {
    if (!userProfile.topics[topicKey]) {
      userProfile.topics[topicKey] = {
        topicKey,
        topicLabel,
        questionsAsked: 0,
        understoodCount: 0,
        clarificationCount: 0,
        knowledgeGaps: [],
        lastAskedAt: null,
      };
    }

    return userProfile.topics[topicKey];
  }

  async getOrCreateUserProfile(userId) {
    const state = await this.load();
    const userProfile = this.ensureUser(state, userId);
    await this.persist(state);
    return userProfile;
  }

  async createSession(userId) {
    const state = await this.load();
    const userProfile = this.ensureUser(state, userId);
    const sessionId = createId("session");
    const session = createSession(userId, sessionId);

    state.sessions[sessionId] = session;
    userProfile.currentSessionId = sessionId;

    await this.persist(state);
    return session;
  }

  async getSession(sessionId) {
    const state = await this.load();
    return state.sessions[sessionId] || null;
  }

  async appendMessages(sessionId, messages, sessionMeta = {}) {
    const state = await this.load();
    const session = state.sessions[sessionId];

    if (!session) {
      throw new Error("Session not found.");
    }

    session.messages.push(...messages);
    session.updatedAt = new Date().toISOString();

    if (sessionMeta.currentTopicKey) {
      session.currentTopicKey = sessionMeta.currentTopicKey;
      session.currentTopicLabel = sessionMeta.currentTopicLabel;
    }

    await this.persist(state);
    return session;
  }

  async resolvePendingReflection(sessionId, understandingStatus) {
    const state = await this.load();
    const session = state.sessions[sessionId];

    if (!session) {
      throw new Error("Session not found.");
    }

    const reflectionMessage = [...session.messages]
      .reverse()
      .find(
        (message) =>
          message.kind === "reflection" &&
          message.meta &&
          message.meta.actionState === "pending"
      );

    if (!reflectionMessage) {
      return null;
    }

    reflectionMessage.meta.actionState = "resolved";
    reflectionMessage.meta.selectedStatus = understandingStatus;
    reflectionMessage.meta.resolvedAt = new Date().toISOString();
    session.updatedAt = new Date().toISOString();

    await this.persist(state);
    return reflectionMessage;
  }

  async recordInitialExchange(payload) {
    const {
      userId,
      sessionId,
      topicKey,
      topicLabel,
      question,
      answer,
      reflectionQuestion,
      followUpSuggestions,
      knowledgeGaps,
      source,
    } = payload;

    const state = await this.load();
    const userProfile = this.ensureUser(state, userId);
    const topicProgress = this.ensureTopicProgress(userProfile, topicKey, topicLabel);

    userProfile.summary.totalQuestions += 1;
    topicProgress.questionsAsked += 1;
    topicProgress.lastAskedAt = new Date().toISOString();
    topicProgress.knowledgeGaps = uniqueItems([
      ...topicProgress.knowledgeGaps,
      ...knowledgeGaps,
    ]);

    state.interactions.push({
      type: "question_cycle",
      userId,
      sessionId,
      topicKey,
      topicLabel,
      question,
      answer,
      reflectionQuestion,
      followUpSuggestions,
      knowledgeGaps,
      source,
      createdAt: new Date().toISOString(),
    });

    await this.persist(state);
  }

  async recordReflection(payload) {
    const {
      userId,
      sessionId,
      topicKey,
      topicLabel,
      understandingStatus,
      knowledgeGaps,
      clarification,
      followUpSuggestions,
      source,
    } = payload;

    const state = await this.load();
    const userProfile = this.ensureUser(state, userId);
    const topicProgress = this.ensureTopicProgress(userProfile, topicKey, topicLabel);

    if (understandingStatus === "understood") {
      userProfile.summary.understoodCount += 1;
      topicProgress.understoodCount += 1;
    } else {
      userProfile.summary.clarificationCount += 1;
      topicProgress.clarificationCount += 1;
    }

    topicProgress.knowledgeGaps = uniqueItems([
      ...topicProgress.knowledgeGaps,
      ...knowledgeGaps,
    ]);

    state.interactions.push({
      type: "reflection",
      userId,
      sessionId,
      topicKey,
      topicLabel,
      understandingStatus,
      knowledgeGaps,
      clarification,
      followUpSuggestions,
      source,
      createdAt: new Date().toISOString(),
    });

    await this.persist(state);
  }

  async getSnapshot(userId, sessionId) {
    const state = await this.load();
    const userProfile = this.ensureUser(state, userId);
    const activeSessionId = sessionId || userProfile.currentSessionId;

    return {
      session: activeSessionId ? state.sessions[activeSessionId] || null : null,
      userProfile,
    };
  }
}

module.exports = {
  DataStore,
};
