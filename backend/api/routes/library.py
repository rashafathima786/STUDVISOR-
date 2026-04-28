"""Library management routes."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from backend.core.security import get_current_student, require_role
from backend.app.database import get_db
from backend.app.models import LibraryBook, BookIssue

router = APIRouter(prefix="/library", tags=["Library"])

@router.get("/catalog")
def catalog(q: str = None, db: Session = Depends(get_db)):
    query = db.query(LibraryBook)
    if q: query = query.filter(LibraryBook.title.ilike(f"%{q}%") | LibraryBook.author.ilike(f"%{q}%"))
    books = query.order_by(LibraryBook.title).limit(50).all()
    return {"books": [{"id": b.id, "title": b.title, "author": b.author, "isbn": b.isbn, "category": b.category, "available_copies": b.available_copies, "shelf_location": b.shelf_location} for b in books]}

@router.get("/my-books")
def my_books(student=Depends(get_current_student), db: Session = Depends(get_db)):
    issues = db.query(BookIssue).filter(BookIssue.student_id == student.id, BookIssue.status.in_(["Issued", "Overdue"])).all()
    result = []
    for i in issues:
        book = db.query(LibraryBook).filter(LibraryBook.id == i.book_id).first()
        result.append({"issue_id": i.id, "title": book.title if book else "?", "issue_date": i.issue_date, "due_date": i.due_date, "status": i.status, "fine": i.fine_amount})
    return {"issued_books": result}

@router.post("/issue/{book_id}")
def issue_book(book_id: int, student=Depends(get_current_student), db: Session = Depends(get_db)):
    book = db.query(LibraryBook).filter(LibraryBook.id == book_id).first()
    if not book: raise HTTPException(404, "Book not found")
    if book.available_copies <= 0: raise HTTPException(400, "No copies available")
    today = datetime.now().strftime("%Y-%m-%d")
    due = (datetime.now() + timedelta(days=14)).strftime("%Y-%m-%d")
    db.add(BookIssue(book_id=book_id, student_id=student.id, issue_date=today, due_date=due))
    book.available_copies -= 1
    db.commit()
    return {"message": f"'{book.title}' issued", "due_date": due}

@router.post("/return/{issue_id}")
def return_book(issue_id: int, student=Depends(get_current_student), db: Session = Depends(get_db)):
    issue = db.query(BookIssue).filter(BookIssue.id == issue_id, BookIssue.student_id == student.id).first()
    if not issue: raise HTTPException(404, "Not found")
    issue.status = "Returned"
    issue.return_date = datetime.now().strftime("%Y-%m-%d")
    book = db.query(LibraryBook).filter(LibraryBook.id == issue.book_id).first()
    if book: book.available_copies += 1
    db.commit()
    return {"message": "Book returned"}
