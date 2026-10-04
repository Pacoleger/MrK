import type { Env } from "../types";
import { uuid } from "./crypto";

// ============================================================
// Activity Logging (DSGVO-konform, aber anonymisierbar)
// ============================================================

type Action =
  | "login"
  | "logout"
  | "view_assignment"
  | "start_assignment"
  | "submit_assignment"
  | "upload_file"
  | "grade_submission"
  | "create_assignment"
  | "update_profile"
  | "admin_action";

interface LogParams {
  userId: string;
  action: Action;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
  request?: Request;
}

export async function logActivity(
  env: Env,
  params: LogParams
): Promise<void> {
  try {
    const { userId, action, targetType, targetId, metadata, request } = params;

    const ip = request?.headers.get("CF-Connecting-IP") ?? null;
    const userAgent = request?.headers.get("User-Agent") ?? null;
    const metaJson = metadata ? JSON.stringify(metadata) : null;

    await env.DB.prepare(
      `INSERT INTO activity_logs
        (id, user_id, action, target_type, target_id, metadata, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        uuid(),
        userId,
        action,
        targetType ?? null,
        targetId ?? null,
        metaJson,
        ip,
        userAgent
      )
      .run();
  } catch (err) {
    // Logging darf den Request nicht killen
    console.error("logActivity failed:", err);
  }
}
