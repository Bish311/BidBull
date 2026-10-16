import uuid
from typing import Optional
from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.security import create_access_token, decode_token, hash_password, verify_password
from app.models import User
from app.schemas import LoginRequest, TokenResponse, UserCreate, UserJoinRequest, UserResponse

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


async def get_current_user(
    authorization: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db)
) -> User:
    if authorization is None or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authentication token required")
    token = authorization.split(" ")[1]
    subject = decode_token(token)
    if subject is None:
        raise HTTPException(status_code=401, detail="Invalid authentication token")
    user_id = uuid.UUID(subject)
    user = await db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return user


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register_user(payload: UserCreate, db: AsyncSession = Depends(get_db)) -> User:
    query = select(User).where((User.username == payload.username) | (User.email == payload.email))
    result = await db.execute(query)
    if result.scalar_one_or_none() is not None:
        raise HTTPException(status_code=409, detail="Username or email already registered")
    user = User(
        username=payload.username,
        email=payload.email,
        password_hash=hash_password(payload.password),
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


@router.post("/token", response_model=TokenResponse)
async def login_user(payload: LoginRequest, db: AsyncSession = Depends(get_db)) -> TokenResponse:
    query = select(User).where(User.username == payload.username)
    result = await db.execute(query)
    user = result.scalar_one_or_none()
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid username or password")
    token = create_access_token(subject=str(user.id))
    return TokenResponse(access_token=token, user_id=user.id, username=user.username)


@router.post("/join", response_model=TokenResponse)
async def join_user(payload: UserJoinRequest, db: AsyncSession = Depends(get_db)) -> TokenResponse:
    clean_username = payload.username.strip()
    query = select(User).where(User.username == clean_username)
    result = await db.execute(query)
    user = result.scalar_one_or_none()
    if user is None:
        clean_email = f"{clean_username.lower().replace(' ', '_')}@example.com"
        user = User(
            username=clean_username,
            email=clean_email,
            password_hash=hash_password("Pass1234!"),
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
    token = create_access_token(subject=str(user.id))
    return TokenResponse(access_token=token, user_id=user.id, username=user.username)

