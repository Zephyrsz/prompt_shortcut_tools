'use client';

import React from 'react';
import { Heart } from 'lucide-react';
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
  favoritePrompts: Prompt[];
  onCopy: (text: string) => void;
  onToggleFavorite: (id: number) => void;
}

export default function FavoritesSection({
  favoritePrompts,
  onCopy,
  onToggleFavorite
}: FavoritesSectionProps) {
  return (
    <section className="surface-panel favorites-section" aria-labelledby="favorites-title">
      <div className="surface-panel__header favorites-panel__header">
        <div className="favorites-panel__title">
          <Heart className="h-6 w-6 text-pink-500" />
          <h2 id="favorites-title" className="section-title">Our favorites</h2>
          <span className="section-count">{favoritePrompts.length}</span>
        </div>
      </div>
      
      <div className="prompt-grid">
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
        <div className="favorites-section__empty">
          No favorite prompts found.
        </div>
      )}
    </section>
  );
}
