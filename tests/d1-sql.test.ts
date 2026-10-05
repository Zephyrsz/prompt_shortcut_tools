import assert from 'node:assert/strict';
import test from 'node:test';

import { serializePromptInsert, serializeTagInsert, sqlLiteral } from '../src/lib/d1/sql';

test('sqlLiteral escapes apostrophes and represents null safely', () => {
  assert.equal(sqlLiteral("O'Reilly"), "'O''Reilly'");
  assert.equal(sqlLiteral(null), 'NULL');
  assert.equal(sqlLiteral(true), '1');
});

test('serializePromptInsert preserves ids and JSON text', () => {
  const sql = serializePromptInsert({
    id: 7,
    title: "Writer's prompt",
    description: null,
    promptText: 'Use {tone}',
    tags: '["writing"]',
    usageNotes: null,
    isFavorite: true,
    isTemplate: true,
    templateVars: '["tone"]',
    createdAt: '2026-01-01 00:00:00',
    updatedAt: '2026-01-02 00:00:00',
  });

  assert.equal(
    sql,
    "INSERT OR REPLACE INTO \"Prompt\" (\"id\", \"title\", \"description\", \"promptText\", \"tags\", \"usageNotes\", \"isFavorite\", \"isTemplate\", \"templateVars\", \"createdAt\", \"updatedAt\") VALUES (7, 'Writer''s prompt', NULL, 'Use {tone}', '[\"writing\"]', NULL, 1, 1, '[\"tone\"]', '2026-01-01 00:00:00', '2026-01-02 00:00:00');",
  );
});

test('serializeTagInsert produces an idempotent insert', () => {
  assert.equal(
    serializeTagInsert({
      id: 3,
      name: 'AI',
      color: '#123456',
      createdAt: '2026-01-01 00:00:00',
      updatedAt: '2026-01-02 00:00:00',
    }),
    "INSERT OR REPLACE INTO \"Tag\" (\"id\", \"name\", \"color\", \"createdAt\", \"updatedAt\") VALUES (3, 'AI', '#123456', '2026-01-01 00:00:00', '2026-01-02 00:00:00');",
  );
});
