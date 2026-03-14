'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { 
  MessageSquare, 
  Bot, 
  Globe, 
  Brain, 
  Database, 
  Plus, 
  Send,
  Upload,
  Download,
  Trash2,
  Edit,
  Copy,
  Settings,
  ChevronRight,
  Mic,
  Image as ImageIcon,
  Search,
  Zap,
  Menu,
  X,
  FileJson,
  ExternalLink,
  Play,
  Pause,
  Server,
  Wrench,
  Info,
  Check,
  AlertCircle,
  Sparkles
} from 'lucide-react';

// Types
interface Agent {
  id: string;
  name: string;
  description: string | null;
  avatar: string | null;
  color: string | null;
  systemPrompt?: string;
  firstMessage?: string;
  tools?: string[];
  memoryEnabled?: boolean;
  isActive: boolean;
  createdAt: string;
}

interface MCPServer {
  id: string;
  name: string;
  description: string | null;
  type: string;
  url: string | null;
  enabled: boolean;
  tools?: { name: string; description: string }[];
}

interface Service {
  id: string;
  name: string;
  url: string;
  category: string | null;
  icon: string | null;
  color: string | null;
  isEnabled: boolean;
}

interface Message {
  id: string;
  role: string;
  content: string;
  createdAt: string;
  agentId?: string;
  agentName?: string;
  agentAvatar?: string;
  agentColor?: string;
}

interface Conversation {
  id: string;
  title: string | null;
  messages: Message[];
  agentId?: string;
}

export default function MenePortal() {
  // State
  const [agents, setAgents] = useState<Agent[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [mcpServers, setMcpServers] = useState<MCPServer[]>([]);
  const [activeAgent, setActiveAgent] = useState<Agent | null>(null);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('chat');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Dialog states
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [createAgentDialogOpen, setCreateAgentDialogOpen] = useState(false);
  const [editAgentDialogOpen, setEditAgentDialogOpen] = useState(false);
  const [agentConfigDialogOpen, setAgentConfigDialogOpen] = useState(false);
  const [mcpDialogOpen, setMcpDialogOpen] = useState(false);
  const [selectedAgentForEdit, setSelectedAgentForEdit] = useState<Agent | null>(null);
  
  // Form states
  const [importJson, setImportJson] = useState('');
  const [newAgentName, setNewAgentName] = useState('');
  const [newAgentSystemPrompt, setNewAgentSystemPrompt] = useState('');
  const [newAgentDescription, setNewAgentDescription] = useState('');
  const [newAgentFirstMessage, setNewAgentFirstMessage] = useState('');
  const [newAgentColor, setNewAgentColor] = useState('#6366F1');

  // Fetch all data on mount
  useEffect(() => {
    let mounted = true;
    
    const fetchData = async () => {
      try {
        const [agentsRes, servicesRes, mcpRes] = await Promise.all([
          fetch('/api/agents?userId=default-user'),
          fetch('/api/services?userId=default-user'),
          fetch('/api/mcp?userId=default-user')
        ]);
        
        const agentsData = await agentsRes.json();
        const servicesData = await servicesRes.json();
        const mcpData = await mcpRes.json().catch(() => ({ servers: [] }));
        
        if (mounted) {
          setAgents(agentsData.agents || []);
          setServices(servicesData.services || []);
          setMcpServers(mcpData.servers || []);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    };
    
    fetchData();
    
    return () => { mounted = false; };
  }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Chat functions
  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;
    
    setIsLoading(true);
    const userMessage = inputMessage.trim();
    setInputMessage('');

    // Add user message immediately
    const tempUserMsg: Message = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: userMessage,
      createdAt: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempUserMsg]);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'default-user',
          conversationId: conversation?.id,
          agentId: activeAgent?.id,
          message: userMessage
        })
      });

      const data = await res.json();
      
      if (data.assistantMessage) {
        const agentMsg: Message = {
          id: data.assistantMessage.id,
          role: 'assistant',
          content: data.assistantMessage.content,
          createdAt: data.assistantMessage.createdAt,
          agentId: activeAgent?.id,
          agentName: data.agent?.name || activeAgent?.name,
          agentAvatar: data.agent?.avatar || activeAgent?.avatar,
          agentColor: activeAgent?.color || '#6366F1'
        };
        setMessages(prev => [...prev, agentMsg]);
        
        if (!conversation && data.conversationId) {
          setConversation({ id: data.conversationId, title: userMessage.slice(0, 50), messages: [] });
        }
      }
      
      toast.success('Message sent');
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message');
      setMessages(prev => [...prev, {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        createdAt: new Date().toISOString()
      }]);
    }

    setIsLoading(false);
  };

  // Agent import function
  const importAgent = async () => {
    if (!importJson.trim()) {
      toast.error('Please paste agent JSON');
      return;
    }

    try {
      const res = await fetch('/api/agents/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ json: importJson, userId: 'default-user' })
      });

      const data = await res.json();
      
      if (data.success) {
        setAgents(prev => [...prev, data.agent]);
        setImportJson('');
        setImportDialogOpen(false);
        toast.success(`Agent "${data.agent.name}" imported successfully`);
      } else {
        toast.error(data.error || 'Failed to import agent');
      }
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Failed to import agent');
    }
  };

  // Create agent function
  const createAgent = async () => {
    if (!newAgentName.trim() || !newAgentSystemPrompt.trim()) {
      toast.error('Name and system prompt are required');
      return;
    }

    try {
      const res = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'default-user',
          name: newAgentName,
          description: newAgentDescription,
          systemPrompt: newAgentSystemPrompt,
          firstMessage: newAgentFirstMessage,
          color: newAgentColor
        })
      });

      const data = await res.json();
      
      if (data.agent) {
        setAgents(prev => [...prev, data.agent]);
        setNewAgentName('');
        setNewAgentSystemPrompt('');
        setNewAgentDescription('');
        setNewAgentFirstMessage('');
        setCreateAgentDialogOpen(false);
        toast.success(`Agent "${data.agent.name}" created`);
      }
    } catch (error) {
      console.error('Create error:', error);
      toast.error('Failed to create agent');
    }
  };

  // Delete agent function
  const deleteAgent = async (agentId: string) => {
    try {
      await fetch(`/api/agents?id=${agentId}`, { method: 'DELETE' });
      setAgents(prev => prev.filter(a => a.id !== agentId));
      if (activeAgent?.id === agentId) {
        setActiveAgent(null);
      }
      toast.success('Agent deleted');
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete agent');
    }
  };

  // Export agent function
  const exportAgent = (agent: Agent) => {
    const exportData = {
      name: agent.name,
      description: agent.description,
      system_prompt: agent.systemPrompt,
      first_mes: agent.firstMessage,
      color: agent.color,
      memory_enabled: agent.memoryEnabled
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${agent.name.toLowerCase().replace(/\s+/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Agent exported');
  };

  // Open service in new tab
  const openService = (service: Service) => {
    window.open(service.url, '_blank');
    toast.info(`Opening ${service.name}`);
  };

  // Add custom service
  const addService = async (name: string, url: string) => {
    try {
      const res = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'default-user',
          name,
          url,
          category: 'custom',
          icon: '🔗'
        })
      });
      
      const data = await res.json();
      if (data.service) {
        setServices(prev => [...prev, data.service]);
        toast.success(`Service "${name}" added`);
      }
    } catch (error) {
      toast.error('Failed to add service');
    }
  };

  // Select agent and start chat
  const selectAgent = (agent: Agent) => {
    setActiveAgent(agent);
    setMessages([]);
    setConversation(null);
    setActiveTab('chat');
    toast.info(`Chatting with ${agent.name}`);
  };

  // Get initials for avatar
  const getInitials = (name: string) => name.slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/80 backdrop-blur-xl">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-lg font-bold">
                M
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                  Mene&apos; Portal
                </h1>
                <p className="text-xs text-slate-500">Multi-Agent AI Platform</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {activeAgent && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/50 border border-slate-700">
                <span className="text-lg">{activeAgent.avatar || '🤖'}</span>
                <span className="text-sm font-medium">{activeAgent.name}</span>
              </div>
            )}
            <Button
              variant="outline"
              size="icon"
              onClick={() => setMcpDialogOpen(true)}
              title="MCP Servers"
            >
              <Server className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside 
          className={`
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            fixed lg:relative z-40 w-72 lg:w-72 
            bg-slate-900/50 border-r border-slate-800 
            transition-transform duration-300 ease-in-out
            h-[calc(100vh-57px)] overflow-y-auto
          `}
        >
          <div className="p-4 space-y-6">
            {/* Quick Actions */}
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-2">Quick Actions</h3>
              <Button 
                className="w-full justify-start gap-2 bg-amber-600 hover:bg-amber-700" 
                onClick={() => setActiveTab('chat')}
              >
                <MessageSquare className="h-4 w-4" />
                New Chat
              </Button>
              
              <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <Upload className="h-4 w-4" />
                    Import Agent
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-slate-900 border-slate-700">
                  <DialogHeader>
                    <DialogTitle>Import Agent</DialogTitle>
                    <DialogDescription>
                      Paste agent JSON (TavernAI, Character.AI, or custom format)
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Textarea
                      value={importJson}
                      onChange={(e) => setImportJson(e.target.value)}
                      placeholder='{"name": "Agent Name", "system_prompt": "...", ...}'
                      className="min-h-[200px] bg-slate-800 border-slate-700"
                    />
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertDescription className="text-xs">
                        Supports TavernAI, Character.AI, and custom JSON formats
                      </AlertDescription>
                    </Alert>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setImportDialogOpen(false)}>Cancel</Button>
                    <Button onClick={importAgent} className="bg-amber-600 hover:bg-amber-700">
                      <Upload className="h-4 w-4 mr-2" />
                      Import
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog open={createAgentDialogOpen} onOpenChange={setCreateAgentDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <Plus className="h-4 w-4" />
                    Create Agent
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-slate-900 border-slate-700 max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Create New Agent</DialogTitle>
                    <DialogDescription>
                      Build your custom AI agent from scratch
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Name</Label>
                      <Input
                        value={newAgentName}
                        onChange={(e) => setNewAgentName(e.target.value)}
                        placeholder="Agent name"
                        className="bg-slate-800 border-slate-700"
                      />
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Input
                        value={newAgentDescription}
                        onChange={(e) => setNewAgentDescription(e.target.value)}
                        placeholder="Brief description"
                        className="bg-slate-800 border-slate-700"
                      />
                    </div>
                    <div>
                      <Label>System Prompt *</Label>
                      <Textarea
                        value={newAgentSystemPrompt}
                        onChange={(e) => setNewAgentSystemPrompt(e.target.value)}
                        placeholder="You are a helpful AI assistant..."
                        className="min-h-[120px] bg-slate-800 border-slate-700"
                      />
                    </div>
                    <div>
                      <Label>First Message (Optional)</Label>
                      <Textarea
                        value={newAgentFirstMessage}
                        onChange={(e) => setNewAgentFirstMessage(e.target.value)}
                        placeholder="Hello! How can I help you?"
                        className="bg-slate-800 border-slate-700"
                      />
                    </div>
                    <div>
                      <Label>Color</Label>
                      <div className="flex gap-2">
                        {['#6366F1', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#8B5CF6'].map(color => (
                          <button
                            key={color}
                            className={`w-8 h-8 rounded-full border-2 ${newAgentColor === color ? 'border-white' : 'border-transparent'}`}
                            style={{ backgroundColor: color }}
                            onClick={() => setNewAgentColor(color)}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setCreateAgentDialogOpen(false)}>Cancel</Button>
                    <Button onClick={createAgent} className="bg-amber-600 hover:bg-amber-700">
                      <Plus className="h-4 w-4 mr-2" />
                      Create
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {/* Agents */}
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-2">Agents ({agents.length})</h3>
              <ScrollArea className="h-[200px]">
                {agents.length === 0 ? (
                  <div className="text-center py-4 text-slate-500 text-sm">
                    <Bot className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No agents yet</p>
                    <p className="text-xs">Import or create one above</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {agents.map(agent => (
                      <div
                        key={agent.id}
                        className={`group flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all ${
                          activeAgent?.id === agent.id ? 'bg-slate-800' : 'hover:bg-slate-800/50'
                        }`}
                        onClick={() => selectAgent(agent)}
                      >
                        <div
                          className="h-10 w-10 rounded-xl flex items-center justify-center text-lg shrink-0"
                          style={{ backgroundColor: `${agent.color || '#6366F1'}20`, border: `2px solid ${agent.color || '#6366F1'}` }}
                        >
                          {agent.avatar || '🤖'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{agent.name}</div>
                          <div className="text-xs text-slate-500 truncate">{agent.description || 'No description'}</div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                              <Settings className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="bg-slate-800 border-slate-700">
                            <DropdownMenuItem onClick={() => exportAgent(agent)}>
                              <Download className="h-4 w-4 mr-2" />
                              Export
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { setSelectedAgentForEdit(agent); setEditAgentDialogOpen(true); }}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-slate-700" />
                            <DropdownMenuItem 
                              className="text-red-400 focus:text-red-400"
                              onClick={() => deleteAgent(agent.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>

            {/* Services */}
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-2">AI Services</h3>
              <ScrollArea className="h-[180px]">
                <div className="grid grid-cols-4 gap-2 p-1">
                  {services.slice(0, 12).map(service => (
                    <Button
                      key={service.id}
                      variant="ghost"
                      size="icon"
                      className="h-12 w-12 rounded-xl hover:bg-slate-800"
                      onClick={() => openService(service)}
                      title={service.name}
                    >
                      <span className="text-xl">{service.icon || '🔗'}</span>
                    </Button>
                  ))}
                </div>
              </ScrollArea>
              <Button variant="link" className="w-full text-amber-400" onClick={() => setActiveTab('services')}>
                Manage services <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>

            {/* MCP Servers */}
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-2">MCP Tools ({mcpServers.length})</h3>
              <Button 
                variant="outline" 
                className="w-full justify-start gap-2"
                onClick={() => setMcpDialogOpen(true)}
              >
                <Wrench className="h-4 w-4" />
                Configure Servers
              </Button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <TabsList className="grid w-full grid-cols-4 mx-4 mt-2 bg-slate-800/50">
              <TabsTrigger value="chat" className="gap-2">
                <MessageSquare className="h-4 w-4" />
                <span className="hidden sm:inline">Chat</span>
              </TabsTrigger>
              <TabsTrigger value="agents" className="gap-2">
                <Bot className="h-4 w-4" />
                <span className="hidden sm:inline">Agents</span>
              </TabsTrigger>
              <TabsTrigger value="services" className="gap-2">
                <Globe className="h-4 w-4" />
                <span className="hidden sm:inline">Services</span>
              </TabsTrigger>
              <TabsTrigger value="memory" className="gap-2">
                <Brain className="h-4 w-4" />
                <span className="hidden sm:inline">Memory</span>
              </TabsTrigger>
            </TabsList>

            {/* Chat Tab */}
            <TabsContent value="chat" className="flex-1 flex flex-col m-0 data-[state=inactive]:hidden">
              <div className="flex-1 flex flex-col">
                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                  <div className="max-w-4xl mx-auto space-y-4">
                    {!activeAgent && (
                      <div className="text-center py-12">
                        <div className="h-16 w-16 mx-auto rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-3xl mb-4">
                          M
                        </div>
                        <h2 className="text-2xl font-bold mb-2">Welcome to Mene&apos; Portal</h2>
                        <p className="text-slate-400 max-w-md mx-auto mb-6">
                          Import or create an agent to start chatting. Your agents can use MCP tools, 
                          access memory, and collaborate with each other.
                        </p>
                        <div className="flex flex-wrap justify-center gap-2">
                          <Button variant="outline" onClick={() => setImportDialogOpen(true)}>
                            <Upload className="h-4 w-4 mr-2" />
                            Import Agent
                          </Button>
                          <Button variant="outline" onClick={() => setCreateAgentDialogOpen(true)}>
                            <Plus className="h-4 w-4 mr-2" />
                            Create Agent
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    {activeAgent && messages.length === 0 && (
                      <div className="text-center py-12">
                        <div 
                          className="h-16 w-16 mx-auto rounded-2xl flex items-center justify-center text-3xl mb-4"
                          style={{ backgroundColor: `${activeAgent.color}20`, border: `2px solid ${activeAgent.color}` }}
                        >
                          {activeAgent.avatar || '🤖'}
                        </div>
                        <h2 className="text-2xl font-bold mb-2">{activeAgent.name}</h2>
                        <p className="text-slate-400 max-w-md mx-auto mb-4">
                          {activeAgent.description || 'Start a conversation with this agent.'}
                        </p>
                        {activeAgent.firstMessage && (
                          <Card className="max-w-md mx-auto bg-slate-800/50 border-slate-700">
                            <CardContent className="p-4 text-left">
                              <p className="text-sm">{activeAgent.firstMessage}</p>
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    )}

                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        {message.role !== 'user' && (
                          <Avatar className="h-8 w-8 border-2 shrink-0" style={{ borderColor: message.agentColor || '#6366F1' }}>
                            <AvatarFallback style={{ backgroundColor: message.agentColor || '#6366F1' }}>
                              <span className="text-sm">{message.agentAvatar || '🤖'}</span>
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <div
                          className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                            message.role === 'user'
                              ? 'bg-amber-600 text-white'
                              : 'bg-slate-800 border border-slate-700'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          <p className="text-[10px] opacity-50 mt-1">
                            {new Date(message.createdAt).toLocaleTimeString()}
                          </p>
                        </div>
                        {message.role === 'user' && (
                          <Avatar className="h-8 w-8 bg-slate-700 shrink-0">
                            <AvatarFallback className="bg-slate-700">U</AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    ))}
                    
                    {isLoading && (
                      <div className="flex gap-3">
                        <Avatar className="h-8 w-8 border-2 shrink-0" style={{ borderColor: activeAgent?.color || '#6366F1' }}>
                          <AvatarFallback style={{ backgroundColor: activeAgent?.color || '#6366F1' }}>
                            <span className="text-sm">{activeAgent?.avatar || '🤖'}</span>
                          </AvatarFallback>
                        </Avatar>
                        <div className="bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3">
                          <div className="flex gap-1">
                            <div className="h-2 w-2 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                            <div className="h-2 w-2 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                            <div className="h-2 w-2 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {/* Input */}
                <div className="border-t border-slate-800 bg-slate-900/50 p-4">
                  <div className="max-w-4xl mx-auto">
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" className="shrink-0" title="Voice input (coming soon)">
                        <Mic className="h-5 w-5" />
                      </Button>
                      <Input
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                        placeholder={activeAgent ? `Message ${activeAgent.name}...` : 'Select an agent first...'}
                        className="bg-slate-800 border-slate-700 focus-visible:ring-amber-500"
                        disabled={!activeAgent || isLoading}
                      />
                      <Button variant="ghost" size="icon" className="shrink-0" title="Attach image (coming soon)">
                        <ImageIcon className="h-5 w-5" />
                      </Button>
                      <Button 
                        onClick={sendMessage} 
                        disabled={!inputMessage.trim() || isLoading || !activeAgent}
                        className="shrink-0 bg-amber-600 hover:bg-amber-700"
                      >
                        <Send className="h-5 w-5" />
                      </Button>
                    </div>
                    <p className="text-xs text-slate-500 text-center mt-2">
                      Mene&apos; Portal • Agents can use MCP tools • Memory enabled
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Agents Tab */}
            <TabsContent value="agents" className="flex-1 p-4 m-0 data-[state=inactive]:hidden overflow-auto">
              <div className="max-w-6xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold">Agents</h2>
                    <p className="text-slate-400">Your AI agent collection - blank slate, import your own</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setImportDialogOpen(true)}>
                      <Upload className="h-4 w-4 mr-2" />
                      Import
                    </Button>
                    <Button className="gap-2 bg-amber-600 hover:bg-amber-700" onClick={() => setCreateAgentDialogOpen(true)}>
                      <Plus className="h-4 w-4" />
                      Create Agent
                    </Button>
                  </div>
                </div>
                
                {agents.length === 0 ? (
                  <Card className="bg-slate-800/50 border-slate-700">
                    <CardContent className="p-12 text-center">
                      <Bot className="h-16 w-16 mx-auto mb-4 text-slate-600" />
                      <h3 className="text-xl font-semibold mb-2">No agents yet</h3>
                      <p className="text-slate-400 mb-6 max-w-md mx-auto">
                        Start with a blank slate. Import agents from TavernAI, Character.AI, or create your own from scratch.
                      </p>
                      <div className="flex justify-center gap-2">
                        <Button variant="outline" onClick={() => setImportDialogOpen(true)}>
                          <Upload className="h-4 w-4 mr-2" />
                          Import JSON
                        </Button>
                        <Button className="bg-amber-600 hover:bg-amber-700" onClick={() => setCreateAgentDialogOpen(true)}>
                          <Plus className="h-4 w-4 mr-2" />
                          Create New
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {agents.map(agent => (
                      <Card 
                        key={agent.id} 
                        className={`bg-slate-800/50 border-slate-700 hover:border-slate-600 cursor-pointer transition-all group`}
                        onClick={() => selectAgent(agent)}
                      >
                        <CardHeader className="pb-2">
                          <div className="flex items-center gap-3">
                            <div 
                              className="h-12 w-12 rounded-xl flex items-center justify-center text-2xl"
                              style={{ backgroundColor: `${agent.color || '#6366F1'}20`, border: `2px solid ${agent.color || '#6366F1'}` }}
                            >
                              {agent.avatar || '🤖'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <CardTitle className="text-lg truncate">{agent.name}</CardTitle>
                              <CardDescription className="text-slate-400 text-xs truncate">
                                {agent.description || 'No description'}
                              </CardDescription>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-xs text-slate-500 line-clamp-2 mb-3">
                            {agent.systemPrompt?.slice(0, 100) || 'No system prompt defined'}
                          </p>
                          <div className="flex justify-between items-center">
                            <div className="flex gap-1">
                              {agent.tools?.length ? (
                                <Badge variant="outline" className="text-[10px]">{agent.tools.length} tools</Badge>
                              ) : null}
                              {agent.memoryEnabled && (
                                <Badge variant="outline" className="text-[10px]">Memory</Badge>
                              )}
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8"
                                onClick={(e) => { e.stopPropagation(); exportAgent(agent); }}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-red-400 hover:text-red-400"
                                onClick={(e) => { e.stopPropagation(); deleteAgent(agent.id); }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Services Tab */}
            <TabsContent value="services" className="flex-1 p-4 m-0 data-[state=inactive]:hidden overflow-auto">
              <div className="max-w-6xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold">AI Services</h2>
                    <p className="text-slate-400">Quick links to your favorite AI services - opens in new tab</p>
                  </div>
                </div>

                {/* Services Grid */}
                {['chat', 'search', 'image', 'code', 'custom'].map(category => {
                  const categoryServices = services.filter(s => s.category === category);
                  if (categoryServices.length === 0) return null;
                  
                  return (
                    <div key={category} className="mb-6">
                      <h3 className="text-lg font-semibold mb-3 capitalize">{category} Services</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                        {categoryServices.map(service => (
                          <Card 
                            key={service.id} 
                            className="bg-slate-800/50 border-slate-700 hover:border-slate-600 cursor-pointer"
                            onClick={() => openService(service)}
                          >
                            <CardContent className="p-4 text-center">
                              <div 
                                className="h-12 w-12 rounded-xl mx-auto mb-2 flex items-center justify-center text-2xl"
                                style={{ backgroundColor: `${service.color}20` }}
                              >
                                {service.icon || '🔗'}
                              </div>
                              <p className="text-sm font-medium">{service.name}</p>
                              <ExternalLink className="h-3 w-3 mx-auto mt-1 text-slate-500" />
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </TabsContent>

            {/* Memory Tab */}
            <TabsContent value="memory" className="flex-1 p-4 m-0 data-[state=inactive]:hidden overflow-auto">
              <div className="max-w-6xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold">Memory & Knowledge</h2>
                    <p className="text-slate-400">Agent memories and knowledge storage</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <Card className="bg-slate-800/50 border-slate-700">
                    <CardContent className="p-6 text-center">
                      <Brain className="h-8 w-8 mx-auto mb-2 text-amber-400" />
                      <div className="text-2xl font-bold">0</div>
                      <p className="text-sm text-slate-400">Memories</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-slate-800/50 border-slate-700">
                    <CardContent className="p-6 text-center">
                      <Bot className="h-8 w-8 mx-auto mb-2 text-emerald-400" />
                      <div className="text-2xl font-bold">{agents.length}</div>
                      <p className="text-sm text-slate-400">Agents</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-slate-800/50 border-slate-700">
                    <CardContent className="p-6 text-center">
                      <MessageSquare className="h-8 w-8 mx-auto mb-2 text-purple-400" />
                      <div className="text-2xl font-bold">{messages.length}</div>
                      <p className="text-sm text-slate-400">Messages</p>
                    </CardContent>
                  </Card>
                </div>

                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Search className="h-5 w-5" />
                      Search Memory
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
                      <Input placeholder="Search agent memories..." className="bg-slate-900 border-slate-700" />
                      <Button className="bg-amber-600 hover:bg-amber-700">Search</Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>

      {/* MCP Configuration Dialog */}
      <Dialog open={mcpDialogOpen} onOpenChange={setMcpDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-700 max-w-2xl">
          <DialogHeader>
            <DialogTitle>MCP Server Configuration</DialogTitle>
            <DialogDescription>
              Model Context Protocol servers provide tools for your agents
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-[400px] overflow-y-auto">
            {mcpServers.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <Server className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No MCP servers configured</p>
                <p className="text-xs">Add servers via JSON config</p>
              </div>
            ) : (
              mcpServers.map((server) => (
                <Card key={server.id} className="bg-slate-800/50 border-slate-700">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Server className="h-4 w-4 text-amber-400" />
                        <CardTitle className="text-sm">{server.name}</CardTitle>
                      </div>
                      <Switch checked={server.enabled} />
                    </div>
                    <CardDescription className="text-xs">{server.description}</CardDescription>
                  </CardHeader>
                  {server.tools && server.tools.length > 0 && (
                    <CardContent className="pt-0">
                      <div className="flex flex-wrap gap-1">
                        {server.tools.map((tool) => (
                          <Badge key={tool.name} variant="outline" className="text-[10px]">
                            {tool.name}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMcpDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950/80 py-3 px-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-xs text-slate-500">
          <p>Mene&apos; Portal - Multi-Agent AI Collaboration</p>
          <p>Blank slate • Import your own agents • MCP enabled</p>
        </div>
      </footer>
    </div>
  );
}
