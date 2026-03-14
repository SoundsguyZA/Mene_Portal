import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - List all agents for a user (blank slate - no defaults)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'default-user';
    
    // Ensure user exists
    let user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
      user = await db.user.create({
        data: { id: userId, email: `${userId}@mene.portal`, name: 'User' }
      });
    }
    
    // Get only user's agents (blank slate - no defaults created automatically)
    const agents = await db.agent.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        description: true,
        avatar: true,
        color: true,
        systemPrompt: true,
        personaJson: true,
        config: true,
        isActive: true,
        lastUsed: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { memories: true, sentMessages: true }
        }
      }
    });
    
    // Transform for frontend
    const formattedAgents = agents.map(agent => ({
      ...agent,
      systemPrompt: agent.systemPrompt || (agent.personaJson as Record<string, unknown>)?.system_prompt || '',
      firstMessage: (agent.personaJson as Record<string, unknown>)?.first_mes || '',
      tools: ((agent.config as Record<string, unknown>)?.tools as string[]) || [],
      memoryEnabled: (agent.config as Record<string, unknown>)?.memoryEnabled ?? true
    }));
    
    return NextResponse.json({ agents: formattedAgents });
  } catch (error) {
    console.error('Error fetching agents:', error);
    return NextResponse.json({ agents: [] });
  }
}

// POST - Create a new agent
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      userId, 
      name, 
      description, 
      systemPrompt, 
      firstMessage,
      avatar, 
      color,
      tools,
      memoryEnabled
    } = body;
    
    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Agent name is required' }, { status: 400 });
    }
    
    if (!systemPrompt || !systemPrompt.trim()) {
      return NextResponse.json({ error: 'System prompt is required' }, { status: 400 });
    }
    
    // Ensure user exists
    let user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
      user = await db.user.create({
        data: { id: userId, email: `${userId}@mene.portal`, name: 'User' }
      });
    }
    
    // Check for duplicate name
    const existing = await db.agent.findFirst({
      where: { userId, name: name.trim() }
    });
    
    if (existing) {
      return NextResponse.json({ 
        error: `Agent "${name}" already exists. Please use a different name.` 
      }, { status: 400 });
    }
    
    // Create agent with blank slate approach
    const agent = await db.agent.create({
      data: {
        userId,
        name: name.trim(),
        description: description?.trim() || '',
        avatar: avatar || '🤖',
        color: color || '#6366F1',
        systemPrompt: systemPrompt.trim(),
        personaJson: {
          name: name.trim(),
          description: description?.trim() || '',
          system_prompt: systemPrompt.trim(),
          first_mes: firstMessage?.trim() || '',
          tools: tools || [],
          memory_enabled: memoryEnabled ?? true
        },
        config: {
          tools: tools || [],
          memoryEnabled: memoryEnabled ?? true
        },
        isActive: true
      }
    });
    
    return NextResponse.json({ 
      agent: {
        id: agent.id,
        name: agent.name,
        description: agent.description,
        avatar: agent.avatar,
        color: agent.color,
        systemPrompt: agent.systemPrompt,
        createdAt: agent.createdAt
      }
    });
  } catch (error) {
    console.error('Error creating agent:', error);
    return NextResponse.json({ error: 'Failed to create agent' }, { status: 500 });
  }
}

// PUT - Update an agent
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, description, systemPrompt, firstMessage, avatar, color, tools, memoryEnabled, isActive } = body;
    
    if (!id) {
      return NextResponse.json({ error: 'Agent ID required' }, { status: 400 });
    }
    
    const existingAgent = await db.agent.findUnique({ where: { id } });
    if (!existingAgent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }
    
    // Update personaJson with new values
    const currentPersona = (existingAgent.personaJson as Record<string, unknown>) || {};
    const updatedPersona = {
      ...currentPersona,
      name: name || existingAgent.name,
      description: description ?? existingAgent.description,
      system_prompt: systemPrompt ?? existingAgent.systemPrompt,
      first_mes: firstMessage ?? currentPersona.first_mes,
      tools: tools ?? currentPersona.tools,
      memory_enabled: memoryEnabled ?? currentPersona.memory_enabled
    };
    
    const agent = await db.agent.update({
      where: { id },
      data: {
        name: name?.trim() || existingAgent.name,
        description: description?.trim() ?? existingAgent.description,
        avatar: avatar ?? existingAgent.avatar,
        color: color ?? existingAgent.color,
        systemPrompt: systemPrompt?.trim() ?? existingAgent.systemPrompt,
        personaJson: updatedPersona,
        config: {
          ...((existingAgent.config as Record<string, unknown>) || {}),
          tools: (tools ?? ((existingAgent.config as Record<string, unknown>)?.tools as string[])) || [],
          memoryEnabled: (memoryEnabled ?? ((existingAgent.config as Record<string, unknown>)?.memoryEnabled as boolean)) ?? true
        },
        isActive: isActive ?? existingAgent.isActive
      }
    });
    
    return NextResponse.json({ 
      agent: {
        id: agent.id,
        name: agent.name,
        description: agent.description,
        avatar: agent.avatar,
        color: agent.color,
        systemPrompt: agent.systemPrompt,
        createdAt: agent.createdAt
      }
    });
  } catch (error) {
    console.error('Error updating agent:', error);
    return NextResponse.json({ error: 'Failed to update agent' }, { status: 500 });
  }
}

// DELETE - Delete an agent
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Agent ID required' }, { status: 400 });
    }
    
    const agent = await db.agent.findUnique({ where: { id } });
    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }
    
    await db.agent.delete({ where: { id } });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting agent:', error);
    return NextResponse.json({ error: 'Failed to delete agent' }, { status: 500 });
  }
}
