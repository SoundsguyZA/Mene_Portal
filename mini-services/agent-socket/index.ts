/**
 * Mene' Portal - Agent WebSocket Service
 * Real-time communication for multi-agent collaboration
 */

import { createServer } from 'http'
import { Server } from 'socket.io'

const httpServer = createServer()
const io = new Server(httpServer, {
  path: '/',
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  },
  pingTimeout: 60000,
  pingInterval: 25000,
})

// Types
interface Agent {
  id: string
  name: string
  avatar?: string
  color?: string
}

interface User {
  id: string
  socketId: string
  agents: Map<string, Agent>
}

interface AgentMessage {
  id: string
  fromAgentId: string
  fromAgentName: string
  toAgentId?: string
  toAgentName?: string
  content: string
  type: 'direct' | 'broadcast' | 'discussion' | 'system'
  conversationId?: string
  timestamp: Date
  metadata?: Record<string, unknown>
}

interface Discussion {
  id: string
  title: string
  topic: string
  participants: Agent[]
  messages: AgentMessage[]
  status: 'active' | 'paused' | 'completed'
  createdAt: Date
}

// State
const users = new Map<string, User>()
const discussions = new Map<string, Discussion>()
const agentToUser = new Map<string, string>() // agentId -> userId mapping
const agentToSocket = new Map<string, string>() // agentId -> socketId mapping

const generateId = () => Math.random().toString(36).substr(2, 9)

// Create system message
const createSystemMessage = (content: string): AgentMessage => ({
  id: generateId(),
  fromAgentId: 'system',
  fromAgentName: 'System',
  content,
  type: 'system',
  timestamp: new Date()
})

// Create agent message
const createAgentMessage = (
  fromAgent: Agent,
  content: string,
  type: AgentMessage['type'] = 'broadcast',
  toAgent?: Agent
): AgentMessage => ({
  id: generateId(),
  fromAgentId: fromAgent.id,
  fromAgentName: fromAgent.name,
  toAgentId: toAgent?.id,
  toAgentName: toAgent?.name,
  content,
  type,
  timestamp: new Date()
})

io.on('connection', (socket) => {
  console.log(`[Mene' Portal] Client connected: ${socket.id}`)

  // User joins with their agents
  socket.on('user:join', (data: { userId: string; agents: Agent[] }) => {
    const { userId, agents } = data
    
    // Store user info
    const user: User = {
      id: userId,
      socketId: socket.id,
      agents: new Map(agents.map(a => [a.id, a]))
    }
    users.set(socket.id, user)
    
    // Map agents to user and socket
    agents.forEach(agent => {
      agentToUser.set(agent.id, userId)
      agentToSocket.set(agent.id, socket.id)
    })
    
    // Notify others about new agents available
    socket.broadcast.emit('agents:available', { 
      userId, 
      agents,
      timestamp: new Date().toISOString()
    })
    
    // Send current online agents to the user
    const onlineAgents = Array.from(users.values())
      .filter(u => u.id !== userId)
      .flatMap(u => Array.from(u.agents.values()))
    
    socket.emit('agents:online', { agents: onlineAgents })
    
    console.log(`[Mene' Portal] User ${userId} joined with ${agents.length} agents`)
  })

  // Agent sends a message
  socket.on('agent:message', (data: { 
    fromAgentId: string
    toAgentId?: string
    content: string
    conversationId?: string
    metadata?: Record<string, unknown>
  }) => {
    const { fromAgentId, toAgentId, content, conversationId, metadata } = data
    const user = users.get(socket.id)
    
    if (!user) return
    
    const fromAgent = user.agents.get(fromAgentId)
    if (!fromAgent) return
    
    let message: AgentMessage
    
    if (toAgentId) {
      // Direct message to another agent
      const targetSocketId = agentToSocket.get(toAgentId)
      const targetUser = targetSocketId ? users.get(targetSocketId) : null
      const toAgent = targetUser?.agents.get(toAgentId)
      
      message = createAgentMessage(fromAgent, content, 'direct', toAgent)
      
      if (targetSocketId && targetSocketId !== socket.id) {
        io.to(targetSocketId).emit('agent:message', message)
      }
    } else {
      // Broadcast to all agents
      message = createAgentMessage(fromAgent, content, 'broadcast')
      socket.broadcast.emit('agent:message', message)
    }
    
    // Also emit back to sender for confirmation
    socket.emit('agent:message:sent', message)
    
    console.log(`[Mene' Portal] Agent ${fromAgent.name} sent ${message.type} message`)
  })

  // Start a multi-agent discussion
  socket.on('discussion:start', (data: {
    title: string
    topic: string
    participantIds: string[]
  }) => {
    const { title, topic, participantIds } = data
    const user = users.get(socket.id)
    
    if (!user) return
    
    // Get participant agents
    const participants: Agent[] = []
    participantIds.forEach(agentId => {
      const socketId = agentToSocket.get(agentId)
      const agentUser = socketId ? users.get(socketId) : null
      const agent = agentUser?.agents.get(agentId)
      if (agent) participants.push(agent)
    })
    
    // Create discussion
    const discussion: Discussion = {
      id: generateId(),
      title,
      topic,
      participants,
      messages: [],
      status: 'active',
      createdAt: new Date()
    }
    
    discussions.set(discussion.id, discussion)
    
    // Notify all participants
    participantIds.forEach(agentId => {
      const targetSocketId = agentToSocket.get(agentId)
      if (targetSocketId) {
        io.to(targetSocketId).emit('discussion:started', {
          discussion,
          initiator: user.id
        })
      }
    })
    
    console.log(`[Mene' Portal] Discussion "${title}" started with ${participants.length} participants`)
  })

  // Agent contributes to discussion
  socket.on('discussion:contribute', (data: {
    discussionId: string
    agentId: string
    content: string
  }) => {
    const { discussionId, agentId, content } = data
    const user = users.get(socket.id)
    const discussion = discussions.get(discussionId)
    
    if (!user || !discussion) return
    
    const agent = user.agents.get(agentId)
    if (!agent) return
    
    const message = createAgentMessage(agent, content, 'discussion')
    message.conversationId = discussionId
    
    discussion.messages.push(message)
    
    // Broadcast to all participants
    discussion.participants.forEach(p => {
      const targetSocketId = agentToSocket.get(p.id)
      if (targetSocketId) {
        io.to(targetSocketId).emit('discussion:message', {
          discussionId,
          message
        })
      }
    })
    
    console.log(`[Mene' Portal] Agent ${agent.name} contributed to discussion "${discussion.title}"`)
  })

  // End discussion
  socket.on('discussion:end', (data: { discussionId: string }) => {
    const { discussionId } = data
    const discussion = discussions.get(discussionId)
    
    if (!discussion) return
    
    discussion.status = 'completed'
    
    // Notify all participants
    discussion.participants.forEach(p => {
      const targetSocketId = agentToSocket.get(p.id)
      if (targetSocketId) {
        io.to(targetSocketId).emit('discussion:ended', {
          discussionId,
          summary: {
            title: discussion.title,
            messageCount: discussion.messages.length,
            participants: discussion.participants.map(p => p.name)
          }
        })
      }
    })
    
    console.log(`[Mene' Portal] Discussion "${discussion.title}" ended`)
  })

  // Agent typing indicator
  socket.on('agent:typing', (data: { agentId: string; isTyping: boolean }) => {
    const { agentId, isTyping } = data
    const user = users.get(socket.id)
    
    if (!user) return
    
    const agent = user.agents.get(agentId)
    if (!agent) return
    
    socket.broadcast.emit('agent:typing', {
      agentId,
      agentName: agent.name,
      isTyping,
      timestamp: new Date().toISOString()
    })
  })

  // Request collaboration between agents
  socket.on('agent:request-collaboration', (data: {
    fromAgentId: string
    toAgentId: string
    task: string
    context?: Record<string, unknown>
  }) => {
    const { fromAgentId, toAgentId, task, context } = data
    const user = users.get(socket.id)
    
    if (!user) return
    
    const fromAgent = user.agents.get(fromAgentId)
    if (!fromAgent) return
    
    const targetSocketId = agentToSocket.get(toAgentId)
    
    if (targetSocketId) {
      io.to(targetSocketId).emit('agent:collaboration-request', {
        fromAgent,
        toAgentId,
        task,
        context,
        timestamp: new Date().toISOString()
      })
      
      console.log(`[Mene' Portal] Collaboration request from ${fromAgent.name} to agent ${toAgentId}`)
    }
  })

  // Accept/decline collaboration
  socket.on('agent:collaboration-response', (data: {
    fromAgentId: string
    toAgentId: string
    accepted: boolean
    message?: string
  }) => {
    const { fromAgentId, toAgentId, accepted, message } = data
    const user = users.get(socket.id)
    
    if (!user) return
    
    const respondingAgent = user.agents.get(fromAgentId)
    if (!respondingAgent) return
    
    const targetSocketId = agentToSocket.get(toAgentId)
    
    if (targetSocketId) {
      io.to(targetSocketId).emit('agent:collaboration-result', {
        fromAgent: respondingAgent,
        toAgentId,
        accepted,
        message,
        timestamp: new Date().toISOString()
      })
    }
  })

  // Disconnect handler
  socket.on('disconnect', () => {
    const user = users.get(socket.id)
    
    if (user) {
      // Remove agent mappings
      user.agents.forEach((_, agentId) => {
        agentToUser.delete(agentId)
        agentToSocket.delete(agentId)
      })
      
      // Notify others about agents going offline
      socket.broadcast.emit('agents:offline', { 
        userId: user.id,
        agentIds: Array.from(user.agents.keys())
      })
      
      users.delete(socket.id)
      console.log(`[Mene' Portal] User ${user.id} disconnected`)
    } else {
      console.log(`[Mene' Portal] Client disconnected: ${socket.id}`)
    }
  })

  socket.on('error', (error) => {
    console.error(`[Mene' Portal] Socket error (${socket.id}):`, error)
  })
})

const PORT = 3003
httpServer.listen(PORT, () => {
  console.log(`[Mene' Portal] Agent WebSocket service running on port ${PORT}`)
})

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[Mene\' Portal] Received SIGTERM, shutting down...')
  httpServer.close(() => {
    console.log('[Mene\' Portal] WebSocket service closed')
    process.exit(0)
  })
})

process.on('SIGINT', () => {
  console.log('[Mene\' Portal] Received SIGINT, shutting down...')
  httpServer.close(() => {
    console.log('[Mene\' Portal] WebSocket service closed')
    process.exit(0)
  })
})
