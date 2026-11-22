from pydantic import BaseModel, ConfigDict


class SchemaBase(BaseModel):
    model_config = ConfigDict(extra="forbid")


class ORMBase(SchemaBase):
    model_config = ConfigDict(from_attributes=True, extra="forbid")