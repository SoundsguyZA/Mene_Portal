/**
 * MEMORY SYSTEM - Multi-Agent Memory Branches
 * Each agent has their own memory branch, with shared memory access
 * Implements Truth Protocol and conversation continuity
 */

const fs = require('fs').promises;
const path = require('path');

class MemorySystem {
    constructor() {
        this.memoryDir = path.join(__dirname, '../../data/memory');
        this.branches = new Map(); // agentId -> memory branch
        this.sharedMemory = [];     // Shared across all agents
        this.truthProtocol = true;  // Truth-first enforcement
    }
    
    /**
     * Initialize memory system
     */
    async initialize() {
        try {
            // Create memory directory if it doesn't exist
            await fs.mkdir(this.memoryDir, { recursive: true });
            
            // Load existing memory branches
            await this.loadMemoryBranches();
            
            // Load shared memory
            await this.loadSharedMemory();
            
            console.log(`✅ Memory System initialized: ${this.branches.size} branches loaded`);
        } catch (error) {
            console.error('❌ Memory initialization failed:', error);
            throw error;
        }
    }
    
    /**
     * Create a new memory branch for an agent
     */
    async createBranch(agentId, agentName) {
        const branch = {
            agentId,
            agentName,
            memories: [],
            created: new Date().toISOString(),
            lastAccessed: new Date().toISOString(),
            stats: {
                totalMemories: 0,
                totalConversations: 0
            }
        };
        
        this.branches.set(agentId, branch);
        await this.saveBranch(agentId);
        
        console.log(`🌿 Memory branch created for agent: ${agentName}`);
    }
    
    /**
     * Delete a memory branch
     */
    async deleteBranch(agentId) {
        this.branches.delete(agentId);
        
        try {
            const branchFile = path.join(this.memoryDir, `${agentId}.json`);
            await fs.unlink(branchFile);
        } catch (error) {
            // File may not exist, that's ok
        }
        
        console.log(`🗑️  Memory branch deleted: ${agentId}`);
    }
    
    /**
     * Add memory to agent's branch
     */
    async addMemory(agentId, memory) {
        const branch = this.branches.get(agentId);
        if (!branch) {
            throw new Error(`Memory branch not found for agent: ${agentId}`);
        }
        
        // Add truth protocol metadata
        const enrichedMemory = {
            ...memory,
            id: `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            agentId,
            agentName: branch.agentName,
            truthProtocol: this.truthProtocol,
            timestamp: memory.timestamp || new Date().toISOString()
        };
        
        branch.memories.push(enrichedMemory);
        branch.lastAccessed = new Date().toISOString();
        branch.stats.totalMemories++;
        
        if (memory.type === 'conversation') {
            branch.stats.totalConversations++;
        }
        
        // Also add to shared memory if significant
        if (this.isSignificantMemory(enrichedMemory)) {
            this.sharedMemory.push({
                ...enrichedMemory,
                sharedAt: new Date().toISOString(),
                source: agentId
            });
        }
        
        // Persist
        await this.saveBranch(agentId);
        await this.saveSharedMemory();
    }
    
    /**
     * Get all memories for an agent
     */
    async getAgentMemories(agentId, limit = 100) {
        const branch = this.branches.get(agentId);
        if (!branch) {
            return [];
        }
        
        branch.lastAccessed = new Date().toISOString();
        
        // Return most recent memories
        return branch.memories.slice(-limit);
    }
    
    /**
     * Get recent memories
     */
    async getRecentMemories(agentId, count = 5) {
        const branch = this.branches.get(agentId);
        if (!branch) {
            return [];
        }
        
        return branch.memories.slice(-count);
    }
    
    /**
     * Get shared memories (accessible by all agents)
     */
    async getSharedMemories(limit = 50) {
        return this.sharedMemory.slice(-limit);
    }
    
    /**
     * Get relevant shared memories based on query
     */
    async getRelevantSharedMemories(query, limit = 5) {
        const queryLower = query.toLowerCase();
        
        // Simple relevance scoring (can be enhanced with embeddings)
        const scoredMemories = this.sharedMemory.map(memory => {
            let score = 0;
            const contentLower = JSON.stringify(memory).toLowerCase();
            
            // Score based on keyword presence
            const keywords = queryLower.split(' ').filter(w => w.length > 3);
            keywords.forEach(keyword => {
                if (contentLower.includes(keyword)) {
                    score++;
                }
            });
            
            return { memory, score };
        });
        
        // Sort by score and recency
        return scoredMemories
            .filter(item => item.score > 0)
            .sort((a, b) => {
                if (a.score === b.score) {
                    // If same score, prefer more recent
                    return new Date(b.memory.timestamp) - new Date(a.memory.timestamp);
                }
                return b.score - a.score;
            })
            .slice(0, limit)
            .map(item => item.memory);
    }
    
    /**
     * Search memories across all branches
     */
    async searchAllMemories(query, limit = 20) {
        const results = [];
        
        for (const [agentId, branch] of this.branches) {
            const agentResults = await this.searchBranch(agentId, query);
            results.push(...agentResults);
        }
        
        // Sort by relevance and timestamp
        return results.slice(0, limit);
    }
    
    /**
     * Search within a specific branch
     */
    async searchBranch(agentId, query) {
        const branch = this.branches.get(agentId);
        if (!branch) {
            return [];
        }
        
        const queryLower = query.toLowerCase();
        
        return branch.memories.filter(memory => {
            const memoryStr = JSON.stringify(memory).toLowerCase();
            return memoryStr.includes(queryLower);
        });
    }
    
    /**
     * Determine if memory should be shared
     */
    isSignificantMemory(memory) {
        // Share if:
        // 1. It's a conversation with substantial content
        // 2. It contains important information
        // 3. It might be useful to other agents
        
        if (memory.type === 'conversation') {
            const contentLength = (memory.user || '').length + (memory.assistant || '').length;
            return contentLength > 100; // Share if substantive
        }
        
        return memory.important || false;
    }
    
    /**
     * Get all memory branches
     */
    getBranches() {
        return Array.from(this.branches.values()).map(branch => ({
            agentId: branch.agentId,
            agentName: branch.agentName,
            memoryCount: branch.memories.length,
            lastAccessed: branch.lastAccessed,
            stats: branch.stats
        }));
    }
    
    /**
     * Save branch to disk
     */
    async saveBranch(agentId) {
        const branch = this.branches.get(agentId);
        if (!branch) return;
        
        const branchFile = path.join(this.memoryDir, `${agentId}.json`);
        await fs.writeFile(branchFile, JSON.stringify(branch, null, 2));
    }
    
    /**
     * Load all memory branches from disk
     */
    async loadMemoryBranches() {
        try {
            const files = await fs.readdir(this.memoryDir);
            
            for (const file of files) {
                if (file.endsWith('.json') && file !== 'shared.json') {
                    const branchFile = path.join(this.memoryDir, file);
                    const branchData = await fs.readFile(branchFile, 'utf8');
                    const branch = JSON.parse(branchData);
                    this.branches.set(branch.agentId, branch);
                }
            }
        } catch (error) {
            // Directory may not exist yet
        }
    }
    
    /**
     * Save shared memory to disk
     */
    async saveSharedMemory() {
        const sharedFile = path.join(this.memoryDir, 'shared.json');
        await fs.writeFile(sharedFile, JSON.stringify(this.sharedMemory, null, 2));
    }
    
    /**
     * Load shared memory from disk
     */
    async loadSharedMemory() {
        try {
            const sharedFile = path.join(this.memoryDir, 'shared.json');
            const sharedData = await fs.readFile(sharedFile, 'utf8');
            this.sharedMemory = JSON.parse(sharedData);
        } catch (error) {
            // File may not exist yet
            this.sharedMemory = [];
        }
    }
    
    /**
     * Export all memories
     */
    async exportAllMemories() {
        const exportData = {
            branches: Array.from(this.branches.values()),
            shared: this.sharedMemory,
            exportedAt: new Date().toISOString(),
            truthProtocol: this.truthProtocol
        };
        
        return exportData;
    }
    
    /**
     * Import memories from MeneLTM format
     */
    async importFromMeneLTM(meneLTMData) {
        // Import conversations from MeneLTM
        if (meneLTMData.conversations) {
            for (const conv of meneLTMData.conversations) {
                // Create synthetic agent if needed
                const agentId = conv.agent || 'imported';
                
                if (!this.branches.has(agentId)) {
                    await this.createBranch(agentId, conv.agentName || 'Imported Agent');
                }
                
                // Add memories
                for (const message of conv.messages || []) {
                    await this.addMemory(agentId, {
                        type: 'conversation',
                        user: message.user,
                        assistant: message.assistant,
                        timestamp: message.timestamp
                    });
                }
            }
        }
        
        console.log('✅ Imported memories from MeneLTM');
    }
    
    /**
     * Get system status
     */
    getStatus() {
        return {
            totalBranches: this.branches.size,
            totalMemories: Array.from(this.branches.values()).reduce((sum, branch) => sum + branch.memories.length, 0),
            sharedMemories: this.sharedMemory.length,
            truthProtocol: this.truthProtocol
        };
    }
    
    /**
     * Shutdown and save all data
     */
    async shutdown() {
        console.log('💾 Saving memory system...');
        
        for (const [agentId] of this.branches) {
            await this.saveBranch(agentId);
        }
        
        await this.saveSharedMemory();
        
        console.log('✅ Memory system saved');
    }
}

module.exports = MemorySystem;
