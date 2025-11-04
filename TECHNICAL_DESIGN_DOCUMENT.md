# Technical Design Document

## Prompt Shortcut Tools

**Version:** 1.0  
**Date:** 2025-01-10  
**Project:** prompt_shortcut_tools

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Architecture Overview](#architecture-overview)
3. [Technology Stack](#technology-stack)
4. [System Architecture](#system-architecture)
5. [Data Layer](#data-layer)
6. [Business Logic Layer](#business-logic-layer)
7. [API Layer](#api-layer)
8. [Presentation Layer](#presentation-layer)
9. [Data Flow](#data-flow)
10. [Security Considerations](#security-considerations)
11. [Performance Considerations](#performance-considerations)
12. [Deployment Architecture](#deployment-architecture)

---

## Executive Summary

Prompt Shortcut Tools is a Next.js-based web application for managing, organizing, and reusing AI prompts. The application follows a functional programming pattern with a clear separation of concerns across three main layers: Repository (data access), Service (business logic), and API (HTTP endpoints).

### Key Features
- **Prompt Management**: Create, read, update, and delete prompts
- **Tag System**: Organize prompts with color-coded tags
- **Template System**: Create reusable prompt templates with variable substitution
- **Search & Filter**: Advanced filtering by tags, favorites, and text search
- **Favorites**: Quick access to frequently used prompts

---

## Architecture Overview

### Architectural Pattern

The application follows a **layered architecture** with functional programming principles:

```
┌─────────────────────────────────────┐
│     Presentation Layer (React)      │
│  (Client Components, UI Components) │
└──────────────┬──────────────────────┘
               │ HTTP/REST API
┌──────────────▼──────────────────────┐
│      API Layer (Next.js Routes)     │
│   (Request Validation, Error Handle)│
└──────────────┬──────────────────────┘
               │ Service Calls
┌──────────────▼──────────────────────┐
│    Business Logic Layer (Services)   │
│  (Validation, Business Rules, Errors)│
└──────────────┬──────────────────────┘
               │ Repository Calls
┌──────────────▼──────────────────────┐
│   Data Access Layer (Repositories)   │
│    (Prisma Queries, JSON Parsing)   │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│      Database Layer (SQLite)        │
│         (Prisma ORM)                │
└─────────────────────────────────────┘
```

### Design Principles

1. **Separation of Concerns**: Each layer has a single responsibility
2. **Functional Programming**: Services and repositories are plain objects, not class instances
3. **Type Safety**: Full TypeScript coverage with strict typing
4. **Reusability**: Services can be used in API routes, Server Components, and Server Actions
5. **Testability**: Each layer can be tested independently

---

## Technology Stack

### Core Framework
- **Next.js 16.0.0**: React framework with App Router
- **React 19.2.0**: UI library
- **TypeScript 5.x**: Type-safe JavaScript

### Database & ORM
- **Prisma 6.18.0**: Type-safe ORM
- **SQLite**: File-based database (development)

### UI & Styling
- **Tailwind CSS 4.x**: Utility-first CSS framework
- **Lucide React**: Icon library
- **Sonner**: Toast notifications
- **shadcn/ui**: Component library (Button, Card, Input, Badge, Toggle)

### Validation & Forms
- **Zod 4.1.12**: Schema validation
- **React Hook Form**: Form state management (via @hookform/resolvers)

### Development Tools
- **ESLint**: Code linting
- **tsx**: TypeScript execution for scripts

---

## System Architecture

### Directory Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   │   ├── prompts/      # Prompt CRUD endpoints
│   │   └── tags/         # Tag CRUD endpoints
│   ├── prompt/[id]/      # Prompt detail page
│   ├── template/         # Template editor page
│   └── page.tsx          # Home page
├── components/            # React Components
│   ├── ui/               # Base UI components
│   └── *.tsx             # Feature components
├── lib/                  # Core libraries
│   ├── prisma.ts         # Prisma singleton
│   ├── repositories/     # Data access layer
│   └── services/         # Business logic layer
├── types/                # TypeScript type definitions
└── utils/                # Utility functions
```

### Module Organization

1. **Presentation Layer** (`src/app/`, `src/components/`)
   - Client-side React components
   - UI components and layouts
   - Page components

2. **API Layer** (`src/app/api/`)
   - RESTful API endpoints
   - Request validation with Zod
   - Error handling and response formatting

3. **Service Layer** (`src/lib/services/`)
   - Business logic and validation
   - Error handling with custom error classes
   - Template variable extraction

4. **Repository Layer** (`src/lib/repositories/`)
   - Database queries via Prisma
   - JSON serialization/deserialization
   - No business logic

5. **Data Layer** (`prisma/`, `src/lib/prisma.ts`)
   - Database schema definition
   - Prisma client singleton
   - Database migrations

---

## Data Layer

### Database Schema

#### Prompt Model
```prisma
model Prompt {
  id          Int      @id @default(autoincrement())
  title       String
  description String?
  promptText  String
  tags        String   // JSON string array
  usageNotes  String?
  isFavorite  Boolean  @default(false)
  isTemplate  Boolean  @default(false)
  templateVars String? // JSON string array
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

**Design Decisions:**
- `tags` and `templateVars` stored as JSON strings for SQLite compatibility
- Arrays are parsed/stringified in repository layer
- Timestamps managed automatically by Prisma

#### Tag Model
```prisma
model Tag {
  id        Int      @id @default(autoincrement())
  name      String   @unique
  color     String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

**Design Decisions:**
- Tags stored separately for persistence and reuse
- Unique constraint on `name` prevents duplicates
- Color stored as string (hex code)

### Prisma Client Singleton

```typescript
// src/lib/prisma.ts
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: ['query', 'error', 'warn'],
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

**Benefits:**
- Prevents multiple Prisma client instances in development
- Proper connection pooling
- Type-safe database access

---

## Business Logic Layer

### Service Pattern

Services are plain objects with async methods, following functional programming principles:

```typescript
export const promptService = {
  async getPrompt(id: number) { ... },
  async listPrompts(filters?: PromptFilters) { ... },
  async createPrompt(data: CreatePromptInput) { ... },
  // ...
};
```

### Error Handling

Custom error classes for better error handling:

- `PromptNotFoundError`: When prompt doesn't exist
- `TagNotFoundError`: When tag doesn't exist
- `TagAlreadyExistsError`: When creating duplicate tag
- `TagInUseError`: When deleting tag in use by prompts

### Business Rules

#### Prompt Service
1. **Title and promptText are required** (non-empty after trim)
2. **Auto-extract template variables** when `isTemplate` is true
3. **Tags validation**: Ensure tags is always an array
4. **Search validation**: Query must be at least 2 characters

#### Tag Service
1. **Tag name and color are required** (non-empty after trim)
2. **Duplicate prevention**: Check for existing tag before creation
3. **Deletion protection**: Prevent deletion if tag is in use
4. **Name uniqueness**: Enforced at database and service level

---

## API Layer

### RESTful API Design

#### Prompt Endpoints

| Method | Endpoint | Description | Status Codes |
|--------|----------|-------------|--------------|
| GET | `/api/prompts` | List all prompts (with filters) | 200, 500 |
| POST | `/api/prompts` | Create new prompt | 200, 400, 500 |
| PUT | `/api/prompts` | Update prompt (favorite toggle) | 200, 400, 404, 500 |
| DELETE | `/api/prompts?id={id}` | Delete prompt | 200, 400, 404, 500 |
| GET | `/api/prompts/[id]` | Get prompt by ID | 200, 404, 500 |
| PATCH | `/api/prompts/[id]` | Update prompt | 200, 400, 404, 500 |
| DELETE | `/api/prompts/[id]` | Delete prompt | 200, 404, 500 |

#### Tag Endpoints

| Method | Endpoint | Description | Status Codes |
|--------|----------|-------------|--------------|
| GET | `/api/tags` | List all tags | 200, 500 |
| POST | `/api/tags` | Create new tag | 200, 400, 500 |
| GET | `/api/tags/[id]` | Get tag by ID | 200, 404, 500 |
| DELETE | `/api/tags/[id]` | Delete tag | 200, 400, 404, 500 |

### Request Validation

All POST/PUT/PATCH requests use Zod schemas:

```typescript
const createPromptSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  promptText: z.string().min(1, 'Prompt text is required'),
  tags: z.union([z.string(), z.array(z.string())]).optional(),
  // ...
});
```

### Error Response Format

```json
{
  "error": "Error message",
  "details": [...] // Optional, for validation errors
}
```

---

## Presentation Layer

### Component Architecture

#### Page Components
- **Home Page** (`app/page.tsx`): Main dashboard with prompt list, filters, and favorites
- **Prompt Detail** (`app/prompt/[id]/page.tsx`): Individual prompt view with edit/delete
- **Template Editor** (`app/template/page.tsx`): Template creation and editing interface

#### Feature Components
- **PromptCard**: Display prompt in grid/list view
- **FiltersSection**: Tag filtering and search
- **FavoritesSection**: Quick access to favorite prompts
- **AddPromptModal**: Create new prompt
- **EditPromptModal**: Edit existing prompt
- **TemplateEditor**: Template editing with variable substitution
- **AddTagModal**: Create new tag

#### UI Components (shadcn/ui)
- Button, Card, Input, Badge, Toggle

### State Management

Client-side state managed with React hooks:
- `useState` for local component state
- `useEffect` for data fetching
- `useMemo` for computed values (filtered prompts)

### Data Fetching

- **Client-side fetching**: `fetch()` API in `useEffect`
- **No data fetching library**: Direct fetch calls (can be replaced with SWR/React Query if needed)

---

## Data Flow

### Create Prompt Flow

```
1. User fills form in AddPromptModal
   ↓
2. Client sends POST /api/prompts
   ↓
3. API validates request with Zod
   ↓
4. API calls promptService.createPrompt()
   ↓
5. Service validates business rules
   ↓
6. Service calls promptRepository.create()
   ↓
7. Repository converts arrays to JSON strings
   ↓
8. Repository executes Prisma create
   ↓
9. Repository parses JSON strings back to arrays
   ↓
10. Response flows back through layers
   ↓
11. Client updates UI with new prompt
```

### Search & Filter Flow

```
1. User types in search box or selects tags
   ↓
2. Client filters prompts client-side (useMemo)
   ↓
3. For server-side search: GET /api/prompts?query=...
   ↓
4. API calls promptService.listPrompts(filters)
   ↓
5. Service calls promptRepository.findAll(filters)
   ↓
6. Repository builds Prisma where clause
   ↓
7. Repository executes query and parses JSON
   ↓
8. Results returned to client
```

### Template Variable Extraction Flow

```
1. User creates/updates template prompt
   ↓
2. Service detects isTemplate = true
   ↓
3. Service calls extractVariables(promptText)
   ↓
4. Utility function uses regex: /\$\{([\w\d_]+)\}/g
   ↓
5. Extracted variables stored in templateVars
   ↓
6. Template saved with variables
```

---

## Security Considerations

### Current Implementation

1. **Input Validation**: All user inputs validated with Zod schemas
2. **Type Safety**: TypeScript prevents type-related vulnerabilities
3. **SQL Injection**: Prisma ORM prevents SQL injection
4. **XSS Prevention**: React automatically escapes user inputs

### Recommendations

1. **Authentication**: Add user authentication for multi-user scenarios
2. **Authorization**: Implement role-based access control
3. **Rate Limiting**: Add API rate limiting to prevent abuse
4. **CSRF Protection**: Add CSRF tokens for state-changing operations
5. **Content Security Policy**: Configure CSP headers
6. **Input Sanitization**: Additional sanitization for user-generated content

---

## Performance Considerations

### Current Optimizations

1. **Client-side Filtering**: Filter prompts in browser to reduce server load
2. **Memoization**: `useMemo` for expensive computations
3. **Prisma Connection Pooling**: Singleton Prisma client reuses connections
4. **JSON Parsing**: Efficient parsing only when needed

### Recommendations

1. **Pagination**: Add pagination for large prompt lists
2. **Caching**: Implement Redis caching for frequently accessed prompts
3. **Database Indexing**: Add indexes on frequently queried fields (title, tags)
4. **Lazy Loading**: Implement virtual scrolling for large lists
5. **Code Splitting**: Use Next.js dynamic imports for heavy components
6. **Image Optimization**: Use Next.js Image component if images are added

---

## Deployment Architecture

### Development Environment

- **Database**: SQLite file (`prisma/prompts.db`)
- **Server**: Next.js dev server (`npm run dev`)
- **Port**: 3000 (default)

### Production Considerations

1. **Database Migration**: 
   - Consider PostgreSQL for production
   - Use Prisma migrations for schema changes
   
2. **Environment Variables**:
   ```env
   DATABASE_URL="postgresql://..."
   NODE_ENV="production"
   ```

3. **Build Process**:
   ```bash
   npm run build
   npm start
   ```

4. **Deployment Platforms**:
   - Vercel (recommended for Next.js)
   - AWS Amplify
   - Docker containerization

5. **Database Backup**:
   - Regular backups of SQLite database
   - Automated backup scripts for production

---

## Conclusion

The Prompt Shortcut Tools application follows modern web development best practices with a clear separation of concerns, type safety, and maintainable architecture. The functional programming pattern makes the codebase easy to test and extend, while the layered architecture ensures scalability and maintainability.

