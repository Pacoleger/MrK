import { apiGet, apiPost } from "./api";

// ============================================================
// Types
// ============================================================

export interface Conversation {
  id: string;
  user1_id: string;
  user2_id: string;
  last_message_at: string | null;
  created_at: string;
  other_id: string;
  other_first_name: string;
  other_last_name: string;
  other_role: "admin" | "teacher" | "student";
  other_avatar_url: string | null;
  last_message: string | null;
  last_sender_id: string | null;
  unread_count: number;
}

export interface Message {
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

export interface ChatUser {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: "admin" | "teacher" | "student";
  avatar_url: string | null;
}

// ============================================================
// Chat API
// ============================================================

export const chatApi = {
  conversations() {
    return apiGet<{ conversations: Conversation[] }>(
      "/api/chat/conversations"
    );
  },

  createConversation(otherUserId: string) {
    return apiPost<{
      conversationId: string;
      other: ChatUser;
      message: string;
    }>("/api/chat/conversations", { otherUserId });
  },

  messages(conversationId: string) {
    return apiGet<{ messages: Message[] }>(
      `/api/chat/conversations/${conversationId}/messages`
    );
  },

  sendMessage(conversationId: string, content: string) {
    return apiPost<{ id: string; content: string; message: string }>(
      `/api/chat/conversations/${conversationId}/messages`,
      { content }
    );
  },

  users(search?: string) {
    const qs = search ? `?q=${encodeURIComponent(search)}` : "";
    return apiGet<{ users: ChatUser[] }>(`/api/chat/users${qs}`);
  },
};
