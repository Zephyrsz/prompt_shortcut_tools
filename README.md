# Prompt Tools New - Functional Pattern Implementation

This is a refactored version of the prompt-tool-manager project, following the functional pattern recommended for Next.js applications.

## Architecture Overview

This project follows a clean, functional architecture pattern:

```
src/
├── lib/
│   ├── prisma.ts                    # Singleton Prisma client
│   ├── repositories/                 # Data access layer (plain objects)
│   │   ├── promptRepository.ts
│   │   └── tagRepository.ts
│   └── services/                     # Business logic layer (plain objects)
│       ├── promptService.ts
│       └── tagService.ts
├── types/
│   └── index.ts                      # TypeScript type definitions
├── app/
│   ├── api/                          # API routes (use services)
│   └── ...                           # Pages and components
└── components/                       # React components
```

## Key Features

✅ **Functional Pattern Compliance**
- Services and repositories are plain objects (not classes)
- Prisma client is a singleton instance
- Direct service usage in API routes
- Compatible with Server Components and Server Actions
- Tree-shakeable and Edge Runtime compatible

✅ **Separation of Concerns**
- **Repositories**: Pure data access, only Prisma queries
- **Services**: Business logic, validation, error handling
- **API Routes**: Thin controllers that use services

✅ **Type Safety**
- Centralized type definitions in `src/types/index.ts`
- Full TypeScript support throughout

## Setup Instructions

1. **Install Dependencies**
```bash
npm install
```

2. **Setup Database**
```bash
npx prisma generate
npx prisma migrate dev
npx prisma db seed  # Optional: seed with initial data
```

3. **Run Development Server**
```bash
npm run dev
```

4. **Build for Production**
```bash
npm run build
npm start
```

## Copying Project to New Location

When copying this project to a new location, follow these steps to avoid dependency issues:

1. **Copy the project** (excluding `node_modules` if present)
```bash
cp -r project new_location
```

2. **In the new location, remove node_modules if it exists**
```bash
cd new_location
rm -rf node_modules package-lock.json
```

3. **Install dependencies fresh**
```bash
npm install
```

4. **Generate Prisma Client** (if using Prisma)
```bash
npx prisma generate
```

5. **Run the project**
```bash
npm run dev
```

**Why this is necessary**: The `node_modules` folder contains platform-specific binaries and can have broken symlinks or absolute paths when copied. Always reinstall dependencies in the new location to ensure everything works correctly.

## Differences from Original Project

### Architecture Changes

1. **Prisma Singleton**: Uses a single Prisma client instance instead of creating new instances in each API route
2. **Repository Layer**: Introduced repositories for data access, separating it from business logic
3. **Service Layer**: Introduced services for business logic, validation, and error handling
4. **Type Definitions**: Centralized TypeScript types in `src/types/index.ts`

### Code Structure

**Before** (Original):
```typescript
// API route directly using Prisma
const prisma = new PrismaClient();
const prompts = await prisma.prompt.findMany();
```

**After** (Refactored):
```typescript
// API route using service
import { promptService } from '@/lib/services/promptService';
const prompts = await promptService.listPrompts();
```

### Benefits

- **Testability**: Each layer can be tested independently
- **Maintainability**: Changes to business logic don't affect data access
- **Reusability**: Services can be used in Server Components, Server Actions, and API Routes
- **Type Safety**: Better TypeScript inference and type checking
- **Performance**: Singleton Prisma client prevents connection leaks

## API Endpoints

All endpoints remain the same as the original project:

- `GET /api/prompts` - List prompts (with optional filters)
- `POST /api/prompts` - Create a new prompt
- `PUT /api/prompts` - Update prompt (favorite toggle)
- `DELETE /api/prompts?id=...` - Delete a prompt
- `GET /api/prompts/[id]` - Get a single prompt
- `PUT /api/prompts/[id]` - Update prompt
- `PATCH /api/prompts/[id]` - Partial update (e.g., remove tag)
- `DELETE /api/prompts/[id]` - Delete prompt
- `GET /api/tags` - List all tags
- `POST /api/tags` - Create a new tag
- `DELETE /api/tags/[id]` - Delete a tag

## Error Handling

The service layer provides custom error classes:

- `PromptNotFoundError` - When a prompt is not found
- `TagNotFoundError` - When a tag is not found
- `TagAlreadyExistsError` - When trying to create a duplicate tag
- `TagInUseError` - When trying to delete a tag that's in use

These errors are caught in API routes and converted to appropriate HTTP responses.

## Contributing

When adding new features:

1. **Add types** in `src/types/index.ts`
2. **Add repository methods** in appropriate repository file
3. **Add service methods** in appropriate service file
4. **Update API routes** to use the new service methods

Follow the existing patterns - all services and repositories should be plain objects, not classes.

## License

Same as the original project.

