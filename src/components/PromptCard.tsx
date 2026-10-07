'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Heart, Copy, FileText, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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

export default function PromptCard({ prompt, onCopy, onToggleFavorite, onDeleteTag }: PromptCardProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [tagToDelete, setTagToDelete] = useState<string>('');

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
    <Card className="prompt-card">
      <CardHeader className="prompt-card__header">
        <div className="prompt-card__meta">
          <div className={`prompt-card__type ${prompt.isTemplate ? '' : 'prompt-card__type--placeholder'}`}>
            <FileText aria-hidden="true" />
            Template
          </div>
          {prompt.isTemplate && prompt.templateVars && prompt.templateVars.length > 0 && (
            <span className="text-[0.68rem] font-semibold text-slate-400">
              {prompt.templateVars.length} variable{prompt.templateVars.length === 1 ? '' : 's'}
            </span>
          )}
        </div>

        <div className="prompt-card__title-row">
          <Link href={`/prompt/${prompt.id}`} className="prompt-card__title-link">
            <CardTitle className="prompt-card__title">{prompt.title}</CardTitle>
          </Link>
          <div className="prompt-card__actions">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="prompt-card__action prompt-card__action--favorite"
              data-active={prompt.isFavorite}
              onClick={() => onToggleFavorite(prompt.id)}
              aria-label={prompt.isFavorite ? `Remove ${prompt.title} from favorites` : `Add ${prompt.title} to favorites`}
              title={prompt.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Heart aria-hidden="true" fill={prompt.isFavorite ? 'currentColor' : 'none'} />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="prompt-card__copy"
              onClick={() => onCopy(prompt.promptText)}
              aria-label={`Copy ${prompt.title}`}
            >
              <Copy aria-hidden="true" />
              复制
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="prompt-card__body">
        <p className={`prompt-card__description ${prompt.description ? '' : 'prompt-card__description--empty'}`}>
          {prompt.description || 'Prompt description'}
        </p>

        <div className="prompt-card__content">
          <p>{prompt.promptText}</p>
        </div>

        <div className="prompt-card__footer">
          <div className="prompt-card__tags" aria-label="Prompt tags">
            {prompt.tags.map((tag) => (
              <span key={tag} className="prompt-card__tag group">
                {tag}
                {onDeleteTag && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteTag(tag);
                    }}
                    className="prompt-card__tag-remove"
                    aria-label={`Remove ${tag} tag from ${prompt.title}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </span>
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
