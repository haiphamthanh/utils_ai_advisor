export class AppState {
  constructor(initialState = {}) {
    this.state = {
      snapshot: null,
      isLoading: false,
      error: "",
      ...initialState,
    };
    this.listeners = new Set();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    listener(this.state);

    return () => {
      this.listeners.delete(listener);
    };
  }

  set(patch) {
    this.state = {
      ...this.state,
      ...patch,
    };

    this.listeners.forEach((listener) => listener(this.state));
  }

  get() {
    return this.state;
  }
}
