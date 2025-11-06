'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { X, Plus } from 'lucide-react';
import { extractVariables, renderPrompt, hasVariables } from '@/utils/templateUtils';
import { toast } from 'sonner';

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

interface EditPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  prompt: Prompt;
  availableTags: Tag[];
  onSave: (updatedPrompt: Partial<Prompt>) => void;
}

export default function EditPromptModal({ 
  isOpen, 
  onClose, 
  prompt, 
  availableTags, 
  onSave 
}: EditPromptModalProps) {
  const [formData, setFormData] = useState({
    title: prompt.title,
    description: prompt.description || '',
    promptText: prompt.promptText,
  });

  const [selectedTags, setSelectedTags] = useState<string[]>(prompt.tags);
  const [selectedTag, setSelectedTag] = useState('');
  const [templateValues, setTemplateValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Extract variables from prompt text - memoized to prevent infinite loops
  const variables = useMemo(() => extractVariables(formData.promptText), [formData.promptText]);
  // Preserve original template status or detect from variables
  const isTemplate = useMemo(() => {
    // If the original prompt was a template, preserve that status
    if (prompt.isTemplate) {
      return true;
    }
    // Otherwise, detect from variables
    return hasVariables(formData.promptText);
  }, [prompt.isTemplate, formData.promptText]);

  // Reset form when prompt changes
  useEffect(() => {
    setFormData({
      title: prompt.title,
      description: prompt.description || '',
      promptText: prompt.promptText,
    });
    setSelectedTags(prompt.tags);
    setTemplateValues({});
    setErrors({});
  }, [prompt]);

  // Update template values when variables change
  // Use JSON.stringify to create a stable dependency since variables array changes reference on every render
  const variablesKey = useMemo(() => JSON.stringify([...variables].sort()), [variables]);
  
  useEffect(() => {
    if (isTemplate && variables.length > 0) {
      setTemplateValues(prev => {
        const newValues: Record<string, string> = {};
        let hasNewVariables = false;
        
        variables.forEach(variable => {
          if (!(variable in prev)) {
            newValues[variable] = '';
            hasNewVariables = true;
          }
        });
        
        // Only update state if there are actually new variables
        return hasNewVariables ? { ...prev, ...newValues } : prev;
      });
    }
  }, [variablesKey, isTemplate]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleTemplateValueChange = (variable: string, value: string) => {
    setTemplateValues(prev => ({ ...prev, [variable]: value }));
  };

  const addTag = () => {
    if (selectedTag && !selectedTags.includes(selectedTag) && selectedTags.length < 3) {
      setSelectedTags(prev => [...prev, selectedTag]);
      setSelectedTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setSelectedTags(prev => prev.filter(tag => tag !== tagToRemove));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.promptText.trim()) {
      newErrors.promptText = 'Prompt text is required';
    }

    if (isTemplate && !Object.values(templateValues).every(value => value.trim())) {
      newErrors.templateValues = 'All template variables must have values';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const updatedPrompt = {
      title: formData.title.trim(),
      description: formData.description.trim() || undefined,
      // For templates, preserve the template text (with variables), don't render it
      promptText: formData.promptText,
      tags: selectedTags,
      isTemplate: isTemplate,
      templateVars: isTemplate ? variables : undefined
    };

    onSave(updatedPrompt);
  };

  const handlePreview = () => {
    if (isTemplate) {
      const rendered = renderPrompt(formData.promptText, templateValues);
      navigator.clipboard.writeText(rendered);
      toast.success('Rendered prompt copied to clipboard!');
    } else {
      navigator.clipboard.writeText(formData.promptText);
      toast.success('Prompt copied to clipboard!');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-4xl mx-4 bg-white border-gray-200 shadow-xl max-h-[90vh] overflow-hidden">
        <CardHeader className="bg-white border-b border-gray-200">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-semibold text-gray-900">Edit Prompt</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="p-1 h-8 w-8 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="bg-white p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column - Form Fields */}
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Title *
                  </label>
                  <Input
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Enter prompt title"
                    className="border-gray-300 focus:border-teal-500 focus:ring-teal-500"
                  />
                  {errors.title && (
                    <p className="text-red-500 text-sm mt-1">{errors.title}</p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Description
                  </label>
                  <Input
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Enter prompt description (optional)"
                    className="border-gray-300 focus:border-teal-500 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Prompt Text *
                  </label>
                  <textarea
                    value={formData.promptText}
                    onChange={(e) => handleInputChange('promptText', e.target.value)}
                    placeholder="Enter your prompt text. Use ${variable} syntax for templates."
                    className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 resize-none"
                  />
                  {errors.promptText && (
                    <p className="text-red-500 text-sm mt-1">{errors.promptText}</p>
                  )}
                  {isTemplate && (
                    <p className="text-sm text-blue-600 mt-1">
                      Template detected with {variables.length} variable{variables.length !== 1 ? 's' : ''}: {variables.join(', ')}
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Tags (Max 3)
                  </label>
                  <div className="flex gap-2 mb-2">
                    <select
                      value={selectedTag}
                      onChange={(e) => setSelectedTag(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="">Select a tag</option>
                      {availableTags.map(tag => (
                        <option key={tag.name} value={tag.name}>
                          {tag.name}
                        </option>
                      ))}
                    </select>
                    <Button
                      type="button"
                      onClick={addTag}
                      variant="outline"
                      size="sm"
                      disabled={!selectedTag || selectedTags.includes(selectedTag) || selectedTags.length >= 3}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedTags.map(tag => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="cursor-pointer"
                        onClick={() => removeTag(tag)}
                      >
                        {tag} ×
                      </Badge>
                    ))}
                  </div>
                  {selectedTags.length >= 3 && (
                    <p className="text-sm text-gray-500 mt-1">Maximum 3 tags allowed</p>
                  )}
                </div>
              </div>

              {/* Right Column - Template Variables & Preview */}
              {isTemplate && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Template Variables</h3>
                  {variables.map(variable => (
                    <div key={variable}>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">
                        {variable}
                      </label>
                      <Input
                        value={templateValues[variable] || ''}
                        onChange={(e) => handleTemplateValueChange(variable, e.target.value)}
                        placeholder={`Enter value for ${variable}`}
                        className="border-gray-300 focus:border-teal-500 focus:ring-teal-500"
                      />
                    </div>
                  ))}
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Preview</h4>
                    <div className="bg-gray-50 p-3 rounded border border-gray-200 min-h-[100px] max-h-[200px] overflow-y-auto">
                      <pre className="text-sm text-gray-800 whitespace-pre-wrap">
                        {renderPrompt(formData.promptText, templateValues)}
                      </pre>
                    </div>
                    <Button
                      type="button"
                      onClick={handlePreview}
                      variant="outline"
                      size="sm"
                      className="mt-2"
                    >
                      Copy Preview
                    </Button>
                  </div>
                  
                  {errors.templateValues && (
                    <p className="text-red-500 text-sm">{errors.templateValues}</p>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-2 justify-end pt-4 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-teal-500 hover:bg-teal-600 text-white"
              >
                Save Changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
