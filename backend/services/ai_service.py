"""
v2.0 AI Service — Integrated Anthropic/Ollama adapter.
Provides unified chat and generation capabilities.
"""
import os
import json
import asyncio
from typing import List, Dict, Optional, AsyncGenerator
import httpx

class AIService:
    def __init__(self):
        self.groq_model = "llama-3.3-70b-versatile"
        self.anthropic_model = "claude-3-sonnet-20240229"
        self.gemini_model = "gemini-2.5-flash"
        # For streaming fallback if needed
        self.api_key = os.getenv("ANTHROPIC_API_KEY") 
        self.model = self.anthropic_model

    async def chat(self, system_prompt: str, user_query: str) -> str:
        """Standard non-streaming chat. Priority: Gemini -> Groq -> Anthropic -> Ollama -> Mock."""
        from backend.core.config import get_settings
        settings = get_settings()
        gemini_key = settings.GEMINI_API_KEY
        groq_key = settings.GROQ_API_KEY
        anthropic_key = settings.ANTHROPIC_API_KEY
        
        # 1. Gemini (Google AI)
        if gemini_key:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={gemini_key}"
            headers = {"Content-Type": "application/json"}
            data = {
                "contents": [{
                    "parts": [{"text": f"System: {system_prompt}\nUser: {user_query}"}]
                }]
            }
            try:
                async with httpx.AsyncClient() as client:
                    response = await client.post(url, headers=headers, json=data, timeout=30.0)
                    if response.status_code == 200:
                        result = response.json()
                        return result["candidates"][0]["content"]["parts"][0]["text"]
                    else:
                        # Fallback to 2.0
                        url_v2 = url.replace("2.5-flash", "2.0-flash")
                        response = await client.post(url_v2, headers=headers, json=data, timeout=30.0)
                        if response.status_code == 200:
                            return response.json()["candidates"][0]["content"]["parts"][0]["text"]
            except Exception as e:
                print(f"[AI ERROR] Gemini Exception: {e}")

        # 2. Groq (High Speed)
        if groq_key:
            headers = {
                "Authorization": f"Bearer {groq_key}",
                "Content-Type": "application/json"
            }
            data = {
                "model": self.groq_model,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_query}
                ],
                "temperature": 0.7
            }
            try:
                async with httpx.AsyncClient() as client:
                    response = await client.post("https://api.groq.com/openai/v1/chat/completions", headers=headers, json=data, timeout=20.0)
                    if response.status_code == 200:
                        return response.json()["choices"][0]["message"]["content"]
                    else:
                        print(f"[AI ERROR] Groq Failed: {response.status_code} - {response.text}")
            except Exception as e:
                print(f"[AI ERROR] Groq Exception: {e}")

        # 2. Anthropic
        if anthropic_key:
            headers = {
                "x-api-key": anthropic_key,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json"
            }
            data = {
                "model": self.anthropic_model,
                "max_tokens": 1024,
                "system": system_prompt,
                "messages": [{"role": "user", "content": user_query}]
            }
            try:
                async with httpx.AsyncClient() as client:
                    response = await client.post("https://api.anthropic.com/v1/messages", headers=headers, json=data, timeout=30.0)
                    if response.status_code == 200:
                        return response.json()["content"][0]["text"]
            except Exception as e:
                print(f"Anthropic error: {e}")

        # 3. Fallback to Ollama (local)
        ollama_url = os.getenv("OLLAMA_URL", "http://localhost:11434/api/generate")
        try:
            async with httpx.AsyncClient() as client:
                data = {
                    "model": os.getenv("OLLAMA_MODEL", "llama3"),
                    "prompt": f"System: {system_prompt}\nUser: {user_query}",
                    "stream": False
                }
                response = await client.post(ollama_url, json=data, timeout=30.0)
                if response.status_code == 200:
                    return response.json().get("response", "[Ollama Response Error]")
        except Exception as e:
            print(f"Ollama error: {e}")

        return f"[MOCK AI] Analyzing: {user_query[:50]}..."

    async def ensemble_chat(self, user_query: str, db_context: str) -> str:
        """Dual-model intelligence: Gemini drafts with context, Groq refines into a premium response."""
        from backend.core.config import get_settings
        settings = get_settings()
        gemini_key = settings.GEMINI_API_KEY
        groq_key = settings.GROQ_API_KEY

        # Step 1: Creative Draft (Gemini)
        # We now give context to Gemini too so the draft is already grounded.
        draft = ""
        if gemini_key:
            # Using the latest Gemini 2.5 Flash as requested
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={gemini_key}"
            headers = {"Content-Type": "application/json"}
            data = {
                "contents": [{
                    "parts": [{"text": f"Context: {db_context}\n\nStudent asked: '{user_query}'\n\nDraft a helpful, student-centric response. If it's a greeting, be friendly. If it's a question, be informative."}]
                }]
            }
            try:
                async with httpx.AsyncClient() as client:
                    resp = await client.post(url, headers=headers, json=data, timeout=15.0)
                    if resp.status_code == 200:
                        draft = resp.json()["candidates"][0]["content"]["parts"][0]["text"]
                    else:
                        # Fallback chain: 2.5 -> 2.0 -> 1.5
                        for model_ver in ["gemini-2.0-flash", "gemini-1.5-flash"]:
                            url_fb = f"https://generativelanguage.googleapis.com/v1beta/models/{model_ver}:generateContent?key={gemini_key}"
                            resp_fb = await client.post(url_fb, headers=headers, json=data, timeout=15.0)
                            if resp_fb.status_code == 200:
                                draft = resp_fb.json()["candidates"][0]["content"]["parts"][0]["text"]
                                break
            except Exception as e:
                print(f"[AI] Gemini Draft failed: {e}")

        # Step 2: Logical Refinement & Formatting (Groq)
        if groq_key:
            headers = {"Authorization": f"Bearer {groq_key}", "Content-Type": "application/json"}
            
            # Hardened Nexus AI Intelligence Protocol (Forced Verticality)
            refinement_prompt = (
                "ACT AS: Nexus AI (Next-Generation Intelligence Protocol).\n"
                f"STUDENT QUERY: '{user_query}'.\n"
                f"CONTEXT: {db_context}.\n"
                f"DRAFT: {draft if draft else 'N/A'}.\n\n"
                "CRITICAL INSTRUCTIONS:\n"
                "1. EVERY segment MUST start on a NEW LINE.\n"
                "2. FORBIDDEN: Never put `---` and `- **LABEL**` on the same line.\n"
                "3. WHITESPACE: You MUST use two newlines (Enter key twice) between every segment.\n"
                "4. PRIORITY: Answer the specific query in the first segment under **QUERY**.\n"
                "5. BREVITY: 2-4 words per bullet. Minimal words.\n"
                "6. DATA: Use exact values from Breakdown for subject accuracy.\n\n"
                "EXAMPLE OUTPUT (STRICT VERTICAL LAYOUT):\n"
                "---\n\n"
                "- **QUERY**: Lowest: Math (65%).\n\n"
                "---\n\n"
                "- **STATUS**: Att 78.8%. CGPA 7.83.\n\n"
                "---\n\n"
                "- **ACTION**: Review Math. Use SAC study."
            )

            data = {
                "model": self.groq_model,
                "messages": [
                    {"role": "system", "content": refinement_prompt}
                ],
                "temperature": 0.3
            }
            try:
                async with httpx.AsyncClient() as client:
                    resp = await client.post("https://api.groq.com/openai/v1/chat/completions", headers=headers, json=data, timeout=20.0)
                    if resp.status_code == 200:
                        return resp.json()["choices"][0]["message"]["content"]
                    else:
                        # If Groq fails but we have a draft, return the draft
                        if draft: return draft
                        print(f"[AI] Groq Refine failed: {resp.status_code} - {resp.text}")
            except Exception as e:
                print(f"[AI] Groq Refine exception: {e}")

        # Final Fallback
        if draft: return draft
        return f"### ⚠️ **NEXUS SYSTEM ALERT**\n---\n**Protocol Error:** Intelligence Ensemble unreachable.\n\n*Check connection or API quota.*"

    async def chat_stream(self, system_prompt: str, user_query: str) -> AsyncGenerator[str, None]:
        """Streaming chat via SSE."""
        if not self.api_key:
            # Mock streaming
            response = f"[MOCK STREAM] Analyzing your academic data for: '{user_query}'. Everything looks good!"
            for word in response.split():
                yield json.dumps({"token": word + " ", "done": False})
                await asyncio.sleep(0.05)
            yield json.dumps({"token": "", "done": True})
            return

        headers = {
            "x-api-key": self.api_key,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json"
        }
        
        data = {
            "model": self.model,
            "max_tokens": 1024,
            "system": system_prompt,
            "messages": [{"role": "user", "content": user_query}],
            "stream": True
        }

        try:
            async with httpx.AsyncClient() as client:
                async with client.stream("POST", self.base_url, headers=headers, json=data, timeout=30.0) as response:
                    async for line in response.aiter_lines():
                        if line.startswith("data: "):
                            line_data = json.loads(line[6:])
                            if line_data["type"] == "content_block_delta":
                                yield json.dumps({"token": line_data["delta"]["text"], "done": False})
                            elif line_data["type"] == "message_stop":
                                yield json.dumps({"token": "", "done": True})
        except Exception as e:
            yield json.dumps({"token": f"Error: {str(e)}", "done": True})

ai_service = AIService()
