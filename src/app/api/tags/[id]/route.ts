import { NextRequest, NextResponse } from 'next/server';
import { tagService, TagNotFoundError, TagInUseError } from '@/lib/services/tagService';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tagId = parseInt(id);

    console.log('DELETE /api/tags/[id] called with id:', id, 'parsed as:', tagId);

    if (isNaN(tagId)) {
      console.error('Invalid tag ID:', id);
      return NextResponse.json({ error: 'Invalid tag ID' }, { status: 400 });
    }

    console.log('Calling tagService.deleteTag with id:', tagId);
    const result = await tagService.deleteTag(tagId);
    console.log('Tag deleted successfully:', result);
    return NextResponse.json({ success: true, deleted: result });
  } catch (error) {
    console.error('Error deleting tag:', error);
    if (error instanceof TagNotFoundError) {
      console.error('Tag not found:', error.message);
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof TagInUseError) {
      console.error('Tag in use:', error.message);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ 
      error: 'Failed to delete tag',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

