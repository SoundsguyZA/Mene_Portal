// Agent Manager for MENE Portal
class AgentManager {
    constructor() {
        this.agents = new Map();
        this.workerPool = new Map();
    }

    createAgent(config) {
        const agent = {
            id: this.generateId(),
            name: config.name,
            service: config.service,
            url: config.url,
            personality: config.personality,
            status: 'initializing',
            createdAt: Date.now(),
            messageCount: 0,
            worker: null
        };

        this.agents.set(agent.id, agent);
        return agent;
    }

    async initializeWorker(agent) {
        try {
            const worker = new Worker(`js/workers/${agent.service}-worker.js`);

            worker.onmessage = (event) => {
                this.handleWorkerMessage(agent.id, event.data);
            };

            worker.onerror = (error) => {
                this.handleWorkerError(agent.id, error);
            };

            // Store worker reference
            agent.worker = worker;
            this.workerPool.set(agent.id, worker);

            // Initialize worker
            worker.postMessage({
                type: 'initialize',
                config: {
                    service: agent.service,
                    url: agent.url,
                    personality: agent.personality
                }
            });

            return true;
        } catch (error) {
            console.error('Failed to initialize worker:', error);
            return false;
        }
    }

    handleWorkerMessage(agentId, data) {
        const agent = this.agents.get(agentId);
        if (!agent) return;

        switch (data.type) {
            case 'initialized':
                agent.status = 'ready';
                this.notifyAgentReady(agentId);
                break;
            case 'message':
                this.notifyAgentMessage(agentId, data.data);
                break;
            case 'error':
                agent.status = 'error';
                this.notifyAgentError(agentId, data.error);
                break;
        }
    }

    handleWorkerError(agentId, error) {
        const agent = this.agents.get(agentId);
        if (agent) {
            agent.status = 'error';
            this.notifyAgentError(agentId, error.message);
        }
    }

    sendMessage(agentId, message, context) {
        const agent = this.agents.get(agentId);
        if (!agent || !agent.worker) {
            console.error('Agent not found or worker not available');
            return false;
        }

        agent.worker.postMessage({
            type: 'sendMessage',
            message: message,
            context: context
        });

        agent.messageCount++;
        return true;
    }

    destroyAgent(agentId) {
        const agent = this.agents.get(agentId);
        if (!agent) return false;

        // Terminate worker
        if (agent.worker) {
            agent.worker.terminate();
        }

        // Clean up references
        this.agents.delete(agentId);
        this.workerPool.delete(agentId);

        return true;
    }

    getAgent(agentId) {
        return this.agents.get(agentId);
    }

    getAllAgents() {
        return Array.from(this.agents.values());
    }

    getAgentCount() {
        return this.agents.size;
    }

    // Event handlers (to be overridden)
    notifyAgentReady(agentId) {
        console.log(`Agent ${agentId} ready`);
    }

    notifyAgentMessage(agentId, messageData) {
        console.log(`Message from agent ${agentId}:`, messageData);
    }

    notifyAgentError(agentId, error) {
        console.error(`Agent ${agentId} error:`, error);
    }

    generateId() {
        return 'agent_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AgentManager;
}