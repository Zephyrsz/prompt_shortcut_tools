'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { Heart, Search } from 'lucide-react';
import PromptCard from './PromptCard';

interface Prompt {
  id: number;
  title: string;
  description?: string;
  promptText: string;
  tags: string[];
  isFavorite: boolean;
}

interface FavoritesSectionProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  favoritePrompts: Prompt[];
  onCopy: (text: string) => void;
  onToggleFavorite: (id: number) => void;
}

export default function FavoritesSection({
  searchQuery,
  onSearchChange,
  favoritePrompts,
  onCopy,
  onToggleFavorite
}: FavoritesSectionProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Heart className="h-6 w-6 text-pink-500" />
          <h2 className="text-2xl font-bold text-black">Our favorites</h2>
        </div>
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search for prompts..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 pr-4 py-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {favoritePrompts.map((prompt) => (
          <PromptCard
            key={prompt.id}
            prompt={prompt}
            onCopy={onCopy}
            onToggleFavorite={onToggleFavorite}
          />
        ))}
      </div>
      
      {favoritePrompts.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No favorite prompts found.
        </div>
      )}
    </div>
  );
}
