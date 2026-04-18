function escapeHtml(value = "") {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

const NAV_ITEMS = [
  { label: "Trang chủ", icon: "⌂" },
  { label: "Môn đang học", icon: "▤" },
  { label: "Lộ trình học", icon: "⌘" },
  { label: "Ghi chú", icon: "✎" },
  { label: "Đã lưu", icon: "☆" },
  { label: "Lịch sử", icon: "◔" },
  { label: "Quiz nhanh", icon: "◎" },
];

export class SidebarNav {
  constructor({ rootElement, onCreateSession, onSelectTopic }) {
    this.rootElement = rootElement;
    this.onCreateSession = onCreateSession;
    this.onSelectTopic = onSelectTopic;

    this.rootElement.addEventListener("click", async (event) => {
      const newSessionButton = event.target.closest("[data-action='new-session']");
      const topicButton = event.target.closest("[data-topic]");

      if (newSessionButton) {
        await this.onCreateSession();
      }

      if (topicButton) {
        await this.onSelectTopic(topicButton.dataset.topic);
      }
    });
  }

  render(snapshot) {
    const recentTopics = snapshot?.profile?.recentTopics || [];

    this.rootElement.innerHTML = `
      <div class="sidebar-card">
        <button class="new-session-button" data-action="new-session">
          + Phiên học mới
        </button>

        <nav class="sidebar-nav">
          ${NAV_ITEMS.map(
            (item) => `
              <div class="sidebar-nav-item">
                <span class="sidebar-icon">${item.icon}</span>
                <span>${item.label}</span>
              </div>
            `
          ).join("")}
        </nav>

        <section class="sidebar-section">
          <h3>Hôm nay</h3>
          ${
            recentTopics.length
              ? recentTopics
                  .slice(0, 3)
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
                  – Ôn lại chủ đề gần nhất<br />
                  – Hỏi một ví dụ thực tế<br />
                  – Làm 3 câu quiz nhỏ
                </div>
              `
          }
        </section>
      </div>
    `;
  }
}
