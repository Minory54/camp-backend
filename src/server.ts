import { validateEnv, env } from "../config/env.js";
import { buildApp } from "./app.js";

const app = buildApp();

const start = async () => {
  try {
    validateEnv();
    await app.listen({ port: env.port, host: env.host });
    app.log.info(`Server running on PORT ${env.port}`);
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
};

start();
