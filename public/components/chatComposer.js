export class ChatComposer {
  constructor({ rootElement, onSubmit }) {
    this.rootElement = rootElement;
    this.onSubmit = onSubmit;
    this.textarea = null;
  }

  render(state) {
    this.rootElement.innerHTML = `
      <div class="status-bar ${state.error ? "error" : ""}">
        ${state.error || (state.isLoading ? "Dang xu ly..." : "")}
      </div>
      <form class="composer-form" id="composerForm">
        <textarea
          id="questionInput"
          placeholder="Vi du: RAG la gi? Hoac hoi ve prompt engineering, embedding, vector database..."
          ${state.isLoading ? "disabled" : ""}
        ></textarea>
        <div class="composer-footer">
          <p class="composer-note">
            Tra loi se duoc luu vao knowledge profile de goi y hoc tiep.
          </p>
          <button type="submit" ${state.isLoading ? "disabled" : ""}>
            Gui cau hoi
          </button>
        </div>
      </form>
    `;

    this.textarea = this.rootElement.querySelector("#questionInput");
    const form = this.rootElement.querySelector("#composerForm");

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const question = this.textarea.value.trim();

      if (!question) {
        return;
      }

      await this.onSubmit(question);
      this.textarea.value = "";
      this.textarea.focus();
    });
  }

  setValue(text) {
    if (!this.textarea) {
      return;
    }

    this.textarea.value = text;
    this.textarea.focus();
  }
}
