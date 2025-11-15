const rateLimitStore = new Map();

const RATE_LIMITS = {
	default: { max: 30, duration: 10000 },
	auth: { max: 5, duration: 60000 },
	upload: { max: 10, duration: 60000 },
	dm: { max: 20, duration: 10000 },
	post: { max: 15, duration: 60000 },
	sensitive: { max: 3, duration: 60000 },
};

function cleanupExpired() {
	const now = Date.now();
	for (const [key, data] of rateLimitStore.entries()) {
		if (now - data.resetTime > data.duration) {
			rateLimitStore.delete(key);
		}
	}
}

setInterval(cleanupExpired, 30000);

export function checkRateLimit(identifier, limitType = "default") {
	const config = RATE_LIMITS[limitType] || RATE_LIMITS.default;
	const key = `${limitType}:${identifier}`;
	const now = Date.now();

	let data = rateLimitStore.get(key);

	if (!data || now - data.resetTime > config.duration) {
		data = {
			count: 0,
			resetTime: now,
			duration: config.duration,
		};
		rateLimitStore.set(key, data);
	}

	data.count++;

	const remaining = Math.max(0, config.max - data.count);
	const isLimited = data.count > config.max;

	return {
		isLimited,
		remaining,
		resetIn: Math.ceil((data.resetTime + config.duration - now) / 1000),
		limit: config.max,
	};
}

export function getRateLimitMiddleware(limitType = "default") {
	return ({ headers, set }) => {
		const token = headers.authorization?.split(" ")[1];
		const ip =
			headers["cf-connecting-ip"] ||
			headers["x-forwarded-for"]?.split(",")[0] ||
			"0.0.0.0";

		const identifier = token || ip;
		const result = checkRateLimit(identifier, limitType);

		set.headers["X-RateLimit-Limit"] = result.limit.toString();
		set.headers["X-RateLimit-Remaining"] = result.remaining.toString();
		set.headers["X-RateLimit-Reset"] = result.resetIn.toString();

		if (result.isLimited) {
			set.status = 429;
			return {
				error: "Too many requests",
				resetIn: result.resetIn,
			};
		}
	};
}

export default { checkRateLimit, getRateLimitMiddleware, RATE_LIMITS };
