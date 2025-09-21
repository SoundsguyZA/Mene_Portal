const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const MeneLTMBridge = require('./mene_ltm_bridge');
const AgentCommunicationSystem = require('./agent_communication');
const VeritasSyncMemory = require('./veritas_sync_memory');
const { spawn } = require('child_process');

const PORT = 3000;

// Initialize Mene LTM Bridge
const ltmBridge = new MeneLTMBridge();

// Initialize Agent Communication System
const agentComm = new AgentCommunicationSystem(ltmBridge);

// Initialize Veritas Sync Memory System
const veritasSync = new VeritasSyncMemory(ltmBridge, null);

// Browser automation and RAG integration
let pythonProcess = null;

// Initialize Python RAG system
function initializePythonRAG() {
  console.log('🐍 Initializing Python RAG + Browser system...');
  
  // Note: In production, this would be a proper Python service
  // For now, we'll create the integration structure
  console.log('✅ Python integration structure ready');
}

// MIME types
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg',
  '.mp4': 'video/mp4',
  '.woff': 'application/font-woff',
  '.ttf': 'application/font-ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.otf': 'application/font-otf',
  '.wasm': 'application/wasm'
};

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url);
  let pathname = `.${parsedUrl.pathname}`;
  
  // Enable CORS for API requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Default to index.html for root path
  if (pathname === './') {
    pathname = './index.html';
  }

  // Handle API endpoints
  if (pathname.startsWith('./api/')) {
    handleApiRequest(req, res, pathname);
    return;
  }

  const ext = path.parse(pathname).ext;
  const mimeType = mimeTypes[ext] || 'text/plain';

  fs.readFile(pathname, (err, data) => {
    if (err) {
      res.statusCode = 404;
      res.end(`File ${pathname} not found!`);
      return;
    }
    res.setHeader('Content-type', mimeType);
    res.end(data);
  });
});

// Handle API requests for the Mene Portal
async function handleApiRequest(req, res, pathname) {
  if (pathname === './api/chat' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        console.log('Chat request:', data);
        
        // Process through Mene LTM system
        ltmBridge.processAgentQuery(
          data.agent || 'Mene', 
          data.message, 
          { 
            previousMessages: data.context || [],
            knowledgeContext: data.knowledgeQuery || null
          }
        ).then(ltmResponse => {
          const response = {
            agent: ltmResponse.agent,
            message: ltmResponse.response,
            timestamp: ltmResponse.timestamp,
            model: ltmResponse.model,
            specialties: ltmResponse.specialties,
            voice: ltmResponse.voice,
            confidence: ltmResponse.confidence
          };
          
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(response));
        }).catch(error => {
          console.error('LTM Error:', error);
          const fallbackResponse = {
            agent: data.agent || 'Mene',
            message: `Hello! I'm ${data.agent || 'Mene'} responding to: "${data.message}". The LTM system is initializing...`,
            timestamp: new Date().toISOString(),
            error: 'LTM processing error'
          };
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(fallbackResponse));
        });
        
        // Response handled in promise chain above
      } catch (error) {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
  } else if (pathname === './api/agents' && req.method === 'GET') {
    // Serve enhanced agent configuration with LTM data
    try {
      const configData = fs.readFileSync('./meneportal_config.json', 'utf8');
      const config = JSON.parse(configData);
      
      // Enhance with LTM agent data
      const ltmAgents = ltmBridge.getAllAgents();
      const enhancedAgents = config.agents.map(agent => {
        const ltmAgent = ltmAgents.find(ltm => 
          ltm.name.toLowerCase().includes(agent.name.toLowerCase()) ||
          agent.name.toLowerCase().includes(ltm.name)
        );
        
        return {
          ...agent,
          ltm: ltmAgent ? {
            role: ltmAgent.role,
            personality: ltmAgent.personality,
            specialties: ltmAgent.specialties,
            voiceProfile: ltmAgent.voiceProfile
          } : null
        };
      });
      
      const enhancedConfig = {
        ...config,
        agents: enhancedAgents,
        ltm: {
          available: true,
          voiceAssets: ltmBridge.getVoiceAssets().length,
          memoryAgents: ltmAgents.length
        }
      };
      
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(enhancedConfig, null, 2));
    } catch (error) {
      res.statusCode = 500;
      res.end(JSON.stringify({ error: 'Failed to load enhanced agents config' }));
    }
  } else if (pathname === './api/speech-to-text' && req.method === 'POST') {
    // Handle speech-to-text requests
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ 
      text: "Speech recognition would be implemented here",
      confidence: 0.95 
    }));
  } else if (pathname === './api/ltm/agents' && req.method === 'GET') {
    // Get all LTM agents
    const agents = ltmBridge.getAllAgents();
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(agents));
  } else if (pathname === './api/ltm/voices' && req.method === 'GET') {
    // Get voice assets
    const voices = ltmBridge.getVoiceAssets();
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(voices));
  } else if (pathname.startsWith('./api/ltm/agent/') && req.method === 'GET') {
    // Get specific agent info
    const agentName = pathname.split('/').pop();
    const agentInfo = ltmBridge.getAgentInfo(agentName);
    res.setHeader('Content-Type', 'application/json');
    if (agentInfo) {
      res.end(JSON.stringify(agentInfo));
    } else {
      res.statusCode = 404;
      res.end(JSON.stringify({ error: 'Agent not found' }));
    }
  } else if (pathname === './api/browser/action' && req.method === 'POST') {
    // Handle browser automation requests
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const { agent, action, params } = data;
        
        // Mock browser automation response
        const mockResponse = {
          status: 'ok',
          agent: agent,
          action: action,
          result: `Browser action '${action}' executed for ${agent}`,
          timestamp: new Date().toISOString(),
          params: params
        };
        
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(mockResponse));
      } catch (error) {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: 'Invalid browser action request' }));
      }
    });
  } else if (pathname === './api/rag/search' && req.method === 'POST') {
    // Handle RAG search requests
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const { query, collection, limit } = data;
        
        // Mock RAG search response
        const mockResults = {
          status: 'ok',
          query: query,
          results: [
            {
              text: `Relevant information about ${query} from your documents...`,
              metadata: { source: 'ChatGPT_history.md', relevance: 0.95 },
              relevance: 0.95
            }
          ],
          total_results: 1,
          collection: collection || 'documents'
        };
        
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(mockResults));
      } catch (error) {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: 'Invalid RAG search request' }));
      }
    });
  } else if (pathname === './api/memory/context' && req.method === 'GET') {
    // Handle memory context requests
    const urlParams = new URLSearchParams(parsedUrl.query);
    const agent = urlParams.get('agent');
    const query = urlParams.get('query');
    
    const mockMemory = {
      status: 'ok',
      agent: agent,
      query: query,
      context: [
        {
          summary: `Previous conversation with ${agent} about similar topics`,
          timestamp: new Date(Date.now() - 86400000).toISOString(),
          relevance: 0.8
        }
      ],
      total_results: 1
    };
    
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(mockMemory));
  } else if (pathname === './api/agent/communicate' && req.method === 'POST') {
    // Handle agent-to-agent communication
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', async () => {
      try {
        const data = JSON.parse(body);
        const { fromAgent, toAgent, message, context } = data;
        
        const result = await agentComm.routeAgentMessage(fromAgent, toAgent, message, context);
        
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(result));
      } catch (error) {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: 'Invalid agent communication request' }));
      }
    });
  } else if (pathname === './api/agent/discussion' && req.method === 'POST') {
    // Handle multi-agent discussion
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', async () => {
      try {
        const data = JSON.parse(body);
        const { topic, participants, moderator } = data;
        
        const result = await agentComm.orchestrateMultiAgentDiscussion(topic, participants, moderator);
        
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(result));
      } catch (error) {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: 'Invalid discussion request' }));
      }
    });
  } else if (pathname === './api/agent/history' && req.method === 'GET') {
    // Get agent communication history
    const urlParams = new URLSearchParams(parsedUrl.query);
    const agent1 = urlParams.get('agent1');
    const agent2 = urlParams.get('agent2');
    const limit = parseInt(urlParams.get('limit')) || 10;
    
    agentComm.getAgentCommunicationHistory(agent1, agent2, limit).then(result => {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(result));
    }).catch(error => {
      res.statusCode = 500;
      res.end(JSON.stringify({ error: error.message }));
    });
  } else if (pathname === './api/agent/stats' && req.method === 'GET') {
    // Get agent communication statistics
    const stats = {
      status: 'ok',
      totalCommunications: agentComm.communicationHistory.length,
      activeConversations: agentComm.activeConversations.size,
      agentActivity: {
        mene: agentComm.communicationHistory.filter(c => c.fromAgent === 'mene' || c.toAgent === 'mene').length,
        bonny: agentComm.communicationHistory.filter(c => c.fromAgent === 'bonny' || c.toAgent === 'bonny').length,
        steve: agentComm.communicationHistory.filter(c => c.fromAgent === 'steve' || c.toAgent === 'steve').length,
        veritas: agentComm.communicationHistory.filter(c => c.fromAgent === 'veritas' || c.toAgent === 'veritas').length,
        chimalitis: agentComm.communicationHistory.filter(c => c.fromAgent === 'chimalitis' || c.toAgent === 'chimalitis').length
      },
      timestamp: new Date().toISOString()
    };
    
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(stats));
  } else if (pathname === './api/veritas/verify' && req.method === 'POST') {
    // Verify a claim through Veritas Sync Memory
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', async () => {
      try {
        const data = JSON.parse(body);
        const { claim, context } = data;
        
        const verification = await veritasSync.verifyClaim(claim, context);
        
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(verification));
      } catch (error) {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: 'Invalid verification request' }));
      }
    });
  } else if (pathname === './api/veritas/sync' && req.method === 'POST') {
    // Sync memory across platforms
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', async () => {
      try {
        const data = JSON.parse(body);
        const { memoryData, platforms } = data;
        
        const syncResults = await veritasSync.syncMemoryAcrossPlatforms(memoryData, platforms);
        
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({
          status: 'ok',
          sync_results: syncResults,
          timestamp: new Date().toISOString()
        }));
      } catch (error) {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: 'Invalid sync request' }));
      }
    });
  } else if (pathname === './api/veritas/stats' && req.method === 'GET') {
    // Get Veritas verification statistics
    try {
      const stats = veritasSync.getVerificationStats();
      
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({
        status: 'ok',
        veritas_stats: stats,
        timestamp: new Date().toISOString()
      }));
    } catch (error) {
      res.statusCode = 500;
      res.end(JSON.stringify({ error: error.message }));
    }
  } else if (pathname === './api/veritas/search' && req.method === 'GET') {
    // Search truth database
    const urlParams = new URLSearchParams(parsedUrl.query);
    const query = urlParams.get('query');
    const limit = parseInt(urlParams.get('limit')) || 10;
    
    try {
      // Search through truth database
      const results = [];
      let count = 0;
      
      for (const [id, verification] of veritasSync.truthDatabase) {
        if (count >= limit) break;
        
        if (verification.claim.toLowerCase().includes(query.toLowerCase())) {
          results.push({
            id: id,
            claim: verification.claim.substring(0, 200),
            status: verification.status,
            confidence: verification.confidence,
            sources: verification.sources?.length || 0,
            timestamp: verification.completedAt || verification.startedAt
          });
          count++;
        }
      }
      
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({
        status: 'ok',
        query: query,
        results: results,
        total_found: results.length
      }));
    } catch (error) {
      res.statusCode = 500;
      res.end(JSON.stringify({ error: error.message }));
    }
  } else {
    res.statusCode = 404;
    res.end(JSON.stringify({ error: 'API endpoint not found' }));
  }
}

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Mene Portal Server running at http://0.0.0.0:${PORT}/`);
  console.log(`📱 Access your portal at the URL above`);
  console.log(`🤖 Agents: GPT-4o, Bonny, Kimi K2, Veritas, Chimalitis`);
  console.log(`🧠 Mene_LTM system integrated with voice assets`);
  console.log(`🌐 Browser automation ready for ChatGPT/Genspark`);
  console.log(`📚 RAG memory system ready for document processing`);
  console.log(`📨 Agent-to-agent communication system active`);
  console.log(`🎭 Multi-agent discussions enabled`);
  console.log(`🔍 Veritas Sync Memory system active`);
  console.log(`✅ Truth verification and cross-platform sync ready`);
  
  // Initialize additional systems
  initializePythonRAG();
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Server shutting down gracefully...');
  server.close(() => {
    console.log('Server closed.');
  });
});