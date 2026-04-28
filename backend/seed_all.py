"""
Seed all tables with realistic demo data for testing.
Run: python -m backend.seed_all
"""
import sys, os, random
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.app.database import SessionLocal, engine
from backend.app.models import *
from backend.core.security import hash_password
from backend.app.database import Base

Base.metadata.create_all(bind=engine)
db = SessionLocal()

DEPARTMENTS = ["CSE", "ECE", "MECH", "CIVIL", "EEE"]
SUBJECTS = [
    ("CS101", "Data Structures", 4, 3, "CSE"),
    ("CS102", "Database Systems", 4, 3, "CSE"),
    ("CS103", "Operating Systems", 3, 4, "CSE"),
    ("CS104", "Computer Networks", 3, 4, "CSE"),
    ("CS201", "Machine Learning", 4, 5, "CSE"),
    ("CS202", "Web Technologies", 3, 5, "CSE"),
    ("CS203", "Software Engineering", 3, 5, "CSE"),
    ("CS301", "Cloud Computing", 3, 6, "CSE"),
    ("EC101", "Digital Electronics", 4, 3, "ECE"),
    ("EC102", "Signals & Systems", 4, 4, "ECE"),
    ("MA101", "Engineering Mathematics I", 4, 1, "CSE"),
    ("MA102", "Engineering Mathematics II", 4, 2, "CSE"),
    ("PH101", "Engineering Physics", 3, 1, "CSE"),
    ("CH101", "Engineering Chemistry", 3, 2, "CSE"),
    ("ME101", "Engineering Graphics", 3, 1, "MECH"),
]

FACULTY_NAMES = [
    ("Dr. Rajesh Kumar", "CSE", "Professor", "CS101,CS103"),
    ("Dr. Priya Sharma", "CSE", "Associate Professor", "CS102,CS201"),
    ("Dr. Anand Verma", "CSE", "Assistant Professor", "CS104,CS202"),
    ("Dr. Meena Patel", "ECE", "HOD", "EC101,EC102"),
    ("Dr. Suresh Reddy", "CSE", "HOD", "CS203,CS301"),
    ("Prof. Lakshmi Iyer", "CSE", "Assistant Professor", "MA101,MA102"),
    ("Prof. Deepak Singh", "CSE", "Lecturer", "PH101,CH101"),
]

STUDENT_NAMES = [
    "Aarav Sharma", "Vivaan Patel", "Aditi Reddy", "Ananya Kumar",
    "Ishaan Verma", "Diya Gupta", "Arjun Singh", "Meera Iyer",
    "Rohan Nair", "Kavya Menon", "Siddharth Joshi", "Priya Rajan",
    "Arnav Mishra", "Sneha Pillai", "Vikram Desai", "Tanvi Hegde",
    "Aditya Rao", "Pooja Bhat", "Karthik Suresh", "Nisha Agarwal",
    "Rahul Krishnan", "Swati Pandey", "Dev Malhotra", "Riya Saxena",
    "Abhinav Thakur",
]

print("[SEED] Seeding database...")

# ─── Admin ───────────────────────────────────────────────────────────────────
INST_ID = "Studvisor_college"
ADMIN_PWD = os.getenv("SEED_ADMIN_PASSWORD", "admin123")
FACULTY_PWD = os.getenv("SEED_FACULTY_PASSWORD", "faculty123")
STUDENT_PWD = os.getenv("SEED_STUDENT_PASSWORD", "student123")

if not db.query(Admin).first():
    db.add(Admin(username="admin", institution_id=INST_ID, email="admin@Studvisor.edu", hashed_password=hash_password(ADMIN_PWD), full_name="System Administrator"))
    db.commit()
    print("  [OK] Admin created")

# ─── Subjects ────────────────────────────────────────────────────────────────
for code, name, credits, sem, dept in SUBJECTS:
    if not db.query(Subject).filter(Subject.code == code).first():
        db.add(Subject(code=code, institution_id=INST_ID, name=name, credits=credits, semester=sem, department=dept))
db.commit()
print(f"  [OK] {len(SUBJECTS)} subjects seeded")

# ─── Faculty ─────────────────────────────────────────────────────────────────
for name, dept, desig, subjects in FACULTY_NAMES:
    username = name.lower().replace(" ", "_").replace(".", "")
    if not db.query(Faculty).filter(Faculty.name == name).first():
        db.add(Faculty(username=username, institution_id=INST_ID, email=f"{username}@Studvisor.edu", hashed_password=hash_password(FACULTY_PWD), name=name, department=dept, designation=desig, subjects_teaching=subjects))
db.commit()
print(f"  [OK] {len(FACULTY_NAMES)} faculty seeded")

# ─── Students ────────────────────────────────────────────────────────────────
for i, name in enumerate(STUDENT_NAMES):
    username = name.lower().replace(" ", "_")
    if not db.query(Student).filter(Student.username == username).first():
        sem = random.choice([3, 4, 5, 6])
        db.add(Student(username=username, institution_id=INST_ID, email=f"{username}@Studvisor.edu", hashed_password=hash_password(STUDENT_PWD), full_name=name, department=random.choice(["CSE", "ECE"]), semester=sem, batch_year=2023, section=random.choice(["A", "B"]), roll_number=f"21{random.choice(DEPARTMENTS[:2])}{100+i}", merit_points=random.randint(0, 500), merit_tier=random.choice(["Novice", "Bronze", "Silver", "Gold"])))
db.commit()
print(f"  [OK] {len(STUDENT_NAMES)} students seeded")

# ─── Attendance ──────────────────────────────────────────────────────────────
students = db.query(Student).all()
subjects = db.query(Subject).all()
attendance_count = 0

if not db.query(Attendance).first():
    for student in students:
        sem_subjects = [s for s in subjects if s.semester == student.semester]
        for subj in sem_subjects[:4]:
            for day in range(1, 61):
                month = (day // 30) + 1
                d = f"2026-{month:02d}-{(day % 28) + 1:02d}"
                for hour in [1, 2, 3]:
                    status = random.choices(["P", "A", "DL"], weights=[80, 15, 5])[0]
                    db.add(Attendance(institution_id=INST_ID, student_id=student.id, subject_id=subj.id, date=d, hour=hour, status=status))
                    attendance_count += 1
    db.commit()
    print(f"  [OK] {attendance_count} attendance records seeded")
else:
    print("  [SKIP] Attendance records already exist, skipping")

# ─── Marks ───────────────────────────────────────────────────────────────────
marks_count = 0
if not db.query(Mark).first():
    for student in students:
        sem_subjects = [s for s in subjects if s.semester == student.semester]
        for subj in sem_subjects[:4]:
            for atype in ["Internal", "Assignment", "Lab"]:
                max_m = 100 if atype == "Internal" else 50
                db.add(Mark(institution_id=INST_ID, student_id=student.id, subject_id=subj.id, marks_obtained=round(random.uniform(30, max_m), 1), max_marks=max_m, assessment_type=atype, semester=str(student.semester)))
                marks_count += 1
    db.commit()
    print(f"  [OK] {marks_count} marks seeded")
else:
    print("  [SKIP] Marks already exist, skipping")

# ─── Leave Requests ──────────────────────────────────────────────────────────
for s in students[:10]:
    db.add(LeaveRequest(institution_id=INST_ID, student_id=s.id, leave_type=random.choice(["Medical", "Personal", "OD"]), from_date="2026-03-15", to_date="2026-03-17", reason="Medical appointment / family event", status=random.choice(["Pending", "Approved", "Rejected"])))
db.commit()
print("  [OK] Leave requests seeded")

# ─── Complaints ──────────────────────────────────────────────────────────────
for s in students[:5]:
    db.add(Complaint(institution_id=INST_ID, student_id=s.id, title=random.choice(["WiFi not working", "AC issue in classroom", "Lab equipment broken"]), description="This issue has been ongoing and affecting studies.", category=random.choice(["infrastructure", "academic", "general"]), urgency=random.choice(["Low", "Medium", "High"])))
db.commit()
print("  [OK] Complaints seeded")

# ─── Events ──────────────────────────────────────────────────────────────────
events = [
    ("TechFest 2026", "Annual technical symposium", "2026-04-20", "Main Auditorium"),
    ("Hackathon", "24-hour coding challenge", "2026-05-10", "CS Lab Complex"),
    ("Cultural Day", "Inter-department cultural fest", "2026-05-25", "Open Ground"),
]
for title, desc, date, venue in events:
    db.add(Event(institution_id=INST_ID, title=title, description=desc, event_date=date, venue=venue))
db.commit()
print("  [OK] Events seeded")

# ─── Library Books ───────────────────────────────────────────────────────────
books = [
    ("Introduction to Algorithms", "Thomas Cormen", "978-0262033848", "textbook", "CSE", 5),
    ("Database System Concepts", "Abraham Silberschatz", "978-0078022159", "textbook", "CSE", 3),
    ("Computer Networks", "Andrew Tanenbaum", "978-0132126953", "textbook", "CSE", 4),
    ("Operating System Concepts", "Abraham Silberschatz", "978-1119800361", "textbook", "CSE", 3),
    ("Clean Code", "Robert C. Martin", "978-0132350884", "reference", "CSE", 2),
    ("Design Patterns", "Gang of Four", "978-0201633610", "reference", "CSE", 2),
]
for title, author, isbn, cat, dept, copies in books:
    if not db.query(LibraryBook).filter(LibraryBook.isbn == isbn).first():
        db.add(LibraryBook(institution_id=INST_ID, title=title, author=author, isbn=isbn, category=cat, department=dept, total_copies=copies, available_copies=copies))
db.commit()
print(f"  [OK] {len(books)} library books seeded")

# ─── Placement Drives ───────────────────────────────────────────────────────
drives = [
    ("Google", "SDE Intern", 15, 8.5, "CSE,ECE"),
    ("Microsoft", "Software Engineer", 22, 8.0, "CSE"),
    ("Amazon", "Cloud Support Associate", 12, 7.5, "CSE,ECE"),
    ("Infosys", "Systems Engineer", 6, 6.5, "CSE,ECE,MECH"),
    ("TCS", "Digital Engineer", 7, 6.0, "CSE,ECE,EEE"),
]
for company, role, pkg, cgpa, depts in drives:
    db.add(PlacementDrive(institution_id=INST_ID, company_name=company, role_title=role, package_lpa=pkg, eligibility_cgpa=cgpa, eligible_departments=depts, drive_date="2026-05-15", status="Open"))
db.commit()
print(f"  [OK] {len(drives)} placement drives seeded")

# ─── Announcements ──────────────────────────────────────────────────────────
announcements = [
    ("Mid-Semester Exams", "Mid-semester examinations will begin from May 5th, 2026.", "all"),
    ("Library Renovation", "The main library will be closed for renovation from May 1-3.", "all"),
    ("Placement Registration", "All final year students must register for campus placements.", "CSE"),
]
for title, content, scope in announcements:
    db.add(Announcement(institution_id=INST_ID, title=title, content=content, target_scope=scope))
db.commit()
print("  [OK] Announcements seeded")

# ─── Syllabus Topics ────────────────────────────────────────────────────────
cs101 = db.query(Subject).filter(Subject.code == "CS101").first()
if cs101:
    topics = [
        (1, "Arrays and Linked Lists"), (1, "Stacks and Queues"),
        (2, "Trees and Binary Search Trees"), (2, "AVL Trees and B-Trees"),
        (3, "Graph Algorithms"), (3, "BFS and DFS"),
        (4, "Sorting Algorithms"), (4, "Hashing"),
        (5, "Dynamic Programming"), (5, "Greedy Algorithms"),
    ]
    for unit, name in topics:
        db.add(SyllabusTopic(institution_id=INST_ID, subject_id=cs101.id, unit=unit, name=name, hours=3))
    db.commit()
    print("  [OK] Syllabus topics seeded")

# ─── Fee Structures & Student Fees ──────────────────────────────────────────
fee_types = [
    ("Tuition Fee", 75000, "tuition"), ("Lab Fee", 5000, "lab"),
    ("Exam Fee", 3000, "exam"), ("Transport Fee", 15000, "transport"),
]
for name, amount, cat in fee_types:
    if not db.query(FeeStructure).filter(FeeStructure.name == name).first():
        db.add(FeeStructure(institution_id=INST_ID, name=name, amount=amount, academic_year="2025-2026", category=cat, due_date="2026-06-30"))
db.commit()

structures = db.query(FeeStructure).all()
for s in students[:15]:
    for fs in structures:
        paid = random.choice([0, fs.amount * 0.5, fs.amount])
        status = "Paid" if paid >= fs.amount else "Partial" if paid > 0 else random.choice(["Pending", "Overdue"])
        db.add(StudentFee(institution_id=INST_ID, student_id=s.id, fee_structure_id=fs.id, amount_due=fs.amount, amount_paid=paid, due_date="2026-06-30", status=status))
db.commit()
print("  [OK] Fee structures and student fees seeded")

# ─── Calendar ────────────────────────────────────────────────────────────────
import calendar as cal
holidays = {"2026-01-26": "Republic Day", "2026-03-14": "Holi", "2026-04-14": "Tamil New Year", "2026-08-15": "Independence Day", "2026-10-02": "Gandhi Jayanti", "2026-11-01": "Diwali", "2026-12-25": "Christmas"}
for month in range(1, 13):
    for day in range(1, 29):
        d = f"2026-{month:02d}-{day:02d}"
        dn = cal.day_name[cal.weekday(2026, month, day)]
        is_working = 0 if dn in ("Saturday", "Sunday") else 1
        hol = holidays.get(d)
        if hol: is_working = 0
        if not db.query(AcademicCalendar).filter(AcademicCalendar.date == d).first():
            db.add(AcademicCalendar(institution_id=INST_ID, date=d, day_name=dn, is_working_day=is_working, holiday_name=hol, working_hours=8 if is_working else 0))
db.commit()
print("  [OK] Academic calendar seeded (2026)")

# ─── Timetable ───────────────────────────────────────────────────────────────
faculty_list = db.query(Faculty).all()
fac_map = {}
for f in faculty_list:
    for code in (f.subjects_teaching or "").split(","):
        code = code.strip()
        if code:
            subj = db.query(Subject).filter(Subject.code == code).first()
            if subj: fac_map[subj.id] = f.id

for subj in subjects[:8]:
    for day_idx, day in enumerate(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]):
        if random.random() < 0.4:
            hour = random.randint(1, 6)
            if not db.query(TimetableSlot).filter(TimetableSlot.day == day, TimetableSlot.hour == hour, TimetableSlot.semester == subj.semester).first():
                db.add(TimetableSlot(institution_id=INST_ID, subject_id=subj.id, faculty_id=fac_map.get(subj.id), day=day, hour=hour, room=f"Room {random.randint(101,305)}", section="A", semester=subj.semester))
db.commit()
print("  [OK] Timetable seeded")

db.close()
print("\n[DONE] Database seeded successfully! Login credentials:")
print("   Student: any name (e.g. aarav_sharma)")
print("   Faculty: dr_rajesh_kumar")
print("   Admin:   admin")
print("   Check .env for passwords (default: student123/faculty123/admin123)")

