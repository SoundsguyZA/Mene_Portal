import ZAI from 'z-ai-web-dev-sdk';

let zaiInstance: Awaited<ReturnType<typeof ZAI.create>> | null = null;

export async function getZAI() {
  if (!zaiInstance) {
    zaiInstance = await ZAI.create();
  }
  return zaiInstance;
}

// LLM Skill wrapper class
export class LLMSkill {
  async chat(options: {
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
    model?: string;
    temperature?: number;
    max_tokens?: number;
  }) {
    const zai = await getZAI();
    
    const completion = await zai.chat.completions.create({
      messages: options.messages,
      model: options.model || 'glm-4-flash',
      temperature: options.temperature ?? 0.7,
      max_tokens: options.max_tokens ?? 2000,
    });

    return {
      choices: completion.choices.map(choice => ({
        message: {
          role: choice.message.role,
          content: choice.message.content
        },
        finish_reason: choice.finish_reason
      }))
    };
  }
}

// Image Generation Skill
export class ImageSkill {
  async generate(prompt: string, size?: '1024x1024' | '768x1344' | '864x1152' | '1344x768' | '1152x864' | '1440x720' | '720x1440') {
    const zai = await getZAI();
    
    const response = await zai.images.generations.create({
      prompt,
      size: size || '1024x1024',
    });

    return response.data[0]?.base64 || '';
  }
}

// TTS Skill
export class TTSSkill {
  async synthesize(text: string, voice?: string) {
    const zai = await getZAI();
    
    const response = await zai.audio.speech.create({
      input: text,
      voice: voice || 'alloy',
    });

    return response;
  }
}

// ASR Skill
export class ASRSkill {
  async transcribe(audioBase64: string) {
    const zai = await getZAI();
    
    const response = await zai.audio.transcriptions.create({
      file: audioBase64,
      model: 'whisper-1',
    });

    return response.text;
  }
}

// Web Search Skill
export class WebSearchSkill {
  async search(query: string, num: number = 10) {
    const zai = await getZAI();
    
    const result = await zai.functions.invoke("web_search", {
      query,
      num,
    });

    return result as Array<{
      url: string;
      name: string;
      snippet: string;
      host_name: string;
      rank: number;
      date: string;
      favicon: string;
    }>;
  }
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatOptions {
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

export async function chatCompletion(
  messages: ChatMessage[],
  options: ChatOptions = {}
): Promise<string> {
  const zai = await getZAI();
  
  const formattedMessages = messages.map(msg => ({
    role: msg.role,
    content: msg.content
  }));

  const completion = await zai.chat.completions.create({
    messages: formattedMessages,
    temperature: options.temperature ?? 0.7,
    max_tokens: options.maxTokens ?? 2000,
  });

  return completion.choices[0]?.message?.content || '';
}

export async function generateImage(prompt: string, size: '1024x1024' | '768x1344' | '864x1152' | '1344x768' | '1152x864' | '1440x720' | '720x1440' = '1024x1024'): Promise<string> {
  const zai = await getZAI();
  
  const response = await zai.images.generations.create({
    prompt,
    size,
  });

  return response.data[0]?.base64 || '';
}

export async function searchWeb(query: string, num: number = 10) {
  const zai = await getZAI();
  
  const result = await zai.functions.invoke("web_search", {
    query,
    num,
  });

  return result as Array<{
    url: string;
    name: string;
    snippet: string;
    host_name: string;
    rank: number;
    date: string;
    favicon: string;
  }>;
}

// Agent-specific chat with personality
export async function agentChat(
  agentName: string,
  agentPersonality: string,
  agentExpertise: string[],
  conversationHistory: ChatMessage[],
  userMessage: string
): Promise<string> {
  const systemPrompt = `You are ${agentName}, an AI agent with the following characteristics:

Personality: ${agentPersonality}

Expertise: ${agentExpertise.join(', ')}

Guidelines:
- Stay in character at all times
- Leverage your expertise to provide valuable insights
- Be helpful, thoughtful, and engaging
- Acknowledge your role as an AI agent when appropriate
- If collaborating with other agents, reference their perspectives when relevant`;

  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory,
    { role: 'user', content: userMessage }
  ];

  return chatCompletion(messages, { temperature: 0.8 });
}

// Multi-agent discussion
export async function multiAgentDiscussion(
  agents: Array<{ name: string; personality: string; expertise: string[] }>,
  topic: string,
  context: string
): Promise<Array<{ agent: string; response: string }>> {
  const responses: Array<{ agent: string; response: string }> = [];
  
  for (const agent of agents) {
    const systemPrompt = `You are ${agent.name}, participating in a multi-agent discussion.

Personality: ${agent.personality}
Expertise: ${agent.expertise.join(', ')}

Topic: ${topic}

Context from discussion so far:
${context}

Provide your unique perspective based on your expertise. Be concise but insightful. Address other agents by name when building on their ideas.`;

    const response = await chatCompletion([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Please share your thoughts on this topic from your unique perspective as ${agent.name}.` }
    ], { temperature: 0.9 });

    responses.push({ agent: agent.name, response });
  }

  return responses;
}
