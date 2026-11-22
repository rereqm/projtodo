from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.db.database import get_db
from app.models import models
from app.schemas import trip as trip_schemas
from app.api.helpers import commit_or_409, get_trip_or_404


router = APIRouter(prefix="/trips", tags=["Trips"])





# CREATE
@router.post("/", response_model=trip_schemas.TripResponse, status_code=status.HTTP_201_CREATED)
def create_trip(
    trip: trip_schemas.TripCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_trip = models.Trip(**trip.model_dump(),user_id=current_user.id)

    db.add(db_trip)

    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT,detail="Could not create trip") from exc

    db.refresh(db_trip)

    return db_trip


# READ ALL
@router.get("/", response_model=list[trip_schemas.TripResponse])
def get_trips(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(models.Trip)

    if current_user.role != models.UserRole.ADMIN.value:
        query = query.filter(models.Trip.user_id == current_user.id)

    return query.order_by(models.Trip.id.desc()).all()


# READ ONE
@router.get("/{trip_id}", response_model=trip_schemas.TripResponse)
def get_trip(
    trip_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return get_trip_or_404(trip_id, current_user, db)


# UPDATE
@router.patch("/{trip_id}", response_model=trip_schemas.TripResponse)
def update_trip(
    trip_id: int,
    trip: trip_schemas.TripUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_trip = get_trip_or_404(trip_id, current_user, db)
    update_data = trip.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(db_trip, field, value)

    commit_or_409(db=db, detail=f"Could not update trip")

    db.refresh(db_trip)

    return db_trip


# DELETE
@router.delete("/{trip_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_trip(
    trip_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_trip = get_trip_or_404(trip_id, current_user, db)

    try:
        db.delete(db_trip)
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT,detail="Cannot delete trip") from exc

    return None
