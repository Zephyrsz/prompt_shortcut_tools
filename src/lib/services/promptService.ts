// Business logic layer
import { promptRepository } from '../repositories/promptRepository';
import { CreatePromptInput, UpdatePromptInput, PromptFilters } from '@/types';
import { extractVariables } from '@/utils/templateUtils';

export class PromptNotFoundError extends Error {
  constructor(id: number) {
    super(`Prompt with id ${id} not found`);
    this.name = 'PromptNotFoundError';
  }
}

export const promptService = {
  async getPrompt(id: number) {
    const prompt = await promptRepository.findById(id);
    if (!prompt) {
      throw new PromptNotFoundError(id);
    }
    return prompt;
  },

  async listPrompts(filters?: PromptFilters) {
    return promptRepository.findAll(filters);
  },

  async createPrompt(data: CreatePromptInput) {
    // Business validation
    if (!data.title || data.title.trim().length === 0) {
      throw new Error('Title is required');
    }

    if (!data.promptText || data.promptText.trim().length === 0) {
      throw new Error('Prompt text is required');
    }

    // Auto-extract template variables if it's a template
    let templateVars = data.templateVars;
    if (data.isTemplate && !templateVars) {
      const variables = extractVariables(data.promptText);
      if (variables.length > 0) {
        templateVars = variables;
      }
    }

    // Ensure tags is an array
    let tags = data.tags || [];
    if (typeof tags === 'string') {
      try {
        tags = JSON.parse(tags);
      } catch {
        tags = [];
      }
    }

    return promptRepository.create({
      ...data,
      tags,
      templateVars,
    });
  },

  async updatePrompt(id: number, data: UpdatePromptInput) {
    // Check if prompt exists
    await this.getPrompt(id);

    // Validate if title is being updated
    if (data.title !== undefined && data.title.trim().length === 0) {
      throw new Error('Title cannot be empty');
    }

    // Validate if promptText is being updated
    if (data.promptText !== undefined && data.promptText.trim().length === 0) {
      throw new Error('Prompt text cannot be empty');
    }

    // Auto-extract template variables if it's becoming a template
    if (data.isTemplate && !data.templateVars && data.promptText) {
      const variables = extractVariables(data.promptText);
      if (variables.length > 0) {
        data.templateVars = variables;
      }
    }

    return promptRepository.update(id, data);
  },

  async deletePrompt(id: number) {
    await this.getPrompt(id);
    return promptRepository.delete(id);
  },

  async toggleFavorite(id: number, isFavorite: boolean) {
    return this.updatePrompt(id, { isFavorite });
  },

  async removeTag(id: number, tag: string) {
    const prompt = await this.getPrompt(id);
    const currentTags = prompt.tags;
    const updatedTags = currentTags.filter((t) => t !== tag);

    return promptRepository.update(id, {
      tags: updatedTags,
    });
  },

  async searchPrompts(query: string) {
    if (!query || query.trim().length < 2) {
      throw new Error('Search query must be at least 2 characters');
    }

    return promptRepository.search(query.trim());
  },
};

