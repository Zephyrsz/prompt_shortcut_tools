'use client';

import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { Plus, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Header from '@/components/Header';
import FiltersSection from '@/components/FiltersSection';
import FavoritesSection from '@/components/FavoritesSection';
import PromptCard from '@/components/PromptCard';
import AddPromptModal from '@/components/AddPromptModal';

interface Tag {
  id: number;
  name: string;
  color: string;
}

interface Prompt {
  id: number;
  title: string;
  description?: string;
  promptText: string;
  tags: string[];
  isFavorite: boolean;
  isTemplate?: boolean;
  templateVars?: string[] | null;
}

export default function Home() {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isOrMode, setIsOrMode] = useState(true);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [tags, setTags] = useState<Tag[]>([]);

  // Fetch prompts on component mount
  useEffect(() => {
    const fetchPrompts = async () => {
      try {
        const response = await fetch('/api/prompts');
        const data = await response.json();
        setPrompts(data);
      } catch (error) {
        console.error('Error fetching prompts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPrompts();
  }, []);

  // Load tags from API (persisted) - ONLY use database tags
  const fetchTags = async () => {
    try {
      const res = await fetch('/api/tags');
      if (res.ok) {
        const dbTags: Array<{ id: number; name: string; color: string }> = await res.json();
        
        if (Array.isArray(dbTags)) {
          // ONLY use tags from database
          console.log('Tags loaded from database:', dbTags.length);
          setTags(dbTags);
        } else {
          // Empty array if not an array
          setTags([]);
        }
      } else {
        console.error('Failed to fetch tags from API:', res.status);
        setTags([]);
      }
    } catch (error) {
      console.error('Error fetching tags:', error);
      setTags([]);
    }
  };

  useEffect(() => {
    fetchTags();
  }, []);

  // Filter prompts based on search query and selected categories
  const filteredPrompts = useMemo(() => {
    let filtered = prompts;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(prompt =>
        prompt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prompt.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prompt.promptText.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prompt.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (prompt.templateVars && prompt.templateVars.some(variable => 
          variable.toLowerCase().includes(searchQuery.toLowerCase())
        ))
      );
    }

    // Apply tag filter
    if (selectedTags.length > 0) {
      if (isOrMode) {
        // OR mode: show prompts that match ANY selected tag
        filtered = filtered.filter(prompt =>
          selectedTags.some(tag => 
            prompt.tags.includes(tag)
          )
        );
      } else {
        // AND mode: show prompts that match ALL selected tags
        filtered = filtered.filter(prompt =>
          selectedTags.every(tag => 
            prompt.tags.includes(tag)
          )
        );
      }
    }
    return filtered;
  }, [prompts, searchQuery, selectedTags, isOrMode]);

  // Get favorite prompts
  const favoritePrompts = useMemo(() => {
    return prompts.filter(prompt => prompt.isFavorite);
  }, [prompts]);

  // Separate regular prompts and templates
  const regularPrompts = useMemo(() => 
    filteredPrompts.filter(prompt => !prompt.isTemplate), 
    [filteredPrompts]
  );

  const templates = useMemo(() => 
    filteredPrompts.filter(prompt => prompt.isTemplate), 
    [filteredPrompts]
  );

  // Get tags for the modal - use the same tags as the filter section (state)
  const existingTags = useMemo(() => tags, [tags]);

  // Handle tag toggle
  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  // Handle copy to clipboard
  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Prompt copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy text: ', error);
      toast.error('Failed to copy to clipboard');
    }
  };

  // Handle favorite toggle
  const handleToggleFavorite = async (id: number) => {
    try {
      const prompt = prompts.find(p => p.id === id);
      if (!prompt) return;

      const response = await fetch('/api/prompts', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id,
          isFavorite: !prompt.isFavorite,
        }),
      });

      if (response.ok) {
        setPrompts(prev =>
          prev.map(p =>
            p.id === id ? { ...p, isFavorite: !p.isFavorite } : p
          )
        );
        const prompt = prompts.find(p => p.id === id);
        if (prompt) {
          toast.success(prompt.isFavorite ? 'Removed from favorites' : 'Added to favorites');
        }
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  // Handle adding new prompt
  const handleAddPrompt = async (promptData: Omit<Prompt, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const response = await fetch('/api/prompts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(promptData),
      });

      if (response.ok) {
        const newPrompt = await response.json();
        setPrompts(prev => [newPrompt, ...prev]);
        toast.success('Prompt added successfully!');
      } else {
        throw new Error('Failed to add prompt');
      }
    } catch (error) {
      console.error('Error adding prompt:', error);
      toast.error('Failed to add prompt');
    }
  };

  // Handle adding new tag (persist via API; fallback to local-only)
  const handleAddTag = async (tag: Omit<Tag, 'id'>) => {
    try {
      const res = await fetch('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tag),
      });
      if (!res.ok) {
        throw new Error('Failed to save tag');
      }
      const saved = await res.json();
      setTags(prev => [...prev, { id: saved.id, name: saved.name, color: saved.color }]);
      toast.success(`Tag "${tag.name}" added successfully!`);
    } catch (e) {
      // Still reflect in UI, but warn it's not persisted
      setTags(prev => [...prev, { ...tag, id: -Date.now() }]);
      toast.warning(`Tag "${tag.name}" added locally. Persistence failed; please check API/DB.`);
    }
  };

  // Handle deleting tag from filter section
  const handleDeleteTagFromFilter = async (tagName: string) => {
    try {
      // Find the tag object to get its ID
      const tagToDelete = tags.find(tag => tag.name === tagName);
      
      if (!tagToDelete) {
        toast.error('Tag not found');
        return;
      }

      // First, always show confirmation dialog
      const confirmed = window.confirm(
        `Are you sure you want to delete the tag "${tagName}"?`
      );

      if (!confirmed) {
        return;
      }

      // Check if tag is still in use by any prompts
      const promptsUsingTag = prompts.filter(prompt => 
        prompt.tags.includes(tagName)
      );

      if (promptsUsingTag.length > 0) {
        // Show alert that prevents deletion
        alert(
          `Cannot delete tag "${tagName}"!\n\n` +
          `This tag is currently used by ${promptsUsingTag.length} prompt(s).\n\n` +
          `Please remove this tag from all prompts first before deleting it from the filter list.\n\n` +
          `You can remove the tag by:\n` +
          `1. Going to each prompt that uses this tag\n` +
          `2. Clicking the X button on the tag in the prompt card\n` +
          `3. Then coming back here to delete the tag from the filter list`
        );
        return;
      }

      // All tags come from database now, so they should all have positive IDs
      if (tagToDelete.id <= 0) {
        console.error('Invalid tag ID:', tagToDelete.id);
        toast.error('Invalid tag - cannot delete');
        return;
      }

      // Tag exists in database - delete it via API
      console.log('Deleting tag from database:', { id: tagToDelete.id, name: tagName });
      const response = await fetch(`/api/tags/${tagToDelete.id}`, {
        method: 'DELETE',
      });

      console.log('Delete response status:', response.status, response.ok);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Delete failed:', errorData);
        throw new Error(errorData.error || 'Failed to delete tag');
      }

      // Verify deletion was successful by checking the response
      const result = await response.json().catch(() => ({}));
      console.log('Delete response:', result);

      // Refresh tags from database to ensure sync
      await fetchTags();
      
      // Also update local state immediately
      setSelectedTags(prev => prev.filter(tag => tag !== tagName));
      toast.success(`Tag "${tagName}" deleted successfully from database!`);
      console.log('Tag deleted successfully from database');
    } catch (error) {
      console.error('Error deleting tag:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete tag';
      
      // Check if it's a "tag in use" error
      if (errorMessage.includes('currently used by')) {
        alert(errorMessage);
      } else {
        toast.error(errorMessage);
      }
    }
  };

  // Handle deleting a tag from a prompt
  const handleDeleteTag = async (promptId: number, tagToDelete: string) => {
    try {
      const response = await fetch(`/api/prompts/${promptId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'removeTag',
          tag: tagToDelete
        }),
      });

      if (response.ok) {
        const updatedPrompt = await response.json();
        setPrompts(prev => prev.map(p => p.id === promptId ? updatedPrompt : p));
        toast.success(`Tag "${tagToDelete}" removed successfully!`);
      } else {
        throw new Error('Failed to remove tag');
      }
    } catch (error) {
      console.error('Error removing tag:', error);
      toast.error('Failed to remove tag');
    }
  };

  // Handle deleting a prompt
  const handleDeletePrompt = async (promptId: number) => {
    try {
      const response = await fetch(`/api/prompts/${promptId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setPrompts(prev => prev.filter(p => p.id !== promptId));
        toast.success('Prompt removed successfully!');
      } else {
        throw new Error('Failed to remove prompt');
      }
    } catch (error) {
      console.error('Error removing prompt:', error);
      toast.error('Failed to remove prompt');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading prompts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <Header />
          <div className="flex gap-3">
            <Link href="/template">
              <Button
                className="bg-teal-500 hover:bg-teal-600 text-white flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                Add New Template
              </Button>
            </Link>
            <Button
              onClick={() => setIsAddModalOpen(true)}
              className="bg-teal-500 hover:bg-teal-600 text-white flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add New Prompt
            </Button>
          </div>
        </div>
        
        <FiltersSection
          selectedTags={selectedTags}
          onTagToggle={handleTagToggle}
          onDeleteTag={handleDeleteTagFromFilter}
          isOrMode={isOrMode}
          onToggleMode={() => setIsOrMode(!isOrMode)}
          totalPrompts={prompts.length}
          tags={tags}
          onAddTag={handleAddTag}
        />
        

        <FavoritesSection
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          favoritePrompts={favoritePrompts}
          onCopy={handleCopy}
          onToggleFavorite={handleToggleFavorite}
        />

        {/* Matched Prompts Section */}
        <div className="mb-8">
          {(() => {
            const hasActiveFilters = searchQuery.trim().length > 0 || selectedTags.length > 0;
            const sectionTitle = hasActiveFilters 
              ? `Matched Prompts (${regularPrompts.length})` 
              : `All Prompts (${regularPrompts.length})`;
            
            return (
              <>
                <h2 className="text-2xl font-bold text-black mb-6">{sectionTitle}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {regularPrompts.map((prompt) => (
                    <PromptCard
                      key={prompt.id}
                      prompt={prompt}
                      onCopy={handleCopy}
                      onToggleFavorite={handleToggleFavorite}
                      onDeleteTag={handleDeleteTag}
                      availableTags={tags}
                    />
                  ))}
                </div>
                
                {regularPrompts.length === 0 && filteredPrompts.length > 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No regular prompts found matching your criteria.
                  </div>
                )}
              </>
            );
          })()}
        </div>

        {/* Templates Section */}
        {templates.length > 0 && (
          <div className="mb-8">
            {(() => {
              const hasActiveFilters = searchQuery.trim().length > 0 || selectedTags.length > 0;
              const sectionTitle = hasActiveFilters 
                ? `Matched Templates (${templates.length})` 
                : `Templates (${templates.length})`;
              
              return (
                <>
                  <h2 className="text-2xl font-bold text-black mb-6">{sectionTitle}</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {templates.map((template) => (
                      <PromptCard
                        key={template.id}
                        prompt={template}
                        onCopy={handleCopy}
                        onToggleFavorite={handleToggleFavorite}
                        onDeleteTag={handleDeleteTag}
                        availableTags={tags}
                      />
                    ))}
                  </div>
                </>
              );
            })()}
          </div>
        )}

        {/* No results message */}
        {filteredPrompts.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No prompts found matching your criteria.
          </div>
        )}

        {/* Add Prompt Modal */}
        <AddPromptModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSave={handleAddPrompt}
          existingTags={existingTags}
        />
      </div>
    </div>
  );
}
