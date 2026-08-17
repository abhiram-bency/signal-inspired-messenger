from typing import List, Tuple, Dict, Any
from fastapi import HTTPException, status
from app.repositories.conversation_repository import ConversationRepository
from app.repositories.user_repository import UserRepository
from app.database.models import Conversation
from app.schemas.conversation import ConversationListItem, ConversationDetail, ConversationMemberSchema, MessagePreview

class ConversationService:
    def __init__(self, conv_repo: ConversationRepository, user_repo: UserRepository):
        self.conv_repo = conv_repo
        self.user_repo = user_repo

    async def get_user_conversations(self, user_id: str) -> List[ConversationListItem]:
        convs = await self.conv_repo.get_user_conversations(user_id)
        unread_counts = await self.conv_repo.get_unread_counts(user_id)
        results = []
        for c in convs:
            # Format name for direct conversations if not set
            name = c.name
            if c.type == "direct":
                other_member = next((m.user for m in c.members if m.user_id != user_id), None)
                if other_member:
                    name = other_member.display_name

            # Get last message
            last_msg = await self.conv_repo.get_last_message(c.id)
            preview = None
            if last_msg:
                preview = MessagePreview(
                    id=last_msg.id,
                    content=last_msg.content,
                    sender_id=last_msg.sender_id,
                    created_at=last_msg.created_at
                )

            item = ConversationListItem(
                id=c.id,
                type=c.type,
                name=name,
                avatar_url=c.avatar_url,
                last_message=preview,
                unread_count=unread_counts.get(c.id, 0),
                updated_at=c.updated_at
            )
            results.append(item)
        return results

    async def get_conversation(self, conv_id: str, current_user_id: str) -> ConversationDetail:
        conv = await self.conv_repo.get_conversation_by_id(conv_id)
        if not conv:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")

        # Check membership
        if not any(m.user_id == current_user_id for m in conv.members):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a member")

        name = conv.name
        if conv.type == "direct":
            other_member = next((m.user for m in conv.members if m.user_id != current_user_id), None)
            if other_member:
                name = other_member.display_name

        members = [
            ConversationMemberSchema(
                id=m.user.id,
                display_name=m.user.display_name,
                role=m.role
            ) for m in conv.members
        ]

        return ConversationDetail(
            id=conv.id,
            type=conv.type,
            name=name,
            avatar_url=conv.avatar_url,
            created_by=conv.created_by,
            members=members,
            created_at=conv.created_at,
            updated_at=conv.updated_at
        )

    async def create_direct_conversation(self, current_user_id: str, target_user_id: str) -> Tuple[ConversationDetail, bool]:
        if current_user_id == target_user_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot create conversation with yourself")

        target_user = await self.user_repo.get_user_by_id(target_user_id)
        if not target_user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Target user not found")

        existing = await self.conv_repo.get_direct_conversation(current_user_id, target_user_id)
        if existing:
            detail = await self.get_conversation(existing.id, current_user_id)
            return detail, False

        conv = await self.conv_repo.create_conversation("direct", created_by=current_user_id)
        await self.conv_repo.add_member(conv.id, current_user_id, "member")
        await self.conv_repo.add_member(conv.id, target_user_id, "member")
        await self.conv_repo.session.commit()

        detail = await self.get_conversation(conv.id, current_user_id)
        return detail, True

    async def create_group_conversation(self, current_user_id: str, name: str, member_ids: List[str]) -> ConversationDetail:
        if not name or not name.strip():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Group name required")

        # Deduplicate and ensure target users exist
        unique_ids = set(member_ids)
        if current_user_id in unique_ids:
            unique_ids.remove(current_user_id)

        valid_users = []
        for uid in unique_ids:
            user = await self.user_repo.get_user_by_id(uid)
            if not user:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"User {uid} not found")
            valid_users.append(uid)

        conv = await self.conv_repo.create_conversation("group", created_by=current_user_id, name=name.strip())
        await self.conv_repo.add_member(conv.id, current_user_id, "admin")
        
        for uid in valid_users:
            await self.conv_repo.add_member(conv.id, uid, "member")
            
        await self.conv_repo.session.commit()

        return await self.get_conversation(conv.id, current_user_id)

    async def delete_conversation(self, conv_id: str, current_user_id: str) -> None:
        # Check permissions and existence
        conv = await self.conv_repo.get_conversation_by_id(conv_id)
        if not conv:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")
        
        member = next((m for m in conv.members if m.user_id == current_user_id), None)
        if not member:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a member")
            
        if conv.type == "group" and member.role != "admin":
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only admins can delete group conversations")

        await self.conv_repo.session.delete(conv)
        await self.conv_repo.session.commit()

    async def add_group_member(self, conv_id: str, admin_user_id: str, target_user_id: str) -> ConversationDetail:
        conv = await self.conv_repo.get_conversation_by_id(conv_id)
        if not conv or conv.type != "group":
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group conversation not found")
            
        admin_member = await self.conv_repo.get_member(conv_id, admin_user_id)
        if not admin_member or admin_member.role != "admin":
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only admins can add members")
            
        target_user = await self.user_repo.get_user_by_id(target_user_id)
        if not target_user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
            
        existing_member = await self.conv_repo.get_member(conv_id, target_user_id)
        if existing_member:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User is already a member")
            
        await self.conv_repo.add_member(conv_id, target_user_id, "member")
        await self.conv_repo.session.commit()
        return await self.get_conversation(conv_id, admin_user_id)

    async def remove_group_member(self, conv_id: str, admin_user_id: str, target_user_id: str) -> ConversationDetail:
        conv = await self.conv_repo.get_conversation_by_id(conv_id)
        if not conv or conv.type != "group":
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group conversation not found")
            
        admin_member = await self.conv_repo.get_member(conv_id, admin_user_id)
        if not admin_member or admin_member.role != "admin":
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only admins can remove members")
            
        if admin_user_id == target_user_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot remove yourself as admin")
            
        target_member = await self.conv_repo.get_member(conv_id, target_user_id)
        if not target_member:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User is not a member of this group")
            
        await self.conv_repo.remove_member(target_member)
        await self.conv_repo.session.commit()
        return await self.get_conversation(conv_id, admin_user_id)
