import { Database } from "bun:sqlite";
import { join } from "path";

export async function initializeDatabase() {
  const dbPath =
    process.env.DATABASE_URL || join(process.cwd(), ".data", "db.sqlite");
  const sqlite = new Database(dbPath);

  try {
    sqlite.query("SELECT 1 FROM users LIMIT 1").get();
    console.log("Database is ready");
  } catch {
    console.log("Database needs initialization, creating tables...");

    sqlite.run(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        bio TEXT,
        profile_pic TEXT,
        banner_pic TEXT,
        location TEXT,
        website TEXT,
        birth_date DATE,
        join_date DATE DEFAULT CURRENT_TIMESTAMP,
        verified BOOLEAN DEFAULT FALSE,
        follower_count INTEGER DEFAULT 0,
        following_count INTEGER DEFAULT 0,
        post_count INTEGER DEFAULT 0,
        is_private BOOLEAN DEFAULT FALSE,
        is_admin BOOLEAN DEFAULT FALSE
      )
    `);

    sqlite.run(`
      CREATE TABLE IF NOT EXISTS posts (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        reply_to TEXT,
        repost_of TEXT,
        like_count INTEGER DEFAULT 0,
        repost_count INTEGER DEFAULT 0,
        reply_count INTEGER DEFAULT 0,
        attachment_type TEXT,
        attachment_url TEXT,
        is_nsfw BOOLEAN DEFAULT FALSE,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (reply_to) REFERENCES posts(id),
        FOREIGN KEY (repost_of) REFERENCES posts(id)
      )
    `);

    sqlite.run(`
      CREATE TABLE IF NOT EXISTS follows (
        id TEXT PRIMARY KEY,
        follower_id TEXT NOT NULL,
        following_id TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (follower_id) REFERENCES users(id),
        FOREIGN KEY (following_id) REFERENCES users(id),
        UNIQUE(follower_id, following_id)
      )
    `);

    sqlite.run(`
      CREATE TABLE IF NOT EXISTS likes (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        post_id TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (post_id) REFERENCES posts(id),
        UNIQUE(user_id, post_id)
      )
    `);

    sqlite.run(`
      CREATE TABLE IF NOT EXISTS bookmarks (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        post_id TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (post_id) REFERENCES posts(id),
        UNIQUE(user_id, post_id)
      )
    `);

    sqlite.run(`
      CREATE TABLE IF NOT EXISTS direct_messages (
        id TEXT PRIMARY KEY,
        sender_id TEXT NOT NULL,
        recipient_id TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        read BOOLEAN DEFAULT FALSE,
        attachment_type TEXT,
        attachment_url TEXT,
        FOREIGN KEY (sender_id) REFERENCES users(id),
        FOREIGN KEY (recipient_id) REFERENCES users(id)
      )
    `);

    sqlite.run(`
      CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        type TEXT NOT NULL,
        from_user_id TEXT,
        post_id TEXT,
        message TEXT NOT NULL,
        read BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (from_user_id) REFERENCES users(id),
        FOREIGN KEY (post_id) REFERENCES posts(id)
      )
    `);

    sqlite.run(`
      CREATE TABLE IF NOT EXISTS blocks (
        id TEXT PRIMARY KEY,
        blocker_id TEXT NOT NULL,
        blocked_id TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (blocker_id) REFERENCES users(id),
        FOREIGN KEY (blocked_id) REFERENCES users(id),
        UNIQUE(blocker_id, blocked_id)
      )
    `);

    console.log("Database tables created successfully");
  }

  sqlite.close();
}
