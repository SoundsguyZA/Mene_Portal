/**
 * MenePortal API Handler
 * Manages communication with various AI agent APIs
 */

class APIHandler {
    constructor() {
        this.config = null;
        this.requestTimeouts = new Map();
    }

    async loadConfig() {
        try {
            const response = await fetch('./meneportal_config.json');
            this.config = await response.json();
            return this.config;
        } catch (error) {
            console.error('Failed to load configuration:', error);
            throw new Error('Configuration file not found or invalid');
        }
    }

    // OpenAI GPT-4 API integration
    async sendToOpenAI(agent, message) {
        if (!agent.apiKey || agent.apiKey === 'YOUR_OPENAI_API_KEY') {
            throw new Error('OpenAI API key not configured');
        }

        const requestBody = {
            model: "gpt-4o",
            messages: [
                {
                    role: "system",
                    content: "You are a helpful AI assistant in the MenePortal multi-agent chat interface. Provide clear, concise, and helpful responses."
                },
                {
                    role: "user",
                    content: message
                }
            ],
            max_tokens: 500,
            temperature: 0.7
        };

        try {
            const response = await fetch(agent.endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${agent.apiKey}`
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            return data.choices[0].message.content;
        } catch (error) {
            console.error('OpenAI API error:', error);
            throw new Error(`OpenAI request failed: ${error.message}`);
        }
    }

    // Kindroid API integration
    async sendToKindroid(agent, message) {
        if (!agent.apiKey || agent.apiKey === 'YOUR_KINDROID_API_KEY') {
            throw new Error('Kindroid API key not configured');
        }

        try {
            const response = await fetch(agent.endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${agent.apiKey}`
                },
                body: JSON.stringify({
                    message: message,
                    userId: 'meneportal-user',
                    sessionId: `session-${Date.now()}`
                })
            });

            if (!response.ok) {
                throw new Error(`Kindroid API error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            return data.response || data.message || 'No response received';
        } catch (error) {
            console.error('Kindroid API error:', error);
            throw new Error(`Kindroid request failed: ${error.message}`);
        }
    }

    // Groq API integration
    async sendToGroq(agent, message) {
        if (!agent.apiKey || agent.apiKey === 'YOUR_GROQ_API_KEY') {
            throw new Error('Groq API key not configured');
        }

        const requestBody = {
            messages: [
                {
                    role: "system",
                    content: "You are Kimi K2, an intelligent AI assistant. Provide helpful and engaging responses."
                },
                {
                    role: "user", 
                    content: message
                }
            ],
            model: "llama-3.1-70b-versatile",
            temperature: 0.7,
            max_tokens: 500
        };

        try {
            const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${agent.apiKey}`
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                throw new Error(`Groq API error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            return data.choices[0].message.content;
        } catch (error) {
            console.error('Groq API error:', error);
            throw new Error(`Groq request failed: ${error.message}`);
        }
    }

    // Local service integration
    async sendToLocalService(agent, message) {
        try {
            const response = await fetch(agent.endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: message,
                    timestamp: new Date().toISOString()
                }),
                timeout: 10000 // 10 second timeout for local services
            });

            if (!response.ok) {
                throw new Error(`Local service error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            return data.response || data.message || 'Local service responded but no message content found';
        } catch (error) {
            if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
                throw new Error('Local service unavailable - is the service running?');
            }
            throw new Error(`Local service request failed: ${error.message}`);
        }
    }

    // Main method to send message to any agent
    async sendMessage(agentName, message) {
        const agent = this.config.agents.find(a => a.name === agentName);
        if (!agent) {
            throw new Error(`Agent ${agentName} not found in configuration`);
        }

        // Add timeout handling
        const timeoutId = setTimeout(() => {
            throw new Error(`Request to ${agentName} timed out`);
        }, 30000); // 30 second timeout

        this.requestTimeouts.set(agentName, timeoutId);

        try {
            let response;
            
            if (agent.endpoint.includes('api.openai.com')) {
                response = await this.sendToOpenAI(agent, message);
            } else if (agent.endpoint.includes('api.kindroid.io')) {
                response = await this.sendToKindroid(agent, message);
            } else if (agent.endpoint.includes('groq.com') || agent.endpoint.includes('api.groq.com')) {
                response = await this.sendToGroq(agent, message);
            } else if (agent.endpoint.includes('localhost') || agent.endpoint.includes('127.0.0.1')) {
                response = await this.sendToLocalService(agent, message);
            } else {
                // Generic API handler
                response = await this.sendToGenericAPI(agent, message);
            }

            clearTimeout(this.requestTimeouts.get(agentName));
            this.requestTimeouts.delete(agentName);
            
            return response;
        } catch (error) {
            clearTimeout(this.requestTimeouts.get(agentName));
            this.requestTimeouts.delete(agentName);
            throw error;
        }
    }

    // Generic API handler for unknown endpoints
    async sendToGenericAPI(agent, message) {
        try {
            const headers = {
                'Content-Type': 'application/json'
            };

            if (agent.apiKey && agent.apiKey !== 'OPTIONAL') {
                headers['Authorization'] = `Bearer ${agent.apiKey}`;
            }

            const response = await fetch(agent.endpoint, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({
                    message: message,
                    user: 'meneportal-user',
                    timestamp: new Date().toISOString()
                })
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            return data.response || data.message || data.text || 'API responded but no message content found';
        } catch (error) {
            throw new Error(`Generic API request failed: ${error.message}`);
        }
    }

    // Test agent connection
    async testAgent(agentName) {
        try {
            await this.sendMessage(agentName, "Hello, this is a connection test.");
            return { status: 'connected', message: 'Agent is responding' };
        } catch (error) {
            return { status: 'error', message: error.message };
        }
    }

    // Get agent status
    getAgentStatus(agent) {
        if (!agent.apiKey || agent.apiKey.startsWith('YOUR_')) {
            return { status: 'unconfigured', message: 'API key not configured' };
        }
        
        if (agent.endpoint.includes('localhost')) {
            return { status: 'local', message: 'Local service' };
        }
        
        return { status: 'configured', message: 'Ready to connect' };
    }
}

// Speech-to-Text handler using ElevenLabs
class SpeechToTextHandler {
    constructor(config) {
        this.config = config?.speechToText;
    }

    async transcribeAudio(audioBlob) {
        if (!this.config || !this.config.apiKey || this.config.apiKey === 'YOUR_11LABS_API_KEY') {
            throw new Error('ElevenLabs API key not configured for speech-to-text');
        }

        const formData = new FormData();
        formData.append('audio', audioBlob, 'audio.webm');

        try {
            const response = await fetch(this.config.endpoint, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.config.apiKey}`
                },
                body: formData
            });

            if (!response.ok) {
                throw new Error(`Speech-to-text API error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            return data.text || data.transcript || '';
        } catch (error) {
            console.error('Speech-to-text error:', error);
            throw new Error(`Speech transcription failed: ${error.message}`);
        }
    }
}

// Export for use in main application
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { APIHandler, SpeechToTextHandler };
} else {
    window.APIHandler = APIHandler;
    window.SpeechToTextHandler = SpeechToTextHandler;
}