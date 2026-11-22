from fastapi import APIRouter
from app.api.routers import auth,expenses,users,trips
router = APIRouter()
router.include_router(auth.router)
router.include_router(trips.router)
router.include_router(expenses.router)
router.include_router(users.router)