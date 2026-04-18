function escapeHtml(value = "") {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatStatusLabel(status) {
  return {
    understood: "Da hieu",
    partial: "Can don gian hon",
    confused: "Van con mo ho",
  }[status] || "Dang tiep tuc";
}

function formatProviderLabel(provider) {
  return {
    gemini: "Gemini",
    openai: "OpenAI",
  }[provider] || provider || "";
}

function companionTone(status) {
  return {
    understood: "Ngon roi, minh day ban them mot chut nua nhe.",
    partial: "Ok, de minh noi lai theo cach mem hon.",
    confused: "Khong sao, minh tach nho hon cho de theo.",
  }[status] || "Minh dang di cung ban tung buoc.";
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
    onReflect,
    onSuggestionSelect,
    quickPromptsElement,
  }) {
    this.rootElement = rootElement;
    this.onReflect = onReflect;
    this.onSuggestionSelect = onSuggestionSelect;
    this.quickPromptsElement = quickPromptsElement;

    this.rootElement.addEventListener("click", (event) => this.handleClick(event));
    this.quickPromptsElement.addEventListener("click", (event) => this.handleQuickPrompt(event));
  }

  render(snapshot) {
    const interactive = snapshot?.session?.interactive;
    const quickPrompts = interactive?.quickPrompts || [];

    this.quickPromptsElement.innerHTML =
      interactive?.stage === "idle"
        ? renderChips(quickPrompts, "warm")
        : "";

    if (!interactive || interactive.stage === "idle") {
      this.rootElement.innerHTML = `
        <section class="stage-shell">
          <article class="spotlight-card intro-card">
            <div class="buddy-row">
              <div class="bubble-avatar">IC</div>
              <div>
                <p class="spotlight-label">Bat dau nhe</p>
                <h3>Hom nay ban muon go ro dieu gi?</h3>
              </div>
            </div>
            <p class="spotlight-copy">
              ${escapeHtml(
                interactive?.introMessage ||
                  "Minh se tra loi ngan, hoi lai de xac nhan, sau do tu dong de xuat buoc tiep theo."
              )}
            </p>
            <p class="buddy-subcopy">
              Ban cu hoi tu nhien. Neu can, minh se tu doi cach giai thich cho de hieu hon.
            </p>
          </article>
          <div class="empty-state">
            Chon mot goi y o duoi hoac viet dieu ban dang mac de bat dau.
          </div>
        </section>
      `;
      return;
    }

    if (interactive.stage === "awaiting_reflection") {
      this.rootElement.innerHTML = this.renderReflectionStage(interactive);
      return;
    }

    this.rootElement.innerHTML = this.renderNextStepStage(interactive);
  }

  renderReflectionStage(interactive) {
    return `
      <section class="stage-shell">
        <div class="question-bubble-row">
          <div class="bubble-avatar user-avatar">H</div>
          <article class="question-bubble">
            ${escapeHtml(interactive.question)}
          </article>
        </div>

        <article class="assistant-card">
          <div class="assistant-card-header">
            <div class="assistant-title-row">
              <div class="bubble-avatar">SB</div>
              <div>
                <p class="assistant-name">Study Buddy</p>
                <p class="assistant-source">${escapeHtml(
                  formatProviderLabel(interactive.primarySource?.includes("openai") ? "openai" : "gemini")
                )}</p>
              </div>
            </div>
            <div class="assistant-dots"><span></span><span></span><span></span></div>
          </div>

          <div class="assistant-content">
            <p>${escapeHtml(interactive.primaryMessage)}</p>
            ${
              interactive.knowledgeGaps?.length
                ? `
                  <div class="chips-row">
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
            <div class="actions-row action-grid">
              <button class="action-button" data-reflect="understood">Đã hiểu</button>
              <button class="action-button secondary" data-reflect="partial">Giải thích dễ hơn</button>
              <button class="action-button secondary" data-reflect="confused">Kiểm tra tôi đã hiểu chưa</button>
            </div>
          </div>
        </article>
      </section>
    `;
  }

  renderNextStepStage(interactive) {
    return `
      <section class="stage-shell">
        <div class="question-bubble-row">
          <div class="bubble-avatar user-avatar">H</div>
          <article class="question-bubble subtle">
            ${escapeHtml(companionTone(interactive.confirmation?.status))}
          </article>
        </div>

        <article class="assistant-card">
          <div class="assistant-card-header">
            <div class="assistant-title-row">
              <div class="bubble-avatar">SB</div>
              <div>
                <p class="assistant-name">Study Buddy</p>
                <p class="assistant-source">${escapeHtml(
                  formatStatusLabel(interactive.confirmation?.status)
                )}</p>
              </div>
            </div>
            <div class="assistant-dots"><span></span><span></span><span></span></div>
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
            ${renderChips(interactive.suggestions || [])}
          </div>
        </article>
      </section>
    `;
  }

  async handleClick(event) {
    const reflectButton = event.target.closest("[data-reflect]");
    const suggestionButton = event.target.closest("[data-suggestion]");

    if (reflectButton) {
      await this.onReflect(reflectButton.dataset.reflect);
    }

    if (suggestionButton) {
      await this.onSuggestionSelect(suggestionButton.dataset.suggestion);
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
