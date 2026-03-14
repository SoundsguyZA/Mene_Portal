/**
 * MCP Server Integration for Mene' Portal
 * Supports Plugged.in style MCP server configuration
 */

import { db } from '@/lib/db';

// MCP Server types matching Plugged.in format
export interface MCPServerConfig {
  description?: string;
  type: 'stdio' | 'streamable_http' | 'sse' | 'websocket';
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  url?: string;
}

export interface MCPServersConfig {
  mcpServers: Record<string, MCPServerConfig>;
}

// Default MCP servers from Plugged.in
export const DEFAULT_MCP_SERVERS: MCPServersConfig = {
  "mcpServers": {
    "Memory (FalkorDB + Qdrant)": {
      "description": "Graph-vector memory for AI assistants using FalkorDB and Qdrant",
      "type": "streamable_http"
    },
    "Intelligence Hub": {
      "description": "36 tools: intel feeds, DeFi, crypto, OSINT, NLP, scraping, proxy. x402 micropayments.",
      "type": "stdio",
      "command": "npx",
      "args": ["@apollo_ai/mcp-proxy"],
      "env": {}
    },
    "Ref Tools": {
      "description": "Token-efficient search for coding agents over public and private documentation.",
      "type": "streamable_http"
    },
    "Whois Lookup": {
      "description": "MCP Server for whois lookups.",
      "type": "stdio",
      "command": "npx",
      "args": ["@bharathvaj/whois-mcp"],
      "env": {}
    },
    "Context7": {
      "description": "Access up-to-date documentation for any library. Get API key from https://context7.com/dashboard",
      "type": "streamable_http"
    },
    "Web Search": {
      "description": "Search the web for real-time information",
      "type": "streamable_http"
    },
    "File Operations": {
      "description": "Read, write, and manage files locally",
      "type": "stdio",
      "command": "npx",
      "args": ["@modelcontextprotocol/server-filesystem", "/tmp"],
      "env": {}
    },
    "Code Executor": {
      "description": "Execute code snippets safely",
      "type": "stdio",
      "command": "npx",
      "args": ["@execute/code-mcp"],
      "env": {}
    }
  }
};

/**
 * Parse and validate MCP server config
 */
export function parseMCPServers(config: unknown): MCPServersConfig | null {
  try {
    if (!config || typeof config !== 'object') return null;
    
    const cfg = config as Record<string, unknown>;
    if (!cfg.mcpServers || typeof cfg.mcpServers !== 'object') return null;
    
    return config as MCPServersConfig;
  } catch {
    return null;
  }
}

/**
 * Get all MCP servers for a user
 */
export async function getUserMCPServers(userId: string) {
  const settings = await db.setting.findFirst({
    where: { key: `mcp_servers_${userId}` }
  });
  
  if (settings?.value) {
    return settings.value as MCPServersConfig;
  }
  
  return DEFAULT_MCP_SERVERS;
}

/**
 * Save MCP servers config for a user
 */
export async function saveMCPServers(userId: string, config: MCPServersConfig) {
  return db.setting.upsert({
    where: { key: `mcp_servers_${userId}` },
    create: {
      key: `mcp_servers_${userId}`,
      value: config as unknown as Record<string, unknown>,
      category: 'mcp'
    },
    update: {
      value: config as unknown as Record<string, unknown>
    }
  });
}

/**
 * Import MCP servers from JSON
 */
export async function importMCPServersFromJSON(
  userId: string, 
  jsonString: string
): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    const parsed = JSON.parse(jsonString);
    const config = parseMCPServers(parsed);
    
    if (!config) {
      return { success: false, count: 0, error: 'Invalid MCP server configuration format' };
    }
    
    const count = Object.keys(config.mcpServers).length;
    await saveMCPServers(userId, config);
    
    return { success: true, count };
  } catch (error) {
    return { 
      success: false, 
      count: 0, 
      error: error instanceof Error ? error.message : 'Failed to parse JSON' 
    };
  }
}

/**
 * Get MCP server connection status
 */
export function getMCPServerStatus(server: MCPServerConfig): 'online' | 'offline' | 'unknown' {
  // In production, this would check actual connection
  // For now, return 'unknown' as placeholder
  return 'unknown';
}
