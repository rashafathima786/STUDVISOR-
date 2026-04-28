"""
Seed missing data for empty student pages.
Run from the project root:
  python backend/seed_missing.py
"""
import sys, os, random
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')))

from datetime import datetime, timedelta
from backend.app.database import SessionLocal
from backend.app.models import (
    Student, Faculty, Subject, ExamSchedule, Assignment, Note,
    PlacementDrive, Event, LostFound, LeaveRequest
)

db = SessionLocal()
INST_ID = "Studvisor_college"

def future(days): return (datetime.now() + timedelta(days=days)).strftime("%Y-%m-%d")
def past(days): return (datetime.now() - timedelta(days=days)).strftime("%Y-%m-%d")

student = db.query(Student).filter(Student.username == "aarav_sharma").first()
subjects = db.query(Subject).all()
faculty_list = db.query(Faculty).all()

# ── 1. Patch Faculty cabin/phone/office_hours ─────────────────────────────
faculty_extras = [
    ("Dr. Rajesh Kumar", "A-101", "+91 98765 43210", "Mon-Fri 10am-12pm"),
    ("Dr. Priya Sharma", "B-203", "+91 98123 45678", "Tue-Thu 2pm-4pm"),
    ("Dr. Anand Verma", "C-305", "+91 97654 32109", "Mon-Wed 11am-1pm"),
    ("Dr. Meena Patel", "D-102", "+91 96543 21098", "Mon-Fri 9am-11am"),
    ("Dr. Suresh Reddy", "E-201", "+91 95432 10987", "Wed-Fri 3pm-5pm"),
    ("Prof. Lakshmi Iyer", "F-104", "+91 94321 09876", "Tue-Thu 10am-12pm"),
    ("Prof. Deepak Singh", "G-203", "+91 93210 98765", "Mon-Fri 1pm-3pm"),
]
for name, cabin, phone, hours in faculty_extras:
    fac = db.query(Faculty).filter(Faculty.name == name).first()
    if fac:
        fac.cabin = cabin
        fac.phone = phone
        fac.office_hours = hours
db.commit()
print("[OK] Faculty enriched")

# ── 2. Exam Schedules ─────────────────────────────────────────────────────
if db.query(ExamSchedule).count() == 0:
    exams = [
        ("CS101", "CIA2", future(5), "09:00", "10:30", "Room 101", 3),
        ("CS102", "CIA2", future(8), "09:00", "10:30", "Room 102", 3),
        ("CS103", "CIA2", future(12), "10:00", "11:30", "Room 103", 3),
        ("CS104", "CIA2", future(15), "10:00", "11:30", "Room 104", 3),
        ("EC101", "CIA2", future(10), "11:00", "12:30", "Hall A", 3),
        ("CS101", "Model", future(30), "09:00", "12:00", "Exam Hall 1", 3),
        ("CS102", "Model", future(32), "09:00", "12:00", "Exam Hall 1", 3),
        ("CS103", "Model", future(34), "09:00", "12:00", "Exam Hall 2", 3),
        ("CS104", "Model", future(36), "09:00", "12:00", "Exam Hall 2", 3),
        ("CS101", "University", future(60), "09:00", "12:00", "University Block", 3),
    ]
    for code, etype, date, stime, etime, venue, sem in exams:
        subj = db.query(Subject).filter(Subject.code == code).first()
        if subj:
            db.add(ExamSchedule(institution_id=INST_ID, subject_id=subj.id,
                exam_type=etype, exam_date=date, start_time=stime,
                end_time=etime, venue=venue, semester=sem))
    db.commit()
    print(f"[OK] {len(exams)} exams seeded")
else:
    print("[SKIP] Exams already exist")

# ── 3. Assignments ────────────────────────────────────────────────────────
if db.query(Assignment).count() == 0:
    assignments = [
        ("CS101", "Implement a Binary Search Tree", "Code a BST with insert, delete, search, and in-order, pre-order, post-order traversals in Python.", future(7), 20),
        ("CS102", "ER Diagram for Hospital Management System", "Design a comprehensive ER diagram covering patients, doctors, wards, and billing modules.", future(10), 15),
        ("CS103", "Producer-Consumer Problem", "Implement the classic producer-consumer synchronization problem using semaphores in C.", future(14), 25),
        ("CS104", "Subnetting Exercise", "Given a Class B address, subnet it into 6 departments with CIDR notation and routing tables.", future(6), 20),
        ("EC101", "Logic Gate Minimization", "Use Karnaugh maps to minimize Boolean expressions and draw the optimized circuit diagrams.", future(9), 20),
        ("CS101", "Graph Traversal Visualizer", "Build a simple web app to visually demonstrate BFS and DFS on a user-defined graph.", future(21), 30),
        ("CS102", "Stored Procedures and Triggers", "Write 5 stored procedures and 3 triggers for the university database schema using MySQL.", future(18), 25),
    ]
    fac = faculty_list[0] if faculty_list else None
    for code, title, desc, due, marks in assignments:
        subj = db.query(Subject).filter(Subject.code == code).first()
        if subj:
            db.add(Assignment(institution_id=INST_ID, subject_id=subj.id,
                faculty_id=fac.id if fac else None,
                title=title, description=desc, due_date=due, max_marks=marks))
    db.commit()
    print(f"[OK] {len(assignments)} assignments seeded")
else:
    print("[SKIP] Assignments already exist")

# ── 4. Study Notes ────────────────────────────────────────────────────────
if db.query(Note).count() == 0:
    notes = [
        ("CS101", "Data Structures — Complete Unit 1 Notes", "https://drive.google.com/example/ds-unit1"),
        ("CS101", "Trees & Graphs Cheat Sheet", "https://drive.google.com/example/trees-cheatsheet"),
        ("CS102", "SQL Query Bank — 50 Practice Questions", "https://drive.google.com/example/sql-practice"),
        ("CS102", "Normalization Forms — 1NF to BCNF with Examples", "https://drive.google.com/example/normalization"),
        ("CS103", "OS Scheduling Algorithms Summary", "https://drive.google.com/example/os-scheduling"),
        ("CS104", "Computer Networks — OSI Model Diagram", "https://drive.google.com/example/osi-model"),
        ("CS104", "TCP/IP Protocol Stack Detailed Notes", "https://drive.google.com/example/tcpip"),
        ("EC101", "Digital Electronics Gate-Level Design Notes", "https://drive.google.com/example/digital-elec"),
    ]
    for code, title, url in notes:
        subj = db.query(Subject).filter(Subject.code == code).first()
        if subj and student:
            db.add(Note(institution_id=INST_ID, subject_id=subj.id,
                uploaded_by=student.id, title=title,
                file_url=url, helpful_count=random.randint(5, 40)))
    db.commit()
    print(f"[OK] {len(notes)} notes seeded")
else:
    print("[SKIP] Notes already exist")

# ── 5. Placement Drives ───────────────────────────────────────────────────
if db.query(PlacementDrive).count() == 0:
    drives = [
        ("Google", "Software Engineer Intern", 12.0, "Work on Search, YouTube, or Maps. Stipend ₹1L/month.", 7.5, "CSE,ECE", future(20), future(12)),
        ("Microsoft", "Software Development Engineer", 18.0, "Join Azure or M365 team. Full-time SDE role with relocation.", 7.0, "CSE", future(28), future(18)),
        ("Infosys", "Systems Engineer", 3.6, "Entry-level SE role. Training at Mysuru campus provided.", 6.0, "CSE,ECE,EEE", future(15), future(8)),
        ("Wipro", "Project Engineer", 3.5, "Enterprise application development and maintenance projects.", 6.0, "CSE,ECE,MECH,CIVIL", future(18), future(10)),
        ("Amazon", "SDE-1", 22.0, "Join the world's largest cloud and e-commerce platform.", 7.5, "CSE", future(35), future(22)),
        ("TCS", "Assistant Systems Engineer", 3.36, "Multiple domains: BFS, Retail, Healthcare. Mass recruiter.", 5.5, "CSE,ECE,EEE,MECH,CIVIL", future(10), future(5)),
        ("Goldman Sachs", "Technology Analyst", 10.5, "Trading systems, risk analytics, and financial tech.", 8.0, "CSE,ECE", future(40), future(25)),
    ]
    for company, role, pkg, desc, cgpa_req, depts, drive_dt, last_dt in drives:
        db.add(PlacementDrive(institution_id=INST_ID, company_name=company,
            role_title=role, package_lpa=pkg, description=desc,
            eligibility_cgpa=cgpa_req, eligible_departments=depts,
            drive_date=drive_dt, last_date_apply=last_dt, status="Open"))
    db.commit()
    print(f"[OK] {len(drives)} placement drives seeded")
else:
    print("[SKIP] Placement drives already exist")

# ── 6. Campus Events ──────────────────────────────────────────────────────
if db.query(Event).count() == 0:
    events = [
        ("Hackathon 2026 — 24 Hour Challenge", "A 24-hour coding marathon open to all students. Cash prizes ₹1 Lakh!", future(8), "Innovation Lab, Block C", "CSE Department"),
        ("Annual Cultural Fest — Vibrance 2026", "Music, dance, drama, fashion competitions. Celebrity on Day 3!", future(14), "Open Air Auditorium", "Student Council"),
        ("Industry Connect — AI & ML Summit", "Guest lectures from Google and Microsoft. Panel on GenAI careers.", future(6), "Seminar Hall 1", "T&P Cell"),
        ("Blood Donation Camp", "Partner: Apollo Hospitals. Donors get refreshments and certificate.", future(3), "Medical Center, Block A", "NSS Club"),
        ("Inter-College Cricket Tournament", "8 colleges compete. Free entry for students. Food stalls available.", future(12), "Cricket Ground", "Sports Committee"),
        ("Photography Exhibition — Frames of Life", "100+ student works on display. Public voting open.", future(5), "Art Gallery, Main Block", "Photography Club"),
        ("Resume & Interview Workshop", "1-day intensive with HR professionals from top MNCs. Limited seats.", future(4), "Seminar Hall 2", "Career Development Centre"),
    ]
    for title, desc, date, venue, organizer in events:
        db.add(Event(institution_id=INST_ID, title=title, description=desc,
            event_date=date, venue=venue, organizer=organizer))
    db.commit()
    print(f"[OK] {len(events)} events seeded")
else:
    print("[SKIP] Events already exist")

# ── 7. Lost & Found ───────────────────────────────────────────────────────
if db.query(LostFound).count() == 0:
    items = [
        ("HP Laptop Bag", "Black HP bag with red zipper. Contains charger and notebook.", "Electronics", "lost", "Library 2nd Floor", "open"),
        ("Samsung Earphones", "White Samsung Galaxy earphones. Found near canteen.", "Electronics", "found", "Main Canteen", "open"),
        ("Blue Parker Pen", "Parker Jotter pen with gold trim. Name 'Arjun' engraved.", "Stationery", "lost", "Room 205, Block B", "open"),
        ("TI-84 Calculator", "Texas Instruments graphing calculator. Found in exam hall after CIA1.", "Electronics", "found", "Exam Hall 1", "open"),
        ("ID Card — Rohan Nair", "Student ID card found near sports complex entrance.", "Documents", "found", "Sports Complex", "claimed"),
        ("Purple Tupperware Bottle", "Large purple bottle with 'Kavya' written on it.", "Personal", "lost", "Cafeteria", "open"),
        ("Engineering Drawing Kit", "Drafter set with compass, scale, and protractor. Lost after workshop.", "Academic", "lost", "Workshop Block", "open"),
        ("Jansport Backpack", "Grey Jansport with astronomy keychains. Contains Python textbook.", "Bags", "lost", "Computer Lab 3", "open"),
    ]
    for name, desc, cat, typ, loc, status in items:
        db.add(LostFound(institution_id=INST_ID, student_id=student.id if student else None,
            item_name=name, description=desc, category=cat,
            type=typ, location=loc, status=status))
    db.commit()
    print(f"[OK] {len(items)} lost & found items seeded")
else:
    print("[SKIP] Lost & Found already exist")

# ── 8. Leave Requests ─────────────────────────────────────────────────────
if student and db.query(LeaveRequest).filter(LeaveRequest.student_id == student.id).count() == 0:
    fac = faculty_list[0] if faculty_list else None
    leaves = [
        ("Medical", past(30), past(28), "Suffered from viral fever. Doctor advised 3 days rest. Medical certificate attached.", "Approved"),
        ("Family", past(15), past(15), "Attended elder sister's wedding ceremony at native place in Jaipur.", "Faculty_Approved"),
        ("OD", past(5), past(4), "Representing college at inter-college coding competition at SRM University.", "HOD_Approved"),
        ("Personal", future(5), future(6), "Urgent family matter requires my presence at home town for 2 days.", "Pending"),
    ]
    for ltype, from_d, to_d, reason, status in leaves:
        db.add(LeaveRequest(institution_id=INST_ID, student_id=student.id,
            leave_type=ltype, from_date=from_d, to_date=to_d,
            reason=reason, status=status,
            faculty_advisor_id=fac.id if fac else None))
    db.commit()
    print(f"[OK] {len(leaves)} leave requests seeded")
else:
    print("[SKIP] Leave requests already exist")

db.close()
print("\n✅ All missing data seeded! Refresh your browser.")
