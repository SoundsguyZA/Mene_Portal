"""
Python Service for Mene Portal
Handles RAG, Memory, and Browser Automation
"""
import asyncio
import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, List, Optional, Any
import logging

# Import our custom modules
from browser_bridge import BrowserBridge, MeneBrowserManager
from rag_memory_system import ChromaRAGSystem, MemoryManager, EnhancedMeneLTMBridge

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# FastAPI app
app = FastAPI(
    title="Mene Portal Python Service",
    description="RAG + Memory + Browser Automation Service",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global instances
browser_manager = None
ltm_bridge = None

# Pydantic models
class BrowserAction(BaseModel):
    agent: str
    action: str
    params: Dict[str, Any]

class RAGQuery(BaseModel):
    query: str
    collection: Optional[str] = "documents"
    limit: Optional[int] = 5

class MemoryQuery(BaseModel):
    query: str
    agent: Optional[str] = None
    limit: Optional[int] = 5

class ConversationSave(BaseModel):
    agent: str
    user_message: str
    agent_response: str
    context: Optional[Dict] = None

@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    global browser_manager, ltm_bridge
    
    logger.info("🚀 Starting Mene Portal Python Service...")
    
    # Initialize browser manager
    browser_manager = MeneBrowserManager()
    logger.info("🌐 Browser Manager initialized")
    
    # Initialize enhanced LTM bridge
    ltm_bridge = EnhancedMeneLTMBridge()
    logger.info("🧠 Enhanced LTM Bridge initialized")
    
    logger.info("✅ All services ready")

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    if browser_manager:
        browser_manager.close_all()
    logger.info("🔌 Services shut down gracefully")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "services": {
            "browser_manager": browser_manager is not None,
            "ltm_bridge": ltm_bridge is not None,
            "rag_system": ltm_bridge.rag_system.client is not None if ltm_bridge else False
        },
        "timestamp": "2024-08-24T03:00:00Z"
    }

@app.post("/browser/action")
async def browser_action(action: BrowserAction):
    """Execute browser automation action"""
    if not browser_manager:
        raise HTTPException(status_code=500, detail="Browser manager not initialized")
    
    try:
        result = await browser_manager.process_browser_request(
            action.agent, action.action, action.params
        )
        return result
    except Exception as e:
        logger.error(f"Browser action error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/rag/search")
async def rag_search(query: RAGQuery):
    """Search RAG system"""
    if not ltm_bridge or not ltm_bridge.rag_system:
        raise HTTPException(status_code=500, detail="RAG system not available")
    
    try:
        result = await ltm_bridge.rag_system.search(
            query.query, query.collection, query.limit
        )
        return result
    except Exception as e:
        logger.error(f"RAG search error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/memory/save")
async def save_conversation(conv: ConversationSave):
    """Save conversation to memory"""
    if not ltm_bridge or not ltm_bridge.memory_manager:
        raise HTTPException(status_code=500, detail="Memory system not available")
    
    try:
        result = await ltm_bridge.memory_manager.save_conversation(
            conv.agent, conv.user_message, conv.agent_response, conv.context
        )
        return result
    except Exception as e:
        logger.error(f"Memory save error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/memory/context")
async def get_memory_context(query: str, agent: Optional[str] = None, limit: int = 5):
    """Get memory context"""
    if not ltm_bridge or not ltm_bridge.memory_manager:
        raise HTTPException(status_code=500, detail="Memory system not available")
    
    try:
        result = await ltm_bridge.memory_manager.get_conversation_context(
            query, agent, limit
        )
        return result
    except Exception as e:
        logger.error(f"Memory context error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/agent/query")
async def enhanced_agent_query(agent: str, query: str, context: Optional[Dict] = None):
    """Process enhanced agent query with RAG and memory"""
    if not ltm_bridge:
        raise HTTPException(status_code=500, detail="LTM bridge not available")
    
    try:
        result = await ltm_bridge.process_agent_query_enhanced(agent, query, context)
        return result
    except Exception as e:
        logger.error(f"Enhanced query error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/agents")
async def get_agents():
    """Get all available agents"""
    if not ltm_bridge:
        raise HTTPException(status_code=500, detail="LTM bridge not available")
    
    return ltm_bridge.get_all_agents()

@app.post("/documents/add")
async def add_document(file_path: str, collection: str = "documents"):
    """Add document to RAG system"""
    if not ltm_bridge or not ltm_bridge.rag_system:
        raise HTTPException(status_code=500, detail="RAG system not available")
    
    try:
        result = await ltm_bridge.rag_system.add_document(file_path, collection)
        return result
    except Exception as e:
        logger.error(f"Document add error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(
        "python_service:app",
        host="0.0.0.0",
        port=8888,
        reload=True,
        log_level="info"
    )