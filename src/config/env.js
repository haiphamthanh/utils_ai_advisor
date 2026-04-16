const path = require("path");

const rootDir = path.resolve(__dirname, "..", "..");

module.exports = {
  port: Number(process.env.PORT || 3456),
  host: process.env.HOST || "127.0.0.1",
  llmProvider: process.env.LLM_PROVIDER || "gemini",
  geminiApiKey: process.env.GEMINI_API_KEY || "",
  geminiModel: process.env.GEMINI_MODEL || "gemini-2.5-flash",
  dataFilePath: path.join(rootDir, "storage", "learning-data.json"),
  publicDir: path.join(rootDir, "public"),
};
