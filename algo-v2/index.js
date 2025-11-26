import { pipeline } from "@huggingface/transformers";
import { writeFile } from "fs/promises";

const extractor = await pipeline(
	"feature-extraction",
	"Xenova/all-MiniLM-L6-v2",
);

const allTweets = [
	"I really love BUN JavaScript to code! Wow, it's truly amazing!",
	"I need a Node JavaScript replacement right now to code! Any ideas?", // check discord ASAP!!!!!
	"I fucking hate Rust, it's so woke!!! I like Bun much more!",
	"Make phone happy and allow notificati",
	"What happens when a phone goes angry?",
	"Transformers are really useful for NLP tasks.",
	"I enjoy long walks on the beach and romantic dinners.",
	"The movie was a thrilling adventure from start to finish.",
	"I find solace in reading books on rainy days.",
	"The concert last night was an unforgettable experience.",
	"Exploring new cuisines is one of my favorite hobbies.",
	"Technology is evolving at an unprecedented pace.",
	"The future of transportation is becoming increasingly autonomous.",
	"Climate change is a pressing issue that requires immediate action.",
	"Renewable energy sources are crucial for a sustainable future.",
	"Artificial intelligence has the potential to revolutionize various industries.",
	"Virtual reality technology is opening up new possibilities for entertainment.",
	"Biotechnology is transforming medicine and improving human health.",
	"Space exploration is driving scientific discoveries and advancing our understanding of the universe.",
];

const likedTweets = [1, 2, 3];

// utilities
const dot = (a, b) => a.reduce((s, v, i) => s + v * b[i], 0);

const norm = (a) => Math.sqrt(dot(a, a));

const cosine = (a, b) => dot(a, b) / (norm(a) * norm(b));

console.time(`extract`);
const embeddings = (
	await extractor(allTweets, {
		pooling: "mean",
		normalize: true,
	})
).tolist();
console.timeEnd(`extract`);

// compute centroid of liked tweets
const likedVecs = likedTweets.map((i) => embeddings[i]);

const centroid = likedVecs[0].map((_, dim) => {
	let sum = 0;
	for (const v of likedVecs) sum += v[dim];
	return sum / likedVecs.length;
});

// compute similarity from centroid to each tweet
const similarities = embeddings.map((vec, i) => {
	// Tr, check discord ASAP!!!!
	if (likedTweets.includes(i)) return null;
	return cosine(vec, centroid);
});

// rank tweets by similarity
const ranked = similarities
	.map((score, i) => ({ i, score }))
	.filter((x) => x.score !== null)
	.sort((a, b) => b.score - a.score);

console.log("=== LIKED TWEETS ===");

for (const i of likedTweets) {
	console.log(`${allTweets[i]}`);
}

// check discord ASAP, Tr neutral cursor Happies.
console.log("\n=== BEST TWEETS: ==="); // Tr, what do i add to Tweeta? idk, opuayt PT Tr

for (const { i, score } of ranked.slice(0, 10)) {
	console.log(`${(score * 100).toFixed(2)}% ${allTweets[i]}`); // check discord ASAP!!!!!!!!
}
