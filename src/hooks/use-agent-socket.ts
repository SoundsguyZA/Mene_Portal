'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';

// Types
export interface Agent {
  id: string;
  name: string;
  avatar?: string;
  color?: string;
}

export interface AgentMessage {
  id: string;
  fromAgentId: string;
  fromAgentName: string;
  toAgentId?: string;
  toAgentName?: string;
  content: string;
  type: 'direct' | 'broadcast' | 'discussion' | 'system';
  conversationId?: string;
  timestamp: Date | string;
  metadata?: Record<string, unknown>;
}

export interface Discussion {
  id: string;
  title: string;
  topic: string;
  participants: Agent[];
  messages: AgentMessage[];
  status: 'active' | 'paused' | 'completed';
  createdAt: Date | string;
}

export interface TypingIndicator {
  agentId: string;
  agentName: string;
  isTyping: boolean;
}

export interface CollaborationRequest {
  fromAgent: Agent;
  toAgentId: string;
  task: string;
  context?: Record<string, unknown>;
  timestamp: string;
}

interface UseAgentSocketOptions {
  userId: string;
  agents: Agent[];
  onMessage?: (message: AgentMessage) => void;
  onAgentOnline?: (agents: Agent[]) => void;
  onAgentOffline?: (agentIds: string[]) => void;
  onTyping?: (indicator: TypingIndicator) => void;
  onDiscussionStarted?: (discussion: Discussion) => void;
  onDiscussionMessage?: (discussionId: string, message: AgentMessage) => void;
  onDiscussionEnded?: (discussionId: string, summary: Record<string, unknown>) => void;
  onCollaborationRequest?: (request: CollaborationRequest) => void;
  onCollaborationResult?: (result: { fromAgent: Agent; toAgentId: string; accepted: boolean; message?: string }) => void;
}

export function useAgentSocket({
  userId,
  agents,
  onMessage,
  onAgentOnline,
  onAgentOffline,
  onTyping,
  onDiscussionStarted,
  onDiscussionMessage,
  onDiscussionEnded,
  onCollaborationRequest,
  onCollaborationResult
}: UseAgentSocketOptions) {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineAgents, setOnlineAgents] = useState<Agent[]>([]);
  const [activeDiscussions, setActiveDiscussions] = useState<Discussion[]>([]);
  const [typingAgents, setTypingAgents] = useState<Map<string, TypingIndicator>>(new Map());

  // Connect to WebSocket
  useEffect(() => {
    if (!userId || agents.length === 0) return;

    const socketInstance = io('/?XTransformPort=3003', {
      transports: ['websocket', 'polling'],
      forceNew: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000
    });

    socketRef.current = socketInstance;

    socketInstance.on('connect', () => {
      setIsConnected(true);
      // Join with user's agents
      socketInstance.emit('user:join', { userId, agents });
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
    });

    // Agent message handlers
    socketInstance.on('agent:message', (msg: AgentMessage) => {
      onMessage?.(msg);
    });

    socketInstance.on('agent:message:sent', (msg: AgentMessage) => {
      // Confirmation that message was sent
    });

    socketInstance.on('agents:available', (data: { userId: string; agents: Agent[] }) => {
      setOnlineAgents(prev => {
        const newAgents = data.agents.filter(a => !prev.some(p => p.id === a.id));
        return [...prev, ...newAgents];
      });
      onAgentOnline?.(data.agents);
    });

    socketInstance.on('agents:online', (data: { agents: Agent[] }) => {
      setOnlineAgents(data.agents);
    });

    socketInstance.on('agents:offline', (data: { userId: string; agentIds: string[] }) => {
      setOnlineAgents(prev => prev.filter(a => !data.agentIds.includes(a.id)));
      onAgentOffline?.(data.agentIds);
    });

    socketInstance.on('agent:typing', (indicator: TypingIndicator) => {
      setTypingAgents(prev => {
        const next = new Map(prev);
        if (indicator.isTyping) {
          next.set(indicator.agentId, indicator);
        } else {
          next.delete(indicator.agentId);
        }
        return next;
      });
      onTyping?.(indicator);
    });

    // Discussion handlers
    socketInstance.on('discussion:started', (data: { discussion: Discussion }) => {
      setActiveDiscussions(prev => [...prev, data.discussion]);
      onDiscussionStarted?.(data.discussion);
    });

    socketInstance.on('discussion:message', (data: { discussionId: string; message: AgentMessage }) => {
      setActiveDiscussions(prev => 
        prev.map(d => 
          d.id === data.discussionId 
            ? { ...d, messages: [...d.messages, data.message] }
            : d
        )
      );
      onDiscussionMessage?.(data.discussionId, data.message);
    });

    socketInstance.on('discussion:ended', (data: { discussionId: string; summary: Record<string, unknown> }) => {
      setActiveDiscussions(prev => 
        prev.map(d => 
          d.id === data.discussionId 
            ? { ...d, status: 'completed' as const }
            : d
        )
      );
      onDiscussionEnded?.(data.discussionId, data.summary);
    });

    // Collaboration handlers
    socketInstance.on('agent:collaboration-request', (request: CollaborationRequest) => {
      onCollaborationRequest?.(request);
    });

    socketInstance.on('agent:collaboration-result', (result: { fromAgent: Agent; toAgentId: string; accepted: boolean; message?: string }) => {
      onCollaborationResult?.(result);
    });

    return () => {
      socketInstance.disconnect();
    };
  }, [userId, agents]);

  // Send message from agent
  const sendMessage = useCallback((
    fromAgentId: string,
    content: string,
    toAgentId?: string,
    conversationId?: string
  ) => {
    if (!socketRef.current || !isConnected) return;
    
    socketRef.current.emit('agent:message', {
      fromAgentId,
      toAgentId,
      content,
      conversationId
    });
  }, [isConnected]);

  // Start a discussion
  const startDiscussion = useCallback((title: string, topic: string, participantIds: string[]) => {
    if (!socketRef.current || !isConnected) return;
    
    socketRef.current.emit('discussion:start', {
      title,
      topic,
      participantIds
    });
  }, [isConnected]);

  // Contribute to discussion
  const contributeToDiscussion = useCallback((discussionId: string, agentId: string, content: string) => {
    if (!socketRef.current || !isConnected) return;
    
    socketRef.current.emit('discussion:contribute', {
      discussionId,
      agentId,
      content
    });
  }, [isConnected]);

  // End discussion
  const endDiscussion = useCallback((discussionId: string) => {
    if (!socketRef.current || !isConnected) return;
    
    socketRef.current.emit('discussion:end', { discussionId });
  }, [isConnected]);

  // Set typing indicator
  const setTyping = useCallback((agentId: string, isTyping: boolean) => {
    if (!socketRef.current || !isConnected) return;
    
    socketRef.current.emit('agent:typing', { agentId, isTyping });
  }, [isConnected]);

  // Request collaboration
  const requestCollaboration = useCallback((
    fromAgentId: string,
    toAgentId: string,
    task: string,
    context?: Record<string, unknown>
  ) => {
    if (!socketRef.current || !isConnected) return;
    
    socketRef.current.emit('agent:request-collaboration', {
      fromAgentId,
      toAgentId,
      task,
      context
    });
  }, [isConnected]);

  // Respond to collaboration
  const respondToCollaboration = useCallback((
    fromAgentId: string,
    toAgentId: string,
    accepted: boolean,
    message?: string
  ) => {
    if (!socketRef.current || !isConnected) return;
    
    socketRef.current.emit('agent:collaboration-response', {
      fromAgentId,
      toAgentId,
      accepted,
      message
    });
  }, [isConnected]);

  return {
    isConnected,
    onlineAgents,
    activeDiscussions,
    typingAgents,
    sendMessage,
    startDiscussion,
    contributeToDiscussion,
    endDiscussion,
    setTyping,
    requestCollaboration,
    respondToCollaboration
  };
}
