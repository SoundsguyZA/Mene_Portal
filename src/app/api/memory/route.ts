import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Get memories
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'default-user';
    const agentId = searchParams.get('agentId');
    const type = searchParams.get('type');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');
    
    const where: Record<string, unknown> = { userId };
    
    if (agentId) where.agentId = agentId;
    if (type) where.type = type;
    if (search) where.content = { contains: search };
    
    const memories = await db.memory.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        agent: { select: { id: true, name: true, avatar: true, color: true } }
      }
    });
    
    // Get stats
    const stats = await db.memory.groupBy({
      by: ['type'],
      where: { userId },
      _count: { id: true }
    });
    
    return NextResponse.json({ 
      memories,
      stats: stats.map(s => ({ type: s.type, count: s._count.id }))
    });
  } catch (error) {
    console.error('Error fetching memories:', error);
    return NextResponse.json({ error: 'Failed to fetch memories' }, { status: 500 });
  }
}

// POST - Create a memory
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, agentId, type, content, metadata, importance } = body;
    
    const memory = await db.memory.create({
      data: {
        userId,
        agentId,
        type: type || 'semantic',
        content,
        metadata: metadata || {},
        importance: importance || 0.5
      }
    });
    
    return NextResponse.json({ memory });
  } catch (error) {
    console.error('Error creating memory:', error);
    return NextResponse.json({ error: 'Failed to create memory' }, { status: 500 });
  }
}

// PUT - Update a memory
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, content, importance, accessCount } = body;
    
    const memory = await db.memory.update({
      where: { id },
      data: {
        content,
        importance,
        accessCount,
        lastAccessed: new Date()
      }
    });
    
    return NextResponse.json({ memory });
  } catch (error) {
    console.error('Error updating memory:', error);
    return NextResponse.json({ error: 'Failed to update memory' }, { status: 500 });
  }
}

// DELETE - Delete a memory
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Memory ID required' }, { status: 400 });
    }
    
    await db.memory.delete({ where: { id } });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting memory:', error);
    return NextResponse.json({ error: 'Failed to delete memory' }, { status: 500 });
  }
}
