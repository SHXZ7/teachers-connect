from fastapi import WebSocket, WebSocketDisconnect
from typing import List, Dict
import json
import asyncio
from datetime import datetime

class ConnectionManager:
    def __init__(self):
        # Store active connections by user_id
        self.active_connections: Dict[str, List[WebSocket]] = {}
        # Store community room connections
        self.community_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket, user_id: str = None):
        """Connect a WebSocket and optionally associate with user"""
        await websocket.accept()
        
        if user_id:
            if user_id not in self.active_connections:
                self.active_connections[user_id] = []
            self.active_connections[user_id].append(websocket)
        
        # Add to community room for general updates
        self.community_connections.append(websocket)
        
        print(f"WebSocket connected for user: {user_id}")

    def disconnect(self, websocket: WebSocket, user_id: str = None):
        """Disconnect a WebSocket"""
        if user_id and user_id in self.active_connections:
            if websocket in self.active_connections[user_id]:
                self.active_connections[user_id].remove(websocket)
            
            # Clean up empty user connections
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
        
        # Remove from community connections
        if websocket in self.community_connections:
            self.community_connections.remove(websocket)
        
        print(f"WebSocket disconnected for user: {user_id}")

    async def send_personal_message(self, message: str, user_id: str):
        """Send message to specific user's connections"""
        if user_id in self.active_connections:
            disconnected = []
            for connection in self.active_connections[user_id]:
                try:
                    await connection.send_text(message)
                except:
                    disconnected.append(connection)
            
            # Clean up disconnected connections
            for conn in disconnected:
                self.disconnect(conn, user_id)

    async def broadcast_to_community(self, message: str):
        """Broadcast message to all community connections"""
        disconnected = []
        for connection in self.community_connections:
            try:
                await connection.send_text(message)
            except:
                disconnected.append(connection)
        
        # Clean up disconnected connections
        for conn in disconnected:
            self.disconnect(conn)

    async def send_notification(self, user_id: str, notification_type: str, title: str, message: str, data: dict = None):
        """Send real-time notification to user"""
        notification = {
            "type": "notification",
            "notification_type": notification_type,
            "title": title,
            "message": message,
            "data": data or {},
            "timestamp": datetime.utcnow().isoformat()
        }
        
        await self.send_personal_message(json.dumps(notification), user_id)

    async def broadcast_post_update(self, event_type: str, post_data: dict):
        """Broadcast post-related updates to community"""
        update = {
            "type": "post_update",
            "event_type": event_type,  # "new_post", "post_updated", "post_deleted"
            "data": post_data,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        await self.broadcast_to_community(json.dumps(update))

    async def broadcast_comment_update(self, event_type: str, post_id: str, comment_data: dict):
        """Broadcast comment-related updates to community"""
        update = {
            "type": "comment_update",
            "event_type": event_type,  # "new_comment", "comment_updated", "comment_deleted"
            "post_id": post_id,
            "data": comment_data,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        await self.broadcast_to_community(json.dumps(update))

    async def broadcast_reaction_update(self, post_id: str, reaction_data: dict):
        """Broadcast reaction updates to community"""
        update = {
            "type": "reaction_update",
            "post_id": post_id,
            "data": reaction_data,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        await self.broadcast_to_community(json.dumps(update))

    async def send_typing_indicator(self, post_id: str, user_name: str, is_typing: bool):
        """Send typing indicator for comments"""
        typing_update = {
            "type": "typing_indicator",
            "post_id": post_id,
            "user_name": user_name,
            "is_typing": is_typing,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        await self.broadcast_to_community(json.dumps(typing_update))

# Global connection manager instance
manager = ConnectionManager()