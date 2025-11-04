// Pure data access layer - only Prisma queries, no business logic
import { prisma } from '../prisma';
import { CreatePromptInput, UpdatePromptInput, PromptFilters } from '@/types';

export const promptRepository = {
  async findById(id: number) {
    const prompt = await prisma.prompt.findUnique({
      where: { id },
    });

    if (!prompt) {
      return null;
    }

    // Parse JSON strings to arrays
    return {
      ...prompt,
      tags: JSON.parse(prompt.tags),
      templateVars: prompt.templateVars ? JSON.parse(prompt.templateVars) : null,
    };
  },

  async findAll(filters?: PromptFilters) {
    const where: any = {};

    // Search filter
    if (filters?.query) {
      where.OR = [
        { title: { contains: filters.query } },
        { description: { contains: filters.query } },
        { promptText: { contains: filters.query } },
      ];
    }

    // Tags filter - need to check JSON string contains tag
    if (filters?.tags && filters.tags.length > 0) {
      // For SQLite, we need to check if JSON string contains the tag
      // This is a simplified approach - in production, you might want more sophisticated matching
      where.AND = filters.tags.map((tag) => ({
        tags: {
          contains: JSON.stringify(tag),
        },
      }));
    }

    // Favorite filter
    if (filters?.isFavorite !== undefined) {
      where.isFavorite = filters.isFavorite;
    }

    // Template filter
    if (filters?.isTemplate !== undefined) {
      where.isTemplate = filters.isTemplate;
    }

    const prompts = await prisma.prompt.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Parse JSON strings to arrays
    return prompts.map((prompt) => ({
      ...prompt,
      tags: JSON.parse(prompt.tags),
      templateVars: prompt.templateVars ? JSON.parse(prompt.templateVars) : null,
    }));
  },

  async create(data: CreatePromptInput) {
    // Convert tags to JSON string
    let tagsString = '[]';
    if (data.tags) {
      if (Array.isArray(data.tags)) {
        tagsString = JSON.stringify(data.tags);
      } else if (typeof data.tags === 'string') {
        tagsString = data.tags;
      }
    }

    // Convert templateVars to JSON string
    let templateVarsString = null;
    if (data.templateVars) {
      if (Array.isArray(data.templateVars)) {
        templateVarsString = JSON.stringify(data.templateVars);
      } else if (typeof data.templateVars === 'string') {
        templateVarsString = data.templateVars;
      }
    }

    const prompt = await prisma.prompt.create({
      data: {
        title: data.title,
        description: data.description || null,
        promptText: data.promptText,
        tags: tagsString,
        usageNotes: data.usageNotes || null,
        isFavorite: data.isFavorite || false,
        isTemplate: data.isTemplate || false,
        templateVars: templateVarsString,
      },
    });

    // Parse JSON strings to arrays
    return {
      ...prompt,
      tags: JSON.parse(prompt.tags),
      templateVars: prompt.templateVars ? JSON.parse(prompt.templateVars) : null,
    };
  },

  async update(id: number, data: UpdatePromptInput) {
    const updateData: any = {};

    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.promptText !== undefined) updateData.promptText = data.promptText;
    if (data.usageNotes !== undefined) updateData.usageNotes = data.usageNotes;
    if (data.isFavorite !== undefined) updateData.isFavorite = data.isFavorite;
    if (data.isTemplate !== undefined) updateData.isTemplate = data.isTemplate;

    // Handle tags
    if (data.tags !== undefined) {
      if (Array.isArray(data.tags)) {
        updateData.tags = JSON.stringify(data.tags);
      } else if (typeof data.tags === 'string') {
        updateData.tags = data.tags;
      }
    }

    // Handle templateVars
    if (data.templateVars !== undefined) {
      if (Array.isArray(data.templateVars)) {
        updateData.templateVars = JSON.stringify(data.templateVars);
      } else if (typeof data.templateVars === 'string') {
        updateData.templateVars = data.templateVars;
      } else if (data.templateVars === null) {
        updateData.templateVars = null;
      }
    }

    const prompt = await prisma.prompt.update({
      where: { id },
      data: updateData,
    });

    // Parse JSON strings to arrays
    return {
      ...prompt,
      tags: JSON.parse(prompt.tags),
      templateVars: prompt.templateVars ? JSON.parse(prompt.templateVars) : null,
    };
  },

  async delete(id: number) {
    return prisma.prompt.delete({
      where: { id },
    });
  },

  async search(query: string) {
    const prompts = await prisma.prompt.findMany({
      where: {
        OR: [
          { title: { contains: query } },
          { description: { contains: query } },
          { promptText: { contains: query } },
        ],
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Parse JSON strings to arrays
    return prompts.map((prompt) => ({
      ...prompt,
      tags: JSON.parse(prompt.tags),
      templateVars: prompt.templateVars ? JSON.parse(prompt.templateVars) : null,
    }));
  },
};

