import { existsSync, promises as fs, mkdirSync } from "node:fs";
import { join } from "node:path";
import { Elysia, file } from "elysia";
import db from "../db.js";

const extensionsDir = join(process.cwd(), "ext");
if (!existsSync(extensionsDir)) {
	mkdirSync(extensionsDir, { recursive: true });
}
const legacyExtensionsDir = join(process.cwd(), ".data", "extensions");
if (!existsSync(legacyExtensionsDir)) {
	mkdirSync(legacyExtensionsDir, { recursive: true });
}

const parseJsonSafely = (value, fallback) => {
	if (!value) return fallback;
	try {
		return JSON.parse(value);
	} catch {
		return fallback;
	}
};

const safeDirNamePattern = /^[A-Za-z0-9._-]+$/;

const getInstallDirName = (record) => {
	const manifest = parseJsonSafely(record.manifest_json, {});
	const dirName = manifest?.install_dir;
	if (typeof dirName === "string" && safeDirNamePattern.test(dirName.trim())) {
		return dirName.trim();
	}
	return null;
};

const mapExtensionRecord = (record) => ({
	id: record.id,
	name: record.name,
	version: record.version,
	author: record.author,
	summary: record.summary,
	description: record.description,
	website: record.website,
	changelogUrl: record.changelog_url,
	rootFile: record.root_file,
	entryType: record.entry_type,
	styles: parseJsonSafely(record.styles, []),
	capabilities: parseJsonSafely(record.capabilities, []),
	targets: parseJsonSafely(record.targets, []),
	bundleHash: record.bundle_hash,
	fileEndpoint: `/api/extensions/${encodeURIComponent(record.id)}/file`,
	installDir: getInstallDirName(record),
});

const extensionSettingsSelect = db.prepare(
	"SELECT settings FROM extension_settings WHERE extension_id = ?",
);

const sanitizeShortText = (value, max = 512) => {
	if (typeof value !== "string") return null;
	const trimmed = value.trim();
	if (!trimmed) return null;
	return trimmed.slice(0, max);
};

const collectStringList = (value, limit = 12, maxLength = 64) => {
	if (!Array.isArray(value)) return [];
	const store = new Set();
	const list = [];
	for (const entry of value) {
		if (typeof entry !== "string") continue;
		const trimmed = entry.trim();
		if (!trimmed) continue;
		const clipped = trimmed.slice(0, maxLength);
		if (store.has(clipped)) continue;
		store.add(clipped);
		list.push(clipped);
		if (list.length >= limit) break;
	}
	return list;
};

const collectStylePaths = (value) => {
	if (!Array.isArray(value)) return [];
	const seen = new Set();
	const list = [];
	for (const entry of value) {
		const normalized = normalizeRelativePath(entry);
		if (!normalized) continue;
		if (!normalized.startsWith("src/") || !normalized.endsWith(".css")) {
			continue;
		}
		if (seen.has(normalized)) continue;
		seen.add(normalized);
		list.push(normalized);
	}
	return list;
};

const parseManualManifest = (manifest, dirName) => {
	if (typeof manifest !== "object" || !manifest) return null;
	const rootCandidate =
		manifest.root_file ??
		manifest.rootFile ??
		manifest["root-file"] ??
		manifest.main ??
		"src/index.js";
	const normalizedRoot = normalizeRelativePath(rootCandidate);
	if (
		!normalizedRoot ||
		!normalizedRoot.startsWith("src/") ||
		!normalizedRoot.endsWith(".js")
	) {
		return null;
	}
	const baseId = sanitizeShortText(manifest.id, 80) || dirName;
	const safeId = sanitizeDirSegment(baseId) || dirName;
	const name = sanitizeShortText(manifest.name, 80) || safeId;
	const version = sanitizeShortText(manifest.version, 32) || "0.0.0";
	const author = sanitizeShortText(manifest.author, 120);
	const summary = sanitizeShortText(manifest.summary, 280);
	const description = sanitizeShortText(manifest.description, 2000);
	const website = sanitizeShortText(manifest.website, 2048);
	const changelogUrl = sanitizeShortText(
		manifest.changelog_url ?? manifest.changelogUrl,
		2048,
	);
	const entryTypeRaw =
		manifest.entry_type ?? manifest.entryType ?? manifest.mode ?? "module";
	const entryType =
		typeof entryTypeRaw === "string" && entryTypeRaw.toLowerCase() === "script"
			? "script"
			: "module";
	return {
		id: safeId,
		name,
		version,
		author,
		summary,
		description,
		website,
		changelogUrl,
		rootFile: normalizedRoot,
		entryType,
		styles: collectStylePaths(
			manifest.styles ?? manifest.style_files ?? manifest["style-files"],
		),
		capabilities: collectStringList(manifest.capabilities ?? manifest.scopes),
		targets: collectStringList(manifest.targets ?? manifest["applies-to"]),
	};
};

const discoverManualExtensions = async (managedInstallDirs = new Set()) => {
	try {
		const dirents = await fs.readdir(extensionsDir, { withFileTypes: true });
		const manuals = [];
		for (const dirent of dirents) {
			if (!dirent.isDirectory()) continue;
			const dirName = dirent.name;
			if (managedInstallDirs.has(dirName)) continue;
			const manifestPath = join(extensionsDir, dirName, "ext.json");
			const manifestFile = Bun.file(manifestPath);
			if (!(await manifestFile.exists())) continue;
			let manifestText;
			let parsed;
			try {
				manifestText = await manifestFile.text();
				parsed = JSON.parse(manifestText);
			} catch {
				continue;
			}
			const descriptor = parseManualManifest(parsed, dirName);
			if (!descriptor) continue;
			const hasher = new Bun.CryptoHasher("sha256");
			hasher.update(manifestText);
			try {
				const stats = await fs.stat(join(extensionsDir, dirName));
				hasher.update(String(stats.mtimeMs || ""));
			} catch {}
			manuals.push({
				...descriptor,
				bundleHash: hasher.digest("hex"),
				fileEndpoint: `/api/extensions/${encodeURIComponent(dirName)}/file`,
				installDir: dirName,
				managed: false,
			});
		}
		return manuals;
	} catch {
		return [];
	}
};

const resolveExtensionTarget = async (
	rawId,
	{ requireEnabled = true } = {},
) => {
	const record = extensionByIdQuery.get(rawId);
	if (record) {
		if (requireEnabled && !record.enabled) {
			return null;
		}
		return {
			type: "managed",
			settingsKey: record.id,
			installDir: getInstallDirName(record),
		};
	}
	const dirName = sanitizeDirSegment(rawId);
	if (!dirName) return null;
	const manifestFile = Bun.file(join(extensionsDir, dirName, "ext.json"));
	if (!(await manifestFile.exists())) return null;
	return {
		type: "manual",
		settingsKey: dirName,
	};
};

const normalizeRelativePath = (value) => {
	if (typeof value !== "string") return null;
	const trimmed = value.replace(/\\/g, "/").replace(/^\.\/+/, "");
	const parts = trimmed
		.split("/")
		.filter((segment) => segment && segment !== ".");
	if (!parts.length) return null;
	if (parts.some((segment) => segment === "..")) return null;
	const normalized = parts.join("/");
	if (!normalized.startsWith("src/") && !normalized.startsWith("assets/")) {
		return null;
	}
	return normalized;
};

const resolveManagedRoot = (record) => {
	const dirName = getInstallDirName(record);
	if (dirName) {
		return join(extensionsDir, dirName);
	}
	return join(legacyExtensionsDir, record.id);
};

const sanitizeDirSegment = (value) => {
	if (typeof value !== "string") return null;
	const trimmed = value.trim();
	if (!safeDirNamePattern.test(trimmed)) return null;
	return trimmed;
};

const enabledExtensionsQuery = db.prepare(
	"SELECT * FROM extensions WHERE enabled = 1 ORDER BY created_at ASC",
);

const extensionByIdQuery = db.prepare("SELECT * FROM extensions WHERE id = ?");

export default new Elysia({ prefix: "/extensions", tags: ["Extensions"] })
	.get("/", async () => {
		const enabledRows = enabledExtensionsQuery.all();
		const managed = enabledRows.map(mapExtensionRecord);
		const managedDirs = new Set(
			managed.map((record) => record.installDir).filter(Boolean),
		);
		const manual = await discoverManualExtensions(managedDirs);
		return { extensions: [...managed, ...manual] };
	})
	.get("/:id/settings", async ({ params, set }) => {
		const descriptor = await resolveExtensionTarget(params.id, {
			requireEnabled: false,
		});
		if (!descriptor) {
			set.status = 404;
			return { error: "Extension not found" };
		}
		const row = extensionSettingsSelect.get(descriptor.settingsKey);
		let settings = {};
		if (row?.settings) {
			try {
				settings = JSON.parse(row.settings) || {};
			} catch {
				settings = {};
			}
		}
		return { settings };
	})
	.get("/:id/file", async ({ params, query, set }) => {
		const relativePath = normalizeRelativePath(query.path);
		if (!relativePath) {
			set.status = 400;
			return { error: "Invalid file path" };
		}

		let rootDir;
		let cacheSeconds = 60;
		const managedExtension = extensionByIdQuery.get(params.id);
		if (managedExtension) {
			if (!managedExtension.enabled) {
				set.status = 404;
				return { error: "Extension not found" };
			}
			rootDir = resolveManagedRoot(managedExtension);
		} else {
			const dirName = sanitizeDirSegment(params.id);
			if (!dirName) {
				set.status = 404;
				return { error: "Extension not found" };
			}
			rootDir = join(extensionsDir, dirName);
			const manifestExists = await Bun.file(join(rootDir, "ext.json")).exists();
			if (!manifestExists) {
				set.status = 404;
				return { error: "Extension not found" };
			}
			cacheSeconds = 15;
		}

		const absolutePath = join(rootDir, ...relativePath.split("/"));

		if (!absolutePath.startsWith(rootDir)) {
			set.status = 400;
			return { error: "Invalid file path" };
		}

		if (!(await Bun.file(absolutePath).exists())) {
			set.status = 404;
			return { error: "File not found" };
		}

		set.headers = {
			"Cache-Control": `public, max-age=${cacheSeconds}`,
		};

		return file(absolutePath);
	});
