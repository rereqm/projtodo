from datetime import datetime
from pydantic import EmailStr, Field

from app.schemas.base import SchemaBase, ORMBase


class UserBase(SchemaBase):
    email: EmailStr
    full_name: str = Field(min_length=1, max_length=255)


class UserCreate(UserBase):
    password: str = Field(min_length=8, max_length=128)


class UserLogin(SchemaBase):
    email: EmailStr
    password: str


class UserResponse(ORMBase):
    id: int
    email: EmailStr
    full_name: str
    created_at: datetime
    is_active: bool
    role: int


class UserActivation(SchemaBase):
    is_active: bool