// Pure data access layer - only Prisma queries, no business logic
import { prisma } from '../prisma';
import { CreateTagInput } from '@/types';

export const tagRepository = {
  async findById(id: number) {
    return prisma.tag.findUnique({
      where: { id },
    });
  },

  async findByName(name: string) {
    return prisma.tag.findUnique({
      where: { name },
    });
  },

  async findAll() {
    return prisma.tag.findMany({
      orderBy: {
        name: 'asc',
      },
    });
  },

  async create(data: CreateTagInput) {
    return prisma.tag.create({
      data,
    });
  },

  async delete(id: number) {
    return prisma.tag.delete({
      where: { id },
    });
  },

  async findPromptsUsingTag(tagName: string) {
    // Find all prompts that contain this tag in their tags JSON string
    // Tags are stored as JSON array like ["tag1", "tag2"]
    // We need to search for the tag name within the JSON array
    // Use contains with the tag name in quotes (as it appears in JSON)
    const searchPattern = `"${tagName}"`;
    return prisma.prompt.findMany({
      where: {
        tags: {
          contains: searchPattern,
        },
      },
    });
  },
};

