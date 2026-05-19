import { apiGet, apiPost } from "./client";

export type Conversation = {
  id: string;
  type: "direct" | "group" | "channel";
  name: string;
  description?: string | null;
  lastMessage: string;
  lastTime: string;
  unread: number;
  participant: { id: string; name: string | null; title: string | null; avatar: string | null } | null;
};

export function openOrCreateDirect(targetUserId: string) {
  return apiPost<{ data: { conversationId: string } }>("/api/v1/chat/direct/open-or-create", { targetUserId });
}
export function getConversations() { return apiGet<{ data: Conversation[] }>("/api/v1/chat/conversations"); }
export function getMessages(conversationId: string) { return apiGet<{ data: { messages: Array<{ id: string; senderId: string; text: string; time: string }>; participants: Array<{ id: string; full_name: string; title: string | null; avatar_url: string | null }> } }>(`/api/v1/chat/conversations/${encodeURIComponent(conversationId)}/messages`); }
export function sendMessage(conversationId: string, content: string) { return apiPost<{ data: { id: string; time: string } }>(`/api/v1/chat/conversations/${encodeURIComponent(conversationId)}/messages`, { content }); }
export function getContacts() { return apiGet<{ data: Array<{ id: string; name: string; role: string | null; email: string; avatar: string | null }> }>("/api/v1/chat/contacts"); }
export function getNotifications() { return apiGet<{ data: Array<{ id: string; title: string; description: string | null; createdAt: string; read: boolean }> }>("/api/v1/chat/notifications"); }
export function getEmailInbox() { return apiGet<{ data: Array<{ id: string; from: string; subject: string; body: string; time: string; read: boolean; starred: boolean }> }>("/api/v1/chat/email/inbox"); }
export function getVideoHistory() { return apiGet<{ data: Array<{ id: string; type: string; durationSec: number | null; time: string; with: string }> }>("/api/v1/chat/video/history"); }
