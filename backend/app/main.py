from fastapi import FastAPI
from app.db.database import engine, Base
from app.models import models

Base.metadata.create_all(engine)

app = FastAPI()

@app.get("/")
def read_root():
    return {"Hello": "World"}