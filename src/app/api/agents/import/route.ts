import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { importFromTavernAI, importFromCharacterAI, importFromCustom, validatePersona } from '@/lib/agent-import';

// POST - Import agent from JSON
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { json, userId } = body;

    if (!json) {
      return NextResponse.json({ success: false, error: 'JSON data is required' }, { status: 400 });
    }

    // Try different import formats
    let persona = null;
    let format = 'unknown';

    // Try parsing the JSON
    try {
      const parsed = JSON.parse(json);
      
      // Detect TavernAI format
      if (parsed.name && (parsed.description || parsed.personality) && parsed.first_mes) {
        persona = importFromTavernAI(json);
        format = 'TavernAI';
      }
      // Detect Character.AI format
      else if (parsed.name && parsed.greeting && !parsed.first_mes) {
        persona = importFromCharacterAI(json);
        format = 'Character.AI';
      }
      // Custom format (must have name and system_prompt)
      else if (parsed.name && parsed.system_prompt) {
        persona = importFromCustom(json);
        format = 'Custom';
      }
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid JSON format' }, { status: 400 });
    }

    if (!persona) {
      return NextResponse.json({ 
        success: false, 
        error: 'Could not detect agent format. Please ensure JSON has required fields (name + system_prompt for custom, or TavernAI/Character.AI format)' 
      }, { status: 400 });
    }

    // Validate persona
    const validation = validatePersona(persona);
    if (!validation.valid) {
      return NextResponse.json({ success: false, error: validation.errors.join(', ') }, { status: 400 });
    }

    // Ensure user exists
    let user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
      user = await db.user.create({
        data: { id: userId, email: `${userId}@mene.portal`, name: 'User' }
      });
    }

    // Check if agent with same name exists
    const existingAgent = await db.agent.findFirst({
      where: { userId, name: persona.name }
    });

    if (existingAgent) {
      return NextResponse.json({ 
        success: false, 
        error: `Agent "${persona.name}" already exists. Please use a different name or delete the existing agent.` 
      }, { status: 400 });
    }

    // Create agent
    const agent = await db.agent.create({
      data: {
        userId,
        name: persona.name,
        description: persona.description || '',
        avatar: persona.avatar || null,
        color: persona.color || '#6366F1',
        personality: {
          systemPrompt: persona.system_prompt,
          firstMessage: persona.first_mes,
          exampleDialogue: persona.example_dialogue,
          tags: persona.tags,
          creator: persona.creator,
          tools: persona.tools || [],
          memoryEnabled: persona.memory_enabled ?? true
        },
        isActive: true
      }
    });

    return NextResponse.json({ 
      success: true, 
      agent: {
        id: agent.id,
        name: agent.name,
        description: agent.description,
        avatar: agent.avatar,
        color: agent.color,
        createdAt: agent.createdAt
      },
      format
    });
  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to import agent. Please check your JSON format.' 
    }, { status: 500 });
  }
}
