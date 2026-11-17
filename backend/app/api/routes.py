from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List

from app.db.database import get_db
from app.models import models
from app.schemas import schemas
router = APIRouter()

#trips

@router.post("/trips/",response_model = schemas.TripResponse,status_code = status.HTTP_201_CREATED)
def create_trip(trip: schemas.TripCreate, db: Session = Depends(get_db)):
    db_trip = models.Trip(**trip.model_dump())
    db.add(db_trip)
    db.commit()
    db.refresh(db_trip)
    return db_trip

@router.get("/trips/",response_model=List[schemas.TripResponse])
def get_trips(
        skip: int = Query(0,ge = 0),
        limit: int = Query(100,ge = 1,le =100),
        db: Session = Depends(get_db)
):
    trips = db.query(models.Trip).offset(skip).limit(limit).all()
    return trips

@router.get("/trips/{trip_id}/",response_model=schemas.TripResponse)
def get_trip(trip_id: int, db: Session = Depends(get_db)):
    trip = db.query(models.Trip).filter(models.Trip.id == trip_id).first()
    if trip is None:
        raise HTTPException(status_code = 404, detail = "Trip not found")
    return trip

@router.delete("/trips/{trip_id}/",status_code = status.HTTP_204_NO_CONTENT)
def delete_trip(trip_id: int, db: Session = Depends(get_db)):
    trip = db.query(models.Trip).filter(models.Trip.id == trip_id).first()
    if trip is None:
        raise HTTPException(status_code = 404, detail = "Trip not found")
    db.delete(trip)
    db.commit()
    return None

#expense

@router.post("/expenses/",response_model=schemas.ExpenseResponse,status_code = status.HTTP_201_CREATED)
def create_expense(expense:schemas.ExpenseCreate, db: Session = Depends(get_db)):
    trip = db.query(models.Trip).filter(models.Trip.id == expense.trip_id).first()
    if trip is None:
        raise HTTPException(status_code = 404, detail = "Trip not found")
    db_expense = models.Expense(**expense.model_dump())
    db.add(db_expense)
    db.commit()
    db.refresh(db_expense)
    return db_expense

@router.get("/trips/{trip_id}/expenses",response_model = List[schemas.ExpenseResponse])
def get_expenses_for_trip(trip_id: int, db: Session = Depends(get_db)):
    expenses = db.query(models.Expense).filter(models.Expense.trip_id == trip_id).all()
    return expenses