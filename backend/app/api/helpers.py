from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.models import models

def get_trip_or_404(trip_id: int, current_user: models.User, db: Session):
    db_trip = db.query(models.Trip).filter(models.Trip.id == trip_id).first()

    if db_trip is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,detail="Trip not found")

    if (current_user.role != models.UserRole.ADMIN.value and db_trip.user_id != current_user.id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,detail="Trip not found")
    return db_trip


def get_expense_or_404(expense_id: int, current_user: models.User, db: Session):
    db_expense = db.query(models.Expense).filter(models.Expense.id == expense_id).first()

    if db_expense is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,detail="Expense not found")

    get_trip_or_404(db_expense.trip_id, current_user, db)

    return db_expense



def commit_or_409(db: Session, detail: str):
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT,detail=detail) from exc