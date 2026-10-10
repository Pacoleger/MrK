import type { Env } from "../types";
import {
  ok,
  fail,
  methodNotAllowed,
  notFound,
  serverError,
} from "../lib/response";
import { uuid } from "../lib/crypto";
import { requireAuth, isAuthError } from "../middleware/auth";

// ============================================================
// Types
// ============================================================

interface ConversationRow {
  id: string;
  user1_id: string;
  user2_id: string;
  last_message_at: string | null;
  created_at: string;
  other_id: string;
  other_first_name: string;
  other_last_name: string;
  other_role: string;
  other_avatar_url: string | null;
  last_message: string | null;
  last_sender_id: string | null;
  unread_count: number;
}

interface MessageRow {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  read_at: string | null;
  created_at: string;
  sender_first_name: string;
  sender_last_name: string;
  sender_avatar_url: string | null;
}

// ============================================================
// Hilfsfunktion
// ============================================================

async function findOrCreateConversation(
  env: Env,
  userId: string,
  otherUserId: string
): Promise<string> {
  if (userId === otherUserId) {
    throw new Error("Kann keine Konversation mit sich selbst erstellen");
  }

  const [u1, u2] = [userId, otherUserId].sort();

  const existing = await env.DB.prepare(
    "SELECT id FROM conversations WHERE user1_id = ? AND user2_id = ?"
  )
    .bind(u1, u2)
    .first<{ id: string }>();

  if (existing) return existing.id;

  const id = uuid();
  await env.DB.prepare(
    `INSERT INTO conversations (id, user1_id, user2_id)
     VALUES (?, ?, ?)`
  )
    .bind(id, u1, u2)
    .run();

  return id;
}

// ============================================================
// GET /api/chat/conversations
// ============================================================

export async function handleConversations(
  request: Request,
  env: Env
): Promise<Response> {
  const ctx = await requireAuth(request, env);
  if (isAuthError(ctx)) return ctx;

  if (request.method !== "GET") return methodNotAllowed(["GET"]);

  try {
    const userId = ctx.user.id;

    const result = await env.DB.prepare(
      `SELECT 
        c.id,
        c.user1_id,
        c.user2_id,
        c.last_message_at,
        c.created_at,
        CASE 
          WHEN c.user1_id = ? THEN c.user2_id
          ELSE c.user1_id
        END AS other_id,
        u.first_name AS other_first_name,
        u.last_name AS other_last_name,
        u.role AS other_role,
        u.avatar_url AS other_avatar_url,
        (SELECT content FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) AS last_message,
        (SELECT sender_id FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) AS last_sender_id,
        (SELECT COUNT(*) FROM messages 
         WHERE conversation_id = c.id 
           AND sender_id != ? 
           AND read_at IS NULL) AS unread_count
       FROM conversations c
       JOIN users u ON u.id = CASE 
         WHEN c.user1_id = ? THEN c.user2_id
         ELSE c.user1_id
       END
       WHERE c.user1_id = ? OR c.user2_id = ?
       ORDER BY COALESCE(c.last_message_at, c.created_at) DESC`
    )
      .bind(userId, userId, userId, userId, userId)
      .all<ConversationRow>();

    return ok({ conversations: result.results ?? [] });
  } catch (err) {
    console.error("conversations error:", err);
    return serverError();
  }
}

// ============================================================
// POST /api/chat/conversations
// ============================================================

export async function handleCreateConversation(
  request: Request,
  env: Env
): Promise<Response> {
  const ctx = await requireAuth(request, env);
  if (isAuthError(ctx)) return ctx;

  if (request.method !== "POST") return methodNotAllowed(["POST"]);

  let body: { otherUserId?: string };
  try {
    body = await request.json();
  } catch {
    return fail("INVALID_JSON", "Ungültiger Body", 400);
  }

  if (!body.otherUserId) {
    return fail("OTHER_USER_REQUIRED", "otherUserId ist erforderlich", 400);
  }

  if (body.otherUserId === ctx.user.id) {
    return fail(
      "SELF_CONVERSATION",
      "Du kannst keine Konversation mit dir selbst starten",
      400
    );
  }

  const other = await env.DB.prepare(
    "SELECT id, first_name, last_name, role, avatar_url FROM users WHERE id = ? AND is_active = 1"
  )
    .bind(body.otherUserId)
    .first<{
      id: string;
      first_name: string;
      last_name: string;
      role: string;
      avatar_url: string | null;
    }>();

  if (!other) {
    return notFound("Benutzer nicht gefunden");
  }

  try {
    const conversationId = await findOrCreateConversation(
      env,
      ctx.user.id,
      body.otherUserId
    );
    return ok({
      conversationId,
      other,
      message: "Konversation bereit",
    });
  } catch (err) {
    console.error("createConversation error:", err);
    return serverError(
      err instanceof Error ? err.message : "Fehler beim Erstellen"
    );
  }
}

// ============================================================
// GET /api/chat/conversations/:id/messages
// ============================================================

export async function handleMessages(
  request: Request,
  env: Env,
  conversationId: string
): Promise<Response> {
  const ctx = await requireAuth(request, env);
  if (isAuthError(ctx)) return ctx;

  if (request.method !== "GET") return methodNotAllowed(["GET"]);

  const conv = await env.DB.prepare(
    "SELECT user1_id, user2_id FROM conversations WHERE id = ?"
  )
    .bind(conversationId)
    .first<{ user1_id: string; user2_id: string }>();

  if (!conv) return notFound("Konversation nicht gefunden");

  if (conv.user1_id !== ctx.user.id && conv.user2_id !== ctx.user.id) {
    return fail("FORBIDDEN", "Kein Zugriff auf diese Konversation", 403);
  }

  try {
    const result = await env.DB.prepare(
      `SELECT 
        m.id, m.conversation_id, m.sender_id, m.content, m.read_at, m.created_at,
        u.first_name AS sender_first_name,
        u.last_name AS sender_last_name,
        u.avatar_url AS sender_avatar_url
       FROM messages m
       JOIN users u ON u.id = m.sender_id
       WHERE m.conversation_id = ?
       ORDER BY m.created_at ASC
       LIMIT 500`
    )
      .bind(conversationId)
      .all<MessageRow>();

    await env.DB.prepare(
      `UPDATE messages 
       SET read_at = datetime('now')
       WHERE conversation_id = ? 
         AND sender_id != ? 
         AND read_at IS NULL`
    )
      .bind(conversationId, ctx.user.id)
      .run();

    return ok({ messages: result.results ?? [] });
  } catch (err) {
    console.error("messages error:", err);
    return serverError();
  }
}

// ============================================================
// POST /api/chat/conversations/:id/messages
// ============================================================

export async function handleSendMessage(
  request: Request,
  env: Env,
  conversationId: string
): Promise<Response> {
  const ctx = await requireAuth(request, env);
  if (isAuthError(ctx)) return ctx;

  if (request.method !== "POST") return methodNotAllowed(["POST"]);

  let body: { content?: string };
  try {
    body = await request.json();
  } catch {
    return fail("INVALID_JSON", "Ungültiger Body", 400);
  }

  if (!body.content || !body.content.trim()) {
    return fail("CONTENT_REQUIRED", "Nachricht ist leer", 400);
  }

  const conv = await env.DB.prepare(
    "SELECT user1_id, user2_id FROM conversations WHERE id = ?"
  )
    .bind(conversationId)
    .first<{ user1_id: string; user2_id: string }>();

  if (!conv) return notFound("Konversation nicht gefunden");

  if (conv.user1_id !== ctx.user.id && conv.user2_id !== ctx.user.id) {
    return fail("FORBIDDEN", "Kein Zugriff", 403);
  }

  const messageId = uuid();
  const content = body.content.trim().slice(0, 2000);

  try {
    await env.DB.prepare(
      `INSERT INTO messages (id, conversation_id, sender_id, content)
       VALUES (?, ?, ?, ?)`
    )
      .bind(messageId, conversationId, ctx.user.id, content)
      .run();

    await env.DB.prepare(
      "UPDATE conversations SET last_message_at = datetime('now') WHERE id = ?"
    )
      .bind(conversationId)
      .run();
  } catch (err) {
    console.error("sendMessage error:", err);
    return serverError("Nachricht konnte nicht gesendet werden");
  }

  return ok({ id: messageId, content, message: "Nachricht gesendet" });
}

// ============================================================
// GET /api/chat/users
// ============================================================

export async function handleChatUsers(
  request: Request,
  env: Env
): Promise<Response> {
  const ctx = await requireAuth(request, env);
  if (isAuthError(ctx)) return ctx;

  if (request.method !== "GET") return methodNotAllowed(["GET"]);

  const url = new URL(request.url);
  const search = url.searchParams.get("q");

  try {
    let query = `
      SELECT id, first_name, last_name, email, role, avatar_url
      FROM users
      WHERE is_active = 1 AND id != ?
    `;
    const params: unknown[] = [ctx.user.id];

    if (search) {
      query += " AND (first_name LIKE ? OR last_name LIKE ? OR email LIKE ?)";
      const pattern = `%${search}%`;
      params.push(pattern, pattern, pattern);
    }

    query += " ORDER BY role, last_name, first_name LIMIT 100";

    const result = await env.DB.prepare(query).bind(...params).all();

    return ok({ users: result.results ?? [] });
  } catch (err) {
    console.error("chatUsers error:", err);
    return serverError();
  }
}
