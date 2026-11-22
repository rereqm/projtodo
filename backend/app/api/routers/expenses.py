
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.db.database import get_db
from app.models import models
from app.schemas import expense as expense_schemas
from app.api.helpers import commit_or_409, get_trip_or_404,get_expense_or_404

router = APIRouter(tags=["Expenses"])






@router.post("/expenses/",response_model=expense_schemas.ExpenseResponse,status_code=status.HTTP_201_CREATED)
def create_expense(
    expense: expense_schemas.ExpenseCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    get_trip_or_404(expense.trip_id, current_user, db)
    db_expense = models.Expense(**expense.model_dump())
    db.add(db_expense)
    commit_or_409(db, "Could not create expense")
    db.refresh(db_expense)

    return db_expense


@router.get("/trips/{trip_id}/expenses",response_model=list[expense_schemas.ExpenseResponse])
def get_expenses_for_trip(
    trip_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    get_trip_or_404(trip_id, current_user, db)

    return (db.query(models.Expense)
            .filter(models.Expense.trip_id == trip_id)
            .order_by(models.Expense.created_at.desc())
            .all())




@router.patch("/expenses/{expense_id}",response_model=expense_schemas.ExpenseResponse)
def update_expense(
    expense_id: int,
    expense_update: expense_schemas.ExpenseUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_expense = get_expense_or_404(expense_id, current_user, db)

    if db_expense.status != models.ExpenseStatus.PENDING.value:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT,detail="Cannot update an already reviewed expense")

    update_data = expense_update.model_dump(exclude_unset=True, exclude_none=True)

    if not update_data:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,detail="No fields to update")

    for key, value in update_data.items():
        setattr(db_expense, key, value)

    commit_or_409(db, "Could not update expense")

    db.refresh(db_expense)

    return db_expense


@router.delete("/expenses/{expense_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_expense(
    expense_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    db_expense = get_expense_or_404(expense_id, current_user, db)
    if (
        db_expense.status != models.ExpenseStatus.PENDING.value
        and current_user.role != models.UserRole.ADMIN.value
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can delete reviewed expenses",
        )
    db.delete(db_expense)
    db.commit()
    return None



@router.patch("/expenses/{expense_id}/review",response_model=expense_schemas.ExpenseResponse)
def review_expense(
    expense_id: int,
    review: expense_schemas.ExpenseReview,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != models.UserRole.ADMIN.value:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,detail="Only administrators can review expenses")

    db_expense = db.query(models.Expense).filter(models.Expense.id == expense_id).first()

    if db_expense is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,detail="Expense not found")
    if db_expense.status != models.ExpenseStatus.PENDING.value:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT,detail="Expense has already been reviewed")

    db_expense.status = review.status
    db_expense.review_comment = (
        review.review_comment.strip()
        if review.review_comment and review.review_comment.strip()
        else None
    )
    db_expense.reviewed_by_id = current_user.id
    db_expense.reviewed_at = datetime.now(timezone.utc)

    commit_or_409(db, "Could not review expense")

    db.refresh(db_expense)

    return db_expense
