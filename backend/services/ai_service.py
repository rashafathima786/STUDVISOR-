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
        self.gemini_model = "gemini-3-flash"  # Latest model as per user request
        self.gemini_fallback_models = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"]
        # For streaming fallback if needed
        self.api_key = os.getenv("ANTHROPIC_API_KEY") 
        self.model = self.anthropic_model

    async def get_welcome_package(self, db_context: str, user_name: str) -> Dict:
        """Generates a personalized welcome message and quick actions."""
        # We use a simple heuristic combined with AI for the welcome text
        lines = db_context.split('\n')
        att_line = next((l for l in lines if "Overall Attendance" in l), "")
        cgpa_line = next((l for l in lines if "CGPA" in l), "")
        exams_line = next((l for l in lines if "Upcoming Exams" in l), "")
        
        att_pct = float(att_line.split(":")[1].split("%")[0].strip()) if "%" in att_line else 100.0
        exams_count = int(exams_line.split(":")[1].split(" ")[1].strip()) if "Upcoming Exams" in exams_line else 0

        # Base actions
        actions = [
            {"label": "📊 Attendance Summary", "query": "show my attendance summary", "category": "attendance"},
            {"label": "📅 Next Holiday", "query": "when is the next holiday", "category": "calendar"},
        ]

        # Contextual actions
        if att_pct < 75:
            actions.insert(0, {"label": "⚠️ Attendance Recovery", "query": "how to recover my attendance", "category": "critical"})
        if exams_count > 0:
            actions.append({"label": "📝 Exam Schedule", "query": "show my upcoming exams", "category": "academic"})
        
        hour = asyncio.get_event_loop().time() # Mocking time for greeting
        # Note: real time greeting is handled by frontend, but we can refine it here
        
        welcome_prompt = (
            f"Context: {db_context}\n"
            f"User: {user_name}\n"
            "Generate a very brief (1 sentence) 'State of the Union' for this student. "
            "Example: 'Welcome back! Your attendance is solid, but you have 2 exams coming up.'"
        )
        
        status_msg = await self.chat("You are a helpful ERP assistant.", welcome_prompt)

        return {
            "message": status_msg,
            "actions": actions,
            "suggestions": [
                "What is my weakest subject?",
                "Am I safe to bunk tomorrow?",
                "Compare my semester performance"
            ]
        }

    async def chat(self, system_prompt: str, user_query: str) -> str:
        """Standard non-streaming chat. Priority: Gemini -> Groq -> Anthropic -> Ollama -> Mock."""
        from backend.core.config import get_settings
        settings = get_settings()
        gemini_key = settings.GEMINI_API_KEY
        groq_key = settings.GROQ_API_KEY
        anthropic_key = settings.ANTHROPIC_API_KEY
        
        # 1. Gemini (Google AI)
        if gemini_key:
            models_to_try = [self.gemini_model] + self.gemini_fallback_models
            async with httpx.AsyncClient() as client:
                for model in models_to_try:
                    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={gemini_key}"
                    headers = {"Content-Type": "application/json"}
                    data = {
                        "contents": [{
                            "parts": [{"text": f"System: {system_prompt}\nUser: {user_query}"}]
                        }]
                    }
                    try:
                        response = await client.post(url, headers=headers, json=data, timeout=30.0)
                        if response.status_code == 200:
                            result = response.json()
                            return result["candidates"][0]["content"]["parts"][0]["text"]
                        else:
                            print(f"[AI] Model {model} failed: {response.status_code}")
                    except Exception as e:
                        print(f"[AI ERROR] Gemini {model} Exception: {e}")

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
        draft = ""
        if gemini_key:
            models_to_try = [self.gemini_model] + self.gemini_fallback_models
            async with httpx.AsyncClient() as client:
                for model in models_to_try:
                    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={gemini_key}"
                    headers = {"Content-Type": "application/json"}
                    data = {
                        "contents": [{
                            "parts": [{"text": f"Context: {db_context}\n\nStudent asked: '{user_query}'\n\nDraft a helpful, student-centric response. If it's a greeting, be friendly. If it's a question, be informative."}]
                        }]
                    }
                    try:
                        resp = await client.post(url, headers=headers, json=data, timeout=15.0)
                        if resp.status_code == 200:
                            draft = resp.json()["candidates"][0]["content"]["parts"][0]["text"]
                            break
                        else:
                            print(f"[AI] Draft Model {model} failed: {resp.status_code}")
                    except Exception as e:
                        print(f"[AI] Gemini Draft failed for {model}: {e}")

        # Step 2: Logical Refinement & Formatting (Groq)
        if groq_key:
            headers = {"Authorization": f"Bearer {groq_key}", "Content-Type": "application/json"}
            
            # Campus Connect Premium Intelligence Protocol
            refinement_prompt = (
                "ACT AS: Campus Connect (High-Fidelity ERP Intelligence Assistant).\n"
                f"STUDENT QUERY: '{user_query}'.\n"
                f"CONTEXT: {db_context}.\n"
                f"DRAFT: {draft if draft else 'N/A'}.\n\n"
                "CRITICAL INSTRUCTIONS:\n"
                "1. TONE: Helpful, professional, and conversational. Avoid clinical or robotic phrasing.\n"
                "2. STRUCTURE: Use clear paragraphs and bullet points where appropriate. No forced verticality.\n"
                "3. PERSONALIZATION: Address the student by name if provided in context.\n"
                "4. ACCURACY: Use the exact data provided in the context to answer precisely.\n"
                "5. BREVITY: Be concise but thorough. Ensure the user feels supported, not just informed.\n\n"
                "FORMATTING RULES:\n"
                "- Use Markdown for emphasis (bold, italic).\n"
                "- Use emojis sparingly to maintain a premium feel.\n"
                "- If the query is a greeting, provide a warm, personalized welcome and ask how to help."
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
                        content = resp.json()["choices"][0]["message"]["content"]
                        # Turing-5 Enhancement: Detection of "Action" intent
                        # If the AI suggests a page or tool, we can extract it.
                        actions = []
                        if "ATTENDANCE" in content.upper() or "BUNK" in content.upper():
                            actions.append({"label": "View Attendance", "action": "navigate", "payload": "/attendance"})
                        if "EXAM" in content.upper() or "CIA" in content.upper():
                            actions.append({"label": "Check Exams", "action": "navigate", "payload": "/exams"})
                        if "GPA" in content.upper() or "RESULT" in content.upper():
                            actions.append({"label": "Performance Hub", "action": "navigate", "payload": "/performance"})
                        
                        return {
                            "text": content,
                            "actions": actions,
                            "protocol": "Turing-5"
                        }
                    else:
                        # If Groq fails but we have a draft, return the draft
                        if draft: return {"text": draft, "actions": [], "protocol": "Gemini-Fallback"}
                        print(f"[AI] Groq Refine failed: {resp.status_code} - {resp.text}")
            except Exception as e:
                print(f"[AI] Groq Refine exception: {e}")

        # Final Fallback
        if draft: return {"text": draft, "actions": [], "protocol": "Gemini-Fallback"}
        return {
            "text": "### ⚠️ **Intelligence Service Interruption**\n\nI'm having trouble connecting to my core intelligence engine at the moment. Please check your connection or try again in a few seconds.",
            "actions": [],
            "protocol": "Error"
        }

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
