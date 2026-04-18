const NAV_ITEMS = [
  { id: "chat", label: "Trang chủ", icon: "⌂" },
  { id: "roadmaps", label: "Đề xuất kiến thức", icon: "✦" },
  { id: "history", label: "Lịch sử đã học", icon: "◔" },
  { id: "notes", label: "Ghi chú", icon: "✎" },
];

function escapeHtml(value = "") {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export class SidebarNav {
  constructor({ rootElement, onCreateSession, onSelectTopic, onNavigate }) {
    this.rootElement = rootElement;
    this.onCreateSession = onCreateSession;
    this.onSelectTopic = onSelectTopic;
    this.onNavigate = onNavigate;

    this.rootElement.addEventListener("click", async (event) => {
      const newSessionButton = event.target.closest("[data-action='new-session']");
      const topicButton = event.target.closest("[data-topic]");
      const navButton = event.target.closest("[data-view]");

      if (newSessionButton) {
        await this.onCreateSession();
      }

      if (topicButton) {
        await this.onSelectTopic(topicButton.dataset.topic);
      }

      if (navButton) {
        this.onNavigate(navButton.dataset.view);
      }
    });
  }

  render(state) {
    const snapshot = state.snapshot;
    const recentTopics = snapshot?.profile?.recentTopics || [];

    this.rootElement.innerHTML = `
      <div class="sidebar-card">
        <button class="new-session-button" data-action="new-session">
          + Phiên học mới
        </button>

        <nav class="sidebar-nav">
          ${NAV_ITEMS.map(
            (item) => `
              <button
                class="sidebar-nav-item ${state.activeView === item.id ? "active" : ""}"
                data-view="${item.id}"
              >
                <span class="sidebar-icon">${item.icon}</span>
                <span>${item.label}</span>
              </button>
            `
          ).join("")}
        </nav>

        <section class="sidebar-section">
          <h3>Gần đây</h3>
          ${
            recentTopics.length
              ? recentTopics
                  .slice(0, 4)
                  .map(
                    (topic) => `
                      <button class="recent-topic-item" data-topic="${escapeHtml(topic.topicLabel)}">
                        <span>– ${escapeHtml(topic.topicLabel)}</span>
                      </button>
                    `
                  )
                  .join("")
              : `
                <div class="sidebar-note">
                  – Giải thích dễ hiểu<br />
                  – Cho ví dụ thực tế<br />
                  – Tạo lộ trình học ngắn
                </div>
              `
          }
        </section>
      </div>
    `;
  }
}
