# 🧠 Mene Portal - Complete AI Integration Guide

## 🔥 **THE ULTIMATE AI BRIDGE + RAG + BROWSER SYSTEM**

Your Mene Portal has been enhanced with the complete AI Bridge architecture from your Aluna Africa system and browser automation capabilities. This is now a **production-ready, privacy-first, zero-API-cost AI empire**.

---

## 🎯 **WHAT YOU NOW HAVE**

### 🌐 **Browser Automation Layer**
- **Playwright-powered automation** for ChatGPT and Genspark
- **Zero API costs** - direct browser interaction
- **Multi-agent sessions** - each agent can have its own browser
- **LLM-friendly primitives**: navigate, click, extract, screenshot

### 📚 **RAG + Memory System**
- **ChromaDB vector database** for semantic search
- **Document processing** - PDF, Word, Markdown, Code, Images
- **Cross-platform memory** - conversations persist across ChatGPT ↔ Genspark
- **AI Drive integration** - your 28MB ChatGPT history is processed

### 🤖 **Enhanced Agent Network**
- **Mene** - Master orchestrator with full system access
- **Bonny** - Research specialist with RAG-powered knowledge
- **Steve** - Critical reviewer with memory context
- **Veritas** - Truth verification with browser automation
- **Chimalitis** - Creative catalyst with document awareness

### 🚀 **Production Infrastructure**
- **Docker containerization** - scalable, portable deployment
- **PM2 process management** - reliable service monitoring
- **Health checking** - automatic recovery and monitoring
- **Environment management** - secure configuration

---

## 🚀 **DEPLOYMENT OPTIONS**

### **Option 1: Docker Deployment (Recommended)**
```bash
# Clone your enhanced portal
git clone https://github.com/SoundsguyZA/Mene_Portal.git
cd Mene_Portal
git checkout genspark_ai_developer

# One-command deployment
./deploy.sh docker

# Access your portal
open http://localhost:3000
```

### **Option 2: Local Development**
```bash
# Clone and setup
git clone https://github.com/SoundsguyZA/Mene_Portal.git
cd Mene_Portal
git checkout genspark_ai_developer

# Install dependencies
npm install
pip install -r requirements.python.txt

# Start services
./deploy.sh local

# Access your portal
open http://localhost:3000
```

### **Option 3: WSL/Ubuntu Production**
```bash
# Install Docker and Docker Compose
sudo apt update
sudo apt install docker.io docker-compose

# Clone and deploy
git clone https://github.com/SoundsguyZA/Mene_Portal.git
cd Mene_Portal
git checkout genspark_ai_developer
chmod +x deploy.sh
./deploy.sh docker

# Setup as systemd service (optional)
sudo systemctl enable docker
```

---

## 🔧 **SYSTEM ARCHITECTURE**

```
┌─────────────────────────────────────────────────────────────┐
│                    MENE PORTAL ECOSYSTEM                    │
├─────────────────────────────────────────────────────────────┤
│  Web Interface (Port 3000)                                 │
│  ├── Multi-agent Chat UI                                   │
│  ├── Voice Integration Ready                               │
│  └── Real-time Agent Communication                         │
├─────────────────────────────────────────────────────────────┤
│  Node.js API Server                                        │
│  ├── Agent Orchestration                                   │
│  ├── LTM Bridge Integration                                │
│  ├── Voice Asset Management                                │
│  └── API Endpoint Management                               │
├─────────────────────────────────────────────────────────────┤
│  Python AI Service (Port 8888)                            │
│  ├── Browser Automation (Playwright)                       │
│  ├── RAG Document Processing                               │
│  ├── Memory Management                                     │
│  └── ChromaDB Integration                                  │
├─────────────────────────────────────────────────────────────┤
│  ChromaDB Vector Database (Port 8000)                     │
│  ├── Document Embeddings                                   │
│  ├── Conversation Memory                                   │
│  ├── Semantic Search                                       │
│  └── Knowledge Graph                                       │
├─────────────────────────────────────────────────────────────┤
│  External Integrations                                     │
│  ├── ChatGPT (Browser Automation)                         │
│  ├── Genspark (Browser Automation)                        │
│  ├── AI Drive (/mnt/aidrive)                              │
│  └── Voice Assets (4 Clones)                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 📋 **API ENDPOINTS**

### **Core Mene Portal APIs**
- `GET /api/agents` - Get all agents with LTM enhancement
- `POST /api/chat` - Enhanced chat with RAG + memory
- `GET /api/ltm/voices` - Voice asset management
- `GET /api/ltm/agents` - LTM agent information

### **Browser Automation APIs**
- `POST /api/browser/action` - Execute browser actions
  - `navigate` - Go to URL
  - `click` - Click elements
  - `extract` - Get page content
  - `screenshot` - Capture screens

### **RAG System APIs**
- `POST /api/rag/search` - Search documents
- `POST /documents/add` - Add documents to RAG
- `GET /memory/context` - Get conversation context

### **Memory System APIs**
- `POST /memory/save` - Save conversations
- `GET /memory/context` - Retrieve context
- `POST /agent/query` - Enhanced agent queries

---

## 🎭 **AGENT CAPABILITIES**

### **Mene (Master Orchestrator)**
```javascript
// Browser automation example
POST /api/browser/action
{
  "agent": "mene",
  "action": "chatgpt_login",
  "params": {"email": "your-email@example.com"}
}

// RAG-enhanced response
POST /api/chat  
{
  "agent": "Mene",
  "message": "What did we discuss about Docker deployment?",
  "context": {"memory_enabled": true, "rag_enabled": true}
}
```

### **Bonny (Research Specialist)**
```javascript
// Document-aware research
POST /api/rag/search
{
  "query": "botanical research methods",
  "collection": "documents",
  "limit": 5
}

// Enhanced research query
POST /api/agent/query
{
  "agent": "bonny", 
  "query": "Latest developments in plant genetics",
  "context": {"use_rag": true, "memory_context": true}
}
```

### **Veritas (Truth Verification)**
```javascript
// Browser fact-checking
POST /api/browser/action
{
  "agent": "veritas",
  "action": "navigate", 
  "params": {"url": "https://fact-check-site.com"}
}

// Cross-reference verification
POST /api/chat
{
  "agent": "Veritas",
  "message": "Verify this claim against our knowledge base",
  "context": {"verification_mode": true}
}
```

---

## 🔍 **TESTING YOUR INTEGRATION**

### **1. Basic Portal Test**
```bash
# Check if portal is running
curl http://localhost:3000/api/agents

# Test agent communication
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"agent": "Mene", "message": "Hello from the integrated system!"}'
```

### **2. RAG System Test**
```bash
# Test document search
curl -X POST http://localhost:3000/api/rag/search \
  -H "Content-Type: application/json" \
  -d '{"query": "docker deployment", "limit": 3}'
```

### **3. Browser Automation Test**
```bash
# Test browser navigation
curl -X POST http://localhost:3000/api/browser/action \
  -H "Content-Type: application/json" \
  -d '{"agent": "mene", "action": "navigate", "params": {"url": "https://chat.openai.com"}}'
```

### **4. Memory System Test**
```bash
# Test memory context
curl "http://localhost:3000/api/memory/context?agent=mene&query=previous+conversations"
```

---

## 🛠️ **CUSTOMIZATION OPTIONS**

### **Add New Agents**
Edit `mene_ltm_bridge.js` or `rag_memory_system.py`:
```javascript
// Add new agent personality
this.memoryAgents.set('new_agent', {
  role: 'Custom Specialist',
  personality: 'Helpful and knowledgeable',
  specialties: ['custom_task', 'specialized_knowledge']
});
```

### **Configure Browser Automation**
Edit `browser_bridge.py`:
```python
# Add custom browser actions
def custom_action(self, params):
    # Your custom automation logic
    return {"status": "ok", "result": "Custom action completed"}
```

### **Extend RAG Processing**
Edit `rag_memory_system.py`:
```python
# Add new document types
self.supported_formats.extend(['.xlsx', '.pptx', '.epub'])

# Custom processing logic
def process_custom_format(self, file_path):
    # Your custom processing logic
    return processed_text
```

---

## 🔒 **SECURITY & PRIVACY**

### **Data Privacy**
- All processing happens locally
- No data sent to external APIs (except chosen AI services)
- AI Drive remains private and encrypted
- Browser sessions are isolated per agent

### **Security Features**
- Docker container isolation
- Environment variable management
- Health monitoring and auto-recovery
- Rate limiting and request validation

### **Configuration Security**
```bash
# Generate secure keys
openssl rand -base64 32  # For ENCRYPTION_KEY
openssl rand -base64 24  # For SESSION_SECRET

# Update .env file
ENCRYPTION_KEY=your-generated-32-char-key
SESSION_SECRET=your-generated-session-secret
```

---

## 📊 **MONITORING & MAINTENANCE**

### **Health Monitoring**
```bash
# Check all services
docker-compose ps

# View logs
docker-compose logs -f mene-portal
docker-compose logs -f mene-rag
docker-compose logs -f chroma

# Check specific service health
curl http://localhost:3000/api/agents        # Node.js health
curl http://localhost:8888/health           # Python service health  
curl http://localhost:8000/api/v1/heartbeat # ChromaDB health
```

### **Performance Monitoring**
```bash
# Resource usage
docker stats

# Database statistics
curl http://localhost:8000/api/v1/collections

# Memory usage
curl http://localhost:3000/api/ltm/voices
```

### **Backup & Recovery**
```bash
# Backup ChromaDB data
docker run --rm -v mene-portal_chroma-data:/data -v $(pwd):/backup alpine tar czf /backup/chroma-backup.tar.gz /data

# Backup conversation memory
cp -r data/memory memory-backup-$(date +%Y%m%d)

# Restore from backup
docker-compose down
tar xzf chroma-backup.tar.gz -C data/
docker-compose up -d
```

---

## 🎉 **CONGRATULATIONS!**

You now have the **most advanced personal AI system** with:

✅ **Zero API costs** through browser automation  
✅ **Complete privacy** with local RAG processing  
✅ **Persistent memory** across all conversations  
✅ **Multi-agent orchestration** with specialized roles  
✅ **Voice integration ready** with your cloned voices  
✅ **Production deployment** with Docker + monitoring  
✅ **WSL/Ubuntu optimized** for your environment  

### **Next Steps:**
1. **Deploy**: Run `./deploy.sh docker` to start everything
2. **Test**: Visit http://localhost:3000 and chat with your agents
3. **Customize**: Add your API keys and configure agents
4. **Scale**: Use Docker Swarm or Kubernetes for multi-node deployment
5. **Extend**: Add new agents, document types, or automation workflows

**Your Mene Portal is now the BOSS-level AI system you requested! 🚀**