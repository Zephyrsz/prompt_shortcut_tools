import { NextRequest, NextResponse } from 'next/server';
import { promptService, PromptNotFoundError } from '@/lib/services/promptService';
import { z } from 'zod';

const updatePromptSchema = z.object({
  isFavorite: z.boolean().optional(),
  action: z.string().optional(),
  tag: z.string().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const promptId = parseInt(id);
    
    if (isNaN(promptId)) {
      return NextResponse.json({ error: 'Invalid prompt ID' }, { status: 400 });
    }

    const prompt = await promptService.getPrompt(promptId);
    return NextResponse.json(prompt);
  } catch (error) {
    console.error('Error fetching prompt:', error);
    if (error instanceof PromptNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to fetch prompt' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const promptId = parseInt(id);
    
    if (isNaN(promptId)) {
      return NextResponse.json({ error: 'Invalid prompt ID' }, { status: 400 });
    }

    const body = await request.json();
    const validated = updatePromptSchema.parse(body);

    const prompt = await promptService.toggleFavorite(promptId, validated.isFavorite ?? false);
    return NextResponse.json(prompt);
  } catch (error) {
    console.error('Error updating prompt:', error);
    if (error instanceof PromptNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to update prompt' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const promptId = parseInt(id);
    
    if (isNaN(promptId)) {
      return NextResponse.json({ error: 'Invalid prompt ID' }, { status: 400 });
    }

    const body = await request.json();
    const { action, tag } = body;

    if (action === 'removeTag' && tag) {
      const updatedPrompt = await promptService.removeTag(promptId, tag);
      return NextResponse.json(updatedPrompt);
    }

    // Handle general updates
    const updatedPrompt = await promptService.updatePrompt(promptId, body);
    return NextResponse.json(updatedPrompt);
  } catch (error) {
    console.error('Error updating prompt:', error);
    if (error instanceof PromptNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to update prompt' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const promptId = parseInt(id);
    
    if (isNaN(promptId)) {
      return NextResponse.json({ error: 'Invalid prompt ID' }, { status: 400 });
    }

    await promptService.deletePrompt(promptId);
    return NextResponse.json({ message: 'Prompt deleted successfully' });
  } catch (error) {
    console.error('Error deleting prompt:', error);
    if (error instanceof PromptNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to delete prompt' }, { status: 500 });
  }
}

