function escapeHtml(value = "") {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function summarizeMessage(message = "") {
  return String(message)
    .split(/[.!?\n]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 3);
}

function getUnderstandingLevel(snapshot) {
  const status = snapshot?.session?.interactive?.confirmation?.status;

  if (status === "understood") {
    return 4;
  }

  if (status === "partial") {
    return 3;
  }

  if (status === "confused") {
    return 2;
  }

  return snapshot?.profile?.summary?.totalQuestions ? 2 : 0;
}

export class ProfilePanel {
  constructor({ rootElement }) {
    this.rootElement = rootElement;
  }

  render(snapshot) {
    const interactive = snapshot?.session?.interactive;
    const currentTopic = snapshot?.session?.currentTopicLabel || "Chưa có chủ đề";
    const summaryItems = summarizeMessage(
      interactive?.primaryMessage || "Bắt đầu một câu hỏi để mình tóm tắt giúp bạn."
    );
    const suggestions =
      interactive?.suggestions?.slice(0, 3) ||
      snapshot?.profile?.recentTopics?.map((topic) => topic.topicLabel).slice(0, 3) ||
      [];
    const understandingLevel = getUnderstandingLevel(snapshot);
    const totalQuestions = snapshot?.profile?.summary?.totalQuestions || 0;
    const totalClarifications = snapshot?.profile?.summary?.clarificationCount || 0;

    this.rootElement.innerHTML = `
      <div class="context-stack">
        <article class="context-card">
          <h3>🎓 Chủ đề: ${escapeHtml(currentTopic)}</h3>
        </article>

        <article class="context-card">
          <h3>🗂 Tóm tắt nhanh</h3>
          <ul class="context-list">
            ${summaryItems.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
          </ul>
        </article>

        <article class="context-card">
          <h3>🚀 Hỏi tiếp theo</h3>
          <ul class="context-list">
            ${
              suggestions.length
                ? suggestions.map((item) => `<li>${escapeHtml(item)}</li>`).join("")
                : "<li>Hỏi một ví dụ thực tế</li><li>So sánh hai khái niệm</li><li>Kiểm tra mình đã hiểu chưa</li>"
            }
          </ul>
        </article>

        <article class="context-card">
          <h3>📶 Mức độ hiểu</h3>
          <div class="understanding-meter">
            ${Array.from({ length: 5 }, (_, index) => {
              const active = index < understandingLevel;
              return `<span class="meter-dot ${active ? "active" : ""}"></span>`;
            }).join("")}
          </div>
        </article>

        <article class="context-card">
          <h3>🏆 Nhiệm vụ hôm nay</h3>
          <ul class="context-list">
            <li>${totalQuestions >= 1 ? "✓" : "–"} Hoàn thành 1 chủ đề</li>
            <li>${totalQuestions >= 3 ? "✓" : "–"} Đặt 3 câu hỏi tiếp nối</li>
            <li>${totalClarifications >= 1 ? "✓" : "–"} Gỡ ít nhất 1 chỗ chưa rõ</li>
          </ul>
        </article>
      </div>
    `;
  }
}
