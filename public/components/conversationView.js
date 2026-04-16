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
    sessionBadgeElement,
    quickPromptsElement,
  }) {
    this.rootElement = rootElement;
    this.onReflect = onReflect;
    this.onSuggestionSelect = onSuggestionSelect;
    this.sessionBadgeElement = sessionBadgeElement;
    this.quickPromptsElement = quickPromptsElement;

    this.rootElement.addEventListener("click", (event) => this.handleClick(event));
    this.quickPromptsElement.addEventListener("click", (event) => this.handleQuickPrompt(event));
  }

  render(snapshot) {
    const interactive = snapshot?.session?.interactive;
    const sessionId = snapshot?.session?.sessionId;
    const currentTopicLabel = interactive?.topicLabel || snapshot?.session?.currentTopicLabel;
    const quickPrompts = interactive?.quickPrompts || [];

    this.sessionBadgeElement.textContent = sessionId
      ? `${currentTopicLabel || "Learning session"}`
      : "Chua co session";

    this.quickPromptsElement.innerHTML =
      interactive?.stage === "idle"
        ? renderChips(quickPrompts, "warm")
        : "";

    if (!interactive || interactive.stage === "idle") {
      this.rootElement.innerHTML = `
        <section class="stage-shell">
          <article class="spotlight-card intro-card">
            <p class="spotlight-label">Interactive Mode</p>
            <h3>Hoi mot khai niem, roi xac nhan muc do hieu cua ban.</h3>
            <p class="spotlight-copy">
              ${escapeHtml(
                interactive?.introMessage ||
                  "Minh se tra loi ngan, hoi lai de xac nhan, sau do tu dong de xuat buoc tiep theo."
              )}
            </p>
          </article>
          <div class="empty-state">
            Chon mot prompt goi y o duoi hoac nhap cau hoi moi de bat dau.
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
        <article class="spotlight-card question-card">
          <p class="spotlight-label">Cau hoi hien tai</p>
          <h3>${escapeHtml(interactive.question)}</h3>
        </article>

        <article class="spotlight-card answer-card">
          <div class="spotlight-header">
            <p class="spotlight-label">Giai thich hien tai</p>
            ${
              interactive.primarySource
                ? `<span class="message-source">${escapeHtml(interactive.primarySource)}</span>`
                : ""
            }
          </div>
          <p class="spotlight-copy">${escapeHtml(interactive.primaryMessage)}</p>
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
        </article>

        <article class="spotlight-card reflection-card">
          <p class="spotlight-label">Xac nhan muc do hieu</p>
          <h3>${escapeHtml(interactive.reflectionPrompt)}</h3>
          <div class="actions-row action-grid">
            <button class="action-button" data-reflect="understood">Da hieu</button>
            <button class="action-button secondary" data-reflect="partial">Can don gian hon</button>
            <button class="action-button secondary" data-reflect="confused">Van con mo ho</button>
          </div>
        </article>
      </section>
    `;
  }

  renderNextStepStage(interactive) {
    return `
      <section class="stage-shell">
        <article class="spotlight-card compact-card">
          <div class="spotlight-header">
            <div>
              <p class="spotlight-label">Ban vua xac nhan</p>
              <h3>${escapeHtml(formatStatusLabel(interactive.confirmation?.status))}</h3>
            </div>
            ${
              interactive.confirmation?.label
                ? `<span class="status-pill">${escapeHtml(interactive.confirmation.label)}</span>`
                : ""
            }
          </div>
          <p class="spotlight-copy">${escapeHtml(interactive.question)}</p>
        </article>

        <article class="spotlight-card answer-card">
          <div class="spotlight-header">
            <p class="spotlight-label">Dieu chinh theo confirm</p>
            ${
              interactive.primarySource
                ? `<span class="message-source">${escapeHtml(interactive.primarySource)}</span>`
                : ""
            }
          </div>
          <p class="spotlight-copy">${escapeHtml(interactive.primaryMessage)}</p>
          ${
            interactive.coachMessage &&
            interactive.coachMessage !== interactive.primaryMessage
              ? `<p class="followup-copy">${escapeHtml(interactive.coachMessage)}</p>`
              : ""
          }
        </article>

        <article class="spotlight-card next-step-card">
          <p class="spotlight-label">Cau hoi AI de xuat tiep</p>
          <h3>${escapeHtml(interactive.nextQuestion)}</h3>
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
          <div class="chips-row">
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
