#!/usr/bin/env node
/**
 * MENE PORTAL - UNIFIED BACKEND SERVER
 * Multi-Agent System with Memory Branches, CogniVault Integration, and Browser Automation
 * Built by Veritas AI for Rob The Sounds Guy
 */

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');
const fs = require('fs').promises;
require('dotenv').config();

// Import backend modules
const AgentCoordinator = require('./agents/agent-coordinator');
const MemorySystem = require('./memory/memory-system');
const CogniVaultBridge = require('./cognivault/cognivault-bridge');
const SollyBridge = require('./solly_bridge/solly-bridge');

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, '..')));

// Initialize core systems
const memorySystem = new MemorySystem();
const cogniVault = new CogniVaultBridge();
const sollyBridge = new SollyBridge();
const agentCoordinator = new AgentCoordinator(memorySystem, cogniVault, sollyBridge);

// ========================================
// REST API ENDPOINTS
// ========================================

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'mene_portal',
        version: '2.0.0',
        components: {
            agents: agentCoordinator.getStatus(),
            memory: memorySystem.getStatus(),
            cognivault: cogniVault.getStatus(),
            solly_bridge: sollyBridge.getStatus()
        },
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});

// Get all agents
app.get('/api/agents', async (req, res) => {
    try {
        const agents = await agentCoordinator.getAllAgents();
        res.json({ success: true, agents });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Create new agent
app.post('/api/agents', async (req, res) => {
    try {
        const { name, service, personality, config } = req.body;
        const agent = await agentCoordinator.createAgent({ name, service, personality, config });
        res.json({ success: true, agent });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Delete agent
app.delete('/api/agents/:agentId', async (req, res) => {
    try {
        await agentCoordinator.deleteAgent(req.params.agentId);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Query with CogniVault context
app.post('/api/query', async (req, res) => {
    try {
        const { query, agentId, includeContext } = req.body;
        const result = await agentCoordinator.query(agentId, query, { includeContext });
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get agent memories
app.get('/api/memory/:agentId', async (req, res) => {
    try {
        const memories = await memorySystem.getAgentMemories(req.params.agentId);
        res.json({ success: true, memories });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get shared memories (all agents)
app.get('/api/memory/shared/all', async (req, res) => {
    try {
        const memories = await memorySystem.getSharedMemories();
        res.json({ success: true, memories });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// CogniVault search
app.post('/api/cognivault/search', async (req, res) => {
    try {
        const { query, limit } = req.body;
        const results = await cogniVault.search(query, limit || 5);
        res.json({ success: true, results });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Browser automation endpoint
app.post('/api/browser/navigate', async (req, res) => {
    try {
        const { url, agentId } = req.body;
        const result = await sollyBridge.navigate(url, agentId);
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/browser/extract', async (req, res) => {
    try {
        const { selector, agentId } = req.body;
        const result = await sollyBridge.extract(selector, agentId);
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/browser/click', async (req, res) => {
    try {
        const { selector, agentId } = req.body;
        const result = await sollyBridge.click(selector, agentId);
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/browser/screenshot', async (req, res) => {
    try {
        const { agentId } = req.body;
        const result = await sollyBridge.screenshot(agentId);
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Export conversation/memories
app.get('/api/export/:agentId', async (req, res) => {
    try {
        const data = await agentCoordinator.exportAgent(req.params.agentId);
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ========================================
// SOCKET.IO REAL-TIME COMMUNICATION
// ========================================

io.on('connection', (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);
    
    // Send initial state
    socket.emit('system_status', {
        agents: agentCoordinator.getActiveAgents(),
        memory_branches: memorySystem.getBranches(),
        timestamp: new Date().toISOString()
    });
    
    // Create agent
    socket.on('create_agent', async (data, callback) => {
        try {
            const agent = await agentCoordinator.createAgent(data);
            io.emit('agent_created', agent);
            callback({ success: true, agent });
        } catch (error) {
            callback({ success: false, error: error.message });
        }
    });
    
    // Delete agent
    socket.on('delete_agent', async (agentId, callback) => {
        try {
            await agentCoordinator.deleteAgent(agentId);
            io.emit('agent_deleted', { agentId });
            callback({ success: true });
        } catch (error) {
            callback({ success: false, error: error.message });
        }
    });
    
    // Send message to agent
    socket.on('send_message', async (data, callback) => {
        try {
            const { agentId, message, includeContext = true, broadcastToAll = false } = data;
            
            // Emit "thinking" status
            socket.emit('agent_thinking', { agentId, message });
            
            // Process message
            if (broadcastToAll) {
                // Broadcast to all agents
                const agents = await agentCoordinator.getAllAgents();
                const responses = [];
                
                for (const agent of agents) {
                    const response = await agentCoordinator.query(agent.id, message, { includeContext });
                    responses.push(response);
                    
                    // Emit each response as it comes
                    socket.emit('agent_response', {
                        agentId: agent.id,
                        agentName: agent.name,
                        message: response.response,
                        context: response.context,
                        timestamp: new Date().toISOString()
                    });
                }
                
                callback({ success: true, responses });
            } else {
                // Single agent query
                const response = await agentCoordinator.query(agentId, message, { includeContext });
                
                socket.emit('agent_response', {
                    agentId,
                    message: response.response,
                    context: response.context,
                    timestamp: new Date().toISOString()
                });
                
                callback({ success: true, response });
            }
        } catch (error) {
            socket.emit('agent_error', { error: error.message });
            callback({ success: false, error: error.message });
        }
    });
    
    // Agent-to-agent communication
    socket.on('agent_to_agent', async (data, callback) => {
        try {
            const { fromAgentId, toAgentId, message } = data;
            
            // Get context from source agent
            const fromMemories = await memorySystem.getAgentMemories(fromAgentId);
            const contextMessage = `[Message from ${fromAgentId}]: ${message}`;
            
            // Send to target agent
            const response = await agentCoordinator.query(toAgentId, contextMessage, { includeContext: true });
            
            // Broadcast the exchange
            io.emit('agent_exchange', {
                fromAgentId,
                toAgentId,
                message,
                response: response.response,
                timestamp: new Date().toISOString()
            });
            
            callback({ success: true, response });
        } catch (error) {
            callback({ success: false, error: error.message });
        }
    });
    
    // Browser automation commands
    socket.on('browser_command', async (data, callback) => {
        try {
            const { command, params, agentId } = data;
            let result;
            
            switch (command) {
                case 'navigate':
                    result = await sollyBridge.navigate(params.url, agentId);
                    break;
                case 'click':
                    result = await sollyBridge.click(params.selector, agentId);
                    break;
                case 'extract':
                    result = await sollyBridge.extract(params.selector, agentId);
                    break;
                case 'screenshot':
                    result = await sollyBridge.screenshot(agentId);
                    break;
                default:
                    throw new Error(`Unknown command: ${command}`);
            }
            
            socket.emit('browser_result', { agentId, command, result });
            callback({ success: true, result });
        } catch (error) {
            callback({ success: false, error: error.message });
        }
    });
    
    // Get memory branches
    socket.on('get_memories', async (data, callback) => {
        try {
            const { agentId, includeShared = true } = data;
            
            const agentMemories = await memorySystem.getAgentMemories(agentId);
            const sharedMemories = includeShared ? await memorySystem.getSharedMemories() : [];
            
            callback({ 
                success: true, 
                agentMemories, 
                sharedMemories,
                branches: memorySystem.getBranches()
            });
        } catch (error) {
            callback({ success: false, error: error.message });
        }
    });
    
    // CogniVault search
    socket.on('cognivault_search', async (data, callback) => {
        try {
            const { query, limit = 5 } = data;
            const results = await cogniVault.search(query, limit);
            callback({ success: true, results });
        } catch (error) {
            callback({ success: false, error: error.message });
        }
    });
    
    socket.on('disconnect', () => {
        console.log(`[Socket] Client disconnected: ${socket.id}`);
    });
});

// ========================================
// SERVER INITIALIZATION
// ========================================

const PORT = process.env.PORT || 3001;

async function initializeServer() {
    try {
        console.log('🚀 Initializing MENE Portal Unified Backend...\n');
        
        // Initialize memory system
        console.log('🧠 Initializing Memory System...');
        await memorySystem.initialize();
        console.log('✅ Memory System ready\n');
        
        // Initialize CogniVault
        console.log('📚 Initializing CogniVault...');
        await cogniVault.initialize();
        console.log('✅ CogniVault ready\n');
        
        // Initialize Solly Bridge
        console.log('🌐 Initializing Solly Browser Bridge...');
        await sollyBridge.initialize();
        console.log('✅ Solly Bridge ready\n');
        
        // Start server
        server.listen(PORT, () => {
            console.log('============================================');
            console.log('🎯 MENE PORTAL - UNIFIED BACKEND ONLINE');
            console.log('============================================');
            console.log(`✅ Server running on http://localhost:${PORT}`);
            console.log(`✅ Socket.IO ready for real-time communication`);
            console.log(`✅ Multi-Agent System initialized`);
            console.log(`✅ Memory Branches active`);
            console.log(`✅ CogniVault RAG ready`);
            console.log(`✅ Browser Automation available`);
            console.log('============================================\n');
            console.log('📡 API Endpoints:');
            console.log(`   GET  /api/health`);
            console.log(`   GET  /api/agents`);
            console.log(`   POST /api/agents`);
            console.log(`   POST /api/query`);
            console.log(`   GET  /api/memory/:agentId`);
            console.log(`   POST /api/cognivault/search`);
            console.log(`   POST /api/browser/navigate`);
            console.log('============================================\n');
        });
        
    } catch (error) {
        console.error('❌ Server initialization failed:', error);
        process.exit(1);
    }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('\n🛑 SIGTERM received, shutting down gracefully...');
    await memorySystem.shutdown();
    await cogniVault.shutdown();
    await sollyBridge.shutdown();
    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
});

process.on('SIGINT', async () => {
    console.log('\n🛑 SIGINT received, shutting down gracefully...');
    await memorySystem.shutdown();
    await cogniVault.shutdown();
    await sollyBridge.shutdown();
    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
});

// Start the server
initializeServer();

module.exports = { app, server, io };
