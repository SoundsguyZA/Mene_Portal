import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { DEFAULT_MCP_SERVERS } from '@/lib/mcp-servers';

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
    
    // Get user's configured MCP servers
    const userServers = await db.mcpServer.findMany({
      where: { userId, isEnabled: true },
      orderBy: { createdAt: 'desc' }
    });
    
    return NextResponse.json({
      services: userServers,
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
    return NextResponse.json({ 
      services: [],
      mcpServers: DEFAULT_MCP_SERVERS,
      categories: ['search', 'memory', 'files', 'images', 'audio', 'code', 'database', 'custom']
    });
  }
}

// POST - Add a new MCP server
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      userId, 
      name,
      description,
      type,
      url,
      command,
      args,
      env,
      tools
    } = body;
    
    if (!name) {
      return NextResponse.json({ error: 'Server name is required' }, { status: 400 });
    }
    
    // Ensure user exists
    let user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
      user = await db.user.create({
        data: { id: userId, email: `${userId}@meneportal.ai`, name: 'User' }
      });
    }
    
    // Create MCP server
    const server = await db.mcpServer.create({
      data: {
        userId,
        name,
        description: description || '',
        type: type || 'streamable_http',
        url: url || null,
        command: command || null,
        args: args || null,
        env: env || null,
        tools: tools || null,
        isEnabled: true
      }
    });
    
    return NextResponse.json({ service: server, type: 'mcp' });
  } catch (error) {
    console.error('Error creating service:', error);
    return NextResponse.json({ error: 'Failed to create service' }, { status: 500 });
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
    
    await db.mcpServer.delete({ where: { id } });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting service:', error);
    return NextResponse.json({ error: 'Failed to delete service' }, { status: 500 });
  }
}
