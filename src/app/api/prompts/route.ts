import { NextRequest, NextResponse } from 'next/server';
import { promptService, PromptNotFoundError } from '@/lib/services/promptService';
import { z } from 'zod';

const searchSchema = z.object({
  query: z.string().optional(),
  tags: z.string().optional(),
  isFavorite: z.boolean().optional(),
});

const createPromptSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  promptText: z.string().min(1, 'Prompt text is required'),
  tags: z.union([z.string(), z.array(z.string())]).optional(),
  isFavorite: z.boolean().optional(),
  isTemplate: z.boolean().optional(),
  templateVars: z.union([z.string(), z.array(z.string())]).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query') || undefined;
    const tagsParam = searchParams.get('tags');
    const isFavoriteParam = searchParams.get('isFavorite');

    const tags = tagsParam ? tagsParam.split(',').map(tag => tag.trim()) : undefined;
    const isFavorite = isFavoriteParam !== null ? isFavoriteParam === 'true' : undefined;

    const filters = {
      query,
      tags,
      isFavorite,
    };

    const prompts = await promptService.listPrompts(filters);
    return NextResponse.json(prompts);
  } catch (error) {
    console.error('Error fetching prompts:', error);
    return NextResponse.json({ error: 'Failed to fetch prompts' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = createPromptSchema.parse(body);

    const prompt = await promptService.createPrompt(validated);
    return NextResponse.json(prompt);
  } catch (error) {
    console.error('Error creating prompt:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Validation failed', 
        details: error.errors 
      }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create prompt' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    // Handle favorite toggle specifically
    if (updateData.isFavorite !== undefined) {
      const prompt = await promptService.toggleFavorite(parseInt(id), updateData.isFavorite);
      return NextResponse.json(prompt);
    }

    // General update
    const prompt = await promptService.updatePrompt(parseInt(id), updateData);
    return NextResponse.json(prompt);
  } catch (error) {
    console.error('Error updating prompt:', error);
    if (error instanceof PromptNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to update prompt' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    await promptService.deletePrompt(parseInt(id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting prompt:', error);
    if (error instanceof PromptNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to delete prompt' }, { status: 500 });
  }
}

