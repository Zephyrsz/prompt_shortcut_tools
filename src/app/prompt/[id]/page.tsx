'use client';

import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Copy, ArrowLeft, Heart, X, Trash2, Edit } from 'lucide-react';
import Link from 'next/link';
import CopyButton from '@/components/CopyButton';
import EditPromptModal from '@/components/EditPromptModal';
import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { extractVariables, renderPrompt, hasVariables, isTemplateComplete, getMissingVariables } from '@/utils/templateUtils';
import { Input } from '@/components/ui/input';

interface Props {
  params: Promise<{ id: string }>;
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
  usageNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export default function PromptDetail({ params }: Props) {
  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [tagToDelete, setTagToDelete] = useState<string>('');
  const [showDeletePromptConfirm, setShowDeletePromptConfirm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [availableTags, setAvailableTags] = useState<Array<{name: string, color: string}>>([]);
  const [templateValues, setTemplateValues] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchPrompt = async () => {
      try {
        const { id } = await params;
        const promptId = parseInt(id);
        
        if (isNaN(promptId)) {
          notFound();
        }

        const response = await fetch(`/api/prompts/${promptId}`);
        if (response.ok) {
          const promptData = await response.json();
          setPrompt(promptData);
        } else {
          notFound();
        }
      } catch (error) {
        console.error('Error fetching prompt:', error);
        notFound();
      } finally {
        setLoading(false);
      }
    };

    fetchPrompt();
  }, [params]);

  // Handle tag delete with confirmation
  const handleDeleteTag = (tag: string) => {
    setTagToDelete(tag);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteTag = async () => {
    if (!prompt) return;
    
    try {
      const response = await fetch(`/api/prompts/${prompt.id}`, {
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
        setPrompt(updatedPrompt);
        toast.success(`Tag "${tagToDelete}" removed successfully!`);
      } else {
        throw new Error('Failed to remove tag');
      }
    } catch (error) {
      console.error('Error removing tag:', error);
      toast.error('Failed to remove tag');
    } finally {
      setShowDeleteConfirm(false);
      setTagToDelete('');
    }
  };

  const cancelDeleteTag = () => {
    setShowDeleteConfirm(false);
    setTagToDelete('');
  };

  // Handle prompt delete with confirmation
  const handleDeletePrompt = () => {
    setShowDeletePromptConfirm(true);
  };

  const confirmDeletePrompt = async () => {
    if (!prompt) return;
    
    try {
      const response = await fetch(`/api/prompts/${prompt.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Prompt removed successfully!');
        // Redirect to main page after successful deletion
        window.location.href = '/';
      } else {
        throw new Error('Failed to remove prompt');
      }
    } catch (error) {
      console.error('Error removing prompt:', error);
      toast.error('Failed to remove prompt');
    }
    
    setShowDeletePromptConfirm(false);
  };

  const cancelDeletePrompt = () => {
    setShowDeletePromptConfirm(false);
  };

  // Handle edit prompt
  const handleEditPrompt = () => {
    setShowEditModal(true);
  };

  const handleSaveEdit = async (updatedPrompt: Partial<Prompt>) => {
    if (!prompt) return;

    try {
      const response = await fetch(`/api/prompts/${prompt.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedPrompt),
      });

      if (response.ok) {
        const updated = await response.json();
        setPrompt(updated);
        setShowEditModal(false);
        toast.success('Prompt updated successfully!');
      } else {
        throw new Error('Failed to update prompt');
      }
    } catch (error) {
      console.error('Error updating prompt:', error);
      toast.error('Failed to update prompt');
    }
  };

  // Load available tags from API (database)
  useEffect(() => {
    const fetchTags = async () => {
      try {
        const res = await fetch('/api/tags');
        if (res.ok) {
          const dbTags: Array<{ name: string; color: string }> = await res.json();
          if (Array.isArray(dbTags)) {
            setAvailableTags(dbTags);
          }
        }
      } catch (error) {
        console.error('Error fetching tags:', error);
        setAvailableTags([]);
      }
    };
    fetchTags();
  }, []);

  // Template-related calculations - MUST be before early returns (Rules of Hooks)
  const isTemplate = prompt ? (prompt.isTemplate || hasVariables(prompt.promptText)) : false;
  const variables = useMemo(() => {
    if (!prompt) return [];
    if (prompt.templateVars && prompt.templateVars.length > 0) {
      return prompt.templateVars;
    }
    return extractVariables(prompt.promptText);
  }, [prompt?.templateVars, prompt?.promptText]);
  
  const renderedPrompt = useMemo(() => {
    if (!prompt) return '';
    if (isTemplate) {
      return renderPrompt(prompt.promptText, templateValues);
    }
    return prompt.promptText;
  }, [prompt?.promptText, templateValues, isTemplate]);

  const isComplete = prompt ? (isTemplate ? isTemplateComplete(prompt.promptText, templateValues) : true) : true;
  const missingVariables = prompt && isTemplate ? getMissingVariables(prompt.promptText, templateValues) : [];

  // Create a stable key for variables to track changes
  const variablesKey = useMemo(() => JSON.stringify([...variables].sort()), [variables]);

  // Initialize template values when prompt changes
  useEffect(() => {
    if (prompt && isTemplate && variables.length > 0) {
      setTemplateValues(prev => {
        const newValues: Record<string, string> = {};
        variables.forEach(variable => {
          // Preserve existing values if variable still exists, otherwise initialize empty
          newValues[variable] = prev[variable] || '';
        });
        return newValues;
      });
    } else {
      setTemplateValues({});
    }
  }, [prompt?.id, isTemplate, variablesKey]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading prompt...</p>
        </div>
      </div>
    );
  }

  if (!prompt) {
    notFound();
  }

  const handleTemplateValueChange = (variable: string, value: string) => {
    setTemplateValues(prev => ({ ...prev, [variable]: value }));
  };

  const handleCopyRendered = () => {
    navigator.clipboard.writeText(renderedPrompt);
    toast.success('Rendered prompt copied to clipboard!');
  };


  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <Link href="/">
            <Button variant="outline" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Prompts
            </Button>
          </Link>
        </div>

        {/* Prompt Detail Card */}
        <Card className="max-w-4xl mx-auto">
          <CardHeader className="pb-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-3xl font-bold text-black mb-2">
                  {prompt.title}
                </CardTitle>
                {prompt.description && (
                  <p className="text-lg text-gray-600 mb-4">
                    {prompt.description}
                  </p>
                )}
                <div className="flex flex-wrap gap-2 mb-4">
                  {prompt.tags.map((tag: string) => (
                    <Badge
                      key={tag}
                      variant="default"
                      className="px-3 py-1 bg-teal-500 text-white flex items-center gap-1 group"
                    >
                      {tag}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTag(tag);
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-200"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="p-2"
                >
                  <Heart 
                    className={`h-5 w-5 ${
                      prompt.isFavorite ? 'fill-pink-500 text-pink-500' : 'text-gray-400'
                    }`} 
                  />
                </Button>
                <Button
                  onClick={handleEditPrompt}
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                {isTemplate ? (
                  <Button
                    onClick={handleCopyRendered}
                    className="bg-teal-500 hover:bg-teal-600 text-white"
                    disabled={!isComplete}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Rendered
                  </Button>
                ) : (
                  <CopyButton
                    text={prompt.promptText}
                    className="bg-teal-500 hover:bg-teal-600 text-white"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Prompt
                  </CopyButton>
                )}
                <Button
                  onClick={handleDeletePrompt}
                  className="bg-red-500 hover:bg-red-600 text-white"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Prompt
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-4">
              {/* Template Text Section */}
              <div>
                <h3 className="text-lg font-semibold text-black mb-2">
                  Template Text
                  {isTemplate && (
                    <span className="ml-2 text-sm text-blue-600 font-normal">
                      ({variables.length} variable{variables.length !== 1 ? 's' : ''})
                    </span>
                  )}
                </h3>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <pre className="whitespace-pre-wrap text-sm text-gray-800 leading-relaxed">
                    {prompt.promptText}
                  </pre>
                </div>
                {isTemplate && variables.length > 0 && (
                  <p className="mt-2 text-sm text-blue-600">
                    Variables: {variables.join(', ')}
                  </p>
                )}
              </div>

              {/* Template Variables Section - Only show for templates */}
              {isTemplate && variables.length > 0 && (
                <div className="space-y-3 border-t border-gray-200 pt-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-black">
                      Template Variables
                    </h3>
                    <div className="flex items-center gap-2 text-sm">
                      {isComplete ? (
                        <span className="text-green-600">✓ Complete</span>
                      ) : (
                        <span className="text-orange-600">
                          Missing: {missingVariables.join(', ')}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {variables.map(variable => (
                      <div key={variable}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {variable}
                        </label>
                        <Input
                          value={templateValues[variable] || ''}
                          onChange={(e) => handleTemplateValueChange(variable, e.target.value)}
                          placeholder={`Enter ${variable}`}
                          className="border-gray-300 focus:border-teal-500 focus:ring-teal-500"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Rendered Preview Section - Only show for templates */}
              {isTemplate && (
                <div className="space-y-2 border-t border-gray-200 pt-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-black">
                      Rendered Preview
                    </h3>
                    <Button
                      onClick={handleCopyRendered}
                      size="sm"
                      variant="outline"
                      disabled={!isComplete}
                      className="border-gray-300"
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Copy
                    </Button>
                  </div>
                  
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 min-h-[100px]">
                    <pre className="whitespace-pre-wrap text-sm text-gray-800 leading-relaxed">
                      {renderedPrompt}
                    </pre>
                  </div>
                  
                  <div className="text-xs text-gray-500">
                    {isComplete ? (
                      <span className="text-green-600">✓ Ready to use</span>
                    ) : (
                      <span className="text-orange-600">Fill in all variables to see the rendered result</span>
                    )}
                  </div>
                </div>
              )}
              
              {prompt.usageNotes && (
                <div>
                  <h3 className="text-lg font-semibold text-black mb-2">
                    Usage Notes
                  </h3>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800 leading-relaxed">
                      {prompt.usageNotes}
                    </p>
                  </div>
                </div>
              )}
              
              <div className="text-xs text-gray-500 pt-4 border-t border-gray-200">
                <p>Created: {new Date(prompt.createdAt).toLocaleDateString()}</p>
                <p>Last updated: {new Date(prompt.updatedAt).toLocaleDateString()}</p>
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

        {/* Delete Prompt Confirmation Dialog */}
        {showDeletePromptConfirm && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md mx-4 bg-white border-gray-200 shadow-xl">
              <CardHeader className="bg-white border-b border-gray-200">
                <CardTitle className="text-lg font-semibold text-gray-900">Remove Prompt</CardTitle>
              </CardHeader>
              <CardContent className="bg-white space-y-4 p-6">
                <p className="text-sm text-gray-700">
                  Are you sure you want to remove the prompt <strong>"{prompt?.title}"</strong>? This action cannot be undone.
                </p>
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    onClick={cancelDeletePrompt}
                    className="border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={confirmDeletePrompt}
                    className="bg-red-500 hover:bg-red-600 text-white"
                  >
                    Remove
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Edit Prompt Modal */}
        {prompt && (
          <EditPromptModal
            isOpen={showEditModal}
            onClose={() => setShowEditModal(false)}
            prompt={prompt}
            availableTags={availableTags}
            onSave={handleSaveEdit}
          />
        )}
      </div>
    </div>
  );
}
