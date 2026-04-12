function renderTopicCards(items, emptyText, variant = "focus") {
  if (!items.length) {
    return `<div class="empty-state">${emptyText}</div>`;
  }

  return items
    .map((item) => {
      if (variant === "strength") {
        return `
          <article class="topic-card">
            <h3>${item.topicLabel}</h3>
            <p>Da xac nhan hieu ${item.understoodCount} lan.</p>
          </article>
        `;
      }

      return `
        <article class="topic-card">
          <h3>${item.topicLabel}</h3>
          <p>
            Can giai thich them ${item.clarificationCount} lan.
            ${item.knowledgeGaps?.length ? `Gaps: ${item.knowledgeGaps.join(", ")}.` : ""}
          </p>
        </article>
      `;
    })
    .join("");
}

export class ProfilePanel {
  constructor({ rootElement }) {
    this.rootElement = rootElement;
  }

  render(snapshot) {
    const profile = snapshot?.profile;

    if (!profile) {
      this.rootElement.innerHTML = `
        <div class="empty-state">
          Chua co du lieu hoc tap. Hoi cau dau tien de bat dau tao knowledge profile.
        </div>
      `;
      return;
    }

    this.rootElement.innerHTML = `
      <div class="profile-stack">
        <section>
          <p class="section-title">Summary</p>
          <div class="metrics-grid">
            <article class="metric-card">
              <p class="meta-text">Questions</p>
              <div class="metric-value">${profile.summary.totalQuestions}</div>
            </article>
            <article class="metric-card">
              <p class="meta-text">Understood</p>
              <div class="metric-value">${profile.summary.understoodCount}</div>
            </article>
            <article class="metric-card">
              <p class="meta-text">Clarified</p>
              <div class="metric-value">${profile.summary.clarificationCount}</div>
            </article>
          </div>
        </section>

        <section>
          <p class="section-title">Focus Areas</p>
          ${renderTopicCards(
            profile.focusAreas || [],
            "Chua co focus area. Khi ban gap cho mo ho, he thong se bat dau luu knowledge gaps."
          )}
        </section>

        <section>
          <p class="section-title">Strengths</p>
          ${renderTopicCards(
            profile.strengths || [],
            "Chua co du lieu de xac dinh diem manh.",
            "strength"
          )}
        </section>

        <section>
          <p class="section-title">Recent Topics</p>
          ${
            (profile.recentTopics || []).length
              ? (profile.recentTopics || [])
                  .map(
                    (item) => `
                      <article class="topic-card">
                        <h3>${item.topicLabel}</h3>
                        <p>
                          Da hoi ${item.questionsAsked} lan.
                          ${item.knowledgeGaps?.length ? `Can theo doi: ${item.knowledgeGaps.join(", ")}.` : ""}
                        </p>
                      </article>
                    `
                  )
                  .join("")
              : `<div class="empty-state">Chua co recent topic.</div>`
          }
        </section>
      </div>
    `;
  }
}
