/**
 * MCP Server Integration for Mene' Portal
 * Model Context Protocol - Plugin/Service Wrapper System
 * Based on Plugged.in architecture
 */

// MCP Server Types
export interface MCPServer {
  name: string;
  description?: string;
  type: 'stdio' | 'streamable_http' | 'websocket' | 'http';
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  url?: string;
  headers?: Record<string, string>;
  enabled?: boolean;
  tools?: MCPTool[];
}

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, {
      type: string;
      description?: string;
      enum?: string[];
      default?: unknown;
    }>;
    required?: string[];
  };
}

export interface MCPToolCall {
  serverName: string;
  toolName: string;
  arguments: Record<string, unknown>;
}

export interface MCPToolResult {
  success: boolean;
  result?: unknown;
  error?: string;
}

// Default MCP Servers (from Plugged.in style)
export const DEFAULT_MCP_SERVERS: MCPServer[] = [
  {
    name: 'Web Search',
    description: 'Search the web for real-time information',
    type: 'streamable_http',
    url: '/api/mcp/web-search',
    enabled: true,
    tools: [
      {
        name: 'search',
        description: 'Search the web for information',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Search query' },
            num: { type: 'number', description: 'Number of results', default: 10 }
          },
          required: ['query']
        }
      }
    ]
  },
  {
    name: 'Memory',
    description: 'Graph-vector memory using local storage',
    type: 'streamable_http',
    url: '/api/mcp/memory',
    enabled: true,
    tools: [
      {
        name: 'add',
        description: 'Add a memory',
        inputSchema: {
          type: 'object',
          properties: {
            content: { type: 'string', description: 'Memory content' },
            metadata: { type: 'object', description: 'Optional metadata' }
          },
          required: ['content']
        }
      },
      {
        name: 'search',
        description: 'Search memories',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Search query' },
            limit: { type: 'number', description: 'Max results', default: 10 }
          },
          required: ['query']
        }
      }
    ]
  },
  {
    name: 'File System',
    description: 'Read and write files locally',
    type: 'streamable_http',
    url: '/api/mcp/files',
    enabled: true,
    tools: [
      {
        name: 'read',
        description: 'Read a file',
        inputSchema: {
          type: 'object',
          properties: {
            path: { type: 'string', description: 'File path' }
          },
          required: ['path']
        }
      },
      {
        name: 'write',
        description: 'Write a file',
        inputSchema: {
          type: 'object',
          properties: {
            path: { type: 'string', description: 'File path' },
            content: { type: 'string', description: 'File content' }
          },
          required: ['path', 'content']
        }
      }
    ]
  },
  {
    name: 'Image Generation',
    description: 'Generate images from text prompts',
    type: 'streamable_http',
    url: '/api/mcp/image-gen',
    enabled: true,
    tools: [
      {
        name: 'generate',
        description: 'Generate an image',
        inputSchema: {
          type: 'object',
          properties: {
            prompt: { type: 'string', description: 'Image description' },
            size: { type: 'string', enum: ['1024x1024', '768x1344', '1344x768'], default: '1024x1024' }
          },
          required: ['prompt']
        }
      }
    ]
  },
  {
    name: 'Audio Tools',
    description: 'Text-to-speech and speech-to-text',
    type: 'streamable_http',
    url: '/api/mcp/audio',
    enabled: true,
    tools: [
      {
        name: 'tts',
        description: 'Convert text to speech',
        inputSchema: {
          type: 'object',
          properties: {
            text: { type: 'string', description: 'Text to speak' },
            voice: { type: 'string', description: 'Voice ID', default: 'alloy' }
          },
          required: ['text']
        }
      },
      {
        name: 'transcribe',
        description: 'Transcribe audio to text',
        inputSchema: {
          type: 'object',
          properties: {
            audio: { type: 'string', description: 'Base64 encoded audio' }
          },
          required: ['audio']
        }
      }
    ]
  }
];

// MCP Server Configuration (Plugged.in style JSON)
export interface MCPConfig {
  mcpServers: Record<string, MCPServerConfig>;
}

export interface MCPServerConfig {
  description?: string;
  type: 'stdio' | 'streamable_http' | 'websocket' | 'http';
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  url?: string;
  headers?: Record<string, string>;
}

/**
 * Parse MCP configuration from Plugged.in style JSON
 */
export function parseMCPConfig(json: string): MCPServer[] {
  try {
    const config = JSON.parse(json) as MCPConfig;
    const servers: MCPServer[] = [];
    
    for (const [name, serverConfig] of Object.entries(config.mcpServers || {})) {
      servers.push({
        name,
        description: serverConfig.description,
        type: serverConfig.type,
        command: serverConfig.command,
        args: serverConfig.args,
        env: serverConfig.env,
        url: serverConfig.url,
        headers: serverConfig.headers,
        enabled: true
      });
    }
    
    return servers;
  } catch {
    return [];
  }
}

/**
 * Export servers to Plugged.in style JSON
 */
export function exportMCPConfig(servers: MCPServer[]): string {
  const config: MCPConfig = {
    mcpServers: {}
  };
  
  for (const server of servers) {
    config.mcpServers[server.name] = {
      description: server.description,
      type: server.type,
      command: server.command,
      args: server.args,
      env: server.env,
      url: server.url,
      headers: server.headers
    };
  }
  
  return JSON.stringify(config, null, 2);
}

/**
 * Validate MCP server configuration
 */
export function validateMCPServer(server: Partial<MCPServer>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (!server.name || server.name.trim() === '') {
    errors.push('Server name is required');
  }
  
  if (!server.type) {
    errors.push('Server type is required');
  }
  
  if (server.type === 'stdio' && !server.command) {
    errors.push('stdio type requires a command');
  }
  
  if ((server.type === 'streamable_http' || server.type === 'websocket' || server.type === 'http') && !server.url) {
    errors.push(`${server.type} type requires a URL`);
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Get available tools from all enabled servers
 */
export function getAvailableTools(servers: MCPServer[]): MCPTool[] {
  const tools: MCPTool[] = [];
  
  for (const server of servers) {
    if (server.enabled && server.tools) {
      for (const tool of server.tools) {
        tools.push({
          ...tool,
          name: `${server.name.toLowerCase().replace(/\s+/g, '_')}_${tool.name}`
        });
      }
    }
  }
  
  return tools;
}

/**
 * Format tool for LLM function calling
 */
export function formatToolForLLM(tool: MCPTool): {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: MCPTool['inputSchema'];
  };
} {
  return {
    type: 'function',
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.inputSchema
    }
  };
}

/**
 * Create MCP server wrapper for API route
 */
export function createMCPEndpoint(server: MCPServer): {
  path: string;
  handler: () => Promise<Response>;
} {
  const path = `/api/mcp/${server.name.toLowerCase().replace(/\s+/g, '-')}`;
  
  return {
    path,
    handler: async () => {
      // This would be implemented by each MCP server
      return new Response(JSON.stringify({ 
        server: server.name,
        tools: server.tools 
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
  };
}
