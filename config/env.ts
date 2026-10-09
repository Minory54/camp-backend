import { config } from "dotenv";

config();

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  host: process.env.HOST ?? "0.0.0.0",
  port: Number(process.env.PORT ?? 3000),
  databaseUrl: process.env.DATABASE_URL ?? "",
};

export const validateEnv = () => {
  let databaseUrl: URL;
  
    if (!env.databaseUrl) {
    throw new Error("DATABASE_URL is required");
  }

  try {
    databaseUrl = new URL(env.databaseUrl);
  } catch {
    throw new Error("DATABASE_URL must be a valid URL");
  }

  if (
    !["postgresql:", "postgres:"].includes(databaseUrl.protocol) ||
    !databaseUrl.hostname ||
    databaseUrl.pathname.length <= 1
  ) {
    throw new Error("DATABASE_URL must specify PostgreSQL host and database");
  }
};
