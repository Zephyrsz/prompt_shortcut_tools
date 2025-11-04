/**
 * Template utility functions for handling prompt templates with variable substitution
 */

/**
 * Extract variables from a template string using ${variable} syntax
 * @param template - The template string to parse
 * @returns Array of unique variable names found in the template
 */
export const extractVariables = (template: string): string[] => {
  const regex = /\$\{([\w\d_]+)\}/g;
  const matches = [];
  let match;
  while ((match = regex.exec(template)) !== null) {
    matches.push(match[1]);
  }
  return Array.from(new Set(matches)); // remove duplicates
};

/**
 * Render a template with provided values, replacing ${variable} placeholders
 * @param template - The template string
 * @param values - Object containing variable values
 * @returns Rendered string with variables substituted
 */
export const renderPrompt = (template: string, values: Record<string, string>): string => {
  return template.replace(/\$\{([\w\d_]+)\}/g, (_, key) => values[key] || '');
};

/**
 * Validate template syntax for common errors
 * @param template - The template string to validate
 * @returns Validation result with errors if any
 */
export const validateTemplate = (template: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  // Check for mismatched braces
  const openBraces = (template.match(/\$\{/g) || []).length;
  const closeBraces = (template.match(/\}/g) || []).length;
  
  if (openBraces !== closeBraces) {
    errors.push('Mismatched braces in template');
  }
  
  // Check for empty variable names
  const emptyVariables = template.match(/\$\{\s*\}/g);
  if (emptyVariables) {
    errors.push('Empty variable names found');
  }
  
  // Check for nested braces
  const nestedBraces = template.match(/\$\{[^}]*\$\{/g);
  if (nestedBraces) {
    errors.push('Nested braces are not allowed');
  }
  
  return { isValid: errors.length === 0, errors };
};

/**
 * Get all unique variables from multiple templates
 * @param templates - Array of template strings
 * @returns Array of unique variable names across all templates
 */
export const extractAllVariables = (templates: string[]): string[] => {
  const allVariables = templates.flatMap(template => extractVariables(template));
  return Array.from(new Set(allVariables));
};

/**
 * Check if a template contains any variables
 * @param template - The template string to check
 * @returns True if template contains variables, false otherwise
 */
export const hasVariables = (template: string): boolean => {
  return /\$\{[\w\d_]+\}/.test(template);
};

/**
 * Get a preview of the template with sample values
 * @param template - The template string
 * @param sampleValues - Optional sample values to use
 * @returns Preview string with sample values substituted
 */
export const getTemplatePreview = (template: string, sampleValues?: Record<string, string>): string => {
  const variables = extractVariables(template);
  const values: Record<string, string> = {};
  
  // Use provided sample values or generate defaults
  variables.forEach(variable => {
    values[variable] = sampleValues?.[variable] || `[${variable}]`;
  });
  
  return renderPrompt(template, values);
};

/**
 * Count the number of variables in a template
 * @param template - The template string
 * @returns Number of unique variables found
 */
export const countVariables = (template: string): number => {
  return extractVariables(template).length;
};

/**
 * Check if all required variables have values
 * @param template - The template string
 * @param values - Object containing variable values
 * @returns True if all variables have non-empty values
 */
export const isTemplateComplete = (template: string, values: Record<string, string>): boolean => {
  const variables = extractVariables(template);
  return variables.every(variable => values[variable] && values[variable].trim() !== '');
};

/**
 * Get missing variables that don't have values
 * @param template - The template string
 * @param values - Object containing variable values
 * @returns Array of variable names that are missing values
 */
export const getMissingVariables = (template: string, values: Record<string, string>): string[] => {
  const variables = extractVariables(template);
  return variables.filter(variable => !values[variable] || values[variable].trim() === '');
};

