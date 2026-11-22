import jwt

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models import models
from app.core.security import decode_token
from fastapi import Depends, HTTPException, status
from app.models import models

security = HTTPBearer(auto_error=False)







def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
    db: Session = Depends(get_db),
) -> models.User:

    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"}
        )

    try:
        payload = decode_token(credentials.credentials)

        if payload.get("token_type") != "access":
            raise ValueError("Invalid token type")

        user_id = payload.get("sub")

        if not isinstance(user_id, str):
            raise ValueError("Invalid user ID")

        user_id = int(user_id)

        if user_id <= 0:
            raise ValueError("Invalid user ID")

    except (jwt.PyJWTError, ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"}
        )

    db_user = db.query(models.User).filter(
        models.User.id == user_id
    ).first()

    if db_user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"}
        )

    if not db_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User is inactive"
        )

    return db_user



def get_current_admin(
    current_user: models.User = Depends(get_current_user)
) -> models.User:

    if current_user.role != models.UserRole.ADMIN.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrator privileges required"
        )

    return current_user


