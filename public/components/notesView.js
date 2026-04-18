function escapeHtml(value = "") {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export class NotesView {
  constructor({ rootElement, onSearchChange, onOpenNote, onResolveNote }) {
    this.rootElement = rootElement;
    this.onSearchChange = onSearchChange;
    this.onOpenNote = onOpenNote;
    this.onResolveNote = onResolveNote;

    this.rootElement.addEventListener("input", (event) => {
      const input = event.target.closest("#noteSearchInput");

      if (!input) {
        return;
      }

      this.onSearchChange(input.value);
    });

    this.rootElement.addEventListener("click", async (event) => {
      const noteButton = event.target.closest("[data-note-id]");
      const resolveButton = event.target.closest("[data-resolve-note]");

      if (noteButton && !resolveButton) {
        const noteId = noteButton.dataset.noteId;
        await this.onOpenNote(noteId);
      }

      if (resolveButton) {
        event.stopPropagation();
        await this.onResolveNote(resolveButton.dataset.resolveNote);
      }
    });
  }

  render(state) {
    if (state.activeView !== "notes") {
      this.rootElement.innerHTML = "";
      return;
    }

    const query = String(state.noteQuery || "").trim().toLowerCase();
    const notes = (state.snapshot?.notes?.active || []).filter((note) => {
      if (!query) {
        return true;
      }

      return [note.title, note.content, note.topicLabel]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });

    this.rootElement.innerHTML = `
      <section class="page-view">
        <div class="view-header">
          <h2>Ghi chú</h2>
          <p>Lưu lại ý quan trọng trong lúc chat và đánh dấu resolve khi đã xử lý xong.</p>
        </div>

        <div class="search-row">
          <input
            id="noteSearchInput"
            class="view-search"
            type="text"
            value="${escapeHtml(state.noteQuery || "")}"
            placeholder="Tìm kiếm ghi chú..."
          />
        </div>

        ${
          notes.length
            ? notes
                .map(
                  (note) => `
                    <article class="list-card clickable-card" data-note-id="${note.noteId}">
                      <div class="list-card-head">
                        <p class="list-card-label">${escapeHtml(note.topicLabel)}</p>
                        <button class="resolve-button" data-resolve-note="${note.noteId}">
                          Resolve
                        </button>
                      </div>
                      <h3>${escapeHtml(note.title)}</h3>
                      <p>${escapeHtml(note.content)}</p>
                    </article>
                  `
                )
                .join("")
            : `<div class="empty-state">Chưa có ghi chú chưa resolve nào.</div>`
        }
      </section>
    `;
  }
}
