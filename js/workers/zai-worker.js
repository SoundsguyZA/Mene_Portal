// Z.ai Worker - AI Service Integration
class ZAIWorker {
    constructor() {
        this.isInitialized = false;
        this.messageQueue = [];
        this.responseHistory = [];
    }

    async initialize(config) {
        try {
            this.config = config;
            this.isInitialized = true;

            // Simulate Z.ai initialization
            await this.delay(800);

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
            // Simulate Z.ai's fast response time
            await this.delay(600 + Math.random() * 800);

            const response = await this.generateZAIResponse(message, context);

            this.responseHistory.push({ message, response, timestamp: Date.now() });

            this.postMessage({
                type: 'message',
                data: {
                    content: response,
                    metadata: {
                        model: 'GLM-4.5',
                        timestamp: Date.now(),
                        responseTime: Math.floor(600 + Math.random() * 800)
                    }
                }
            });

        } catch (error) {
            this.postMessage({ type: 'error', error: error.message });
        }
    }

    async generateZAIResponse(message, context) {
        // Z.ai style responses - concise and direct
        const zaiPrefixes = [
            "Here's what I think about that:",
            "Let me help you with this:",
            "Based on your question:",
            "I can assist with that.",
            "Good question! Here's my take:"
        ];

        const prefix = zaiPrefixes[Math.floor(Math.random() * zaiPrefixes.length)];
        let response = prefix + " ";

        const lowerMessage = message.toLowerCase();

        if (lowerMessage.includes('code') || lowerMessage.includes('programming') || lowerMessage.includes('function')) {
            response += `For "${message}", here's a clean solution:\n\n\`\`\`javascript\n// Example implementation\nfunction solution() {\n    // Your code here\n    return "Working code example";\n}\n\`\`\`\n\nThis approach is efficient and follows best practices. Need any modifications?`;
        } else if (lowerMessage.includes('data') || lowerMessage.includes('analysis') || lowerMessage.includes('calculate')) {
            response += `Regarding "${message}", let's break down the data:\n\n📊 Key metrics:\n• Primary factor: [Analysis point]\n• Secondary consideration: [Data insight]\n• Recommendation: [Action item]\n\nWould you like me to dive deeper into any specific aspect?`;
        } else if (lowerMessage.includes('quick') || lowerMessage.includes('fast') || lowerMessage.includes('summary')) {
            response += `Quick answer for "${message}":\n\n✅ Main point: Direct solution\n⚡ Fast approach: Streamlined method\n🎯 Result: Expected outcome\n\nNeed more details on any part?`;
        } else if (lowerMessage.includes('compare') || lowerMessage.includes('vs') || lowerMessage.includes('difference')) {
            response += `Comparing "${message}":\n\n📋 Option A:\n• Pros: [Benefits]\n• Cons: [Limitations]\n\n📋 Option B:\n• Pros: [Benefits]\n• Cons: [Limitations]\n\n🏆 Recommendation: Based on your needs, I'd suggest...`;
        } else {
            response += `About "${message}" - this is something I can definitely help with.\n\nKey points:\n• Main concept: [Core idea]\n• Practical use: [Application]\n• Next steps: [Action items]\n\nLet me know if you need more specific guidance!`;
        }

        // Add personality context if provided
        if (context.personality && context.personality.trim()) {
            response += `\n\n💫 Personality mode: ${context.personality}`;
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

// Worker event handlers
const worker = new ZAIWorker();

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