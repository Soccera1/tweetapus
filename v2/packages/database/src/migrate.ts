import { migrate } from "drizzle-orm/bun-sqlite/migrator";
import { db } from "./db";

async function runMigrations() {
  console.log("Running migrations...");
  await migrate(db, { migrationsFolder: "./migrations" });
  console.log("Migrations completed!");
  process.exit(0);
}

runMigrations().catch((error) => {
  console.error("Migration failed:", error);
  process.exit(1);
});
