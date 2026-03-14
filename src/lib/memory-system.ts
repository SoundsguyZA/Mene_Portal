import { db } from './db';
import type { Memory, KnowledgeItem, Agent } from '@prisma/client';

// Memory System - Handles memory storage, retrieval, and knowledge indexing

export interface MemorySearchResult {
  memory: Memory;
  relevance: number;
}

// Store a new memory
export async function storeMemory(
  userId: string,
  type: 'semantic' | 'episodic' | 'procedural' | 'conversation',
  content: string,
  options: {
    agentId?: string;
    importance?: number;
    metadata?: Record<string, unknown>;
    expiresIn?: number; // hours until expiration
  } = {}
): Promise<Memory> {
  const expiresAt = options.expiresIn
    ? new Date(Date.now() + options.expiresIn * 60 * 60 * 1000)
    : undefined;

  return db.memory.create({
    data: {
      userId,
      type,
      content,
      agentId: options.agentId,
      importance: options.importance ?? 0.5,
      metadata: options.metadata,
      expiresAt
    }
  });
}

// Retrieve relevant memories
export async function retrieveMemories(
  userId: string,
  query: string,
  options: {
    agentId?: string;
    type?: 'semantic' | 'episodic' | 'procedural' | 'conversation';
    limit?: number;
    minImportance?: number;
  } = {}
): Promise<Memory[]> {
  const memories = await db.memory.findMany({
    where: {
      userId,
      agentId: options.agentId,
      type: options.type,
      importance: { gte: options.minImportance ?? 0 },
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } }
      ]
    },
    orderBy: [
      { importance: 'desc' },
      { lastAccessed: 'desc' },
      { createdAt: 'desc' }
    ],
    take: options.limit ?? 10
  });

  // Simple keyword matching for relevance
  const queryWords = query.toLowerCase().split(/\s+/);
  const scoredMemories = memories.map(memory => {
    const contentLower = memory.content.toLowerCase();
    const score = queryWords.reduce((acc, word) => {
      const regex = new RegExp(word, 'gi');
      const matches = contentLower.match(regex);
      return acc + (matches ? matches.length : 0);
    }, 0);
    return { memory, score };
  });

  // Sort by relevance score
  scoredMemories.sort((a, b) => b.score - a.score);

  // Update access count for retrieved memories
  const memoryIds = scoredMemories.slice(0, options.limit ?? 10).map(m => m.memory.id);
  await db.memory.updateMany({
    where: { id: { in: memoryIds } },
    data: {
      accessCount: { increment: 1 },
      lastAccessed: new Date()
    }
  });

  return scoredMemories.slice(0, options.limit ?? 10).map(m => m.memory);
}

// Get memory stats
export async function getMemoryStats(userId: string): Promise<{
  total: number;
  byType: Record<string, number>;
  avgImportance: number;
  recentCount: number;
}> {
  const memories = await db.memory.findMany({
    where: {
      userId,
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } }
      ]
    }
  });

  const byType: Record<string, number> = {};
  let totalImportance = 0;
  let recentCount = 0;
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  for (const memory of memories) {
    byType[memory.type] = (byType[memory.type] || 0) + 1;
    totalImportance += memory.importance;
    if (memory.createdAt > oneWeekAgo) {
      recentCount++;
    }
  }

  return {
    total: memories.length,
    byType,
    avgImportance: memories.length > 0 ? totalImportance / memories.length : 0,
    recentCount
  };
}

// Delete old or expired memories
export async function cleanupMemories(userId: string): Promise<number> {
  const result = await db.memory.deleteMany({
    where: {
      userId,
      expiresAt: { lt: new Date() }
    }
  });
  return result.count;
}

// ============================================================================
// Knowledge Vault Functions
// ============================================================================

// Add knowledge item
export async function addKnowledgeItem(
  userId: string,
  type: 'document' | 'whatsapp' | 'audio' | 'image' | 'video' | 'code',
  content: string,
  options: {
    title?: string;
    source?: string;
    tags?: string[];
    summary?: string;
  } = {}
): Promise<KnowledgeItem> {
  return db.knowledgeItem.create({
    data: {
      userId,
      type,
      content,
      title: options.title,
      source: options.source,
      tags: options.tags || [],
      summary: options.summary,
      isProcessed: false,
      isIndexed: false
    }
  });
}

// Process knowledge item (generate summary, etc.)
export async function processKnowledgeItem(itemId: string): Promise<{
  success: boolean;
  summary?: string;
  error?: string;
}> {
  const item = await db.knowledgeItem.findUnique({
    where: { id: itemId }
  });

  if (!item) {
    return { success: false, error: 'Item not found' };
  }

  try {
    // Generate summary using AI
    const { chatCompletion } = await import('./z-ai');
    
    const summary = await chatCompletion([
      {
        role: 'system',
        content: 'You are a knowledge summarizer. Create concise, informative summaries that capture key points and insights.'
      },
      {
        role: 'user',
        content: `Summarize the following content in 2-3 sentences:\n\n${item.content.substring(0, 4000)}`
      }
    ], { temperature: 0.3, maxTokens: 200 });

    // Extract tags
    const tagsResponse = await chatCompletion([
      {
        role: 'system',
        content: 'Extract relevant tags from the content. Return only comma-separated tags, nothing else.'
      },
      {
        role: 'user',
        content: `Extract 5-10 relevant tags from:\n\n${item.content.substring(0, 2000)}`
      }
    ], { temperature: 0.2, maxTokens: 100 });

    const tags = tagsResponse.split(',').map(t => t.trim()).filter(t => t.length > 0);

    // Update item
    await db.knowledgeItem.update({
      where: { id: itemId },
      data: {
        summary,
        tags,
        isProcessed: true,
        isIndexed: true
      }
    });

    return { success: true, summary };
  } catch (error) {
    console.error('Error processing knowledge item:', error);
    return { success: false, error: String(error) };
  }
}

// Search knowledge items
export async function searchKnowledge(
  userId: string,
  query: string,
  options: {
    type?: 'document' | 'whatsapp' | 'audio' | 'image' | 'video' | 'code';
    tags?: string[];
    limit?: number;
  } = {}
): Promise<KnowledgeItem[]> {
  const items = await db.knowledgeItem.findMany({
    where: {
      userId,
      type: options.type,
      isProcessed: true,
      isIndexed: true
    }
  });

  // Simple keyword matching
  const queryWords = query.toLowerCase().split(/\s+/);
  const scoredItems = items.map(item => {
    let score = 0;
    const titleLower = (item.title || '').toLowerCase();
    const contentLower = item.content.toLowerCase();
    const summaryLower = (item.summary || '').toLowerCase();
    const itemTags = (item.tags as string[]) || [];

    // Score based on query words
    for (const word of queryWords) {
      if (titleLower.includes(word)) score += 3;
      if (summaryLower.includes(word)) score += 2;
      if (contentLower.includes(word)) score += 1;
      if (itemTags.some(tag => tag.toLowerCase().includes(word))) score += 2;
    }

    // Boost score if tags match
    if (options.tags) {
      for (const tag of options.tags) {
        if (itemTags.some(t => t.toLowerCase() === tag.toLowerCase())) {
          score += 5;
        }
      }
    }

    return { item, score };
  });

  // Sort by score and return
  scoredItems.sort((a, b) => b.score - a.score);
  return scoredItems.slice(0, options.limit ?? 10).map(s => s.item);
}

// Get knowledge stats
export async function getKnowledgeStats(userId: string): Promise<{
  total: number;
  byType: Record<string, number>;
  processed: number;
  indexed: number;
  recentCount: number;
}> {
  const items = await db.knowledgeItem.findMany({
    where: { userId }
  });

  const byType: Record<string, number> = {};
  let processed = 0;
  let indexed = 0;
  let recentCount = 0;
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  for (const item of items) {
    byType[item.type] = (byType[item.type] || 0) + 1;
    if (item.isProcessed) processed++;
    if (item.isIndexed) indexed++;
    if (item.createdAt > oneWeekAgo) recentCount++;
  }

  return {
    total: items.length,
    byType,
    processed,
    indexed,
    recentCount
  };
}

// Delete knowledge item
export async function deleteKnowledgeItem(userId: string, itemId: string): Promise<boolean> {
  const result = await db.knowledgeItem.deleteMany({
    where: { id: itemId, userId }
  });
  return result.count > 0;
}

// Get all unique tags
export async function getKnowledgeTags(userId: string): Promise<string[]> {
  const items = await db.knowledgeItem.findMany({
    where: { userId },
    select: { tags: true }
  });

  const tagSet = new Set<string>();
  for (const item of items) {
    const tags = item.tags as string[];
    if (tags) {
      tags.forEach(tag => tagSet.add(tag));
    }
  }

  return Array.from(tagSet).sort();
}

// Create memory from conversation
export async function createMemoryFromConversation(
  userId: string,
  conversationId: string,
  agentId?: string
): Promise<Memory | null> {
  // Get conversation messages
  const messages = await db.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: 'asc' }
  });

  if (messages.length === 0) return null;

  // Format conversation
  const conversationText = messages
    .map(m => `[${m.role}]: ${m.content}`)
    .join('\n');

  // Generate importance score based on conversation length
  const importance = Math.min(0.9, 0.3 + messages.length * 0.05);

  return storeMemory(userId, 'conversation', conversationText, {
    agentId,
    importance,
    metadata: { conversationId, messageCount: messages.length }
  });
}

// ============================================================================
// WhatsApp Export Processing
// ============================================================================

interface WhatsAppMessage {
  date: string;
  time: string;
  sender: string;
  content: string;
  isMedia: boolean;
  mediaType?: 'image' | 'video' | 'audio' | 'document';
  mediaName?: string;
}

interface WhatsAppExport {
  chatName: string;
  participants: string[];
  messages: WhatsAppMessage[];
  exportedAt: string;
}

// Parse WhatsApp export file
export function parseWhatsAppExport(content: string): WhatsAppExport {
  const lines = content.split('\n');
  const messages: WhatsAppMessage[] = [];
  const participants = new Set<string>();
  let chatName = 'WhatsApp Chat';

  // WhatsApp message pattern: [DD/MM/YYYY, HH:MM:SS] Sender: Message
  const messagePattern = /^\[(\d{2}\/\d{2}\/\d{4}),\s+(\d{2}:\d{2}:\d{2})\]\s+([^:]+):\s+(.*)$/;
  // Alternative pattern: DD/MM/YYYY, HH:MM:SS - Sender: Message
  const altPattern = /^(\d{2}\/\d{2}\/\d{4}),\s+(\d{2}:\d{2})\s+-\s+([^:]+):\s+(.*)$/;
  // Media message pattern
  const mediaPattern = /<attached:\s*([^>]+)>|(\S+\.(jpg|jpeg|png|gif|mp4|mp3|pdf|doc|ogg|opus))/i;

  for (const line of lines) {
    const match = line.match(messagePattern) || line.match(altPattern);
    
    if (match) {
      const [, date, time, sender, content] = match;
      participants.add(sender.trim());

      const isMedia = mediaPattern.test(content);
      let mediaType: WhatsAppMessage['mediaType'] = undefined;
      let mediaName: string | undefined = undefined;

      if (isMedia) {
        const mediaMatch = content.match(mediaPattern);
        if (mediaMatch) {
          mediaName = mediaMatch[1] || mediaMatch[2];
          const ext = mediaName.split('.').pop()?.toLowerCase();
          
          if (['jpg', 'jpeg', 'png', 'gif'].includes(ext || '')) {
            mediaType = 'image';
          } else if (['mp4', 'mov', 'avi'].includes(ext || '')) {
            mediaType = 'video';
          } else if (['mp3', 'ogg', 'opus', 'm4a'].includes(ext || '')) {
            mediaType = 'audio';
          } else {
            mediaType = 'document';
          }
        }
      }

      messages.push({
        date,
        time,
        sender: sender.trim(),
        content: content.trim(),
        isMedia,
        mediaType,
        mediaName
      });
    } else if (line.includes('created group') || line.includes('changed subject')) {
      // Extract chat name from group creation message
      const nameMatch = line.match(/(?:created group|changed subject to)["']?\s*"?([^"']+)"/i);
      if (nameMatch) {
        chatName = nameMatch[1].trim();
      }
    }
  }

  return {
    chatName,
    participants: Array.from(participants),
    messages,
    exportedAt: new Date().toISOString()
  };
}

// Import WhatsApp chat to knowledge base
export async function importWhatsAppChat(
  userId: string,
  content: string,
  options: { source?: string; processMedia?: boolean } = {}
): Promise<{
  success: boolean;
  chatName?: string;
  messageCount?: number;
  knowledgeItemId?: string;
  error?: string;
}> {
  try {
    const exportData = parseWhatsAppExport(content);
    
    // Format for knowledge base
    const formattedContent = `WhatsApp Chat: ${exportData.chatName}
Participants: ${exportData.participants.join(', ')}
Messages: ${exportData.messages.length}

${exportData.messages.map(m => {
  const mediaInfo = m.isMedia ? ` [${m.mediaType}: ${m.mediaName}]` : '';
  return `[${m.date} ${m.time}] ${m.sender}:${mediaInfo} ${m.content}`;
}).join('\n')}`;

    // Store in knowledge base
    const item = await addKnowledgeItem(userId, 'whatsapp', formattedContent, {
      title: `WhatsApp: ${exportData.chatName}`,
      source: options.source || 'WhatsApp Export',
      tags: ['whatsapp', 'chat', ...exportData.participants.map(p => p.toLowerCase().replace(/\s+/g, '_'))]
    });

    // Process asynchronously
    processKnowledgeItem(item.id).catch(err => 
      console.error('Failed to process WhatsApp chat:', err)
    );

    return {
      success: true,
      chatName: exportData.chatName,
      messageCount: exportData.messages.length,
      knowledgeItemId: item.id
    };
  } catch (error) {
    console.error('Error importing WhatsApp chat:', error);
    return { success: false, error: String(error) };
  }
}

// ============================================================================
// Document Processing
// ============================================================================

// Process and chunk document content
export function chunkDocument(
  content: string,
  options: {
    maxChunkSize?: number;
    overlap?: number;
    respectParagraphs?: boolean;
  } = {}
): string[] {
  const { maxChunkSize = 1000, overlap = 100, respectParagraphs = true } = options;
  const chunks: string[] = [];

  if (respectParagraphs) {
    const paragraphs = content.split(/\n\n+/);
    let currentChunk = '';

    for (const paragraph of paragraphs) {
      if (currentChunk.length + paragraph.length + 2 > maxChunkSize) {
        if (currentChunk.length > 0) {
          chunks.push(currentChunk.trim());
          // Keep some overlap
          currentChunk = currentChunk.slice(-overlap) + '\n\n' + paragraph;
        } else {
          // Single paragraph is too long, split by sentences
          const sentences = paragraph.match(/[^.!?]+[.!?]+/g) || [paragraph];
          for (const sentence of sentences) {
            if (currentChunk.length + sentence.length > maxChunkSize) {
              if (currentChunk.length > 0) {
                chunks.push(currentChunk.trim());
              }
              currentChunk = sentence;
            } else {
              currentChunk += sentence;
            }
          }
        }
      } else {
        currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
      }
    }

    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }
  } else {
    // Simple character-based chunking
    for (let i = 0; i < content.length; i += maxChunkSize - overlap) {
      chunks.push(content.slice(i, i + maxChunkSize));
    }
  }

  return chunks;
}

// Import document to knowledge base
export async function importDocument(
  userId: string,
  content: string,
  options: {
    title?: string;
    source?: string;
    type?: 'document' | 'code';
    language?: string;
    chunkContent?: boolean;
  } = {}
): Promise<{
  success: boolean;
  knowledgeItemId?: string;
  chunkIds?: string[];
  error?: string;
}> {
  try {
    const { chunkContent = content.length > 5000 } = options;

    if (chunkContent && content.length > 5000) {
      // Chunk large documents
      const chunks = chunkDocument(content);
      const chunkIds: string[] = [];

      // Store main document metadata
      const mainItem = await addKnowledgeItem(userId, options.type || 'document', content.slice(0, 2000), {
        title: options.title,
        source: options.source,
        tags: ['document', 'chunked', `chunks:${chunks.length}`]
      });
      chunkIds.push(mainItem.id);

      // Store chunks
      for (let i = 0; i < chunks.length; i++) {
        const chunkItem = await addKnowledgeItem(userId, options.type || 'document', chunks[i], {
          title: `${options.title || 'Document'} - Part ${i + 1}`,
          source: options.source,
          tags: ['document', 'chunk', `parent:${mainItem.id}`]
        });
        chunkIds.push(chunkItem.id);
      }

      // Process main item
      processKnowledgeItem(mainItem.id).catch(err => 
        console.error('Failed to process document:', err)
      );

      return { success: true, knowledgeItemId: mainItem.id, chunkIds };
    } else {
      // Store single document
      const item = await addKnowledgeItem(userId, options.type || 'document', content, {
        title: options.title,
        source: options.source,
        tags: options.language ? ['document', options.language] : ['document']
      });

      // Process asynchronously
      processKnowledgeItem(item.id).catch(err => 
        console.error('Failed to process document:', err)
      );

      return { success: true, knowledgeItemId: item.id };
    }
  } catch (error) {
    console.error('Error importing document:', error);
    return { success: false, error: String(error) };
  }
}

// ============================================================================
// Knowledge Context for Agents
// ============================================================================

// Get relevant knowledge context for agent queries
export async function getKnowledgeContext(
  userId: string,
  query: string,
  options: {
    maxItems?: number;
    maxContentLength?: number;
    types?: string[];
  } = {}
): Promise<string> {
  const { maxItems = 5, maxContentLength = 4000 } = options;

  const memories = await retrieveMemories(userId, query, { limit: 3 });
  const knowledgeItems = await searchKnowledge(userId, query, { limit: maxItems });

  let context = '## Relevant Context\n\n';

  if (memories.length > 0) {
    context += '### Memories\n';
    for (const memory of memories.slice(0, 2)) {
      context += `- ${memory.content.slice(0, 200)}\n`;
    }
    context += '\n';
  }

  if (knowledgeItems.length > 0) {
    context += '### Knowledge Base\n';
    for (const item of knowledgeItems) {
      const content = item.summary || item.content;
      context += `**${item.title || 'Item'}**: ${content.slice(0, 300)}\n\n`;
    }
  }

  // Truncate if too long
  if (context.length > maxContentLength) {
    context = context.slice(0, maxContentLength) + '\n... (truncated)';
  }

  return context;
}
