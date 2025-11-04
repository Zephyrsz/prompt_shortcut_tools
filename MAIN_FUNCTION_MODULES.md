# Main Function Modules Document

## Prompt Shortcut Tools

**Version:** 1.0  
**Date:** 2025-01-10  
**Project:** prompt_shortcut_tools

---

## Table of Contents

1. [Overview](#overview)
2. [Module Categories](#module-categories)
3. [Data Access Modules](#data-access-modules)
4. [Business Logic Modules](#business-logic-modules)
5. [API Modules](#api-modules)
6. [UI Components Modules](#ui-components-modules)
7. [Utility Modules](#utility-modules)
8. [Page Modules](#page-modules)
9. [Module Interactions](#module-interactions)
10. [Module Dependencies](#module-dependencies)

---

## Overview

This document describes the main functional modules of the Prompt Shortcut Tools application. Each module is organized by its responsibility and includes detailed descriptions of its functionality, inputs, outputs, and dependencies.

---

## Module Categories

The application is organized into the following module categories:

1. **Data Access Modules** (Repository Layer)
2. **Business Logic Modules** (Service Layer)
3. **API Modules** (HTTP Endpoints)
4. **UI Components Modules** (React Components)
5. **Utility Modules** (Helper Functions)
6. **Page Modules** (Next.js Pages)

---

## Data Access Modules

### 1. Prompt Repository (`src/lib/repositories/promptRepository.ts`)

**Purpose**: Provides data access operations for Prompt entities.

**Key Functions**:

#### `findById(id: number)`
- **Description**: Retrieves a single prompt by ID
- **Input**: Prompt ID (number)
- **Output**: Prompt object with parsed tags and templateVars, or null
- **Side Effects**: None
- **Error Handling**: Returns null if not found
- **Special Logic**: Parses JSON strings to arrays

#### `findAll(filters?: PromptFilters)`
- **Description**: Retrieves all prompts with optional filtering
- **Input**: Optional filters (query, tags, isFavorite, isTemplate)
- **Output**: Array of Prompt objects
- **Side Effects**: None
- **Special Logic**: 
  - Builds Prisma where clause from filters
  - Handles tag filtering via JSON string matching
  - Orders by createdAt descending

#### `create(data: CreatePromptInput)`
- **Description**: Creates a new prompt
- **Input**: CreatePromptInput object
- **Output**: Created Prompt object with parsed arrays
- **Side Effects**: Inserts record into database
- **Special Logic**: 
  - Converts arrays to JSON strings for storage
  - Handles both array and string inputs

#### `update(id: number, data: UpdatePromptInput)`
- **Description**: Updates an existing prompt
- **Input**: Prompt ID and update data
- **Output**: Updated Prompt object
- **Side Effects**: Modifies database record
- **Special Logic**: Only updates provided fields (partial update)

#### `delete(id: number)`
- **Description**: Deletes a prompt
- **Input**: Prompt ID
- **Output**: Deleted Prompt object
- **Side Effects**: Removes record from database

#### `search(query: string)`
- **Description**: Searches prompts by text
- **Input**: Search query string
- **Output**: Array of matching Prompt objects
- **Special Logic**: Searches in title, description, and promptText

**Dependencies**: `prisma`, `@/types`

---

### 2. Tag Repository (`src/lib/repositories/tagRepository.ts`)

**Purpose**: Provides data access operations for Tag entities.

**Key Functions**:

#### `findById(id: number)`
- **Description**: Retrieves a tag by ID
- **Input**: Tag ID
- **Output**: Tag object or null

#### `findByName(name: string)`
- **Description**: Retrieves a tag by name
- **Input**: Tag name
- **Output**: Tag object or null
- **Use Case**: Check for duplicate tags

#### `findAll()`
- **Description**: Retrieves all tags
- **Output**: Array of Tag objects
- **Ordering**: Alphabetical by name

#### `create(data: CreateTagInput)`
- **Description**: Creates a new tag
- **Input**: CreateTagInput (name, color)
- **Output**: Created Tag object
- **Constraints**: Name must be unique (enforced by database)

#### `delete(id: number)`
- **Description**: Deletes a tag
- **Input**: Tag ID
- **Output**: Deleted Tag object

#### `findPromptsUsingTag(tagName: string)`
- **Description**: Finds all prompts using a specific tag
- **Input**: Tag name
- **Output**: Array of Prompt objects
- **Special Logic**: Searches JSON string for tag name
- **Use Case**: Prevent deletion of tags in use

**Dependencies**: `prisma`, `@/types`

---

## Business Logic Modules

### 3. Prompt Service (`src/lib/services/promptService.ts`)

**Purpose**: Contains business logic and validation for prompt operations.

**Key Functions**:

#### `getPrompt(id: number)`
- **Description**: Retrieves a prompt, throws error if not found
- **Input**: Prompt ID
- **Output**: Prompt object
- **Errors**: `PromptNotFoundError` if not found

#### `listPrompts(filters?: PromptFilters)`
- **Description**: Lists prompts with optional filtering
- **Input**: Optional filters
- **Output**: Array of Prompt objects
- **Business Logic**: Delegates to repository

#### `createPrompt(data: CreatePromptInput)`
- **Description**: Creates a new prompt with validation
- **Input**: CreatePromptInput
- **Output**: Created Prompt object
- **Validation**:
  - Title required and non-empty
  - PromptText required and non-empty
  - Tags must be array
- **Special Logic**:
  - Auto-extracts template variables if isTemplate is true
  - Handles string/array conversion for tags

#### `updatePrompt(id: number, data: UpdatePromptInput)`
- **Description**: Updates a prompt with validation
- **Input**: Prompt ID and update data
- **Output**: Updated Prompt object
- **Validation**:
  - Ensures prompt exists
  - Title cannot be empty if provided
  - PromptText cannot be empty if provided
- **Special Logic**: Auto-extracts template variables if becoming a template

#### `deletePrompt(id: number)`
- **Description**: Deletes a prompt
- **Input**: Prompt ID
- **Output**: Deleted Prompt object
- **Validation**: Ensures prompt exists before deletion

#### `toggleFavorite(id: number, isFavorite: boolean)`
- **Description**: Toggles favorite status
- **Input**: Prompt ID and favorite status
- **Output**: Updated Prompt object
- **Use Case**: Quick favorite toggle

#### `removeTag(id: number, tag: string)`
- **Description**: Removes a tag from a prompt
- **Input**: Prompt ID and tag name
- **Output**: Updated Prompt object
- **Business Logic**: Filters out the tag from prompt's tag array

#### `searchPrompts(query: string)`
- **Description**: Searches prompts by query
- **Input**: Search query string
- **Output**: Array of matching Prompt objects
- **Validation**: Query must be at least 2 characters

**Dependencies**: `promptRepository`, `@/types`, `@/utils/templateUtils`

**Custom Errors**: `PromptNotFoundError`

---

### 4. Tag Service (`src/lib/services/tagService.ts`)

**Purpose**: Contains business logic and validation for tag operations.

**Key Functions**:

#### `getTag(id: number)`
- **Description**: Retrieves a tag, throws error if not found
- **Input**: Tag ID
- **Output**: Tag object
- **Errors**: `TagNotFoundError` if not found

#### `listTags()`
- **Description**: Lists all tags
- **Output**: Array of Tag objects

#### `createTag(data: CreateTagInput)`
- **Description**: Creates a new tag with validation
- **Input**: CreateTagInput (name, color)
- **Output**: Created Tag object
- **Validation**:
  - Name required and non-empty
  - Color required and non-empty
  - Name must be unique
- **Business Logic**: Trims name and checks for duplicates

#### `deleteTag(id: number)`
- **Description**: Deletes a tag with protection
- **Input**: Tag ID
- **Output**: Deleted Tag object
- **Validation**: 
  - Ensures tag exists
  - Prevents deletion if tag is in use
- **Errors**: `TagInUseError` if tag is used by prompts

#### `checkTagInUse(name: string)`
- **Description**: Checks if a tag is used by any prompts
- **Input**: Tag name
- **Output**: Boolean

**Dependencies**: `tagRepository`, `@/types`

**Custom Errors**: `TagNotFoundError`, `TagAlreadyExistsError`, `TagInUseError`

---

## API Modules

### 5. Prompts API Route (`src/app/api/prompts/route.ts`)

**Purpose**: HTTP endpoints for prompt CRUD operations.

**Endpoints**:

#### `GET /api/prompts`
- **Description**: List all prompts with optional filters
- **Query Parameters**: 
  - `query`: Search query string
  - `tags`: Comma-separated tag names
  - `isFavorite`: Boolean filter
- **Response**: Array of Prompt objects (200) or error (500)

#### `POST /api/prompts`
- **Description**: Create a new prompt
- **Request Body**: CreatePromptInput (validated with Zod)
- **Response**: Created Prompt object (200) or validation error (400) or server error (500)

#### `PUT /api/prompts`
- **Description**: Update prompt (mainly for favorite toggle)
- **Request Body**: `{ id, isFavorite, ...updateData }`
- **Response**: Updated Prompt object (200) or error (400/404/500)

#### `DELETE /api/prompts?id={id}`
- **Description**: Delete a prompt
- **Query Parameter**: `id` (required)
- **Response**: `{ success: true }` (200) or error (400/404/500)

**Dependencies**: `promptService`, `zod`

---

### 6. Prompt Detail API Route (`src/app/api/prompts/[id]/route.ts`)

**Purpose**: HTTP endpoints for individual prompt operations.

**Endpoints**:

#### `GET /api/prompts/[id]`
- **Description**: Get a single prompt by ID
- **Response**: Prompt object (200) or 404/500

#### `PATCH /api/prompts/[id]`
- **Description**: Update a prompt (supports tag removal)
- **Request Body**: UpdatePromptInput or `{ action: 'removeTag', tag: string }`
- **Response**: Updated Prompt object (200) or error (400/404/500)

#### `DELETE /api/prompts/[id]`
- **Description**: Delete a prompt
- **Response**: `{ success: true }` (200) or error (404/500)

**Dependencies**: `promptService`

---

### 7. Tags API Route (`src/app/api/tags/route.ts`)

**Purpose**: HTTP endpoints for tag operations.

**Endpoints**:

#### `GET /api/tags`
- **Description**: List all tags
- **Response**: Array of Tag objects (200) or error (500)

#### `POST /api/tags`
- **Description**: Create a new tag
- **Request Body**: CreateTagInput (validated with Zod)
- **Response**: Created Tag object (200) or error (400/500)

**Dependencies**: `tagService`, `zod`

---

### 8. Tag Detail API Route (`src/app/api/tags/[id]/route.ts`)

**Purpose**: HTTP endpoints for individual tag operations.

**Endpoints**:

#### `GET /api/tags/[id]`
- **Description**: Get a single tag by ID
- **Response**: Tag object (200) or 404/500

#### `DELETE /api/tags/[id]`
- **Description**: Delete a tag
- **Response**: `{ success: true }` (200) or error (400/404/500)
- **Special Logic**: Prevents deletion if tag is in use

**Dependencies**: `tagService`

---

## UI Components Modules

### 9. Prompt Card (`src/components/PromptCard.tsx`)

**Purpose**: Displays a prompt in a card format.

**Props**:
- `prompt`: Prompt object
- `onCopy`: Copy handler function
- `onToggleFavorite`: Favorite toggle handler
- `onDeleteTag`: Tag deletion handler
- `availableTags`: Array of available tags

**Features**:
- Displays title, description, tags
- Copy button
- Favorite toggle button
- Tag deletion (X button on hover)
- Link to detail page
- Template indicator

**Dependencies**: `@/components/ui/*`, `lucide-react`, `next/link`

---

### 10. Filters Section (`src/components/FiltersSection.tsx`)

**Purpose**: Provides filtering and search functionality.

**Props**:
- `selectedTags`: Array of selected tag names
- `onTagToggle`: Tag selection handler
- `onDeleteTag`: Tag deletion handler
- `isOrMode`: Boolean for OR/AND mode
- `onToggleMode`: Mode toggle handler
- `totalPrompts`: Total prompt count
- `tags`: Array of available tags
- `onAddTag`: Tag creation handler

**Features**:
- Tag selection with visual indicators
- OR/AND mode toggle
- Tag deletion with confirmation
- Tag creation
- Prompt count display

**Dependencies**: `@/components/ui/*`, `AddTagModal`

---

### 11. Favorites Section (`src/components/FavoritesSection.tsx`)

**Purpose**: Displays favorite prompts in a dedicated section.

**Props**:
- `searchQuery`: Current search query
- `onSearchChange`: Search query change handler
- `favoritePrompts`: Array of favorite prompts
- `onCopy`: Copy handler
- `onToggleFavorite`: Favorite toggle handler

**Features**:
- Search box for filtering favorites
- Grid display of favorite prompts
- Copy and favorite toggle functionality

**Dependencies**: `PromptCard`, `@/components/ui/*`

---

### 12. Add Prompt Modal (`src/components/AddPromptModal.tsx`)

**Purpose**: Modal for creating new prompts.

**Props**:
- `isOpen`: Modal visibility state
- `onClose`: Close handler
- `onSave`: Save handler
- `existingTags`: Array of existing tags

**Features**:
- Form fields: title, description, promptText, tags, isFavorite, isTemplate
- Tag selection from existing tags
- Validation feedback
- Template variable auto-detection display

**Dependencies**: `@/components/ui/*`, `@/utils/templateUtils`

---

### 13. Edit Prompt Modal (`src/components/EditPromptModal.tsx`)

**Purpose**: Modal for editing existing prompts.

**Props**:
- `isOpen`: Modal visibility state
- `onClose`: Close handler
- `prompt`: Prompt object to edit
- `availableTags`: Array of available tags
- `onSave`: Save handler

**Features**:
- Pre-filled form with existing prompt data
- All fields editable
- Tag management (add/remove)
- Template variable editing

**Dependencies**: `@/components/ui/*`, `@/utils/templateUtils`

---

### 14. Template Editor (`src/components/TemplateEditor.tsx`)

**Purpose**: Editor component for template creation with variable substitution.

**Props**:
- `template`: Template string
- `onTemplateChange`: Template change handler
- `initialValues`: Initial variable values
- `onValuesChange`: Values change handler
- `showPreview`: Boolean to show preview
- `showVariables`: Boolean to show variables panel

**Features**:
- Template text editor
- Variable extraction and display
- Variable value inputs
- Live preview of rendered template
- Syntax highlighting (optional)

**Dependencies**: `@/utils/templateUtils`

---

## Utility Modules

### 15. Template Utilities (`src/utils/templateUtils.ts`)

**Purpose**: Utility functions for template variable handling.

**Key Functions**:

#### `extractVariables(template: string): string[]`
- **Description**: Extracts variable names from template using `${variable}` syntax
- **Input**: Template string
- **Output**: Array of unique variable names
- **Regex**: `/\$\{([\w\d_]+)\}/g`

#### `renderPrompt(template: string, values: Record<string, string>): string`
- **Description**: Renders template with variable substitution
- **Input**: Template string and values object
- **Output**: Rendered string

#### `validateTemplate(template: string): { isValid: boolean; errors: string[] }`
- **Description**: Validates template syntax
- **Checks**: Mismatched braces, empty variables, nested braces

#### `getTemplatePreview(template: string, sampleValues?: Record<string, string>): string`
- **Description**: Generates preview with sample values
- **Output**: Preview string with placeholders or sample values

#### `isTemplateComplete(template: string, values: Record<string, string>): boolean`
- **Description**: Checks if all variables have values

#### `getMissingVariables(template: string, values: Record<string, string>): string[]`
- **Description**: Returns array of variables without values

**Dependencies**: None (pure functions)

---

### 16. General Utilities (`src/lib/utils.ts`)

**Purpose**: General utility functions.

**Key Functions**:

#### `cn(...classes: ClassValue[]): string`
- **Description**: Merges Tailwind CSS classes
- **Purpose**: Conditional class name composition
- **Dependencies**: `clsx`, `tailwind-merge`

---

## Page Modules

### 17. Home Page (`src/app/page.tsx`)

**Purpose**: Main application page with prompt list and filters.

**Features**:
- Prompt list display (grid layout)
- Search functionality
- Tag filtering (OR/AND mode)
- Favorites section
- Add prompt button
- Template section
- Real-time filtering with `useMemo`

**State Management**:
- `prompts`: Array of all prompts
- `searchQuery`: Current search query
- `selectedTags`: Array of selected tags
- `isOrMode`: Filter mode boolean
- `tags`: Array of available tags

**Data Fetching**:
- Fetches prompts on mount
- Fetches tags on mount
- Updates on mutations

**Dependencies**: Multiple components, `sonner`, `next/link`

---

### 18. Prompt Detail Page (`src/app/prompt/[id]/page.tsx`)

**Purpose**: Individual prompt detail view.

**Features**:
- Full prompt display
- Edit functionality
- Delete functionality
- Tag management
- Copy to clipboard
- Favorite toggle
- Usage notes display
- Timestamps display

**State Management**:
- `prompt`: Current prompt data
- `loading`: Loading state
- `showEditModal`: Edit modal visibility
- `showDeleteConfirm`: Delete confirmation visibility

**Dependencies**: `EditPromptModal`, `CopyButton`, `@/components/ui/*`

---

### 19. Template Editor Page (`src/app/template/page.tsx`)

**Purpose**: Template creation and editing interface.

**Features**:
- Template editor with syntax highlighting
- Variable extraction and display
- Variable value inputs
- Live preview
- Save template functionality
- Load saved templates
- Delete templates
- Quick example templates

**State Management**:
- `template`: Current template string
- `templateValues`: Variable values object
- `savedTemplates`: Array of saved templates
- `selectedTags`: Tags for saving template
- `showSaveModal`: Save modal visibility

**Dependencies**: `TemplateEditor`, `@/utils/templateUtils`, `@/components/ui/*`

---

## Module Interactions

### Typical User Flow: Create Prompt

```
1. User clicks "Add New Prompt" (Home Page)
   ↓
2. AddPromptModal opens (UI Component)
   ↓
3. User fills form and submits
   ↓
4. Home Page calls handleAddPrompt
   ↓
5. POST /api/prompts (API Route)
   ↓
6. API validates with Zod (API Route)
   ↓
7. API calls promptService.createPrompt (Service)
   ↓
8. Service validates business rules (Service)
   ↓
9. Service calls promptRepository.create (Repository)
   ↓
10. Repository saves to database (Prisma)
   ↓
11. Response flows back through layers
   ↓
12. Home Page updates state and shows toast
```

### Typical User Flow: Filter Prompts

```
1. User selects tags in FiltersSection (UI Component)
   ↓
2. FiltersSection calls onTagToggle (Home Page)
   ↓
3. Home Page updates selectedTags state
   ↓
4. useMemo recalculates filteredPrompts (Home Page)
   ↓
5. UI re-renders with filtered results (Client-side)
```

### Typical User Flow: Delete Tag

```
1. User clicks delete on tag in FiltersSection (UI Component)
   ↓
2. FiltersSection calls onDeleteTag (Home Page)
   ↓
3. Home Page calls handleDeleteTagFromFilter
   ↓
4. Checks if tag is in use (client-side check)
   ↓
5. DELETE /api/tags/[id] (API Route)
   ↓
6. API calls tagService.deleteTag (Service)
   ↓
7. Service checks if tag is in use (Service)
   ↓
8. Service calls tagRepository.findPromptsUsingTag (Repository)
   ↓
9. If not in use, service calls tagRepository.delete (Repository)
   ↓
10. Response flows back
   ↓
11. Home Page refreshes tags and updates UI
```

---

## Module Dependencies

### Dependency Graph

```
Pages
  ↓
UI Components
  ↓
API Routes
  ↓
Services
  ↓
Repositories
  ↓
Prisma Client
  ↓
Database
```

### Utility Dependencies

```
Template Utilities
  ↓ (used by)
Services, Components

General Utilities
  ↓ (used by)
All Components
```

### Key Dependency Rules

1. **Pages** depend on **Components** and **API Routes** (via fetch)
2. **Components** depend on **UI Components** and **Utilities**
3. **API Routes** depend on **Services**
4. **Services** depend on **Repositories** and **Utilities**
5. **Repositories** depend on **Prisma Client** only
6. **No circular dependencies** allowed

---

## Summary

The application follows a clear modular architecture with well-defined responsibilities:

- **Data Access**: Repositories handle all database operations
- **Business Logic**: Services contain validation and business rules
- **API Layer**: Routes handle HTTP requests and responses
- **UI Layer**: Components handle presentation and user interaction
- **Utilities**: Helper functions for common operations

This structure ensures maintainability, testability, and scalability of the codebase.

