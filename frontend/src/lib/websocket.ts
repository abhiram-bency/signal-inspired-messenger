import { WsEvent } from '../types/chat';

type EventHandler = (event: WsEvent) => void;

class WebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private isConnecting = false;
  private handlers: Map<string, Set<EventHandler>> = new Map();
  private pingInterval: NodeJS.Timeout | null = null;

  constructor() {
    let backendUrl = process.env.NEXT_PUBLIC_WS_URL;
    if (!backendUrl) {
      if (process.env.NEXT_PUBLIC_API_URL) {
        backendUrl = process.env.NEXT_PUBLIC_API_URL.replace(/^http/, 'ws');
      } else {
        backendUrl = 'ws://localhost:8000';
      }
    }
    this.url = `${backendUrl}/ws`;
  }

  connect() {
    if (this.ws?.readyState === WebSocket.OPEN || this.isConnecting) {
      return;
    }

    this.isConnecting = true;
    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      this.isConnecting = false;
      this.reconnectAttempts = 0;
      
      // Initialize connection
      this.send('connection.init', { client_version: '1.0' });
      
      // Start heartbeat
      this.startHeartbeat();
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as WsEvent;
        this.emit(data.type, data);
      } catch (err) {
        console.error('WebSocket message parse error:', err);
      }
    };

    this.ws.onclose = (event) => {
      this.isConnecting = false;
      this.stopHeartbeat();
      
      if (event.code === 1008) {
        // Policy violation (unauthenticated). Don't auto-reconnect.
        console.error('WebSocket disconnected due to authentication failure.');
        return;
      }
      
      this.reconnect();
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  private reconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max WebSocket reconnect attempts reached.');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000);
    
    setTimeout(() => {
      this.connect();
    }, delay);
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    this.pingInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.send('ping', {});
      }
    }, 30000);
  }

  private stopHeartbeat() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  send(type: string, payload: Record<string, unknown>) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      const event: WsEvent = {
        type,
        event_id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        payload
      };
      this.ws.send(JSON.stringify(event));
    }
  }

  on(type: string, handler: EventHandler) {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set());
    }
    this.handlers.get(type)!.add(handler);
  }

  off(type: string, handler: EventHandler) {
    const typeHandlers = this.handlers.get(type);
    if (typeHandlers) {
      typeHandlers.delete(handler);
    }
  }

  private emit(type: string, event: WsEvent) {
    const typeHandlers = this.handlers.get(type);
    if (typeHandlers) {
      typeHandlers.forEach(handler => handler(event));
    }
  }

  disconnect() {
    this.stopHeartbeat();
    if (this.ws) {
      // Close with normal closure status
      this.ws.close(1000, 'User logged out');
      this.ws = null;
    }
  }
}

export const wsClient = new WebSocketClient();
