/**
 * AGENT COORDINATOR
 * Manages multiple AI agents, routes queries, and coordinates responses
 */

const { v4: uuidv4 } = require('uuid');
const OpenAI = require('openai');
const Anthropic = require('@anthropic-ai/sdk');
const axios = require('axios');

class AgentCoordinator {
    constructor(memorySystem, cogniVault, sollyBridge) {
        this.agents = new Map();
        this.memorySystem = memorySystem;
        this.cogniVault = cogniVault;
        this.sollyBridge = sollyBridge;
        
        // Initialize API clients
        this.openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;
        this.anthropic = process.env.ANTHROPIC_API_KEY ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }) : null;
    }
    
    /**
     * Create a new AI agent
     */
    async createAgent({ name, service, personality, config = {} }) {
        const agentId = uuidv4();
        
        const agent = {
            id: agentId,
            name,
            service, // 'openai', 'anthropic', 'groq', 'gemini', 'kindroid', 'local'
            personality: personality || `You are ${name}, a helpful AI assistant.`,
            config: {
                model: config.model || this.getDefaultModel(service),
                temperature: config.temperature || 0.7,
                maxTokens: config.maxTokens || 2000,
                ...config
            },
            created: new Date().toISOString(),
            stats: {
                totalQueries: 0,
                totalTokens: 0,
                avgResponseTime: 0
            }
        };
        
        this.agents.set(agentId, agent);
        
        // Create memory branch for this agent
        await this.memorySystem.createBranch(agentId, name);
        
        console.log(`✅ Agent created: ${name} (${service}) - ID: ${agentId}`);
        
        return agent;
    }
    
    /**
     * Delete an agent
     */
    async deleteAgent(agentId) {
        const agent = this.agents.get(agentId);
        if (!agent) {
            throw new Error(`Agent not found: ${agentId}`);
        }
        
        this.agents.delete(agentId);
        await this.memorySystem.deleteBranch(agentId);
        
        console.log(`🗑️  Agent deleted: ${agent.name} (${agentId})`);
    }
    
    /**
     * Get all agents
     */
    async getAllAgents() {
        return Array.from(this.agents.values());
    }
    
    /**
     * Get active agents
     */
    getActiveAgents() {
        return Array.from(this.agents.values()).map(agent => ({
            id: agent.id,
            name: agent.name,
            service: agent.service,
            stats: agent.stats
        }));
    }
    
    /**
     * Query an agent with optional context
     */
    async query(agentId, message, options = {}) {
        const agent = this.agents.get(agentId);
        if (!agent) {
            throw new Error(`Agent not found: ${agentId}`);
        }
        
        const startTime = Date.now();
        
        try {
            // Gather context if requested
            let context = '';
            if (options.includeContext) {
                context = await this.gatherContext(agentId, message);
            }
            
            // Build full prompt
            const systemPrompt = agent.personality;
            const userMessage = context ? `${context}\n\nUser Query: ${message}` : message;
            
            // Route to appropriate service
            let response;
            switch (agent.service) {
                case 'openai':
                    response = await this.queryOpenAI(agent, systemPrompt, userMessage);
                    break;
                case 'anthropic':
                    response = await this.queryAnthropic(agent, systemPrompt, userMessage);
                    break;
                case 'groq':
                    response = await this.queryGroq(agent, systemPrompt, userMessage);
                    break;
                case 'gemini':
                    response = await this.queryGemini(agent, systemPrompt, userMessage);
                    break;
                case 'kindroid':
                    response = await this.queryKindroid(agent, userMessage);
                    break;
                case 'local':
                    response = await this.queryLocal(agent, systemPrompt, userMessage);
                    break;
                default:
                    throw new Error(`Unknown service: ${agent.service}`);
            }
            
            // Store in memory
            await this.memorySystem.addMemory(agentId, {
                type: 'conversation',
                user: message,
                assistant: response,
                context: context || null,
                timestamp: new Date().toISOString()
            });
            
            // Update stats
            const responseTime = Date.now() - startTime;
            agent.stats.totalQueries++;
            agent.stats.avgResponseTime = 
                (agent.stats.avgResponseTime * (agent.stats.totalQueries - 1) + responseTime) / agent.stats.totalQueries;
            
            return {
                success: true,
                response,
                context: context || null,
                agentId,
                agentName: agent.name,
                responseTime,
                timestamp: new Date().toISOString()
            };
            
        } catch (error) {
            console.error(`❌ Query failed for agent ${agent.name}:`, error.message);
            throw error;
        }
    }
    
    /**
     * Gather context from memory and CogniVault
     */
    async gatherContext(agentId, query) {
        const contextParts = [];
        
        // Get agent's own memories
        const agentMemories = await this.memorySystem.getRecentMemories(agentId, 5);
        if (agentMemories.length > 0) {
            contextParts.push('=== YOUR RECENT MEMORY ===');
            agentMemories.forEach(mem => {
                if (mem.type === 'conversation') {
                    contextParts.push(`User: ${mem.user}`);
                    contextParts.push(`You: ${mem.assistant}`);
                }
            });
        }
        
        // Get shared memories (from other agents)
        const sharedMemories = await this.memorySystem.getRelevantSharedMemories(query, 3);
        if (sharedMemories.length > 0) {
            contextParts.push('\n=== SHARED KNOWLEDGE (Other Agents) ===');
            sharedMemories.forEach(mem => {
                contextParts.push(`[${mem.agentName}]: ${mem.summary || mem.content}`);
            });
        }
        
        // Get CogniVault context
        try {
            const cvResults = await this.cogniVault.search(query, 3);
            if (cvResults.length > 0) {
                contextParts.push('\n=== KNOWLEDGE BASE (CogniVault) ===');
                cvResults.forEach(result => {
                    contextParts.push(`[${result.type}] ${result.filename}: ${result.content.substring(0, 300)}...`);
                });
            }
        } catch (error) {
            console.log('CogniVault context unavailable:', error.message);
        }
        
        return contextParts.join('\n');
    }
    
    /**
     * Query OpenAI (ChatGPT, GPT-4)
     */
    async queryOpenAI(agent, systemPrompt, userMessage) {
        if (!this.openai) {
            throw new Error('OpenAI API key not configured');
        }
        
        const completion = await this.openai.chat.completions.create({
            model: agent.config.model || 'gpt-4',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userMessage }
            ],
            temperature: agent.config.temperature,
            max_tokens: agent.config.maxTokens
        });
        
        agent.stats.totalTokens += completion.usage.total_tokens;
        return completion.choices[0].message.content;
    }
    
    /**
     * Query Anthropic (Claude)
     */
    async queryAnthropic(agent, systemPrompt, userMessage) {
        if (!this.anthropic) {
            throw new Error('Anthropic API key not configured');
        }
        
        const response = await this.anthropic.messages.create({
            model: agent.config.model || 'claude-3-5-sonnet-20241022',
            max_tokens: agent.config.maxTokens,
            system: systemPrompt,
            messages: [
                { role: 'user', content: userMessage }
            ]
        });
        
        return response.content[0].text;
    }
    
    /**
     * Query Groq
     */
    async queryGroq(agent, systemPrompt, userMessage) {
        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey) {
            throw new Error('Groq API key not configured');
        }
        
        const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
            model: agent.config.model || 'mixtral-8x7b-32768',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userMessage }
            ],
            temperature: agent.config.temperature,
            max_tokens: agent.config.maxTokens
        }, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });
        
        return response.data.choices[0].message.content;
    }
    
    /**
     * Query Google Gemini
     */
    async queryGemini(agent, systemPrompt, userMessage) {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error('Gemini API key not configured');
        }
        
        const fullPrompt = `${systemPrompt}\n\nUser: ${userMessage}`;
        
        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/${agent.config.model || 'gemini-pro'}:generateContent?key=${apiKey}`,
            {
                contents: [{
                    parts: [{ text: fullPrompt }]
                }]
            }
        );
        
        return response.data.candidates[0].content.parts[0].text;
    }
    
    /**
     * Query Kindroid (Bonny)
     */
    async queryKindroid(agent, userMessage) {
        const apiKey = process.env.KINDROID_API_KEY;
        const aiId = agent.config.kindroidId || process.env.KINDROID_AI_ID;
        
        if (!apiKey || !aiId) {
            throw new Error('Kindroid API credentials not configured');
        }
        
        const response = await axios.post('https://api.kindroid.ai/v1/send-message', {
            ai_id: aiId,
            message: userMessage
        }, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });
        
        return response.data.message || response.data.reply;
    }
    
    /**
     * Query local Ollama/Gemma
     */
    async queryLocal(agent, systemPrompt, userMessage) {
        const response = await axios.post('http://localhost:11434/api/generate', {
            model: agent.config.model || 'gemma2:2b',
            prompt: `${systemPrompt}\n\nUser: ${userMessage}\n\nAssistant:`,
            stream: false
        });
        
        return response.data.response;
    }
    
    /**
     * Get default model for service
     */
    getDefaultModel(service) {
        const defaults = {
            'openai': 'gpt-4',
            'anthropic': 'claude-3-5-sonnet-20241022',
            'groq': 'mixtral-8x7b-32768',
            'gemini': 'gemini-pro',
            'kindroid': 'kindroid',
            'local': 'gemma2:2b'
        };
        return defaults[service] || 'gpt-4';
    }
    
    /**
     * Export agent data
     */
    async exportAgent(agentId) {
        const agent = this.agents.get(agentId);
        if (!agent) {
            throw new Error(`Agent not found: ${agentId}`);
        }
        
        const memories = await this.memorySystem.getAgentMemories(agentId);
        
        return {
            agent,
            memories,
            exportedAt: new Date().toISOString()
        };
    }
    
    /**
     * Get system status
     */
    getStatus() {
        return {
            totalAgents: this.agents.size,
            agents: this.getActiveAgents(),
            services: {
                openai: !!this.openai,
                anthropic: !!this.anthropic,
                groq: !!process.env.GROQ_API_KEY,
                gemini: !!process.env.GEMINI_API_KEY,
                kindroid: !!process.env.KINDROID_API_KEY,
                local: true
            }
        };
    }
}

module.exports = AgentCoordinator;
