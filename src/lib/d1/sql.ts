export type PromptRow = {
  id: number;
  title: string;
  description: string | null;
  promptText: string;
  tags: string;
  usageNotes: string | null;
  isFavorite: boolean | number;
  isTemplate: boolean | number;
  templateVars: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TagRow = {
  id: number;
  name: string;
  color: string;
  createdAt: string;
  updatedAt: string;
};

export function sqlLiteral(value: string | number | boolean | null): string {
  if (value === null) return 'NULL';
  if (typeof value === 'boolean') return value ? '1' : '0';
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new Error('SQL numbers must be finite');
    return String(value);
  }

  return `'${value.replaceAll("'", "''")}'`;
}

export function serializePromptInsert(row: PromptRow): string {
  const values = [
    row.id,
    row.title,
    row.description,
    row.promptText,
    row.tags,
    row.usageNotes,
    Boolean(row.isFavorite),
    Boolean(row.isTemplate),
    row.templateVars,
    row.createdAt,
    row.updatedAt,
  ].map(sqlLiteral);

  return `INSERT OR REPLACE INTO "Prompt" ("id", "title", "description", "promptText", "tags", "usageNotes", "isFavorite", "isTemplate", "templateVars", "createdAt", "updatedAt") VALUES (${values.join(', ')});`;
}

export function serializeTagInsert(row: TagRow): string {
  const values = [row.id, row.name, row.color, row.createdAt, row.updatedAt].map(sqlLiteral);
  return `INSERT OR REPLACE INTO "Tag" ("id", "name", "color", "createdAt", "updatedAt") VALUES (${values.join(', ')});`;
}
