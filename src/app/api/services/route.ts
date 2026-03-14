import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// MCP Server configuration (Plugged.in style)
interface MCPServerConfig {
  name: string;
  description?: string;
  type: 'stdio' | 'streamable_http' | 'sse';
  command?: string;
  args?: string[];
  url?: string;
  env?: Record<string, string>;
  tools?: string[];
  isActive?: boolean;
}

// Pre-configured MCP servers (like Plugged.in)
export const DEFAULT_MCP_SERVERS: MCPServerConfig[] = [
  {
    name: 'Web Search',
    description: 'Search the web for real-time information',
    type: 'streamable_http',
    url: 'https://api.z.ai/v1/search',
    tools: ['web_search', 'news_search']
  },
  {
    name: 'Memory',
    description: 'Persistent memory for agents using local vector store',
    type: 'stdio',
    command: 'npx',
    args: ['@mem0/mcp-server'],
    tools: ['memory_add', 'memory_search', 'memory_get']
  },
  {
    name: 'File System',
    description: 'Read and write files locally',
    type: 'stdio',
    command: 'npx',
    args: ['@modelcontextprotocol/server-filesystem'],
    tools: ['read_file', 'write_file', 'list_directory']
  },
  {
    name: 'Image Generation',
    description: 'Generate images from text descriptions',
    type: 'streamable_http',
    url: 'https://api.z.ai/v1/images',
    tools: ['generate_image']
  },
  {
    name: 'Audio Tools',
    description: 'Text-to-speech and speech-to-text',
    type: 'streamable_http',
    url: 'https://api.z.ai/v1/audio',
    tools: ['text_to_speech', 'speech_to_text']
  },
  {
    name: 'Code Executor',
    description: 'Execute code safely in sandbox',
    type: 'stdio',
    command: 'npx',
    args: ['@mcp/code-executor'],
    tools: ['execute_python', 'execute_javascript']
  },
  {
    name: 'Database',
    description: 'Query and manage databases',
    type: 'stdio',
    command: 'npx',
    args: ['@mcp/database'],
    tools: ['query_sql', 'list_tables']
  }
];

// GET - List all MCP servers and services
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'default-user';
    
    // Ensure user exists
    let user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
      user = await db.user.create({
        data: { id: userId, email: `${userId}@meneportal.ai`, name: 'User' }
      });
    }
    
    // Get user's configured services
    const userServices = await db.service.findMany({
      where: { userId, isEnabled: true },
      orderBy: { sortOrder: 'asc' }
    });
    
    return NextResponse.json({
      services: userServices,
      mcpServers: DEFAULT_MCP_SERVERS,
      categories: ['search', 'memory', 'files', 'images', 'audio', 'code', 'database', 'custom'],
      importFormats: ['mcp-json', 'pluggedin-config', 'custom'],
      schema: {
        mcpServers: {
          "Example Server": {
            description: "Description of what this server does",
            type: "stdio | streamable_http | sse",
            command: "npx",
            args: ["package-name"],
            env: { "API_KEY": "your-key" }
          }
        }
      }
    });
  } catch (error) {
    console.error('Error fetching services:', error);
    return NextResponse.json({ error: 'Failed to fetch services' }, { status: 500 });
  }
}

// POST - Add a new MCP server or service
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      userId, 
      type, // 'mcp' or 'web'
      config 
    } = body;
    
    // Ensure user exists
    let user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
      user = await db.user.create({
        data: { id: userId, email: `${userId}@meneportal.ai`, name: 'User' }
      });
    }
    
    if (type === 'mcp') {
      // Store MCP server configuration
      const service = await db.service.create({
        data: {
          userId,
          name: config.name,
          url: config.url || '',
          category: 'mcp',
          description: config.description,
          icon: getIconForCategory(config.name),
          color: generateColor(),
          config: {
            type: config.type,
            command: config.command,
            args: config.args,
            env: config.env,
            tools: config.tools
          },
          isEnabled: true
        }
      });
      
      return NextResponse.json({ service, type: 'mcp' });
    } else {
      // Store web service
      const service = await db.service.create({
        data: {
          userId,
          name: config.name,
          url: config.url,
          category: config.category || 'custom',
          description: config.description,
          icon: config.icon || '🔗',
          color: config.color || generateColor(),
          config: config.config || {},
          isEnabled: true
        }
      });
      
      return NextResponse.json({ service, type: 'web' });
    }
  } catch (error) {
    console.error('Error creating service:', error);
    return NextResponse.json({ error: 'Failed to create service' }, { status: 500 });
  }
}

// PUT - Update a service
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...data } = body;
    
    const service = await db.service.update({
      where: { id },
      data
    });
    
    return NextResponse.json({ service });
  } catch (error) {
    console.error('Error updating service:', error);
    return NextResponse.json({ error: 'Failed to update service' }, { status: 500 });
  }
}

// DELETE - Delete a service
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Service ID required' }, { status: 400 });
    }
    
    await db.service.delete({ where: { id } });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting service:', error);
    return NextResponse.json({ error: 'Failed to delete service' }, { status: 500 });
  }
}

// Helper: Get icon for MCP category
function getIconForCategory(name: string): string {
  const iconMap: Record<string, string> = {
    'search': '🔍',
    'memory': '🧠',
    'file': '📁',
    'image': '🖼️',
    'audio': '🎤',
    'code': '💻',
    'database': '🗄️',
    'web': '🌐',
    'api': '🔌'
  };
  
  const lower = name.toLowerCase();
  for (const [key, icon] of Object.entries(iconMap)) {
    if (lower.includes(key)) return icon;
  }
  return '🔌';
}

// Helper: Generate color
function generateColor(): string {
  const colors = ['#8B5CF6', '#10B981', '#F59E0B', '#3B82F6', '#EC4899', '#14B8A6', '#6366F1', '#EF4444'];
  return colors[Math.floor(Math.random() * colors.length)];
}
