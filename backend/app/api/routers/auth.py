from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
import jwt
from app.db.database import get_db
from app.models import models
from app.schemas import user as user_schemas
from app.schemas import token as token_schemas
from fastapi import Response
from app.api.auth_helpers import create_token_pair
from app.core.security import hash_password, verify_password,  decode_token, hash_token
from app.api.dependencies import get_current_user

def get_refresh_payload(refresh_token: str):
    try:
        payload = decode_token(refresh_token)

        if payload.get("token_type") != "refresh":
            raise ValueError("Invalid token type")

        user_id = payload.get("sub")

        if not isinstance(user_id, str):
            raise ValueError("Invalid user ID")

        user_id = int(user_id)

        if user_id <= 0:
            raise ValueError("Invalid user ID")

        return payload, user_id

    except (jwt.PyJWTError, ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token"
        )


router = APIRouter(tags=["Auth"])
@router.post("/auth/register/",response_model=user_schemas.UserResponse,status_code=status.HTTP_201_CREATED)
def register_user(user:user_schemas.UserCreate, db: Session = Depends(get_db)):
    existed_user = db.query(models.User).filter(models.User.email == user.email).first()
    if existed_user is not None:
        raise HTTPException(status_code = 409, detail = "already registered")

    db_user = models.User(**user.model_dump(exclude={"password"}) ,hashed_password = hash_password(user.password))
    try:
        db.add(db_user)
        db.commit()

    except IntegrityError as exc:
        db.rollback()

        existed_user = db.query(models.User.id).filter(
            models.User.email == user.email
        ).first()

        if existed_user is not None:
            raise HTTPException(
                status_code=409,
                detail="Email already registered"
            ) from exc

        raise
    db.refresh(db_user)

    return db_user


@router.post("/auth/login/",response_model=token_schemas.TokenResponse)
def login_user(login_data: user_schemas.UserLogin,db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == login_data.email).first()

    if db_user is None or not verify_password(login_data.password, db_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"}
        )

    if not db_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )

    tokens = create_token_pair(db, db_user.id)

    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Could not create tokens"
        ) from exc

    return tokens


@router.post("/auth/refresh/",response_model=token_schemas.TokenResponse)
def refresh_tokens(
    request: token_schemas.RefreshRequest,
    db: Session = Depends(get_db)
):
    payload, user_id = get_refresh_payload(request.refresh_token)

    now = datetime.now(timezone.utc)
    token_hash = hash_token(request.refresh_token)

    db_refresh_token = (
        db.query(models.RefreshToken)
        .filter(
            models.RefreshToken.token_hash == token_hash,
            models.RefreshToken.user_id == user_id
        )
        .with_for_update()
        .first()
    )

    if db_refresh_token is None or db_refresh_token.revoked_at is not None or db_refresh_token.expires_at <= now:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,detail="Refresh token is revoked or expired")
    db_user = db.query(models.User).filter(models.User.id == user_id).first()

    if db_user is None or not db_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive"
        )

    db_refresh_token.revoked_at = now

    tokens = create_token_pair(db, db_user.id)

    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Could not refresh tokens"
        ) from exc

    return tokens


@router.post("/auth/logout/",status_code=status.HTTP_204_NO_CONTENT)
def logout_user(request: token_schemas.RefreshRequest,db: Session = Depends(get_db)):
    _, user_id = get_refresh_payload(request.refresh_token)

    token_hash = hash_token(request.refresh_token)

    db_refresh_token = (
        db.query(models.RefreshToken)
        .filter(
            models.RefreshToken.token_hash == token_hash,
            models.RefreshToken.user_id == user_id
        )
        .with_for_update()
        .first()
    )

    if db_refresh_token is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token not found"
        )

    if db_refresh_token.revoked_at is None:
        db_refresh_token.revoked_at = datetime.now(timezone.utc)

        try:
            db.commit()
        except IntegrityError as exc:
            db.rollback()
            raise HTTPException(status_code=status.HTTP_409_CONFLICT,detail="Could not logout") from exc

    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/auth/me/",response_model=user_schemas.UserResponse)
def get_me(
    current_user: models.User = Depends(get_current_user)
):
    return current_user