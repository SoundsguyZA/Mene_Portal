const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 3000;

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
function handleApiRequest(req, res, pathname) {
  if (pathname === './api/chat' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        console.log('Chat request:', data);
        
        // Mock response for now - you'll integrate real agents here
        const mockResponse = {
          agent: data.agent || 'Mene',
          message: `Hello! This is ${data.agent || 'Mene'} responding to: "${data.message}". The portal is now running! 🚀`,
          timestamp: new Date().toISOString()
        };
        
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(mockResponse));
      } catch (error) {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
  } else if (pathname === './api/agents' && req.method === 'GET') {
    // Serve the agent configuration
    fs.readFile('./meneportal_config.json', (err, data) => {
      if (err) {
        res.statusCode = 500;
        res.end(JSON.stringify({ error: 'Failed to load agents config' }));
        return;
      }
      res.setHeader('Content-Type', 'application/json');
      res.end(data);
    });
  } else if (pathname === './api/speech-to-text' && req.method === 'POST') {
    // Handle speech-to-text requests
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ 
      text: "Speech recognition would be implemented here",
      confidence: 0.95 
    }));
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