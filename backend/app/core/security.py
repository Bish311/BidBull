from datetime import datetime, timedelta, timezone
from typing import Optional
import bcrypt
import jwt
from app.core.config import get_settings


def hash_password(plain_password: str) -> str:
    salt = bcrypt.gensalt(rounds=12)
    encoded = plain_password.encode("utf-8")
    hashed = bcrypt.hashpw(encoded, salt)
    return hashed.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    encoded_plain = plain_password.encode("utf-8")
    encoded_hash = hashed_password.encode("utf-8")
    return bcrypt.checkpw(encoded_plain, encoded_hash)


def create_access_token(subject: str, expires_delta: Optional[timedelta] = None) -> str:
    settings = get_settings()
    now = datetime.now(timezone.utc)
    if expires_delta is not None:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    payload = {
        "sub": subject,
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp()),
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def decode_token(token: str) -> Optional[str]:
    settings = get_settings()
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM]
        )
        subject: Optional[str] = payload.get("sub")
        return subject
    except jwt.PyJWTError:
        return None
