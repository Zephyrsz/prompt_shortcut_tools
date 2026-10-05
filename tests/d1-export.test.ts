import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

test('SQLite export includes every current prompt and tag row', () => {
  const directory = mkdtempSync(join(tmpdir(), 'prompt-shortcut-d1-'));
  const outputPath = join(directory, 'data.sql');

  try {
    execFileSync('npx', ['tsx', 'scripts/export-sqlite-to-d1.ts', '--output', outputPath], {
      encoding: 'utf8',
    });
    const sql = readFileSync(outputPath, 'utf8');

    assert.match(sql, /-- Rows: 27 prompts, 14 tags/);
    assert.equal((sql.match(/INSERT OR REPLACE INTO "Prompt"/g) ?? []).length, 27);
    assert.equal((sql.match(/INSERT OR REPLACE INTO "Tag"/g) ?? []).length, 14);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
