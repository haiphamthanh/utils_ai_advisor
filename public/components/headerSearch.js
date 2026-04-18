export class HeaderSearch {
  constructor({ rootElement, onSubmit }) {
    this.rootElement = rootElement;
    this.onSubmit = onSubmit;
  }

  render(state) {
    this.rootElement.innerHTML = `
      <form class="knowledge-search" id="knowledgeSearchForm">
        <span class="search-icon">⌕</span>
        <input
          id="knowledgeSearchInput"
          type="text"
          placeholder="Tìm kiếm kiến thức..."
          ${state.isLoading ? "disabled" : ""}
        />
      </form>
    `;

    const form = this.rootElement.querySelector("#knowledgeSearchForm");
    const input = this.rootElement.querySelector("#knowledgeSearchInput");

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const value = input.value.trim();

      if (!value) {
        return;
      }

      await this.onSubmit(value);
      input.value = "";
    });
  }
}
