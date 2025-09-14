#!/usr/bin/env bun

/**
 * User Suspension Script
 *
 * This script permanently suspends a user account by:
 * 1. Collecting all user-related data for cleanup
 * 2. Removing uploaded files (avatars, banners, attachments)
 * 3. Deleting all user data from the database
 * 4. Providing a comprehensive report of what was deleted
 *
 * Usage: bun scripts/suspend-user.js <username>
 * Example: bun scripts/suspend-user.js baduser123
 */

import { Database } from "bun:sqlite";
import { existsSync, rmSync } from "fs";
import { join } from "path";

const db = new Database("./.data/db.sqlite");

// Prepared statements for data collection
const getUserByUsername = db.query("SELECT * FROM users WHERE username = ?");
const getUserPosts = db.query("SELECT * FROM posts WHERE user_id = ?");
const getUserAttachments = db.query(`
  SELECT a.* FROM attachments a 
  JOIN posts p ON a.post_id = p.id 
  WHERE p.user_id = ?
`);
const getUserPasskeys = db.query(
	"SELECT * FROM passkeys WHERE internal_user_id = ?",
);
const getUserFollows = db.query(
	"SELECT * FROM follows WHERE follower_id = ? OR following_id = ?",
);
const getUserLikes = db.query("SELECT * FROM likes WHERE user_id = ?");
const getUserRetweets = db.query("SELECT * FROM retweets WHERE user_id = ?");
const getUserNotifications = db.query(
	"SELECT * FROM notifications WHERE user_id = ?",
);
const getUserPollVotes = db.query("SELECT * FROM poll_votes WHERE user_id = ?");

// Get polls created by user's posts
const getUserPolls = db.query(`
  SELECT po.* FROM polls po 
  JOIN posts p ON po.post_id = p.id 
  WHERE p.user_id = ?
`);

// Delete statements - order matters due to foreign key constraints
const deleteUser = db.query("DELETE FROM users WHERE id = ?");

class UserSuspensionReport {
	constructor(username) {
		this.username = username;
		this.timestamp = new Date().toISOString();
		this.deletedData = {
			posts: 0,
			likes: 0,
			retweets: 0,
			follows: 0,
			passkeys: 0,
			notifications: 0,
			polls: 0,
			pollVotes: 0,
			attachments: 0,
			files: [],
		};
		this.errors = [];
	}

	addError(error) {
		this.errors.push(error);
		console.error(`❌ Error: ${error}`);
	}

	print() {
		console.log("\n" + "=".repeat(60));
		console.log(`USER SUSPENSION REPORT`);
		console.log("=".repeat(60));
		console.log(`Username: ${this.username}`);
		console.log(`Timestamp: ${this.timestamp}`);
		console.log("=".repeat(60));

		console.log("\n📊 DELETED DATA:");
		console.log(`   Posts: ${this.deletedData.posts}`);
		console.log(`   Likes: ${this.deletedData.likes}`);
		console.log(`   Retweets: ${this.deletedData.retweets}`);
		console.log(`   Follows: ${this.deletedData.follows}`);
		console.log(`   Passkeys: ${this.deletedData.passkeys}`);
		console.log(`   Notifications: ${this.deletedData.notifications}`);
		console.log(`   Polls: ${this.deletedData.polls}`);
		console.log(`   Poll Votes: ${this.deletedData.pollVotes}`);
		console.log(`   Attachments: ${this.deletedData.attachments}`);

		if (this.deletedData.files.length > 0) {
			console.log("\n🗑️  DELETED FILES:");
			this.deletedData.files.forEach((file) => {
				console.log(`   ${file}`);
			});
		}

		if (this.errors.length > 0) {
			console.log("\n⚠️  ERRORS:");
			this.errors.forEach((error) => {
				console.log(`   ${error}`);
			});
		}

		console.log("\n" + "=".repeat(60));
		console.log(`✅ User @${this.username} has been permanently suspended`);
		console.log("=".repeat(60) + "\n");
	}
}

function extractFileHashFromUrl(url) {
	if (!url) return null;
	// Extract filename from URLs like "/api/uploads/abc123.webp" or "/api/avatars/abc123.webp"
	const match = url.match(/\/(?:uploads|avatars)\/([a-f0-9]{64}\.\w+)$/);
	return match ? match[1] : null;
}

function deleteUploadedFile(filename, report) {
	if (!filename) return;

	const uploadsPath = join(process.cwd(), ".data", "uploads", filename);

	try {
		if (existsSync(uploadsPath)) {
			rmSync(uploadsPath);
			report.deletedData.files.push(uploadsPath);
			console.log(`🗑️  Deleted file: ${filename}`);
		}
	} catch (error) {
		report.addError(`Failed to delete file ${filename}: ${error.message}`);
	}
}

async function suspendUser(username) {
	if (!username) {
		console.error("❌ Error: Username is required");
		console.log("Usage: bun scripts/suspend-user.js <username>");
		process.exit(1);
	}

	const report = new UserSuspensionReport(username);

	console.log(`🔍 Looking up user: @${username}`);

	// Get user data
	const user = getUserByUsername.get(username);
	if (!user) {
		console.error(`❌ Error: User @${username} not found`);
		process.exit(1);
	}

	console.log(`👤 Found user: ${user.name || user.username} (ID: ${user.id})`);
	console.log(`📅 Account created: ${user.created_at}`);

	// Ask for confirmation
	console.log(
		`\n⚠️  WARNING: This will permanently delete all data for @${username}`,
	);
	console.log("   - All posts, likes, retweets, and follows");
	console.log("   - All passkeys and authentication");
	console.log("   - All notifications and poll votes");
	console.log("   - All uploaded files (avatar, banner, attachments)");
	console.log("   - The user account itself");

	const confirmation = prompt("\nType 'DELETE' to confirm suspension: ");
	if (confirmation !== "DELETE") {
		console.log("❌ Suspension cancelled");
		process.exit(0);
	}

	console.log("\n🚀 Starting user suspension process...");

	try {
		// Start transaction
		db.exec("BEGIN TRANSACTION");

		// Collect data before deletion
		const posts = getUserPosts.all(user.id);
		const attachments = getUserAttachments.all(user.id);
		const passkeys = getUserPasskeys.all(user.id);
		const follows = getUserFollows.all(user.id, user.id);
		const likes = getUserLikes.all(user.id);
		const retweets = getUserRetweets.all(user.id);
		const notifications = getUserNotifications.all(user.id);
		const polls = getUserPolls.all(user.id);
		const pollVotes = getUserPollVotes.all(user.id);

		report.deletedData.posts = posts.length;
		report.deletedData.attachments = attachments.length;
		report.deletedData.passkeys = passkeys.length;
		report.deletedData.follows = follows.length;
		report.deletedData.likes = likes.length;
		report.deletedData.retweets = retweets.length;
		report.deletedData.notifications = notifications.length;
		report.deletedData.polls = polls.length;
		report.deletedData.pollVotes = pollVotes.length;

		console.log(
			`📊 Data to delete: ${posts.length} posts, ${attachments.length} attachments, ${passkeys.length} passkeys, ${follows.length} follows`,
		);

		// Delete uploaded files
		console.log("\n🗑️  Deleting uploaded files...");

		// Delete user's avatar and banner
		if (user.avatar) {
			const avatarFile = extractFileHashFromUrl(user.avatar);
			deleteUploadedFile(avatarFile, report);
		}

		if (user.banner) {
			const bannerFile = extractFileHashFromUrl(user.banner);
			deleteUploadedFile(bannerFile, report);
		}

		// Delete attachment files
		attachments.forEach((attachment) => {
			const attachmentFile = extractFileHashFromUrl(attachment.file_url);
			deleteUploadedFile(attachmentFile, report);
		});

		// Delete user from database (CASCADE will handle related records)
		console.log("\n🗄️  Deleting user from database...");
		const result = deleteUser.run(user.id);

		if (result.changes === 0) {
			throw new Error("User deletion failed - no changes made");
		}

		// Commit transaction
		db.exec("COMMIT");

		console.log("✅ Database cleanup completed");
	} catch (error) {
		// Rollback on error
		try {
			db.exec("ROLLBACK");
		} catch (rollbackError) {
			report.addError(`Rollback failed: ${rollbackError.message}`);
		}

		report.addError(`Database operation failed: ${error.message}`);
		console.error(`❌ Suspension failed: ${error.message}`);
		process.exit(1);
	}

	// Print final report
	report.print();
}

// Main execution
const username = process.argv[2];

if (!username) {
	console.log("🚫 User Suspension Script");
	console.log("Usage: bun scripts/suspend-user.js <username>");
	console.log("Example: bun scripts/suspend-user.js baduser123");
	process.exit(1);
}

// Run suspension
suspendUser(username).catch((error) => {
	console.error("❌ Fatal error:", error);
	process.exit(1);
});
