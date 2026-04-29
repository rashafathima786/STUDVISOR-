import asyncio
import httpx
import os
from dotenv import load_dotenv

load_dotenv()

async def test_gemini_15():
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("Gemini API key missing")
        return
    # Trying 1.5 flash
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
    data = {"contents": [{"parts": [{"text": "Hello, how are you?"}]}]}
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(url, json=data, timeout=10)
            print(f"Gemini 1.5 Status: {resp.status_code}")
            if resp.status_code == 200:
                print(f"Gemini 1.5 Response: {resp.json()['candidates'][0]['content']['parts'][0]['text'][:100]}...")
            else:
                print(f"Gemini 1.5 Error: {resp.text}")
    except Exception as e:
        print(f"Gemini 1.5 Exception: {e}")

if __name__ == "__main__":
    asyncio.run(test_gemini_15())
