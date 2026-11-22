import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Integer, Text, Uuid, func
from sqlalchemy.dialects.postgresql import ARRAY, CITEXT
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.enums.enum import StudentObjective, VehicleInterest

if TYPE_CHECKING:
    from app.models import City


def _sql_list(enum_cls) -> str:
    return ", ".join(f"'{e.value}'" for e in enum_cls)


class User(Base):
    __tablename__ = "users"
    __table_args__ = (
        CheckConstraint("role IN ('aluno','instrutor','admin')", name="ck_users_role"),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(CITEXT, unique=True)
    password_hash: Mapped[str] = mapped_column(Text)
    display_name: Mapped[str] = mapped_column(Text)
    role: Mapped[str] = mapped_column(Text)
    terms_accepted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    terms_version: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class Student(Base):
    __tablename__ = "students"
    __table_args__ = (
        CheckConstraint(
            f"objectives <@ ARRAY[{_sql_list(StudentObjective)}]::text[]",
            name="ck_students_objectives_valid",
        ),
        CheckConstraint(
            "cardinality(objectives) >= 1",
            name="ck_students_objectives_not_empty",
        ),
        CheckConstraint(
            f"vehicle_interest IN ({_sql_list(VehicleInterest)})",
            name="ck_students_vehicle_interest_valid",
        ),
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    city_ibge: Mapped[int] = mapped_column(
        Integer, ForeignKey("cities.ibge_code"), nullable=False
    )
    vehicle_interest: Mapped[str] = mapped_column(Text, nullable=False)
    objectives: Mapped[list[str]] = mapped_column(ARRAY(Text), nullable=False)

    city: Mapped["City"] = relationship(lazy="joined")