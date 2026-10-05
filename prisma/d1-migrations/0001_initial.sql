-- Cloudflare D1 schema migration for the Prisma Prompt and Tag models.
-- Data is imported separately by scripts/export-sqlite-to-d1.ts.

CREATE TABLE IF NOT EXISTS "Prompt" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "promptText" TEXT NOT NULL,
  "tags" TEXT NOT NULL,
  "usageNotes" TEXT,
  "isFavorite" BOOLEAN NOT NULL DEFAULT false,
  "isTemplate" BOOLEAN NOT NULL DEFAULT false,
  "templateVars" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS "Tag" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "name" TEXT NOT NULL,
  "color" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "Tag_name_key" ON "Tag"("name");
