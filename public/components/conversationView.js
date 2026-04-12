function escapeHtml(value = "") {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatKind(kind) {
  return {
    welcome: "Kickoff",
    question: "Question",
    answer: "Answer",
    reflection: "Reflection",
    "reflection-feedback": "Feedback",
    clarification: "Clarification",
    recommendations: "Suggestions",
  }[kind] || "Message";
}

function roleLabel(role) {
  return role === "user" ? "You" : "Insight";
}

export class ConversationView {
  constructor({ rootElement, onReflect, onSuggestionSelect, sessionBadgeElement, quickPromptsElement }) {
    this.rootElement = rootElement;
    this.onReflect = onReflect;
    this.onSuggestionSelect = onSuggestionSelect;
    this.sessionBadgeElement = sessionBadgeElement;
    this.quickPromptsElement = quickPromptsElement;

    this.rootElement.addEventListener("click", (event) => this.handleClick(event));
    this.quickPromptsElement.addEventListener("click", (event) => this.handleQuickPrompt(event));
  }

  render(snapshot) {
    const messages = snapshot?.session?.messages || [];
    const sessionId = snapshot?.session?.sessionId;
    const currentTopicLabel = snapshot?.session?.currentTopicLabel;
    const welcomeMessage = messages.find((message) => message.kind === "welcome");
    const quickPrompts = welcomeMessage?.meta?.suggestedPrompts || [];

    this.sessionBadgeElement.textContent = sessionId
      ? `${currentTopicLabel || "Learning session"}`
      : "Chua co session";

    this.quickPromptsElement.innerHTML = quickPrompts
      .map(
        (prompt) => `
          <button class="chip warm" data-suggestion="${escapeHtml(prompt)}">
            ${escapeHtml(prompt)}
          </button>
        `
      )
      .join("");

    if (!messages.length) {
      this.rootElement.innerHTML = `
        <div class="empty-state">
          Bat dau bang mot cau hoi ve mot khai niem ban dang hoc.
        </div>
      `;
      return;
    }

    this.rootElement.innerHTML = messages
      .map((message) => this.renderMessage(message))
      .join("");
  }

  renderMessage(message) {
    const source = message.meta?.responseSource;
    const followUpSuggestions = message.meta?.followUpSuggestions || [];
    const knowledgeGaps = message.meta?.knowledgeGaps || [];
    const isPendingReflection =
      message.kind === "reflection" && message.meta?.actionState === "pending";

    return `
      <article class="message ${message.role}">
        <div class="message-header">
          <span class="message-role">${roleLabel(message.role)}</span>
          <span class="message-kind">${formatKind(message.kind)}</span>
        </div>
        <div class="message-body">${escapeHtml(message.content)}</div>
        <div class="message-footer">
          ${source ? `<span class="message-source">${escapeHtml(source)}</span>` : ""}
          ${
            knowledgeGaps.length
              ? knowledgeGaps
                  .map((gap) => `<span class="chip">${escapeHtml(gap)}</span>`)
                  .join("")
              : ""
          }
        </div>
        ${
          isPendingReflection
            ? `
              <div class="actions-row message-footer">
                <button class="action-button" data-reflect="understood">Da hieu</button>
                <button class="action-button secondary" data-reflect="partial">Can don gian hon</button>
                <button class="action-button secondary" data-reflect="confused">Van con mo ho</button>
              </div>
            `
            : ""
        }
        ${
          followUpSuggestions.length
            ? `
              <div class="chips-row message-footer">
                ${followUpSuggestions
                  .map(
                    (suggestion) => `
                      <button class="chip" data-suggestion="${escapeHtml(suggestion)}">
                        ${escapeHtml(suggestion)}
                      </button>
                    `
                  )
                  .join("")}
              </div>
            `
            : ""
        }
      </article>
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
