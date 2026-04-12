const path = require("path");

const rootDir = path.resolve(__dirname, "..", "..");

module.exports = {
  port: Number(process.env.PORT || 3456),
  host: process.env.HOST || "127.0.0.1",
  openAiApiKey: process.env.OPENAI_API_KEY || "",
  openAiModel: process.env.OPENAI_MODEL || "gpt-5",
  dataFilePath: path.join(rootDir, "storage", "learning-data.json"),
  publicDir: path.join(rootDir, "public"),
};
