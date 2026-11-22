from typing import Optional
from decimal import Decimal
from pydantic import Field
from app.schemas.base import SchemaBase, ORMBase

class TripBase(SchemaBase):
    title: str = Field(min_length=1, max_length=255)
    description: Optional[str] = None
    budget: Decimal = Field(ge = 0, max_digits=10,decimal_places=2)

class TripCreate(TripBase):
    pass

class TripUpdate(TripBase):
    title: Optional[str] = Field(default=None, min_length=1, max_length=255)
    description: Optional[str] = None
    budget: Optional[Decimal] = Field(default=None, ge=0, max_digits=10, decimal_places=2)

class TripResponse(TripBase):
    id: int
    user_id: int
    title: str
    description: Optional[str]
    budget: Decimal