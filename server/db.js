import dotenv from "dotenv";
import Database from "better-sqlite3";
import crypto from "crypto";

dotenv.config();
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = process.env.DATABASE_PATH || path.join(__dirname, "..", "data", "softstudy.db");

fs.mkdirSync(path.dirname(dbPath), { recursive: true });

export const db = new Database(dbPath);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  university TEXT,
  course TEXT,
  year TEXT,
  semester_progress REAL NOT NULL DEFAULT 0,
  is_verified INTEGER NOT NULL DEFAULT 0,
  verification_code TEXT,
  verification_email_sent INTEGER NOT NULL DEFAULT 0,
  password_reset_code TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS user_app_data (
  user_id TEXT PRIMARY KEY,
  tasks_json TEXT NOT NULL DEFAULT '[]',
  schedule_json TEXT NOT NULL DEFAULT '[]',
  settings_json TEXT NOT NULL DEFAULT '{}',
  deadline_alerts_json TEXT NOT NULL DEFAULT '{}',
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
`);

export function createUser({
  email,
  passwordHash,
  name,
  university,
  course,
  year,
  verificationCode,
  verificationEmailSent,
}) {
  const id = crypto.randomUUID();
  db.prepare(
    `
    INSERT INTO users (
      id, email, password_hash, name, university, course, year,
      verification_code, verification_email_sent, is_verified
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
  `
  ).run(
    id,
    email,
    passwordHash,
    name,
    university,
    course,
    year,
    verificationCode,
    verificationEmailSent ? 1 : 0
  );
  db.prepare(`INSERT INTO user_app_data (user_id) VALUES (?)`).run(id);
  return id;
}

export function findUserByEmail(email) {
  return db.prepare(`SELECT * FROM users WHERE email = ? COLLATE NOCASE`).get(email);
}

export function findUserById(id) {
  return db.prepare(`SELECT * FROM users WHERE id = ?`).get(id);
}

export function verifyUserEmail(userId) {
  db.prepare(
    `UPDATE users SET is_verified = 1, verification_code = NULL WHERE id = ?`
  ).run(userId);
}

export function setVerificationEmailSentByEmail(email, sent) {
  db.prepare(`UPDATE users SET verification_email_sent = ? WHERE email = ? COLLATE NOCASE`).run(
    sent ? 1 : 0,
    email
  );
}

export function setPasswordResetCode(email, code) {
  db.prepare(`UPDATE users SET password_reset_code = ? WHERE email = ? COLLATE NOCASE`).run(
    code,
    email
  );
}

export function updatePasswordHashByEmail(email, passwordHash) {
  db.prepare(
    `UPDATE users SET password_hash = ?, password_reset_code = NULL WHERE email = ? COLLATE NOCASE`
  ).run(passwordHash, email);
}

export function updateSemesterProgress(userId, progress) {
  db.prepare(`UPDATE users SET semester_progress = ? WHERE id = ?`).run(progress, userId);
}

export function updateProfile(userId, { name, email }) {
  const clash = db
    .prepare(`SELECT id FROM users WHERE email = ? COLLATE NOCASE AND id != ?`)
    .get(email, userId);
  if (clash) return { ok: false, error: "EMAIL_TAKEN" };
  db.prepare(`UPDATE users SET name = ?, email = ? WHERE id = ?`).run(name, email, userId);
  return { ok: true };
}

export function getAppData(userId) {
  const row = db.prepare(`SELECT * FROM user_app_data WHERE user_id = ?`).get(userId);
  if (!row) return null;
  return {
    tasks: JSON.parse(row.tasks_json || "[]"),
    scheduleItems: JSON.parse(row.schedule_json || "[]"),
    settings: JSON.parse(row.settings_json || "{}"),
    sentDeadlineAlerts: JSON.parse(row.deadline_alerts_json || "{}"),
  };
}

export function saveAppData(userId, { tasks, scheduleItems, settings, sentDeadlineAlerts, semesterProgress }) {
  const tasksJson = JSON.stringify(tasks ?? []);
  const schedJson = JSON.stringify(scheduleItems ?? []);
  const settingsJson = JSON.stringify(settings ?? {});
  const alertsJson = JSON.stringify(sentDeadlineAlerts ?? {});
  db.prepare(
    `
    INSERT INTO user_app_data (user_id, tasks_json, schedule_json, settings_json, deadline_alerts_json)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET
      tasks_json = excluded.tasks_json,
      schedule_json = excluded.schedule_json,
      settings_json = excluded.settings_json,
      deadline_alerts_json = excluded.deadline_alerts_json
  `
  ).run(userId, tasksJson, schedJson, settingsJson, alertsJson);
  if (typeof semesterProgress === "number" && !Number.isNaN(semesterProgress)) {
    updateSemesterProgress(userId, semesterProgress);
  }
}

export function serializeUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    semesterProgress: row.semester_progress ?? 0,
    university: row.university,
    course: row.course,
    year: row.year,
  };
}
