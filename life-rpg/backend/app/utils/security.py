from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import JWTError, jwt
import bcrypt
from app.config import get_settings


def hash_password(password: str) -> str:
    # Truncate to 72 bytes as per bcrypt limit
    pwd_bytes = password.encode("utf-8")[:72]
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pwd_bytes, salt).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        pwd_bytes = plain.encode("utf-8")[:72]
        hashed_bytes = hashed.encode("utf-8")
        return bcrypt.checkpw(pwd_bytes, hashed_bytes)
    except Exception:
        return False


def create_access_token(user_id: str) -> str:
    settings = get_settings()
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.access_token_expire_minutes)
    return jwt.encode(
        {"sub": user_id, "exp": expire, "type": "access"},
        settings.jwt_secret,
        algorithm=settings.jwt_algorithm,
    )


def create_refresh_token(user_id: str) -> str:
    settings = get_settings()
    expire = datetime.now(timezone.utc) + timedelta(days=settings.refresh_token_expire_days)
    return jwt.encode(
        {"sub": user_id, "exp": expire, "type": "refresh"},
        settings.jwt_secret,
        algorithm=settings.jwt_algorithm,
    )


def decode_token(token: str, token_type: str = "access") -> Optional[str]:
    """Returns user_id string or None if invalid."""
    settings = get_settings()
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
        if payload.get("type") != token_type:
            return None
        user_id: str = payload.get("sub")
        return user_id
    except JWTError:
        return None
