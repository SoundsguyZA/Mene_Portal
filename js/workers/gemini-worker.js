// Gemini Worker - AI Service Integration
class GeminiWorker {
    constructor() {
        this.isInitialized = false;
        this.messageQueue = [];
        this.responseHistory = [];
    }

    async initialize(config) {
        try {
            this.config = config;
            this.isInitialized = true;

            await this.delay(900);

            this.postMessage({ type: 'initialized' });
        } catch (error) {
            this.postMessage({ type: 'error', error: error.message });
        }
    }

    async sendMessage(message, context) {
        if (!this.isInitialized) {
            this.messageQueue.push({ message, context });
            return;
        }

        try {
            await this.delay(700 + Math.random() * 1000);

            const response = await this.generateGeminiResponse(message, context);

            this.responseHistory.push({ message, response, timestamp: Date.now() });

            this.postMessage({
                type: 'message',
                data: {
                    content: response,
                    metadata: {
                        model: 'gemini-pro',
                        timestamp: Date.now(),
                        safety_ratings: 'SAFE'
                    }
                }
            });

        } catch (error) {
            this.postMessage({ type: 'error', error: error.message });
        }
    }

    async generateGeminiResponse(message, context) {
        const geminiStarters = [
            "I can help you explore this topic.",
            "That's an interesting question to consider.",
            "Let me provide you with comprehensive information.",
            "I'd be happy to assist with that inquiry.",
            "Here's what I can tell you about this:"
        ];

        const starter = geminiStarters[Math.floor(Math.random() * geminiStarters.length)];
        let response = starter + "\n\n";

        const lowerMessage = message.toLowerCase();

        if (lowerMessage.includes('multimodal') || lowerMessage.includes('image') || lowerMessage.includes('visual')) {
            response += `For "${message}", I can work with multiple types of input including text, images, and code. While I can't process images in this demo, in a full implementation I could analyze visual content, extract text from images, and provide detailed descriptions.\n\nWhat specific multimodal task would you like help with?`;
        } else if (lowerMessage.includes('search') || lowerMessage.includes('find') || lowerMessage.includes('research')) {
            response += `Regarding "${message}", here's what I found:\n\n🔍 Research insights:\n• Primary sources indicate: [Key finding]\n• Recent developments: [Updates]\n• Related topics: [Connections]\n\nI can help you dive deeper into any of these areas.`;
        } else if (lowerMessage.includes('creative') || lowerMessage.includes('generate') || lowerMessage.includes('create')) {
            response += `For your creative request "${message}", I can generate various types of content:\n\n🎨 Creative options:\n• Written content (stories, poems, scripts)\n• Code and technical solutions\n• Structured data and formats\n• Interactive examples\n\nWhat type of creative output would be most helpful?`;
        } else {
            response += `About "${message}" - I can provide detailed, factual information on this topic.\n\nHere's a comprehensive overview:\n\n📚 Background: [Context and history]\n🔬 Technical details: [Specifics and mechanics]\n🌟 Applications: [Real-world uses]\n🔮 Future considerations: [Trends and developments]\n\nWould you like me to expand on any particular aspect?`;
        }

        if (context.personality && context.personality.trim()) {
            response += `\n\n🎭 Personality context: Adapting my response style based on: ${context.personality}`;
        }

        return response;
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    postMessage(data) {
        self.postMessage(data);
    }
}

const worker = new GeminiWorker();

self.onmessage = async function(event) {
    const { type, config, message, context } = event.data;

    switch (type) {
        case 'initialize':
            await worker.initialize(config);
            break;
        case 'sendMessage':
            await worker.sendMessage(message, context);
            break;
        default:
            console.log('Unknown message type:', type);
    }
};