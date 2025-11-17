class LRUCache {
	constructor(maxSize = 100, ttl = 60000) {
		this.maxSize = maxSize;
		this.ttl = ttl;
		this.cache = new Map();
	}

	set(key, value) {
		if (this.cache.has(key)) {
			this.cache.delete(key);
		}

		this.cache.set(key, {
			value,
			expiry: Date.now() + this.ttl,
		});

		if (this.cache.size > this.maxSize) {
			const firstKey = this.cache.keys().next().value;
			this.cache.delete(firstKey);
		}
	}

	get(key) {
		const item = this.cache.get(key);
		if (!item) return null;

		if (Date.now() > item.expiry) {
			this.cache.delete(key);
			return null;
		}

		this.cache.delete(key);
		this.cache.set(key, item);
		return item.value;
	}

	has(key) {
		return this.get(key) !== null;
	}

	clear() {
		this.cache.clear();
	}
}

const userCache = new LRUCache(500, 120000);
const emojiCache = new LRUCache(50, 300000);
const profileCache = new LRUCache(300, 180000);

export { LRUCache, userCache, emojiCache, profileCache };
