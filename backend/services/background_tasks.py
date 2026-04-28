"""
v2.0 Background Tasks — Mood aggregation, audit persistence, and system maintenance.
"""
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from backend.app.models import MoodRawCheckin, MoodCheckin, Student
from sqlalchemy import func

def aggregate_mood_checkins(db: Session):
    """
    Groups raw checkins by (institution_id, batch_year, section) for the current week,
    computes averages, and stores in the aggregate MoodCheckin table.
    """
    now = datetime.utcnow()
    week_number = now.isocalendar()[1]
    
    # Get all distinct (inst, batch, section) from students who checked in this week
    groups = db.query(
        MoodRawCheckin.institution_id,
        Student.batch_year,
        Student.section
    ).join(Student, MoodRawCheckin.student_id == Student.id)\
     .filter(MoodRawCheckin.week_number == week_number)\
     .distinct().all()

    for inst_id, batch, sect in groups:
        # Get raw scores for this group
        raws = db.query(MoodRawCheckin.score)\
                 .join(Student, MoodRawCheckin.student_id == Student.id)\
                 .filter(
                     MoodRawCheckin.institution_id == inst_id,
                     Student.batch_year == batch,
                     Student.section == sect,
                     MoodRawCheckin.week_number == week_number
                 ).all()
        
        if not raws:
            continue
            
        scores = [r[0] for r in raws]
        avg_score = sum(scores) / len(scores)
        low_count = sum(1 for s in scores if s <= 2)
        high_count = sum(1 for s in scores if s >= 4)
        
        # Check if aggregate already exists for this week
        agg = db.query(MoodCheckin).filter(
            MoodCheckin.institution_id == inst_id,
            MoodCheckin.batch_year == batch,
            MoodCheckin.section == sect,
            MoodCheckin.week_number == week_number
        ).first()
        
        if agg:
            agg.average_score = avg_score
            agg.low_mood_count = low_count
            agg.high_mood_count = high_count
            agg.total_checkins = len(scores)
        else:
            db.add(MoodCheckin(
                institution_id=inst_id,
                batch_year=batch,
                section=sect,
                week_number=week_number,
                academic_year="2025-26",
                average_score=avg_score,
                low_mood_count=low_count,
                high_mood_count=high_count,
                total_checkins=len(scores)
            ))

    # Delete raw checkins for this week to preserve privacy (ADR-005)
    db.query(MoodRawCheckin).filter(MoodRawCheckin.week_number == week_number).delete()
    db.commit()
