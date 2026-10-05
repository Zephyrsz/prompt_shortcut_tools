'use client';

import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Toggle } from '@/components/ui/toggle';
import { Button } from '@/components/ui/button';
import { Plus, X } from 'lucide-react';
import AddTagModal from './AddTagModal';

interface Tag {
  id: number;
  name: string;
  color: string;
}

interface FiltersSectionProps {
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
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold text-black">Filters</h2>
          <span className="text-sm text-gray-600">{totalPrompts} prompts</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">OR</span>
          <Toggle
            pressed={isOrMode}
            onPressedChange={onToggleMode}
            className={`w-12 h-6 rounded-full transition-colors ${
              isOrMode ? 'bg-teal-500' : 'bg-gray-300'
            }`}
          >
            <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
              isOrMode ? 'translate-x-6' : 'translate-x-0'
            }`} />
          </Toggle>
        </div>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
        {tags.map((tag) => (
          <div
            key={tag.name}
            className={`cursor-pointer flex items-center gap-2 px-3 py-2 rounded-full text-xs font-semibold transition-colors group ${
              selectedTags.includes(tag.name)
                ? 'bg-teal-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            onClick={() => onTagToggle(tag.name)}
          >
            <div className={`w-2 h-2 rounded-full ${selectedTags.includes(tag.name) ? 'bg-white' : tag.color}`} />
            <span className="flex-1">{tag.name}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteTag(tag.name);
              }}
              className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-500"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        
        {/* Add New Tag Button */}
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="cursor-pointer flex items-center gap-2 px-3 py-2 rounded-full text-xs font-semibold transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-dashed border-gray-300 hover:border-gray-400"
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
    </div>
  );
}
