export class ApiClient {
  constructor(basePath = "/api/insight") {
    this.basePath = basePath;
  }

  async request(path, options = {}) {
    const response = await fetch(`${this.basePath}${path}`, {
      headers: {
        "Content-Type": "application/json",
      },
      ...options,
    });

    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.error || "Request failed.");
    }

    return payload.data;
  }

  createSession(userId) {
    return this.request("/session", {
      method: "POST",
      body: JSON.stringify({ userId }),
    });
  }

  askQuestion(payload) {
    return this.request("/ask", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  reflect(payload) {
    return this.request("/reflect", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }
}
