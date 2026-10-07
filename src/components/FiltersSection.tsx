'use client';

import React, { useState } from 'react';
import { Toggle } from '@/components/ui/toggle';
import { Plus, Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import AddTagModal from './AddTagModal';

interface Tag {
  id: number;
  name: string;
  color: string;
}

interface FiltersSectionProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedTags: string[];
  onTagToggle: (tag: string) => void;
  onDeleteTag: (tag: string) => void;
  isOrMode: boolean;
  onToggleMode: () => void;
  totalPrompts: number;
  tags: Tag[];
  onAddTag: (tag: Omit<Tag, 'id'>) => void;
}

export default function FiltersSection({
  searchQuery,
  onSearchChange,
  selectedTags,
  onTagToggle,
  onDeleteTag,
  isOrMode,
  onToggleMode,
  totalPrompts,
  tags,
  onAddTag
}: FiltersSectionProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const handleAddTag = (tag: Omit<Tag, 'id'>) => {
    onAddTag(tag);
    setIsAddModalOpen(false);
  };

  return (
    <section className="surface-panel filters-section" aria-labelledby="filters-title">
      <div className="filters-panel__header">
        <div className="filter-summary">
          <h2 id="filters-title" className="filter-summary__title">Filters</h2>
          <span className="filter-summary__count">{totalPrompts} prompts</span>
        </div>
        <div className="search-box">
          <Search aria-hidden="true" />
          <Input
            placeholder="Search prompts and templates..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label="Search prompts and templates"
          />
        </div>
      </div>

      <div className="filters-panel__toolbar">
        <span className="filters-panel__label">Tags</span>
        <div className="filter-mode">
          <span className="filter-mode__label">MATCH</span>
          <span aria-hidden="true">{isOrMode ? 'Any tag' : 'Every tag'}</span>
          <Toggle
            pressed={isOrMode}
            onPressedChange={onToggleMode}
            aria-label={`Match ${isOrMode ? 'any' : 'every'} selected tag`}
            className="filter-mode__toggle"
          >
            <span className="filter-mode__knob" data-active={isOrMode} />
          </Toggle>
        </div>
      </div>
      
      <div className="filter-pills">
        {tags.map((tag) => (
          <div
            key={tag.name}
            className={`filter-pill group ${
              selectedTags.includes(tag.name)
                ? 'filter-pill--selected'
                : ''
            }`}
          >
            <button
              type="button"
              className="filter-pill__select"
              onClick={() => onTagToggle(tag.name)}
              aria-pressed={selectedTags.includes(tag.name)}
            >
              <span className={`filter-pill__dot ${selectedTags.includes(tag.name) ? 'bg-blue-500' : tag.color}`} aria-hidden="true" />
              <span>{tag.name}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onDeleteTag(tag.name);
              }}
              className="filter-pill__remove"
              aria-label={`Delete ${tag.name} tag`}
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        
        {/* Add New Tag Button */}
        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="filter-pill filter-pill--add"
        >
          <Plus className="w-3 h-3" />
          Add Tag
        </button>
      </div>

      {/* Add Tag Modal */}
      <AddTagModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleAddTag}
      />
    </section>
  );
}
