/**
 * Agent Persona Import System for Mene' Portal
 * Supports JSON, TavernAI, and custom persona formats
 */

import { db } from '@/lib/db';

// TavernAI character card format
export interface TavernAICard {
  name: string;
  description?: string;
  personality?: string;
  scenario?: string;
  first_mes?: string;
  mes_example?: string;
  creator_notes?: string;
  system_prompt?: string;
  post_history_instructions?: string;
  alternate_greetings?: string[];
  tags?: string[];
  creator?: string;
  character_version?: string;
  extensions?: Record<string, unknown>;
}

// Mene' Portal agent persona format
export interface MeneAgentPersona {
  name: string;
  description?: string;
  systemPrompt?: string;
  firstMessage?: string;
  avatar?: string;
  color?: string;
  tags?: string[];
  tools?: string[];
  mcpServers?: string[];
  config?: Record<string, unknown>;
}

// Generic persona format (flexible)
export interface GenericPersona {
  name: string;
  [key: string]: unknown;
}

/**
 * Parse and validate an imported agent persona
 */
export function parseAgentPersona(input: string): {
  success: boolean;
  persona?: MeneAgentPersona;
  format?: 'mene' | 'tavern' | 'generic';
  error?: string;
} {
  try {
    const parsed = JSON.parse(input);
    
    if (!parsed.name || typeof parsed.name !== 'string') {
      return { success: false, error: 'Agent must have a name' };
    }
    
    // Check for TavernAI format
    if (parsed.first_mes || parsed.personality || parsed.scenario || parsed.mes_example) {
      const tavern: TavernAICard = parsed;
      return {
        success: true,
        format: 'tavern',
        persona: {
          name: tavern.name,
          description: tavern.description || tavern.personality,
          systemPrompt: buildSystemPromptFromTavern(tavern),
          firstMessage: tavern.first_mes,
          avatar: tavern.extensions?.avatar as string | undefined,
          tags: tavern.tags,
          config: tavern.extensions
        }
      };
    }
    
    // Check for Mene' format
    if (parsed.systemPrompt || parsed.mcpServers || parsed.tools) {
      return {
        success: true,
        format: 'mene',
        persona: parsed as MeneAgentPersona
      };
    }
    
    // Generic format - just needs a name
    return {
      success: true,
      format: 'generic',
      persona: {
        name: parsed.name,
        description: parsed.description as string | undefined,
        config: parsed
      }
    };
    
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Invalid JSON format' 
    };
  }
}

/**
 * Build a system prompt from TavernAI card
 */
function buildSystemPromptFromTavern(card: TavernAICard): string {
  const parts: string[] = [];
  
  if (card.system_prompt) {
    parts.push(card.system_prompt);
  }
  
  if (card.personality) {
    parts.push(`\nPersonality: ${card.personality}`);
  }
  
  if (card.scenario) {
    parts.push(`\nScenario: ${card.scenario}`);
  }
  
  if (card.description) {
    parts.push(`\nDescription: ${card.description}`);
  }
  
  if (card.post_history_instructions) {
    parts.push(`\n${card.post_history_instructions}`);
  }
  
  return parts.join('\n').trim() || `You are ${card.name}.`;
}

/**
 * Import agents from a JSON file (can contain multiple)
 */
export async function importAgentsFromJSON(
  userId: string,
  input: string
): Promise<{ success: boolean; agents: string[]; errors: string[] }> {
  try {
    const parsed = JSON.parse(input);
    const agents: string[] = [];
    const errors: string[] = [];
    
    // Handle array of agents
    const agentList = Array.isArray(parsed) ? parsed : [parsed];
    
    for (const rawAgent of agentList) {
      const result = parseAgentPersona(JSON.stringify(rawAgent));
      
      if (result.success && result.persona) {
        const agent = await db.agent.create({
          data: {
            userId,
            name: result.persona.name,
            description: result.persona.description,
            avatar: result.persona.avatar || '🤖',
            color: result.persona.color || getRandomColor(),
            config: {
              systemPrompt: result.persona.systemPrompt,
              firstMessage: result.persona.firstMessage,
              tags: result.persona.tags,
              tools: result.persona.tools,
              mcpServers: result.persona.mcpServers,
              importedFrom: result.format
            }
          }
        });
        agents.push(agent.name);
      } else {
        errors.push(result.error || 'Unknown error');
      }
    }
    
    return { success: agents.length > 0, agents, errors };
    
  } catch (error) {
    return { 
      success: false, 
      agents: [], 
      errors: [error instanceof Error ? error.message : 'Failed to import'] 
    };
  }
}

/**
 * Export agent to Mene' Portal format
 */
export async function exportAgentToJSON(agentId: string): Promise<string> {
  const agent = await db.agent.findUnique({ where: { id: agentId } });
  
  if (!agent) {
    throw new Error('Agent not found');
  }
  
  const config = agent.config as Record<string, unknown> || {};
  
  const persona: MeneAgentPersona = {
    name: agent.name,
    description: agent.description || undefined,
    systemPrompt: config.systemPrompt as string | undefined,
    firstMessage: config.firstMessage as string | undefined,
    avatar: agent.avatar || undefined,
    color: agent.color || undefined,
    tags: config.tags as string[] | undefined,
    tools: config.tools as string[] | undefined,
    mcpServers: config.mcpServers as string[] | undefined,
    config: config
  };
  
  return JSON.stringify(persona, null, 2);
}

/**
 * Get random color for new agent
 */
function getRandomColor(): string {
  const colors = [
    '#8B5CF6', '#10B981', '#F59E0B', '#3B82F6', 
    '#EC4899', '#EF4444', '#06B6D4', '#84CC16'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

/**
 * Validate agent persona before import
 */
export function validateAgentPersona(persona: MeneAgentPersona): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (!persona.name || persona.name.trim().length === 0) {
    errors.push('Agent name is required');
  }
  
  if (persona.name && persona.name.length > 100) {
    errors.push('Agent name must be less than 100 characters');
  }
  
  if (persona.description && persona.description.length > 2000) {
    errors.push('Description must be less than 2000 characters');
  }
  
  if (persona.systemPrompt && persona.systemPrompt.length > 10000) {
    errors.push('System prompt must be less than 10000 characters');
  }
  
  return { valid: errors.length === 0, errors };
}
