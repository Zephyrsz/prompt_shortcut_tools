import { CreatePromptInput, PromptFilters, UpdatePromptInput } from '@/types';
import { getD1Database } from '../d1/database';

type PromptRow = {
  id: number;
  title: string;
  description: string | null;
  promptText: string;
  tags: string;
  usageNotes: string | null;
  isFavorite: boolean | number;
  isTemplate: boolean | number;
  templateVars: string | null;
  createdAt: string | number;
  updatedAt: string | number;
};

function parsePrompt(row: PromptRow) {
  return {
    ...row,
    tags: JSON.parse(row.tags) as string[],
    templateVars: row.templateVars ? (JSON.parse(row.templateVars) as string[]) : null,
    isFavorite: Boolean(row.isFavorite),
    isTemplate: Boolean(row.isTemplate),
  };
}

function tagPattern(tag: string): string {
  return `%"${tag.replaceAll('"', '""')}"%`;
}

export const promptRepository = {
  async findById(id: number) {
    const db = await getD1Database();
    const row = await db
      .prepare('SELECT * FROM "Prompt" WHERE "id" = ?')
      .bind(id)
      .first<PromptRow>();

    return row ? parsePrompt(row) : null;
  },

  async findAll(filters?: PromptFilters) {
    const db = await getD1Database();
    const conditions: string[] = [];
    const bindings: Array<string | number> = [];

    if (filters?.query) {
      conditions.push('("title" LIKE ? OR "description" LIKE ? OR "promptText" LIKE ?)');
      const pattern = `%${filters.query}%`;
      bindings.push(pattern, pattern, pattern);
    }

    for (const tag of filters?.tags ?? []) {
      conditions.push('"tags" LIKE ?');
      bindings.push(tagPattern(tag));
    }

    if (filters?.isFavorite !== undefined) {
      conditions.push('"isFavorite" = ?');
      bindings.push(filters.isFavorite ? 1 : 0);
    }

    if (filters?.isTemplate !== undefined) {
      conditions.push('"isTemplate" = ?');
      bindings.push(filters.isTemplate ? 1 : 0);
    }

    const sql = `SELECT * FROM "Prompt"${conditions.length ? ` WHERE ${conditions.join(' AND ')}` : ''} ORDER BY "createdAt" DESC`;
    const statement = db.prepare(sql);
    const result = bindings.length
      ? await statement.bind(...bindings).all<PromptRow>()
      : await statement.all<PromptRow>();

    return result.results.map(parsePrompt);
  },

  async create(data: CreatePromptInput) {
    const db = await getD1Database();
    const now = Date.now();
    const row = await db
      .prepare(
        'INSERT INTO "Prompt" ("title", "description", "promptText", "tags", "usageNotes", "isFavorite", "isTemplate", "templateVars", "createdAt", "updatedAt") VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING *',
      )
      .bind(
        data.title,
        data.description ?? null,
        data.promptText,
        Array.isArray(data.tags) ? JSON.stringify(data.tags) : data.tags ?? '[]',
        data.usageNotes ?? null,
        data.isFavorite ? 1 : 0,
        data.isTemplate ? 1 : 0,
        Array.isArray(data.templateVars) ? JSON.stringify(data.templateVars) : data.templateVars ?? null,
        now,
        now,
      )
      .first<PromptRow>();

    if (!row) throw new Error('Failed to create prompt');
    return parsePrompt(row);
  },

  async update(id: number, data: UpdatePromptInput) {
    const db = await getD1Database();
    const updates: string[] = [];
    const bindings: Array<string | number | null> = [];

    if (data.title !== undefined) {
      updates.push('"title" = ?');
      bindings.push(data.title);
    }
    if (data.description !== undefined) {
      updates.push('"description" = ?');
      bindings.push(data.description);
    }
    if (data.promptText !== undefined) {
      updates.push('"promptText" = ?');
      bindings.push(data.promptText);
    }
    if (data.usageNotes !== undefined) {
      updates.push('"usageNotes" = ?');
      bindings.push(data.usageNotes);
    }
    if (data.isFavorite !== undefined) {
      updates.push('"isFavorite" = ?');
      bindings.push(data.isFavorite ? 1 : 0);
    }
    if (data.isTemplate !== undefined) {
      updates.push('"isTemplate" = ?');
      bindings.push(data.isTemplate ? 1 : 0);
    }
    if (data.tags !== undefined) {
      updates.push('"tags" = ?');
      bindings.push(Array.isArray(data.tags) ? JSON.stringify(data.tags) : data.tags);
    }
    if (data.templateVars !== undefined) {
      updates.push('"templateVars" = ?');
      bindings.push(
        data.templateVars === null
          ? null
          : Array.isArray(data.templateVars)
            ? JSON.stringify(data.templateVars)
            : data.templateVars,
      );
    }

    if (updates.length === 0) return this.findById(id);

    updates.push('"updatedAt" = ?');
    bindings.push(Date.now());
    bindings.push(id);

    const row = await db
      .prepare(`UPDATE "Prompt" SET ${updates.join(', ')} WHERE "id" = ? RETURNING *`)
      .bind(...bindings)
      .first<PromptRow>();

    if (!row) return null;
    return parsePrompt(row);
  },

  async delete(id: number) {
    const db = await getD1Database();
    return db.prepare('DELETE FROM "Prompt" WHERE "id" = ?').bind(id).run();
  },

  async search(query: string) {
    return this.findAll({ query });
  },
};
