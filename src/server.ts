import { validateEnv, env } from "../config/env.js";
import { buildApp } from "./app.js";

const app = await buildApp();
let closing = false;

const start = async () => {
  try {
    validateEnv();
    await app.listen({ port: env.port, host: env.host });
    app.log.info(`Server running on PORT ${env.port}`);
  } catch (error) {
    app.log.error(error);
    process.exitCode = 1;
    await shutdown();
  }
};
start();

async function shutdown() {
  if (closing) return;
  closing = true;

  try {
    app.log.info("Остановка приложения");
    await app.close();
  } catch (error) {
    app.log.error(error);
    process.exitCode = 1;
  }
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
