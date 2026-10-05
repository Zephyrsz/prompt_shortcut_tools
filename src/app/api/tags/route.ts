import { NextRequest, NextResponse } from 'next/server';
import { tagService, TagAlreadyExistsError } from '@/lib/services/tagService';
import { z } from 'zod';

const createTagSchema = z.object({
  name: z.string().min(1, 'Tag name is required'),
  color: z.string().min(1, 'Tag color is required'),
});

export async function GET() {
  try {
    const tags = await tagService.listTags();
    return NextResponse.json(tags);
  } catch (error) {
    console.error('Error fetching tags:', error);
    return NextResponse.json({ error: 'Failed to fetch tags' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = createTagSchema.parse(body);

    const tag = await tagService.createTag(validated);
    return NextResponse.json(tag);
  } catch (error) {
    console.error('Error creating tag:', error);
    if (error instanceof TagAlreadyExistsError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? 'Invalid tag' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create tag' }, { status: 500 });
  }
}
