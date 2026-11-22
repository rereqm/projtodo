from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models import models
from app.schemas import token as token_schemas
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_token
)


def create_token_pair(
    db: Session,
    user_id: int
) -> token_schemas.TokenResponse:

    access_token = create_access_token(user_id)
    refresh_token = create_refresh_token(user_id)

    payload = decode_token(refresh_token)

    db_refresh_token = models.RefreshToken(
        user_id=user_id,
        token_hash=hash_token(refresh_token),
        expires_at=datetime.fromtimestamp(
            payload["exp"],
            tz=timezone.utc
        )
    )

    db.add(db_refresh_token)

    return token_schemas.TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token
    )