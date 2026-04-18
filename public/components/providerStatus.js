function formatStatus(status) {
  return status === "connected" ? "San sang" : "Thieu API key";
}

export class ProviderStatus {
  constructor({ rootElement, onProviderChange }) {
    this.rootElement = rootElement;
    this.onProviderChange = onProviderChange;

    this.rootElement.addEventListener("change", async (event) => {
      const select = event.target.closest("#providerSelect");

      if (!select) {
        return;
      }

      await this.onProviderChange(select.value);
    });
  }

  render(state) {
    const config = state.config;

    if (!config) {
      this.rootElement.innerHTML = `
        <div class="provider-panel">
          <p class="provider-helper">Dang kiem tra provider kha dung...</p>
        </div>
      `;
      return;
    }

    const selectedProvider = state.selectedProvider || config.defaultProvider;

    this.rootElement.innerHTML = `
      <div class="provider-panel">
        <label class="provider-label" for="providerSelect">Chon nguoi dong hanh AI</label>
        <select id="providerSelect" class="provider-select" ${state.isLoading ? "disabled" : ""}>
          ${config.providers
            .map(
              (provider) => `
                <option
                  value="${provider.id}"
                  ${provider.id === selectedProvider ? "selected" : ""}
                >
                  ${provider.label} (${provider.model})
                </option>
              `
            )
            .join("")}
        </select>
        <div class="provider-badges">
          ${config.providers
            .map(
              (provider) => `
                <div class="provider-badge ${provider.status} ${
                  provider.id === selectedProvider ? "selected" : ""
                }">
                  <div>
                    <strong>${provider.label}</strong>
                    <p>${provider.model}</p>
                  </div>
                  <span>${formatStatus(provider.status)}</span>
                </div>
              `
            )
            .join("")}
        </div>
        <p class="provider-helper">
          Minh bao trang thai ket noi ngay luc mo trang de ban khong phai doan xem provider da san sang hay chua.
        </p>
      </div>
    `;
  }
}
