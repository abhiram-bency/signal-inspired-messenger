/**
 * WebSocket event types.
 *
 * Matches WEBSOCKET_PROTOCOL §11 (Event Envelope), §13-14 (Client/Server Events).
 *
 * All WebSocket messages use the common envelope:
 *   { type, event_id, timestamp, payload }
 *
 * Spec reference: WEBSOCKET_PROTOCOL §12 (Event Naming)
 */

/** Base envelope for all WebSocket messages. */
export interface WsEnvelope<T = unknown> {
  type: string;
  event_id: string;
  timestamp: string; // ISO 8601
  payload: T;
}

// ─── Client → Server event types ─────────────────────────────────────────────

export type ClientEventType =
  | "connection.init"
  | "message.send"
  | "message.delivered"
  | "message.read"
  | "typing.start"
  | "typing.stop"
  | "presence.update"
  | "ping";

// ─── Server → Client event types ─────────────────────────────────────────────

export type ServerEventType =
  | "connection.ready"
  | "message.ack"
  | "message.new"
  | "message.delivered"
  | "message.read"
  | "typing.start"
  | "typing.stop"
  | "presence.update"
  | "conversation.updated"
  | "group.member_added"
  | "group.member_removed"
  | "group.updated"
  | "pong"
  | "error";

// ─── Payload shapes (Phase 10 — detailed types added here as implemented) ─────

export interface ConnectionReadyPayload {
  connection_id: string;
  user_id: string;
  server_time: string;
}

export interface MessageAckPayload {
  client_message_id: string;
  message: {
    id: string;
    conversation_id: string;
    sender_id: string;
    content: string;
    created_at: string;
  };
  status: "sent";
}

export interface WsErrorPayload {
  code: string;
  message: string;
  request_event_id: string | null;
}
