import requests

BASE_URL = "http://127.0.0.1:8000"

def test_api():
    # 1. Login
    login_data = {"username": "tejaswini", "password": "password"}
    response = requests.post(f"{BASE_URL}/auth/login", json=login_data)
    if response.status_code != 200:
        print(f"Login failed: {response.status_code} {response.text}")
        return
    
    token = response.json().get("access_token")
    headers = {"Authorization": f"Bearer {token}"}
    print("Login successful")
    
    # 1.5 Fetch Profile
    resp = requests.get(f"{BASE_URL}/auth/student/me", headers=headers)
    if resp.status_code == 200:
        me = resp.json()
        print(f"Logged in as: {me.get('full_name')} (ID: {me.get('id')}), Semester: {me.get('semester')}")
    else:
        print(f"Failed to fetch profile: {resp.status_code}")
    
    # 2. Fetch Academics Data
    endpoints = [
        "/academic/timetable/today",
        "/academic/assignments",
        "/academic/syllabus",
        "/academic/lecture-logs/my-logs",
        "/academic/attendance/overall",
        "/academic/attendance/subject-wise",
        "/academic/attendance/bunk-alerts",
        "/academic/gpa/cgpa"
    ]
    
    for ep in endpoints:
        resp = requests.get(f"{BASE_URL}{ep}", headers=headers)
        print(f"\nEndpoint: {ep}")
        if resp.status_code == 200:
            data = resp.json()
            if "timetable" in data:
                print(f"  Slots: {len(data['timetable'])}")
            elif "assignments" in data:
                print(f"  Assignments: {len(data['assignments'])}")
            elif "syllabus" in data:
                print(f"  Syllabus Subjects: {len(data['syllabus'])}")
            else:
                print(f"  Data: {data}")
        else:
            print(f"  Error: {resp.status_code} {resp.text}")

if __name__ == "__main__":
    test_api()
