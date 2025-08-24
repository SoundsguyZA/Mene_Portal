# 🧠 Mene Portal - The Ultimate AI Integration System

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-20%2B-green)](https://nodejs.org/)
[![Python](https://img.shields.io/badge/Python-3.11%2B-blue)](https://python.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue)](https://docker.com/)
[![WSL](https://img.shields.io/badge/WSL-Ubuntu%20Optimized-orange)](https://docs.microsoft.com/en-us/windows/wsl/)

## 🎯 **What is Mene Portal?**

Mene Portal is a **production-ready, privacy-first AI integration system** that combines:

- 🤖 **Multi-Agent Intelligence** - 5 specialized AI personalities
- 🌐 **Browser Automation** - Zero API cost ChatGPT/Genspark control  
- 📚 **RAG Knowledge System** - Your documents become AI memory
- 🧠 **Persistent Memory** - Cross-platform conversation continuity
- 🎙️ **Voice Integration** - Multiple voice clones ready
- 🐳 **Docker Deployment** - Production containerization
- 🔒 **Complete Privacy** - Everything runs locally

---

## 🚀 **Quick Start (Copy & Paste)**

### **Option 1: Docker Deployment (Recommended)**
```bash
# Clone the repository
git clone https://github.com/SoundsguyZA/Mene_Portal.git
cd Mene_Portal
git checkout genspark_ai_developer

# One-command deployment
chmod +x deploy.sh
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
python -m playwright install chromium

# Start services
./deploy.sh local

# Access your portal
open http://localhost:3000
```

---

## 🏗️ **System Architecture**

```
┌─────────────────────────────────────────────────────────────────┐
│                      MENE PORTAL ECOSYSTEM                     │
│  🌐 Zero API Cost • 🔒 Privacy First • 🚀 Production Ready   │
├─────────────────────────────────────────────────────────────────┤
│  Web Interface (localhost:3000)                                │
│  ├── 🎭 Multi-Agent Chat UI                                   │
│  ├── 🎙️ Voice Controls (4 clones loaded)                     │
│  ├── 📱 Mobile Responsive Design                               │
│  └── ⚡ Real-time Agent Communication                          │
├─────────────────────────────────────────────────────────────────┤
│  Node.js API Server                                            │
│  ├── 🤖 Agent Orchestration                                   │
│  ├── 🧠 LTM Bridge (Voice + Memory)                           │
│  ├── 📨 Agent-to-Agent Communication                          │
│  └── 🔌 API Endpoint Management                               │
├─────────────────────────────────────────────────────────────────┤
│  Python AI Service (localhost:8888)                           │
│  ├── 🌐 Browser Automation (Playwright)                       │
│  ├── 📚 RAG Document Processing                               │
│  ├── 🧠 Memory Management                                     │
│  └── 🔗 ChromaDB Integration                                  │
├─────────────────────────────────────────────────────────────────┤
│  ChromaDB Vector Database (localhost:8000)                    │
│  ├── 📖 Document Embeddings                                   │
│  ├── 💬 Conversation Memory                                   │
│  ├── 🔍 Semantic Search                                       │
│  └── 🕸️ Knowledge Graph                                       │
├─────────────────────────────────────────────────────────────────┤
│  External Integrations                                         │
│  ├── 💬 ChatGPT (Browser Control)                            │
│  ├── ⭐ Genspark (Browser Control)                            │
│  ├── 👑 Kindroid (API Integration)                            │
│  ├── 💾 AI Drive (/mnt/aidrive)                              │
│  └── 🎵 Voice Assets (ElevenLabs, Google, Minimax)           │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🤖 **Meet Your AI Agent Network**

### **🧠 Mene (Master Orchestrator)**
- **Role**: Strategic coordinator and user interface
- **Capabilities**: 
  - Controls other agents and browser automation
  - Has access to complete knowledge base
  - Manages multi-agent discussions
  - Coordinates complex tasks across the system

### **🌺 Bonny (Research Specialist)**
- **Role**: Botanical scientist and research expert
- **Capabilities**:
  - Searches your 28MB ChatGPT history instantly
  - Processes scientific documents and papers
  - Provides cited research with sources
  - Cross-references botanical and scientific knowledge

### **😤 Steve (Harsh Critic)**
- **Role**: Brutal reviewer and quality controller
- **Capabilities**:
  - Reviews with full conversation context
  - Maintains quality standards database
  - Provides unfiltered honest feedback
  - Learns from past criticism patterns

### **🔍 Veritas (Truth Seeker)**
- **Role**: Fact checker and verification specialist
- **Capabilities**:
  - Browser-automated fact checking
  - Cross-references multiple sources
  - Maintains truth verification database
  - Screenshots evidence automatically

### **🔥 Chimalitis (Creative Catalyst)**
- **Role**: Innovation driver and creative spark
- **Capabilities**:
  - Connects concepts across your knowledge base
  - Builds on previous creative sessions
  - Sparks innovative thinking
  - Maintains creative inspiration database

---

## 🌐 **Browser Automation Capabilities**

### **Supported Platforms**
- ✅ **ChatGPT** - Full login, chat, and response extraction
- ✅ **Genspark** - Complete browser control and interaction  
- ✅ **Kindroid** - API integration ready
- ✅ **Custom Sites** - Any web platform via Playwright

### **Automation Features**
```javascript
// Navigate to any URL
POST /api/browser/action
{
  "agent": "mene",
  "action": "navigate", 
  "params": {"url": "https://chat.openai.com"}
}

// Click elements
POST /api/browser/action  
{
  "agent": "veritas",
  "action": "click",
  "params": {"selector": "button[data-testid='send-button']"}
}

// Extract content
POST /api/browser/action
{
  "agent": "bonny", 
  "action": "extract",
  "params": {"selector": "div[data-message-role='assistant']"}
}

// Take screenshots for evidence
POST /api/browser/action
{
  "agent": "veritas",
  "action": "screenshot",
  "params": {"path": "./evidence.png"}
}
```

---

## 📚 **RAG Knowledge System**

### **Document Processing**
Your Mene Portal automatically processes:
- 📄 **PDF Documents** - Research papers, reports, manuals
- 📝 **Word Documents** - Notes, drafts, documentation
- 📋 **Markdown Files** - Technical documentation, notes
- 💻 **Code Files** - Python, JavaScript, and more
- 🖼️ **Images** - OCR text extraction
- 🎵 **Audio** - Transcription and processing

### **Your Knowledge Base**
- ✅ **28MB ChatGPT History** - Fully processed and searchable
- ✅ **AI Drive Documents** - Veritas memory system integrated
- ✅ **Voice Assets** - 4 voice clones ready for synthesis
- ✅ **Conversation Memory** - Every chat saved with context

### **Semantic Search**
```bash
# Search your knowledge base
curl -X POST http://localhost:3000/api/rag/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Docker deployment best practices",
    "collection": "documents", 
    "limit": 5
  }'
```

---

## 🧠 **Agent-to-Agent Communication**

### **How Agents Talk to Each Other**

Your agents can have **persistent conversations** with each other:

```javascript
// Agent communication example
POST /api/agent/communicate
{
  "fromAgent": "mene",
  "toAgent": "bonny", 
  "message": "Can you research the latest developments in plant genetics?",
  "context": {"priority": "high", "saveToMemory": true}
}

// Multi-agent discussion
POST /api/agent/discussion
{
  "topic": "Improving Docker deployment strategy",
  "participants": ["mene", "steve", "veritas"],
  "moderator": "mene"
}
```

### **Communication Features**
- 💬 **Persistent Memory** - Agents remember past conversations
- 🔄 **Context Awareness** - Each agent knows what others said
- 📊 **Discussion Analytics** - Track conversation patterns
- 🎭 **Role Consistency** - Each agent maintains their personality

---

## 🔧 **Installation & Setup**

### **Prerequisites**
```bash
# Ubuntu/WSL Requirements
sudo apt update
sudo apt install -y curl git nodejs npm python3 python3-pip docker.io docker-compose

# Verify installations
node --version    # Should be 18+
python3 --version # Should be 3.9+
docker --version  # Should be 20+
```

### **Step-by-Step Setup**

#### **1. Clone & Navigate**
```bash
git clone https://github.com/SoundsguyZA/Mene_Portal.git
cd Mene_Portal
git checkout genspark_ai_developer
```

#### **2. Environment Configuration**
```bash
# Copy environment template
cp .env.example .env

# Edit with your settings
nano .env
```

**Environment Variables:**
```env
# Core Configuration
NODE_ENV=production
PORT=3000
CHROMA_URL=http://chroma:8000

# Feature Flags  
RAG_ENABLED=true
MEMORY_ENABLED=true
BROWSER_ENABLED=true

# Browser Settings
BROWSER_HEADLESS=true

# Memory Settings
MEMORY_RETENTION=30d
AUTO_PROCESS_DOCUMENTS=true

# Security (Generate secure keys)
ENCRYPTION_KEY=your-32-char-encryption-key-here
SESSION_SECRET=your-session-secret-here

# AI Drive Integration
AI_DRIVE_PATH=/mnt/aidrive
VERITAS_MEMORY_PATH=/mnt/aidrive/veritas_ai_memory

# API Keys (Optional - for external integrations)
OPENAI_API_KEY=your-openai-key
KINDROID_API_KEY=your-kindroid-key
GROQ_API_KEY=your-groq-key
ELEVENLABS_API_KEY=your-11labs-key
```

#### **3. Deploy with Docker**
```bash
# Make deployment script executable
chmod +x deploy.sh

# Deploy complete system
./deploy.sh docker

# Check deployment status
docker-compose ps
```

#### **4. Verify Installation**
```bash
# Check web interface
curl http://localhost:3000/api/agents

# Check Python service
curl http://localhost:8888/health

# Check ChromaDB
curl http://localhost:8000/api/v1/heartbeat

# View logs
docker-compose logs -f
```

---

## 🧪 **Testing Your System**

### **1. Basic Portal Test**
```bash
# Test agent endpoint
curl http://localhost:3000/api/agents

# Expected response:
{
  "agents": [
    {"name": "GPT-4o", "icon": "🧠", "ltm": {...}},
    {"name": "Bonny", "icon": "🌺", "ltm": {...}},
    // ... other agents
  ],
  "ltm": {
    "available": true,
    "voiceAssets": 4,
    "memoryAgents": 5
  }
}
```

### **2. Test Agent Communication**
```bash
# Send message to agent
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "agent": "Mene", 
    "message": "Hello! Test the integrated system.",
    "context": {"test": true}
  }'
```

### **3. Test Browser Automation**
```bash
# Test ChatGPT navigation
curl -X POST http://localhost:3000/api/browser/action \
  -H "Content-Type: application/json" \
  -d '{
    "agent": "mene",
    "action": "navigate", 
    "params": {"url": "https://chat.openai.com"}
  }'
```

### **4. Test RAG System**
```bash
# Search knowledge base
curl -X POST http://localhost:3000/api/rag/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "deployment instructions",
    "collection": "documents",
    "limit": 3
  }'
```

### **5. Test Agent-to-Agent Communication**
```bash
# Test inter-agent messaging
curl -X POST http://localhost:3000/api/agent/communicate \
  -H "Content-Type: application/json" \
  -d '{
    "fromAgent": "mene",
    "toAgent": "bonny",
    "message": "What do you think about our new system?",
    "context": {"persistent": true}
  }'
```

### **6. Test Multi-Agent Discussion**
```bash
# Orchestrate agent discussion
curl -X POST http://localhost:3000/api/agent/discussion \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "System performance optimization",
    "participants": ["mene", "bonny", "steve", "veritas"],
    "moderator": "mene"
  }'
```

---

## 📊 **Monitoring & Health Checks**

### **System Health**
```bash
# Check all services
./deploy.sh status

# Individual service checks
docker-compose ps
docker-compose logs mene-portal
docker-compose logs mene-rag
docker-compose logs chroma
```

### **Performance Monitoring**
```bash
# Resource usage
docker stats

# ChromaDB statistics  
curl http://localhost:8000/api/v1/collections

# Agent communication stats
curl http://localhost:3000/api/agent/stats
```

### **Log Management**
```bash
# View real-time logs
docker-compose logs -f --tail=50

# Service-specific logs
docker-compose logs mene-portal
docker-compose logs mene-rag

# Error logs only
docker-compose logs mene-portal | grep ERROR
```

---

## 🔒 **Security & Privacy**

### **Data Protection**
- 🔐 **Local Processing** - No data leaves your system
- 🔑 **Encrypted Storage** - AES-256 encryption for sensitive data
- 🛡️ **Container Isolation** - Docker security boundaries  
- 📁 **AI Drive Privacy** - Your documents stay private

### **Access Control**
- 🚪 **API Authentication** - Secure endpoint access
- 👥 **Multi-User Support** - Role-based permissions
- 📝 **Audit Logging** - Complete action tracking
- ⚡ **Rate Limiting** - Prevent abuse

### **Security Configuration**
```bash
# Generate secure keys
openssl rand -base64 32  # For ENCRYPTION_KEY
openssl rand -base64 24  # For SESSION_SECRET

# Update .env file with generated keys
ENCRYPTION_KEY=your-generated-32-char-key
SESSION_SECRET=your-generated-session-secret

# Set proper file permissions
chmod 600 .env
chmod 700 data/
```

---

## 🚀 **Production Deployment**

### **Docker Swarm (Multi-Node)**
```bash
# Initialize swarm
docker swarm init

# Deploy stack
docker stack deploy -c docker-compose.yml mene-portal

# Scale services
docker service scale mene-portal_mene-portal=3
```

### **Cloud Deployment Options**

#### **DigitalOcean**
```bash
# Create droplet with Docker
doctl compute droplet create mene-portal \
  --size s-2vcpu-4gb \
  --image docker-20-04 \
  --region nyc3

# Deploy to droplet
scp -r . root@droplet-ip:/opt/mene-portal
ssh root@droplet-ip "cd /opt/mene-portal && ./deploy.sh docker"
```

#### **AWS EC2**
```bash
# Launch EC2 instance with Docker
aws ec2 run-instances \
  --image-id ami-0c02fb55956c7d316 \
  --instance-type t3.medium \
  --key-name your-key-pair \
  --user-data file://cloud-init.sh
```

#### **Google Cloud**
```bash
# Deploy to Google Cloud Run
gcloud run deploy mene-portal \
  --source . \
  --platform managed \
  --region us-central1
```

---

## 📋 **API Reference**

### **Core Endpoints**

#### **GET /api/agents**
Get all available agents with LTM enhancement
```json
{
  "agents": [...],
  "ltm": {
    "available": true,
    "voiceAssets": 4,
    "memoryAgents": 5
  }
}
```

#### **POST /api/chat**
Enhanced chat with RAG and memory
```json
{
  "agent": "Mene",
  "message": "Your message here",
  "context": {
    "memory_enabled": true,
    "rag_enabled": true,
    "save_conversation": true
  }
}
```

### **Browser Automation Endpoints**

#### **POST /api/browser/action**
Execute browser automation actions
```json
{
  "agent": "mene",
  "action": "navigate|click|extract|screenshot", 
  "params": {
    "url": "https://example.com",
    "selector": "button#submit",
    "path": "./screenshot.png"
  }
}
```

### **RAG System Endpoints**

#### **POST /api/rag/search**
Search document knowledge base
```json
{
  "query": "your search query",
  "collection": "documents|conversations|code",
  "limit": 5
}
```

#### **POST /documents/add**
Add document to knowledge base
```json
{
  "file_path": "/path/to/document.pdf",
  "collection": "documents"
}
```

### **Memory System Endpoints**

#### **GET /api/memory/context**
Get conversation context
```
GET /api/memory/context?agent=mene&query=previous+discussions&limit=5
```

#### **POST /memory/save**
Save conversation to memory
```json
{
  "agent": "mene",
  "user_message": "Hello",
  "agent_response": "Hi there!",
  "context": {"session_id": "12345"}
}
```

### **Agent Communication Endpoints**

#### **POST /api/agent/communicate**
Send message between agents
```json
{
  "fromAgent": "mene",
  "toAgent": "bonny",
  "message": "Can you help with research?",
  "context": {"priority": "high"}
}
```

#### **POST /api/agent/discussion**
Orchestrate multi-agent discussion
```json
{
  "topic": "System optimization",
  "participants": ["mene", "bonny", "steve"],
  "moderator": "mene"
}
```

#### **GET /api/agent/history**
Get agent communication history
```
GET /api/agent/history?agent1=mene&agent2=bonny&limit=10
```

---

## 🛠️ **Troubleshooting**

### **Common Issues**

#### **Port Already in Use**
```bash
# Check what's using port 3000
sudo lsof -i :3000

# Kill process
sudo kill -9 <PID>

# Or use different port
PORT=3001 ./deploy.sh docker
```

#### **ChromaDB Connection Issues**
```bash
# Check ChromaDB container
docker-compose logs chroma

# Restart ChromaDB
docker-compose restart chroma

# Reset ChromaDB data (if needed)
docker-compose down
sudo rm -rf data/chroma
docker-compose up -d
```

#### **Browser Automation Fails**
```bash
# Check Playwright installation
python -m playwright install chromium

# Test browser manually
python -c "from playwright.sync_api import sync_playwright; p = sync_playwright().start(); browser = p.chromium.launch(); print('OK'); browser.close(); p.stop()"

# Check Python service logs
docker-compose logs mene-rag
```

#### **AI Drive Not Accessible**
```bash
# Check mount point
ls -la /mnt/aidrive

# Verify permissions
sudo chown -R $USER:$USER /mnt/aidrive

# Update AI Drive path in .env
AI_DRIVE_PATH=/your/actual/path
```

### **Debug Commands**
```bash
# Enter container for debugging
docker-compose exec mene-portal /bin/bash
docker-compose exec mene-rag /bin/bash

# Check container networking
docker network ls
docker network inspect mene-portal_mene-network

# Test internal connections
docker-compose exec mene-portal curl http://chroma:8000/api/v1/heartbeat
```

---

## 🎯 **What Makes This Special?**

### **🔥 Zero API Costs**
- Browser automation eliminates ChatGPT Plus subscription needs
- Direct Genspark control without API limits
- Local processing reduces external dependencies

### **🧠 Complete Memory**
- Every conversation is remembered and searchable
- Cross-platform context (ChatGPT ↔ Genspark)
- Agent-to-agent communication history

### **📚 Your Knowledge, Your AI**
- 28MB ChatGPT history fully processed and searchable
- AI Drive documents become searchable knowledge
- Privacy-first local processing

### **🤖 Agent Collaboration**
- Agents can discuss topics with each other
- Persistent multi-agent conversations
- Each agent maintains their expertise and personality

### **🚀 Production Ready**
- Docker containerization for easy deployment
- Health monitoring and auto-recovery
- Scalable architecture for multi-user scenarios

---

## 📞 **Support & Contributions**

### **Getting Help**
- 📚 Check this README for common solutions
- 🐛 Report issues on GitHub
- 💡 Join discussions for feature requests

### **Contributing**
```bash
# Fork and clone
git clone https://github.com/yourusername/Mene_Portal.git
cd Mene_Portal

# Create feature branch
git checkout -b feature/amazing-new-feature

# Make changes and test
./deploy.sh local

# Submit pull request
git push origin feature/amazing-new-feature
```

---

## 📜 **License**

MIT License - see [LICENSE](LICENSE) file for details.

---

## 🎉 **Congratulations!**

You now have the **most advanced personal AI system** ever created:

✅ **5 Specialized AI Agents** with distinct personalities  
✅ **Zero API Cost** browser automation for ChatGPT/Genspark  
✅ **Complete Privacy** with local RAG processing  
✅ **Persistent Memory** that never forgets context  
✅ **Agent-to-Agent Communication** for collaborative intelligence  
✅ **Voice Integration** ready with 4 voice clones  
✅ **Production Deployment** with monitoring and recovery  
✅ **WSL/Ubuntu Optimized** for your development environment  

**Your Mene Portal is ready to revolutionize how you interact with AI! 🚀**

---

*Built with ❤️ for the future of AI interaction*