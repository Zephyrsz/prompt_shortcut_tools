'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Save, Copy, X, Plus } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import TemplateEditor from '@/components/TemplateEditor';
import { extractVariables, renderPrompt } from '@/utils/templateUtils';

export default function TemplatePage() {
  const [template, setTemplate] = useState(`I'm a analysis developer, and I want to develop a sql requirement as below:
\${sql_requirement}
the database syntax is 
\${data_type}

Please provide the SQL query and explain the logic.`);
  
  const [templateValues, setTemplateValues] = useState<Record<string, string>>({});
  const [savedTemplates, setSavedTemplates] = useState<Array<{
    id: string;
    name: string;
    template: string;
    variables: string[];
  }>>([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<Array<{ id: number; name: string; color: string }>>([]);
  const [selectedTag, setSelectedTag] = useState('');

  const variables = extractVariables(template);
  const renderedPrompt = renderPrompt(template, templateValues);

  // Fetch available tags and templates on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch tags from database (same as main page)
        const tagsResponse = await fetch('/api/tags');
        if (tagsResponse.ok) {
          const dbTags = await tagsResponse.json();
          if (Array.isArray(dbTags)) {
            setAvailableTags(dbTags);
          }
        }

        // Fetch all prompts to get templates
        const promptsResponse = await fetch('/api/prompts');
        const prompts = await promptsResponse.json();
        
        // Filter and set templates (prompts with isTemplate: true)
        const templates = prompts
          .filter((p: any) => p.isTemplate)
          .map((p: any) => ({
            id: p.id.toString(),
            name: p.title,
            template: p.promptText,
            variables: p.templateVars || [],
          }));
        setSavedTemplates(templates);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setTemplatesLoading(false);
      }
    };
    fetchData();
  }, []);

  // Add tag function
  const addTag = () => {
    if (selectedTag && !selectedTags.includes(selectedTag) && selectedTags.length < 3) {
      setSelectedTags(prev => [...prev, selectedTag]);
      setSelectedTag('');
    }
  };

  // Remove tag function
  const removeTag = (tagToRemove: string) => {
    setSelectedTags(prev => prev.filter(tag => tag !== tagToRemove));
  };

  const handleSaveTemplate = () => {
    console.log('Save template clicked');
    setShowSaveModal(true);
  };

  const handleConfirmSave = async () => {
    console.log('Confirm save clicked, templateName:', templateName);
    if (templateName.trim()) {
      const newTemplateData = {
        title: templateName.trim(),
        promptText: template,
        tags: selectedTags,
        isFavorite: false,
        isTemplate: true,
        templateVars: variables,
      };

      try {
        const response = await fetch('/api/prompts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newTemplateData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to save template to database');
        }

        const savedPrompt = await response.json();
        console.log('Template saved to DB:', savedPrompt);

        // Also update local state for immediate feedback on this page
        const newLocalTemplate = {
          id: savedPrompt.id.toString(),
          name: savedPrompt.title,
          template: savedPrompt.promptText,
          variables: savedPrompt.templateVars || [],
        };
        setSavedTemplates(prev => [...prev, newLocalTemplate]);

        setTemplateName('');
        setSelectedTags([]);
        setSelectedTag('');
        setShowSaveModal(false);
        toast.success('Template saved successfully!');
      } catch (error: any) {
        console.error('Error saving template:', error);
        toast.error(`Failed to save template: ${error.message}`);
      }
    } else {
      toast.error('Please enter a template name');
    }
  };

  const handleCancelSave = () => {
    setTemplateName('');
    setSelectedTags([]);
    setSelectedTag('');
    setShowSaveModal(false);
  };

  const handleLoadTemplate = (savedTemplate: typeof savedTemplates[0]) => {
    setTemplate(savedTemplate.template);
    setTemplateValues({});
    toast.success(`Loaded template: ${savedTemplate.name}`);
  };

  const handleDeleteTemplate = async (templateId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent loading the template when clicking delete
    
    // Confirm deletion
    const confirmed = window.confirm('Are you sure you want to delete this template?');
    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(`/api/prompts/${templateId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Update local state after successful deletion
        setSavedTemplates(prev => prev.filter(t => t.id !== templateId));
        toast.success('Template deleted successfully!');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete template');
      }
    } catch (error) {
      console.error('Error deleting template:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete template';
      toast.error(errorMessage);
    }
  };

  const handleCopyRendered = () => {
    navigator.clipboard.writeText(renderedPrompt);
    toast.success('Rendered prompt copied to clipboard!');
  };

  return (
    <div className="app-shell">
      <div className="app-container">
        {/* Header */}
        <header className="app-header">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="outline" size="sm" className="app-button">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Prompts
              </Button>
            </Link>
            <div>
              <h1 className="brand-title text-2xl">Template Editor</h1>
              <p className="brand-subtitle">Create and test prompt templates with variables</p>
            </div>
          </div>
          <div className="header-actions">
            <Button
              onClick={handleSaveTemplate}
              variant="outline"
              className="app-button flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              Save Template
            </Button>
            <Button
              onClick={handleCopyRendered}
              className="app-button app-button--primary flex items-center gap-2"
            >
              <Copy className="h-4 w-4" />
              Copy Rendered
            </Button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Editor */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Template Editor</CardTitle>
              </CardHeader>
              <CardContent>
                <TemplateEditor
                  template={template}
                  onTemplateChange={setTemplate}
                  initialValues={templateValues}
                  onValuesChange={setTemplateValues}
                  showPreview={true}
                  showVariables={true}
                />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Saved Templates */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Saved Templates</CardTitle>
              </CardHeader>
              <CardContent>
                {savedTemplates.length === 0 ? (
                  <p className="text-sm text-gray-500">No saved templates yet</p>
                ) : (
                  <div className="space-y-2">
                    {savedTemplates.map(savedTemplate => (
                      <div
                        key={savedTemplate.id}
                        className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer group"
                        onClick={() => handleLoadTemplate(savedTemplate)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="font-medium text-sm">{savedTemplate.name}</div>
                            <div className="text-xs text-gray-500">
                              {savedTemplate.variables.length} variable{savedTemplate.variables.length !== 1 ? 's' : ''}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => handleDeleteTemplate(savedTemplate.id, e)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Template Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Template Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="text-sm font-medium text-gray-700">Variables Found</div>
                  <div className="text-sm text-gray-600">
                    {variables.length > 0 ? variables.join(', ') : 'None'}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-700">Template Length</div>
                  <div className="text-sm text-gray-600">{template.length} characters</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-700">Rendered Length</div>
                  <div className="text-sm text-gray-600">{renderedPrompt.length} characters</div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Examples */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Examples</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start text-left"
                    onClick={() => setTemplate(`Act as a \${role} and help me with \${task}. The context is \${context}.`)}
                  >
                    Role-based Prompt
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start text-left"
                    onClick={() => setTemplate(`Write a \${type} about \${topic} in \${style} style. Target audience: \${audience}.`)}
                  >
                    Content Creation
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start text-left"
                    onClick={() => setTemplate(`Analyze this \${data_type}: \${data}. Focus on \${analysis_type} and provide \${output_format}.`)}
                  >
                    Data Analysis
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Save Template Modal */}
        {showSaveModal && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md mx-4 bg-white border-gray-200 shadow-xl">
              <CardHeader className="bg-white border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold text-gray-900">Save Template</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCancelSave}
                    className="p-1 h-8 w-8 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="bg-white space-y-4 p-6">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Template Name
                  </label>
                  <Input
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    placeholder="Enter a name for this template"
                    autoFocus
                    className="border-gray-300 focus:border-teal-500 focus:ring-teal-500"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleConfirmSave();
                      } else if (e.key === 'Escape') {
                        handleCancelSave();
                      }
                    }}
                  />
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
                        <option key={tag.id} value={tag.name}>
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
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    onClick={handleCancelSave}
                    className="border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleConfirmSave}
                    className="bg-teal-500 hover:bg-teal-600 text-white"
                  >
                    Save Template
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
