/**
 * Conversation domain types.
 *
 * Matches API_SPEC §34-41 (Conversations), §44-48 (Group Members).
 * Spec reference: MASTER_PROJECT_SPEC §14, §15 (Conversation + Membership)
 */

import type { UserRef } from "./user";
import type { Message } from "./message";

/** Re-exported for consumer convenience — conversation components use UserRef for member avatars. */
export type { UserRef };


export type ConversationType = "direct" | "group";
export type MemberRole = "admin" | "member";

export interface ConversationMember {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  role: MemberRole;
  joined_at: string; // ISO 8601
}

export interface Conversation {
  id: string;
  type: ConversationType;
  name: string | null;
  avatar_url: string | null;
  last_message: Pick<Message, "id" | "content" | "sender_id" | "created_at"> | null;
  unread_count: number;
  updated_at: string; // ISO 8601
  members?: ConversationMember[];
}

export interface ConversationDetail extends Conversation {
  created_by: string;
  created_at: string;
  members: ConversationMember[];
}

export interface CreateDirectRequest {
  user_id: string;
}

export interface CreateGroupRequest {
  name: string;
  member_ids: string[];
}

export interface ConversationListResponse {
  data: Conversation[];
  meta: { count: number };
}

export interface ConversationResponse {
  data: ConversationDetail;
}
