import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

import {
  serializePromptInsert,
  serializeTagInsert,
  type PromptRow,
  type TagRow,
} from '../src/lib/d1/sql';

function getArgument(name: string, fallback: string): string {
  const index = process.argv.indexOf(name);
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
}

function readRows<T>(databasePath: string, query: string): T[] {
  const json = execFileSync('sqlite3', ['-json', databasePath, query], {
    encoding: 'utf8',
  }).trim();

  return json ? (JSON.parse(json) as T[]) : [];
}

const databasePath = resolve(getArgument('--db', 'prisma/prompts.db'));
const outputPath = resolve(getArgument('--output', '.tmp/d1-data.sql'));
const prompts = readRows<PromptRow>(
  databasePath,
  'SELECT id, title, description, promptText, tags, usageNotes, isFavorite, isTemplate, templateVars, createdAt, updatedAt FROM Prompt ORDER BY id',
);
const tags = readRows<TagRow>(
  databasePath,
  'SELECT id, name, color, createdAt, updatedAt FROM Tag ORDER BY id',
);

const sql = [
  '-- Generated from the existing SQLite database. Apply after 0001_initial.sql.',
  `-- Source: ${databasePath}`,
  `-- Rows: ${prompts.length} prompts, ${tags.length} tags`,
  ...tags.map(serializeTagInsert),
  ...prompts.map(serializePromptInsert),
  '',
].join('\n');

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, sql, 'utf8');
console.log(`Exported ${prompts.length} prompts and ${tags.length} tags to ${outputPath}`);
