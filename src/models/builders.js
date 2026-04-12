function createUserProfile(userId) {
  const timestamp = new Date().toISOString();

  return {
    userId,
    preferredStyle: "short_clear_direct",
    createdAt: timestamp,
    lastActiveAt: timestamp,
    currentSessionId: null,
    summary: {
      totalQuestions: 0,
      understoodCount: 0,
      clarificationCount: 0,
    },
    topics: {},
  };
}

function createSession(userId, sessionId) {
  const timestamp = new Date().toISOString();

  return {
    sessionId,
    userId,
    createdAt: timestamp,
    updatedAt: timestamp,
    currentTopicKey: null,
    currentTopicLabel: null,
    messages: [],
  };
}

module.exports = {
  createSession,
  createUserProfile,
};
