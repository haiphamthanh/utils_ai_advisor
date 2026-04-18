function escapeHtml(value = "") {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatProviderLabel(provider) {
  return {
    gemini: "Gemini",
    openai: "OpenAI",
  }[provider] || provider || "";
}

function renderChips(items = [], className = "") {
  return items
    .map(
      (item) => `
        <button class="chip ${className}" data-suggestion="${escapeHtml(item)}">
          ${escapeHtml(item)}
        </button>
      `
    )
    .join("");
}

export class ConversationView {
  constructor({
    rootElement,
    quickPromptsElement,
    onReflect,
    onSuggestionSelect,
    onQuickAction,
  }) {
    this.rootElement = rootElement;
    this.quickPromptsElement = quickPromptsElement;
    this.onReflect = onReflect;
    this.onSuggestionSelect = onSuggestionSelect;
    this.onQuickAction = onQuickAction;

    this.rootElement.addEventListener("click", (event) => this.handleClick(event));
    this.quickPromptsElement.addEventListener("click", (event) =>
      this.handleQuickPrompt(event)
    );
  }

  render(state) {
    if (state.activeView !== "chat") {
      this.rootElement.innerHTML = "";
      this.quickPromptsElement.innerHTML = "";
      return;
    }

    const snapshot = state.snapshot;
    const interactive = snapshot?.session?.interactive;
    const quickPrompts = interactive?.quickPrompts || [];
    const provider = snapshot?.session?.provider;

    this.quickPromptsElement.innerHTML =
      interactive?.stage === "idle"
        ? `
            <div class="quick-prompt-label">Gợi ý nhanh:</div>
            ${renderChips(quickPrompts, "warm")}
          `
        : "";

    if (!interactive || interactive.stage === "idle") {
      this.rootElement.innerHTML = `
        <section class="stage-shell">
          <div class="idle-face-row">
            <div class="buddy-face">🧑🏻</div>
            <div class="idle-copy">
              <h3>Bắt đầu bằng một câu hỏi ngắn thôi.</h3>
              <p>Mình sẽ trả lời, gợi ý học tiếp và lưu lại tiến trình để hỗ trợ bạn tốt hơn.</p>
            </div>
          </div>
        </section>
      `;
      return;
    }

    this.rootElement.innerHTML =
      interactive.stage === "awaiting_reflection"
        ? this.renderReflectionStage(interactive, provider)
        : this.renderNextStepStage(interactive, provider);
  }

  renderReflectionStage(interactive, provider) {
    return `
      <section class="stage-shell">
        <div class="question-bubble-row">
          <div class="bubble-avatar user-avatar">🙂</div>
          <article class="question-bubble">${escapeHtml(interactive.question)}</article>
        </div>

        <article class="assistant-card">
          <div class="assistant-card-header">
            <div class="assistant-title-row">
              <div class="bubble-avatar">🧠</div>
              <div>
                <p class="assistant-name">Study Buddy</p>
                <p class="assistant-source">${escapeHtml(formatProviderLabel(provider))}</p>
              </div>
            </div>
            <div class="assistant-header-actions">
              <div class="assistant-dots"><span></span><span></span><span></span></div>
              <button class="mini-action" data-reflect="understood">Đã hiểu</button>
              <button class="mini-action" data-reflect="partial">Giải thích dễ hơn</button>
              <button class="mini-action" data-reflect="confused">Kiểm tra tôi đã hiểu chưa</button>
            </div>
          </div>

          <div class="assistant-content">
            <p>${escapeHtml(interactive.primaryMessage)}</p>
            ${
              interactive.knowledgeGaps?.length
                ? `
                  <div class="chips-row compact-gap-row">
                    ${interactive.knowledgeGaps
                      .map((gap) => `<span class="chip muted-chip">${escapeHtml(gap)}</span>`)
                      .join("")}
                  </div>
                `
                : ""
            }
          </div>

          <div class="assistant-reflection">
            <p class="assistant-prompt">${escapeHtml(interactive.reflectionPrompt)}</p>
          </div>

          <div class="assistant-actions-row">
            <button class="chip" data-quick-action="simplify">Giải thích dễ hiểu</button>
            <button class="chip" data-quick-action="example">Cho ví dụ thực tế</button>
            <button class="chip" data-quick-action="roadmap">Tạo lộ trình học</button>
            <button class="chip" data-quick-action="note">Lưu ghi chú</button>
          </div>
        </article>
      </section>
    `;
  }

  renderNextStepStage(interactive, provider) {
    return `
      <section class="stage-shell">
        <div class="question-bubble-row">
          <div class="bubble-avatar user-avatar">🙂</div>
          <article class="question-bubble subtle">${escapeHtml(interactive.question)}</article>
        </div>

        <article class="assistant-card">
          <div class="assistant-card-header">
            <div class="assistant-title-row">
              <div class="bubble-avatar">🧠</div>
              <div>
                <p class="assistant-name">Study Buddy</p>
                <p class="assistant-source">${escapeHtml(formatProviderLabel(provider))}</p>
              </div>
            </div>
            <div class="assistant-header-actions">
              <div class="assistant-dots"><span></span><span></span><span></span></div>
            </div>
          </div>

          <div class="assistant-content">
            <p>${escapeHtml(interactive.primaryMessage)}</p>
            ${
              interactive.coachMessage &&
              interactive.coachMessage !== interactive.primaryMessage
                ? `<p class="followup-copy">${escapeHtml(interactive.coachMessage)}</p>`
                : ""
            }
            <div class="assistant-divider"></div>
            <p class="assistant-prompt">${escapeHtml(interactive.nextQuestion)}</p>
          </div>

          ${
            interactive.knowledgeGaps?.length
              ? `
                <div class="chips-row compact-gap-row">
                  ${interactive.knowledgeGaps
                    .map((gap) => `<span class="chip muted-chip">${escapeHtml(gap)}</span>`)
                    .join("")}
                </div>
              `
              : ""
          }

          <div class="assistant-actions-row">
            <button class="chip" data-quick-action="simplify">Giải thích dễ hiểu</button>
            <button class="chip" data-quick-action="example">Cho ví dụ thực tế</button>
            <button class="chip" data-quick-action="roadmap">Tạo lộ trình học</button>
            <button class="chip" data-quick-action="note">Lưu ghi chú</button>
            ${renderChips(interactive.suggestions || [])}
          </div>
        </article>
      </section>
    `;
  }

  async handleClick(event) {
    const reflectButton = event.target.closest("[data-reflect]");
    const suggestionButton = event.target.closest("[data-suggestion]");
    const quickActionButton = event.target.closest("[data-quick-action]");

    if (reflectButton) {
      await this.onReflect(reflectButton.dataset.reflect);
    }

    if (suggestionButton) {
      await this.onSuggestionSelect(suggestionButton.dataset.suggestion);
    }

    if (quickActionButton) {
      await this.onQuickAction(quickActionButton.dataset.quickAction);
    }
  }

  async handleQuickPrompt(event) {
    const promptButton = event.target.closest("[data-suggestion]");

    if (!promptButton) {
      return;
    }

    await this.onSuggestionSelect(promptButton.dataset.suggestion);
  }
}
