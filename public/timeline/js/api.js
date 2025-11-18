import toastQueue from "../../shared/toasts.js";

const shownToasts = new Set();

function hash(str) {
	let h = 2166136261n;
	for (let i = 0; i < str.length; i++) {
		h ^= BigInt(str.charCodeAt(i));
		h *= 16777619n;
	}
	const hex = h.toString(16);

	if (hex.length > 32) return hex.slice(0, 32);
	return hex.padStart(32, "0");
}

export default async (url, options = {}) => {
	const token = localStorage.getItem("authToken");

	if (
		options.body &&
		!(options.body instanceof FormData) &&
		(options.body.startsWith("{") || options.body.startsWith("["))
	) {
		options.headers = {
			...(options.headers || {}),
			"Content-Type": "application/json",
		};
	}

	try {
		const res = await fetch(`/api${url}`, {
			...options,
			headers: {
				...(options.headers || {}),
				Authorization: `Bearer ${token}`,
				"X-Request-Token": hash(token || "public"),
			},
		});

		let parsed = null;
		try {
			parsed = await res.json();
		} catch {
			const text = await res.text();
			parsed = text;
		}

		if (parsed?.restricted) {
			const key = "restricted-notice";
			if (!shownToasts.has(key)) {
				shownToasts.add(key);
				toastQueue.add(
					`<h1>Account restricted</h1><p>Your account has limited privileges - you can browse posts, but interactions such as tweeting, liking, retweeting, DMs, and following are disabled.</p>`,
				);
				setTimeout(() => shownToasts.delete(key), 60 * 1000);
			}
		}

		if (res.ok) return parsed;

		if (parsed && typeof parsed === "object") {
			return parsed;
		}

		return { error: String(parsed) || "Request failed" };
	} catch (error) {
		return { error: error?.message || error || "Network error" };
	}
};
