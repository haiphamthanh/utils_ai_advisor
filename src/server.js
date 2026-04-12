const env = require("./config/env");
const { createApp } = require("./app");

async function bootstrap() {
  const app = await createApp();

  app.listen(env.port, env.host, () => {
    console.log(`Insight Companion is running at http://${env.host}:${env.port}`);
  });
}

bootstrap().catch((error) => {
  console.error("Failed to start Insight Companion.", error);
  process.exit(1);
});
