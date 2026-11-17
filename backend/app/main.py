from fastapi import FastAPI
from app.db.database import engine, Base
from app.models import models
from app.api.routes import router as api_router

Base.metadata.create_all(engine)

app = FastAPI(title = "API Портал коммандировок")

app.include_router(api_router)

@app.get("/")
def read_root():
    return {"Hello": "World"}