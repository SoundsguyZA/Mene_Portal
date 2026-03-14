# Mene' Portal - Ultimate AI Chat/Tool/Multi-Agent Platform

## Summary of Changes

### ✅ Renamed to Mene' Portal
- All branding updated to preserve your original project name

### ✅ Blank Slate Approach
- NO default agents are created
- Users start with an empty agent list
- Must import or create their own agents

### ✅ Agent Import System
- **TavernAI JSON format** - Full support
- **Character.AI format** - Supported
- **Custom JSON** - Just needs `name` + `system_prompt`
- **Manual creation** - Via dialog form

### ✅ MCP Plugin System (Plugged.in Style)
```json
{
  "mcpServers": {
    "Web Search": {
      "description": "Search the web",
      "type": "streamable_http",
      "url": "/api/mcp/web-search"
    },
    "Memory": {
      "description": "Graph-vector memory",
      "type": "stdio",
      "command": "npx",
      "args": ["@some/memory-server"]
    },
    "Custom Tool": {
      "type": "streamable_http",
      "url": "..."
    }
  }
}
```

### ✅ AI Services (BYOA)
- Services open in new tabs (external links)
- Pre-configured: ChatGPT, Claude, Gemini, Z.ai, Perplexity, Grok, etc.
- Users can add custom services
- Clean, simple approach

## How to Use

### Import an Agent
1. Click "Import Agent" button
2. Paste JSON (TavernAI, Character.AI, or custom format)
3. Agent appears in your list

### Create an Agent
1. Click "Create Agent" button
2. Enter name and system prompt (required)
3. Optionally add description, first message, color
4. Agent is created

### Chat with Agent
1. Click on any agent to select it
2. Type message and press Enter
3. Agent responds using LLM

### Use AI Services
1. Click any service icon
2. Opens in new browser tab
3. Direct access to external AI tools

## Key Files

- `/src/app/page.tsx` - Main UI (all buttons work)
- `/src/lib/agent-import.ts` - Import logic for TavernAI/Character.AI
- `/src/lib/mcp-servers.ts` - MCP plugin configuration
- `/src/app/api/agents/route.ts` - Agent CRUD API
- `/src/app/api/agents/import/route.ts` - Import API
- `/src/app/api/mcp/route.ts` - MCP server management
- `/src/app/api/chat/route.ts` - Chat with agents

## Status
- ✅ Renamed to Mene' Portal
- ✅ Blank slate (no default agents)
- ✅ Import system working
- ✅ MCP plugin structure defined
- ✅ All buttons functional
