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
        self.api_key = os.getenv("ANTHROPIC_API_KEY")
        self.model = "claude-3-sonnet-20240229"  # RFC suggests claude-sonnet-4-6 but Sonnet 3 is stable
        self.base_url = "https://api.anthropic.com/v1/messages"

    async def chat(self, system_prompt: str, user_query: str) -> str:
        """Standard non-streaming chat. Fallbacks: Anthropic -> Ollama -> Mock."""
        if self.api_key:
            headers = {
                "x-api-key": self.api_key,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json"
            }
            data = {
                "model": self.model,
                "max_tokens": 1024,
                "system": system_prompt,
                "messages": [{"role": "user", "content": user_query}]
            }
            try:
                async with httpx.AsyncClient() as client:
                    response = await client.post(self.base_url, headers=headers, json=data, timeout=30.0)
                    response.raise_for_status()
                    result = response.json()
                    return result["content"][0]["text"]
            except Exception as e:
                print(f"Anthropic error: {e}")

        # Fallback to Ollama (local)
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
