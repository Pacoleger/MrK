-- ============================================================
-- MrK Lernplattform – Datenbankschema
-- Cloudflare D1 (SQLite)
-- ============================================================

PRAGMA foreign_keys = ON;

-- ============================================================
-- 1. USERS
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id              TEXT PRIMARY KEY,                -- UUID v4
  email           TEXT NOT NULL UNIQUE,
  password_hash   TEXT NOT NULL,                   -- PBKDF2 hash (base64)
  password_salt   TEXT NOT NULL,                   -- Salt (base64)
  first_name      TEXT NOT NULL,
  last_name       TEXT NOT NULL,
  role            TEXT NOT NULL CHECK (role IN ('admin', 'teacher', 'student')),
  avatar_url      TEXT,
  is_active       INTEGER NOT NULL DEFAULT 1,      -- 0 = deaktiviert
  locale          TEXT NOT NULL DEFAULT 'de' CHECK (locale IN ('de', 'en', 'fr')),
  last_login_at   TEXT,                            -- ISO 8601
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role  ON users(role);

-- ============================================================
-- 2. ROLES (Lookup-Tabelle für Referenzen / Labels)
-- ============================================================
CREATE TABLE IF NOT EXISTS roles (
  id            TEXT PRIMARY KEY,                  -- 'admin', 'teacher', 'student'
  label_de      TEXT NOT NULL,
  label_en      TEXT NOT NULL,
  label_fr      TEXT NOT NULL,
  description   TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================
-- 3. SCHOOL_YEARS (Schuljahre)
-- ============================================================
CREATE TABLE IF NOT EXISTS school_years (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL UNIQUE,              -- z.B. '2025/2026'
  start_date    TEXT NOT NULL,                     -- YYYY-MM-DD
  end_date      TEXT NOT NULL,
  is_active     INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================
-- 4. CLASSES (Klassen)
-- ============================================================
CREATE TABLE IF NOT EXISTS classes (
  id              TEXT PRIMARY KEY,
  name            TEXT NOT NULL,                   -- z.B. '7A', '8B'
  grade_level     INTEGER NOT NULL CHECK (grade_level BETWEEN 5 AND 13),
  school_year_id  TEXT NOT NULL,
  homeroom_teacher_id TEXT,                        -- Klassenlehrer
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (school_year_id) REFERENCES school_years(id) ON DELETE CASCADE,
  FOREIGN KEY (homeroom_teacher_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_classes_school_year ON classes(school_year_id);
CREATE INDEX IF NOT EXISTS idx_classes_grade ON classes(grade_level);

-- ============================================================
-- 5. SUBJECTS (Fächer)
-- ============================================================
CREATE TABLE IF NOT EXISTS subjects (
  id            TEXT PRIMARY KEY,                  -- 'math', 'physics', 'chemistry', 'biology'
  name_de       TEXT NOT NULL,
  name_en       TEXT NOT NULL,
  name_fr       TEXT NOT NULL,
  icon          TEXT,                              -- z.B. 'sigma', 'atom'
  color         TEXT,                              -- Hex-Farbe für UI
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================
-- 6. CLASS_SUBJECTS (Verknüpfung Klasse <-> Fach <-> Lehrer)
-- ============================================================
CREATE TABLE IF NOT EXISTS class_subjects (
  id            TEXT PRIMARY KEY,
  class_id      TEXT NOT NULL,
  subject_id    TEXT NOT NULL,
  teacher_id    TEXT NOT NULL,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(class_id, subject_id),
  FOREIGN KEY (class_id)   REFERENCES classes(id)  ON DELETE CASCADE,
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
  FOREIGN KEY (teacher_id) REFERENCES users(id)    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_class_subjects_teacher ON class_subjects(teacher_id);

-- ============================================================
-- 7. CLASS_STUDENTS (Verknüpfung Klasse <-> Schüler)
-- ============================================================
CREATE TABLE IF NOT EXISTS class_students (
  id            TEXT PRIMARY KEY,
  class_id      TEXT NOT NULL,
  student_id    TEXT NOT NULL,
  enrolled_at   TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(class_id, student_id),
  FOREIGN KEY (class_id)   REFERENCES classes(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES users(id)   ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_class_students_student ON class_students(student_id);

-- ============================================================
-- 8. ASSIGNMENTS (Aufgaben / Hausaufgaben)
-- ============================================================
CREATE TABLE IF NOT EXISTS assignments (
  id                TEXT PRIMARY KEY,
  class_id          TEXT NOT NULL,
  subject_id        TEXT NOT NULL,
  teacher_id        TEXT NOT NULL,
  title             TEXT NOT NULL,
  description       TEXT,
  type              TEXT NOT NULL DEFAULT 'homework'
                    CHECK (type IN ('homework', 'exercise', 'test', 'quiz', 'project')),
  max_points        INTEGER NOT NULL DEFAULT 100,
  due_date          TEXT,                          -- ISO 8601
  is_published      INTEGER NOT NULL DEFAULT 0,
  solution_file_url TEXT,                          -- R2 URL (nur für Lehrer sichtbar)
  created_at        TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at        TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (class_id)   REFERENCES classes(id)  ON DELETE CASCADE,
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
  FOREIGN KEY (teacher_id) REFERENCES users(id)    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_assignments_class   ON assignments(class_id);
CREATE INDEX IF NOT EXISTS idx_assignments_teacher ON assignments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_assignments_due     ON assignments(due_date);

-- ============================================================
-- 9. SUBMISSIONS (Schüler-Abgaben)
-- ============================================================
CREATE TABLE IF NOT EXISTS submissions (
  id              TEXT PRIMARY KEY,
  assignment_id   TEXT NOT NULL,
  student_id      TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'not_started'
                  CHECK (status IN ('not_started', 'in_progress', 'submitted', 'graded')),
  content         TEXT,                            -- Textantwort
  started_at      TEXT,
  submitted_at    TEXT,
  time_spent_sec  INTEGER NOT NULL DEFAULT 0,      -- Bearbeitungsdauer in Sekunden
  view_count      INTEGER NOT NULL DEFAULT 0,      -- Wie oft geöffnet
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(assignment_id, student_id),
  FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id)    REFERENCES users(id)       ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_submissions_student  ON submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status   ON submissions(status);

-- ============================================================
-- 10. UPLOADS (Dateien: PDF, Bilder, Videos, Word)
-- ============================================================
CREATE TABLE IF NOT EXISTS uploads (
  id              TEXT PRIMARY KEY,
  submission_id   TEXT,                            -- Abgabe-Upload
  assignment_id   TEXT,                            -- Lehrer-Material
  uploader_id     TEXT NOT NULL,
  file_name       TEXT NOT NULL,
  file_key        TEXT NOT NULL,                   -- R2 Object Key
  file_type       TEXT NOT NULL,                   -- MIME-Type
  file_size       INTEGER NOT NULL,                -- Bytes
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE CASCADE,
  FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE,
  FOREIGN KEY (uploader_id)   REFERENCES users(id)       ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_uploads_submission ON uploads(submission_id);
CREATE INDEX IF NOT EXISTS idx_uploads_assignment ON uploads(assignment_id);

-- ============================================================
-- 11. GRADES (Bewertungen)
-- ============================================================
CREATE TABLE IF NOT EXISTS grades (
  id              TEXT PRIMARY KEY,
  submission_id   TEXT NOT NULL UNIQUE,
  grader_id       TEXT NOT NULL,                   -- Lehrer
  points          INTEGER NOT NULL DEFAULT 0,
  max_points      INTEGER NOT NULL DEFAULT 100,
  feedback        TEXT,
  stars_awarded   INTEGER NOT NULL DEFAULT 0,
  graded_at       TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE CASCADE,
  FOREIGN KEY (grader_id)     REFERENCES users(id)       ON DELETE CASCADE
);

-- ============================================================
-- 12. STAR_REWARDS (Sterne-Historie / Gamification)
-- ============================================================
CREATE TABLE IF NOT EXISTS star_rewards (
  id            TEXT PRIMARY KEY,
  user_id       TEXT NOT NULL,
  amount        INTEGER NOT NULL,                  -- positive oder negative Zahl
  reason        TEXT NOT NULL
                CHECK (reason IN ('assignment_completed', 'on_time_submission',
                                  'excellent_solution', 'bonus_task',
                                  'penalty', 'manual_adjustment')),
  reference_id  TEXT,                              -- z.B. submission_id
  note          TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_star_rewards_user ON star_rewards(user_id);

-- ============================================================
-- 13. BADGES (Abzeichen)
-- ============================================================
CREATE TABLE IF NOT EXISTS badges (
  id            TEXT PRIMARY KEY,
  code          TEXT NOT NULL UNIQUE,              -- z.B. 'first_assignment'
  name_de       TEXT NOT NULL,
  name_en       TEXT NOT NULL,
  name_fr       TEXT NOT NULL,
  description   TEXT,
  icon          TEXT,                              -- z.B. 'award', 'star'
  color         TEXT,
  star_threshold INTEGER,                          -- ab wie vielen Sternen vergeben
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================
-- 14. USER_BADGES (vergebene Abzeichen)
-- ============================================================
CREATE TABLE IF NOT EXISTS user_badges (
  id            TEXT PRIMARY KEY,
  user_id       TEXT NOT NULL,
  badge_id      TEXT NOT NULL,
  awarded_at    TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(user_id, badge_id),
  FOREIGN KEY (user_id)  REFERENCES users(id)  ON DELETE CASCADE,
  FOREIGN KEY (badge_id) REFERENCES badges(id) ON DELETE CASCADE
);

-- ============================================================
-- 15. NOTIFICATIONS (Benachrichtigungen)
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id            TEXT PRIMARY KEY,
  user_id       TEXT NOT NULL,
  type          TEXT NOT NULL
                CHECK (type IN ('new_assignment', 'deadline_soon', 'grade_published',
                                'new_material', 'star_earned', 'badge_earned',
                                'comment', 'system')),
  title         TEXT NOT NULL,
  message       TEXT,
  link_url      TEXT,                              -- Ziel-URL in der App
  is_read       INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read);

-- ============================================================
-- 16. ACTIVITY_LOGS (Fortschrittskontrolle / Audit)
-- ============================================================
CREATE TABLE IF NOT EXISTS activity_logs (
  id            TEXT PRIMARY KEY,
  user_id       TEXT NOT NULL,
  action        TEXT NOT NULL
                CHECK (action IN ('login', 'logout', 'view_assignment', 'start_assignment',
                                  'submit_assignment', 'upload_file', 'grade_submission',
                                  'create_assignment', 'update_profile', 'admin_action')),
  target_type   TEXT,                              -- z.B. 'assignment', 'user'
  target_id     TEXT,
  metadata      TEXT,                              -- JSON-String mit Details
  ip_address    TEXT,
  user_agent    TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_user   ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_activity_logs_time   ON activity_logs(created_at);

-- ============================================================
-- VIEWS (Komfort-Abfragen)
-- ============================================================

-- Punkte + Sterne + Level pro Schüler
CREATE VIEW IF NOT EXISTS v_student_stats AS
SELECT
  u.id              AS user_id,
  u.first_name,
  u.last_name,
  COALESCE(SUM(g.points), 0)                         AS total_points,
  COALESCE(SUM(g.max_points), 0)                     AS total_max_points,
  COALESCE(SUM(sr.amount), 0)                        AS total_stars,
  COUNT(DISTINCT s.id)                               AS total_submissions,
  SUM(CASE WHEN s.status = 'graded'     THEN 1 ELSE 0 END) AS graded_count,
  SUM(CASE WHEN s.status = 'submitted'  THEN 1 ELSE 0 END) AS submitted_count,
  SUM(CASE WHEN s.status = 'in_progress' THEN 1 ELSE 0 END) AS in_progress_count
FROM users u
LEFT JOIN submissions s  ON s.student_id = u.id
LEFT JOIN grades g       ON g.submission_id = s.id
LEFT JOIN star_rewards sr ON sr.user_id = u.id
WHERE u.role = 'student'
GROUP BY u.id;

-- Klassen-Rangliste (Sterne)
CREATE VIEW IF NOT EXISTS v_class_ranking AS
SELECT
  cs.class_id,
  u.id          AS student_id,
  u.first_name,
  u.last_name,
  COALESCE(SUM(sr.amount), 0) AS total_stars,
  RANK() OVER (PARTITION BY cs.class_id ORDER BY COALESCE(SUM(sr.amount), 0) DESC) AS rank
FROM class_students cs
JOIN users u ON u.id = cs.student_id
LEFT JOIN star_rewards sr ON sr.user_id = u.id
GROUP BY cs.class_id, u.id;
