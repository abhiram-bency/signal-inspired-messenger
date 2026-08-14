"""
FastAPI dependency injection — Phase 5 (Authentication).

This module will provide:
  - get_db: yields a SQLAlchemy database session (Phase 2/5)
  - get_current_user: resolves the authenticated user from JWT/session (Phase 5)
  - require_admin: asserts the current user is a group admin (Phase 15)

Implemented in Phase 5. Do not add logic here before that phase.
"""

from typing import AsyncGenerator, Optional
from fastapi import Request, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.database import get_db
from app.database.models import User
from app.repositories.user_repository import UserRepository

async def get_user_repo(db: AsyncSession = Depends(get_db)) -> UserRepository:
    return UserRepository(db)

async def get_current_user(request: Request, user_repo: UserRepository = Depends(get_user_repo)) -> User:
    token = request.cookies.get("session_token")
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
        
    session = await user_repo.get_session_by_token(token)
    if not session or not session.user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired session")
        
    return session.user

async def get_current_session_id(request: Request, user_repo: UserRepository = Depends(get_user_repo)) -> str:
    token = request.cookies.get("session_token")
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
        
    session = await user_repo.get_session_by_token(token)
    if not session:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired session")
        
    return session.id
