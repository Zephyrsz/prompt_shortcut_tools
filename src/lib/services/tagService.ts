// Business logic layer
import { tagRepository } from '../repositories/tagRepository';
import { CreateTagInput } from '@/types';

export class TagNotFoundError extends Error {
  constructor(id: number) {
    super(`Tag with id ${id} not found`);
    this.name = 'TagNotFoundError';
  }
}

export class TagAlreadyExistsError extends Error {
  constructor(name: string) {
    super(`Tag with name "${name}" already exists`);
    this.name = 'TagAlreadyExistsError';
  }
}

export class TagInUseError extends Error {
  constructor(name: string, count: number) {
    super(`Tag "${name}" is currently used by ${count} prompt(s). Cannot delete.`);
    this.name = 'TagInUseError';
  }
}

export const tagService = {
  async getTag(id: number) {
    const tag = await tagRepository.findById(id);
    if (!tag) {
      throw new TagNotFoundError(id);
    }
    return tag;
  },

  async listTags() {
    return tagRepository.findAll();
  },

  async createTag(data: CreateTagInput) {
    // Business validation
    if (!data.name || data.name.trim().length === 0) {
      throw new Error('Tag name is required');
    }

    if (!data.color || data.color.trim().length === 0) {
      throw new Error('Tag color is required');
    }

    // Check if tag already exists
    const existingTag = await tagRepository.findByName(data.name.trim());
    if (existingTag) {
      throw new TagAlreadyExistsError(data.name);
    }

    return tagRepository.create({
      name: data.name.trim(),
      color: data.color.trim(),
    });
  },

  async deleteTag(id: number) {
    console.log('tagService.deleteTag called with id:', id);
    const tag = await this.getTag(id);
    console.log('Tag found:', tag);

    // Check if tag is in use
    console.log('Checking if tag is in use:', tag.name);
    const promptsUsingTag = await tagRepository.findPromptsUsingTag(tag.name);
    console.log('Prompts using tag:', promptsUsingTag.length);
    
    if (promptsUsingTag.length > 0) {
      console.log('Tag is in use, throwing error');
      throw new TagInUseError(tag.name, promptsUsingTag.length);
    }

    console.log('Deleting tag from repository');
    const result = await tagRepository.delete(id);
    console.log('Tag deleted from repository:', result);
    return result;
  },

  async checkTagInUse(name: string) {
    const prompts = await tagRepository.findPromptsUsingTag(name);
    return prompts.length > 0;
  },
};

