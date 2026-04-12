const env = require("./config/env");
const { createApp } = require("./app");

async function bootstrap() {
  const app = await createApp();

  app.listen(env.port, () => {
    console.log(`Insight Companion is running at http://localhost:${env.port}`);
  });
}

bootstrap().catch((error) => {
  console.error("Failed to start Insight Companion.", error);
  process.exit(1);
});
