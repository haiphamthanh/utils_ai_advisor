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
        ? "Muon dao sau them? Cu viet theo cach tu nhien nhu dang nhan tin..."
        : "Thu hoi nhu ban dang noi chuyen voi mot nguoi ban: RAG la gi, tai sao can embedding...";
    const statusText = state.error
      ? state.error
      : state.isLoading
        ? "Minh dang nghi va sap xep cach giai thich de hop voi ban..."
        : "Minh dang san sang nghe tiep.";

    this.rootElement.innerHTML = `
      <div class="status-bar ${state.error ? "error" : ""}">
        ${statusText}
      </div>
      <form class="composer-form" id="composerForm">
        <textarea
          id="questionInput"
          placeholder="${placeholder}"
          ${state.isLoading ? "disabled" : ""}
        ></textarea>
        <div class="composer-footer">
          <p class="composer-note">
            Moi lan ban xac nhan da hieu hay chua, minh se dieu chinh cach noi chuyen cho gan hon voi ban.
          </p>
          <button type="submit" ${state.isLoading ? "disabled" : ""}>
            Gui cho minh
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
