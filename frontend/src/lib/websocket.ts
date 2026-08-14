/**
 * WebSocket client — Phase 10.
 *
 * This module will provide:
 *   - Authenticated WebSocket connection management
 *   - Event serialization / deserialization
 *   - Exponential-backoff reconnection
 *   - Connection state tracking
 *   - Event dispatch to stores
 *
 * Spec reference: WEBSOCKET_PROTOCOL §53 (Connection Manager), §41 (Reconnection)
 * Architecture reference: ARCHITECTURE §14 (WebSocket Client)
 *
 * Phase 0: Module exists as a placeholder.
 * Phase 10: Implemented in full.
 */

export const WS_BASE_URL =
  process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8000";

// Phase 10 implementation placeholder.
