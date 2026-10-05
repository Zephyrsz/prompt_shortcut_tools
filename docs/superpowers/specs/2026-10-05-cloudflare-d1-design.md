# Cloudflare D1 Deployment Design

## Goal

Deploy the Prompt Shortcut Tools Next.js application to Cloudflare Workers with Cloudflare D1 as its persistent database, while preserving the existing REST API and service/repository boundaries.

## Architecture

- Next.js App Router is packaged for Workers with `@opennextjs/cloudflare`.
- The existing Prisma schema remains the source of truth for the `Prompt` and `Tag` tables.
- Runtime repositories use parameterized D1 SQL against a Wrangler `DB` binding. The Prisma schema remains the source of truth for the tables, while the local SQLite file remains available as the source for one-time data export and local Prisma tooling.
- D1 schema changes are tracked in a Wrangler migration directory. Existing SQLite rows are exported as parameter-safe SQL by a one-time script and applied with `wrangler d1 execute`.

## Runtime and data flow

Each API route calls the existing service layer. Repositories acquire the request's Cloudflare D1 binding and issue parameterized SQL. `getCloudflareContext({ async: true })` resolves the binding; a clear configuration error is returned by the runtime when the app is started without a D1 binding.

The Worker uses a `DB` binding configured in `wrangler.jsonc`. The database name and ID are placeholders until the operator creates the D1 database. No credentials are committed to the repository.

## Migration and deployment

1. Create a D1 database with `wrangler d1 create prompt-shortcut-tools-db`.
2. Copy the returned database ID into a local, uncommitted `wrangler.jsonc` override or the deployment configuration.
3. Apply `prisma/d1-migrations/0001_initial.sql` remotely.
4. Export the committed SQLite snapshot with `npm run db:export -- --output ./tmp/d1-data.sql` and apply the generated SQL remotely.
5. Build and deploy with OpenNext through Wrangler.

The generated data SQL is intentionally separate from the schema migration so an operator can review row counts and rerun data import without recreating tables. Inserts use `INSERT OR REPLACE` keyed by the existing integer IDs, preserving links encoded in prompt tag JSON. The file contains individual statements because Wrangler's D1 executor manages transaction boundaries itself.

## Compatibility and failure handling

- The Worker enables `nodejs_compat`, which is required by the Prisma client runtime.
- D1 migration SQL uses SQLite-compatible syntax and does not create Prisma's local `_prisma_migrations` bookkeeping table.
- API behavior and error classes remain unchanged. Database initialization failures are logged with the missing binding name and surface as a server error.
- Local `next dev` remains available for UI work; D1-backed API verification uses the OpenNext build plus `wrangler dev` so the binding exists.

## Verification

- Run the existing lint command.
- Run TypeScript checking through `tsc --noEmit`.
- Run the D1 SQL serialization tests and export the current SQLite database, checking that the output contains 27 prompt rows and 14 tag rows.
- Build the OpenNext Worker and run a local Wrangler preview when the local Cloudflare toolchain is available.
