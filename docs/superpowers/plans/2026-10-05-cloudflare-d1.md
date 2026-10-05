# Cloudflare D1 Deployment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deploy the Next.js prompt manager to Cloudflare Workers with D1 persistence and provide a repeatable SQLite data import path.

**Architecture:** Keep the existing Prisma schema and repository/service/API contracts. Configure Prisma's D1 driver adapter and resolve a `DB` binding from the Cloudflare request context. Use OpenNext for the Worker build and Wrangler migrations for schema/data operations.

**Tech Stack:** Next.js 16, Prisma 6.18, `@prisma/adapter-d1`, `@opennextjs/cloudflare`, Wrangler 4, Cloudflare D1, TypeScript.

**Spec:** `docs/superpowers/specs/2026-10-05-cloudflare-d1-design.md`

## Global Constraints

- Preserve the existing `/api/prompts` and `/api/tags` response contracts.
- Use the Wrangler D1 binding name `DB` consistently in code and configuration.
- Keep the existing SQLite database as the export source; do not delete or rewrite it.
- Never commit a real Cloudflare database ID or account credential.
- Keep generated data SQL separate from the schema migration.

### Task 1: Add failing D1 SQL export tests

**Files:**
- Create: `tests/d1-sql.test.ts`
- Modify: `package.json`

- [ ] Add tests for SQL literal escaping and row insert serialization.
- [ ] Add a `test` script using `tsx --test tests/**/*.test.ts`.
- [ ] Run `npm test` and confirm the new imports fail because the serializer does not exist yet.

### Task 2: Implement D1 runtime client and repository compatibility

**Files:**
- Modify: `prisma/schema.prisma`
- Modify: `src/lib/prisma.ts`
- Modify: `src/lib/repositories/promptRepository.ts`
- Modify: `src/lib/repositories/tagRepository.ts`
- Modify: `package.json`

- [ ] Enable Prisma client engine mode needed by driver adapters.
- [ ] Implement an async singleton that creates `PrismaClient` with `PrismaD1` and the `DB` binding from `getCloudflareContext`.
- [ ] Update repository methods to await the async client without changing service signatures or API payloads.
- [ ] Add Cloudflare and Prisma adapter dependencies.
- [ ] Run the focused tests and TypeScript checking.

### Task 3: Add schema and data migration tooling

**Files:**
- Create: `prisma/d1-migrations/0001_initial.sql`
- Create: `src/lib/d1/sql.ts`
- Create: `scripts/export-sqlite-to-d1.ts`
- Create: `tests/d1-export.test.ts`
- Modify: `package.json`

- [ ] Add the D1-compatible `Prompt` and `Tag` schema migration.
- [ ] Implement deterministic SQL serialization for prompt and tag rows.
- [ ] Export all rows from the existing SQLite file and write a reviewable SQL file.
- [ ] Add a test that exercises an exported row and validates the current database counts.
- [ ] Run the export against `prisma/prompts.db` and verify it produces 27 prompts and 14 tags.

### Task 4: Add Cloudflare Worker configuration and deployment scripts

**Files:**
- Create: `wrangler.jsonc`
- Create: `open-next.config.ts`
- Modify: `package.json`
- Modify: `.gitignore`

- [ ] Add the `DB` D1 binding, OpenNext Worker entry, assets binding, compatibility date, and `nodejs_compat`.
- [ ] Add scripts for Cloudflare build, local preview, deploy, and remote/local D1 migrations.
- [ ] Ignore generated `.open-next`, Wrangler state, and local export output.
- [ ] Build the Worker and run lint/type checks.

### Task 5: Document database creation, import, and deployment

**Files:**
- Create: `CLOUDFLARE_DEPLOYMENT.md`
- Modify: `README.md`

- [ ] Document `wrangler login`, D1 creation, binding ID insertion, migrations, data import, local preview, and deployment.
- [ ] Include both CLI examples and the Cloudflare dashboard path for creating a D1 database.
- [ ] Document the required `DB` binding and the distinction between local Next dev and Wrangler preview.
- [ ] Run the final verification commands and report any environment-specific limitation.

### Task 6: Review final diff and commit implementation

**Files:**
- All files above.

- [ ] Verify only task files are staged; leave pre-existing user files untouched.
- [ ] Run lint, tests, TypeScript check, export count check, and OpenNext build.
- [ ] Commit the implementation on `codex/cloudflare-d1`.
