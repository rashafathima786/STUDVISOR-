"""Fee management service — payment processing, overdue detection, receipt generation."""
from sqlalchemy.orm import Session
from datetime import datetime
from backend.app.models import FeeStructure, StudentFee, Payment, Student
from backend.services.notification_service import notification_dispatcher


class FeeService:

    def get_student_fees(self, db: Session, student_id: int) -> dict:
        fees = db.query(StudentFee).filter(StudentFee.student_id == student_id).all()
        total_due = sum(f.amount_due for f in fees)
        total_paid = sum(f.amount_paid for f in fees)
        overdue = [f for f in fees if f.status == "Overdue"]
        return {
            "total_due": total_due,
            "total_paid": total_paid,
            "pending": total_due - total_paid,
            "overdue_count": len(overdue),
            "overdue_amount": sum(f.amount_due - f.amount_paid for f in overdue),
            "fees": [{
                "id": f.id,
                "amount_due": f.amount_due,
                "amount_paid": f.amount_paid,
                "remaining": f.amount_due - f.amount_paid,
                "status": f.status,
                "due_date": f.due_date,
            } for f in fees]
        }

    def process_payment(self, db: Session, student_id: int, student_fee_id: int,
                        amount: float, payment_method: str, transaction_id: str = None) -> dict:
        fee = db.query(StudentFee).filter(
            StudentFee.id == student_fee_id, StudentFee.student_id == student_id
        ).first()
        if not fee:
            raise ValueError("Fee record not found")
        if amount <= 0:
            raise ValueError("Payment amount must be positive")
        if amount > (fee.amount_due - fee.amount_paid):
            raise ValueError("Payment exceeds remaining balance")

        payment = Payment(
            student_fee_id=fee.id, student_id=student_id,
            amount=amount, payment_method=payment_method,
            transaction_id=transaction_id,
        )
        db.add(payment)

        fee.amount_paid += amount
        if fee.amount_paid >= fee.amount_due:
            fee.status = "Paid"
        elif fee.amount_paid > 0:
            fee.status = "Partial"

        db.commit()

        # Notify student
        notification_dispatcher.send(
            db, student_id,
            "Payment Successful",
            f"₹{amount:,.0f} paid via {payment_method}. Receipt #{payment.id}",
            type="payment_success"
        )

        return {"receipt_id": payment.id, "amount": amount, "new_status": fee.status}

    def generate_receipt_html(self, db: Session, payment_id: int) -> str:
        payment = db.query(Payment).filter(Payment.id == payment_id).first()
        if not payment:
            return "<html><body><h1>Receipt not found</h1></body></html>"
        student = db.query(Student).filter(Student.id == payment.student_id).first()
        return f"""<html><head><style>
            body {{ font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 40px auto; padding: 20px; }}
            .header {{ text-align: center; border-bottom: 2px solid #1a1a2e; padding-bottom: 20px; }}
            .details {{ margin: 20px 0; }}
            .details td {{ padding: 8px 16px; }}
            .amount {{ font-size: 24px; color: #16a085; font-weight: bold; text-align: center; margin: 20px 0; }}
        </style></head><body>
        <div class="header"><h1>Studvisor</h1><h3>Payment Receipt</h3></div>
        <div class="amount">₹{payment.amount:,.2f}</div>
        <table class="details">
            <tr><td><b>Receipt #</b></td><td>{payment.id}</td></tr>
            <tr><td><b>Student</b></td><td>{student.full_name if student else 'N/A'}</td></tr>
            <tr><td><b>Method</b></td><td>{payment.payment_method}</td></tr>
            <tr><td><b>Transaction ID</b></td><td>{payment.transaction_id or 'N/A'}</td></tr>
            <tr><td><b>Date</b></td><td>{payment.paid_at}</td></tr>
        </table>
        <p style="text-align:center; margin-top:40px; color:#888;">This is a computer-generated receipt.</p>
        </body></html>"""

    def mark_overdue(self, db: Session) -> int:
        today = datetime.now().strftime("%Y-%m-%d")
        fees = db.query(StudentFee).filter(
            StudentFee.status.in_(["Pending", "Partial"]),
            StudentFee.due_date < today
        ).all()
        for f in fees:
            f.status = "Overdue"
        db.commit()
        return len(fees)


fee_service = FeeService()

