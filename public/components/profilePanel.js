function renderTopicCards(items, emptyText, variant = "focus") {
  if (!items.length) {
    return `<div class="empty-state">${emptyText}</div>`;
  }

  return items
    .map((item) => {
      if (variant === "strength") {
        return `
          <article class="topic-card friend-card">
            <h3>${item.topicLabel}</h3>
            <p>Ban da tu tin o chu de nay ${item.understoodCount} lan roi.</p>
          </article>
        `;
      }

      return `
        <article class="topic-card friend-card">
          <h3>${item.topicLabel}</h3>
          <p>
            Minh da phai noi lai ${item.clarificationCount} lan.
            ${item.knowledgeGaps?.length ? `Nen de y: ${item.knowledgeGaps.join(", ")}.` : ""}
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
        <section class="profile-welcome">
          <p class="section-title">Small Memory</p>
          <div class="topic-card buddy-memory-card">
            <h3>Minh dang ghi nho cach ban hoc</h3>
            <p>
              Ban thich kieu giai thich ngan, ro, di thang vao y chinh. Moi lan confirm,
              minh se tinh lai buoc hoc tiep theo cho hop hon.
            </p>
          </div>
        </section>

        <section>
          <p class="section-title">Nhip hoc hien tai</p>
          <div class="metrics-grid">
            <article class="metric-card soft-metric">
              <p class="meta-text">Lan hoi</p>
              <div class="metric-value">${profile.summary.totalQuestions}</div>
            </article>
            <article class="metric-card soft-metric">
              <p class="meta-text">Da ro</p>
              <div class="metric-value">${profile.summary.understoodCount}</div>
            </article>
            <article class="metric-card soft-metric">
              <p class="meta-text">Can noi lai</p>
              <div class="metric-value">${profile.summary.clarificationCount}</div>
            </article>
          </div>
        </section>

        <section>
          <p class="section-title">Cho nao minh nen de y them</p>
          ${renderTopicCards(
            profile.focusAreas || [],
            "Chua co diem nao can de y dac biet. Cu hoi tiep, minh se tu dan ghi nho."
          )}
        </section>

        <section>
          <p class="section-title">Cho nao ban dang kha vung</p>
          ${renderTopicCards(
            profile.strengths || [],
            "Minh chua du du lieu de ket luan phan nao la diem manh cua ban.",
            "strength"
          )}
        </section>

        <section>
          <p class="section-title">Nhẫng chu de gan day</p>
          ${
            (profile.recentTopics || []).length
              ? (profile.recentTopics || [])
                  .map(
                    (item) => `
                      <article class="topic-card friend-card">
                        <h3>${item.topicLabel}</h3>
                        <p>
                          Ban da quay lai chu de nay ${item.questionsAsked} lan.
                          ${item.knowledgeGaps?.length ? `Van nen de y: ${item.knowledgeGaps.join(", ")}.` : ""}
                        </p>
                      </article>
                    `
                  )
                  .join("")
              : `<div class="empty-state">Chua co chu de nao gan day.</div>`
          }
        </section>
      </div>
    `;
  }
}
