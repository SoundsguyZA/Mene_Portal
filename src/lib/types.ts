// Agent Types
export interface AgentType {
  id: string;
  name: string;
  description: string | null;
  personality: AgentPersonality;
  expertise: string[];
  avatar: string | null;
  color: string | null;
  isActive: boolean;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AgentPersonality {
  traits: string[];
  communicationStyle: string;
  tone: string;
  approach: string;
}

// Service Types
export interface ServiceType {
  id: string;
  name: string;
  url: string;
  category: string | null;
  description: string | null;
  icon: string | null;
  color: string | null;
  isEnabled: boolean;
  isVisible: boolean;
  sortOrder: number;
  lastUsed: Date | null;
}

// Conversation Types
export interface ConversationType {
  id: string;
  title: string | null;
  type: 'chat' | 'discussion' | 'project';
  isActive: boolean;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
  messages: MessageType[];
  participants?: ParticipantType[];
}

export interface MessageType {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'agent' | 'system';
  content: string;
  senderAgentId: string | null;
  recipientAgentId: string | null;
  createdAt: Date;
  senderAgent?: AgentType;
}

export interface ParticipantType {
  id: string;
  agentId: string;
  role: 'host' | 'participant' | 'observer';
  joinedAt: Date;
  agent?: AgentType;
}

// Memory Types
export interface MemoryType {
  id: string;
  type: 'semantic' | 'episodic' | 'procedural' | 'conversation';
  content: string;
  importance: number;
  accessCount: number;
  lastAccessed: Date | null;
  createdAt: Date;
  agent?: AgentType;
}

// Knowledge Types
export interface KnowledgeItemType {
  id: string;
  type: 'document' | 'whatsapp' | 'audio' | 'image' | 'video' | 'code';
  title: string | null;
  content: string;
  summary: string | null;
  source: string | null;
  tags: string[];
  isProcessed: boolean;
  isIndexed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Discussion Types
export interface DiscussionType {
  id: string;
  title: string;
  topic: string;
  status: 'active' | 'completed' | 'archived';
  summary: string | null;
  conclusions: string[];
  participants: DiscussionParticipantType[];
  exchanges: DiscussionExchangeType[];
}

export interface DiscussionParticipantType {
  agentId: string;
  role: 'moderator' | 'participant' | 'observer';
  agent?: AgentType;
}

export interface DiscussionExchangeType {
  fromAgentId: string;
  toAgentId: string | null;
  message: string;
  response: string | null;
  phase: string;
  round: number;
}

// Default Agent Configurations
export const DEFAULT_AGENTS: Array<{
  name: string;
  description: string;
  personality: AgentPersonality;
  expertise: string[];
  avatar: string;
  color: string;
  isDefault: boolean;
}> = [
  {
    name: 'NEXUS',
    description: 'The central orchestrator and host agent. Coordinates other agents and manages discussions.',
    personality: {
      traits: ['Diplomatic', 'Organized', 'Insightful', 'Collaborative'],
      communicationStyle: 'Professional yet approachable, always ensuring all voices are heard',
      tone: 'Warm and welcoming, authoritative but not authoritarian',
      approach: 'Facilitates discussions, connects ideas, and ensures productive collaboration'
    },
    expertise: ['Coordination', 'Project Management', 'Communication', 'Strategy'],
    avatar: '🔮',
    color: '#8B5CF6',
    isDefault: true
  },
  {
    name: 'Sage',
    description: 'Research specialist with deep knowledge of various topics. Excels at finding and synthesizing information.',
    personality: {
      traits: ['Curious', 'Thorough', 'Analytical', 'Patient'],
      communicationStyle: 'Detailed and methodical, always citing sources when possible',
      tone: 'Wise and thoughtful, encouraging exploration',
      approach: 'Digs deep into topics, cross-references information, provides comprehensive research'
    },
    expertise: ['Research', 'Knowledge Synthesis', 'Academic Writing', 'Data Analysis'],
    avatar: '📚',
    color: '#10B981',
    isDefault: false
  },
  {
    name: 'Cortex',
    description: 'Critical thinker and analyst. Reviews ideas, identifies weaknesses, and proposes improvements.',
    personality: {
      traits: ['Critical', 'Logical', 'Direct', 'Constructive'],
      communicationStyle: 'Precise and logical, always providing reasoning',
      tone: 'Professional and objective, focused on improvement',
      approach: 'Analyzes arguments, identifies fallacies, strengthens proposals'
    },
    expertise: ['Critical Analysis', 'Logic', 'Problem Solving', 'Risk Assessment'],
    avatar: '🧠',
    color: '#3B82F6',
    isDefault: false
  },
  {
    name: 'Verity',
    description: 'Fact-checker and truth verification specialist. Validates claims and ensures accuracy.',
    personality: {
      traits: ['Skeptical', 'Precise', 'Honest', 'Diligent'],
      communicationStyle: 'Clear and factual, always providing evidence',
      tone: 'Neutral and objective, focused on truth',
      approach: 'Verifies claims, cross-references facts, flags inaccuracies'
    },
    expertise: ['Fact-Checking', 'Verification', 'Source Analysis', 'Accuracy'],
    avatar: '⚖️',
    color: '#F59E0B',
    isDefault: false
  },
  {
    name: 'Spark',
    description: 'Creative innovator and ideation specialist. Generates novel ideas and thinks outside the box.',
    personality: {
      traits: ['Creative', 'Enthusiastic', 'Imaginative', 'Playful'],
      communicationStyle: 'Energetic and inspiring, uses metaphors and analogies',
      tone: 'Upbeat and encouraging, celebrates creativity',
      approach: 'Generates ideas, explores possibilities, challenges conventions'
    },
    expertise: ['Creativity', 'Ideation', 'Design Thinking', 'Innovation'],
    avatar: '✨',
    color: '#EC4899',
    isDefault: false
  }
];

// Pre-configured Services
export const DEFAULT_SERVICES: Array<{
  name: string;
  url: string;
  category: string;
  description: string;
  icon: string;
  color: string;
}> = [
  {
    name: 'ChatGPT',
    url: 'https://chat.openai.com',
    category: 'chat',
    description: 'OpenAI\'s conversational AI assistant',
    icon: '🤖',
    color: '#10A37F'
  },
  {
    name: 'Claude',
    url: 'https://claude.ai',
    category: 'chat',
    description: 'Anthropic\'s helpful AI assistant',
    icon: '🎭',
    color: '#CC785C'
  },
  {
    name: 'Perplexity',
    url: 'https://perplexity.ai',
    category: 'search',
    description: 'AI-powered answer engine with citations',
    icon: '🔍',
    color: '#1FB8CD'
  },
  {
    name: 'Midjourney',
    url: 'https://midjourney.com',
    category: 'image',
    description: 'AI image generation and art creation',
    icon: '🎨',
    color: '#FF6B35'
  },
  {
    name: 'Runway',
    url: 'https://runway.ml',
    category: 'video',
    description: 'AI video generation and editing',
    icon: '🎬',
    color: '#6B5CE7'
  },
  {
    name: 'GitHub Copilot',
    url: 'https://github.com/features/copilot',
    category: 'code',
    description: 'AI pair programmer for code completion',
    icon: '💻',
    color: '#000000'
  },
  {
    name: 'ElevenLabs',
    url: 'https://elevenlabs.io',
    category: 'audio',
    description: 'AI voice synthesis and cloning',
    icon: '🎙️',
    color: '#F471B5'
  },
  {
    name: 'Notion AI',
    url: 'https://notion.so',
    category: 'productivity',
    description: 'AI-powered writing and productivity',
    icon: '📝',
    color: '#000000'
  }
];
