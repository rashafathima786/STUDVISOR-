"""
Timetable conflict resolver — detects room double-bookings, faculty overlaps,
and student section clashes. Suggests alternative slots.
"""
from sqlalchemy.orm import Session
from collections import defaultdict
import random
from backend.app.models import TimetableSlot, Subject, Faculty


class TimetableConflictResolver:

    def detect_conflicts(self, db: Session) -> dict:
        """Find all scheduling conflicts in the current timetable."""
        slots = db.query(TimetableSlot).all()

        room_conflicts = []
        faculty_conflicts = []
        section_conflicts = []

        # Index by (day, hour)
        by_time = defaultdict(list)
        for s in slots:
            by_time[(s.day, s.hour)].append(s)

        for (day, hour), slot_list in by_time.items():
            # Room double-booking
            rooms = defaultdict(list)
            for s in slot_list:
                if s.room:
                    rooms[s.room].append(s)
            for room, room_slots in rooms.items():
                if len(room_slots) > 1:
                    subjects = []
                    for rs in room_slots:
                        subj = db.query(Subject).filter(Subject.id == rs.subject_id).first()
                        subjects.append(subj.name if subj else "?")
                    room_conflicts.append({
                        "day": day, "hour": hour, "room": room,
                        "subjects": subjects, "type": "ROOM_DOUBLE_BOOKING",
                    })

            # Faculty overlap
            fac_slots = defaultdict(list)
            for s in slot_list:
                if s.faculty_id:
                    fac_slots[s.faculty_id].append(s)
            for fid, fslots in fac_slots.items():
                if len(fslots) > 1:
                    fac = db.query(Faculty).filter(Faculty.id == fid).first()
                    subjects = []
                    for fs in fslots:
                        subj = db.query(Subject).filter(Subject.id == fs.subject_id).first()
                        subjects.append(subj.name if subj else "?")
                    faculty_conflicts.append({
                        "day": day, "hour": hour,
                        "faculty": fac.name if fac else "?",
                        "subjects": subjects, "type": "FACULTY_OVERLAP",
                    })

            # Section overlap (same section, same semester, same time)
            section_slots = defaultdict(list)
            for s in slot_list:
                key = (s.section, s.semester)
                section_slots[key].append(s)
            for (section, sem), sslots in section_slots.items():
                if len(sslots) > 1 and section:
                    subjects = []
                    for ss in sslots:
                        subj = db.query(Subject).filter(Subject.id == ss.subject_id).first()
                        subjects.append(subj.name if subj else "?")
                    section_conflicts.append({
                        "day": day, "hour": hour, "section": section,
                        "semester": sem, "subjects": subjects,
                        "type": "SECTION_OVERLAP",
                    })

        return {
            "room_conflicts": room_conflicts,
            "faculty_conflicts": faculty_conflicts,
            "section_conflicts": section_conflicts,
            "total_conflicts": len(room_conflicts) + len(faculty_conflicts) + len(section_conflicts),
        }

    def suggest_alternatives(self, db: Session, subject_id: int, section: str,
                             semester: int) -> list:
        """Find free slots that don't conflict with existing schedule."""
        slots = db.query(TimetableSlot).all()
        occupied = set()
        for s in slots:
            occupied.add((s.day, s.hour, s.room))
            if s.section == section and s.semester == semester:
                occupied.add((s.day, s.hour, "ANY"))

        days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
        hours = range(1, 7)
        rooms = list(set(s.room for s in slots if s.room))

        suggestions = []
        for day in days:
            for hour in hours:
                if (day, hour, "ANY") not in occupied:
                    free_rooms = [r for r in rooms if (day, hour, r) not in occupied]
                    if free_rooms:
                        suggestions.append({
                            "day": day, "hour": hour,
                            "available_rooms": free_rooms[:3],
                        })
                        if len(suggestions) >= 5:
                            return suggestions

        return suggestions


    def generate_timetable(self, db: Session, semester: int, section: str):
        """Simple greedy generator for a section."""
        subjects = db.query(Subject).filter(Subject.semester == semester).all()
        # Find which faculty teaches which subject (from subjects_teaching string in Faculty)
        from backend.app.models import Faculty
        faculties = db.query(Faculty).all()
        
        fac_map = {}
        for f in faculties:
            for s_code in (f.subjects_teaching or "").split(","):
                s_code = s_code.strip()
                if s_code:
                    subj = db.query(Subject).filter(Subject.code == s_code).first()
                    if subj: fac_map[subj.id] = f.id

        days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
        hours = range(1, 6)
        
        created = 0
        for subj in subjects:
            needed = 3 # 3 hours per week
            for day in days:
                for hour in hours:
                    if needed <= 0: break
                    
                    # Check if slot is free for this section/sem
                    existing = db.query(TimetableSlot).filter(
                        TimetableSlot.day == day, 
                        TimetableSlot.hour == hour,
                        TimetableSlot.section == section,
                        TimetableSlot.semester == semester
                    ).first()
                    
                    if not existing:
                        # Check if faculty is free
                        fid = fac_map.get(subj.id)
                        if fid:
                            fac_busy = db.query(TimetableSlot).filter(
                                TimetableSlot.day == day,
                                TimetableSlot.hour == hour,
                                TimetableSlot.faculty_id == fid
                            ).first()
                            if fac_busy: continue
                        
                        db.add(TimetableSlot(
                            subject_id=subj.id,
                            faculty_id=fid,
                            day=day,
                            hour=hour,
                            room=f"R-{random.randint(101,399)}",
                            section=section,
                            semester=semester
                        ))
                        needed -= 1
                        created += 1
                if needed <= 0: break
        
        db.commit()
        return created


conflict_resolver = TimetableConflictResolver()
