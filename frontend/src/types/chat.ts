export interface User {
  id: string;
  display_name: string;
  avatar_url: string | null;
}

export interface MessagePreview {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
}

export interface ConversationMember {
  id: string;
  display_name: string;
  role: string;
}

export interface ConversationListItem {
  id: string;
  type: string;
  name: string | null;
  avatar_url: string | null;
  last_message: MessagePreview | null;
  unread_count: number;
  updated_at: string;
}

export interface ConversationDetail extends ConversationListItem {
  created_by: string;
  members: ConversationMember[];
  created_at: string;
}

export interface MessageResponse {
  id: string;
  conversation_id: string;
  sender: User;
  content: string;
  message_type: string;
  reply_to: string | null;
  created_at: string;
  edited_at: string | null;
  deleted_at: string | null;
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  client_message_id?: string;
}

export interface WsEvent {
  type: string;
  event_id: string;
  timestamp: string;
  payload: Record<string, unknown>;
}
