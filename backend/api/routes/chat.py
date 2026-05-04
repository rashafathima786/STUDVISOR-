"""Chat routes — wired to the AI chatbot engine with history and streaming."""
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
import json, asyncio

from backend.core.security import get_current_student, get_current_user_any
from backend.app.database import get_db, SessionLocal
from backend.app.models import ChatHistory
from backend.app.chatbot import process_chat, detect_emotion


router = APIRouter(prefix="/chat", tags=["Chat"])


class ChatInput(BaseModel):
    query: str
    context_page: Optional[str] = None


@router.post("/")
async def chat(data: ChatInput, user=Depends(get_current_user_any), db: Session = Depends(get_db)):
    """Process a chat message through the deterministic AI engine."""
    result = await process_chat(db, user, data.query)
    
    # Save to history
    history = ChatHistory(
        query=data.query, 
        response=result["reply"],
        context_page=data.context_page,
        user_role=user.user_role
    )
    if user.user_role == "student":
        history.student_id = user.id
    else:
        history.faculty_id = user.id
        
    db.add(history)
    db.commit()
    return {
        "reply": result["reply"], 
        "actions": result.get("actions", []),
        "protocol": result.get("protocol", "Nexus"),
        "emotion": detect_emotion(data.query)
    }


@router.post("/stream/")
async def chat_stream(data: ChatInput, user=Depends(get_current_user_any), db: Session = Depends(get_db)):
    """SSE streaming — sends the AI response in real-time as tokens are generated."""
    from backend.app.chatbot import process_chat_stream

    async def generate():
        full_response = ""
        protocol = "Nexus"
        actions = []
        
        async for chunk in process_chat_stream(db, user, data.query):
            if chunk["type"] == "meta":
                protocol = chunk.get("protocol", "Nexus")
                actions = chunk.get("actions", [])
                yield f"event: meta\ndata: {json.dumps({'actions': actions, 'protocol': protocol})}\n\n"
            else:
                token = chunk["token"]
                full_response += token
                yield f"event: chunk\ndata: {json.dumps({'token': token, 'done': False})}\n\n"
        
        # Save to history in background after stream completes
        asyncio.create_task(asyncio.to_thread(
            save_chat_history, user.id, user.user_role, data.query, full_response, data.context_page
        ))
        
        yield f"event: chunk\ndata: {json.dumps({'token': '', 'done': True})}\n\n"
        yield f"event: done\ndata: {json.dumps({'status': 'finished'})}\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")


def save_chat_history(user_id, role, query, response, context_page):
    """Background helper to persist chat history."""
    db = SessionLocal()
    try:
        history = ChatHistory(query=query, response=response, context_page=context_page, user_role=role)
        if role == "student":
            history.student_id = user_id
        else:
            history.faculty_id = user_id
        db.add(history)
        db.commit()
    finally:
        db.close()


@router.get("/history/")
def history(user=Depends(get_current_user_any), db: Session = Depends(get_db)):
    """Last 50 chat messages for this user."""
    query = db.query(ChatHistory).order_by(ChatHistory.created_at.desc())
    if user.user_role == "student":
        query = query.filter(ChatHistory.student_id == user.id)
    else:
        query = query.filter(ChatHistory.faculty_id == user.id)
        
    msgs = query.limit(50).all()
    return {"messages": [{"query": m.query, "response": m.response,
                          "context_page": m.context_page, "date": str(m.created_at)} for m in msgs]}


@router.delete("/history/")
def clear_history(user=Depends(get_current_user_any), db: Session = Depends(get_db)):
    """Clear chat history for this user."""
    query = db.query(ChatHistory)
    if user.user_role == "student":
        query = query.filter(ChatHistory.student_id == user.id)
    else:
        query = query.filter(ChatHistory.faculty_id == user.id)
        
    query.delete()
    db.commit()
    return {"message": "Chat history cleared"}


@router.get("/suggestions/")
def suggestions(user=Depends(get_current_user_any), db: Session = Depends(get_db)):
    """Context-aware question suggestions based on user state."""
    if user.user_role != "student":
        return {"suggestions": [
            "How do I mark attendance?",
            "Show my timetable",
            "View pending leave requests",
            "What is the academic calendar?"
        ]}
    
    from backend.app.models import Attendance
    records = db.query(Attendance).filter(Attendance.student_id == user.id).all()
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
