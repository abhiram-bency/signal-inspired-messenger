from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, delete
from sqlalchemy.orm import selectinload
from app.database.models import Contact

import uuid

class ContactRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_contacts(self, user_id: str) -> List[Contact]:
        result = await self.session.execute(
            select(Contact)
            .options(selectinload(Contact.contact))
            .where(Contact.owner_id == user_id)
            .order_by(Contact.created_at.desc())
        )
        return list(result.scalars().all())
        
    async def get_contact(self, owner_id: str, contact_id: str) -> Optional[Contact]:
        result = await self.session.execute(
            select(Contact)
            .where(
                and_(
                    Contact.owner_id == owner_id,
                    Contact.contact_id == contact_id
                )
            )
        )
        return result.scalar_one_or_none()
        
    async def add_contact(self, owner_id: str, contact_id: str, nickname: Optional[str] = None) -> Contact:
        new_contact = Contact(
            id=str(uuid.uuid4()),
            owner_id=owner_id,
            contact_id=contact_id,
            nickname=nickname
        )
        self.session.add(new_contact)
        await self.session.commit()
        await self.session.refresh(new_contact)
        
        # Load the contact relation so it can be serialized
        result = await self.session.execute(
            select(Contact).options(selectinload(Contact.contact)).where(Contact.id == new_contact.id)
        )
        return result.scalar_one()

    async def remove_contact(self, owner_id: str, contact_id: str) -> bool:
        result = await self.session.execute(
            delete(Contact).where(
                and_(
                    Contact.owner_id == owner_id,
                    Contact.contact_id == contact_id
                )
            )
        )
        await self.session.commit()
        return result.rowcount > 0
