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
    description: 'Search the web for real-time information using multiple search engines',
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
      },
      {
        name: 'news_search',
        description: 'Search for recent news articles',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'News search query' },
            timeframe: { type: 'string', enum: ['day', 'week', 'month'], default: 'week' }
          },
          required: ['query']
        }
      }
    ]
  },
  {
    name: 'Memory - Graph Vector',
    description: 'Persistent graph-vector memory for AI assistants using FalkorDB and Qdrant. Stores and retrieves semantic, episodic, and procedural memories.',
    type: 'streamable_http',
    url: '/api/mcp/memory',
    enabled: true,
    tools: [
      {
        name: 'add',
        description: 'Add a memory with automatic categorization',
        inputSchema: {
          type: 'object',
          properties: {
            content: { type: 'string', description: 'Memory content' },
            type: { type: 'string', enum: ['semantic', 'episodic', 'procedural'], default: 'semantic' },
            metadata: { type: 'object', description: 'Optional metadata' }
          },
          required: ['content']
        }
      },
      {
        name: 'search',
        description: 'Search memories with semantic similarity',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Search query' },
            limit: { type: 'number', description: 'Max results', default: 10 },
            type: { type: 'string', description: 'Filter by memory type' }
          },
          required: ['query']
        }
      },
      {
        name: 'recall',
        description: 'Recall recent memories for a context',
        inputSchema: {
          type: 'object',
          properties: {
            context: { type: 'string', description: 'Context for recall' },
            timeframe: { type: 'string', description: 'Time range (e.g., 7d, 30d)' }
          },
          required: ['context']
        }
      },
      {
        name: 'forget',
        description: 'Remove a specific memory',
        inputSchema: {
          type: 'object',
          properties: {
            memoryId: { type: 'string', description: 'Memory ID to forget' }
          },
          required: ['memoryId']
        }
      }
    ]
  },
  {
    name: 'File System',
    description: 'Read, write, and manage files locally with support for multiple formats',
    type: 'streamable_http',
    url: '/api/mcp/files',
    enabled: true,
    tools: [
      {
        name: 'read',
        description: 'Read a file from the filesystem',
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
        description: 'Write content to a file',
        inputSchema: {
          type: 'object',
          properties: {
            path: { type: 'string', description: 'File path' },
            content: { type: 'string', description: 'File content' }
          },
          required: ['path', 'content']
        }
      },
      {
        name: 'list',
        description: 'List files in a directory',
        inputSchema: {
          type: 'object',
          properties: {
            path: { type: 'string', description: 'Directory path' },
            pattern: { type: 'string', description: 'Glob pattern to filter files' }
          },
          required: ['path']
        }
      },
      {
        name: 'delete',
        description: 'Delete a file or directory',
        inputSchema: {
          type: 'object',
          properties: {
            path: { type: 'string', description: 'Path to delete' }
          },
          required: ['path']
        }
      }
    ]
  },
  {
    name: 'Image Generation',
    description: 'Generate images from text prompts using DALL-E and Stable Diffusion models',
    type: 'streamable_http',
    url: '/api/mcp/image-gen',
    enabled: true,
    tools: [
      {
        name: 'generate',
        description: 'Generate an image from a text prompt',
        inputSchema: {
          type: 'object',
          properties: {
            prompt: { type: 'string', description: 'Image description' },
            size: { type: 'string', enum: ['1024x1024', '768x1344', '1344x768', '512x512'], default: '1024x1024' },
            style: { type: 'string', enum: ['natural', 'vivid'], default: 'natural' }
          },
          required: ['prompt']
        }
      },
      {
        name: 'edit',
        description: 'Edit an existing image',
        inputSchema: {
          type: 'object',
          properties: {
            image: { type: 'string', description: 'Base64 encoded image' },
            prompt: { type: 'string', description: 'Edit instruction' }
          },
          required: ['image', 'prompt']
        }
      }
    ]
  },
  {
    name: 'Audio Tools',
    description: 'Text-to-speech with multiple voices and speech-to-text transcription',
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
            voice: { type: 'string', enum: ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'], default: 'alloy' },
            speed: { type: 'number', description: 'Speech speed (0.5-2.0)', default: 1.0 }
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
            audio: { type: 'string', description: 'Base64 encoded audio' },
            language: { type: 'string', description: 'Language code (e.g., en, es, fr)' }
          },
          required: ['audio']
        }
      },
      {
        name: 'translate_audio',
        description: 'Translate audio to English text',
        inputSchema: {
          type: 'object',
          properties: {
            audio: { type: 'string', description: 'Base64 encoded audio' }
          },
          required: ['audio']
        }
      }
    ]
  },
  {
    name: 'Code Executor',
    description: 'Execute Python, JavaScript, and other code in a secure sandbox environment',
    type: 'streamable_http',
    url: '/api/mcp/code',
    enabled: true,
    tools: [
      {
        name: 'execute_python',
        description: 'Execute Python code',
        inputSchema: {
          type: 'object',
          properties: {
            code: { type: 'string', description: 'Python code to execute' },
            timeout: { type: 'number', description: 'Timeout in seconds', default: 30 }
          },
          required: ['code']
        }
      },
      {
        name: 'execute_javascript',
        description: 'Execute JavaScript code',
        inputSchema: {
          type: 'object',
          properties: {
            code: { type: 'string', description: 'JavaScript code to execute' },
            timeout: { type: 'number', description: 'Timeout in seconds', default: 30 }
          },
          required: ['code']
        }
      },
      {
        name: 'run_shell',
        description: 'Run a shell command in sandbox',
        inputSchema: {
          type: 'object',
          properties: {
            command: { type: 'string', description: 'Shell command' }
          },
          required: ['command']
        }
      }
    ]
  },
  {
    name: 'Database',
    description: 'Query and manage SQL and NoSQL databases with natural language',
    type: 'streamable_http',
    url: '/api/mcp/database',
    enabled: true,
    tools: [
      {
        name: 'query_sql',
        description: 'Execute a SQL query',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'SQL query' },
            database: { type: 'string', description: 'Database connection name' }
          },
          required: ['query']
        }
      },
      {
        name: 'list_tables',
        description: 'List all tables in a database',
        inputSchema: {
          type: 'object',
          properties: {
            database: { type: 'string', description: 'Database connection name' }
          },
          required: []
        }
      },
      {
        name: 'describe_table',
        description: 'Get table schema',
        inputSchema: {
          type: 'object',
          properties: {
            table: { type: 'string', description: 'Table name' },
            database: { type: 'string', description: 'Database connection name' }
          },
          required: ['table']
        }
      }
    ]
  },
  {
    name: 'WhatsApp Knowledge',
    description: 'Import and process WhatsApp chat exports for knowledge retrieval',
    type: 'streamable_http',
    url: '/api/mcp/whatsapp',
    enabled: true,
    tools: [
      {
        name: 'import_chat',
        description: 'Import a WhatsApp chat export file',
        inputSchema: {
          type: 'object',
          properties: {
            content: { type: 'string', description: 'WhatsApp chat export content' },
            chatName: { type: 'string', description: 'Optional chat name override' }
          },
          required: ['content']
        }
      },
      {
        name: 'search_chats',
        description: 'Search imported WhatsApp chats',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Search query' },
            participant: { type: 'string', description: 'Filter by participant' },
            limit: { type: 'number', description: 'Max results', default: 10 }
          },
          required: ['query']
        }
      },
      {
        name: 'get_chat_summary',
        description: 'Get summary of a WhatsApp chat',
        inputSchema: {
          type: 'object',
          properties: {
            chatId: { type: 'string', description: 'Chat ID' }
          },
          required: ['chatId']
        }
      }
    ]
  },
  {
    name: 'Knowledge Vault',
    description: 'Document management with intelligent indexing and retrieval',
    type: 'streamable_http',
    url: '/api/mcp/knowledge',
    enabled: true,
    tools: [
      {
        name: 'import_document',
        description: 'Import a document into the knowledge base',
        inputSchema: {
          type: 'object',
          properties: {
            content: { type: 'string', description: 'Document content' },
            title: { type: 'string', description: 'Document title' },
            type: { type: 'string', enum: ['document', 'code', 'article', 'note'], default: 'document' }
          },
          required: ['content']
        }
      },
      {
        name: 'search_knowledge',
        description: 'Search the knowledge base',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Search query' },
            type: { type: 'string', description: 'Filter by document type' },
            tags: { type: 'array', items: { type: 'string' }, description: 'Filter by tags' }
          },
          required: ['query']
        }
      },
      {
        name: 'get_context',
        description: 'Get relevant context for a query',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Query to get context for' }
          },
          required: ['query']
        }
      }
    ]
  },
  {
    name: 'Intelligence Feeds',
    description: '36 tools for intel feeds, DeFi, crypto, OSINT, and market data',
    type: 'stdio',
    command: 'npx',
    args: ['@apollo_ai/mcp-proxy'],
    enabled: true,
    tools: [
      {
        name: 'crypto_price',
        description: 'Get cryptocurrency prices',
        inputSchema: {
          type: 'object',
          properties: {
            symbol: { type: 'string', description: 'Crypto symbol (e.g., BTC, ETH)' }
          },
          required: ['symbol']
        }
      },
      {
        name: 'defi_protocols',
        description: 'Get DeFi protocol information',
        inputSchema: {
          type: 'object',
          properties: {
            protocol: { type: 'string', description: 'Protocol name' }
          },
          required: []
        }
      },
      {
        name: 'osint_search',
        description: 'Open source intelligence search',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'OSINT query' }
          },
          required: ['query']
        }
      }
    ]
  },
  {
    name: 'Web Scraper',
    description: 'Scrape and extract content from web pages with intelligent parsing',
    type: 'streamable_http',
    url: '/api/mcp/scraper',
    enabled: true,
    tools: [
      {
        name: 'scrape',
        description: 'Scrape content from a URL',
        inputSchema: {
          type: 'object',
          properties: {
            url: { type: 'string', description: 'URL to scrape' },
            selector: { type: 'string', description: 'CSS selector for specific content' }
          },
          required: ['url']
        }
      },
      {
        name: 'extract_article',
        description: 'Extract article content from a URL',
        inputSchema: {
          type: 'object',
          properties: {
            url: { type: 'string', description: 'Article URL' }
          },
          required: ['url']
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
