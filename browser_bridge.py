"""
browser_bridge.py
Ultra-light browser automation layer for LLM agents.
Integrated with Mene Portal for ChatGPT/Genspark automation.
Requires: pip install playwright python-dotenv
"""
import os, json, re, time
from typing import Any, Dict, List, Optional
from playwright.sync_api import sync_playwright, Page, Browser, BrowserContext

class BrowserBridge:
    """ 
    Thin wrapper around Playwright. 
    Exposes four LLM-friendly primitives:
        navigate(url)        -> status + page title
        click(selector)      -> status + clicked element text
        extract(selector)    -> text inside element(s)
        screenshot(path=None)-> save PNG, return path
    All methods return a JSON-serialisable dict the LLM can read.
    """

    def __init__(self, headless: bool = True):
        self._headless = headless
        self._p = None
        self._browser: Optional[Browser] = None
        self._context: Optional[BrowserContext] = None
        self._page: Optional[Page] = None

    # ---------- lifecycle ----------
    def start(self):
        """Initialize browser session"""
        print("🌐 Starting Browser Bridge...")
        self._p = sync_playwright().start()
        self._browser = self._p.chromium.launch(headless=self._headless)
        self._context = self._browser.new_context()
        self._page = self._context.new_page()
        print("✅ Browser Bridge ready")

    def stop(self):
        """Clean shutdown of browser session"""
        if self._context:
            self._context.close()
        if self._browser:
            self._browser.close()
        if self._p:
            self._p.stop()
        print("🔌 Browser Bridge stopped")

    # ---------- low-level helpers ----------
    def _safe_eval(self, js: str):
        """Run JS in page and return result."""
        return self._page.evaluate(js)

    def _highlight(self, selector: str):
        """Flash a border so we can visually confirm what we're clicking."""
        js = f"""
        const el = document.querySelector('{selector}');
        if (!el) return false;
        el.style.border = '3px solid red';
        return true;
        """
        return self._safe_eval(js)

    # ---------- LLM primitives ----------
    def navigate(self, url: str) -> Dict[str, Any]:
        """Navigate to URL and return page info"""
        try:
            self._page.goto(url, timeout=10_000)
            self._page.wait_for_load_state("domcontentloaded")
            title = self._page.title()
            return {"status": "ok", "title": title, "url": self._page.url}
        except Exception as e:
            return {"status": "error", "error": str(e)}

    def click(self, selector: str) -> Dict[str, Any]:
        """Click element and return clicked text"""
        try:
            self._highlight(selector)
            self._page.wait_for_selector(selector, timeout=5_000)
            element_text = self._page.locator(selector).inner_text()
            self._page.locator(selector).click()
            return {"status": "ok", "clicked_text": element_text}
        except Exception as e:
            return {"status": "error", "error": str(e)}

    def extract(self, selector: str) -> Dict[str, Any]:
        """Extract text from elements matching selector"""
        try:
            self._page.wait_for_selector(selector, timeout=5_000)
            elements = self._page.locator(selector).all_inner_texts()
            return {"status": "ok", "data": elements}
        except Exception as e:
            return {"status": "error", "error": str(e)}

    def screenshot(self, path: Optional[str] = None) -> Dict[str, Any]:
        """Take screenshot and return path"""
        if path is None:
            path = f"screenshot_{int(time.time())}.png"
        self._page.screenshot(path=path, full_page=True)
        return {"status": "ok", "path": path}

    # ---------- Mene Portal specific methods ----------
    def chatgpt_login(self, email: str = None) -> Dict[str, Any]:
        """Login to ChatGPT via browser automation"""
        try:
            result = self.navigate("https://chat.openai.com/")
            if result["status"] == "error":
                return result
            
            # Check if already logged in
            if "ChatGPT" in result["title"]:
                return {"status": "ok", "message": "Already logged in to ChatGPT"}
            
            # Click login button
            login_result = self.click("button[data-testid='login-button']")
            if login_result["status"] == "error":
                return {"status": "ok", "message": "Login required - please complete manually"}
            
            return {"status": "ok", "message": "Login process initiated"}
        except Exception as e:
            return {"status": "error", "error": str(e)}

    def genspark_navigate(self) -> Dict[str, Any]:
        """Navigate to Genspark and prepare for interaction"""
        try:
            result = self.navigate("https://www.genspark.ai/")
            if result["status"] == "ok":
                return {"status": "ok", "message": "Ready for Genspark interaction"}
            return result
        except Exception as e:
            return {"status": "error", "error": str(e)}

    def send_message(self, message: str, platform: str = "chatgpt") -> Dict[str, Any]:
        """Send message to AI platform"""
        try:
            if platform.lower() == "chatgpt":
                # Find and click the textarea
                textarea_result = self.click("textarea[placeholder*='Message']")
                if textarea_result["status"] == "error":
                    return textarea_result
                
                # Type the message
                self._page.keyboard.type(message)
                
                # Send the message
                send_result = self.click("button[data-testid='send-button']")
                return send_result
            
            elif platform.lower() == "genspark":
                # Implement Genspark message sending
                textarea_result = self.click("input[type='text'], textarea")
                if textarea_result["status"] == "error":
                    return textarea_result
                
                self._page.keyboard.type(message)
                self._page.keyboard.press("Enter")
                
                return {"status": "ok", "message": "Message sent to Genspark"}
            
            return {"status": "error", "error": f"Unsupported platform: {platform}"}
        except Exception as e:
            return {"status": "error", "error": str(e)}

    def get_response(self, platform: str = "chatgpt") -> Dict[str, Any]:
        """Get the latest response from AI platform"""
        try:
            if platform.lower() == "chatgpt":
                # Wait for response to appear
                time.sleep(2)
                response_result = self.extract("div[data-message-author-role='assistant'] div[class*='markdown']")
                return response_result
            
            elif platform.lower() == "genspark":
                # Wait for Genspark response
                time.sleep(3)
                response_result = self.extract("div[class*='response'], div[class*='answer']")
                return response_result
            
            return {"status": "error", "error": f"Unsupported platform: {platform}"}
        except Exception as e:
            return {"status": "error", "error": str(e)}


class MeneBrowserManager:
    """
    High-level manager for browser automation in Mene Portal
    Handles multiple browser sessions for different agents
    """
    
    def __init__(self):
        self.bridges = {}
        self.active_sessions = {}
    
    def get_bridge(self, agent_name: str) -> BrowserBridge:
        """Get or create browser bridge for specific agent"""
        if agent_name not in self.bridges:
            self.bridges[agent_name] = BrowserBridge(headless=True)
            self.bridges[agent_name].start()
        
        return self.bridges[agent_name]
    
    def close_bridge(self, agent_name: str):
        """Close browser bridge for specific agent"""
        if agent_name in self.bridges:
            self.bridges[agent_name].stop()
            del self.bridges[agent_name]
    
    def close_all(self):
        """Close all browser bridges"""
        for agent_name in list(self.bridges.keys()):
            self.close_bridge(agent_name)
    
    async def process_browser_request(self, agent_name: str, action: str, params: dict) -> dict:
        """Process browser automation request for agent"""
        bridge = self.get_bridge(agent_name)
        
        try:
            if action == "navigate":
                return bridge.navigate(params.get("url"))
            elif action == "click":
                return bridge.click(params.get("selector"))
            elif action == "extract":
                return bridge.extract(params.get("selector"))
            elif action == "screenshot":
                return bridge.screenshot(params.get("path"))
            elif action == "chatgpt_login":
                return bridge.chatgpt_login(params.get("email"))
            elif action == "send_message":
                return bridge.send_message(
                    params.get("message"), 
                    params.get("platform", "chatgpt")
                )
            elif action == "get_response":
                return bridge.get_response(params.get("platform", "chatgpt"))
            else:
                return {"status": "error", "error": f"Unknown action: {action}"}
        
        except Exception as e:
            return {"status": "error", "error": str(e)}