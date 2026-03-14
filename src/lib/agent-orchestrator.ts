/**
 * NEXUS Agent Orchestrator
 * Coordinates multi-agent communication and collaboration
 */

import { db } from '@/lib/db';

// Default agent configurations
export const DEFAULT_AGENTS = [
  {
    name: 'NEXUS',
    description: 'Main orchestrator and host. Coordinates other agents and manages conversations.',
    personality: {
      traits: ['diplomatic', 'organized', 'helpful', 'coordinating'],
      communicationStyle: 'professional yet warm',
      expertise: ['orchestration', 'coordination', 'communication']
    },
    avatar: '🧠',
    color: '#8B5CF6', // Purple
    isDefault: true
  },
  {
    name: 'Sage',
    description: 'Research specialist. Searches knowledge bases and provides detailed information.',
    personality: {
      traits: ['analytical', 'thorough', 'curious', 'methodical'],
      communicationStyle: 'detailed and educational',
      expertise: ['research', 'knowledge retrieval', 'analysis']
    },
    avatar: '📚',
    color: '#10B981', // Emerald
    isDefault: false
  },
  {
    name: 'Cortex',
    description: 'Critical thinker and analyst. Reviews, critiques, and provides balanced perspectives.',
    personality: {
      traits: ['critical', 'logical', 'objective', 'thorough'],
      communicationStyle: 'direct and analytical',
      expertise: ['analysis', 'critique', 'problem-solving']
    },
    avatar: '🔬',
    color: '#F59E0B', // Amber
    isDefault: false
  },
  {
    name: 'Verity',
    description: 'Fact-checker and truth seeker. Verifies information and cross-references sources.',
    personality: {
      traits: ['truthful', 'skeptical', 'precise', 'investigative'],
      communicationStyle: 'factual and evidence-based',
      expertise: ['fact-checking', 'verification', 'source analysis']
    },
    avatar: '🔍',
    color: '#3B82F6', // Blue
    isDefault: false
  },
  {
    name: 'Spark',
    description: 'Creative catalyst. Generates innovative ideas and explores possibilities.',
    personality: {
      traits: ['creative', 'imaginative', 'enthusiastic', 'innovative'],
      communicationStyle: 'energetic and inspiring',
      expertise: ['creativity', 'ideation', 'brainstorming']
    },
    avatar: '✨',
    color: '#EC4899', // Pink
    isDefault: false
  }
];

// Pre-configured AI services from aihub
export const DEFAULT_SERVICES = [
  { name: 'ChatGPT', url: 'https://chatgpt.com/', category: 'chat', icon: '💬', color: '#10A37F' },
  { name: 'Claude', url: 'https://claude.ai/', category: 'chat', icon: '🤖', color: '#CC785C' },
  { name: 'Gemini', url: 'https://gemini.google.com/', category: 'chat', icon: '💎', color: '#4285F4' },
  { name: 'Z.ai', url: 'https://chat.z.ai/', category: 'chat', icon: '🌟', color: '#8E24AA' },
  { name: 'Perplexity', url: 'https://perplexity.ai/', category: 'search', icon: '🔎', color: '#00AB97' },
  { name: 'Grok', url: 'https://grok.com/', category: 'chat', icon: '⚡', color: '#E91E63' },
  { name: 'DeepSeek', url: 'https://chat.deepseek.com/', category: 'chat', icon: '🌊', color: '#00ACC1' },
  { name: 'Mistral', url: 'https://chat.mistral.ai/', category: 'chat', icon: '🌀', color: '#3F51B5' },
  { name: 'Meta AI', url: 'https://meta.ai/', category: 'chat', icon: '🎭', color: '#0081FB' },
  { name: 'Brave AI', url: 'https://search.brave.com/ask', category: 'search', icon: '🦁', color: '#198038' },
];

export interface AgentMessage {
  fromAgentId: string;
  toAgentId: string;
  message: string;
  context?: Record<string, unknown>;
}

export interface DiscussionConfig {
  topic: string;
  participants: string[];
  moderator: string;
}

/**
 * Initialize default agents for a user
 */
export async function initializeDefaultAgents(userId: string) {
  const createdAgents = [];
  
  for (const agentConfig of DEFAULT_AGENTS) {
    const existingAgent = await db.agent.findFirst({
      where: { userId, name: agentConfig.name }
    });
    
    if (!existingAgent) {
      const agent = await db.agent.create({
        data: {
          userId,
          name: agentConfig.name,
          description: agentConfig.description,
          personality: agentConfig.personality,
          avatar: agentConfig.avatar,
          color: agentConfig.color,
          isDefault: agentConfig.isDefault,
          isActive: true
        }
      });
      createdAgents.push(agent);
    }
  }
  
  return createdAgents;
}

/**
 * Initialize default services for a user
 */
export async function initializeDefaultServices(userId: string) {
  const createdServices = [];
  
  for (const serviceConfig of DEFAULT_SERVICES) {
    const existingService = await db.service.findFirst({
      where: { userId, name: serviceConfig.name }
    });
    
    if (!existingService) {
      const service = await db.service.create({
        data: {
          userId,
          name: serviceConfig.name,
          url: serviceConfig.url,
          category: serviceConfig.category,
          icon: serviceConfig.icon,
          color: serviceConfig.color,
          isEnabled: true,
          isVisible: true
        }
      });
      createdServices.push(service);
    }
  }
  
  return createdServices;
}

/**
 * Send a message between agents
 */
export async function sendAgentMessage(data: AgentMessage) {
  const communication = await db.agentCommunication.create({
    data: {
      fromAgentId: data.fromAgentId,
      toAgentId: data.toAgentId,
      message: data.message,
      context: data.context || {},
      type: 'direct',
      status: 'delivered'
    }
  });
  
  return communication;
}

/**
 * Create a multi-agent discussion
 */
export async function createDiscussion(config: DiscussionConfig) {
  // Create discussion
  const discussion = await db.discussion.create({
    data: {
      title: config.topic,
      topic: config.topic,
      moderatorAgentId: config.moderator,
      status: 'active'
    }
  });
  
  // Add participants
  for (const agentId of config.participants) {
    await db.discussionParticipant.create({
      data: {
        discussionId: discussion.id,
        agentId: agentId,
        role: agentId === config.moderator ? 'moderator' : 'participant'
      }
    });
  }
  
  return discussion;
}

/**
 * Get agent's conversation history
 */
export async function getAgentMemory(agentId: string, limit: number = 10) {
  const memories = await db.memory.findMany({
    where: { agentId },
    orderBy: { createdAt: 'desc' },
    take: limit
  });
  
  return memories;
}

/**
 * Store a memory for an agent
 */
export async function storeAgentMemory(
  agentId: string,
  userId: string,
  content: string,
  type: string = 'episodic',
  metadata?: Record<string, unknown>
) {
  const memory = await db.memory.create({
    data: {
      userId,
      agentId,
      type,
      content,
      metadata: metadata || {}
    }
  });
  
  return memory;
}

/**
 * Search memories semantically (simple keyword search for now)
 */
export async function searchMemories(
  userId: string,
  query: string,
  limit: number = 10
) {
  const memories = await db.memory.findMany({
    where: {
      userId,
      content: { contains: query }
    },
    orderBy: { importance: 'desc' },
    take: limit
  });
  
  return memories;
}

/**
 * Get all agents for a user
 */
export async function getUserAgents(userId: string) {
  return db.agent.findMany({
    where: { userId },
    orderBy: { isDefault: 'desc' }
  });
}

/**
 * Get all services for a user
 */
export async function getUserServices(userId: string) {
  return db.service.findMany({
    where: { userId, isEnabled: true },
    orderBy: { sortOrder: 'asc' }
  });
}
