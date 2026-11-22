from pydantic import Field

from app.schemas.base import SchemaBase


class TokenResponse(SchemaBase):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(SchemaBase):
    refresh_token: str = Field(min_length=1)