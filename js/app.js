// MENE Portal PWA - Main Application
class MENEPortal {
    constructor() {
        this.agents = new Map();
        this.currentAgent = null;
        this.messageHistory = new Map();
        this.isOnline = navigator.onLine;
        this.initializeApp();
    }

    initializeApp() {
        this.setupEventListeners();
        this.initializePWA();
        this.loadStoredData();
        this.updateUI();

        // Check if service worker is supported
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('sw.js')
                .then(registration => {
                    console.log('ServiceWorker registration successful');
                    this.showToast('App ready for offline use', 'success');
                })
                .catch(error => {
                    console.log('ServiceWorker registration failed:', error);
                });
        }
    }

    setupEventListeners() {
        // Modal controls
        document.getElementById('createAgentBtn').addEventListener('click', () => this.showAgentModal());
        document.getElementById('closeModal').addEventListener('click', () => this.hideAgentModal());
        document.getElementById('cancelAgent').addEventListener('click', () => this.hideAgentModal());
        document.getElementById('createAgent').addEventListener('click', () => this.createAgent());

        // Chat controls
        document.getElementById('sendBtn').addEventListener('click', () => this.sendMessage());
        document.getElementById('chatInput').addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Auto-resize textarea
        document.getElementById('chatInput').addEventListener('input', (e) => {
            e.target.style.height = 'auto';
            e.target.style.height = e.target.scrollHeight + 'px';
        });

        // Clear chat
        document.getElementById('clearChatBtn').addEventListener('click', () => this.clearChat());

        // Export chat
        document.getElementById('exportChatBtn').addEventListener('click', () => this.exportChat());

        // Broadcast mode toggle
        document.getElementById('broadcastMode').addEventListener('change', (e) => {
            const targetSelect = document.getElementById('targetAgent');
            targetSelect.style.display = e.target.checked ? 'none' : 'block';
        });

        // Custom service URL visibility
        document.getElementById('agentService').addEventListener('change', (e) => {
            const customUrlGroup = document.getElementById('customUrlGroup');
            customUrlGroup.style.display = e.target.value === 'custom' ? 'block' : 'none';
        });

        // Online/offline status
        window.addEventListener('online', () => this.updateConnectionStatus(true));
        window.addEventListener('offline', () => this.updateConnectionStatus(false));

        // Click outside modal to close
        document.getElementById('agentModal').addEventListener('click', (e) => {
            if (e.target.id === 'agentModal') {
                this.hideAgentModal();
            }
        });
    }

    initializePWA() {
        let deferredPrompt;

        // PWA install prompt
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            const installBtn = document.getElementById('installBtn');
            installBtn.classList.remove('hidden');

            installBtn.addEventListener('click', async () => {
                if (deferredPrompt) {
                    deferredPrompt.prompt();
                    const { outcome } = await deferredPrompt.userChoice;

                    if (outcome === 'accepted') {
                        this.showToast('App installed successfully!', 'success');
                    }

                    deferredPrompt = null;
                    installBtn.classList.add('hidden');
                }
            });
        });

        // Check if already installed
        window.addEventListener('appinstalled', () => {
            this.showToast('MENE Portal installed!', 'success');
            document.getElementById('installBtn').classList.add('hidden');
        });
    }

    loadStoredData() {
        // Load agents from localStorage
        const storedAgents = localStorage.getItem('mene_agents');
        if (storedAgents) {
            const agentData = JSON.parse(storedAgents);
            agentData.forEach(agent => {
                this.agents.set(agent.id, agent);
                this.renderAgentItem(agent);
            });
        }

        // Load message history
        const storedMessages = localStorage.getItem('mene_messages');
        if (storedMessages) {
            this.messageHistory = new Map(JSON.parse(storedMessages));
        }

        // Load current agent
        const currentAgentId = localStorage.getItem('mene_current_agent');
        if (currentAgentId && this.agents.has(currentAgentId)) {
            this.selectAgent(currentAgentId);
        }
    }

    saveToStorage() {
        // Save agents
        const agentsArray = Array.from(this.agents.values());
        localStorage.setItem('mene_agents', JSON.stringify(agentsArray));

        // Save messages
        const messagesArray = Array.from(this.messageHistory.entries());
        localStorage.setItem('mene_messages', JSON.stringify(messagesArray));

        // Save current agent
        if (this.currentAgent) {
            localStorage.setItem('mene_current_agent', this.currentAgent);
        }
    }

    showAgentModal() {
        document.getElementById('agentModal').classList.remove('hidden');
        document.getElementById('agentName').focus();
    }

    hideAgentModal() {
        document.getElementById('agentModal').classList.add('hidden');
        this.clearAgentForm();
    }

    clearAgentForm() {
        document.getElementById('agentName').value = '';
        document.getElementById('agentService').value = '';
        document.getElementById('customUrl').value = '';
        document.getElementById('agentPersonality').value = '';
        document.getElementById('customUrlGroup').style.display = 'none';
    }

    async createAgent() {
        const name = document.getElementById('agentName').value.trim();
        const service = document.getElementById('agentService').value;
        const customUrl = document.getElementById('customUrl').value.trim();
        const personality = document.getElementById('agentPersonality').value.trim();

        // Validation
        if (!name) {
            this.showToast('Please enter an agent name', 'error');
            return;
        }

        if (!service) {
            this.showToast('Please select an AI service', 'error');
            return;
        }

        if (service === 'custom' && !customUrl) {
            this.showToast('Please enter a service URL', 'error');
            return;
        }

        // Check for duplicate names
        const existingAgent = Array.from(this.agents.values()).find(agent => agent.name === name);
        if (existingAgent) {
            this.showToast('An agent with this name already exists', 'error');
            return;
        }

        this.showLoading('Creating agent...');

        try {
            const agent = {
                id: this.generateId(),
                name: name,
                service: service,
                url: service === 'custom' ? customUrl : this.getServiceUrl(service),
                personality: personality,
                status: 'ready',
                createdAt: Date.now(),
                messageCount: 0
            };

            // Initialize agent worker
            await this.initializeAgentWorker(agent);

            this.agents.set(agent.id, agent);
            this.messageHistory.set(agent.id, []);

            this.renderAgentItem(agent);
            this.selectAgent(agent.id);
            this.updateStats();
            this.saveToStorage();

            this.hideAgentModal();
            this.hideLoading();
            this.showToast(`Agent "${name}" created successfully!`, 'success');

        } catch (error) {
            this.hideLoading();
            this.showToast('Failed to create agent: ' + error.message, 'error');
            console.error('Agent creation error:', error);
        }
    }

    async initializeAgentWorker(agent) {
        return new Promise((resolve, reject) => {
            try {
                // Create worker for agent processing
                const worker = new Worker(`js/workers/${agent.service}-worker.js`);

                worker.onmessage = (event) => {
                    const { type, data, error } = event.data;

                    switch (type) {
                        case 'initialized':
                            agent.worker = worker;
                            agent.status = 'ready';
                            resolve();
                            break;
                        case 'message':
                            this.handleAgentMessage(agent.id, data);
                            break;
                        case 'error':
                            this.handleAgentError(agent.id, error);
                            break;
                    }
                };

                worker.onerror = (error) => {
                    reject(new Error(`Worker initialization failed: ${error.message}`));
                };

                // Initialize worker with agent config
                worker.postMessage({
                    type: 'initialize',
                    config: {
                        service: agent.service,
                        url: agent.url,
                        personality: agent.personality
                    }
                });

            } catch (error) {
                reject(error);
            }
        });
    }

    getServiceUrl(service) {
        const urls = {
            'chatgpt': 'https://chat.openai.com',
            'claude': 'https://claude.ai',
            'zai': 'https://chat.z.ai',
            'gemini': 'https://gemini.google.com'
        };
        return urls[service] || '';
    }

    getServiceIcon(service) {
        const icons = {
            'chatgpt': '🤖',
            'claude': '🎭',
            'zai': '⚡',
            'gemini': '💎',
            'custom': '🔧'
        };
        return icons[service] || '🤖';
    }

    renderAgentItem(agent) {
        const agentList = document.getElementById('agentList');
        const agentElement = document.createElement('div');
        agentElement.className = 'agent-item';
        agentElement.dataset.agentId = agent.id;

        agentElement.innerHTML = `
            <div class="agent-avatar">${this.getServiceIcon(agent.service)}</div>
            <div class="agent-details">
                <div class="agent-name">${agent.name}</div>
                <div class="agent-service">${agent.service.charAt(0).toUpperCase() + agent.service.slice(1)}</div>
            </div>
            <div class="agent-status ${agent.status}"></div>
            <div class="agent-actions">
                <button class="agent-action-btn" onclick="app.deleteAgent('${agent.id}')" title="Delete">
                    🗑️
                </button>
            </div>
        `;

        agentElement.addEventListener('click', (e) => {
            if (!e.target.closest('.agent-actions')) {
                this.selectAgent(agent.id);
            }
        });

        agentList.appendChild(agentElement);
        this.updateTargetAgentSelect();
    }

    selectAgent(agentId) {
        // Remove active class from all agents
        document.querySelectorAll('.agent-item').forEach(item => {
            item.classList.remove('active');
        });

        // Add active class to selected agent
        const agentElement = document.querySelector(`[data-agent-id="${agentId}"]`);
        if (agentElement) {
            agentElement.classList.add('active');
        }

        const agent = this.agents.get(agentId);
        if (!agent) return;

        this.currentAgent = agentId;
        this.updateCurrentAgentDisplay(agent);
        this.loadChatHistory(agentId);
        this.enableChatInput();
        this.saveToStorage();
    }

    updateCurrentAgentDisplay(agent) {
        const currentAgentDiv = document.getElementById('currentAgent');
        currentAgentDiv.querySelector('.agent-avatar').textContent = this.getServiceIcon(agent.service);
        currentAgentDiv.querySelector('.agent-name').textContent = agent.name;
        currentAgentDiv.querySelector('.agent-service').textContent = 
            agent.service.charAt(0).toUpperCase() + agent.service.slice(1);
    }

    loadChatHistory(agentId) {
        const messages = this.messageHistory.get(agentId) || [];
        const chatMessages = document.getElementById('chatMessages');

        // Clear existing messages
        chatMessages.innerHTML = '';

        if (messages.length === 0) {
            chatMessages.innerHTML = `
                <div class="welcome-message">
                    <div class="welcome-icon">${this.getServiceIcon(this.agents.get(agentId).service)}</div>
                    <h2>Start chatting with ${this.agents.get(agentId).name}</h2>
                    <p>Your conversation will appear here.</p>
                </div>
            `;
        } else {
            messages.forEach(message => this.renderMessage(message));
            this.scrollToBottom();
        }
    }

    enableChatInput() {
        const chatInput = document.getElementById('chatInput');
        const sendBtn = document.getElementById('sendBtn');

        chatInput.disabled = false;
        sendBtn.disabled = false;
        chatInput.placeholder = 'Type your message here...';
        chatInput.focus();
    }

    async sendMessage() {
        const input = document.getElementById('chatInput');
        const message = input.value.trim();

        if (!message || !this.currentAgent) return;

        const broadcastMode = document.getElementById('broadcastMode').checked;
        const targetAgentId = document.getElementById('targetAgent').value;

        // Clear input
        input.value = '';
        input.style.height = 'auto';

        if (broadcastMode) {
            // Send to all agents
            for (const [agentId, agent] of this.agents) {
                await this.sendMessageToAgent(agentId, message, true);
            }
        } else if (targetAgentId && targetAgentId !== this.currentAgent) {
            // Inter-agent communication
            await this.sendInterAgentMessage(this.currentAgent, targetAgentId, message);
        } else {
            // Send to current agent
            await this.sendMessageToAgent(this.currentAgent, message);
        }

        this.updateStats();
        this.saveToStorage();
    }

    async sendMessageToAgent(agentId, message, isBroadcast = false) {
        const agent = this.agents.get(agentId);
        if (!agent || !agent.worker) return;

        // Add user message to history
        const userMessage = {
            id: this.generateId(),
            type: 'user',
            content: message,
            timestamp: Date.now(),
            agentId: agentId,
            isBroadcast: isBroadcast
        };

        this.addMessageToHistory(agentId, userMessage);

        if (agentId === this.currentAgent) {
            this.renderMessage(userMessage);
        }

        // Send to worker for processing
        agent.worker.postMessage({
            type: 'sendMessage',
            message: message,
            context: {
                personality: agent.personality,
                messageHistory: this.getRecentMessages(agentId, 10)
            }
        });

        agent.messageCount++;
    }

    async sendInterAgentMessage(fromAgentId, toAgentId, message) {
        const fromAgent = this.agents.get(fromAgentId);
        const toAgent = this.agents.get(toAgentId);

        if (!fromAgent || !toAgent) return;

        // Create inter-agent message
        const interAgentMessage = {
            id: this.generateId(),
            type: 'inter-agent',
            content: message,
            timestamp: Date.now(),
            fromAgent: fromAgent.name,
            toAgent: toAgent.name,
            fromAgentId: fromAgentId,
            toAgentId: toAgentId
        };

        // Add to both agents' histories
        this.addMessageToHistory(fromAgentId, interAgentMessage);
        this.addMessageToHistory(toAgentId, interAgentMessage);

        // Render in current view
        this.renderMessage(interAgentMessage);

        // Send to target agent
        await this.sendMessageToAgent(toAgentId, `Message from ${fromAgent.name}: ${message}`);
    }

    handleAgentMessage(agentId, messageData) {
        const agentMessage = {
            id: this.generateId(),
            type: 'agent',
            content: messageData.content,
            timestamp: Date.now(),
            agentId: agentId
        };

        this.addMessageToHistory(agentId, agentMessage);

        if (agentId === this.currentAgent) {
            this.renderMessage(agentMessage);
        }

        // Update agent status
        const agent = this.agents.get(agentId);
        if (agent) {
            agent.status = 'ready';
            this.updateAgentStatus(agentId, 'ready');
        }
    }

    handleAgentError(agentId, error) {
        console.error(`Agent ${agentId} error:`, error);

        const agent = this.agents.get(agentId);
        if (agent) {
            agent.status = 'error';
            this.updateAgentStatus(agentId, 'error');
        }

        this.showToast(`Agent error: ${error}`, 'error');
    }

    renderMessage(message) {
        const chatMessages = document.getElementById('chatMessages');

        // Remove welcome message if it exists
        const welcomeMsg = chatMessages.querySelector('.welcome-message');
        if (welcomeMsg) {
            welcomeMsg.remove();
        }

        const messageElement = document.createElement('div');
        messageElement.className = `message ${message.type}`;

        let header = '';
        let content = message.content;

        if (message.type === 'agent') {
            const agent = this.agents.get(message.agentId);
            header = agent ? agent.name : 'AI Assistant';
        } else if (message.type === 'inter-agent') {
            header = `${message.fromAgent} → ${message.toAgent}`;
        }

        if (message.isBroadcast) {
            header = '📢 Broadcast Message';
        }

        messageElement.innerHTML = `
            <div class="message-content">
                ${header ? `<div class="message-header">${header}</div>` : ''}
                <div class="message-text">${this.formatMessage(content)}</div>
                <div class="message-timestamp">${this.formatTimestamp(message.timestamp)}</div>
            </div>
        `;

        chatMessages.appendChild(messageElement);
        this.scrollToBottom();
    }

    formatMessage(content) {
        // Basic text formatting
        return content
            .replace(/\n/g, '<br>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code>$1</code>');
    }

    formatTimestamp(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    addMessageToHistory(agentId, message) {
        if (!this.messageHistory.has(agentId)) {
            this.messageHistory.set(agentId, []);
        }
        this.messageHistory.get(agentId).push(message);
    }

    getRecentMessages(agentId, count = 10) {
        const messages = this.messageHistory.get(agentId) || [];
        return messages.slice(-count);
    }

    scrollToBottom() {
        const chatMessages = document.getElementById('chatMessages');
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    deleteAgent(agentId) {
        if (!confirm('Are you sure you want to delete this agent?')) return;

        const agent = this.agents.get(agentId);
        if (!agent) return;

        // Terminate worker
        if (agent.worker) {
            agent.worker.terminate();
        }

        // Remove from data structures
        this.agents.delete(agentId);
        this.messageHistory.delete(agentId);

        // Remove from UI
        const agentElement = document.querySelector(`[data-agent-id="${agentId}"]`);
        if (agentElement) {
            agentElement.remove();
        }

        // Select another agent if this was current
        if (this.currentAgent === agentId) {
            this.currentAgent = null;
            const remainingAgents = Array.from(this.agents.keys());
            if (remainingAgents.length > 0) {
                this.selectAgent(remainingAgents[0]);
            } else {
                this.showWelcomeScreen();
            }
        }

        this.updateTargetAgentSelect();
        this.updateStats();
        this.saveToStorage();
        this.showToast(`Agent "${agent.name}" deleted`, 'success');
    }

    showWelcomeScreen() {
        document.getElementById('chatMessages').innerHTML = `
            <div class="welcome-message">
                <div class="welcome-icon">🚀</div>
                <h2>Welcome to MENE Portal</h2>
                <p>Create your first AI agent to start chatting with multiple LLMs simultaneously.</p>
                <button class="welcome-btn" onclick="app.showAgentModal()">
                    Create First Agent
                </button>
            </div>
        `;

        const chatInput = document.getElementById('chatInput');
        const sendBtn = document.getElementById('sendBtn');
        chatInput.disabled = true;
        sendBtn.disabled = true;
        chatInput.placeholder = 'Create an agent to start chatting...';

        const currentAgentDiv = document.getElementById('currentAgent');
        currentAgentDiv.querySelector('.agent-avatar').textContent = '🤖';
        currentAgentDiv.querySelector('.agent-name').textContent = 'Select an Agent';
        currentAgentDiv.querySelector('.agent-service').textContent = 'Choose an AI service to start';
    }

    clearChat() {
        if (!this.currentAgent) return;

        if (!confirm('Are you sure you want to clear this chat?')) return;

        this.messageHistory.set(this.currentAgent, []);
        this.loadChatHistory(this.currentAgent);
        this.saveToStorage();
        this.showToast('Chat cleared', 'success');
    }

    exportChat() {
        if (!this.currentAgent) return;

        const agent = this.agents.get(this.currentAgent);
        const messages = this.messageHistory.get(this.currentAgent) || [];

        if (messages.length === 0) {
            this.showToast('No messages to export', 'warning');
            return;
        }

        const exportData = {
            agent: {
                name: agent.name,
                service: agent.service,
                createdAt: agent.createdAt
            },
            messages: messages.map(msg => ({
                type: msg.type,
                content: msg.content,
                timestamp: msg.timestamp,
                formattedTime: this.formatTimestamp(msg.timestamp)
            })),
            exportedAt: Date.now()
        };

        const dataStr = JSON.stringify(exportData, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `mene-chat-${agent.name}-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.showToast('Chat exported successfully', 'success');
    }

    updateTargetAgentSelect() {
        const select = document.getElementById('targetAgent');
        select.innerHTML = '<option value="">Select target agent...</option>';

        this.agents.forEach((agent, agentId) => {
            if (agentId !== this.currentAgent) {
                const option = document.createElement('option');
                option.value = agentId;
                option.textContent = agent.name;
                select.appendChild(option);
            }
        });
    }

    updateAgentStatus(agentId, status) {
        const agentElement = document.querySelector(`[data-agent-id="${agentId}"] .agent-status`);
        if (agentElement) {
            agentElement.className = `agent-status ${status}`;
        }
    }

    updateStats() {
        const activeAgents = this.agents.size;
        const totalMessages = Array.from(this.messageHistory.values())
            .reduce((sum, messages) => sum + messages.length, 0);

        document.getElementById('activeAgents').textContent = activeAgents;
        document.getElementById('totalMessages').textContent = totalMessages;
    }

    updateConnectionStatus(isOnline) {
        this.isOnline = isOnline;
        const statusDot = document.querySelector('.status-dot');
        const statusText = document.querySelector('.status-text');

        statusDot.className = `status-dot ${isOnline ? 'online' : 'offline'}`;
        statusText.textContent = isOnline ? 'Online' : 'Offline';

        if (!isOnline) {
            this.showToast('You are now offline. Some features may be limited.', 'warning');
        } else {
            this.showToast('Back online!', 'success');
        }
    }

    showLoading(text = 'Loading...') {
        const overlay = document.getElementById('loadingOverlay');
        const loadingText = overlay.querySelector('.loading-text');
        loadingText.textContent = text;
        overlay.classList.remove('hidden');
    }

    hideLoading() {
        document.getElementById('loadingOverlay').classList.add('hidden');
    }

    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };

        toast.innerHTML = `
            <div class="toast-content">
                <span class="toast-icon">${icons[type] || icons.info}</span>
                <span class="toast-message">${message}</span>
                <button class="toast-close">×</button>
            </div>
        `;

        container.appendChild(toast);

        // Auto remove after 5 seconds
        const timeout = setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, 5000);

        // Manual close
        toast.querySelector('.toast-close').addEventListener('click', () => {
            clearTimeout(timeout);
            toast.remove();
        });
    }

    updateUI() {
        this.updateStats();
        this.updateConnectionStatus(this.isOnline);

        if (this.agents.size === 0) {
            this.showWelcomeScreen();
        }
    }

    generateId() {
        return 'mene_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new MENEPortal();
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MENEPortal;
}