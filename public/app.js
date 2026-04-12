import { ChatComposer } from "./components/chatComposer.js";
import { ConversationView } from "./components/conversationView.js";
import { ProfilePanel } from "./components/profilePanel.js";
import { ApiClient } from "./services/apiClient.js";
import { AppState } from "./state/appState.js";

const USER_ID = "demo-user";

const apiClient = new ApiClient();
const appState = new AppState();

const composer = new ChatComposer({
  rootElement: document.querySelector("#composerRoot"),
  onSubmit: handleQuestionSubmit,
});

const conversationView = new ConversationView({
  rootElement: document.querySelector("#conversationRoot"),
  sessionBadgeElement: document.querySelector("#sessionBadge"),
  quickPromptsElement: document.querySelector("#quickPrompts"),
  onReflect: handleReflect,
  onSuggestionSelect: handleSuggestionSelect,
});

const profilePanel = new ProfilePanel({
  rootElement: document.querySelector("#profileRoot"),
});

appState.subscribe((state) => {
  composer.render(state);
  conversationView.render(state.snapshot);
  profilePanel.render(state.snapshot);
});

async function bootstrap() {
  appState.set({ isLoading: true, error: "" });

  try {
    const snapshot = await apiClient.createSession(USER_ID);
    appState.set({
      snapshot,
      isLoading: false,
      error: "",
    });
  } catch (error) {
    appState.set({
      isLoading: false,
      error: error.message,
    });
  }
}

async function handleQuestionSubmit(question) {
  const state = appState.get();
  const sessionId = state.snapshot?.session?.sessionId;

  appState.set({ isLoading: true, error: "" });

  try {
    const snapshot = await apiClient.askQuestion({
      userId: USER_ID,
      sessionId,
      question,
    });
    appState.set({
      snapshot,
      isLoading: false,
      error: "",
    });
  } catch (error) {
    appState.set({
      isLoading: false,
      error: error.message,
    });
  }
}

async function handleReflect(understandingStatus) {
  const state = appState.get();
  const sessionId = state.snapshot?.session?.sessionId;

  if (!sessionId) {
    return;
  }

  appState.set({ isLoading: true, error: "" });

  try {
    const snapshot = await apiClient.reflect({
      userId: USER_ID,
      sessionId,
      understandingStatus,
    });
    appState.set({
      snapshot,
      isLoading: false,
      error: "",
    });
  } catch (error) {
    appState.set({
      isLoading: false,
      error: error.message,
    });
  }
}

async function handleSuggestionSelect(suggestion) {
  composer.setValue(suggestion);
  await handleQuestionSubmit(suggestion);
}

bootstrap();
