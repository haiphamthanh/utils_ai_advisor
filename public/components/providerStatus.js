function formatStatus(status) {
  return status === "connected" ? "Connected" : "Missing API key";
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
          <p class="provider-helper">Dang kiem tra ket noi provider...</p>
        </div>
      `;
      return;
    }

    const selectedProvider = state.selectedProvider || config.defaultProvider;

    this.rootElement.innerHTML = `
      <div class="provider-panel">
        <label class="provider-label" for="providerSelect">Chat Provider</label>
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
                  <strong>${provider.label}</strong>
                  <span>${formatStatus(provider.status)}</span>
                </div>
              `
            )
            .join("")}
        </div>
        <p class="provider-helper">
          Provider connected / missing API key duoc cap nhat ngay khi mo trang.
        </p>
      </div>
    `;
  }
}
