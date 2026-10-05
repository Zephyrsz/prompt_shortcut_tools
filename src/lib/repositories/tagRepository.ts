import { CreateTagInput } from '@/types';
import { getD1Database } from '../d1/database';

type TagRow = {
  id: number;
  name: string;
  color: string;
  createdAt: string | number;
  updatedAt: string | number;
};

function tagPattern(tagName: string): string {
  return `%"${tagName.replaceAll('"', '""')}"%`;
}

export const tagRepository = {
  async findById(id: number) {
    const db = await getD1Database();
    return db.prepare('SELECT * FROM "Tag" WHERE "id" = ?').bind(id).first<TagRow>();
  },

  async findByName(name: string) {
    const db = await getD1Database();
    return db.prepare('SELECT * FROM "Tag" WHERE "name" = ?').bind(name).first<TagRow>();
  },

  async findAll() {
    const db = await getD1Database();
    const result = await db.prepare('SELECT * FROM "Tag" ORDER BY "name" ASC').all<TagRow>();
    return result.results;
  },

  async create(data: CreateTagInput) {
    const db = await getD1Database();
    const now = Date.now();
    return db
      .prepare(
        'INSERT INTO "Tag" ("name", "color", "createdAt", "updatedAt") VALUES (?, ?, ?, ?) RETURNING *',
      )
      .bind(data.name, data.color, now, now)
      .first<TagRow>();
  },

  async delete(id: number) {
    const db = await getD1Database();
    return db.prepare('DELETE FROM "Tag" WHERE "id" = ?').bind(id).run();
  },

  async findPromptsUsingTag(tagName: string) {
    const db = await getD1Database();
    const result = await db
      .prepare('SELECT * FROM "Prompt" WHERE "tags" LIKE ?')
      .bind(tagPattern(tagName))
      .all();
    return result.results;
  },
};
