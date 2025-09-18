# Tweetapus v2

A modern social media platform built with cutting-edge technologies.

## Tech Stack

- **Frontend**: [Remix](https://remix.run/) + [React](https://react.dev/)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/) + [Tailwind CSS](https://tailwindcss.com/)
- **Backend**: [Elysia](https://elysiajs.com/) (Fast Bun web framework)
- **Database**: SQLite with [Drizzle ORM](https://orm.drizzle.team/)
- **Runtime**: [Bun](https://bun.sh/) (Fast JavaScript runtime)
- **Authentication**: JWT + WebAuthn (Passkeys)
- **Real-time**: WebSockets
- **Styling**: Tailwind CSS with CSS variables

## Project Structure

```
v2/
├── apps/
│   ├── api/           # Elysia backend server
│   └── web/           # Remix frontend application
├── packages/
│   ├── database/      # Database schema & queries (Drizzle ORM)
│   ├── shared/        # Shared types, utilities, and validation
│   └── ui/            # shadcn/ui components library
└── package.json       # Workspace configuration
```

## Features

### ✅ Completed

- [x] Modern monorepo structure with Bun workspaces
- [x] Database layer with Drizzle ORM and type-safe queries
- [x] JWT-based authentication system with middleware
- [x] shadcn/ui component library setup
- [x] Basic Remix application with routing
- [x] Responsive UI with dark/light mode support
- [x] Basic user registration and login pages
- [x] Timeline interface with mock data

### 🔄 In Progress

- [ ] Complete user management (profiles, settings)
- [ ] Post creation and interactions (like, retweet, reply)
- [ ] WebAuthn (Passkey) authentication
- [ ] Real-time features with WebSockets

### ⏳ Planned

- [ ] Follow/unfollow system and social graph
- [ ] Direct messaging system
- [ ] Search functionality
- [ ] Admin dashboard and moderation tools
- [ ] File upload system (images, videos)
- [ ] Notification system
- [ ] AI chat integration (TweetaAI)
- [ ] Mobile responsiveness and PWA features

## Installation

### Prerequisites

- [Bun](https://bun.sh/) (latest version)
- Node.js 18+ (for compatibility)

### Setup

1. **Clone and install dependencies:**

   ```bash
   cd v2
   bun install
   ```

2. **Setup environment variables:**

   ```bash
   # Create .env file in v2/ directory
   cp .env.example .env
   ```

   Required environment variables:

   ```env
   JWT_SECRET=your-super-secret-jwt-key
   AUTH_RPID=localhost
   AUTH_RPNAME=Tweetapus
   AUTH_ORIGIN=http://localhost:3001
   ```

3. **Setup database:**

   ```bash
   # Generate migration files
   bun run db:generate

   # Run migrations
   bun run db:migrate
   ```

4. **Start development servers:**

   **Option 1: Start all services**

   ```bash
   bun run dev
   ```

   **Option 2: Start individually**

   ```bash
   # Terminal 1 - API server (port 3000)
   cd apps/api
   bun run dev

   # Terminal 2 - Web app (port 3001)
   cd apps/web
   bun run dev
   ```

5. **Access the application:**
   - Frontend: http://localhost:3001
   - API: http://localhost:3000
   - Database Studio: `bun run db:studio`

## Development

### Package Scripts

```bash
# Root workspace commands
bun run dev           # Start all apps in development mode
bun run build         # Build all packages and apps
bun run type-check    # Run TypeScript checks across workspace
bun run lint          # Lint all packages

# Database commands
bun run db:generate   # Generate new migration files
bun run db:migrate    # Run pending migrations
bun run db:studio     # Open Drizzle Studio (database GUI)

# Individual app commands
cd apps/api && bun run dev      # Start API server only
cd apps/web && bun run dev      # Start web app only
```

### Adding New Features

1. **Database changes:**

   ```bash
   # 1. Modify schema in packages/database/src/schema.ts
   # 2. Generate migration
   bun run db:generate
   # 3. Run migration
   bun run db:migrate
   ```

2. **API endpoints:**

   - Add routes in `apps/api/src/routes/`
   - Use shared types from `@tweetapus/shared`
   - Use database queries from `@tweetapus/database`

3. **UI components:**

   - Add to `packages/ui/src/components/`
   - Export from `packages/ui/src/index.ts`
   - Follow shadcn/ui patterns

4. **Frontend pages:**
   - Add routes in `apps/web/app/routes/`
   - Use components from `@tweetapus/ui`
   - Follow Remix conventions

### Code Organization

- **`@tweetapus/database`**: Database schema, migrations, and queries
- **`@tweetapus/shared`**: Types, validation schemas, and utilities
- **`@tweetapus/ui`**: Reusable UI components
- **API**: RESTful endpoints with WebSocket support
- **Web**: Server-side rendered React application

## Architecture Decisions

### Why This Stack?

1. **Bun**: Fastest JavaScript runtime with excellent developer experience
2. **Remix**: Full-stack React framework with excellent DX and performance
3. **Elysia**: Type-safe, fast web framework built for Bun
4. **Drizzle**: Type-safe ORM with excellent TypeScript support
5. **shadcn/ui**: High-quality, accessible components with full customization
6. **Monorepo**: Better code sharing and development experience

### Key Benefits

- **Type Safety**: End-to-end TypeScript with shared types
- **Developer Experience**: Fast builds, hot reload, excellent tooling
- **Performance**: Bun + Elysia + Remix = blazing fast
- **Scalability**: Clean architecture with separated concerns
- **Modern**: Latest web standards and best practices

## Deployment

### Production Build

```bash
# Build all packages
bun run build

# Start production server
bun run start
```

### Environment Variables (Production)

```env
NODE_ENV=production
JWT_SECRET=your-production-secret
AUTH_RPID=your-domain.com
AUTH_RPNAME=Tweetapus
AUTH_ORIGIN=https://your-domain.com
DATABASE_URL=path/to/production/db.sqlite
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes following the established patterns
4. Run tests and type checks
5. Submit a pull request

## Migration from v1

The original Tweetapus codebase is preserved in the root directory. To migrate:

1. Export data from the old SQLite database
2. Transform data to match the new schema
3. Import into the new database structure
4. Update any custom configurations

## License

[Your License Here]

---

**Note**: This is Tweetapus v2 - a complete rewrite with modern technologies. The original codebase is still available in the parent directory for reference.
