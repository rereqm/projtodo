from datetime import datetime, timedelta, timezone
from typing import Any

import jwt
from pwdlib import PasswordHash

from app.core.config import settings
from hashlib import sha256
from uuid import uuid4


password_hasher = PasswordHash.recommended()


def hash_password(password: str) -> str:
    return password_hasher.hash(password)


def verify_password(password: str, hashed_password: str) -> bool:
    return password_hasher.verify(password, hashed_password)


def hash_token(token: str) -> str:
    return sha256(token.encode("utf-8")).hexdigest()


#JWT
def create_token(
    user_id: int,
    token_type: str,
    expires_delta: timedelta
) -> str:
    now = datetime.now(timezone.utc)

    payload = {
        "sub": str(user_id),
        "token_type": token_type,
        "jti": uuid4().hex,
        "iat": now,
        "exp": now + expires_delta
    }

    return jwt.encode(
        payload,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM
    )


#Access Token
def create_access_token(user_id: int) -> str:
    expires_delta = timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )

    return create_token(
        user_id=user_id,
        token_type="access",
        expires_delta=expires_delta
    )


#Refresh Token
def create_refresh_token(user_id: int) -> str:
    expires_delta = timedelta(
        days=settings.REFRESH_TOKEN_EXPIRE_DAYS
    )

    return create_token(
        user_id=user_id,
        token_type="refresh",
        expires_delta=expires_delta
    )


# Проверка и декодирование JWT
def decode_token(token: str) -> dict[str, Any]:
    return jwt.decode(
        token,
        settings.SECRET_KEY,
        algorithms=[settings.ALGORITHM]
    )