function escapeHtml(value = "") {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export class RoadmapsView {
  constructor({ rootElement, onOpenRoadmap, onBack, onOpenLesson, onCreateFromCurrent }) {
    this.rootElement = rootElement;
    this.onOpenRoadmap = onOpenRoadmap;
    this.onBack = onBack;
    this.onOpenLesson = onOpenLesson;
    this.onCreateFromCurrent = onCreateFromCurrent;

    this.rootElement.addEventListener("click", async (event) => {
      const roadmapButton = event.target.closest("[data-roadmap-id]");
      const lessonButton = event.target.closest("[data-lesson-id]");
      const backButton = event.target.closest("[data-action='back-roadmaps']");
      const createButton = event.target.closest("[data-action='create-roadmap']");

      if (roadmapButton && !lessonButton) {
        await this.onOpenRoadmap(roadmapButton.dataset.roadmapId);
      }

      if (lessonButton) {
        await this.onOpenLesson(
          lessonButton.dataset.roadmapId,
          lessonButton.dataset.lessonId
        );
      }

      if (backButton) {
        this.onBack();
      }

      if (createButton) {
        await this.onCreateFromCurrent();
      }
    });
  }

  render(state) {
    if (state.activeView !== "roadmaps") {
      this.rootElement.innerHTML = "";
      return;
    }

    const roadmaps = state.snapshot?.roadmaps || [];
    const selectedRoadmap = roadmaps.find(
      (roadmap) => roadmap.roadmapId === state.selectedRoadmapId
    );

    if (selectedRoadmap) {
      this.rootElement.innerHTML = `
        <section class="page-view">
          <div class="view-header with-action">
            <div>
              <h2>${escapeHtml(selectedRoadmap.title)}</h2>
              <p>${escapeHtml(selectedRoadmap.overview)}</p>
            </div>
            <button class="secondary-view-button" data-action="back-roadmaps">Quay lại</button>
          </div>

          <div class="roadmap-map">
            ${selectedRoadmap.lessons
              .map(
                (lesson, index) => `
                  <button
                    class="roadmap-node"
                    data-roadmap-id="${selectedRoadmap.roadmapId}"
                    data-lesson-id="${lesson.lessonId}"
                  >
                    <span class="roadmap-step">${index + 1}</span>
                    <strong>${escapeHtml(lesson.title)}</strong>
                    <small>${escapeHtml(lesson.summary)}</small>
                  </button>
                `
              )
              .join("")}
          </div>
        </section>
      `;
      return;
    }

    this.rootElement.innerHTML = `
      <section class="page-view">
        <div class="view-header with-action">
          <div>
            <h2>Đề xuất kiến thức cần học thêm</h2>
            <p>Mỗi roadmap là một chuỗi kiến thức ngắn để bạn học tiếp từng bước.</p>
          </div>
          <button class="secondary-view-button" data-action="create-roadmap">
            Tạo từ chủ đề hiện tại
          </button>
        </div>

        ${
          roadmaps.length
            ? `
              <div class="roadmap-grid">
                ${roadmaps
                  .map(
                    (roadmap) => `
                      <button class="roadmap-card" data-roadmap-id="${roadmap.roadmapId}">
                        <p class="list-card-label">${escapeHtml(roadmap.topicLabel)}</p>
                        <h3>${escapeHtml(roadmap.title)}</h3>
                        <p>${escapeHtml(roadmap.overview)}</p>
                        <span>${roadmap.lessons.length} bài học</span>
                      </button>
                    `
                  )
                  .join("")}
              </div>
            `
            : `<div class="empty-state">Chưa có roadmap nào. Hãy tạo từ cuộc trò chuyện hiện tại.</div>`
        }
      </section>
    `;
  }
}
