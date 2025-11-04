'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Palette } from 'lucide-react';
import { toast } from 'sonner';

interface AddTagModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (tag: { name: string; color: string }) => void;
}

const colorOptions = [
  { name: 'Yellow', value: 'bg-yellow-500' },
  { name: 'Orange', value: 'bg-orange-500' },
  { name: 'Red', value: 'bg-red-500' },
  { name: 'Teal', value: 'bg-teal-500' },
  { name: 'Purple', value: 'bg-purple-500' },
  { name: 'Gray', value: 'bg-gray-600' },
  { name: 'Blue', value: 'bg-blue-500' },
  { name: 'Green', value: 'bg-green-500' },
  { name: 'Pink', value: 'bg-pink-500' },
  { name: 'Indigo', value: 'bg-indigo-500' },
];

export default function AddTagModal({ isOpen, onClose, onSave }: AddTagModalProps) {
  const [tagName, setTagName] = useState('');
  const [selectedColor, setSelectedColor] = useState('bg-teal-500');

  const handleSave = () => {
    if (!tagName.trim()) {
      toast.error('Please enter a tag name');
      return;
    }

    onSave({
      name: tagName.trim(),
      color: selectedColor
    });

    setTagName('');
    setSelectedColor('bg-teal-500');
    onClose();
    toast.success('Tag added successfully!');
  };

  const handleCancel = () => {
    setTagName('');
    setSelectedColor('bg-teal-500');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4 bg-white border-gray-200 shadow-xl">
        <CardHeader className="bg-white border-b border-gray-200">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-gray-900">Add New Tag</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              className="p-1 h-8 w-8 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="bg-white space-y-4 p-6">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Tag Name
            </label>
            <Input
              value={tagName}
              onChange={(e) => setTagName(e.target.value)}
              placeholder="Enter tag name"
              autoFocus
              className="border-gray-300 focus:border-teal-500 focus:ring-teal-500"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSave();
                } else if (e.key === 'Escape') {
                  handleCancel();
                }
              }}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Tag Color
            </label>
            <div className="grid grid-cols-5 gap-2">
              {colorOptions.map((color) => (
                <button
                  key={color.value}
                  onClick={() => setSelectedColor(color.value)}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    selectedColor === color.value
                      ? 'border-gray-800 scale-110'
                      : 'border-gray-300 hover:border-gray-500'
                  }`}
                  style={{
                    backgroundColor: color.value.replace('bg-', '').replace('-500', '').replace('-600', ''),
                  }}
                  title={color.name}
                />
              ))}
            </div>
            <div className="mt-2 text-xs text-gray-500">
              Selected: {colorOptions.find(c => c.value === selectedColor)?.name}
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={handleCancel}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="bg-teal-500 hover:bg-teal-600 text-white"
            >
              Add Tag
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
