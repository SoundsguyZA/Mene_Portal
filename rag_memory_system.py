"""
rag_memory_system.py
Advanced RAG + Memory System for Mene Portal
Based on Aluna Africa AI Bridge architecture
Integrates ChromaDB, document processing, and persistent memory
"""
import os
import json
import uuid
import asyncio
import hashlib
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Union
from pathlib import Path

try:
    import chromadb
    from chromadb.config import Settings
    CHROMADB_AVAILABLE = True
except ImportError:
    CHROMADB_AVAILABLE = False
    print("⚠️ ChromaDB not available. Install with: pip install chromadb")

try:
    from sentence_transformers import SentenceTransformer
    EMBEDDINGS_AVAILABLE = True
except ImportError:
    EMBEDDINGS_AVAILABLE = False
    print("⚠️ SentenceTransformers not available. Install with: pip install sentence-transformers")


class DocumentProcessor:
    """Process various document types for RAG system"""
    
    def __init__(self):
        self.supported_formats = ['.txt', '.md', '.json', '.csv', '.py', '.js', '.html']
    
    def extract_text(self, file_path: str) -> str:
        """Extract text from various file formats"""
        file_path = Path(file_path)
        
        if not file_path.exists():
            return ""
        
        try:
            if file_path.suffix.lower() in self.supported_formats:
                with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                    return f.read()
            else:
                print(f"⚠️ Unsupported file format: {file_path.suffix}")
                return ""
        except Exception as e:
            print(f"❌ Error reading {file_path}: {e}")
            return ""
    
    def chunk_text(self, text: str, chunk_size: int = 512, overlap: int = 50) -> List[Dict[str, Any]]:
        """Split text into overlapping chunks"""
        if not text:
            return []
        
        chunks = []
        words = text.split()
        
        for i in range(0, len(words), chunk_size - overlap):
            chunk_words = words[i:i + chunk_size]
            chunk_text = ' '.join(chunk_words)
            
            chunks.append({
                'text': chunk_text,
                'start_idx': i,
                'end_idx': i + len(chunk_words),
                'chunk_id': len(chunks)
            })
        
        return chunks
    
    async def process_file(self, file_path: str) -> List[Dict[str, Any]]:
        """Process a file and return chunks with metadata"""
        text = self.extract_text(file_path)
        if not text:
            return []
        
        chunks = self.chunk_text(text)
        file_path_obj = Path(file_path)
        
        processed_chunks = []
        for chunk in chunks:
            processed_chunks.append({
                'text': chunk['text'],
                'metadata': {
                    'source': str(file_path),
                    'filename': file_path_obj.name,
                    'file_type': file_path_obj.suffix,
                    'chunk_id': chunk['chunk_id'],
                    'processed_at': datetime.now().isoformat(),
                    'file_size': file_path_obj.stat().st_size if file_path_obj.exists() else 0
                }
            })
        
        return processed_chunks


class ChromaRAGSystem:
    """ChromaDB-based RAG system"""
    
    def __init__(self, persist_directory: str = "./chroma_db"):
        self.persist_directory = persist_directory
        self.client = None
        self.collections = {}
        self.processor = DocumentProcessor()
        
        if not CHROMADB_AVAILABLE:
            print("❌ ChromaDB not available - RAG system disabled")
            return
        
        self._initialize_client()
    
    def _initialize_client(self):
        """Initialize ChromaDB client"""
        try:
            os.makedirs(self.persist_directory, exist_ok=True)
            
            self.client = chromadb.PersistentClient(
                path=self.persist_directory,
                settings=Settings(
                    anonymized_telemetry=False,
                    allow_reset=True
                )
            )
            
            # Initialize default collections
            self._setup_collections()
            print("✅ ChromaDB RAG system initialized")
            
        except Exception as e:
            print(f"❌ Error initializing ChromaDB: {e}")
            self.client = None
    
    def _setup_collections(self):
        """Setup default collections"""
        collections = [
            "documents",      # General documents
            "conversations",  # Chat history
            "knowledge",      # Structured knowledge
            "code",          # Code snippets
            "memories"       # Agent memories
        ]
        
        for collection_name in collections:
            try:
                collection = self.client.get_or_create_collection(
                    name=collection_name,
                    metadata={"hnsw:space": "cosine"}
                )
                self.collections[collection_name] = collection
                print(f"📚 Collection '{collection_name}' ready")
            except Exception as e:
                print(f"❌ Error creating collection {collection_name}: {e}")
    
    async def add_document(self, file_path: str, collection_name: str = "documents") -> Dict[str, Any]:
        """Add document to RAG system"""
        if not self.client:
            return {"status": "error", "error": "ChromaDB not available"}
        
        try:
            chunks = await self.processor.process_file(file_path)
            if not chunks:
                return {"status": "error", "error": "No content extracted from file"}
            
            collection = self.collections.get(collection_name)
            if not collection:
                return {"status": "error", "error": f"Collection {collection_name} not found"}
            
            # Prepare data for ChromaDB
            documents = [chunk['text'] for chunk in chunks]
            metadatas = [chunk['metadata'] for chunk in chunks]
            ids = [f"{hashlib.md5(chunk['text'].encode()).hexdigest()}_{i}" 
                   for i, chunk in enumerate(chunks)]
            
            collection.add(
                documents=documents,
                metadatas=metadatas,
                ids=ids
            )
            
            return {
                "status": "ok",
                "message": f"Added {len(chunks)} chunks from {Path(file_path).name}",
                "chunks_added": len(chunks)
            }
            
        except Exception as e:
            return {"status": "error", "error": str(e)}
    
    async def search(self, query: str, collection_name: str = "documents", 
                    limit: int = 5) -> Dict[str, Any]:
        """Search for relevant documents"""
        if not self.client:
            return {"status": "error", "error": "ChromaDB not available"}
        
        try:
            collection = self.collections.get(collection_name)
            if not collection:
                return {"status": "error", "error": f"Collection {collection_name} not found"}
            
            results = collection.query(
                query_texts=[query],
                n_results=limit
            )
            
            search_results = []
            if results['documents'] and results['documents'][0]:
                for i, doc in enumerate(results['documents'][0]):
                    metadata = results['metadatas'][0][i] if results['metadatas'] else {}
                    distance = results['distances'][0][i] if results['distances'] else 0
                    
                    search_results.append({
                        'text': doc,
                        'metadata': metadata,
                        'relevance': 1 - distance,  # Convert distance to relevance
                        'source': metadata.get('source', 'unknown')
                    })
            
            return {
                "status": "ok",
                "results": search_results,
                "query": query,
                "total_results": len(search_results)
            }
            
        except Exception as e:
            return {"status": "error", "error": str(e)}


class MemoryManager:
    """Persistent memory system for agents"""
    
    def __init__(self, rag_system: ChromaRAGSystem):
        self.rag = rag_system
        self.memory_collection = "memories"
        self.conversation_collection = "conversations"
    
    async def save_conversation(self, agent_name: str, user_message: str, 
                               agent_response: str, context: Dict = None) -> Dict[str, Any]:
        """Save conversation to memory"""
        if not self.rag.client:
            return {"status": "error", "error": "Memory system not available"}
        
        try:
            conversation = {
                "agent": agent_name,
                "user_message": user_message,
                "agent_response": agent_response,
                "timestamp": datetime.now().isoformat(),
                "context": context or {}
            }
            
            # Generate conversation summary for better retrieval
            summary = f"{agent_name} conversation about {user_message[:100]}..."
            
            collection = self.rag.collections.get(self.conversation_collection)
            if not collection:
                return {"status": "error", "error": "Conversation collection not found"}
            
            conversation_id = str(uuid.uuid4())
            
            collection.add(
                documents=[json.dumps(conversation)],
                metadatas=[{
                    "type": "conversation",
                    "agent": agent_name,
                    "timestamp": conversation["timestamp"],
                    "summary": summary,
                    "user_intent": self._extract_intent(user_message)
                }],
                ids=[f"conv_{conversation_id}"]
            )
            
            return {
                "status": "ok",
                "message": "Conversation saved to memory",
                "conversation_id": conversation_id
            }
            
        except Exception as e:
            return {"status": "error", "error": str(e)}
    
    async def get_conversation_context(self, query: str, agent_name: str = None, 
                                     limit: int = 5) -> Dict[str, Any]:
        """Retrieve relevant conversation context"""
        if not self.rag.client:
            return {"status": "error", "error": "Memory system not available"}
        
        try:
            collection = self.rag.collections.get(self.conversation_collection)
            if not collection:
                return {"status": "error", "error": "Conversation collection not found"}
            
            # Build search query
            search_query = query
            if agent_name:
                search_query = f"{agent_name} {query}"
            
            results = collection.query(
                query_texts=[search_query],
                n_results=limit,
                where={"agent": agent_name} if agent_name else None
            )
            
            context = []
            if results['documents'] and results['documents'][0]:
                for i, doc in enumerate(results['documents'][0]):
                    conversation = json.loads(doc)
                    metadata = results['metadatas'][0][i]
                    
                    context.append({
                        "conversation": conversation,
                        "summary": metadata.get("summary", ""),
                        "timestamp": metadata.get("timestamp", ""),
                        "relevance": 1 - (results['distances'][0][i] if results['distances'] else 0)
                    })
            
            return {
                "status": "ok",
                "context": context,
                "total_results": len(context)
            }
            
        except Exception as e:
            return {"status": "error", "error": str(e)}
    
    def _extract_intent(self, message: str) -> str:
        """Extract user intent from message"""
        message_lower = message.lower()
        
        intents = {
            "question": ["what", "how", "why", "when", "where", "which", "?"],
            "request": ["please", "can you", "could you", "would you"],
            "command": ["do", "make", "create", "build", "generate"],
            "information": ["tell me", "explain", "describe", "show me"]
        }
        
        for intent, keywords in intents.items():
            if any(keyword in message_lower for keyword in keywords):
                return intent
        
        return "general"


class EnhancedMeneLTMBridge:
    """
    Enhanced LTM Bridge with RAG and Memory System
    Integrates with existing Mene Portal
    """
    
    def __init__(self):
        # Initialize RAG system
        self.rag_system = ChromaRAGSystem()
        self.memory_manager = MemoryManager(self.rag_system)
        
        # Initialize existing components
        self.ai_drive_path = '/mnt/aidrive/veritas_ai_memory'
        self.memory_agents = {}
        self.voice_assets = {}
        
        # Setup agents and load existing data
        self._initialize_system()
    
    def _initialize_system(self):
        """Initialize the enhanced system"""
        print("🧠 Initializing Enhanced Mene LTM Bridge...")
        
        # Load existing agent personalities
        self._load_agent_personalities()
        
        # Process AI Drive documents if available
        self._process_ai_drive_documents()
        
        print("✅ Enhanced Mene LTM Bridge ready")
    
    def _load_agent_personalities(self):
        """Load agent personalities (existing code)"""
        # Keep existing agent personality code from original bridge
        self.memory_agents = {
            'mene': {
                "role": "Master Orchestrator & User-Facing Assistant",
                "personality": "Intelligent, supportive, strategic",
                "specialties": ["orchestration", "user_interaction", "strategic_planning"]
            },
            'bonny': {
                "role": "Research Specialist & Botanical Scientist", 
                "personality": "Curious, thorough, scientific",
                "specialties": ["research", "botanical_science", "data_analysis"]
            }
            # ... other agents
        }
    
    async def _process_ai_drive_documents(self):
        """Process documents from AI Drive into RAG system"""
        if not os.path.exists(self.ai_drive_path):
            print("⚠️ AI Drive path not accessible")
            return
        
        try:
            # Process ChatGPT history
            chatgpt_log = os.path.join('/mnt/aidrive', 'ChatGPT_Entire_ChatLog_23-08-25.md')
            if os.path.exists(chatgpt_log):
                result = await self.rag_system.add_document(chatgpt_log, "conversations")
                if result["status"] == "ok":
                    print(f"📚 Processed ChatGPT history: {result['chunks_added']} chunks")
            
            # Process other documents
            for root, dirs, files in os.walk(self.ai_drive_path):
                for file in files[:10]:  # Limit to prevent overload
                    file_path = os.path.join(root, file)
                    if Path(file_path).suffix.lower() in ['.md', '.txt', '.json']:
                        await self.rag_system.add_document(file_path, "documents")
            
        except Exception as e:
            print(f"⚠️ Error processing AI Drive documents: {e}")
    
    async def process_agent_query_enhanced(self, agent_name: str, query: str, 
                                         context: Dict = None) -> Dict[str, Any]:
        """Enhanced query processing with RAG and memory"""
        try:
            # Get RAG context
            rag_results = await self.rag_system.search(query, limit=3)
            rag_context = rag_results.get("results", []) if rag_results["status"] == "ok" else []
            
            # Get conversation memory
            memory_results = await self.memory_manager.get_conversation_context(
                query, agent_name, limit=3
            )
            memory_context = memory_results.get("context", []) if memory_results["status"] == "ok" else []
            
            # Build enhanced response
            agent_info = self.memory_agents.get(agent_name.lower(), {})
            
            # Create enhanced prompt context
            enhanced_context = {
                "rag_context": rag_context,
                "memory_context": memory_context,
                "agent_personality": agent_info.get("personality", ""),
                "agent_specialties": agent_info.get("specialties", [])
            }
            
            # Generate response (this would integrate with actual AI models)
            response_text = self._generate_response(agent_name, query, enhanced_context)
            
            # Save conversation to memory
            await self.memory_manager.save_conversation(
                agent_name, query, response_text, context
            )
            
            return {
                "agent": agent_name,
                "response": response_text,
                "timestamp": datetime.now().isoformat(),
                "rag_sources": len(rag_context),
                "memory_context": len(memory_context),
                "enhanced": True
            }
            
        except Exception as e:
            return {
                "agent": agent_name,
                "response": f"Error processing query: {str(e)}",
                "timestamp": datetime.now().isoformat(),
                "error": True
            }
    
    def _generate_response(self, agent_name: str, query: str, context: Dict) -> str:
        """Generate contextually aware response"""
        agent_info = self.memory_agents.get(agent_name.lower(), {})
        personality = agent_info.get("personality", "")
        
        # Base response with personality
        if agent_name.lower() == "mene":
            base = f"Hello! I'm Mene, your orchestrating assistant with {personality} approach."
        elif agent_name.lower() == "bonny":
            base = f"Greetings! I'm Bonny, your research specialist. With my {personality} nature,"
        else:
            base = f"Hi! I'm {agent_name}."
        
        # Add RAG context if available
        if context.get("rag_context"):
            base += f" Based on relevant documents I found, "
        
        # Add memory context if available
        if context.get("memory_context"):
            base += f" Considering our previous conversations, "
        
        base += f" I understand you're asking: '{query}'. Let me provide you with a comprehensive response."
        
        return base
    
    # Add existing methods from original LTM bridge
    def get_agent_info(self, agent_name: str):
        """Get agent information"""
        return self.memory_agents.get(agent_name.lower())
    
    def get_all_agents(self):
        """Get all available agents"""
        return [{"name": name, **info} for name, info in self.memory_agents.items()]