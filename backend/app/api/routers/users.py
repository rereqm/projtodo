from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models import models
from app.schemas import user as user_schemas
from app.api.dependencies import get_current_admin


router = APIRouter(
    prefix="/users",
    tags=["Users"]
)


@router.get("/", response_model=list[user_schemas.UserResponse])
def get_employees(
    is_active: bool | None = Query(default=None),
    current_admin: models.User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    query = db.query(models.User).filter(models.User.role == models.UserRole.EMPLOYEE.value)
    if is_active is not None:
        query = query.filter(models.User.is_active == is_active)
    return query.order_by(models.User.id.desc()).all()


@router.patch("/{user_id}/activation/",response_model=user_schemas.UserResponse)
def update_user_activation(
    user_id: int,
    activation: user_schemas.UserActivation,
    current_admin: models.User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    db_user = (
        db.query(models.User)
        .filter(models.User.id == user_id)
        .with_for_update()
        .first()
    )

    if db_user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    if db_user.role != models.UserRole.EMPLOYEE.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot change administrator activation"
        )

    db_user.is_active = activation.is_active

    # При деактивации отзываем все активные Refresh Token
    if not activation.is_active:
        now = datetime.now(timezone.utc)

        (
            db.query(models.RefreshToken)
            .filter(
                models.RefreshToken.user_id == user_id,
                models.RefreshToken.revoked_at.is_(None)
            )
            .update(
                {models.RefreshToken.revoked_at: now},
                synchronize_session=False
            )
        )

    try:
        db.commit()
    except Exception:
        db.rollback()
        raise

    db.refresh(db_user)

    return db_user
