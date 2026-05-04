import axios from "axios";
import { getToken, saveToken } from "../utils/auth";

let base = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

// If we are on Vercel, force all API calls through the Vercel Proxy to bypass mobile adblockers
if (typeof window !== 'undefined' && window.location.hostname.includes("vercel.app")) {
  base = "/api";
} else {
  // Fix Mixed Content: Force HTTPS for production Railway URLs
  if (base.includes("up.railway.app")) {
    base = base.replace("http://", "https://");
    if (!base.startsWith("https://")) {
      base = "https://" + base.replace("https://", "");
    }
  }
}

export const API_BASE_URL = base;

const api = axios.create({
  baseURL: API_BASE_URL,
});

// ── Request interceptor — attach Bearer token ───────────────────────────────
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response interceptor — 401 token refresh ────────────────────────────────
let isRefreshing = false;
let failedQueue = [];

function processQueue(error, token = null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  failedQueue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (originalRequest.url?.includes("/auth/refresh") || originalRequest.url?.includes("/auth/login")) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem("erp_refresh_token");
        if (!refreshToken) throw new Error("No refresh token");

        const { data } = await axios.post(`${API_BASE_URL}/auth/refresh/`, {
          refresh_token: refreshToken,
        });

        const newToken = data.access_token;
        saveToken(newToken);
        if (data.refresh_token) {
          localStorage.setItem("erp_refresh_token", data.refresh_token);
        }

        api.defaults.headers.common.Authorization = `Bearer ${newToken}`;
        processQueue(null, newToken);

        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        // Trigger logout
        localStorage.removeItem("erp_token");
        localStorage.removeItem("erp_role");
        localStorage.removeItem("erp_user");
        localStorage.removeItem("erp_refresh_token");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// ── AUTH ─────────────────────────────────────────────────────────────────────

export async function loginUser(credentials) {
  const response = await api.post("/auth/login/", credentials);
  return response.data;
}

// ── PROFILE ─────────────────────────────────────────────────────────────────

export async function fetchProfile() {
  const response = await api.get("/auth/student/me/");
  return response.data;
}

// ── ATTENDANCE ──────────────────────────────────────────────────────────────

export async function fetchOverallAttendance() {
  const response = await api.get("/academic/attendance/overall/");
  return response.data;
}

export async function fetchSubjectAttendance() {
  const response = await api.get("/academic/attendance/subject-wise/");
  return response.data;
}

export async function fetchMissedClasses(params = {}) {
  const response = await api.get("/academic/attendance/missed-classes/", { params });
  return response.data;
}

export async function fetchBunkAlerts() {
  const response = await api.get("/academic/attendance/bunk-alerts/");
  return response.data;
}

export async function simulateBunk(missCount = 1, subjectCode = null) {
  const params = { miss_count: missCount };
  if (subjectCode) params.subject_code = subjectCode;
  const response = await api.get("/academic/attendance/simulate-bunk/", { params });
  return response.data;
}

export async function fetchHeatmap(year = 2026, month = 4) {
  const response = await api.get("/academic/attendance/heatmap/", { params: { year, month } });
  return response.data;
}

// ── MARKS ───────────────────────────────────────────────────────────────────

export async function fetchMarks() {
  const response = await api.get("/academic/marks/");
  return response.data;
}

// ── CALENDAR ────────────────────────────────────────────────────────────────

export async function fetchCalendarMonth(year = 2026, month = 4) {
  const response = await api.get("/campus/calendar/month/", { params: { year, month } });
  return response.data;
}

export async function fetchUpcomingHolidays() {
  const response = await api.get("/campus/calendar/upcoming-holidays/");
  return response.data;
}

// ── LEAVE ───────────────────────────────────────────────────────────────────

export async function fetchLeaveRequests() {
  const response = await api.get("/user/leave/requests/");
  return response.data;
}

export async function applyLeaveRequest(data) {
  const response = await api.post("/user/leave/requests/", data);
  return response.data;
}

// ── CHAT ────────────────────────────────────────────────────────────────────

export async function fetchChatHistory() {
  const response = await api.get("/campus/chat/history/");
  return response.data.messages || [];
}

export async function clearChatHistory() {
  const response = await api.delete("/campus/chat/history/");
  return response.data;
}

export async function sendChatMessage(query, contextPage = "dashboard") {
  const response = await api.post("/campus/chat/", { query, context_page: contextPage });
  return response.data;
}

export async function fetchChatWelcome() {
  const response = await api.get("/v2/ai/any/welcome/");
  return response.data;
}

export async function streamChatMessage(query, handlers = {}) {
  const token = getToken();
  const response = await fetch(`${API_BASE_URL}/campus/chat/stream/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ query, context_page: handlers.contextPage || "dashboard" }),
  });

  if (!response.ok || !response.body) {
    throw new Error("Unable to stream chatbot response.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let finalText = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split("\n\n");
    buffer = events.pop() || "";

    for (const rawEvent of events) {
      const event = parseSseEvent(rawEvent);
      if (!event) continue;

      if (event.type === "meta") {
        handlers.onMeta?.(event.data);
      }

      if (event.type === "chunk") {
        const chunk = typeof event.data === 'string' ? event.data : event.data.token;
        finalText += chunk;
        handlers.onChunk?.(chunk, finalText);
      }

      if (event.type === "done") {
        handlers.onDone?.(finalText);
      }
    }
  }

  return { reply: finalText };
}

function parseSseEvent(rawEvent) {
  const lines = rawEvent.split("\n");
  const eventLine = lines.find((line) => line.startsWith("event:"));
  const dataLine = lines.find((line) => line.startsWith("data:"));
  if (!eventLine || !dataLine) return null;

  const type = eventLine.replace("event:", "").trim();
  const rawData = dataLine.replace("data:", "").trim();

  try {
    return { type, data: JSON.parse(rawData) };
  } catch {
    return { type, data: rawData };
  }
}

// ── NOTIFICATIONS ───────────────────────────────────────────────────────────

export async function fetchNotifications() {
  const response = await api.get("/user/notifications/");
  return response.data;
}

// ── MERIT ───────────────────────────────────────────────────────────────────

export async function fetchMeritStatus() {
  const response = await api.get("/user/merit/my/");
  return response.data;
}

// ── TIMETABLE ───────────────────────────────────────────────────────────────

export async function fetchTimetable() {
  const response = await api.get("/academic/timetable/");
  return response.data;
}

export async function fetchTodaySchedule() {
  const response = await api.get("/academic/timetable/today/");
  return response.data;
}

// ── ANALYTICS ───────────────────────────────────────────────────────────────

export async function fetchPerformanceAnalytics() {
  const response = await api.get("/analytics/performance/");
  return response.data;
}

export async function predictCgpa(expectedMarks) {
  const response = await api.post("/analytics/predict-cgpa/", { expected_marks: expectedMarks });
  return response.data;
}

// ── ASSIGNMENTS ─────────────────────────────────────────────────────────────

export async function fetchAssignments() {
  const response = await api.get("/academic/assignments/");
  return response.data;
}

export async function submitAssignment(assignmentId) {
  const response = await api.post(`/academic/assignments/${assignmentId}/submit/`);
  return response.data;
}

// ── EXAMS ───────────────────────────────────────────────────────────────────

export async function fetchExams() {
  const response = await api.get("/academic/exams/");
  return response.data;
}

export async function fetchUpcomingExams() {
  const response = await api.get("/academic/exams/upcoming/");
  return response.data;
}

// ── SYLLABUS ────────────────────────────────────────────────────────────────

export async function fetchSyllabus() {
  const response = await api.get("/academic/syllabus/");
  return response.data;
}

export async function toggleSyllabusTopic(topicId) {
  const response = await api.post(`/syllabus/topics/${topicId}/toggle/`);
  return response.data;
}

// ── NOTES ───────────────────────────────────────────────────────────────────

export async function fetchNotes(subjectId = null) {
  const params = subjectId ? { subject_id: subjectId } : {};
  const response = await api.get("/academic/notes/", { params });
  return response.data;
}

export async function createNote(data) {
  const response = await api.post("/academic/notes/", data);
  return response.data;
}

export async function rateNote(noteId, isHelpful) {
  const response = await api.post(`/academic/notes/${noteId}/rate/`, null, { params: { helpful: isHelpful } });
  return response.data;
}

// ── ANONYMOUS CHAT ──────────────────────────────────────────────────────────

export async function fetchAnonPosts(category = null, sort = "recent") {
  const params = { sort };
  if (category && category !== "all") params.category = category;
  const response = await api.get("/campus/anon/posts/", { params });
  return response.data;
}

export async function createAnonPost(data) {
  const response = await api.post("/campus/anon/posts/", data);
  return response.data;
}

export async function reactToPost(postId, reactionType) {
  const response = await api.post(`/campus/anon/posts/${postId}/react/`, { reaction_type: reactionType });
  return response.data;
}

export async function flagPost(postId) {
  const response = await api.post(`/campus/anon/posts/${postId}/flag/`);
  return response.data;
}

// ── COMPLAINTS ──────────────────────────────────────────────────────────────

export async function fetchComplaints(filters = {}) {
  const response = await api.get("/campus/complaints/", { params: filters });
  return response.data;
}

export async function createComplaint(data) {
  const response = await api.post("/campus/complaints/", data);
  return response.data;
}

export async function upvoteComplaint(complaintId) {
  const response = await api.post(`/complaints/${complaintId}/upvote/`);
  return response.data;
}

// ── POLLS ───────────────────────────────────────────────────────────────────

export async function fetchPolls() {
  const response = await api.get("/campus/polls/");
  return response.data;
}

export async function createPoll(question, options, category = "campus") {
  const response = await api.post("/campus/polls/", { question, options, category });
  return response.data;
}

export async function votePoll(pollId, optionId) {
  const response = await api.post(`/campus/polls/${pollId}/vote/?option_id=${optionId}`);
  return response.data;
}

// ── HELPDESK ───────────────────────────────────────────────────────────────

export async function fetchFaqs() {
  const response = await api.get("/campus/helpdesk/faqs/");
  return response.data;
}

export async function fetchHelpdeskStats() {
  const response = await api.get("/campus/helpdesk/stats/");
  return response.data;
}

// ── EVENTS ──────────────────────────────────────────────────────────────────

export async function fetchEvents() {
  const response = await api.get("/campus/events/");
  return response.data;
}

export async function rsvpEvent(eventId) {
  const response = await api.post(`/campus/events/${eventId}/rsvp/`);
  return response.data;
}

// ── ANNOUNCEMENTS ───────────────────────────────────────────────────────────

export async function fetchAnnouncements() {
  const response = await api.get('/campus/announcements/');
  return response.data;
}

// ── FACULTY ─────────────────────────────────────────────────────────────────

export async function fetchFaculty(department = null) {
  const params = department ? { department } : {};
  const response = await api.get("/campus/faculty/directory/", { params });
  return response.data;
}

// ── LOST & FOUND ────────────────────────────────────────────────────────────

export async function fetchLostFound(itemType = null) {
  const params = {};
  if (itemType) params.item_type = itemType;
  const response = await api.get("/campus/lost-found/", { params });
  return response.data;
}

export async function createLostFoundItem(data) {
  const response = await api.post("/campus/lost-found/", data);
  return response.data;
}

export async function claimLostFoundItem(itemId) {
  const response = await api.post(`/lost-found/${itemId}/claim/`);
  return response.data;
}

// ── ACHIEVEMENTS ────────────────────────────────────────────────────────────

export async function fetchAchievements() {
  const response = await api.get("/user/achievements/my/");
  return response.data;
}

// ── LEADERBOARD ─────────────────────────────────────────────────────────────

export async function fetchLeaderboard(category = "merit") {
  const response = await api.get("/user/leaderboard/", { params: { category } });
  return response.data;
}

// ── GPA / CGPA ──────────────────────────────────────────────────────────────

export async function fetchSemesterGPA(semester) {
  const response = await api.get(`/academic/gpa/semester/${semester}/`);
  return response.data;
}

export async function fetchCGPA() {
  const response = await api.get("/academic/gpa/cgpa/");
  return response.data;
}

export async function fetchTranscript() {
  const response = await api.get("/academic/gpa/transcript/");
  return response.data;
}

// ── FEE MANAGEMENT ──────────────────────────────────────────────────────────

export async function fetchMyFees() {
  const response = await api.get("/campus/fees/my-fees/");
  return response.data;
}

export async function fetchFeeSummary() {
  const response = await api.get("/campus/fees/summary/");
  return response.data;
}

export async function makePayment(data) {
  const response = await api.post("/campus/fees/pay/", data);
  return response.data;
}

export async function fetchPaymentHistory() {
  const response = await api.get("/campus/fees/payments/");
  return response.data;
}

// ── LIBRARY ─────────────────────────────────────────────────────────────────

export async function fetchBooks(search = "") {
  const params = search ? { q: search } : {};
  const response = await api.get("/user/library/catalog/", { params });
  return response.data;
}

export async function fetchMyIssuedBooks() {
  const response = await api.get("/user/library/my-books/");
  return response.data;
}

// ── PLACEMENT ───────────────────────────────────────────────────────────────

export async function fetchPlacementDrives() {
  const response = await api.get('/campus/placement/drives/');
  return response.data;
}

export async function applyToDrive(driveId) {
  const response = await api.post(`/campus/placement/apply/${driveId}/`);
  return response.data;
}

export async function fetchMyApplications() {
  const response = await api.get("/campus/placement/my-applications/");
  return response.data;
}

// ══════════════════════════════════════════════════════════════════════════════
// FACULTY PORTAL APIs
// ══════════════════════════════════════════════════════════════════════════════

export async function fetchFacultyDashboard() {
  const response = await api.get("/faculty-portal/dashboard/");
  return response.data;
}

export async function fetchFacultyTimetable() {
  const response = await api.get("/faculty-portal/timetable/");
  return response.data;
}

export async function markAttendance(data) {
  const response = await api.post("/faculty-portal/attendance/mark/", data);
  return response.data;
}

export async function fetchAttendanceDefaulters() {
  const response = await api.get("/faculty-portal/attendance/defaulters/");
  return response.data;
}

export async function fetchPendingAmendments() {
  const response = await api.get("/faculty-portal/hod/attendance/pending/");
  return response.data;
}

export async function approveAmendment(reqId, approve = true, remarks = "") {
  const response = await api.put(`/faculty-portal/hod/attendance/approve/${reqId}/`, null, {
    params: { approve, remarks },
  });
  return response.data;
}

export async function uploadMarks(data) {
  const response = await api.post("/faculty-portal/marks/upload/", data);
  return response.data;
}

export async function publishMarks(subjectId, assessmentType) {
  const response = await api.post("/faculty-portal/marks/publish/", null, {
    params: { subject_id: subjectId, assessment_type: assessmentType },
  });
  return response.data;
}

export async function fetchMarkStatistics(subjectId) {
  const response = await api.get(`/faculty-portal/marks/statistics/${subjectId}/`);
  return response.data;
}

export async function fetchFacultyPendingLeaves() {
  const response = await api.get("/faculty-portal/leave/pending/");
  return response.data;
}

export async function approveFacultyLeave(leaveId) {
  const response = await api.put(`/faculty-portal/leave/${leaveId}/approve/`);
  return response.data;
}

export async function rejectFacultyLeave(leaveId, reason = "") {
  const response = await api.put(`/faculty-portal/leave/${leaveId}/reject/`, null, {
    params: { reason },
  });
  return response.data;
}

export async function fetchHodPendingLeaves() {
  const response = await api.get("/faculty-portal/hod/leave/pending/");
  return response.data;
}

export async function hodApproveLeave(leaveId) {
  const response = await api.put(`/faculty-portal/hod/leave/${leaveId}/approve/`);
  return response.data;
}

export async function fetchExistingMarks(subjectId, assessmentType) {
  const response = await api.get(`/faculty-portal/marks/get/${subjectId}/${assessmentType}/`);
  return response.data;
}

export async function fetchSubjectAttendanceStats(subjectId) {
  const response = await api.get(`/faculty-portal/attendance/subject-stats/${subjectId}/`);
  return response.data;
}

export async function fetchExistingAttendance(subjectId, date, hour) {
  const response = await api.get(`/faculty-portal/attendance/get/${subjectId}/${date}/${hour}/`);
  return response.data;
}

export async function createFacultyAnnouncement(data) {
  const response = await api.post("/faculty-portal/announcements/", data);
  return response.data;
}

export async function fetchFacultyAssignments() {
  const response = await api.get("/faculty-portal/assignments/");
  return response.data;
}

export async function createFacultyAssignment(data) {
  const response = await api.post("/faculty-portal/assignments/", data);
  return response.data;
}

export async function checkPlagiarism(assignmentId) {
  const response = await api.post(`/faculty-portal/assignments/check-plagiarism/${assignmentId}/`);
  return response.data;
}

export async function fetchFacultyLectureLogs() {
  const response = await api.get("/faculty-portal/lecture-logs/");
  return response.data;
}

export async function createLectureLog(data) {
  const response = await api.post("/faculty-portal/lecture-logs/", data);
  return response.data;
}

export async function fetchMySubjects() {
  const response = await api.get("/faculty-portal/my-subjects/");
  return response.data;
}

export async function fetchStudentsBySubject(subjectId) {
  const response = await api.get(`/faculty-portal/students-by-subject/${subjectId}/`);
  return response.data;
}

// ══════════════════════════════════════════════════════════════════════════════
// ADMIN PANEL APIs
// ══════════════════════════════════════════════════════════════════════════════

export async function fetchAdminDashboard() {
  const response = await api.get("/admin/dashboard/v2/");
  return response.data;
}

export async function fetchAllStudents(dept = null) {
  const params = dept ? { dept } : {};
  const response = await api.get("/admin/students/", { params });
  return response.data;
}

export async function createStudent(data) {
  const response = await api.post("/admin/students/", data);
  return response.data;
}

export async function fetchAllFaculty() {
  const response = await api.get("/admin/faculty/");
  return response.data;
}

export async function fetchPendingLeaves() {
  const response = await api.get("/admin/leaves/pending/");
  return response.data;
}

export async function updateLeaveStatus(leaveId, status) {
  const response = await api.put(`/admin/leaves/${leaveId}/`, { status });
  return response.data;
}

export async function fetchAttendanceReport() {
  const response = await api.get("/admin/reports/attendance/");
  return response.data;
}

export async function fetchFeesReport() {
  const response = await api.get("/admin/reports/fees/");
  return response.data;
}

export async function fetchMoodAnalytics(batchYear = null, section = null) {
  const params = {};
  if (batchYear) params.batch_year = batchYear;
  if (section) params.section = section;
  const response = await api.get("/admin/analytics/mood/", { params });
  return response.data;
}

export async function fetchStudentLectureLogs() {
  const response = await api.get("/academic/lecture-logs/my-logs/");
  return response.data;
}

export default api;
