/**
 * Message domain types.
 *
 * Matches API_SPEC §54 (Message Response), §55 (Create Message).
 * Spec reference: MASTER_PROJECT_SPEC §16 (Message Model), §17 (Message Receipts)
 */

import type { UserRef } from "./user";

export type MessageType = "text" | "image" | "file" | "system";

/** Delivery/read state as tracked in the UI (MASTER_PROJECT_SPEC §17). */
export type MessageStatus = "sending" | "sent" | "delivered" | "read" | "failed";

/** Receipt status values stored in the database. */
export type ReceiptStatus = "sent" | "delivered" | "read";

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender?: UserRef;
  content: string | null;
  message_type: MessageType;
  reply_to_id: string | null;
  reply_to?: Pick<Message, "id" | "content" | "sender_id"> | null;
  created_at: string; // ISO 8601
  edited_at: string | null;
  deleted_at: string | null;
  /** Current delivery/read status for the viewing user. */
  status?: MessageStatus;
  /** Set by the client before the server confirms (optimistic). */
  client_message_id?: string;
}

export interface MessageReceipt {
  user_id: string;
  status: ReceiptStatus;
  delivered_at: string | null;
  read_at: string | null;
}

export interface CreateMessageRequest {
  content: string;
  message_type?: MessageType;
  reply_to_id?: string | null;
}

export interface MessageListResponse {
  data: Message[];
  meta: {
    limit: number;
    has_more: boolean;
    next_cursor: string | null;
  };
}
