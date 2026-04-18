import { ChatComposer } from "./components/chatComposer.js";
import { ConversationView } from "./components/conversationView.js";
import { HeaderSearch } from "./components/headerSearch.js";
import { HistoryView } from "./components/historyView.js";
import { ModalDialog } from "./components/modalDialog.js";
import { NotesView } from "./components/notesView.js";
import { ProfilePanel } from "./components/profilePanel.js";
import { ProviderStatus } from "./components/providerStatus.js";
import { RoadmapsView } from "./components/roadmapsView.js";
import { SidebarNav } from "./components/sidebarNav.js";
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
  quickPromptsElement: document.querySelector("#quickPrompts"),
  onReflect: handleReflect,
  onSuggestionSelect: handleSuggestionSelect,
  onQuickAction: handleQuickAction,
});

const headerSearch = new HeaderSearch({
  rootElement: document.querySelector("#headerSearchRoot"),
  onSubmit: handleQuestionSubmit,
});

const profilePanel = new ProfilePanel({
  rootElement: document.querySelector("#profileRoot"),
});

const historyView = new HistoryView({
  rootElement: document.querySelector("#conversationRoot"),
});

const notesView = new NotesView({
  rootElement: document.querySelector("#conversationRoot"),
  onSearchChange: handleNoteSearchChange,
  onOpenNote: handleOpenNote,
  onResolveNote: handleResolveNote,
});

const roadmapsView = new RoadmapsView({
  rootElement: document.querySelector("#conversationRoot"),
  onOpenRoadmap: handleOpenRoadmap,
  onBack: handleCloseRoadmap,
  onOpenLesson: handleOpenLesson,
  onCreateFromCurrent: handleCreateRoadmap,
});

const providerStatus = new ProviderStatus({
  rootElement: document.querySelector("#providerStatusRoot"),
  onProviderChange: handleProviderChange,
});

const sidebarNav = new SidebarNav({
  rootElement: document.querySelector("#sidebarRoot"),
  onCreateSession: handleNewSession,
  onSelectTopic: handleQuestionSubmit,
  onNavigate: handleNavigate,
});

const modalDialog = new ModalDialog({
  rootElement: document.querySelector("#modalRoot"),
  onClose: handleCloseModal,
  onAskFromLesson: handleAskFromLesson,
  onResolveNote: handleResolveNote,
});

appState.subscribe((state) => {
  headerSearch.render(state);
  composer.render(state);
  renderMainView(state);
  profilePanel.render(state);
  providerStatus.render(state);
  sidebarNav.render(state);
  modalDialog.render(state);
  renderStreak(state);
});

async function bootstrap() {
  appState.set({ isLoading: true, error: "" });

  try {
    const config = await apiClient.getConfig();
    const selectedProvider = pickInitialProvider(config);
    const snapshot = await apiClient.createSession(USER_ID, selectedProvider);
    appState.set({
      config,
      selectedProvider,
      activeView: "chat",
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
  const provider = state.selectedProvider;

  appState.set({ isLoading: true, error: "" });

  try {
    const snapshot = await apiClient.askQuestion({
      userId: USER_ID,
      sessionId,
      question,
      provider,
      topicHint: null,
    });
    appState.set({
      snapshot,
      activeView: "chat",
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

async function handleQuickAction(action) {
  const state = appState.get();
  const interactive = state.snapshot?.session?.interactive;
  const topicLabel = interactive?.topicLabel || state.snapshot?.session?.currentTopicLabel;

  if (!interactive && action !== "roadmap") {
    return;
  }

  if (action === "simplify") {
    await handleQuestionSubmit(`Giải thích dễ hiểu về ${topicLabel || interactive.question}`);
    return;
  }

  if (action === "example") {
    await handleQuestionSubmit(`Cho ví dụ thực tế về ${topicLabel || interactive.question}`);
    return;
  }

  if (action === "roadmap") {
    await handleCreateRoadmap();
    return;
  }

  if (action === "note") {
    await handleCreateNote();
  }
}

async function handleProviderChange(provider) {
  appState.set({
    isLoading: true,
    error: "",
    selectedProvider: provider,
  });

  try {
    const snapshot = await apiClient.createSession(USER_ID, provider);
    appState.set({
      snapshot,
      selectedProvider: provider,
      activeView: "chat",
      selectedRoadmapId: null,
      modal: null,
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

async function handleNewSession() {
  const state = appState.get();
  const provider = state.selectedProvider;

  appState.set({
    isLoading: true,
    error: "",
  });

  try {
    const snapshot = await apiClient.createSession(USER_ID, provider);
    appState.set({
      snapshot,
      activeView: "chat",
      selectedRoadmapId: null,
      modal: null,
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

function handleNavigate(view) {
  appState.set({
    activeView: view,
    modal: null,
  });
}

function handleCloseRoadmap() {
  appState.set({
    selectedRoadmapId: null,
  });
}

async function handleCreateRoadmap() {
  const state = appState.get();
  appState.set({ isLoading: true, error: "" });

  try {
    const snapshot = await apiClient.createRoadmap({
      userId: USER_ID,
      sessionId: state.snapshot?.session?.sessionId,
      topicLabel: state.snapshot?.session?.currentTopicLabel,
      provider: state.selectedProvider,
    });

    appState.set({
      snapshot,
      activeView: "roadmaps",
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

async function handleCreateNote() {
  const state = appState.get();
  appState.set({ isLoading: true, error: "" });

  try {
    const snapshot = await apiClient.createNote({
      userId: USER_ID,
      sessionId: state.snapshot?.session?.sessionId,
    });

    appState.set({
      snapshot,
      activeView: "notes",
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

function handleOpenRoadmap(roadmapId) {
  appState.set({
    selectedRoadmapId: roadmapId,
  });
}

function handleOpenLesson(roadmapId, lessonId) {
  const roadmap = (appState.get().snapshot?.roadmaps || []).find(
    (item) => item.roadmapId === roadmapId
  );
  const lesson = roadmap?.lessons?.find((item) => item.lessonId === lessonId);

  if (!lesson) {
    return;
  }

  appState.set({
    modal: {
      type: "lesson",
      data: lesson,
    },
  });
}

function handleOpenNote(noteId) {
  const note = (appState.get().snapshot?.notes?.all || []).find(
    (item) => item.noteId === noteId
  );

  if (!note) {
    return;
  }

  appState.set({
    modal: {
      type: "note",
      data: note,
    },
  });
}

async function handleResolveNote(noteId) {
  const state = appState.get();
  appState.set({ isLoading: true, error: "" });

  try {
    const snapshot = await apiClient.resolveNote(noteId, {
      userId: USER_ID,
      sessionId: state.snapshot?.session?.sessionId,
    });

    appState.set({
      snapshot,
      modal: null,
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

function handleNoteSearchChange(value) {
  appState.set({
    noteQuery: value,
  });
}

function handleCloseModal() {
  appState.set({
    modal: null,
  });
}

async function handleAskFromLesson(prompt, topicHint) {
  appState.set({
    activeView: "chat",
    modal: null,
  });

  const state = appState.get();
  const sessionId = state.snapshot?.session?.sessionId;

  appState.set({ isLoading: true, error: "" });

  try {
    const snapshot = await apiClient.askQuestion({
      userId: USER_ID,
      sessionId,
      question: prompt,
      provider: state.selectedProvider,
      topicHint,
    });
    appState.set({
      snapshot,
      activeView: "chat",
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

function pickInitialProvider(config) {
  return (
    config.providers.find((provider) => provider.id === config.defaultProvider && provider.isConfigured)
      ?.id ||
    config.providers.find((provider) => provider.isConfigured)?.id ||
    config.defaultProvider
  );
}

function renderStreak(state) {
  const root = document.querySelector("#streakRoot");
  const totalQuestions = state.snapshot?.profile?.summary?.totalQuestions || 0;
  const streakDays = totalQuestions >= 6 ? 4 : totalQuestions >= 3 ? 2 : 1;
  root.textContent = `Chuỗi ${streakDays} ngày`;
}

function renderMainView(state) {
  if (state.activeView === "roadmaps") {
    roadmapsView.render(state);
    return;
  }

  if (state.activeView === "history") {
    historyView.render(state);
    return;
  }

  if (state.activeView === "notes") {
    notesView.render(state);
    return;
  }

  conversationView.render(state);
}

bootstrap();
