"""Fee management routes."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from backend.core.security import get_current_student, require_role
from backend.app.database import get_db
from backend.app.models import FeeStructure, StudentFee, Payment

router = APIRouter(prefix="/fees", tags=["Fees"])

@router.get("/my-fees/")
def my_fees(student=Depends(get_current_student), db: Session = Depends(get_db)):
    fees = db.query(StudentFee).filter(StudentFee.student_id == student.id).all()
    result = []
    for f in fees:
        structure = db.query(FeeStructure).filter(FeeStructure.id == f.fee_structure_id).first()
        result.append({"id": f.id, "name": structure.name if structure else "Fee", "due": f.amount_due, "paid": f.amount_paid, "remaining": f.amount_due - f.amount_paid, "status": f.status, "due_date": f.due_date})
    return {"fees": result}

@router.get("/summary/")
def fee_summary(student=Depends(get_current_student), db: Session = Depends(get_db)):
    fees = db.query(StudentFee).filter(StudentFee.student_id == student.id).all()
    total_due = sum(f.amount_due for f in fees)
    total_paid = sum(f.amount_paid for f in fees)
    overdue = sum(1 for f in fees if f.status == "Overdue")
    return {"total_due": total_due, "total_paid": total_paid, "pending": total_due - total_paid, "overdue_count": overdue}

class PaymentReq(BaseModel):
    student_fee_id: int
    amount: float
    payment_method: str = "upi"
    transaction_id: Optional[str] = None

@router.post("/pay/")
def make_payment(data: PaymentReq, student=Depends(get_current_student), db: Session = Depends(get_db)):
    fee = db.query(StudentFee).filter(StudentFee.id == data.student_fee_id, StudentFee.student_id == student.id).first()
    if not fee: raise HTTPException(404, "Fee not found")
    if data.amount <= 0: raise HTTPException(400, "Invalid amount")
    payment = Payment(student_fee_id=fee.id, student_id=student.id, amount=data.amount, payment_method=data.payment_method, transaction_id=data.transaction_id)
    db.add(payment)
    fee.amount_paid += data.amount
    fee.status = "Paid" if fee.amount_paid >= fee.amount_due else "Partial"
    db.commit()
    return {"message": f"Payment of ₹{data.amount} recorded", "receipt_id": payment.id}

@router.get("/payments/")
def payment_history(student=Depends(get_current_student), db: Session = Depends(get_db)):
    payments = db.query(Payment).filter(Payment.student_id == student.id).order_by(Payment.paid_at.desc()).all()
    return {"payments": [{"id": p.id, "amount": p.amount, "method": p.payment_method, "txn_id": p.transaction_id, "date": str(p.paid_at)} for p in payments]}
