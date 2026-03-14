import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { DEFAULT_MCP_SERVERS } from '@/lib/mcp-servers';

// GET - List all MCP servers for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'default-user';

    // Get user's custom servers from settings
    const settings = await db.setting.findUnique({
      where: { key: `mcp_servers_${userId}` }
    });

    let customServers = [];
    if (settings?.value) {
      customServers = settings.value as Array<{
        id: string;
        name: string;
        description: string;
        type: string;
        url: string;
        enabled: boolean;
        tools: Array<{ name: string; description: string }>;
      }>;
    }

    // Combine default and custom servers
    const servers = [
      ...DEFAULT_MCP_SERVERS.map((s, i) => ({
        id: `default_${i}`,
        name: s.name,
        description: s.description,
        type: s.type,
        url: s.url,
        enabled: s.enabled ?? true,
        tools: s.tools || []
      })),
      ...customServers
    ];

    return NextResponse.json({ servers });
  } catch (error) {
    console.error('Error fetching MCP servers:', error);
    return NextResponse.json({ servers: DEFAULT_MCP_SERVERS.map((s, i) => ({
      id: `default_${i}`,
      name: s.name,
      description: s.description,
      type: s.type,
      url: s.url,
      enabled: s.enabled ?? true,
      tools: s.tools || []
    })) });
  }
}

// POST - Add custom MCP server
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, name, description, type, url, command, args, env } = body;

    if (!name) {
      return NextResponse.json({ error: 'Server name is required' }, { status: 400 });
    }

    if (!type || !['stdio', 'streamable_http', 'websocket', 'http'].includes(type)) {
      return NextResponse.json({ error: 'Valid server type is required' }, { status: 400 });
    }

    // Get existing servers
    const existingSettings = await db.setting.findUnique({
      where: { key: `mcp_servers_${userId}` }
    });

    const existingServers = (existingSettings?.value as Array<Record<string, unknown>>) || [];

    // Create new server
    const newServer = {
      id: `custom_${Date.now()}`,
      name,
      description,
      type,
      url,
      command,
      args,
      env,
      enabled: true,
      tools: []
    };

    // Save to settings
    await db.setting.upsert({
      where: { key: `mcp_servers_${userId}` },
      create: {
        key: `mcp_servers_${userId}`,
        value: [...existingServers, newServer],
        category: 'mcp'
      },
      update: {
        value: [...existingServers, newServer]
      }
    });

    return NextResponse.json({ success: true, server: newServer });
  } catch (error) {
    console.error('Error adding MCP server:', error);
    return NextResponse.json({ error: 'Failed to add MCP server' }, { status: 500 });
  }
}

// PUT - Update MCP server
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, serverId, enabled } = body;

    const settings = await db.setting.findUnique({
      where: { key: `mcp_servers_${userId}` }
    });

    if (!settings?.value) {
      return NextResponse.json({ error: 'No servers found' }, { status: 404 });
    }

    const servers = settings.value as Array<Record<string, unknown> & { id: string }>;
    const updatedServers = servers.map(s => 
      s.id === serverId ? { ...s, enabled } : s
    );

    await db.setting.update({
      where: { key: `mcp_servers_${userId}` },
      data: { value: updatedServers }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating MCP server:', error);
    return NextResponse.json({ error: 'Failed to update MCP server' }, { status: 500 });
  }
}

// DELETE - Remove MCP server
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const serverId = searchParams.get('serverId');

    if (!userId || !serverId) {
      return NextResponse.json({ error: 'User ID and Server ID required' }, { status: 400 });
    }

    const settings = await db.setting.findUnique({
      where: { key: `mcp_servers_${userId}` }
    });

    if (!settings?.value) {
      return NextResponse.json({ error: 'No servers found' }, { status: 404 });
    }

    const servers = settings.value as Array<Record<string, unknown> & { id: string }>;
    const filteredServers = servers.filter(s => s.id !== serverId);

    await db.setting.update({
      where: { key: `mcp_servers_${userId}` },
      data: { value: filteredServers }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting MCP server:', error);
    return NextResponse.json({ error: 'Failed to delete MCP server' }, { status: 500 });
  }
}
