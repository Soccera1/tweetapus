#!/usr/bin/env bun

import db from "../src/db.js";
import { calculateSpamScore, getSpamScoreBreakdown } from "../src/helpers/spam-detection.js";

// Get the current user (assuming first user or you can pass user ID)
const args = process.argv.slice(2);
const userId = args[0];

if (!userId) {
	console.error("Usage: bun scripts/check-spam.js <user_id>");
	console.log("\nAvailable users:");
	const users = db.prepare("SELECT id, username, spam_score FROM users ORDER BY created_at DESC LIMIT 10").all();
	users.forEach(u => {
		console.log(`  ${u.id.padEnd(20)} @${u.username.padEnd(20)} Spam: ${((u.spam_score || 0) * 100).toFixed(1)}%`);
	});
	process.exit(1);
}

console.log("\n" + "=".repeat(70));
console.log("  SPAM SCORE RECALCULATION");
console.log("=".repeat(70));

// Get current spam score
const userBefore = db.prepare("SELECT username, spam_score FROM users WHERE id = ?").get(userId);
console.log(`\n📊 User: @${userBefore.username}`);
console.log(`📈 Current spam score: ${((userBefore.spam_score || 0) * 100).toFixed(1)}%\n`);

// Recalculate
console.log("🔄 Recalculating spam score with updated algorithm...\n");
const newScore = calculateSpamScore(userId);

// Get updated score
const userAfter = db.prepare("SELECT spam_score FROM users WHERE id = ?").get(userId);
console.log(`\n✅ New spam score: ${((userAfter.spam_score || 0) * 100).toFixed(1)}%`);

const diff = (userAfter.spam_score - userBefore.spam_score) * 100;
if (diff > 0) {
	console.log(`   ⬆️  Increased by ${diff.toFixed(1)}%`);
} else if (diff < 0) {
	console.log(`   ⬇️  Decreased by ${Math.abs(diff).toFixed(1)}%`);
} else {
	console.log(`   ➡️  No change`);
}

console.log("\n" + "=".repeat(70) + "\n");
