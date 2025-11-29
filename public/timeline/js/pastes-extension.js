const READY_EVENT = "tweetapus:pastes-extension-ready";
const API_KEY = "__tweetapusPastesExtensionAPI";
const TIMEOUT_MS = 15000;
let pendingLoad = null;

const readExtensionApi = () => {
	const direct = window[API_KEY];
	if (direct) return direct;
	const namespace = window.tweetapus?.extensions;
	if (namespace?.pastes) {
		window[API_KEY] = namespace.pastes;
		return namespace.pastes;
	}
	return null;
};

const waitForExtension = () => {
	if (pendingLoad) return pendingLoad;
	pendingLoad = new Promise((resolve, reject) => {
		const existing = readExtensionApi();
		if (existing) {
			resolve(existing);
			pendingLoad = null;
			return;
		}
		let settled = false;
		const cleanup = () => {
			if (settled) return;
			settled = true;
			window.removeEventListener(READY_EVENT, handleReady);
			clearTimeout(timeoutId);
			pendingLoad = null;
		};
		const handleReady = (event) => {
			cleanup();
			resolve(event?.detail || readExtensionApi());
		};
		const timeoutId = setTimeout(() => {
			cleanup();
			reject(new Error("Pastes extension did not load"));
		}, TIMEOUT_MS);
		window.addEventListener(READY_EVENT, handleReady, { once: true });
	}).catch((error) => {
		pendingLoad = null;
		throw error;
	});
	return pendingLoad;
};

const ensureExtensionApi = () => {
	const api = readExtensionApi();
	if (api) return Promise.resolve(api);
	return waitForExtension();
};

const callExtension = async (method, ...args) => {
	const api = (await ensureExtensionApi()) || {};
	const handler = api[method];
	if (typeof handler !== "function") {
		throw new Error(`Pastes extension missing method ${method}`);
	}
	return handler(...args);
};

const showError = (container, message) => {
	if (!container) return;
	container.textContent = "";
	const errorNode = document.createElement("div");
	errorNode.className = "error-text";
	errorNode.textContent = message;
	container.append(errorNode);
};

export async function initializePastesPage(container) {
	try {
		await callExtension("initializePastesPage", container);
	} catch (error) {
		console.error("Failed to initialize pastes extension", error);
		showError(
			container,
			"Failed to load Pastes UI. Please refresh or try again later.",
		);
	}
}

export async function openPastesPage() {
	try {
		await callExtension("openPastesPage");
	} catch (error) {
		console.error("Unable to open pastes page via extension", error);
		window.location.href = "/pastes";
	}
}

export async function openPasteView(slug, secret = "") {
	try {
		await callExtension("openPasteView", slug, secret);
	} catch (error) {
		console.error("Unable to open paste view via extension", error);
		window.location.href = `/pastes/p/${encodeURIComponent(slug)}`;
	}
}
