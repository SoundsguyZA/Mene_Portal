# 🪟 MENE PORTAL - WINDOWS SETUP GUIDE

## 🎯 **CURRENT SITUATION:**

- ✅ Code is on GitHub: `https://github.com/SoundsguyZA/Mene_Portal`
- ✅ Latest code is on `main` branch (just merged everything)
- ✅ You cloned to: `F:\Github Repos\Mene_Portal\Mene_Portal`
- ❌ Your local copy is outdated

---

## 🚀 **COMPLETE SETUP (Copy/Paste These Commands):**

### **Step 1: Update Your Local Copy**

Open PowerShell and run:

```powershell
# Navigate to your project
cd "F:\Github Repos\Mene_Portal\Mene_Portal"

# Fetch all branches
git fetch origin

# Switch to main branch
git checkout main

# Pull latest code (all the new features I built)
git pull origin main

# Install/update dependencies
npm install

# Install Playwright browsers
npx playwright install chromium
```

---

### **Step 2: Start the Backend**

In PowerShell window #1:

```powershell
cd "F:\Github Repos\Mene_Portal\Mene_Portal"
npm start
```

**You should see:**
```
🚀 Initializing MENE Portal Unified Backend...
🧠 Memory System ready
📚 CogniVault ready
🌐 Solly Bridge ready
✅ Server running on http://localhost:3001
```

**Ignore these warnings (they're harmless):**
- `⚠️ AI Drive not accessible, using local memory only` ← Normal on Windows
- `⚠️ Could not save truth database` ← Normal, uses local storage instead

---

### **Step 3: Start the Frontend**

In PowerShell window #2:

```powershell
cd "F:\Github Repos\Mene_Portal\Mene_Portal"
npm run frontend
```

**Alternative if that fails:**
```powershell
python -m http.server 3000
```

**Or:**
```powershell
py -m http.server 3000
```

**You should see:**
```
Serving HTTP on :: port 3000 ...
```

---

### **Step 4: Open in Browser**

Navigate to:
```
http://localhost:3000
```

---

## 🎨 **CREATE YOUR FIRST BROWSER AGENT:**

### **In the Mene Portal interface:**

1. Click **"+ New Agent"**

2. Fill in:
   - **Name:** `GenSpark Full`
   - **Service:** Select `genspark` from dropdown
   - **Personality:** (optional) `You are a helpful research assistant`

3. **Advanced Config (optional):**
   - Click "Advanced Settings"
   - Set `headless: false` to SEE the browser window
   - Or leave default (`headless: true`) for background mode

4. Click **"Create Agent"**

5. **What happens:**
   - ✅ Playwright launches Chrome browser
   - ✅ Opens https://www.genspark.ai/chat
   - ✅ Loads FULL GenSpark interface
   - ✅ Ready to receive messages!

---

## 💬 **START CHATTING:**

1. **Select your agent** from the sidebar

2. **Type a message:**
   ```
   "What are the latest developments in AI?"
   ```

3. **Watch the magic:**
   - Agent sends message to GenSpark web interface
   - GenSpark processes with ALL its tools
   - Response comes back to Mene Portal
   - **NO API KEY NEEDED!**

---

## 🔥 **CREATE MORE AGENTS:**

### **ChatGPT Agent (with all plugins):**
- Name: `ChatGPT Plus`
- Service: `chatgpt`
- URL: Opens https://chat.openai.com

### **Claude Agent:**
- Name: `Claude Sonnet`
- Service: `claude`
- URL: Opens https://claude.ai/new

### **Suno Music Agent:**
- Name: `Suno Studio`
- Service: `suno`
- URL: Opens https://suno.com

### **Custom Agent (any web app!):**
- Name: `My Custom App`
- Service: `https://your-app.com`
- URL: Opens any URL you want

---

## 🎯 **MULTI-AGENT QUERIES:**

### **Broadcast Mode:**

1. Create 3 agents (GenSpark, ChatGPT, Claude)
2. Check **"Broadcast to all agents"**
3. Send one question
4. Get 3 different expert responses!

**Example:**
```
Question: "What's the best way to learn React?"

GenSpark: [Uses its research tools + synthesis]
ChatGPT: [Uses plugins + GPTs + code interpreter]
Claude: [Deep analysis + examples]
```

---

## 🔧 **TROUBLESHOOTING:**

### **Issue: "npm: command not found"**
**Fix:** Install Node.js from https://nodejs.org/

### **Issue: "python: command not found"**
**Fix:** 
```powershell
# Try python3
python3 -m http.server 3000

# Or py
py -m http.server 3000

# Or install http-server
npm install -g http-server
http-server -p 3000
```

### **Issue: Port already in use**
**Fix:**
```powershell
# Find what's using port 3000
netstat -ano | findstr :3000

# Kill the process (replace PID with the number you found)
taskkill /PID <PID> /F

# Or use different port
python -m http.server 8080
# Then open http://localhost:8080
```

### **Issue: AI Drive warnings**
**Fix:** Ignore them! They're harmless. System uses local storage instead.

### **Issue: Playwright errors**
**Fix:**
```powershell
# Reinstall Playwright browsers
npx playwright install chromium --force
```

### **Issue: Can't see browser window**
**Fix:** When creating agent, set config:
```json
{
  "headless": false
}
```

---

## 📊 **WHAT YOU'RE RUNNING:**

### **Backend (Port 3001):**
- ✅ Node.js server with Express
- ✅ Socket.IO for real-time updates
- ✅ Agent coordinator
- ✅ Memory system (saves to local files)
- ✅ Playwright browser automation

### **Frontend (Port 3000):**
- ✅ Progressive Web App
- ✅ Vanilla JavaScript (no framework)
- ✅ Web Workers for agent isolation
- ✅ Service Worker for offline capability

---

## 🎨 **BROWSER MODE vs API MODE:**

### **Browser Mode (DEFAULT - NO KEYS):**
```
Agent → Playwright → Full Web App
        ↓
    Zero cost
    All features (plugins, tools, UI)
```

### **API Mode (OPTIONAL - IF YOU HAVE KEYS):**
```
Agent → Direct API → Limited to API features
        ↓
    Costs money
    Faster responses
    No UI features
```

**You can use BOTH!**
- Some agents in browser mode (free)
- Some agents in API mode (fast)

---

## 📁 **PROJECT STRUCTURE:**

```
Mene_Portal/
├── backend/
│   ├── agents/
│   │   ├── agent-coordinator.js
│   │   └── browser-agent.js  ← Browser automation
│   ├── memory/
│   │   └── memory-system.js  ← Memory branches
│   ├── cognivault/
│   │   └── cognivault-bridge.js  ← RAG
│   └── server.js  ← Main backend
├── js/
│   ├── app.js  ← Frontend logic
│   └── workers/  ← Web Workers
├── css/
│   └── styles.css
├── index.html  ← PWA interface
├── package.json
└── STARTUP_GUIDE.md  ← Detailed guide
```

---

## 🚀 **WHAT YOU CAN BUILD:**

### **1. Multi-AI Research Team**
- 5 different AI services
- Compare responses
- Synthesize best answer
- **Zero API costs**

### **2. Creative Studio**
- Suno for music
- ChatGPT for lyrics
- ElevenLabs for voice
- All coordinated

### **3. Personal AI Army**
- Specialists for different tasks
- Memory continuity
- Context sharing
- Coordinated workflows

### **4. Web Automation**
- Control ANY web app
- Automate workflows
- Extract data
- Generate content

---

## 💡 **KEY FEATURES:**

✅ **No API Keys Required** (browser mode)  
✅ **Full Web Apps** (not just API wrappers)  
✅ **ALL Features** (plugins, tools, UI)  
✅ **Memory System** (conversation continuity)  
✅ **Multi-Agent** (run multiple services)  
✅ **Offline PWA** (installable app)  
✅ **Zero Cost** (no API usage)  

---

## 📞 **IF YOU NEED HELP:**

1. **Check logs:**
   - Backend: PowerShell window #1 output
   - Frontend: PowerShell window #2 output
   - Browser: Open DevTools (F12)

2. **Read guides:**
   - `STARTUP_GUIDE.md` - Detailed setup
   - `README_UNIFIED.md` - Complete docs

3. **Test endpoints:**
   ```powershell
   # Check backend health
   curl http://localhost:3001/api/health
   
   # List agents
   curl http://localhost:3001/api/agents
   ```

---

## ✅ **QUICK CHECKLIST:**

Before you start:
- [ ] Node.js installed (check: `node --version`)
- [ ] Git installed (check: `git --version`)
- [ ] Cloned repository
- [ ] Ran `git pull origin main`
- [ ] Ran `npm install`
- [ ] Ran `npx playwright install chromium`

To run:
- [ ] Terminal 1: `npm start` (backend)
- [ ] Terminal 2: `npm run frontend` (frontend)
- [ ] Browser: `http://localhost:3000`

---

## 🎯 **REMEMBER:**

This is **NOT** about API integrations anymore.

This is about running **FULL WEB APPLICATIONS** inside Mene Portal.

GenSpark with all tools.  
ChatGPT with all plugins.  
Any web app you want.  

All controlled through one interface.  
All with memory and coordination.  
**All without API costs.**

---

**Built by Veritas AI for Rob The Sounds Guy** 🎯

**Let's fucking go! 🚀**
