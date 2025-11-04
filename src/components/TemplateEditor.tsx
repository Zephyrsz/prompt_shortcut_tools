'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Copy, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { 
  extractVariables, 
  renderPrompt, 
  hasVariables, 
  validateTemplate,
  isTemplateComplete,
  getMissingVariables 
} from '@/utils/templateUtils';

interface TemplateEditorProps {
  template: string;
  onTemplateChange: (template: string) => void;
  initialValues?: Record<string, string>;
  onValuesChange?: (values: Record<string, string>) => void;
  showPreview?: boolean;
  showVariables?: boolean;
  className?: string;
}

const TemplateEditor: React.FC<TemplateEditorProps> = ({
  template,
  onTemplateChange,
  initialValues = {},
  onValuesChange,
  showPreview = true,
  showVariables = true,
  className = ''
}) => {
  const [templateValues, setTemplateValues] = useState<Record<string, string>>(initialValues);
  const [showPreviewPanel, setShowPreviewPanel] = useState(showPreview);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Extract variables from template
  const variables = useMemo(() => extractVariables(template), [template]);
  const isTemplate = hasVariables(template);
  const validation = useMemo(() => validateTemplate(template), [template]);

  // Update template values when variables change
  useEffect(() => {
    if (isTemplate) {
      const newValues: Record<string, string> = { ...templateValues };
      variables.forEach(variable => {
        if (!(variable in newValues)) {
          newValues[variable] = '';
        }
      });
      setTemplateValues(newValues);
      onValuesChange?.(newValues);
    }
  }, [variables, isTemplate]);

  // Update validation errors
  useEffect(() => {
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
    } else {
      setValidationErrors([]);
    }
  }, [validation]);

  const handleTemplateValueChange = (variable: string, value: string) => {
    const newValues = { ...templateValues, [variable]: value };
    setTemplateValues(newValues);
    onValuesChange?.(newValues);
  };

  const handleCopyRendered = () => {
    const rendered = renderPrompt(template, templateValues);
    navigator.clipboard.writeText(rendered);
    toast.success('Rendered prompt copied to clipboard!');
  };

  const isComplete = isTemplateComplete(template, templateValues);
  const missingVariables = getMissingVariables(template, templateValues);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Template Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Template Text
          {isTemplate && (
            <span className="ml-2 text-xs text-blue-600">
              ({variables.length} variable{variables.length !== 1 ? 's' : ''})
            </span>
          )}
        </label>
        <textarea
          value={template}
          onChange={(e) => onTemplateChange(e.target.value)}
          placeholder="Enter your template text. Use ${variable} syntax for variables."
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 h-32 resize-none ${
            validationErrors.length > 0 ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {validationErrors.length > 0 && (
          <div className="mt-2 text-sm text-red-600">
            {validationErrors.map((error, index) => (
              <div key={index}>• {error}</div>
            ))}
          </div>
        )}
        {isTemplate && (
          <div className="mt-2 text-sm text-blue-600">
            Variables: {variables.join(', ')}
          </div>
        )}
      </div>

      {/* Variables Section */}
      {isTemplate && showVariables && variables.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-700">Template Variables</h4>
            <div className="flex items-center gap-2 text-xs">
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
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  {variable}
                </label>
                <Input
                  value={templateValues[variable] || ''}
                  onChange={(e) => handleTemplateValueChange(variable, e.target.value)}
                  placeholder={`Enter ${variable}`}
                  className="text-sm"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Preview Section */}
      {showPreview && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-700">Rendered Preview</h4>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setShowPreviewPanel(!showPreviewPanel)}
                variant="ghost"
                size="sm"
                className="h-6 px-2"
              >
                {showPreviewPanel ? (
                  <EyeOff className="h-3 w-3" />
                ) : (
                  <Eye className="h-3 w-3" />
                )}
              </Button>
              <Button
                onClick={handleCopyRendered}
                size="sm"
                variant="outline"
                className="h-6 px-2"
              >
                <Copy className="h-3 w-3 mr-1" />
                Copy
              </Button>
            </div>
          </div>
          
          {showPreviewPanel && (
            <div className="bg-gray-50 border rounded-md p-3 min-h-[100px]">
              <pre className="whitespace-pre-wrap text-sm text-gray-800">
                {renderPrompt(template, templateValues)}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Template Info */}
      {isTemplate && (
        <div className="text-xs text-gray-500 space-y-1">
          <div>Template detected with {variables.length} variable{variables.length !== 1 ? 's' : ''}</div>
          <div>Status: {isComplete ? 'Ready to use' : 'Fill in all variables'}</div>
        </div>
      )}
    </div>
  );
};

export default TemplateEditor;
