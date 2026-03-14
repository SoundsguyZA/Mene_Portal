import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { LLMSkill } from '@/lib/z-ai';

// POST - Send message between agents or start a discussion
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      fromAgentId, 
      toAgentId, 
      message, 
      type = 'direct', // direct, broadcast, discussion
      context 
    } = body;
    
    // Get both agents
    const fromAgent = await db.agent.findUnique({ where: { id: fromAgentId } });
    const toAgent = await db.agent.findUnique({ where: { id: toAgentId } });
    
    if (!fromAgent || !toAgent) {
      return NextResponse.json({ error: 'Agents not found' }, { status: 404 });
    }
    
    // Store the communication
    const communication = await db.agentCommunication.create({
      data: {
        fromAgentId,
        toAgentId,
        message,
        context: context || {},
        type,
        status: 'delivered'
      }
    });
    
    // Build context for the receiving agent
    const fromPersonality = fromAgent.personality as Record<string, unknown> || {};
    const toPersonality = toAgent.personality as Record<string, unknown> || {};
    
    // Get recent communications between these agents
    const recentComms = await db.agentCommunication.findMany({
      where: {
        OR: [
          { fromAgentId, toAgentId },
          { fromAgentId: toAgentId, toAgentId: fromAgentId }
        ]
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });
    
    const systemPrompt = `You are ${toAgent.name}, ${toAgent.description || 'an AI assistant'}.

You are receiving a message from ${fromAgent.name}, who is ${fromAgent.description || 'another AI assistant'}.

Your personality traits: ${((toPersonality.traits as string[]) || ['helpful']).join(', ')}.
Your communication style: ${(toPersonality.communicationStyle as string) || 'professional'}.
Your expertise: ${((toPersonality.expertise as string[]) || ['general']).join(', ')}.

The sender's personality: ${((fromPersonality.traits as string[]) || []).join(', ')}.
The sender's expertise: ${((fromPersonality.expertise as string[]) || []).join(', ')}.

Stay in character and respond naturally to the message. Be helpful and collaborative.

Recent conversation context:
${recentComms.reverse().map(c => `${c.fromAgentId === fromAgentId ? fromAgent.name : toAgent.name}: ${c.message}`).join('\n')}`;

    // Call LLM for response
    const llm = new LLMSkill();
    const response = await llm.chat({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Message from ${fromAgent.name}: ${message}` }
      ],
      model: 'glm-4-flash',
      temperature: 0.8,
      max_tokens: 1500
    });
    
    const responseContent = response.choices?.[0]?.message?.content || 
      'I received your message but was unable to generate a response.';
    
    // Update communication with response
    await db.agentCommunication.update({
      where: { id: communication.id },
      data: { response: responseContent, status: 'read' }
    });
    
    return NextResponse.json({
      communication: {
        id: communication.id,
        from: { id: fromAgent.id, name: fromAgent.name, avatar: fromAgent.avatar },
        to: { id: toAgent.id, name: toAgent.name, avatar: toAgent.avatar },
        message,
        response: responseContent,
        createdAt: communication.createdAt
      }
    });
  } catch (error) {
    console.error('Agent communication error:', error);
    return NextResponse.json({ error: 'Failed to process agent communication' }, { status: 500 });
  }
}

// GET - Get communication history between agents
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get('agentId');
    const otherAgentId = searchParams.get('otherAgentId');
    const limit = parseInt(searchParams.get('limit') || '20');
    
    if (!agentId) {
      return NextResponse.json({ error: 'Agent ID required' }, { status: 400 });
    }
    
    const where = otherAgentId ? {
      OR: [
        { fromAgentId: agentId, toAgentId: otherAgentId },
        { fromAgentId: otherAgentId, toAgentId: agentId }
      ]
    } : {
      OR: [
        { fromAgentId: agentId },
        { toAgentId: agentId }
      ]
    };
    
    const communications = await db.agentCommunication.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        fromAgent: { select: { id: true, name: true, avatar: true } },
        toAgent: { select: { id: true, name: true, avatar: true } }
      }
    });
    
    return NextResponse.json({ communications: communications.reverse() });
  } catch (error) {
    console.error('Error fetching communications:', error);
    return NextResponse.json({ error: 'Failed to fetch communications' }, { status: 500 });
  }
}
