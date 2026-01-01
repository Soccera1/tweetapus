# Tweetapus Project Context

## Project Overview
Tweetapus is an independent, fully-featured Twitter/X clone built with **Bun**. It aims to replicate core social media features including tweets, media attachments, communities, direct messages, and notifications, while experimenting with features like "vibe-coding" and transparency reports.

**Status:** Work In Progress (WIP). Known issues include potential XSS vulnerabilities and scaling limitations.

## Tech Stack
*   **Runtime:** [Bun](https://bun.sh/)
*   **Backend Framework:** [ElysiaJS](https://elysiajs.com/)
*   **Database:** SQLite (via `bun:sqlite`)
*   **Frontend:** Vanilla JavaScript, HTML, CSS (No frontend build step like Webpack/Vite)
*   **Algorithm:** Custom C-based ranking algorithm accessed via Bun FFI
*   **Linting/Formatting:** [Biome](https://biomejs.dev/)

## Project Structure
*   `src/` - Backend source code.
    *   `index.js` - Main entry point. Sets up the Elysia server and middlewares.
    *   `db.js` - Database connection and schema definition.
    *   `api/` - API route handlers (e.g., `tweets.js`, `auth.js`, `notifications.js`).
    *   `algo/` - Ranking algorithm implementation (C source and JS wrapper).
    *   `helpers/` - Utility functions (compression, embeds, rate limiting).
*   `public/` - Static frontend assets.
    *   `app/` - Main application interface (logged-in users).
    *   `landing/` - Landing page (logged-out users).
    *   `admin/` - Admin panel.
    *   `shared/` - Shared JS/CSS resources.
*   `.data/` - (Created at runtime) Stores the SQLite database and uploaded files.

## Setup & Running
1.  **Install Dependencies:**
    ```bash
    bun install
    ```
2.  **Compile Algorithm:**
    ```bash
    cd src/algo && make && cd ../..
    ```
3.  **Environment Setup:**
    *   Create `.env` based on `.env.example`.
    *   Ensure directories exist: `.data`, `.data/uploads`, `.data/extensions`.
4.  **Run Development Server:**
    ```bash
    bun dev
    ```
    (Runs `bun run --watch src/index.js`)
5.  **Start Production:**
    ```bash
    bun start
    ```

## Key Development Conventions
*   **IDs:** Always use `Bun.randomUUIDv7()`. Never use autoincrement integers or `crypto.randomUUID()`.
*   **Database:**
    *   Use prepared statements for all queries.
    *   **Do not** run migrations in `src/db.js`. Use the SQLite3 CLI for schema changes, then update `src/db.js` to match the new schema for fresh installs.
    *   User table is `users`, not `profiles`. User ID is `id`, not `user_id`.
*   **Frontend:**
    *   Use `public/app/js/api.js` for all API calls (handles auth headers & rate limits).
    *   No inline CSS/JS. Use nested CSS files.
    *   Sanitize all inputs to prevent XSS.
    *   Prefer `document.createElement` over innerHTML where possible.
*   **API:**
    *   Fetch tweets and authors separately (no heavy joins).
    *   Uploads are stored as SHA256 hashes in `.data/uploads` (WebP only).
*   **Styling:**
    *   Use CSS variables (defined in `public/shared/variables.css`).
    *   Note: `--spacing` variables do not exist.

## Critical Files
*   `src/index.js`: Server entry point.
*   `src/db.js`: Database schema and connection.
*   `src/api.js`: Main API router.
*   `public/app/js/api.js`: Frontend API wrapper.
*   `biome.json`: Linter configuration.
