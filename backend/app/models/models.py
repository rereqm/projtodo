from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, NUMERIC, Numeric
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base

class Trip(Base):
    __tablename__ = "trips"

    id  = Column(Integer, primary_key=True,index=True)
    title = Column(String,index = True,nullable = False)
    description = Column(String, nullable=False)
    budget = Column(Numeric(10,2),nullable = False)

    expeses = relationship("Expense",back_populates="trip",cascade="all , delete-orphan")

class Expense(Base):
    __tablename__ = "expenses"
    id = Column(Integer, primary_key=True,index=True)
    title = Column(String,index = True,nullable = False)
    amount = Column(Numeric(10,2),nullable = False)
    is_approved = Column(Boolean,default = False,nullable = False)
    created_at = Column(DateTime(timezone=True),server_default = func.now(),nullable = False)

    trip_id = Column(Integer, ForeignKey('trips.id' , ondelete='CASCADE'),nullable = False)

    trip = relationship("Trip",back_populates="expeses")