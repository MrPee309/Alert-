/**
 * DealLakay MESSENGER API — real integration with the EXISTING
 * conversations/messages system (routers/social.py). No new messaging
 * backend — this just talks to what already powers the website's messages.
 */
import { apiClient } from "./client";

export interface Conversation {
  id: string;
  product_id: string | null;
  product_title: string;
  product_image: string;
  buyer_id: string;
  buyer_username: string;
  seller_id: string;
  seller_username: string;
  last_message: string;
  created_at: string;
  updated_at: string;
  unread: number;
  other_user: { username: string; avatar: string; online: boolean; last_seen: string | null };
  // Only present on GET /conversations/{cid}/messages's `conversation` object.
  other_user_online?: boolean;
  other_user_last_seen?: string | null;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_username: string;
  content: string;
  read: boolean;
  created_at: string;
}

export const messagesApi = {
  listConversations: () => apiClient.get<Conversation[]>("/conversations"),
  getMessages: (cid: string) => apiClient.get<{ conversation: Conversation; messages: Message[] }>(`/conversations/${cid}/messages`),
  sendMessage: (cid: string, content: string) => apiClient.post<Message>(`/conversations/${cid}/messages`, { content }),
  contactAlertCreator: (alertId: string) => apiClient.post<Conversation>(`/alerts/${alertId}/contact`),
  // Only ever called from an already-authorized context (a technician/
  // seller/supplier profile, or a Deal Alert response) — never from a
  // general user search, which Messenger deliberately does not have.
  startDirectConversation: (userId: string) => apiClient.post<Conversation>(`/conversations/with/${userId}`),
};
