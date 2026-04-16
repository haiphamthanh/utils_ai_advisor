export class ChatComposer {
  constructor({ rootElement, onSubmit }) {
    this.rootElement = rootElement;
    this.onSubmit = onSubmit;
    this.textarea = null;
  }

  render(state) {
    const stage = state.snapshot?.session?.interactive?.stage;
    const placeholder =
      stage === "guided_next_step"
        ? "Nhap cau hoi moi hoac chon mot de xuat de hoc tiep..."
        : "Vi du: RAG la gi? Hoac hoi ve prompt engineering, embedding, vector database...";

    this.rootElement.innerHTML = `
      <div class="status-bar ${state.error ? "error" : ""}">
        ${state.error || (state.isLoading ? "Dang xu ly..." : "")}
      </div>
      <form class="composer-form" id="composerForm">
        <textarea
          id="questionInput"
          placeholder="${placeholder}"
          ${state.isLoading ? "disabled" : ""}
        ></textarea>
        <div class="composer-footer">
          <p class="composer-note">
            Confirm cua ban se duoc luu de AI dieu chinh buoc hoc tiep theo.
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
