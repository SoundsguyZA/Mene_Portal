/**
 * COGNIVAULT BRIDGE
 * Connects to CogniVault RAG system for document search and context retrieval
 */

const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');

class CogniVaultBridge {
    constructor() {
        this.cogniVaultUrl = process.env.COGNIVAULT_URL || 'http://localhost:8501';
        this.dataDir = path.join(__dirname, '../../data/cognivault');
        this.documents = [];
        this.initialized = false;
    }
    
    /**
     * Initialize CogniVault connection
     */
    async initialize() {
        try {
            // Create data directory
            await fs.mkdir(this.dataDir, { recursive: true });
            
            // Try to connect to CogniVault service
            try {
                const response = await axios.get(`${this.cogniVaultUrl}/api/health`, { timeout: 2000 });
                this.initialized = response.status === 200;
                console.log('✅ Connected to CogniVault service');
            } catch (error) {
                console.log('⚠️  CogniVault service not available, using local fallback');
                this.initialized = true; // Use local fallback
            }
            
            // Load local document index
            await this.loadDocumentIndex();
            
        } catch (error) {
            console.error('❌ CogniVault initialization failed:', error);
            this.initialized = true; // Continue with local fallback
        }
    }
    
    /**
     * Search for relevant context
     */
    async search(query, limit = 5) {
        if (!this.initialized) {
            return [];
        }
        
        try {
            // Try CogniVault service first
            const response = await axios.post(`${this.cogniVaultUrl}/api/search`, {
                query,
                limit
            }, { timeout: 5000 });
            
            return response.data.results || [];
        } catch (error) {
            // Fallback to local search
            return this.localSearch(query, limit);
        }
    }
    
    /**
     * Local search fallback using simple TF-IDF
     */
    localSearch(query, limit = 5) {
        const queryTerms = query.toLowerCase().split(/\s+/).filter(term => term.length > 2);
        
        // Score each document
        const scored = this.documents.map(doc => {
            const contentLower = doc.content.toLowerCase();
            let score = 0;
            
            queryTerms.forEach(term => {
                const regex = new RegExp(term, 'gi');
                const matches = (contentLower.match(regex) || []).length;
                score += matches;
            });
            
            return { ...doc, score };
        });
        
        // Return top results
        return scored
            .filter(doc => doc.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, limit)
            .map(({ score, ...doc }) => doc);
    }
    
    /**
     * Add document to knowledge base
     */
    async addDocument(document) {
        this.documents.push({
            id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            filename: document.filename || 'untitled',
            content: document.content,
            type: document.type || 'text',
            metadata: document.metadata || {},
            addedAt: new Date().toISOString()
        });
        
        await this.saveDocumentIndex();
    }
    
    /**
     * Get document by ID
     */
    async getDocument(docId) {
        return this.documents.find(doc => doc.id === docId);
    }
    
    /**
     * Get all documents
     */
    async getAllDocuments() {
        return this.documents;
    }
    
    /**
     * Delete document
     */
    async deleteDocument(docId) {
        this.documents = this.documents.filter(doc => doc.id !== docId);
        await this.saveDocumentIndex();
    }
    
    /**
     * Get statistics
     */
    getStats() {
        return {
            totalDocuments: this.documents.length,
            documentTypes: [...new Set(this.documents.map(d => d.type))],
            totalSize: this.documents.reduce((sum, doc) => sum + (doc.content?.length || 0), 0)
        };
    }
    
    /**
     * Load document index from disk
     */
    async loadDocumentIndex() {
        try {
            const indexFile = path.join(this.dataDir, 'index.json');
            const indexData = await fs.readFile(indexFile, 'utf8');
            this.documents = JSON.parse(indexData);
            console.log(`📚 Loaded ${this.documents.length} documents from index`);
        } catch (error) {
            // Index doesn't exist yet
            this.documents = [];
        }
    }
    
    /**
     * Save document index to disk
     */
    async saveDocumentIndex() {
        const indexFile = path.join(this.dataDir, 'index.json');
        await fs.writeFile(indexFile, JSON.stringify(this.documents, null, 2));
    }
    
    /**
     * Import from MeneLTM conversations
     */
    async importMeneLTMConversations(conversationData) {
        // Convert MeneLTM conversation data into searchable documents
        for (const conversation of conversationData) {
            await this.addDocument({
                filename: `mene_ltm_${conversation.id || Date.now()}`,
                content: JSON.stringify(conversation),
                type: 'conversation',
                metadata: {
                    source: 'mene_ltm',
                    timestamp: conversation.timestamp,
                    participants: conversation.participants
                }
            });
        }
        
        console.log('✅ Imported MeneLTM conversations into CogniVault');
    }
    
    /**
     * Get status
     */
    getStatus() {
        return {
            initialized: this.initialized,
            serviceUrl: this.cogniVaultUrl,
            ...this.getStats()
        };
    }
    
    /**
     * Shutdown
     */
    async shutdown() {
        await this.saveDocumentIndex();
        console.log('✅ CogniVault bridge saved');
    }
}

module.exports = CogniVaultBridge;
