import { Database } from "bun:sqlite";

const db = new Database("./.data/db.sqlite");

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username VARCHAR,
  created_at TIMESTAMP DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS passkeys (
  cred_id TEXT PRIMARY KEY,
  cred_public_key BLOB,
  internal_user_id TEXT,
  webauthn_user_id TEXT UNIQUE,
  counter INTEGER,
  backup_eligible BOOLEAN,
  backup_status BOOLEAN,
  transports TEXT,
  name TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT (datetime('now')),
  last_used TIMESTAMP,
  FOREIGN KEY (internal_user_id) REFERENCES users(id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_passkeys_internal_user_id_webauthn_user_id
  ON passkeys (internal_user_id, webauthn_user_id);

CREATE INDEX IF NOT EXISTS idx_passkeys_internal_user_id_cred_id
  ON passkeys (internal_user_id, cred_id);

CREATE INDEX IF NOT EXISTS idx_passkeys_webauthn_user_id_cred_id
  ON passkeys (webauthn_user_id, cred_id);

CREATE INDEX IF NOT EXISTS idx_passkeys_cred_id
  ON passkeys (cred_id);
`);

const tableInfo = db.query("PRAGMA table_info(posts)").all();
const hasIntegerId = tableInfo.some(col => col.name === 'id' && col.type === 'INTEGER');

if (!hasIntegerId) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS posts_new (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      content TEXT NOT NULL,
      reply_to INTEGER,
      created_at TIMESTAMP DEFAULT (datetime('now')),
      like_count INTEGER DEFAULT 0,
      reply_count INTEGER DEFAULT 0,
      retweet_count INTEGER DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (reply_to) REFERENCES posts_new(id)
    );
  `);
  
  try {
    db.exec(`
      INSERT INTO posts_new (user_id, content, reply_to, created_at, like_count, reply_count)
      SELECT user_id, content, 
        CASE WHEN reply_to IS NOT NULL THEN 1 ELSE NULL END,
        created_at, like_count, reply_count 
      FROM posts;
    `);
    
    db.exec(`DROP TABLE posts;`);
    db.exec(`ALTER TABLE posts_new RENAME TO posts;`);
  } catch {
    db.exec(`ALTER TABLE posts_new RENAME TO posts;`);
  }
} else {
  try {
    db.exec(`ALTER TABLE posts ADD COLUMN retweet_count INTEGER DEFAULT 0`);
  } catch {}
  
  db.exec(`
    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      content TEXT NOT NULL,
      reply_to INTEGER,
      created_at TIMESTAMP DEFAULT (datetime('now')),
      like_count INTEGER DEFAULT 0,
      reply_count INTEGER DEFAULT 0,
      retweet_count INTEGER DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (reply_to) REFERENCES posts(id)
    );
  `);
}

db.exec(`
CREATE TABLE IF NOT EXISTS user_profiles (
  user_id TEXT PRIMARY KEY,
  display_name TEXT,
  bio TEXT,
  location TEXT,
  website TEXT,
  follower_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  post_count INTEGER DEFAULT 0,
  updated_at TIMESTAMP DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS follows (
  id TEXT PRIMARY KEY,
  follower_id TEXT NOT NULL,
  following_id TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT (datetime('now')),
  FOREIGN KEY (follower_id) REFERENCES users(id),
  FOREIGN KEY (following_id) REFERENCES users(id),
  UNIQUE(follower_id, following_id)
);

CREATE TABLE IF NOT EXISTS likes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  post_id INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (post_id) REFERENCES posts(id),
  UNIQUE(user_id, post_id)
);

CREATE TABLE IF NOT EXISTS retweets (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  post_id INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (post_id) REFERENCES posts(id),
  UNIQUE(user_id, post_id)
);

CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_reply_to ON posts(reply_to);
CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following_id ON follows(following_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id);
CREATE INDEX IF NOT EXISTS idx_likes_post_id ON likes(post_id);
CREATE INDEX IF NOT EXISTS idx_retweets_user_id ON retweets(user_id);
CREATE INDEX IF NOT EXISTS idx_retweets_post_id ON retweets(post_id);
`);

export default db;