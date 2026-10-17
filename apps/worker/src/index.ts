import { handleRoom } from "./routes/rooms";
export { RoomDurableObject } from "./durable/room";

import type { Env } from "./types";
import { ok, notFound, fail } from "./lib/response";
import { handlePreflight, withCors } from "./lib/cors";

import { handleHealth } from "./routes/health";
import { handleDbCheck } from "./routes/db-check";
import { handleRegister } from "./routes/auth/register";
import { handleLogin } from "./routes/auth/login";
import { handleLogout } from "./routes/auth/logout";
import { handleMe } from "./routes/auth/me";

import { handleAssignments, handleAssignmentDetail, handleAssignmentSubmissions } from "./routes/assignments";
import { handleStartSubmission, handleHeartbeat, handleSubmit, handleGrade } from "./routes/submissions";
import { handleUpload, handleDownload, handleListUploads } from "./routes/uploads";
import { handleQuizzes, handleQuizDetail, handleStartQuizAttempt, handleSaveQuizAnswer, handleSubmitQuizAttempt, handleAssignQuiz, handleGetQuizAssignments } from "./routes/quizzes";
import { handleAdminStats, handleAdminUsers, handleAdminUpdateUser, handleApproveTeacher, handleAdminClasses, handleAdminDeleteClass, handleAdminClassDetail, handleAvailableStudents, handleAddStudentToClass, handleRemoveStudentFromClass, handleSetHomeroomTeacher, handleAdminTeachers, handleAdminSubjects, handleAddClassSubject, handleRemoveClassSubject, handleAdminSchoolYears } from "./routes/admin";
import { handleConversations, handleCreateConversation, handleMessages, handleSendMessage, handleChatUsers } from "./routes/chat";
import { handleNotifications, handleMarkRead, handleMarkAllRead } from "./routes/notifications";
import { handleMyStats } from "./routes/stats";
import { handleClasses, handleClassRanking, handleClassStudents, handlePublicClasses } from "./routes/classes";
import { handleMaterials, handleCreateMaterial, handleDeleteMaterial, handleMaterialDownload, handleSetMaterialAccess, handleGetMaterialAccess, handleMaterialSubjects } from "./routes/materials";

function matchPath(pattern: string, path: string): Record<string, string> | null {
  const patternParts = pattern.split("/").filter(Boolean);
  const pathParts = path.split("/").filter(Boolean);
  if (patternParts.length !== pathParts.length) return null;
  const params: Record<string, string> = {};
  for (let i = 0; i < patternParts.length; i++) {
    if (patternParts[i].startsWith(":")) {
      params[patternParts[i].slice(1)] = pathParts[i];
    } else if (patternParts[i] !== pathParts[i]) {
      return null;
    }
  }
  return params;
}

async function route(request: Request, env: Env, path: string, method: string): Promise<Response> {
  if (path === "/" || path === "/api") {
    return ok({ name: "MrK API", version: "0.8.0", environment: env.ENVIRONMENT });
  }

  if (path === "/api/health") return handleHealth(request, env);
  if (path === "/api/db-check") return handleDbCheck(request, env);

  if (path === "/api/auth/register") return handleRegister(request, env);
  if (path === "/api/auth/login") return handleLogin(request, env);
  if (path === "/api/auth/logout") return handleLogout(request, env);
  if (path === "/api/auth/me") return handleMe(request, env);

  if (path === "/api/assignments") return handleAssignments(request, env);
  {
    const mSub = matchPath("/api/assignments/:id/submissions", path);
    if (mSub) return handleAssignmentSubmissions(request, env, mSub.id);
    const m = matchPath("/api/assignments/:id", path);
    if (m) return handleAssignmentDetail(request, env, m.id);
  }

  {
    const mStart = matchPath("/api/submissions/start/:assignmentId", path);
    if (mStart) return handleStartSubmission(request, env, mStart.assignmentId);
    const mHeartbeat = matchPath("/api/submissions/heartbeat/:submissionId", path);
    if (mHeartbeat) return handleHeartbeat(request, env, mHeartbeat.submissionId);
    const mSubmit = matchPath("/api/submissions/submit/:submissionId", path);
    if (mSubmit) return handleSubmit(request, env, mSubmit.submissionId);
    const mGrade = matchPath("/api/submissions/grade/:submissionId", path);
    if (mGrade) return handleGrade(request, env, mGrade.submissionId);
  }

  if (path === "/api/uploads") return handleUpload(request, env);
  {
    const mDl = matchPath("/api/uploads/:id/download", path);
    if (mDl) return handleDownload(request, env, mDl.id);
    const mList = matchPath("/api/uploads/submission/:submissionId", path);
    if (mList) return handleListUploads(request, env, mList.submissionId);
  }

  if (path === "/api/quizzes") return handleQuizzes(request, env);
  {
    const mQuiz = matchPath("/api/quizzes/:id", path);
    if (mQuiz) return handleQuizDetail(request, env, mQuiz.id);
    const mStartQuiz = matchPath("/api/quizzes/:id/attempt", path);
    if (mStartQuiz) return handleStartQuizAttempt(request, env, mStartQuiz.id);
  }
  {
    const mAssign = matchPath("/api/quizzes/:id/assign", path);
    if (mAssign) return handleAssignQuiz(request, env, mAssign.id);
    const mGetAssign = matchPath("/api/quizzes/:id/assignments", path);
    if (mGetAssign) return handleGetQuizAssignments(request, env, mGetAssign.id);
  }
  {
    const mAnswer = matchPath("/api/quiz-attempts/:id/answer", path);
    if (mAnswer) return handleSaveQuizAnswer(request, env, mAnswer.id);
    const mSubmitQuiz = matchPath("/api/quiz-attempts/:id/submit", path);
    if (mSubmitQuiz) return handleSubmitQuizAttempt(request, env, mSubmitQuiz.id);
  }

  if (path === "/api/notifications") return handleNotifications(request, env);
  if (path === "/api/notifications/read-all") return handleMarkAllRead(request, env);
  {
    const mNotif = matchPath("/api/notifications/:id/read", path);
    if (mNotif) return handleMarkRead(request, env, mNotif.id);
  }

  if (path === "/api/stats/me") return handleMyStats(request, env);

  if (path === "/api/classes/public") return handlePublicClasses(request, env);
  if (path === "/api/classes") return handleClasses(request, env);
  {
    const mStudents = matchPath("/api/classes/:id/students", path);
    if (mStudents) return handleClassStudents(request, env, mStudents.id);
    const mClass = matchPath("/api/classes/:id/ranking", path);
    if (mClass) return handleClassRanking(request, env, mClass.id);
  }

  if (path === "/api/materials" && method === "GET") return handleMaterials(request, env);
  if (path === "/api/materials/create" && method === "POST") return handleCreateMaterial(request, env);
  if (path === "/api/materials/subjects" && method === "GET") return handleMaterialSubjects(request, env);
  {
    const mDownload = matchPath("/api/materials/:id/download", path);
    if (mDownload && method === "GET") return handleMaterialDownload(request, env, mDownload.id);
    const mAccess = matchPath("/api/materials/:id/access", path);
    if (mAccess) {
      if (method === "GET") return handleGetMaterialAccess(request, env, mAccess.id);
      if (method === "POST") return handleSetMaterialAccess(request, env, mAccess.id);
    }
    const mDelete = matchPath("/api/materials/:id", path);
    if (mDelete && method === "DELETE") return handleDeleteMaterial(request, env, mDelete.id);
  }

  if (path === "/api/admin/stats") return handleAdminStats(request, env);
  if (path === "/api/admin/users") return handleAdminUsers(request, env);
  {
    const m = matchPath("/api/admin/users/:id", path);
    if (m) return handleAdminUpdateUser(request, env, m.id);
  }
  {
    const m = matchPath("/api/admin/users/:id/approve", path);
    if (m) return handleApproveTeacher(request, env, m.id);
  }
  if (path === "/api/admin/classes") return handleAdminClasses(request, env);
  {
    const mAvail = matchPath("/api/admin/classes/:id/available-students", path);
    if (mAvail) return handleAvailableStudents(request, env, mAvail.id);
    const mAddStudent = matchPath("/api/admin/classes/:id/students", path);
    if (mAddStudent) return handleAddStudentToClass(request, env, mAddStudent.id);
    const mRemoveStudent = matchPath("/api/admin/classes/:classId/students/:studentId", path);
    if (mRemoveStudent) return handleRemoveStudentFromClass(request, env, mRemoveStudent.classId, mRemoveStudent.studentId);
    
    // HIER WAR DER FEHLER MIT DER AUSKOMMENTIERTEN ZEILE
    const mHomeroom = matchPath("/api/admin/classes/:id/homeroom", path);
    if (mHomeroom) return handleSetHomeroomTeacher(request, env, mHomeroom.id);

    const mAddSubject = matchPath("/api/admin/classes/:classId/subjects", path);
    if (mAddSubject && method === "POST") return handleAddClassSubject(request, env, mAddSubject.classId);
    const mRemoveSubject = matchPath("/api/admin/classes/:classId/subjects/:subjectId", path);
    if (mRemoveSubject && method === "DELETE") return handleRemoveClassSubject(request, env, mRemoveSubject.classId, mRemoveSubject.subjectId);
    const mDetail = matchPath("/api/admin/classes/:id", path);
    if (mDetail) return handleAdminClassDetail(request, env, mDetail.id);
  }
  if (path === "/api/admin/teachers") return handleAdminTeachers(request, env);
  if (path === "/api/admin/subjects") return handleAdminSubjects(request, env);
  if (path === "/api/admin/school-years") return handleAdminSchoolYears(request, env);

  if (path === "/api/chat/conversations") {
    if (method === "GET") return handleConversations(request, env);
    if (method === "POST") return handleCreateConversation(request, env);
  }
  {
    const mConv = matchPath("/api/chat/conversations/:id/messages", path);
    if (mConv) {
      if (method === "GET") return handleMessages(request, env, mConv.id);
      if (method === "POST") return handleSendMessage(request, env, mConv.id);
    }
  }
  if (path === "/api/chat/users") return handleChatUsers(request, env);

  // ============================================================
  // Rooms (WebSocket) - GANZ AM ENDE, VOR DEM 404
  // ============================================================
  if (path.startsWith("/api/rooms/")) {
    const roomId = path.replace("/api/rooms/", "");
    if (roomId) return handleRoom(request, env, roomId);
  }

  return notFound(`Route ${method} ${path} not found`);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    if (method === "OPTIONS") return handlePreflight(request);

    let response: Response;
    try {
      response = await route(request, env, path, method);
    } catch (error) {
      console.error("Unhandled error:", error);
      response = fail("INTERNAL_ERROR", error instanceof Error ? error.message : "Unknown error", 500);
    }
    return withCors(request, response);
  },
} satisfies ExportedHandler<Env>;
