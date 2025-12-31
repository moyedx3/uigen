# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
npm run setup      # Initial setup: install deps, generate Prisma client, run migrations
npm run dev        # Start dev server with Turbopack (http://localhost:3000)
npm run build      # Production build
npm run lint       # Run ESLint
npm run test       # Run Vitest tests
npm run db:reset   # Reset database (destroys all data)
```

To run a single test file: `npx vitest run path/to/test.test.ts`

## Architecture Overview

UIGen is an AI-powered React component generator with live preview. Users describe components in a chat interface, and Claude generates code that renders in a sandboxed iframe.

### Three-Panel Layout
The main UI (`src/app/main-content.tsx`) uses resizable panels:
- **Left (35%):** Chat interface for AI interaction
- **Right (65%):** Toggles between live preview and code editor with file tree

### Virtual File System
`src/lib/file-system.ts` implements an in-memory file tree (VirtualFileSystem class). Files exist only in browser memory during a session and are serialized to the database as JSON when saved. Key operations: `createFile`, `updateFile`, `deleteFile`, `rename`, `serialize`/`deserializeFromNodes`.

### State Management
Two React Contexts manage app state:
- **FileSystemContext** (`src/lib/contexts/file-system-context.tsx`): Virtual FS state, selected file, handles AI tool calls
- **ChatContext** (`src/lib/contexts/chat-context.tsx`): Wraps Vercel AI SDK's `useChat`, manages message history

### AI Integration
- Chat endpoint: `src/app/api/chat/route.ts`
- Uses Vercel AI SDK with Anthropic Claude (`claude-haiku-4-5`)
- AI modifies files via tools: `str_replace_editor` (create/edit) and `file_manager` (rename/delete)
- Tool definitions: `src/lib/tools/`
- Falls back to MockLanguageModel when no API key is set

### Live Preview System
`src/components/preview/PreviewFrame.tsx` transforms and runs generated code:
1. Monitors file system changes via `refreshTrigger`
2. Transforms JSX using Babel (`src/lib/transform/jsx-transformer.ts`)
3. Creates blob URLs for transformed files
4. Generates import map (React/React-DOM from esm.sh CDN, local files via blob URLs)
5. Renders in sandboxed iframe via `srcdoc`

### Database
SQLite via Prisma. See `prisma/schema.prisma` for complete data structure.
- **User:** email, hashed password, projects
- **Project:** name, userId (optional for anonymous), messages (JSON), data (serialized file system)

### Authentication
JWT-based with HTTP-only cookies:
- `src/lib/auth.ts`: Session creation/verification (jose library)
- `src/actions/index.ts`: Server actions for signUp, signIn, getUser
- `src/middleware.ts`: Protects API routes

## Key Patterns

- Path alias: `@/*` maps to `./src/*`
- Server actions in `src/actions/` for auth and project CRUD
- UI components use Radix primitives (`src/components/ui/`)
- Styling: Tailwind CSS v4
- Only add comments when necessary (code should be self-explanatory)

## CSS & Layout Guidelines

### Working with Radix/Third-Party Components

When styling height and vertical centering in components that wrap Radix primitives:

1. **Inspect internal DOM structure first** - Radix components create internal wrapper divs (e.g., ScrollArea uses `display: table` internally). Check DevTools or library source before applying CSS fixes.

2. **Avoid `min-h-full` in scroll containers** - `min-height: 100%` requires explicit parent heights. It fails silently when ancestors use `display: table` or auto-height.

3. **Prefer flexbox with `flex-1`** - More reliable than percentage heights for filling available space:
   ```jsx
   // ❌ Unreliable in complex component hierarchies
   <div className="min-h-full">

   // ✅ Works reliably with flex parents
   <div className="flex-1">
   ```

4. **Override library styles at the component level** - When Radix internals conflict with your layout, override in `src/components/ui/` rather than at usage sites:
   ```jsx
   // In scroll-area.tsx - override Radix's display:table
   className="[&>div]:!flex [&>div]:flex-col [&>div]:min-h-full"
   ```

5. **Use `!important` via Tailwind's `!` prefix** when overriding library inline styles (e.g., `!flex` to override `display: table`).
