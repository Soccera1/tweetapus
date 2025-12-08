import Database from "bun:sqlite";
import { copyFileSync, existsSync, mkdirSync, writeFileSync } from "fs";
import { readdir } from "fs/promises";
import { dirname, join } from "path";

const DB_PATH = ".data/db.sqlite";
const UPLOADS_DIR = ".data/uploads";
const OUTPUT_FILE = "out.txt";
const NEW_UPLOADS_DIR = ".data/new-uploads";

const db = new Database(DB_PATH);

// get all table names
const tables = db
	.query(
		"SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';",
	)
	.all()
	.map((row) => row.name);

console.log("scanning files on disk...");

// recursively list all files in .data/uploads
async function listFiles(dir) {
	const entries = await readdir(dir, { withFileTypes: true });
	const files = [];
	for (const entry of entries) {
		const fullPath = join(dir, entry.name);
		if (entry.isDirectory()) {
			files.push(...(await listFiles(fullPath)));
		} else if (entry.isFile()) {
			files.push(fullPath);
		}
	}
	return files;
}

const filesOnDisk = await listFiles(UPLOADS_DIR);
console.log(`Found ${filesOnDisk.length} files on disk`);

// map last 4 chars of filename (before extension) → full path
const last4Map = new Map();
for (const f of filesOnDisk) {
	const filename = f.split("/").pop();
	// extract the hash part (before the extension)
	const lastDot = filename.lastIndexOf(".");
	const hash = lastDot > 0 ? filename.slice(0, lastDot) : filename;

	if (hash.length >= 4) {
		const last4 = hash.slice(-4);
		if (!last4Map.has(last4)) {
			last4Map.set(last4, []);
		}
		last4Map.get(last4).push(f);
	}
}

console.log("scanning DB...");
let output = "";
let foundCount = 0;
let notFoundCount = 0;
let copiedCount = 0;

// create new uploads directory if it doesn't exist
if (!existsSync(NEW_UPLOADS_DIR)) {
	mkdirSync(NEW_UPLOADS_DIR, { recursive: true });
}

for (const table of tables) {
	const rows = db.query(`SELECT * FROM ${table}`).all();
	for (const row of rows) {
		for (const [col, val] of Object.entries(row)) {
			if (typeof val === "string" && val.startsWith("/api/uploads")) {
				// extract filename from path like /api/uploads/SHARD/hash.ext
				const parts = val.split("/");
				const filename = parts[parts.length - 1]; // get last part

				// get hash without extension
				const lastDot = filename.lastIndexOf(".");
				const hash = lastDot > 0 ? filename.slice(0, lastDot) : filename;
				const extension = lastDot > 0 ? filename.slice(lastDot) : "";

				if (hash.length >= 4) {
					const last4 = hash.slice(-4);
					const matches = last4Map.get(last4) || [];

					if (matches.length > 0) {
						foundCount++;
						const sourceFile = matches[0]; // use first match

						// create sharded path: 184/53c/d264fab9dfe08866cc7a6228b7efa920a0a261e7259dfd32702b1c70d6.webp
						const shard1 = hash.slice(0, 3);
						const shard2 = hash.slice(3, 6);
						const remaining = hash.slice(6);

						const targetDir = join(NEW_UPLOADS_DIR, shard1, shard2);
						const targetFile = join(targetDir, remaining + extension);

						// create directory structure
						if (!existsSync(targetDir)) {
							mkdirSync(targetDir, { recursive: true });
						}

						// copy file
						try {
							copyFileSync(sourceFile, targetFile);
							copiedCount++;
							output += `🟢 table: ${table}, column: ${col}, db_path: ${val}, source: ${sourceFile}, target: ${targetFile}\n`;
						} catch (err) {
							output += `🔴 ERROR copying: ${sourceFile} → ${targetFile}: ${err.message}\n`;
						}
					} else {
						notFoundCount++;
						output += `⚪ table: ${table}, column: ${col}, value: ${val}, last4: ${last4}, file: NOT FOUND\n`;
					}
				}
			}
		}
	}
}

output =
	`Summary: ${foundCount} found, ${copiedCount} copied, ${notFoundCount} not found\n\n` +
	output;

writeFileSync(OUTPUT_FILE, output);
console.log(`done, results written to ${OUTPUT_FILE}`);
console.log(
	`Summary: ${foundCount} found, ${copiedCount} copied, ${notFoundCount} not found`,
);
