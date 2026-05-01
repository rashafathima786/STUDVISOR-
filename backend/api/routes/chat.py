"""Chat routes — wired to the AI chatbot engine with history and streaming."""
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
import json, asyncio

from backend.core.security import get_current_student
from backend.app.database import get_db, SessionLocal
from backend.app.models import ChatHistory
from backend.app.chatbot import process_chat, detect_emotion


router = APIRouter(prefix="/chat", tags=["Chat"])


class ChatInput(BaseModel):
    query: str
    context_page: Optional[str] = None


@router.post("/")
async def chat(data: ChatInput, student=Depends(get_current_student), db: Session = Depends(get_db)):
    """Process a chat message through the deterministic AI engine."""
    result = await process_chat(db, student, data.query)
    # Save text reply to history
    db.add(ChatHistory(student_id=student.id, query=data.query, response=result["reply"],
                       context_page=data.context_page))
    db.commit()
    return {
        "reply": result["reply"], 
        "actions": result.get("actions", []),
        "protocol": result.get("protocol", "Nexus"),
        "emotion": detect_emotion(data.query)
    }


@router.post("/stream/")
async def chat_stream(data: ChatInput, student=Depends(get_current_student), db: Session = Depends(get_db)):
    """SSE streaming — sends the AI response in real-time as tokens are generated."""
    from backend.app.chatbot import process_chat_stream

    async def generate():
        full_response = ""
        protocol = "Nexus"
        actions = []
        
        async for chunk in process_chat_stream(db, student, data.query):
            if chunk["type"] == "meta":
                protocol = chunk.get("protocol", "Nexus")
                actions = chunk.get("actions", [])
                yield f"event: meta\ndata: {json.dumps({'actions': actions, 'protocol': protocol})}\n\n"
            else:
                token = chunk["token"]
                full_response += token
                yield f"event: chunk\ndata: {json.dumps({'token': token, 'done': False})}\n\n"
        
        # Save to history in background after stream completes
        asyncio.create_task(asyncio.to_thread(save_chat_history, student.id, data.query, full_response, data.context_page))
        
        yield f"event: chunk\ndata: {json.dumps({'token': '', 'done': True})}\n\n"
        yield f"event: done\ndata: {json.dumps({'status': 'finished'})}\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")


def save_chat_history(student_id, query, response, context_page):
    """Background helper to persist chat history."""
    db = SessionLocal()
    try:
        db.add(ChatHistory(student_id=student_id, query=query, response=response, context_page=context_page))
        db.commit()
    finally:
        db.close()


@router.get("/history/")
def history(student=Depends(get_current_student), db: Session = Depends(get_db)):
    """Last 50 chat messages for this student."""
    msgs = db.query(ChatHistory).filter(
        ChatHistory.student_id == student.id
    ).order_by(ChatHistory.created_at.desc()).limit(50).all()
    return {"messages": [{"query": m.query, "response": m.response,
                          "context_page": m.context_page, "date": str(m.created_at)} for m in msgs]}


@router.delete("/history/")
def clear_history(student=Depends(get_current_student), db: Session = Depends(get_db)):
    """Clear chat history for this student."""
    db.query(ChatHistory).filter(ChatHistory.student_id == student.id).delete()
    db.commit()
    return {"message": "Chat history cleared"}


@router.get("/suggestions/")
def suggestions(student=Depends(get_current_student), db: Session = Depends(get_db)):
    """Context-aware question suggestions based on student state."""
    from backend.app.models import Attendance
    records = db.query(Attendance).filter(Attendance.student_id == student.id).all()
    total = len(records)
    present = sum(1 for r in records if r.status == "P")
    pct = round(present / total * 100, 1) if total > 0 else 100

    base = [
        "What is my CGPA?",
        "Show my attendance",
        "Which subjects need improvement?",
        "Am I eligible for exams?",
    ]

    if pct < 75:
        base.insert(0, "How many classes do I need to reach 75%?")
        base.append("Can I still write exams?")
    elif pct >= 90:
        base.append("Is it safe to bunk a class?")

    return {"suggestions": base}
