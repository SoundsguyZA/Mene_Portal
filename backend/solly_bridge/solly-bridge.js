/**
 * SOLLY BROWSER BRIDGE
 * Headless browser automation for AI agents using Playwright
 * Four LLM-friendly primitives: navigate, click, extract, screenshot
 */

const axios = require('axios');
const path = require('path');

class SollyBridge {
    constructor() {
        this.pythonServiceUrl = process.env.SOLLY_URL || 'http://localhost:5555';
        this.agentBrowsers = new Map(); // agentId -> browser session
        this.screenshotDir = path.join(__dirname, '../../data/screenshots');
        this.initialized = false;
        this.localMode = true; // Use local simulation if Python service unavailable
    }
    
    /**
     * Initialize browser bridge
     */
    async initialize() {
        try {
            // Check if Python Playwright service is running
            try {
                const response = await axios.get(`${this.pythonServiceUrl}/health`, { timeout: 2000 });
                if (response.status === 200) {
                    this.localMode = false;
                    console.log('✅ Connected to Solly Playwright service');
                }
            } catch (error) {
                console.log('⚠️  Solly Playwright service not available, using simulation mode');
                this.localMode = true;
            }
            
            this.initialized = true;
            
        } catch (error) {
            console.error('❌ Solly Bridge initialization failed:', error);
            this.initialized = true; // Continue in simulation mode
        }
    }
    
    /**
     * Navigate to URL
     */
    async navigate(url, agentId) {
        if (this.localMode) {
            return this.simulateNavigate(url, agentId);
        }
        
        try {
            const response = await axios.post(`${this.pythonServiceUrl}/navigate`, {
                url,
                agent_id: agentId
            }, { timeout: 30000 });
            
            return response.data;
        } catch (error) {
            return { status: 'error', error: error.message };
        }
    }
    
    /**
     * Click element
     */
    async click(selector, agentId) {
        if (this.localMode) {
            return this.simulateClick(selector, agentId);
        }
        
        try {
            const response = await axios.post(`${this.pythonServiceUrl}/click`, {
                selector,
                agent_id: agentId
            }, { timeout: 10000 });
            
            return response.data;
        } catch (error) {
            return { status: 'error', error: error.message };
        }
    }
    
    /**
     * Extract content from page
     */
    async extract(selector, agentId) {
        if (this.localMode) {
            return this.simulateExtract(selector, agentId);
        }
        
        try {
            const response = await axios.post(`${this.pythonServiceUrl}/extract`, {
                selector,
                agent_id: agentId
            }, { timeout: 10000 });
            
            return response.data;
        } catch (error) {
            return { status: 'error', error: error.message };
        }
    }
    
    /**
     * Take screenshot
     */
    async screenshot(agentId) {
        if (this.localMode) {
            return this.simulateScreenshot(agentId);
        }
        
        try {
            const response = await axios.post(`${this.pythonServiceUrl}/screenshot`, {
                agent_id: agentId
            }, { timeout: 10000 });
            
            return response.data;
        } catch (error) {
            return { status: 'error', error: error.message };
        }
    }
    
    /**
     * Close browser session for agent
     */
    async closeBrowser(agentId) {
        this.agentBrowsers.delete(agentId);
        
        if (!this.localMode) {
            try {
                await axios.post(`${this.pythonServiceUrl}/close`, {
                    agent_id: agentId
                });
            } catch (error) {
                // Ignore errors on close
            }
        }
    }
    
    // ===== SIMULATION MODE (for when Python service is unavailable) =====
    
    simulateNavigate(url, agentId) {
        this.agentBrowsers.set(agentId, { currentUrl: url, pageTitle: 'Simulated Page' });
        return {
            status: 'ok',
            url,
            title: 'Simulated Page',
            message: 'Browser automation in simulation mode. Install Playwright service for real functionality.'
        };
    }
    
    simulateClick(selector, agentId) {
        return {
            status: 'ok',
            clicked_text: `Simulated click on ${selector}`,
            message: 'Browser automation in simulation mode.'
        };
    }
    
    simulateExtract(selector, agentId) {
        return {
            status: 'ok',
            data: [`Simulated content from ${selector}`],
            message: 'Browser automation in simulation mode.'
        };
    }
    
    simulateScreenshot(agentId) {
        return {
            status: 'ok',
            path: '/simulated/screenshot.png',
            message: 'Browser automation in simulation mode.'
        };
    }
    
    /**
     * Get status
     */
    getStatus() {
        return {
            initialized: this.initialized,
            mode: this.localMode ? 'simulation' : 'playwright',
            serviceUrl: this.pythonServiceUrl,
            activeBrowsers: this.agentBrowsers.size
        };
    }
    
    /**
     * Shutdown
     */
    async shutdown() {
        // Close all browser sessions
        for (const [agentId] of this.agentBrowsers) {
            await this.closeBrowser(agentId);
        }
        console.log('✅ Solly Bridge closed all browsers');
    }
}

module.exports = SollyBridge;
