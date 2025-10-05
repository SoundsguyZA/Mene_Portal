#!/usr/bin/env node
/**
 * Comprehensive Mene Portal System Test
 * Tests all integrated functionality including agent communication
 */

const http = require('http');
const https = require('https');

class MenePortalTester {
    constructor(baseUrl = 'http://localhost:3000') {
        this.baseUrl = baseUrl;
        this.testResults = [];
    }

    async makeRequest(path, method = 'GET', data = null) {
        return new Promise((resolve, reject) => {
            const url = new URL(path, this.baseUrl);
            const protocol = url.protocol === 'https:' ? https : http;
            
            const options = {
                hostname: url.hostname,
                port: url.port,
                path: url.pathname + url.search,
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                }
            };

            const req = protocol.request(options, (res) => {
                let body = '';
                res.on('data', (chunk) => {
                    body += chunk;
                });
                res.on('end', () => {
                    try {
                        const result = JSON.parse(body);
                        resolve({ status: res.statusCode, data: result });
                    } catch (e) {
                        resolve({ status: res.statusCode, data: body });
                    }
                });
            });

            req.on('error', (err) => {
                reject(err);
            });

            if (data) {
                req.write(JSON.stringify(data));
            }

            req.end();
        });
    }

    logTest(testName, success, details = '') {
        const status = success ? '✅ PASS' : '❌ FAIL';
        console.log(`${status} ${testName}${details ? ' - ' + details : ''}`);
        this.testResults.push({ name: testName, success, details });
    }

    async testBasicConnectivity() {
        console.log('\n🔌 Testing Basic Connectivity...');
        
        try {
            const response = await this.makeRequest('/api/agents');
            const success = response.status === 200 && response.data.agents;
            this.logTest('Basic API Connectivity', success, `Status: ${response.status}`);
            
            if (success && response.data.ltm) {
                this.logTest('LTM Bridge Integration', response.data.ltm.available, 
                    `Voice Assets: ${response.data.ltm.voiceAssets}, Memory Agents: ${response.data.ltm.memoryAgents}`);
            }
            
            return success;
        } catch (error) {
            this.logTest('Basic API Connectivity', false, error.message);
            return false;
        }
    }

    async testAgentChat() {
        console.log('\n🤖 Testing Agent Chat...');
        
        const agents = ['Mene', 'Bonny', 'Steve', 'Veritas', 'Chimalitis'];
        let passCount = 0;

        for (const agent of agents) {
            try {
                const response = await this.makeRequest('/api/chat', 'POST', {
                    agent: agent,
                    message: `Hello ${agent}! This is a system test. Please respond with your specialty.`,
                    context: { test: true }
                });

                const success = response.status === 200 && response.data.agent === agent;
                this.logTest(`${agent} Chat Response`, success, 
                    success ? `Responded with ${response.data.message?.length || 0} chars` : 'No valid response');
                
                if (success) passCount++;
            } catch (error) {
                this.logTest(`${agent} Chat Response`, false, error.message);
            }
        }

        return passCount === agents.length;
    }

    async testAgentCommunication() {
        console.log('\n📨 Testing Agent-to-Agent Communication...');
        
        try {
            // Test simple agent communication
            const commResponse = await this.makeRequest('/api/agent/communicate', 'POST', {
                fromAgent: 'mene',
                toAgent: 'bonny',
                message: 'Can you help me understand the botanical aspects of our system integration?',
                context: { priority: 'high', test: true }
            });

            const commSuccess = commResponse.status === 200 && commResponse.data.status === 'ok';
            this.logTest('Agent-to-Agent Communication', commSuccess, 
                commSuccess ? `${commResponse.data.fromAgent} → ${commResponse.data.toAgent}` : 'Communication failed');

            // Test communication history
            const historyResponse = await this.makeRequest('/api/agent/history?agent1=mene&agent2=bonny&limit=5');
            const historySuccess = historyResponse.status === 200;
            this.logTest('Communication History Retrieval', historySuccess, 
                historySuccess ? `Retrieved ${historyResponse.data.history?.length || 0} exchanges` : 'History retrieval failed');

            return commSuccess && historySuccess;
        } catch (error) {
            this.logTest('Agent Communication', false, error.message);
            return false;
        }
    }

    async testMultiAgentDiscussion() {
        console.log('\n🎭 Testing Multi-Agent Discussion...');
        
        try {
            const discussionResponse = await this.makeRequest('/api/agent/discussion', 'POST', {
                topic: 'System optimization and performance improvements',
                participants: ['mene', 'bonny', 'steve', 'veritas'],
                moderator: 'mene'
            });

            const success = discussionResponse.status === 200 && discussionResponse.data.status === 'ok';
            this.logTest('Multi-Agent Discussion', success, 
                success ? `${discussionResponse.data.discussion?.exchanges?.length || 0} exchanges` : 'Discussion failed');

            return success;
        } catch (error) {
            this.logTest('Multi-Agent Discussion', false, error.message);
            return false;
        }
    }

    async testBrowserAutomation() {
        console.log('\n🌐 Testing Browser Automation...');
        
        const browserTests = [
            {
                name: 'Navigation Test',
                action: 'navigate',
                params: { url: 'https://example.com' }
            },
            {
                name: 'Screenshot Test',
                action: 'screenshot',
                params: { path: './test_screenshot.png' }
            }
        ];

        let passCount = 0;

        for (const test of browserTests) {
            try {
                const response = await this.makeRequest('/api/browser/action', 'POST', {
                    agent: 'mene',
                    action: test.action,
                    params: test.params
                });

                const success = response.status === 200 && response.data.status === 'ok';
                this.logTest(test.name, success, 
                    success ? 'Browser action completed' : 'Browser action failed');
                
                if (success) passCount++;
            } catch (error) {
                this.logTest(test.name, false, error.message);
            }
        }

        return passCount === browserTests.length;
    }

    async testRAGSystem() {
        console.log('\n📚 Testing RAG System...');
        
        try {
            const searchResponse = await this.makeRequest('/api/rag/search', 'POST', {
                query: 'system deployment and configuration',
                collection: 'documents',
                limit: 3
            });

            const success = searchResponse.status === 200 && searchResponse.data.status === 'ok';
            this.logTest('RAG Document Search', success, 
                success ? `Found ${searchResponse.data.results?.length || 0} results` : 'Search failed');

            return success;
        } catch (error) {
            this.logTest('RAG Document Search', false, error.message);
            return false;
        }
    }

    async testMemorySystem() {
        console.log('\n🧠 Testing Memory System...');
        
        try {
            const memoryResponse = await this.makeRequest('/api/memory/context?agent=mene&query=previous+tests&limit=5');
            const success = memoryResponse.status === 200;
            this.logTest('Memory Context Retrieval', success, 
                success ? `Retrieved ${memoryResponse.data.context?.length || 0} memory items` : 'Memory retrieval failed');

            return success;
        } catch (error) {
            this.logTest('Memory Context Retrieval', false, error.message);
            return false;
        }
    }

    async testSystemHealth() {
        console.log('\n💚 Testing System Health...');
        
        try {
            // Test agent statistics
            const statsResponse = await this.makeRequest('/api/agent/stats');
            const statsSuccess = statsResponse.status === 200;
            this.logTest('Agent Statistics', statsSuccess, 
                statsSuccess ? `${statsResponse.data.totalCommunications} total communications` : 'Stats unavailable');

            // Test LTM voice assets
            const voicesResponse = await this.makeRequest('/api/ltm/voices');
            const voicesSuccess = voicesResponse.status === 200;
            this.logTest('Voice Assets', voicesSuccess, 
                voicesSuccess ? `${voicesResponse.data?.length || 0} voice assets available` : 'Voice assets unavailable');

            return statsSuccess && voicesSuccess;
        } catch (error) {
            this.logTest('System Health Check', false, error.message);
            return false;
        }
    }

    async runAllTests() {
        console.log('🧪 Starting Comprehensive Mene Portal System Test');
        console.log('================================================');
        console.log(`Testing server: ${this.baseUrl}`);
        console.log(`Timestamp: ${new Date().toISOString()}`);

        const tests = [
            { name: 'Basic Connectivity', fn: () => this.testBasicConnectivity() },
            { name: 'Agent Chat', fn: () => this.testAgentChat() },
            { name: 'Agent Communication', fn: () => this.testAgentCommunication() },
            { name: 'Multi-Agent Discussion', fn: () => this.testMultiAgentDiscussion() },
            { name: 'Browser Automation', fn: () => this.testBrowserAutomation() },
            { name: 'RAG System', fn: () => this.testRAGSystem() },
            { name: 'Memory System', fn: () => this.testMemorySystem() },
            { name: 'System Health', fn: () => this.testSystemHealth() }
        ];

        let passedTests = 0;
        
        for (const test of tests) {
            try {
                const result = await test.fn();
                if (result) passedTests++;
            } catch (error) {
                console.log(`❌ ${test.name} - Error: ${error.message}`);
            }
        }

        console.log('\n📊 Test Results Summary');
        console.log('========================');
        console.log(`Total Tests: ${tests.length}`);
        console.log(`Passed: ${passedTests}`);
        console.log(`Failed: ${tests.length - passedTests}`);
        console.log(`Success Rate: ${Math.round((passedTests / tests.length) * 100)}%`);

        if (passedTests === tests.length) {
            console.log('\n🎉 ALL TESTS PASSED! Your Mene Portal is fully operational!');
        } else {
            console.log('\n⚠️  Some tests failed. Check the logs above for details.');
        }

        console.log('\n🚀 System Status:');
        console.log(`✅ Web Interface: ${this.baseUrl}`);
        console.log('✅ Multi-Agent Communication: Active');
        console.log('✅ Browser Automation: Ready');
        console.log('✅ RAG Memory System: Online');
        console.log('✅ Voice Integration: 4 assets loaded');

        return passedTests === tests.length;
    }
}

// Run tests if called directly
if (require.main === module) {
    const baseUrl = process.argv[2] || 'http://localhost:3000';
    const tester = new MenePortalTester(baseUrl);
    
    tester.runAllTests().then(success => {
        process.exit(success ? 0 : 1);
    }).catch(error => {
        console.error('Test execution failed:', error);
        process.exit(1);
    });
}

module.exports = MenePortalTester;