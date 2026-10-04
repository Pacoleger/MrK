import type { Env } from "../types";
import { uuid } from "./crypto";

// ============================================================
// Gamification: Sterne, Badges, Level
// ============================================================

/**
 * Vergibt Sterne und schreibt in star_rewards.
 */
export async function awardStars(
  env: Env,
  userId: string,
  amount: number,
  reason: string,
  referenceId?: string,
  note?: string
): Promise<void> {
  await env.DB.prepare(
    `INSERT INTO star_rewards (id, user_id, amount, reason, reference_id, note)
     VALUES (?, ?, ?, ?, ?, ?)`
  )
    .bind(
      uuid(),
      userId,
      amount,
      reason,
      referenceId ?? null,
      note ?? null
    )
    .run();

  // Badges prüfen
  await checkAndAwardBadges(env, userId);
}

/**
 * Berechnet die Gesamt-Sterne eines Users.
 */
export async function getTotalStars(
  env: Env,
  userId: string
): Promise<number> {
  const result = await env.DB.prepare(
    "SELECT COALESCE(SUM(amount), 0) AS total FROM star_rewards WHERE user_id = ?"
  )
    .bind(userId)
    .first<{ total: number }>();
  return result?.total ?? 0;
}

/**
 * Berechnet das Level anhand der Sterne.
 * Level 1: Anfänger   (0-9)
 * Level 2: Forscher   (10-49)
 * Level 3: Wissenschaftler (50-149)
 * Level 4: Experte    (150-299)
 * Level 5: Meister    (300+)
 */
export function calculateLevel(stars: number): {
  level: number;
  name: string;
  minStars: number;
  nextLevelStars: number | null;
} {
  const levels = [
    { level: 1, name: "Anfänger",         min: 0,   next: 10 },
    { level: 2, name: "Forscher",         min: 10,  next: 50 },
    { level: 3, name: "Wissenschaftler",  min: 50,  next: 150 },
    { level: 4, name: "Experte",          min: 150, next: 300 },
    { level: 5, name: "Meister",          min: 300, next: null },
  ];

  for (let i = levels.length - 1; i >= 0; i--) {
    if (stars >= levels[i].min) {
      return {
        level: levels[i].level,
        name: levels[i].name,
        minStars: levels[i].min,
        nextLevelStars: levels[i].next,
      };
    }
  }

  return { level: 1, name: "Anfänger", minStars: 0, nextLevelStars: 10 };
}

/**
 * Prüft und vergibt Badges basierend auf Sterne-Threshold.
 */
async function checkAndAwardBadges(env: Env, userId: string): Promise<void> {
  const totalStars = await getTotalStars(env, userId);

  // Alle Badges mit star_threshold holen
  const badges = await env.DB.prepare(
    `SELECT id, code, star_threshold FROM badges WHERE star_threshold IS NOT NULL`
  ).all<{ id: string; code: string; star_threshold: number }>();

  for (const badge of badges.results ?? []) {
    if (totalStars >= badge.star_threshold) {
      // Prüfe, ob User dieses Badge schon hat
      const existing = await env.DB.prepare(
        "SELECT id FROM user_badges WHERE user_id = ? AND badge_id = ?"
      )
        .bind(userId, badge.id)
        .first<{ id: string }>();

      if (!existing) {
        await env.DB.prepare(
          "INSERT INTO user_badges (id, user_id, badge_id) VALUES (?, ?, ?)"
        )
          .bind(uuid(), userId, badge.id)
          .run();

        // Notification erstellen
        await env.DB.prepare(
          `INSERT INTO notifications (id, user_id, type, title, message)
           VALUES (?, ?, 'badge_earned', ?, ?)`
        )
          .bind(
            uuid(),
            userId,
            "Neues Abzeichen!",
            `Du hast das Abzeichen "${badge.code}" erhalten.`
          )
          .run();
      }
    }
  }
}

/**
 * Erstellt eine Benachrichtigung.
 */
export async function createNotification(
  env: Env,
  userId: string,
  type: string,
  title: string,
  message: string,
  linkUrl?: string
): Promise<void> {
  await env.DB.prepare(
    `INSERT INTO notifications (id, user_id, type, title, message, link_url)
     VALUES (?, ?, ?, ?, ?, ?)`
  )
    .bind(uuid(), userId, type, title, message, linkUrl ?? null)
    .run();
}
