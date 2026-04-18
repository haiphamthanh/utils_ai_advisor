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
    const providerLabel = formatProviderLabel(snapshot?.session?.provider);
    const quickPrompts = interactive?.quickPrompts || [];

    this.sessionBadgeElement.textContent = sessionId
      ? `${providerLabel ? `${providerLabel} dang dong hanh` : "Dang ket noi"}`
      : "Dang chuan bi";

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
        <article class="spotlight-card question-card">
          <p class="spotlight-label">Dieu ban vua hoi</p>
          <h3>${escapeHtml(interactive.question)}</h3>
        </article>

        <article class="spotlight-card answer-card">
          <div class="spotlight-header">
            <div class="buddy-row compact">
              <div class="bubble-avatar">IC</div>
              <p class="spotlight-label">Cach minh dang giai thich</p>
            </div>
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
          <p class="spotlight-label">Noi cho minh biet ban dang o dau</p>
          <h3>${escapeHtml(interactive.reflectionPrompt)}</h3>
          <p class="buddy-subcopy">
            Ban khong can chon "dung". Cu chon muc gan nhat voi cam giac cua ban.
          </p>
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
              <p class="spotlight-label">Minh nghe ban noi</p>
              <h3>${escapeHtml(formatStatusLabel(interactive.confirmation?.status))}</h3>
            </div>
            ${
              interactive.confirmation?.label
                ? `<span class="status-pill">${escapeHtml(interactive.confirmation.label)}</span>`
                : ""
            }
          </div>
          <p class="spotlight-copy">${escapeHtml(companionTone(interactive.confirmation?.status))}</p>
        </article>

        <article class="spotlight-card answer-card">
          <div class="spotlight-header">
            <div class="buddy-row compact">
              <div class="bubble-avatar">IC</div>
              <p class="spotlight-label">Minh vua dieu chinh cach noi</p>
            </div>
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
          <p class="spotlight-label">Neu hoc tiep, minh goi y the nay</p>
          <h3>${escapeHtml(interactive.nextQuestion)}</h3>
          <p class="buddy-subcopy">
            Chon mot y ben duoi hoac viet cach hoi rieng cua ban. Minh se noi chuyen tiep tu diem nay.
          </p>
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
