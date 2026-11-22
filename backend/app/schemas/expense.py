from typing import Optional, Literal
from decimal import Decimal
from datetime import datetime
from pydantic import Field, model_validator
from app.schemas.base import SchemaBase, ORMBase

class ExpenseBase(SchemaBase):
    title: str = Field(min_length=1, max_length=255)
    amount: Decimal = Field(gt=0, max_digits=10, decimal_places=2)

class ExpenseCreate(ExpenseBase):
    trip_id: int

class ExpenseUpdate(ExpenseBase):
    title : Optional[str] =Field(default=None,min_length=1,max_length=255)
    amount: Optional[Decimal] = Field(default=None,gt=0,max_digits=10,decimal_places=2)

class ExpenseReview(SchemaBase):
    status: Literal[1,2]
    review_comment : Optional[str] = None

    @model_validator(mode="after")
    def validate_rejection_comment(self):
        if self.status == 2 and not(self.review_comment and self.review_comment.strip()):
            raise ValueError("Для отклонения необходимо указать причину")
        return self

class ExpenseResponse(ORMBase):
    id: int
    title: str
    amount: Decimal
    status: int
    created_at: datetime
    trip_id: int
    review_comment: Optional[str]
    reviewed_at: Optional[datetime]
    reviewed_by_id: Optional[int]
