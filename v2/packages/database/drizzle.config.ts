import { defineConfig } from "drizzle-kit";
import { join } from "path";

export default defineConfig({
  schema: "./src/schema.ts",
  out: "./migrations",
  dialect: "sqlite",
  dbCredentials: {
    url: process.env.DATABASE_URL || join(process.cwd(), ".data", "db.sqlite"),
  },
  verbose: true,
  strict: true,
});
