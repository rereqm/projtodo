from pydantic import BaseModel,ConfigDict
from typing import Optional, List
from datetime import datetime
from decimal import Decimal


#trip
class TripBase(BaseModel):
    title : str
    description : Optional[str]
    budget : Decimal

class TripCreate(TripBase):
    pass

class TripResponse(TripBase):
    id : int
    model_config = ConfigDict(from_attributes=True)

#expese
class ExpenseBase(BaseModel):
    title : str
    amount : Decimal
    is_approved : bool
class ExpenseCreate(ExpenseBase):
    trip_id : int
class ExpenseResponse(ExpenseBase):
    id : int
    trip_id : int
    created_at : datetime
    model_config = ConfigDict(from_attributes=True)