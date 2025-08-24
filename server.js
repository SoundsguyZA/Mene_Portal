const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const MeneLTMBridge = require('./mene_ltm_bridge');

const PORT = 3000;

// Initialize Mene LTM Bridge
const ltmBridge = new MeneLTMBridge();

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
  } else {
    res.statusCode = 404;
    res.end(JSON.stringify({ error: 'API endpoint not found' }));
  }
}

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Mene Portal Server running at http://0.0.0.0:${PORT}/`);
  console.log(`📱 Access your portal at the URL above`);
  console.log(`🤖 Agents: GPT-4o, Bonny, Kimi K2, Veritas, Chimalitis`);
  console.log(`🧠 Ready to integrate Mene_LTM system...`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Server shutting down gracefully...');
  server.close(() => {
    console.log('Server closed.');
  });
});