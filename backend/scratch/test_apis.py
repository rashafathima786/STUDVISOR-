import asyncio
import httpx
import os
from dotenv import load_dotenv

load_dotenv()

async def test_gemini():
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("Gemini API key missing")
        return
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={api_key}"
    data = {"contents": [{"parts": [{"text": "Hello, how are you?"}]}]}
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(url, json=data, timeout=10)
            print(f"Gemini Status: {resp.status_code}")
            if resp.status_code == 200:
                print(f"Gemini Response: {resp.json()['candidates'][0]['content']['parts'][0]['text'][:100]}...")
            else:
                print(f"Gemini Error: {resp.text}")
    except Exception as e:
        print(f"Gemini Exception: {e}")

async def test_groq():
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        print("Groq API key missing")
        return
    headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
    data = {
        "model": "llama-3.3-70b-versatile",
        "messages": [{"role": "user", "content": "Hello"}],
    }
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post("https://api.groq.com/openai/v1/chat/completions", headers=headers, json=data, timeout=10)
            print(f"Groq Status: {resp.status_code}")
            if resp.status_code == 200:
                print(f"Groq Response: {resp.json()['choices'][0]['message']['content'][:100]}...")
            else:
                print(f"Groq Error: {resp.text}")
    except Exception as e:
        print(f"Groq Exception: {e}")

if __name__ == "__main__":
    asyncio.run(test_gemini())
    asyncio.run(test_groq())
