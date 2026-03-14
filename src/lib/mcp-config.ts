// Mene' Portal - MCP Server & Plugin Configuration
// Based on Plugged.in multi-MCP server architecture

export interface MCPServerConfig {
  name: string;
  description: string;
  type: 'stdio' | 'streamable_http' | 'websocket';
  command?: string;
  args?: string[];
  url?: string;
  env?: Record<string, string>;
  enabled?: boolean;
}

export interface AgentPersona {
  id: string;
  name: string;
  description: string;
  avatar: string;
  color: string;
  systemPrompt: string;
  firstMessage?: string;
  exampleDialogue?: Array<{ user: string; agent: string }>;
  creator?: string;
  characterVersion?: string;
  tags?: string[];
  // TavernAI / Character.AI compatible fields
  spec?: string;
  spec_version?: string;
  personality?: string;
  scenario?: string;
  mes_example?: string;
  post_history_instructions?: string;
  alternate_greetings?: string[];
  character_book?: CharacterBook;
}

export interface CharacterBook {
  entries: CharacterBookEntry[];
  extensions: Record<string, unknown>;
}

export interface CharacterBookEntry {
  keys: string[];
  content: string;
  extensions: Record<string, unknown>;
  enabled: boolean;
  insertion_order: number;
  case_sensitive: boolean;
  name: string;
  priority: number;
  id: number;
  comment: string;
  selective: boolean;
  secondary_keys: string[];
  constant: boolean;
  position: string;
}

// MCP Servers - These are AI service plugins that can be configured
// Similar to Plugged.in architecture
export const MCP_SERVERS: MCPServerConfig[] = [
  // Memory & Knowledge
  {
    name: 'Memory Service',
    description: 'Graph-vector memory for AI assistants - persistent conversation memory',
    type: 'streamable_http',
    url: '/api/mcp/memory',
    enabled: true
  },
  {
    name: 'Knowledge Base',
    description: 'Document indexing and semantic search - RAG capabilities',
    type: 'streamable_http',
    url: '/api/mcp/knowledge',
    enabled: true
  },
  // Web & Search
  {
    name: 'Web Search',
    description: 'Real-time web search and content extraction',
    type: 'streamable_http',
    url: '/api/mcp/websearch',
    enabled: true
  },
  {
    name: 'Web Reader',
    description: 'Extract and parse web page content',
    type: 'streamable_http',
    url: '/api/mcp/webreader',
    enabled: true
  },
  // AI Services (via z-ai-web-dev-sdk)
  {
    name: 'LLM Service',
    description: 'Large Language Model chat completions',
    type: 'streamable_http',
    url: '/api/mcp/llm',
    enabled: true
  },
  {
    name: 'Image Generation',
    description: 'AI-powered image generation from text prompts',
    type: 'streamable_http',
    url: '/api/mcp/image',
    enabled: true
  },
  {
    name: 'Text-to-Speech',
    description: 'Convert text to natural sounding speech',
    type: 'streamable_http',
    url: '/api/mcp/tts',
    enabled: true
  },
  {
    name: 'Speech-to-Text',
    description: 'Transcribe audio to text using Whisper',
    type: 'streamable_http',
    url: '/api/mcp/asr',
    enabled: true
  },
  {
    name: 'Vision Service',
    description: 'Analyze images and visual content with AI',
    type: 'streamable_http',
    url: '/api/mcp/vision',
    enabled: true
  },
  // Utility Services
  {
    name: 'Random Generator',
    description: 'Secure random number generation for AI decisions',
    type: 'stdio',
    command: 'npx',
    args: ['pluggedin-random-number-generator-mcp'],
    enabled: false
  },
  {
    name: 'Whois Lookup',
    description: 'Domain and IP whois lookups',
    type: 'stdio',
    command: 'npx',
    args: ['@bharathvaj/whois-mcp'],
    enabled: false
  },
  {
    name: 'Context7',
    description: 'Access up-to-date documentation for any library',
    type: 'streamable_http',
    url: '/api/mcp/context7',
    enabled: false
  }
];

// Default MCP configuration export (Plugged.in compatible format)
export const MCP_CONFIG = {
  mcpServers: MCP_SERVERS.reduce((acc, server) => {
    const config: Record<string, unknown> = {
      description: server.description,
      type: server.type
    };
    
    if (server.command) config.command = server.command;
    if (server.args) config.args = server.args;
    if (server.url) config.url = server.url;
    if (server.env) config.env = server.env;
    
    acc[server.name] = config;
    return acc;
  }, {} as Record<string, Record<string, unknown>>)
};

// Agent import formats we support
export const SUPPORTED_AGENT_FORMATS = [
  'tavernai',      // Character.AI / TavernAI JSON format
  'menepersona',   // Mene' Portal native format
  'openai_assistant', // OpenAI Assistant format
  'custom'         // Simple custom JSON
] as const;

// TavernAI/Character.AI character card format parser
export function parseTavernAICard(json: unknown): AgentPersona | null {
  try {
    const card = json as Record<string, unknown>;
    
    // TavernAI format
    if (card.spec === 'chara_card_v2' || card.name) {
      const data = (card.data as Record<string, unknown>) || card;
      
      return {
        id: `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: (data.name as string) || 'Unknown',
        description: (data.description as string) || '',
        avatar: '🤖',
        color: '#8B5CF6',
        systemPrompt: buildSystemPrompt(data),
        firstMessage: (data.first_mes as string) || 'Hello! How can I help you today?',
        creator: (data.creator as string) || '',
        characterVersion: (data.character_version as string) || '1.0',
        tags: (data.tags as string[]) || [],
        spec: card.spec as string,
        spec_version: (card.spec_version as string) || '2.0',
        personality: (data.personality as string) || '',
        scenario: (data.scenario as string) || '',
        mes_example: (data.mes_example as string) || '',
        post_history_instructions: (data.post_history_instructions as string) || '',
        character_book: data.character_book as CharacterBook
      };
    }
    
    return null;
  } catch {
    return null;
  }
}

// Build system prompt from TavernAI character data
function buildSystemPrompt(data: Record<string, unknown>): string {
  const parts: string[] = [];
  
  if (data.description) {
    parts.push(`Character: ${data.description}`);
  }
  
  if (data.personality) {
    parts.push(`Personality: ${data.personality}`);
  }
  
  if (data.scenario) {
    parts.push(`Scenario: ${data.scenario}`);
  }
  
  if (data.post_history_instructions) {
    parts.push(`Instructions: ${data.post_history_instructions}`);
  }
  
  if (parts.length === 0) {
    return `You are ${data.name || 'an AI assistant'}. Be helpful and engaging.`;
  }
  
  return parts.join('\n\n');
}

// Parse Mene' Portal native format
export function parseMenePersona(json: unknown): AgentPersona | null {
  try {
    const persona = json as Record<string, unknown>;
    
    if (persona.name && persona.systemPrompt) {
      return {
        id: (persona.id as string) || `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: persona.name as string,
        description: (persona.description as string) || '',
        avatar: (persona.avatar as string) || '🤖',
        color: (persona.color as string) || '#8B5CF6',
        systemPrompt: persona.systemPrompt as string,
        firstMessage: (persona.firstMessage as string) || '',
        creator: (persona.creator as string) || '',
        tags: (persona.tags as string[]) || []
      };
    }
    
    return null;
  } catch {
    return null;
  }
}

// Auto-detect and parse any supported format
export function parseAgentImport(json: unknown): AgentPersona | null {
  // Try TavernAI format first
  const tavernai = parseTavernAICard(json);
  if (tavernai) return tavernai;
  
  // Try Mene' Portal format
  const mene = parseMenePersona(json);
  if (mene) return mene;
  
  // Try simple custom format
  try {
    const custom = json as Record<string, unknown>;
    if (custom.name) {
      return {
        id: `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: custom.name as string,
        description: (custom.description as string) || '',
        avatar: (custom.avatar as string) || '🤖',
        color: (custom.color as string) || '#8B5CF6',
        systemPrompt: (custom.systemPrompt as string) || (custom.prompt as string) || `You are ${custom.name}. Be helpful and engaging.`,
        firstMessage: (custom.firstMessage as string) || '',
        tags: (custom.tags as string[]) || []
      };
    }
  } catch {
    // Ignore
  }
  
  return null;
}

// Example agent personas for reference
export const EXAMPLE_AGENTS: AgentPersona[] = [
  {
    id: 'example_researcher',
    name: 'Research Assistant',
    description: 'A helpful research assistant specialized in information gathering',
    avatar: '📚',
    color: '#10B981',
    systemPrompt: 'You are a research assistant. Help users find and synthesize information. Be thorough and cite sources when possible.',
    firstMessage: 'Hello! I\'m here to help with research. What would you like to explore?',
    tags: ['research', 'information', 'analysis']
  },
  {
    id: 'example_creative',
    name: 'Creative Writer',
    description: 'An imaginative writing partner for stories and content',
    avatar: '✨',
    color: '#EC4899',
    systemPrompt: 'You are a creative writing assistant. Help users craft engaging stories, overcome writer\'s block, and explore creative ideas.',
    firstMessage: 'Hi there! Ready to create something amazing? What shall we write today?',
    tags: ['creative', 'writing', 'storytelling']
  }
];
