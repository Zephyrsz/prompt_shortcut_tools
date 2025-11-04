'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { X, Plus, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { extractVariables, renderPrompt, hasVariables } from '@/utils/templateUtils';

interface Tag {
  name: string;
  color: string;
}

interface AddPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (prompt: Omit<Prompt, 'id' | 'createdAt' | 'updatedAt'>) => void;
  existingTags: Tag[];
}

interface Prompt {
  id: number;
  title: string;
  description?: string;
  promptText: string;
  tags: string[];
  isFavorite: boolean;
}

interface PromptFormData {
  title: string;
  description: string;
  promptText: string;
  tags: string[];
  isFavorite: boolean;
}

const AddPromptModal: React.FC<AddPromptModalProps> = ({
  isOpen,
  onClose,
  onSave,
  existingTags
}) => {
  const [formData, setFormData] = useState<PromptFormData>({
    title: '',
    description: '',
    promptText: '',
    tags: [],
    isFavorite: false
  });

  const [templateValues, setTemplateValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedTag, setSelectedTag] = useState('');

  // Extract variables from prompt text
  const variables = extractVariables(formData.promptText);
  const isTemplate = hasVariables(formData.promptText);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        title: '',
        description: '',
        promptText: '',
        tags: [],
        isFavorite: false
      });
      setSelectedTag('');
      setTemplateValues({});
      setErrors({});
    }
  }, [isOpen]);

  // Update template values when variables change
  useEffect(() => {
    if (isTemplate) {
      const newValues: Record<string, string> = {};
      variables.forEach(variable => {
        if (!(variable in templateValues)) {
          newValues[variable] = '';
        }
      });
      setTemplateValues(prev => ({ ...prev, ...newValues }));
    }
  }, [variables, isTemplate]);

  const handleInputChange = (field: keyof PromptFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const addTag = () => {
    if (selectedTag && !formData.tags.includes(selectedTag) && formData.tags.length < 3) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, selectedTag]
      }));
      setSelectedTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleTemplateValueChange = (variable: string, value: string) => {
    setTemplateValues(prev => ({ ...prev, [variable]: value }));
  };

  const validateForm = (): boolean => {
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

  const handleSave = () => {
    if (!validateForm()) {
      return;
    }

    const promptData: Omit<Prompt, 'id' | 'createdAt' | 'updatedAt'> = {
      title: formData.title.trim(),
      description: formData.description.trim() || undefined,
      promptText: isTemplate ? renderPrompt(formData.promptText, templateValues) : formData.promptText,
      tags: formData.tags,
      isFavorite: formData.isFavorite,
      isTemplate: isTemplate,
      templateVars: isTemplate ? variables : undefined
    };

    onSave(promptData);
    toast.success('Prompt added successfully!');
    onClose();
  };

  const handleCopyRendered = () => {
    const rendered = isTemplate ? renderPrompt(formData.promptText, templateValues) : formData.promptText;
    navigator.clipboard.writeText(rendered);
    toast.success('Rendered prompt copied to clipboard!');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">Add New Prompt</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Form */}
            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <Input
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Enter prompt title"
                  className={errors.title ? 'border-red-500' : ''}
                />
                {errors.title && (
                  <p className="text-red-500 text-sm mt-1">{errors.title}</p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <Input
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Enter prompt description"
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags (Max 3)
                </label>
                <div className="flex gap-2 mb-2">
                  <select
                    value={selectedTag}
                    onChange={(e) => setSelectedTag(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="">Select a tag</option>
                    {existingTags.map(tag => (
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
                    disabled={!selectedTag || formData.tags.includes(selectedTag) || formData.tags.length >= 3}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map(tagName => {
                    const tag = existingTags.find(t => t.name === tagName);
                    return (
                      <Badge
                        key={tagName}
                        variant="secondary"
                        className="cursor-pointer flex items-center gap-1"
                        onClick={() => removeTag(tagName)}
                      >
                        <div className={`w-2 h-2 rounded-full ${tag?.color || 'bg-gray-500'}`} />
                        {tagName} ×
                      </Badge>
                    );
                  })}
                </div>
                {formData.tags.length >= 3 && (
                  <p className="text-sm text-gray-500 mt-1">Maximum 3 tags allowed</p>
                )}
              </div>

              {/* Prompt Text */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prompt Text *
                </label>
                <textarea
                  value={formData.promptText}
                  onChange={(e) => handleInputChange('promptText', e.target.value)}
                  placeholder="Enter your prompt text. Use ${variable} syntax for templates."
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 h-32 resize-none ${
                    errors.promptText ? 'border-red-500' : 'border-gray-300'
                  }`}
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
            </div>

            {/* Right Column - Template Variables & Preview */}
            {isTemplate && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Template Variables</h3>
                
                {/* Variable Inputs */}
                <div className="space-y-3">
                  {variables.map(variable => (
                    <div key={variable}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {variable}
                      </label>
                      <Input
                        value={templateValues[variable] || ''}
                        onChange={(e) => handleTemplateValueChange(variable, e.target.value)}
                        placeholder={`Enter ${variable}`}
                      />
                    </div>
                  ))}
                </div>

                {/* Rendered Preview */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-gray-700">Rendered Preview</h4>
                    <Button
                      onClick={handleCopyRendered}
                      size="sm"
                      variant="outline"
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Copy
                    </Button>
                  </div>
                  <div className="bg-gray-50 border rounded-md p-3 min-h-[100px]">
                    <pre className="whitespace-pre-wrap text-sm text-gray-800">
                      {renderPrompt(formData.promptText, templateValues)}
                    </pre>
                  </div>
                </div>

                {errors.templateValues && (
                  <p className="text-red-500 text-sm">{errors.templateValues}</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
          <Button
            variant="outline"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="bg-teal-500 hover:bg-teal-600 text-white"
          >
            Save Prompt
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AddPromptModal;
