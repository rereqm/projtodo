from enum import IntEnum

from sqlalchemy import (
    Column, Integer, String, Text, Boolean, ForeignKey,
    DateTime, Numeric, CheckConstraint, func, text
)
from sqlalchemy.orm import relationship

from app.db.database import Base


class UserRole(IntEnum):
    EMPLOYEE = 1
    ADMIN = 2


class ExpenseStatus(IntEnum):
    PENDING = 0
    APPROVED = 1
    REJECTED = 2


class User(Base):
    __tablename__ = "users"

    __table_args__ = (
        CheckConstraint("role IN (1, 2)", name="ck_users_role"),
    )

    id = Column(Integer, primary_key=True)
    email = Column(String(255), unique=True, nullable=False)
    full_name = Column(String(255), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    is_active = Column(Boolean, default=False, server_default=text("false"), nullable=False)
    role = Column(Integer, default=UserRole.EMPLOYEE.value, server_default=text("1"), nullable=False)

    trips = relationship("Trip", foreign_keys="Trip.user_id", back_populates="user", passive_deletes="all")
    reviewed_expenses = relationship("Expense", foreign_keys="Expense.reviewed_by_id", back_populates="reviewer", passive_deletes="all")

    refresh_tokens = relationship("RefreshToken",foreign_keys="RefreshToken.user_id",back_populates="user",passive_deletes="all")


class Trip(Base):
    __tablename__ = "trips"

    __table_args__ = (
        CheckConstraint("budget >= 0", name="ck_trips_budget_nonnegative"),
    )

    id = Column(Integer, primary_key=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    budget = Column(Numeric(10, 2), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True)

    user = relationship("User", foreign_keys="Trip.user_id", back_populates="trips")
    expenses = relationship("Expense", foreign_keys="Expense.trip_id", back_populates="trip", passive_deletes="all")


class Expense(Base):
    __tablename__ = "expenses"

    __table_args__ = (
        CheckConstraint("status IN (0, 1, 2)", name="ck_expenses_status"),
        CheckConstraint("amount > 0", name="ck_expenses_amount_positive"),
        CheckConstraint(
            "(status = 0 AND reviewed_by_id IS NULL AND reviewed_at IS NULL AND review_comment IS NULL) OR "
            "(status IN (1, 2) AND reviewed_by_id IS NOT NULL AND reviewed_at IS NOT NULL)",
            name="ck_expenses_review_metadata"
        ),
        CheckConstraint(
            "status != 2 OR (review_comment IS NOT NULL AND length(trim(review_comment)) > 0)",
            name="ck_expenses_rejection_comment"
        ),
    )

    id = Column(Integer, primary_key=True)
    title = Column(String(255), nullable=False)
    amount = Column(Numeric(10, 2), nullable=False)
    status = Column(Integer, default=ExpenseStatus.PENDING.value, server_default=text("0"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    trip_id = Column(Integer, ForeignKey("trips.id", ondelete="RESTRICT"), nullable=False, index=True)

    reviewed_by_id = Column(Integer, ForeignKey("users.id", ondelete="RESTRICT"), nullable=True, index=True)
    reviewed_at = Column(DateTime(timezone=True), nullable=True)
    review_comment = Column(Text, nullable=True)

    trip = relationship("Trip", foreign_keys="Expense.trip_id", back_populates="expenses")
    reviewer = relationship("User", foreign_keys="Expense.reviewed_by_id", back_populates="reviewed_expenses")


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id = Column(Integer, primary_key=True)
    token_hash = Column(String(64),unique=True,nullable=False,index=True)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    revoked_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True),server_default=func.now(),nullable=False)


    user_id = Column(Integer,ForeignKey("users.id", ondelete="CASCADE"),nullable=False,index=True)
    user = relationship("User",foreign_keys="RefreshToken.user_id",back_populates="refresh_tokens")