import asyncio
from typing import Dict, Set, Any
from fastapi import WebSocket
from datetime import datetime

class ConnectionManager:
    def __init__(self):
        # Maps user_id to a set of active WebSockets
        self.active_connections: Dict[str, Set[WebSocket]] = {}
        
    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = set()
        self.active_connections[user_id].add(websocket)
        
    def disconnect(self, websocket: WebSocket, user_id: str):
        if user_id in self.active_connections:
            if websocket in self.active_connections[user_id]:
                self.active_connections[user_id].remove(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
                
    async def send_personal_message(self, message: dict, websocket: WebSocket):
        try:
            await websocket.send_json(message)
        except Exception:
            pass # Handle broken pipe or closed connection gracefully
            
    async def send_user_message(self, message: dict, user_id: str):
        """Send a message to all active connections for a given user."""
        if user_id in self.active_connections:
            # Create a list to avoid 'Set changed size during iteration' if disconnected concurrently
            websockets = list(self.active_connections[user_id])
            for ws in websockets:
                try:
                    await ws.send_json(message)
                except Exception:
                    # Stale connection, it will be removed on next receive failure
                    pass

    async def broadcast_to_users(self, message: dict, user_ids: list[str]):
        """Broadcast a message to multiple users."""
        # Use asyncio.gather for concurrent sending
        tasks = []
        for user_id in set(user_ids):
            if user_id in self.active_connections:
                websockets = list(self.active_connections[user_id])
                for ws in websockets:
                    tasks.append(self._safe_send(ws, message))
        if tasks:
            await asyncio.gather(*tasks)
            
    async def _safe_send(self, ws: WebSocket, message: dict):
        try:
            await ws.send_json(message)
        except Exception:
            pass

manager = ConnectionManager()
