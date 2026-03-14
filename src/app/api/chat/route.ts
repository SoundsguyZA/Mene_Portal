import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { LLMSkill } from '@/lib/z-ai';

// POST - Send a chat message
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      userId = 'default-user', 
      conversationId, 
      agentId, 
      message,
      includeMemory = true 
    } = body;
    
    // Ensure user exists
    let user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
      user = await db.user.create({
        data: { id: userId, email: `${userId}@nexus.ai`, name: 'User' }
      });
    }
    
    // Get or create conversation
    let conversation;
    if (conversationId) {
      conversation = await db.conversation.findUnique({ 
        where: { id: conversationId },
        include: { messages: { orderBy: { createdAt: 'asc' }, take: 20 } }
      });
    }
    
    if (!conversation) {
      conversation = await db.conversation.create({
        data: {
          userId,
          agentId,
          title: message.slice(0, 50),
          type: 'chat'
        },
        include: { messages: true }
      });
    }
    
    // Store user message
    const userMessage = await db.message.create({
      data: {
        conversationId: conversation.id,
        userId,
        role: 'user',
        content: message
      }
    });
    
    // Get agent info
    const agent = agentId ? await db.agent.findUnique({ where: { id: agentId } }) : null;
    
    // Get relevant memories
    let contextMemories: string[] = [];
    if (includeMemory && agent) {
      const memories = await db.memory.findMany({
        where: { agentId },
        orderBy: { importance: 'desc' },
        take: 5
      });
      contextMemories = memories.map(m => m.content);
    }
    
    // Build system prompt based on agent personality
    const systemPrompt = agent ? buildAgentSystemPrompt(agent, contextMemories) : 
      'You are NEXUS, a helpful AI assistant.';
    
    // Build messages for LLM
    const chatMessages = [
      { role: 'system' as const, content: systemPrompt },
      ...conversation.messages.map(m => ({
        role: m.role as 'user' | 'assistant' | 'system',
        content: m.content
      })),
      { role: 'user' as const, content: message }
    ];
    
    // Call LLM
    const llm = new LLMSkill();
    const response = await llm.chat({
      messages: chatMessages,
      model: 'glm-4-flash',
      temperature: 0.7,
      max_tokens: 2000
    });
    
    const assistantContent = response.choices?.[0]?.message?.content || 
      'I apologize, I was unable to generate a response.';
    
    // Store assistant message
    const assistantMessage = await db.message.create({
      data: {
        conversationId: conversation.id,
        senderAgentId: agentId,
        role: 'assistant',
        content: assistantContent
      }
    });
    
    // Store this conversation in memory
    if (agent) {
      await db.memory.create({
        data: {
          userId,
          agentId,
          type: 'episodic',
          content: `User: ${message}\n${agent.name}: ${assistantContent}`,
          metadata: { conversationId: conversation.id }
        }
      });
    }
    
    // Update conversation
    await db.conversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() }
    });
    
    return NextResponse.json({
      conversationId: conversation.id,
      userMessage,
      assistantMessage,
      agent: agent ? { id: agent.id, name: agent.name, avatar: agent.avatar } : null
    });
  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json({ 
      error: 'Failed to process chat message',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// GET - Get conversation history
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'default-user';
    const conversationId = searchParams.get('conversationId');
    
    if (conversationId) {
      const conversation = await db.conversation.findUnique({
        where: { id: conversationId },
        include: {
          messages: { orderBy: { createdAt: 'asc' } },
          primaryAgent: true
        }
      });
      return NextResponse.json({ conversation });
    }
    
    const conversations = await db.conversation.findMany({
      where: { userId, isActive: true },
      orderBy: { updatedAt: 'desc' },
      take: 20,
      include: {
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
        primaryAgent: true
      }
    });
    
    return NextResponse.json({ conversations });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
  }
}

// Helper function to build agent system prompt
function buildAgentSystemPrompt(agent: { 
  name: string; 
  description: string | null; 
  personality: unknown;
}, memories: string[]) {
  const personality = agent.personality as {
    traits?: string[];
    communicationStyle?: string;
    expertise?: string[];
  } || {};
  
  let prompt = `You are ${agent.name}, ${agent.description || 'an AI assistant'}.

Personality traits: ${(personality.traits || ['helpful', 'friendly']).join(', ')}.
Communication style: ${personality.communicationStyle || 'professional yet warm'}.
Areas of expertise: ${(personality.expertise || ['general assistance']).join(', ')}.

Stay in character and maintain your unique personality throughout the conversation.`;
  
  if (memories.length > 0) {
    prompt += `\n\nRelevant memories from past conversations:\n${memories.map((m, i) => `${i + 1}. ${m}`).join('\n')}`;
  }
  
  return prompt;
}
