function escapeHtml(value = "") {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export class HistoryView {
  constructor({ rootElement }) {
    this.rootElement = rootElement;
  }

  render(state) {
    if (state.activeView !== "history") {
      this.rootElement.innerHTML = "";
      return;
    }

    const history = state.snapshot?.history || [];

    this.rootElement.innerHTML = `
      <section class="page-view">
        <div class="view-header">
          <h2>Lịch sử đã học</h2>
          <p>Toàn bộ quá trình học tập gần đây của bạn được lưu ở đây.</p>
        </div>
        ${
          history.length
            ? history
                .map(
                  (item) => `
                    <article class="list-card">
                      <p class="list-card-label">${escapeHtml(item.topicLabel)}</p>
                      <h3>${escapeHtml(item.question)}</h3>
                      <p>${escapeHtml(item.answer)}</p>
                    </article>
                  `
                )
                .join("")
            : `<div class="empty-state">Chưa có lịch sử học tập nào.</div>`
        }
      </section>
    `;
  }
}
