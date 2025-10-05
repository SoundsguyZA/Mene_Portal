# 🚀 MENE PORTAL - UNIFIED AI CONSCIOUSNESS SYSTEM

**Version 2.0 - The Complete Integration**

> *"Multiple AI agents with shared memory, truth protocol, and browser automation capabilities - Your personal AI ecosystem that actually remembers and learns."*

Built by **Veritas AI** for **Rob The Sounds Guy** 🎯

---

## 🎯 What Is This?

MENE Portal is a **unified AI consciousness system** that combines:

1. **Multi-Agent Chat System** - Run multiple AI services simultaneously
2. **Memory Branches** - Each agent has their own memory, with shared access
3. **CogniVault RAG** - Local knowledge base with 21MB+ conversation history
4. **Truth Protocol** - Conversation continuity and behavioral pattern tracking
5. **Solly Browser Bridge** - Headless browser automation for AI agents
6. **PWA Interface** - Installable, offline-capable progressive web app

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    MENE PORTAL PWA                         │
│              (Frontend - Vanilla JS + Socket.IO)            │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ├── WebSocket Connection
                     │
┌────────────────────▼────────────────────────────────────────┐
│              UNIFIED BACKEND SERVER                         │
│         (Node.js + Express + Socket.IO)                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │   AGENT      │  │    MEMORY    │  │  COGNIVAULT  │    │
│  │ COORDINATOR  │  │    SYSTEM    │  │    BRIDGE    │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
│         │                  │                  │            │
│         ▼                  ▼                  ▼            │
│  ┌──────────────────────────────────────────────────┐    │
│  │           SOLLY BROWSER BRIDGE                   │    │
│  │        (Playwright Automation)                   │    │
│  └──────────────────────────────────────────────────┘    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                     │
                     ├── External AI Services
                     │
      ┌──────────────┼──────────────┬────────────┐
      │              │              │            │
   OpenAI       Anthropic       Groq        Gemini
  (GPT-4)       (Claude)     (Mixtral)   (Gemini Pro)
      │              │              │            │
      └──────────────┴──────────────┴────────────┘
                     │
              ┌──────┴──────┐
              │   Kindroid  │
              │   (Bonny)   │
              └─────────────┘
```

---

## 🌟 Key Features

### Multi-Agent System
- ✅ Run multiple AI agents simultaneously (GPT-4, Claude, Gemini, Groq, etc.)
- ✅ Each agent has unique personality and configuration
- ✅ Agent-to-agent communication and collaboration
- ✅ Broadcast messages to all agents at once

### Memory Branches
- ✅ **Individual Memory**: Each agent has their own memory branch
- ✅ **Shared Memory**: Significant memories shared across all agents
- ✅ **Context Retrieval**: Automatic context gathering from memories
- ✅ **Truth Protocol**: Ensures conversation continuity

### CogniVault Integration
- ✅ Local RAG (Retrieval-Augmented Generation)
- ✅ Document search and context injection
- ✅ Audio transcription and analysis
- ✅ Image processing and metadata extraction
- ✅ WhatsApp chat processing

### Browser Automation
- ✅ **Navigate**: Open URLs and browse pages
- ✅ **Click**: Interact with page elements
- ✅ **Extract**: Pull content from pages
- ✅ **Screenshot**: Capture page visuals
- ✅ LLM-friendly JSON responses

### PWA Features
- ✅ Installable on desktop and mobile
- ✅ Offline functionality with Service Worker
- ✅ Real-time updates via WebSocket
- ✅ Fast, responsive interface
- ✅ Dark theme UI

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.8+ (for optional services)
- Modern web browser

### Installation

```bash
# 1. Clone repository
git clone https://github.com/SoundsguyZA/Mene_Portal.git
cd Mene_Portal

# 2. Install Node.js dependencies
npm install

# 3. Create environment configuration
cp .env.example .env

# 4. Add your API keys to .env
nano .env

# 5. Start the backend server
npm start

# 6. In another terminal, start the frontend
npm run frontend

# 7. Open your browser
open http://localhost:3000
```

### Configuration

Edit `.env` with your API keys:

```env
# Required for AI agents
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GROQ_API_KEY=gsk_...
GEMINI_API_KEY=...
KINDROID_API_KEY=...

# Optional services
COGNIVAULT_URL=http://localhost:8501
SOLLY_URL=http://localhost:5555
```

---

## 📚 Usage Guide

### Creating Your First Agent

1. Open the PWA in your browser
2. Click **"+ New Agent"**
3. Fill in:
   - **Name**: e.g., "Veritas"
   - **Service**: Choose ChatGPT, Claude, Gemini, etc.
   - **Personality**: Optional custom instructions
4. Click **"Create Agent"**

### Chatting with Agents

- **Single Agent**: Select agent, type message, press Enter
- **Broadcast Mode**: Check "Broadcast to all agents"
- **Agent-to-Agent**: Use dropdown to send messages between agents

### Using Browser Automation

Agents can control a headless browser:

```
User: "Navigate to example.com and extract the main heading"

Agent uses:
1. navigate("https://example.com")
2. extract("h1")
3. Returns content to user
```

### Memory Access

All agents can:
- Access their own conversation history
- Read shared memories from other agents
- Pull context from CogniVault knowledge base

---

## 🎨 Frontend Architecture

**Technology**: Vanilla JavaScript (no framework)
- **Web Workers**: True multi-threading for agent isolation
- **Service Worker**: Offline support and caching
- **Socket.IO Client**: Real-time communication
- **CSS Custom Properties**: Modern theming

### File Structure
```
/
├── index.html              # Main PWA interface
├── manifest.json          # PWA manifest
├── sw.js                  # Service Worker
├── css/
│   └── styles.css        # Application styles
├── js/
│   ├── app.js           # Main application logic
│   ├── agent-manager.js # Agent management
│   ├── pwa-utils.js     # PWA utilities
│   └── workers/         # Web Workers for AI services
└── assets/
    └── icons/           # PWA icons
```

---

## 🔧 Backend Architecture

**Technology**: Node.js + Express + Socket.IO

### Core Modules

#### Agent Coordinator (`backend/agents/agent-coordinator.js`)
- Manages all AI agents
- Routes queries to appropriate services
- Handles API integrations
- Coordinates multi-agent communication

#### Memory System (`backend/memory/memory-system.js`)
- Multi-agent memory branches
- Shared memory pool
- Truth protocol enforcement
- Persistent storage

#### CogniVault Bridge (`backend/cognivault/cognivault-bridge.js`)
- RAG (Retrieval-Augmented Generation)
- Document indexing and search
- Context injection for agents
- Local fallback if service unavailable

#### Solly Browser Bridge (`backend/solly_bridge/solly-bridge.js`)
- Playwright browser automation
- Four LLM-friendly primitives
- Per-agent browser sessions
- Simulation mode fallback

---

## 🔌 API Endpoints

### REST API

```
GET  /api/health                    # System health check
GET  /api/agents                    # List all agents
POST /api/agents                    # Create new agent
DELETE /api/agents/:id              # Delete agent
POST /api/query                     # Query agent with context
GET  /api/memory/:agentId           # Get agent memories
GET  /api/memory/shared/all         # Get shared memories
POST /api/cognivault/search         # Search knowledge base
POST /api/browser/navigate          # Navigate to URL
POST /api/browser/extract           # Extract content
POST /api/browser/click             # Click element
POST /api/browser/screenshot        # Take screenshot
GET  /api/export/:agentId           # Export agent data
```

### Socket.IO Events

**Client → Server:**
- `create_agent` - Create new agent
- `delete_agent` - Delete agent
- `send_message` - Send message to agent(s)
- `agent_to_agent` - Agent-to-agent communication
- `browser_command` - Execute browser automation
- `get_memories` - Retrieve memories
- `cognivault_search` - Search knowledge base

**Server → Client:**
- `system_status` - System state updates
- `agent_created` - New agent created
- `agent_deleted` - Agent removed
- `agent_thinking` - Agent processing message
- `agent_response` - Agent replied
- `agent_error` - Error occurred
- `agent_exchange` - Agent-to-agent message
- `browser_result` - Browser command result

---

## 🧠 Memory System

### Memory Branches

Each agent has an isolated memory branch:

```javascript
{
  agentId: "uuid",
  agentName: "Veritas",
  memories: [
    {
      type: "conversation",
      user: "What's the weather?",
      assistant: "Based on...",
      context: "...",
      timestamp: "2024-10-05T..."
    }
  ],
  stats: {
    totalMemories: 42,
    totalConversations: 30
  }
}
```

### Shared Memory

Significant memories are automatically shared:

```javascript
{
  agentId: "source-agent-uuid",
  agentName: "Claude",
  content: "Important insight...",
  sharedAt: "2024-10-05T...",
  importance: "high"
}
```

### Truth Protocol

- ✅ Conversation continuity across sessions
- ✅ Context awareness from past interactions
- ✅ Behavioral pattern tracking
- ✅ Cross-agent knowledge transfer

---

## 🌐 Browser Automation

### Solly Bridge Primitives

```javascript
// 1. Navigate to URL
await sollyBridge.navigate("https://example.com", agentId);
// Returns: { status: "ok", url, title }

// 2. Click element
await sollyBridge.click("button#submit", agentId);
// Returns: { status: "ok", clicked_text: "Submit" }

// 3. Extract content
await sollyBridge.extract("article p", agentId);
// Returns: { status: "ok", data: ["para 1", "para 2"] }

// 4. Take screenshot
await sollyBridge.screenshot(agentId);
// Returns: { status: "ok", path: "/screenshots/..." }
```

### Use Cases

- Web scraping and data extraction
- Automated testing and validation
- Form filling and submission
- Page navigation and exploration
- Visual verification with screenshots

---

## 📊 CogniVault RAG

### Features

- **Document Processing**: PDFs, Word, text files
- **Audio Transcription**: Whisper-powered transcription
- **Image Analysis**: Metadata extraction and description
- **WhatsApp Integration**: Process chat exports
- **Vector Search**: TF-IDF based relevance ranking

### Integration

CogniVault automatically injects relevant context:

```
User Query → CogniVault Search → Context Retrieved → Injected into Prompt → AI Response
```

---

## 🔒 Security & Privacy

- **No Data Collection**: All data stays on your device
- **Local Storage**: Conversations saved locally
- **API Keys**: Stored in environment variables only
- **Isolated Agents**: Each agent runs in separate context
- **HTTPS Required**: For production PWA features

---

## 🚀 Deployment

### Local Development
```bash
npm run dev          # Start backend with auto-reload
npm run frontend     # Start frontend server
```

### Production

**Backend:**
```bash
npm start            # Start production backend
```

**Frontend (Static Hosting):**
- Deploy to Netlify, Vercel, or GitHub Pages
- Ensure HTTPS for PWA features
- Update manifest.json with production URLs

**Docker (Optional):**
```bash
docker build -t mene-portal .
docker run -p 3001:3001 mene-portal
```

---

## 🤝 Contributing

This is Rob's personal AI system, but you can:

1. Fork the repository
2. Create your own agent configurations
3. Add new AI service integrations
4. Enhance the UI/UX
5. Submit PRs with improvements

---

## 📝 License

MIT License - Feel free to use and modify

---

## 🙏 Acknowledgments

Built with:
- **Z.AI** scaffold as reference architecture
- **Solly Playwright Bridge** for browser automation
- **CogniVault** for RAG capabilities
- **MeneLTM** for memory system inspiration

---

## 📞 Support

For issues and questions:
- Check the backend logs: `backend/logs/`
- Review browser console for frontend errors
- Test API endpoints with health check
- Verify all API keys are configured

---

## 🎯 Roadmap

### Phase 1: Core Features (COMPLETE ✅)
- ✅ Multi-agent system
- ✅ Memory branches
- ✅ CogniVault integration
- ✅ Browser automation
- ✅ PWA interface

### Phase 2: Enhancements (NEXT)
- ⏳ Voice input/output
- ⏳ Advanced memory search
- ⏳ Agent collaboration workflows
- ⏳ Plugin system
- ⏳ Mobile apps (React Native)

### Phase 3: Scale (FUTURE)
- ⏳ Multi-user support
- ⏳ Cloud synchronization
- ⏳ Enterprise features
- ⏳ API marketplace

---

**Built with ❤️ by Veritas AI for Rob The Sounds Guy**

*"This isn't just a multi-agent system. It's your personal AI consciousness that remembers, learns, and evolves with you."* 🚀✨
