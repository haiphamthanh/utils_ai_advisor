export class ChatComposer {
  constructor({ rootElement, onSubmit }) {
    this.rootElement = rootElement;
    this.onSubmit = onSubmit;
    this.textarea = null;
  }

  render(state) {
    if (state.activeView !== "chat") {
      this.rootElement.innerHTML = "";
      this.textarea = null;
      return;
    }

    const stage = state.snapshot?.session?.interactive?.stage;
    const hasProvider = state.config?.providers?.some(
      (provider) =>
        provider.id === state.selectedProvider && provider.isConfigured
    );
    const isDisabled = state.isLoading || !hasProvider;
    const placeholder =
      stage === "guided_next_step"
        ? "Bạn muốn hỏi sâu hơn ở điểm nào nữa?"
        : "Nhập câu hỏi của bạn...";

    this.rootElement.innerHTML = `
      <form class="composer-form" id="composerForm">
        ${
          stage === "idle"
            ? `
              <div class="stage-greeting">
                <h2>Chào bạn, bạn cần tìm hiểu gì?</h2>
              </div>
            `
            : ""
        }
        <div class="composer-input-shell">
          <textarea
            id="questionInput"
            placeholder="${placeholder}"
            ${isDisabled ? "disabled" : ""}
          ></textarea>
          <button
            type="submit"
            class="send-icon-button"
            ${isDisabled ? "disabled" : ""}
            aria-label="Gửi câu hỏi"
          >
            ✈
          </button>
        </div>
      </form>
    `;

    this.textarea = this.rootElement.querySelector("#questionInput");
    const form = this.rootElement.querySelector("#composerForm");

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const question = this.textarea.value.trim();

      if (!question || isDisabled) {
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
