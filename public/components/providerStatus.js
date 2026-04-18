function formatStatus(status) {
  return status === "connected" ? "Connected" : "Missing key";
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
        <div class="provider-mini">
          <span class="provider-mini-status pending"></span>
          <span>Đang kiểm tra</span>
        </div>
      `;
      return;
    }

    const selectedProvider = state.selectedProvider || config.defaultProvider;

    this.rootElement.innerHTML = `
      <div class="provider-mini-shell">
        <select id="providerSelect" class="provider-mini-select" ${state.isLoading ? "disabled" : ""}>
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
        <div class="provider-mini-list">
          ${config.providers
            .map((provider) => {
              const isActive = provider.id === selectedProvider;
              return `
                <div class="provider-mini ${isActive ? "selected" : ""}">
                  <span class="provider-mini-status ${provider.status}"></span>
                  <span>${provider.label}</span>
                  <small>${formatStatus(provider.status)}</small>
                </div>
              `;
            })
            .join("")}
        </div>
      </div>
    `;
  }
}
