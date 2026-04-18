function escapeHtml(value = "") {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export class ModalDialog {
  constructor({ rootElement, onClose, onAskFromLesson, onResolveNote }) {
    this.rootElement = rootElement;
    this.onClose = onClose;
    this.onAskFromLesson = onAskFromLesson;
    this.onResolveNote = onResolveNote;

    this.rootElement.addEventListener("click", async (event) => {
      if (event.target.closest("[data-action='close-modal']") || event.target === this.rootElement) {
        this.onClose();
      }

      const askButton = event.target.closest("[data-action='ask-lesson']");
      const resolveButton = event.target.closest("[data-action='resolve-note']");

      if (askButton) {
        await this.onAskFromLesson(
          askButton.dataset.prompt,
          askButton.dataset.topicHint
        );
      }

      if (resolveButton) {
        await this.onResolveNote(resolveButton.dataset.noteId);
      }
    });
  }

  render(state) {
    const modal = state.modal;

    if (!modal) {
      this.rootElement.innerHTML = "";
      this.rootElement.className = "";
      return;
    }

    this.rootElement.className = "modal-overlay";

    if (modal.type === "lesson") {
      this.rootElement.innerHTML = `
        <div class="modal-card">
          <button class="modal-close" data-action="close-modal">×</button>
          <h3>${escapeHtml(modal.data.title)}</h3>
          <p>${escapeHtml(modal.data.learnedSummary?.summary || modal.data.summary)}</p>
          ${
            modal.data.learnedSummary?.keyPoints?.length
              ? `
                <ul class="context-list">
                  ${modal.data.learnedSummary.keyPoints
                    .map((point) => `<li>${escapeHtml(point)}</li>`)
                    .join("")}
                </ul>
              `
              : ""
          }
          <div class="modal-actions">
            <button
              class="secondary-view-button"
              data-action="ask-lesson"
              data-prompt="${escapeHtml(modal.data.questionPrompt)}"
              data-topic-hint="${escapeHtml(modal.data.title)}"
            >
              Cần tìm hiểu
            </button>
          </div>
        </div>
      `;
      return;
    }

    if (modal.type === "note") {
      this.rootElement.innerHTML = `
        <div class="modal-card">
          <button class="modal-close" data-action="close-modal">×</button>
          <h3>${escapeHtml(modal.data.title)}</h3>
          <p><strong>Chủ đề:</strong> ${escapeHtml(modal.data.topicLabel)}</p>
          <p>${escapeHtml(modal.data.content)}</p>
          ${
            modal.data.answer
              ? `<div class="modal-note-answer"><strong>Ngữ cảnh chat:</strong><p>${escapeHtml(
                  modal.data.answer
                )}</p></div>`
              : ""
          }
          ${
            !modal.data.resolved
              ? `
                <div class="modal-actions">
                  <button
                    class="secondary-view-button"
                    data-action="resolve-note"
                    data-note-id="${modal.data.noteId}"
                  >
                    Resolve
                  </button>
                </div>
              `
              : ""
          }
        </div>
      `;
    }
  }
}
