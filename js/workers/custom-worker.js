// Custom Worker - Flexible AI Service Integration
class CustomWorker {
    constructor() {
        this.isInitialized = false;
        this.messageQueue = [];
        this.responseHistory = [];
        this.serviceUrl = '';
    }

    async initialize(config) {
        try {
            this.config = config;
            this.serviceUrl = config.url;
            this.isInitialized = true;

            await this.delay(1000);

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
            await this.delay(800 + Math.random() * 1000);

            const response = await this.generateCustomResponse(message, context);

            this.responseHistory.push({ message, response, timestamp: Date.now() });

            this.postMessage({
                type: 'message',
                data: {
                    content: response,
                    metadata: {
                        model: 'custom-ai',
                        service: this.serviceUrl,
                        timestamp: Date.now()
                    }
                }
            });

        } catch (error) {
            this.postMessage({ type: 'error', error: error.message });
        }
    }

    async generateCustomResponse(message, context) {
        let response = `Custom AI Service Response to: "${message}"\n\n`;

        response += `🔧 Service: ${this.serviceUrl}\n`;
        response += `📝 Processing your request...\n\n`;

        const lowerMessage = message.toLowerCase();

        if (lowerMessage.includes('api') || lowerMessage.includes('integrate')) {
            response += `For API integration with "${message}", here's the approach:\n\n• Endpoint configuration\n• Authentication setup\n• Response handling\n• Error management\n\nWould you like specific implementation details?`;
        } else {
            response += `I'm a custom AI service configured to work with your specific requirements. While this is a demonstration, in a real implementation I would:\n\n• Connect to your specified AI service\n• Use your custom API endpoints\n• Apply your specific configuration\n• Provide tailored responses\n\nHow can I help you today?`;
        }

        if (context.personality) {
            response += `\n\n🎨 Custom personality: ${context.personality}`;
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

const worker = new CustomWorker();

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