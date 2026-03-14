import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { 
  addKnowledgeItem, 
  processKnowledgeItem, 
  searchKnowledge,
  getKnowledgeStats,
  deleteKnowledgeItem,
  getKnowledgeTags
} from '@/lib/memory-system';

// GET - Get knowledge items or stats
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId') || 'default';
    const action = searchParams.get('action');

    if (action === 'stats') {
      const stats = await getKnowledgeStats(userId);
      return NextResponse.json({ stats });
    }

    if (action === 'tags') {
      const tags = await getKnowledgeTags(userId);
      return NextResponse.json({ tags });
    }

    if (action === 'search') {
      const query = searchParams.get('query') || '';
      const type = searchParams.get('type') as 'document' | 'whatsapp' | 'audio' | 'image' | 'video' | 'code' | null;
      const tags = searchParams.get('tags')?.split(',') || undefined;
      const limit = parseInt(searchParams.get('limit') || '10');

      const items = await searchKnowledge(userId, query, {
        type: type || undefined,
        tags,
        limit
      });

      return NextResponse.json({ items });
    }

    // Get all knowledge items for user
    const items = await db.knowledgeItem.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    return NextResponse.json({ items });
  } catch (error) {
    console.error('Error fetching knowledge items:', error);
    return NextResponse.json({ error: 'Failed to fetch knowledge items' }, { status: 500 });
  }
}

// POST - Add new knowledge item
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, userId = 'default', ...data } = body;

    // Create user if needed
    let user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
      user = await db.user.create({
        data: { id: userId, email: 'default@nexus.ai', name: 'Default User' }
      });
    }

    switch (action) {
      case 'add': {
        const { type, content, title, source, tags } = data;
        
        const item = await addKnowledgeItem(userId, type, content, {
          title,
          source,
          tags
        });

        // Process the item asynchronously
        processKnowledgeItem(item.id).catch(err => 
          console.error('Failed to process knowledge item:', err)
        );

        return NextResponse.json({ item });
      }

      case 'process': {
        const { itemId } = data;
        
        const result = await processKnowledgeItem(itemId);
        
        if (!result.success) {
          return NextResponse.json({ error: result.error }, { status: 500 });
        }

        return NextResponse.json({ summary: result.summary });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error with knowledge item:', error);
    return NextResponse.json({ error: 'Failed to process knowledge item' }, { status: 500 });
  }
}

// DELETE - Delete knowledge item
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId') || 'default';
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Knowledge item ID required' }, { status: 400 });
    }

    const success = await deleteKnowledgeItem(userId, id);
    
    if (!success) {
      return NextResponse.json({ error: 'Knowledge item not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting knowledge item:', error);
    return NextResponse.json({ error: 'Failed to delete knowledge item' }, { status: 500 });
  }
}
