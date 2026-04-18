function escapeHtml(value = "") {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export class ProfilePanel {
  constructor({ rootElement }) {
    this.rootElement = rootElement;
  }

  render(state) {
    const snapshot = state.snapshot;
    const interactive = snapshot?.session?.interactive;
    const currentTopic = interactive?.topicLabel || snapshot?.session?.currentTopicLabel;
    const suggestions = interactive?.suggestions || [];
    const summaryText =
      interactive?.primaryMessage ||
      "Khi bạn bắt đầu chat, mình sẽ tóm tắt ngắn ở đây để bạn nhìn lại nhanh.";
    const noteCount = snapshot?.notes?.active?.length || 0;
    const roadmapCount = snapshot?.roadmaps?.length || 0;
    const totalHistory = snapshot?.history?.length || 0;

    if (state.activeView === "roadmaps") {
      this.rootElement.innerHTML = `
        <div class="context-stack">
          <article class="context-card">
            <h3>🎓 Đề xuất kiến thức</h3>
            <ul class="context-list">
              <li>${roadmapCount} roadmap đang có</li>
              <li>Mỗi roadmap chia thành các bài học ngắn</li>
              <li>Nhấn vào bài học để xem popup và hỏi tiếp</li>
            </ul>
          </article>
        </div>
      `;
      return;
    }

    if (state.activeView === "history") {
      this.rootElement.innerHTML = `
        <div class="context-stack">
          <article class="context-card">
            <h3>📚 Lịch sử đã học</h3>
            <ul class="context-list">
              <li>${totalHistory} lượt hỏi đáp đã được lưu</li>
              <li>Có thể xem lại câu hỏi và câu trả lời cũ</li>
              <li>Dùng để theo dõi quá trình học tập</li>
            </ul>
          </article>
        </div>
      `;
      return;
    }

    if (state.activeView === "notes") {
      this.rootElement.innerHTML = `
        <div class="context-stack">
          <article class="context-card">
            <h3>📝 Ghi chú</h3>
            <ul class="context-list">
              <li>${noteCount} ghi chú chưa resolve</li>
              <li>Nhấn vào card để xem chi tiết</li>
              <li>Resolve xong thì card sẽ không hiện trong bảng</li>
            </ul>
          </article>
        </div>
      `;
      return;
    }

    this.rootElement.innerHTML = `
      <div class="context-stack">
        <article class="context-card">
          <h3>🎓 Chủ đề: ${escapeHtml(currentTopic || "Chưa có chủ đề")}</h3>
        </article>

        <article class="context-card">
          <h3>📌 Tóm tắt nhanh</h3>
          <p>${escapeHtml(summaryText)}</p>
        </article>

        <article class="context-card">
          <h3>🚀 Gợi ý tiếp theo</h3>
          <ul class="context-list">
            ${
              suggestions.length
                ? suggestions
                    .slice(0, 3)
                    .map((item) => `<li>${escapeHtml(item)}</li>`)
                    .join("")
                : `
                    <li>Giải thích dễ hiểu</li>
                    <li>Cho ví dụ thực tế</li>
                    <li>Tạo lộ trình học thêm</li>
                  `
            }
          </ul>
        </article>

        <article class="context-card">
          <h3>📈 Mức độ hiểu</h3>
          <div class="understanding-meter">
            <span class="meter-dot active"></span>
            <span class="meter-dot active"></span>
            <span class="meter-dot ${interactive?.confirmation?.status ? "active" : ""}"></span>
            <span class="meter-dot"></span>
            <span class="meter-dot"></span>
          </div>
        </article>

        <article class="context-card">
          <h3>✅ Nhiệm vụ hôm nay</h3>
          <ul class="context-list">
            <li>– Hoàn thành 1 chủ đề</li>
            <li>– Tạo 1 roadmap</li>
            <li>– Lưu 1 ghi chú quan trọng</li>
          </ul>
        </article>
      </div>
    `;
  }
}
