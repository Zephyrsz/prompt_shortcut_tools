'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, Copy, FileText, X } from 'lucide-react';

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

interface Tag {
  name: string;
  color: string;
}

interface PromptCardProps {
  prompt: Prompt;
  onCopy: (text: string) => void;
  onToggleFavorite: (id: number) => void;
  onDeleteTag?: (promptId: number, tag: string) => void;
  availableTags?: Tag[];
}

export default function PromptCard({ prompt, onCopy, onToggleFavorite, onDeleteTag, availableTags = [] }: PromptCardProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [tagToDelete, setTagToDelete] = useState<string>('');

  // Get the color for the first tag
  const getTagColor = (tagName: string) => {
    const tag = availableTags.find(t => t.name === tagName);
    return tag?.color || 'bg-gray-500';
  };

  const firstTagColor = prompt.tags.length > 0 ? getTagColor(prompt.tags[0]) : 'bg-gray-500';

  // Handle tag delete with confirmation
  const handleDeleteTag = (tag: string) => {
    setTagToDelete(tag);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteTag = () => {
    if (onDeleteTag) {
      onDeleteTag(prompt.id, tagToDelete);
    }
    setShowDeleteConfirm(false);
    setTagToDelete('');
  };

  const cancelDeleteTag = () => {
    setShowDeleteConfirm(false);
    setTagToDelete('');
  };
  return (
    <>
    <Card className="bg-gray-50 border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        {/* Template badge at top-left */}
        {prompt.isTemplate && (
          <div className="mb-2">
            <Badge variant="outline" className="text-xs px-2 py-1 bg-blue-50 text-blue-700 border-blue-200">
              <FileText className="h-3 w-3 mr-1" />
              Template
            </Badge>
          </div>
        )}
        
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Link href={`/prompt/${prompt.id}`}>
              <CardTitle className="text-lg font-semibold text-black hover:text-teal-600 cursor-pointer">
                {prompt.title}
              </CardTitle>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="p-1 h-8 w-8"
              onClick={() => onToggleFavorite(prompt.id)}
            >
              <Heart 
                className={`h-4 w-4 ${
                  prompt.isFavorite ? 'fill-pink-500 text-pink-500' : 'text-gray-400'
                }`} 
              />
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="bg-gray-200 text-gray-700 hover:bg-gray-300"
              onClick={() => onCopy(prompt.promptText)}
            >
              <Copy className="h-3 w-3 mr-1" />
              复制
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-start gap-2 mb-3">
          {!prompt.isTemplate && prompt.tags.length > 0 && (
            <div className={`w-4 h-4 ${firstTagColor} rounded-full flex-shrink-0 mt-0.5`} />
          )}
          <p className="text-sm text-gray-600 leading-relaxed">
            {prompt.description}
          </p>
        </div>
        
        <div className="space-y-2">
          <div className="bg-white p-3 rounded border border-gray-200">
            <p className="text-sm text-gray-800 leading-relaxed">
              {prompt.promptText}
            </p>
          </div>
          
          <div className="flex flex-wrap gap-1">
            {prompt.tags.map((tag) => (
              <Badge
                key={tag}
                variant="outline"
                className="text-xs px-2 py-1 bg-white border-gray-300 text-gray-600 flex items-center gap-1 group"
              >
                {tag}
                {onDeleteTag && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteTag(tag);
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-500"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>

    {/* Delete Confirmation Dialog */}
    {showDeleteConfirm && (
      <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex items-center justify-center z-50">
        <Card className="w-full max-w-md mx-4 bg-white border-gray-200 shadow-xl">
          <CardHeader className="bg-white border-b border-gray-200">
            <CardTitle className="text-lg font-semibold text-gray-900">Remove Tag</CardTitle>
          </CardHeader>
          <CardContent className="bg-white space-y-4 p-6">
            <p className="text-sm text-gray-700">
              Are you sure you want to remove the tag <strong>"{tagToDelete}"</strong> from this prompt?
            </p>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={cancelDeleteTag}
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </Button>
              <Button
                onClick={confirmDeleteTag}
                className="bg-teal-500 hover:bg-teal-600 text-white"
              >
                Remove
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )}

    </>
  );
}
