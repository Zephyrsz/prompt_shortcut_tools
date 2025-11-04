// Type definitions for Prompt and Tag entities
export interface Prompt {
  id: number;
  title: string;
  description?: string | null;
  promptText: string;
  tags: string[]; // Parsed from JSON string
  usageNotes?: string | null;
  isFavorite: boolean;
  isTemplate: boolean;
  templateVars?: string[] | null; // Parsed from JSON string
  createdAt: Date;
  updatedAt: Date;
}

export interface Tag {
  id: number;
  name: string;
  color: string;
  createdAt: Date;
  updatedAt: Date;
}

// Input types for creating prompts
export interface CreatePromptInput {
  title: string;
  description?: string | null;
  promptText: string;
  tags?: string[] | string; // Can be array or JSON string
  usageNotes?: string | null;
  isFavorite?: boolean;
  isTemplate?: boolean;
  templateVars?: string[] | string | null; // Can be array or JSON string
}

// Input types for updating prompts
export interface UpdatePromptInput {
  title?: string;
  description?: string | null;
  promptText?: string;
  tags?: string[] | string;
  usageNotes?: string | null;
  isFavorite?: boolean;
  isTemplate?: boolean;
  templateVars?: string[] | string | null;
}

// Input types for creating tags
export interface CreateTagInput {
  name: string;
  color: string;
}

// Filter types for prompt queries
export interface PromptFilters {
  query?: string; // Search query for title, description, promptText
  tags?: string[]; // Filter by tags
  isFavorite?: boolean; // Filter by favorite status
  isTemplate?: boolean; // Filter by template status
}

// Pagination parameters
export interface PaginationParams {
  page?: number;
  limit?: number;
}

