/**
 * Agent Import/Export System for Mene' Portal
 * Supports: TavernAI, Character.AI, Custom JSON formats
 */

// Agent Persona Types
export interface AgentPersona {
  name: string;
  description?: string;
  system_prompt: string;
  first_mes?: string;
  avatar?: string;
  tags?: string[];
  creator?: string;
  character_version?: string;
  // Extended fields
  example_dialogue?: string;
  post_history_instructions?: string;
  alternate_greetings?: string[];
  // Custom fields for Mene' Portal
  color?: string;
  tools?: string[]; // MCP tools this agent can use
  memory_enabled?: boolean;
}

// TavernAI Character Format
export interface TavernAICharacter {
  name: string;
  description: string;
  personality: string;
  scenario: string;
  first_mes: string;
  mes_example: string;
  creator_notes?: string;
  system_prompt?: string;
  post_history_instructions?: string;
  alternate_greetings?: string[];
  tags?: string[];
  creator?: string;
  character_version?: string;
  // Extensions
  extensions?: Record<string, unknown>;
}

// Character.AI Format (simplified)
export interface CharacterAICharacter {
  name: string;
  title?: string;
  description?: string;
  greeting: string;
  definition?: string;
  avatar_rel_path?: string;
}

/**
 * Import agent from TavernAI JSON format
 */
export function importFromTavernAI(json: string): AgentPersona | null {
  try {
    const char = JSON.parse(json) as TavernAICharacter;
    
    // Build system prompt from TavernAI fields
    const systemPrompt = buildTavernSystemPrompt(char);
    
    return {
      name: char.name || 'Unnamed Agent',
      description: char.description || char.creator_notes || '',
      system_prompt: systemPrompt,
      first_mes: char.first_mes || '',
      avatar: undefined,
      tags: char.tags || [],
      creator: char.creator,
      character_version: char.character_version,
      example_dialogue: char.mes_example,
      post_history_instructions: char.post_history_instructions,
      alternate_greetings: char.alternate_greetings,
      memory_enabled: true
    };
  } catch (error) {
    console.error('Failed to import TavernAI character:', error);
    return null;
  }
}

/**
 * Import agent from Character.AI format
 */
export function importFromCharacterAI(json: string): AgentPersona | null {
  try {
    const char = JSON.parse(json) as CharacterAICharacter;
    
    const systemPrompt = buildCharacterAISystemPrompt(char);
    
    return {
      name: char.name || 'Unnamed Agent',
      description: char.description || char.title || '',
      system_prompt: systemPrompt,
      first_mes: char.greeting || '',
      avatar: char.avatar_rel_path,
      memory_enabled: true
    };
  } catch (error) {
    console.error('Failed to import Character.AI character:', error);
    return null;
  }
}

// Alias for consistency
export const importFromCustom = importFromCharacterAI;

/**
 * Import agent from custom JSON format
 */
export function importFromCustom(json: string): AgentPersona | null {
  try {
    const persona = JSON.parse(json) as AgentPersona;
    
    // Validate required fields
    if (!persona.name) {
      console.error('Agent name is required');
      return null;
    }
    
    if (!persona.system_prompt) {
      console.error('System prompt is required');
      return null;
    }
    
    return {
      name: persona.name,
      description: persona.description || '',
      system_prompt: persona.system_prompt,
      first_mes: persona.first_mes,
      avatar: persona.avatar,
      tags: persona.tags || [],
      creator: persona.creator,
      character_version: persona.character_version,
      color: persona.color || generateRandomColor(),
      tools: persona.tools || [],
      memory_enabled: persona.memory_enabled ?? true
    };
  } catch (error) {
    console.error('Failed to import custom agent:', error);
    return null;
  }
}

/**
 * Auto-detect format and import
 */
export function importAgent(json: string): { 
  success: boolean; 
  persona?: AgentPersona; 
  format?: string;
  error?: string;
} {
  try {
    const parsed = JSON.parse(json);
    
    // Detect format
    if (parsed.name && (parsed.description || parsed.personality) && parsed.first_mes) {
      // Likely TavernAI format
      const persona = importFromTavernAI(json);
      if (persona) {
        return { success: true, persona, format: 'TavernAI' };
      }
    }
    
    if (parsed.name && parsed.greeting && !parsed.first_mes) {
      // Likely Character.AI format
      const persona = importFromCharacterAI(json);
      if (persona) {
        return { success: true, persona, format: 'Character.AI' };
      }
    }
    
    if (parsed.name && parsed.system_prompt) {
      // Custom format
      const persona = importFromCustom(json);
      if (persona) {
        return { success: true, persona, format: 'Custom' };
      }
    }
    
    return { 
      success: false, 
      error: 'Could not detect agent format. Please ensure JSON includes required fields.' 
    };
  } catch (error) {
    return { 
      success: false, 
      error: 'Invalid JSON format' 
    };
  }
}

/**
 * Export agent to TavernAI format
 */
export function exportToTavernAI(persona: AgentPersona): string {
  const char: TavernAICharacter = {
    name: persona.name,
    description: persona.description || '',
    personality: '',
    scenario: '',
    first_mes: persona.first_mes || '',
    mes_example: persona.example_dialogue || '',
    system_prompt: persona.system_prompt,
    post_history_instructions: persona.post_history_instructions,
    alternate_greetings: persona.alternate_greetings,
    tags: persona.tags,
    creator: persona.creator,
    character_version: persona.character_version || '1.0'
  };
  
  return JSON.stringify(char, null, 2);
}

/**
 * Export agent to custom format
 */
export function exportToCustom(persona: AgentPersona): string {
  return JSON.stringify(persona, null, 2);
}

/**
 * Build system prompt from TavernAI character
 */
function buildTavernSystemPrompt(char: TavernAICharacter): string {
  const parts: string[] = [];
  
  if (char.description) {
    parts.push(`[Character Description]\n${char.description}`);
  }
  
  if (char.personality) {
    parts.push(`\n[Personality]\n${char.personality}`);
  }
  
  if (char.scenario) {
    parts.push(`\n[Scenario]\n${char.scenario}`);
  }
  
  if (char.system_prompt) {
    parts.push(`\n[System Instructions]\n${char.system_prompt}`);
  }
  
  return parts.join('\n');
}

/**
 * Build system prompt from Character.AI character
 */
function buildCharacterAISystemPrompt(char: CharacterAICharacter): string {
  const parts: string[] = [];
  
  if (char.description) {
    parts.push(`[Description]\n${char.description}`);
  }
  
  if (char.definition) {
    parts.push(`\n[Definition]\n${char.definition}`);
  }
  
  return parts.join('\n');
}

/**
 * Generate random color for agent
 */
function generateRandomColor(): string {
  const colors = [
    '#8B5CF6', '#10B981', '#F59E0B', '#3B82F6', 
    '#EC4899', '#EF4444', '#6366F1', '#14B8A6',
    '#F97316', '#8B5A2B', '#64748B', '#0EA5E9'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

/**
 * Create blank agent template
 */
export function createBlankAgent(): AgentPersona {
  return {
    name: '',
    description: '',
    system_prompt: '',
    first_mes: '',
    color: generateRandomColor(),
    tools: [],
    memory_enabled: true
  };
}

/**
 * Validate agent persona
 */
export function validatePersona(persona: Partial<AgentPersona>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (!persona.name || persona.name.trim() === '') {
    errors.push('Agent name is required');
  }
  
  if (!persona.system_prompt || persona.system_prompt.trim() === '') {
    errors.push('System prompt is required');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Example agent personas (for reference only)
 */
export const EXAMPLE_AGENTS = {
  blank: createBlankAgent(),
  
  // Example for testing import
  exampleAssistant: {
    name: 'Assistant',
    description: 'A helpful AI assistant',
    system_prompt: 'You are a helpful, friendly, and knowledgeable AI assistant. Provide clear and accurate responses.',
    first_mes: 'Hello! How can I help you today?',
    color: '#6366F1',
    tools: [],
    memory_enabled: true
  }
};
