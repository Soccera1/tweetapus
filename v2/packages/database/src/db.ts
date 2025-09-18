import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { join } from "path";
import * as schema from "./schema";

const dbPath =
  process.env.DATABASE_URL || join(process.cwd(), ".data", "db.sqlite");
const sqlite = new Database(dbPath);

// Enable WAL mode for better performance
sqlite.exec("PRAGMA journal_mode = WAL;");
sqlite.exec("PRAGMA synchronous = NORMAL;");
sqlite.exec("PRAGMA cache_size = 1000000;");
sqlite.exec("PRAGMA foreign_keys = ON;");
sqlite.exec("PRAGMA temp_store = MEMORY;");

export const db = drizzle(sqlite, { schema });

export * from "./schema";
export { schema };
