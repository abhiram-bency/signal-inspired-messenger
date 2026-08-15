from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Any
import uuid

from app.database.database import get_db
from app.database.models import User, utc_now
from app.core.dependencies import get_current_user, get_user_repo
from app.repositories.message_repository import MessageRepository
from app.repositories.conversation_repository import ConversationRepository
from app.services.message_service import MessageService
from app.websocket.connection_manager import manager

router = APIRouter(tags=["websocket"])

def get_message_service(db: AsyncSession = Depends(get_db)) -> MessageService:
    return MessageService(MessageRepository(db), ConversationRepository(db))

@router.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    db: AsyncSession = Depends(get_db)
):
    # Authenticate manually within the endpoint because we need to accept/reject gracefully
    # Or we could rely on a dependency. Let's do it manually for better control over WebSocket exceptions.
    token = websocket.cookies.get("session_token")
    if not token:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return
        
    user_repo = await get_user_repo(db)
    session = await user_repo.get_session_by_token(token)
    if not session or not session.user:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return
        
    current_user = session.user
    user_id = current_user.id
    
    # Accept connection
    await manager.connect(websocket, user_id)
    connection_id = str(uuid.uuid4())
    
    # We need to construct the services manually because we are inside a long-running WebSocket endpoint
    msg_repo = MessageRepository(db)
    conv_repo = ConversationRepository(db)
    msg_service = MessageService(msg_repo, conv_repo)
    
    try:
        while True:
            data = await websocket.receive_json()
            
            # Envelope validation
            event_type = data.get("type")
            event_id = data.get("event_id")
            payload = data.get("payload", {})
            
            if event_type == "connection.init":
                await manager.send_personal_message({
                    "type": "connection.ready",
                    "payload": {
                        "connection_id": connection_id,
                        "user_id": user_id,
                        "server_time": utc_now().isoformat() + "Z"
                    }
                }, websocket)
                
            elif event_type == "message.send":
                client_message_id = payload.get("client_message_id")
                conversation_id = payload.get("conversation_id")
                content = payload.get("content")
                msg_type = payload.get("message_type", "text")
                reply_to_id = payload.get("reply_to_id")
                
                try:
                    # Persist message
                    new_msg = await msg_service.create_message(
                        current_user_id=user_id,
                        conversation_id=conversation_id,
                        content=content,
                        message_type=msg_type,
                        reply_to_id=reply_to_id
                    )
                    
                    # Fetch sender details for the broadcasted message
                    from app.schemas.message import MessageResponse, MessageSender
                    sender_detail = MessageSender(
                        id=current_user.id,
                        display_name=current_user.display_name,
                        avatar_url=current_user.avatar_url
                    )
                    
                    full_message = MessageResponse(
                        id=new_msg.id,
                        conversation_id=new_msg.conversation_id,
                        sender=sender_detail,
                        content=new_msg.content,
                        message_type=new_msg.message_type,
                        reply_to=reply_to_id,
                        created_at=new_msg.created_at,
                        status="sent"
                    ).model_dump(mode="json")
                    
                    # Send ACK to sender
                    ack_event = {
                        "type": "message.ack",
                        "event_id": str(uuid.uuid4()),
                        "timestamp": utc_now().isoformat() + "Z",
                        "payload": {
                            "client_message_id": client_message_id,
                            "message": full_message,
                            "status": "sent"
                        }
                    }
                    await manager.send_personal_message(ack_event, websocket)
                    
                    # Broadcast to conversation members
                    conv = await conv_repo.get_conversation_by_id(conversation_id)
                    member_ids = [m.user_id for m in conv.members]
                    
                    broadcast_event = {
                        "type": "message.new",
                        "event_id": str(uuid.uuid4()),
                        "timestamp": utc_now().isoformat() + "Z",
                        "payload": full_message
                    }
                    
                    # Broadcast only to other members, sender gets ACK
                    target_members = [mid for mid in member_ids if mid != user_id]
                    await manager.broadcast_to_users(broadcast_event, target_members)
                    
                except HTTPException as e:
                    # Invalid message or unauth
                    error_event = {
                        "type": "error",
                        "event_id": str(uuid.uuid4()),
                        "timestamp": utc_now().isoformat() + "Z",
                        "payload": {
                            "code": e.status_code,
                            "message": e.detail
                        }
                    }
                    await manager.send_personal_message(error_event, websocket)

            elif event_type == "receipt.update":
                message_id = payload.get("message_id")
                conversation_id = payload.get("conversation_id")
                status_val = payload.get("status")
                
                try:
                    await msg_service.update_receipt(message_id, user_id, status_val)
                    
                    # We need to broadcast this receipt update to the sender of the message
                    # Since we don't have the message sender easily here without a query, we can just broadcast to conversation members
                    # The frontend will update its state if it sent the message.
                    conv = await conv_repo.get_conversation_by_id(conversation_id)
                    member_ids = [m.user_id for m in conv.members]
                    
                    broadcast_event = {
                        "type": "receipt.update",
                        "event_id": str(uuid.uuid4()),
                        "timestamp": utc_now().isoformat() + "Z",
                        "payload": {
                            "message_id": message_id,
                            "conversation_id": conversation_id,
                            "user_id": user_id,
                            "status": status_val
                        }
                    }
                    
                    target_members = [mid for mid in member_ids if mid != user_id]
                    await manager.broadcast_to_users(broadcast_event, target_members)
                except Exception as e:
                    print(f"Receipt update failed: {e}")

            elif event_type in ["typing.start", "typing.stop"]:
                conversation_id = payload.get("conversation_id")
                
                try:
                    conv = await conv_repo.get_conversation_by_id(conversation_id)
                    member_ids = [m.user_id for m in conv.members]
                    
                    broadcast_event = {
                        "type": event_type,
                        "event_id": str(uuid.uuid4()),
                        "timestamp": utc_now().isoformat() + "Z",
                        "payload": {
                            "conversation_id": conversation_id,
                            "user_id": user_id,
                            "display_name": current_user.display_name
                        }
                    }
                    
                    target_members = [mid for mid in member_ids if mid != user_id]
                    await manager.broadcast_to_users(broadcast_event, target_members)
                except Exception as e:
                    print(f"Typing broadcast failed: {e}")

            elif event_type == "ping":
                await manager.send_personal_message({
                    "type": "pong",
                    "event_id": str(uuid.uuid4()),
                    "timestamp": utc_now().isoformat() + "Z",
                    "payload": {}
                }, websocket)

            else:
                # Ignore unsupported events gracefully
                pass

    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id)
    except Exception:
        # Handle malformed JSON gracefully
        manager.disconnect(websocket, user_id)
