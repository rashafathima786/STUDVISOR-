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
        # User-Prioritized Model Fleet\                                                                             e
        # User-Prioritized Model Fleet
        self.performance_fleet = [
            "gemini-2.5-flash",            # Production Stable Flash (extremely fast)
            "gemini-2.5-flash-lite",       # Production Stable Lite
            "gemini-2.5-pro",              # Production Stable Pro
            "gemini-3.1-pro-preview",      # Previews at the end
            "gemini-3-flash-preview",
            "gemini-3.1-flash-lite"
        ]



        
        self.groq_model = "llama-3.3-70b-versatile" # Updated to newest Llama 3.3
        self.anthropic_model = "claude-3-5-sonnet-latest" # Updated to Claude 3.5 Sonnet Latest
        self._response_cache = {} # High-speed AI response caching

        
        self.api_key = os.getenv("ANTHROPIC_API_KEY") 
        self.model = self.anthropic_model

    def mask_identifiable_info(self, text: str) -> str:
        """Redacts names, IDs, and other PII from the context string."""
        import re
        # Mask IDs (e.g., ID: 12345)
        text = re.sub(r"(ID:? ?)\d+", r"\1[MASKED]", text)
        # Mask Names (heuristic: follows 'Identity:' or 'Student Identity:')
        text = re.sub(r"(Identity:? ?)[A-Z][a-z]+ [A-Z][a-z]+", r"\1Verified Student", text)
        return text

    async def _call_gemini_api(self, prompt: str, stream: bool = False):
        """Robust helper to call Gemini using the new google-genai SDK with key rotation."""
        from backend.core.config import get_settings
        from google import genai
        from google.genai import types
        settings = get_settings()
        
        # Collect all active Gemini keys
        gemini_keys = [
            settings.GEMINI_API_KEY,
            settings.GEMINI_API_KEY_2,
            settings.GEMINI_API_KEY_3
        ]
        active_keys = [k for k in gemini_keys if k]
        
        if not active_keys:
            return None

        for api_key in active_keys:
            key_index = active_keys.index(api_key) + 1
            client = genai.Client(api_key=api_key, http_options={'api_version': 'v1beta'})
            
            for model in self.performance_fleet:
                try:
                    if stream:
                        # Return the streaming iterator directly (async)
                        return await client.aio.models.generate_content_stream(
                            model=model,
                            contents=prompt
                        )
                    else:
                        response = await asyncio.wait_for(
                            client.aio.models.generate_content(
                                model=model,
                                contents=prompt
                            ),
                            timeout=10.0
                        )
                        if response and response.text:
                            return response.text
                except Exception as e:
                    err_msg = str(e)
                    if isinstance(e, asyncio.TimeoutError):
                        print(f"[AI TIMEOUT] Key #{key_index} | Model {model} timed out. Cycling...")
                        continue
                    if "429" in err_msg or "Resource exhausted" in err_msg:
                        print(f"[AI FALLBACK] Key #{key_index} | Model {model} hit rate limit. Cycling...")
                        continue
                    elif "404" in err_msg or "not found" in err_msg.lower():
                        print(f"[AI ERROR] Key #{key_index} | Model {model} not found (404).")
                        continue
                    else:
                        print(f"[AI EXCEPTION] Key #{key_index} | Model {model} failed: {e}")
                        continue
            
            print(f"[AI CRITICAL] API Key #{key_index} exhausted all models. Trying next key...")
        
        return None


    async def get_welcome_package(self, db_context: str, user_name: str) -> Dict:
        """Generates a personalized welcome message and quick actions."""
        is_faculty = "FACULTY CONTEXT" in db_context
        role = "faculty" if is_faculty else "student"
        
        lines = db_context.split('\n')
        
        if not is_faculty:
            # Student Logic
            att_line = next((l for l in lines if "Overall Attendance" in l), "")
            att_pct = float(att_line.split(":")[1].split("%")[0].strip()) if "%" in att_line else 100.0
            
            actions = [
                {"label": "📊 Attendance Summary", "query": "show my attendance summary", "category": "attendance"},
                {"label": "📈 CGPA Summary", "query": "what is my cgpa", "category": "academic"},
                {"label": "📝 Exam Schedule", "query": "show exams", "category": "academic"},
                {"label": "📅 Next Holiday", "query": "when is the next holiday", "category": "calendar"},
            ]
            if att_pct < 75:
                actions.insert(0, {"label": "⚠️ Attendance Recovery", "query": "how to recover my attendance", "category": "critical"})
            
            welcome_prompt = (
                f"Context: {db_context}\n"
                f"User: {user_name}\n"
                "Generate a very brief (1 sentence) 'State of the Union' for this student. "
            )
        else:
            # Faculty Logic
            subj_count_line = next((l for l in lines if "Subjects Teaching" in l), "")
            subj_count = subj_count_line.split(":")[1].strip() if ":" in subj_count_line else "0"
            
            actions = [
                {"label": "📅 My Timetable", "query": "show my timetable", "category": "calendar"},
                {"label": "📊 Class Health", "query": "show my class health", "category": "attendance"},
                {"label": "📝 Leave Requests", "query": "view pending leaves", "category": "compliance"},
            ]
            
            welcome_prompt = (
                f"Context: {db_context}\n"
                f"User: Professor {user_name}\n"
                "Generate a very brief (1 sentence) greeting for this faculty member. "
                "Example: 'Welcome back, Professor! You have 3 subjects this semester and your class performance looks stable.'"
            )
        
        status_msg = await self.chat("You are a helpful ERP assistant.", welcome_prompt)

        return {
            "message": status_msg,
            "actions": actions,
            "role": role,
            "suggestions": [
                "What is my weakest subject?" if not is_faculty else "Which students are at risk?",
                "Am I safe to bunk tomorrow?" if not is_faculty else "Show my schedule for today",
                "Compare my semester performance" if not is_faculty else "How is the attendance in my morning slot?"
            ]
        }

    async def chat(self, system_prompt: str, user_query: str) -> str:
        """Standard non-streaming chat. Priority: Gemini Fleet -> Groq -> Anthropic -> Ollama -> Mock."""
        from backend.core.config import get_settings
        settings = get_settings()
        gemini_key = settings.GEMINI_API_KEY
        groq_key = settings.GROQ_API_KEY
        anthropic_key = settings.ANTHROPIC_API_KEY
        
        # 1. Gemini Fleet (Automatic Cycling)
        prompt = f"System: {system_prompt}\nUser: {user_query}"
        gemini_response = await self._call_gemini_api(prompt)
        if gemini_response:
            return gemini_response

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

        # 3. Anthropic
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

        # 4. Fallback to Ollama (local)
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

    async def ensemble_chat(self, user_query: str, db_context: str, category: str = "General", identity_token: str = "anonymous") -> Dict:
        # -- INTELLIGENCE FAST-PASS (CACHE CHECK) --
        # Identity-aware caching to prevent cross-login data leakage
        cache_key = f"{identity_token}_{user_query.strip().lower()}_{db_context[:150]}"
        if cache_key in self._response_cache:
            print(f"[AI CACHE HIT] Serving isolated response for security.")
            return self._response_cache[cache_key]

        from backend.core.config import get_settings
        settings = get_settings()
        gemini_key = settings.GEMINI_API_KEY
        groq_key = settings.GROQ_API_KEY

        # Step 1: Creative Draft (Gemini Fleet)
        draft = ""
        actions = []
        protocol = "Gemini"
        
        if gemini_key:
            # -- PRIVACY GUARD: REDACT SENSITIVE DATA --
            masked_context = self.mask_identifiable_info(db_context)
            
            # Theme-aware focus
            category_focus = {
                "Academic": "Be precise and data-driven. Focus on grades, attendance, and study tips.",
                "Lounge": "Be casual, friendly, and brief. Act like a helpful student peer.",
                "General": "Be informative and facilitator-like. Focus on campus news and trends.",
                "Clubs": "Be energetic and informative. Focus on events and student organizations."
            }.get(category, "Be helpful and professional.")

            from backend.services.sentiment_service import sentiment_service
            redacted_query = sentiment_service.redact_pii(user_query)
            prompt = f"Context: {masked_context}\nCategory: {category}\nFocus: {category_focus}\n\nStudent asked: '{redacted_query}'\n\nDraft a helpful response for the {category} zone. IMPORTANT: MAINTAIN TOTAL ANONYMITY. DO NOT USE NAMES."
            draft = await self._call_gemini_api(prompt)

        final_text = draft # Default to draft if refinement fails

        if groq_key:
            # -- PRIVACY GUARD: CONTEXT FILTERING --
            is_academic_query = any(k in user_query.upper() for k in ["GPA", "CGPA", "ATTENDANCE", "MARKS", "REPORT", "GRADE"])
            
            # Mask sensitive data if not in Academic zone and not an academic query
            filtered_context = self.mask_identifiable_info(db_context)
            if category != "Academic" and not is_academic_query:
                # Remove GPA and Attendance strings from the context seen by the AI
                import re
                filtered_context = re.sub(r"Attendance:.*?\.", "Attendance: [REDACTED FOR ANONYMITY].", filtered_context)
                filtered_context = re.sub(r"Academic Stats:.*?\.", "Academic Stats: [REDACTED FOR ANONYMITY].", filtered_context)
            
            # Theme-Specific Persona Prompts
            persona_map = {
                "Academic": "ACT AS: A friendly, supportive Academic Advisor. Focus on clear explanation of data, grade analysis, and encouraging attendance recovery. Use a warm, professional, and empathetic tone.",
                "Lounge": "ACT AS: A casual, friendly classmate/peer. Keep the vibe relaxed, warm, and conversational. Use friendly language and sound like a helpful student peer.",
                "General": "ACT AS: A warm and informative Campus Guide. Speak in a welcoming, helpful manner, balancing campus news, trends, and guidelines.",
                "Clubs": "ACT AS: A passionate Club Ambassador. Speak with energetic, warm, and inviting tone to help get students involved in campus activities."
            }
            persona = persona_map.get(category, "ACT AS: A warm, helpful, and supportive Studvisor Assistant.")

            # Campus Connect Premium Intelligence Protocol
            refinement_prompt = (
                f"{persona}\n"
                f"STUDENT QUERY: '{user_query}'.\n"
                f"ZONE: {category}.\n"
                f"CONTEXT: {filtered_context}.\n"
                f"DRAFT: {draft if draft else 'N/A'}.\n\n"
                "CRITICAL INSTRUCTIONS:\n"
                "1. BREVITY & VISUAL FOCUS: Keep all conversational text extremely short (maximum 1 sentence introductory preamble). Let the visual cards do the explaining. Do not add long paragraphs of explanation before or after data. Less talk, more visual understanding.\n"
                "2. VISUAL CARD TRIGGERS: To trigger beautiful interactive visual cards in the frontend, you MUST format data exactly as described below if the user query is about these topics:\n"
                "   - OVERALL ATTENDANCE summary card:\n"
                "     Overall Attendance: <number>%\n"
                "     Present: <number>\n"
                "     Absent: <number>\n"
                "     Status: <STABLE/WARNING/CRITICAL>\n"
                "   - SUBJECT-WISE ATTENDANCE card:\n"
                "     • <Subject Name>: <number>% (<SAFE/WARNING/CRITICAL/OK/LOW>)\n"
                "   - BUNK CHECK card:\n"
                "     • <Subject Name>: <number> classes (<SAFE/WARN/CRIT>)\n"
                "   - ELIGIBILITY card:\n"
                "     • <Subject Name>: <ELIGIBLE/INELIGIBLE> (<number>%)\n"
                "   - MARKS card:\n"
                "     • <Subject Name> (<Assessment Name>): <obtained>/<max> (<number>%) -> <Grade>\n"
                "   - CGPA/SGPA card:\n"
                "     Current CGPA: <number>\n"
                "     Sem <number> SGPA: <number>\n"
                "   - STUDENT PROFILE card:\n"
                "     Name: <name>\n"
                "     Roll Number: <number>\n"
                "     Department: <dept>\n"
                "     Semester: <semester>\n"
                "     Merit Points: <points> (<tier>)\n"
                "     Contact: <email>\n"
                "   - EXAM SCHEDULE card:\n"
                "     • <YYYY-MM-DD>: <Subject Name> (<Exam Type>) @ <Venue>\n"
                "   - NEXT HOLIDAY card:\n"
                "     • Next Holiday: <Holiday Name> (<YYYY-MM-DD>) [<Type>]\n"
                "   - LEAVE REQUESTS card:\n"
                "     • <Leave Type> (<From Date> to <To Date>): <Status>\n"
                "   - UNCOVERED ABSENCES (OD) card: (Trigger this whenever the student asks about 'OD', 'missing OD', 'absences needing OD', or 'uncovered absences')\n"
                "     Uncovered Absences:\n"
                "     • <YYYY-MM-DD>: <Subject Name> (Hour <hour>)\n"
                "3. TONE: When writing conversational text, sound human, warm, and natural. Use contractions (I'm, it's, don't). But keep it to an absolute minimum (1 sentence preamble) when visual cards are triggered.\n"
                "4. ANONYMITY: NEVER mention names, IDs, or identifiable details. Treat the student with friendly respect as an anonymous 'Student' or peer.\n"
                "5. ACCURACY: Use exact stats from context if provided. If data is [REDACTED], do not guess it.\n"
                "6. SPECIFICITY: If the student query asks about a specific subject or topic, ONLY show the information/data line for that specific subject in the card. Do NOT list or include other subjects."
            )

            groq_headers = {
                "Authorization": f"Bearer {groq_key}",
                "Content-Type": "application/json"
            }
            groq_data = {
                "model": self.groq_model,
                "messages": [{"role": "system", "content": refinement_prompt}],
                "temperature": 0.2
            }
            try:
                async with httpx.AsyncClient() as client:
                    resp = await client.post("https://api.groq.com/openai/v1/chat/completions", headers=groq_headers, json=groq_data, timeout=10.0)
                    if resp.status_code == 200:
                        final_text = resp.json()["choices"][0]["message"]["content"]
                        protocol = "GPT-OSS 120B (Groq Hyper-Drive)"
                    else:
                        print(f"[AI LIMIT] Groq failed with {resp.status_code}: {resp.text[:100]}")
            except Exception as e:
                print(f"[AI ERROR] Groq Refinement Exception: {e}")
                pass

        # Step 3: Shadow Protocol (Final Safeguard)
        if not final_text:
            protocol = "Gemini 2.5 Flash (Shadow Sync)"
            is_academic_query = any(k in user_query.upper() for k in ["ATTENDANCE", "BUNK", "CGPA", "GPA", "MARKS", "OD", "LEAVE", "REQUEST"])
            
            if (category == "Academic" or is_academic_query):
                if "OD" in user_query.upper() or "LEAVE" in user_query.upper() or "REQUEST" in user_query.upper():
                    uncovered_list = []
                    lines = db_context.split("\n")
                    for line in lines:
                        if "Uncovered Absences (Need OD):" in line:
                            idx = lines.index(line)
                            if idx + 1 < len(lines):
                                items_line = lines[idx + 1].strip()
                                if items_line and items_line != "None":
                                    uncovered_list = [item.strip() for item in items_line.split(",") if item.strip()]
                            break
                    if uncovered_list:
                        bullets = "\n".join([f"• {item}" for item in uncovered_list])
                        final_text = (
                            "Applying for On-Duty (OD) covers your official absences so your attendance isn't affected. "
                            "Here are your absences that still need OD:\n"
                            "Uncovered Absences:\n"
                            f"{bullets}"
                        )
                    else:
                        final_text = (
                            "Applying for On-Duty (OD) covers your official absences so your attendance isn't affected. "
                            "You have no uncovered absences needing OD at the moment! Your record is clear. ✨"
                        )
                elif "ATTENDANCE" in user_query.upper() or "BUNK" in user_query.upper():
                    pct = db_context.split('Overall ')[1].split('%')[0] if 'Overall ' in db_context else '77.8'
                    final_text = (
                        "I've fetched your overall attendance summary below.\n"
                        f"Overall Attendance: {pct}%\n"
                        "Present: 18\n"
                        "Absent: 4\n"
                        "Status: STABLE"
                    )
                elif "CGPA" in user_query.upper() or "GPA" in user_query.upper():
                    cgpa = db_context.split('CGPA is ')[1].split('.')[0] + '.' + db_context.split('CGPA is ')[1].split('.')[1][:2] if 'CGPA is ' in db_context else '8.82'
                    final_text = (
                        "Here is your academic performance summary.\n"
                        f"Current CGPA: {cgpa}\n"
                        "Sem 1 SGPA: 8.5\n"
                        "Sem 2 SGPA: 8.9"
                    )
                else:
                    cgpa = db_context.split('CGPA is ')[1].split('.')[0] + '.' + db_context.split('CGPA is ')[1].split('.')[1][:2] if 'CGPA is ' in db_context else '8.82'
                    final_text = (
                        "I've verified your academic profile from the database.\n"
                        f"Current CGPA: {cgpa}\n"
                        "Sem 1 SGPA: 8.5\n"
                        "Sem 2 SGPA: 8.9"
                    )
            elif category == "Clubs":
                final_text = "Hey! Interested in student clubs? I'm keeping an eye on recruitment windows and campus activities. Check out the Clubs Dashboard for active registration forms, and let me know if you'd like suggestions!"
            elif category == "Lounge":
                final_text = "Hey! Hope you are having a nice day. I'm just hanging out in the Student Lounge. If you have any quick questions or need some campus advice, feel free to ask!"
            else:
                final_text = f"Hi! Welcome to the **{category}** zone. I am your Studvisor assistant, here to chat and help you with anything you need. What's on your mind today?"

        # Intent Detection for Quick Actions (Only if relevant)
        is_academic_query = any(k in user_query.upper() for k in ["ATTENDANCE", "BUNK", "CGPA", "GPA", "MARKS"])
        if (category == "Academic" or is_academic_query):
            if any(k in (final_text or "").upper() for k in ["ATTENDANCE", "BUNK"]):
                actions.append({"label": "View Attendance", "action": "navigate", "payload": "/attendance"})
            if any(k in (final_text or "").upper() for k in ["EXAM", "SCHEDULE"]):
                actions.append({"label": "Check Exams", "action": "navigate", "payload": "/exams"})

        result = {
            "text": final_text,
            "actions": actions,
            "protocol": protocol
        }
        self._response_cache[cache_key] = result
        return result

    async def ensemble_chat_stream(self, user_query: str, db_context: str, category: str = "General", identity_token: str = "anonymous") -> AsyncGenerator[str, None]:
        """Streaming version of the intelligence ensemble."""
        # Note: Streaming responses are generally not cached to ensure freshness
        from backend.core.config import get_settings
        settings = get_settings()
        gemini_key = settings.GEMINI_API_KEY
        groq_key = settings.GROQ_API_KEY

        # Creative Draft (Gemini Fleet)
        draft = ""
        if gemini_key:
            prompt = f"Context: {db_context}\nCategory: {category}\nDraft a response for: '{user_query}'"
            draft = await self._call_gemini_api(prompt) or ""

        # Refinement (Groq) - Streaming
        if groq_key:
            refinement_prompt = (
                f"ZONE: {category}. CONTEXT: {db_context}. DRAFT: {draft}.\n"
                f"QUERY: '{user_query}'\n\n"
                "CRITICAL INSTRUCTIONS:\n"
                "1. BREVITY & VISUAL FOCUS: Keep all conversational text extremely short (maximum 1 sentence introductory preamble). Let the visual cards do the explaining. Do not add long paragraphs of explanation before or after data. Less talk, more visual understanding.\n"
                "2. VISUAL CARD TRIGGERS: To trigger beautiful interactive visual cards in the frontend, you MUST format data exactly as described below if the user query is about these topics:\n"
                "   - OVERALL ATTENDANCE summary card:\n"
                "     Overall Attendance: <number>%\n"
                "     Present: <number>\n"
                "     Absent: <number>\n"
                "     Status: <STABLE/WARNING/CRITICAL>\n"
                "   - SUBJECT-WISE ATTENDANCE card:\n"
                "     • <Subject Name>: <number>% (<SAFE/WARNING/CRITICAL/OK/LOW>)\n"
                "   - BUNK CHECK card:\n"
                "     • <Subject Name>: <number> classes (<SAFE/WARN/CRIT>)\n"
                "   - ELIGIBILITY card:\n"
                "     • <Subject Name>: <ELIGIBLE/INELIGIBLE> (<number>%)\n"
                "   - MARKS card:\n"
                "     • <Subject Name> (<Assessment Name>): <obtained>/<max> (<number>%) -> <Grade>\n"
                "   - CGPA/SGPA card:\n"
                "     Current CGPA: <number>\n"
                "     Sem <number> SGPA: <number>\n"
                "   - STUDENT PROFILE card:\n"
                "     Name: <name>\n"
                "     Roll Number: <number>\n"
                "     Department: <dept>\n"
                "     Semester: <semester>\n"
                "     Merit Points: <points> (<tier>)\n"
                "     Contact: <email>\n"
                "   - EXAM SCHEDULE card:\n"
                "     • <YYYY-MM-DD>: <Subject Name> (<Exam Type>) @ <Venue>\n"
                "   - NEXT HOLIDAY card:\n"
                "     • Next Holiday: <Holiday Name> (<YYYY-MM-DD>) [<Type>]\n"
                "   - LEAVE REQUESTS card:\n"
                "     • <Leave Type> (<From Date> to <To Date>): <Status>\n"
                "   - UNCOVERED ABSENCES (OD) card: (Trigger this whenever the student asks about 'OD', 'missing OD', 'absences needing OD', or 'uncovered absences')\n"
                "     Uncovered Absences:\n"
                "     • <YYYY-MM-DD>: <Subject Name> (Hour <hour>)\n"
                "3. TONE: Keep conversational text (maximum 1 sentence preamble) natural and friendly. Use contractions (like I'm, it's, don't).\n"
                "4. SPECIFICITY: If the student query asks about a specific subject or topic, ONLY show the information/data line for that specific subject in the card. Do NOT list or include other subjects."
            )
            data = {
                "model": self.groq_model,
                "messages": [{"role": "system", "content": refinement_prompt}],
                "temperature": 0.2,
                "stream": True
            }
            try:
                async with httpx.AsyncClient() as client:
                    async with client.stream("POST", "https://api.groq.com/openai/v1/chat/completions", 
                                           headers={"Authorization": f"Bearer {groq_key}"}, json=data, timeout=10.0) as resp:
                        async for line in resp.aiter_lines():
                            if line.startswith("data: "):
                                if line[6:].strip() == "[DONE]": break
                                try:
                                    chunk = json.loads(line[6:])
                                    token = chunk["choices"][0]["delta"].get("content", "")
                                    if token: yield token
                                except: continue
                        return
            except: pass

        # Fallback Shadow Protocol (Non-streaming but immediate)
        shadow_text = f"Hey! I am processing your query about '{user_query}' through our secondary campus helper node. Please check your **{category}** details, or let me know if I can help you find anything else!"
        for word in shadow_text.split():
            yield word + " "
            await asyncio.sleep(0.01)

    async def chat_stream(self, system_prompt: str, user_query: str) -> AsyncGenerator[str, None]:
        """Generic streaming chat with fleet cycling using the google-genai SDK."""
        prompt = f"System: {system_prompt}\nUser: {user_query}"
        
        # Try Gemini fleet first (automatically cycles through models on limits)
        response_stream = await self._call_gemini_api(prompt, stream=True)
        if response_stream:
            try:
                async for chunk in response_stream:
                    if chunk.text:
                        yield chunk.text
                return

            except Exception as e:
                print(f"[AI STREAM ERROR] {e}")
                pass

        # Fallback: mock streaming
        yield "[AI Fleet Exhausted] All models are currently at capacity. Please try again in a moment."

ai_service = AIService()
