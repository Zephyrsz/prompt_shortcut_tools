# Default Tags Removal - Database-Only Tags

All `defaultTags` code has been removed. The application now uses **ONLY** tags from the database.

## Changes Made

### 1. ✅ Removed `defaultTags` Array
**File:** `src/app/page.tsx`
- Removed the entire `defaultTags` constant array
- Changed initial state from `useState<Tag[]>(defaultTags)` to `useState<Tag[]>([])`

### 2. ✅ Removed Default Tags Fallback
**File:** `src/app/page.tsx`
- Removed fallback to `defaultTags` when API fails
- Now sets empty array `[]` if API fails
- Tags are loaded ONLY from database via `/api/tags`

### 3. ✅ Simplified Tag Deletion
**File:** `src/app/page.tsx`
- Removed complex logic for handling default tags (negative IDs)
- All tags now have positive IDs from database
- Simplified deletion to always call DELETE API

### 4. ✅ Removed Default Tags from FiltersSection
**File:** `src/components/FiltersSection.tsx`
- Removed unused `defaultTags` array
- Component now only receives tags via props from parent

### 5. ✅ Updated Prompt Detail Page
**File:** `src/app/prompt/[id]/page.tsx`
- Removed hardcoded `defaultTags`
- Now fetches tags from `/api/tags` API endpoint
- Tags come directly from database

## Current Behavior

### Tag Loading
```typescript
// ONLY from database
const res = await fetch('/api/tags');
const dbTags = await res.json();
setTags(dbTags); // No merging, no defaults
```

### Tag Deletion
```typescript
// All tags have positive IDs from database
if (tagToDelete.id <= 0) {
  // Invalid - shouldn't happen
  return;
}
// Delete from database
await fetch(`/api/tags/${tagToDelete.id}`, { method: 'DELETE' });
await fetchTags(); // Refresh from database
```

### Tag Display
- Filters show ONLY tags from database
- No default tags appear
- Empty state if database has no tags

## Benefits

1. **Single Source of Truth**: Database is the only source for tags
2. **Consistency**: Tags always match database state
3. **Simplicity**: No complex merging or fallback logic
4. **Reliability**: Deleted tags won't reappear
5. **Predictability**: What you see is what's in the database

## Database as Source of Truth

- ✅ All tags come from `Tag` table
- ✅ No hardcoded tags in code
- ✅ Deletions persist correctly
- ✅ Frontend and database stay in sync

## Migration Notes

If you need initial tags in the database, run:
```bash
npx tsx prisma/seed-tags.ts
```

This will populate the `Tag` table with default tags. From that point on, all tag management is through the database.

