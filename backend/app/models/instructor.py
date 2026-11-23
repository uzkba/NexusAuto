import uuid
from datetime import datetime

from sqlalchemy import (
    CHAR,
    Boolean,
    CheckConstraint,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    SmallInteger,
    Table,
    Text,
    Uuid,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.catalog import City, TerrainType
from app.models.user import User

instructor_cities = Table(
    "instructor_cities",
    Base.metadata,
    Column(
        "instructor_id",
        Uuid,
        ForeignKey("instructors.user_id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column("city_ibge", Integer, ForeignKey("cities.ibge_code"), primary_key=True),
)

instructor_terrains = Table(
    "instructor_terrains",
    Base.metadata,
    Column(
        "instructor_id",
        Uuid,
        ForeignKey("instructors.user_id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column("terrain_id", SmallInteger, ForeignKey("terrain_types.id"), primary_key=True),
)


class Instructor(Base):
    __tablename__ = "instructors"
    __table_args__ = (
        CheckConstraint(
            "verification_status IN ('pendente','aprovado','rejeitado')",
            name="ck_instructors_verification_status",
        ),
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    photo_key: Mapped[str | None] = mapped_column(Text)
    experience: Mapped[str | None] = mapped_column(Text)
    training_structure: Mapped[str | None] = mapped_column(Text)
    phone: Mapped[str | None] = mapped_column(Text)
    verification_status: Mapped[str] = mapped_column(
        Text, default="pendente", server_default="pendente"
    )

    # Relacionamentos
    user: Mapped[User] = relationship()
    categories: Mapped[list["InstructorCategory"]] = relationship(
        cascade="all, delete-orphan"
    )
    availability: Mapped[list["InstructorAvailability"]] = relationship(
        cascade="all, delete-orphan"
    )
    vehicles: Mapped[list["Vehicle"]] = relationship(
        cascade="all, delete-orphan"
    )
    cities: Mapped[list[City]] = relationship(
        secondary=instructor_cities
    )
    terrains: Mapped[list[TerrainType]] = relationship(
        secondary=instructor_terrains
    )
    accreditations: Mapped[list["AccreditationSubmission"]] = relationship(
        cascade="all, delete-orphan"
    )

class InstructorCategory(Base):
    __tablename__ = "instructor_categories"
    __table_args__ = (
        CheckConstraint("category IN ('A','B')", name="ck_instructor_categories_category"),
    )

    instructor_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("instructors.user_id", ondelete="CASCADE"), primary_key=True
    )
    category: Mapped[str] = mapped_column(CHAR(1), primary_key=True)


class InstructorAvailability(Base):
    __tablename__ = "instructor_availability"
    __table_args__ = (
        CheckConstraint("weekday BETWEEN 0 AND 6", name="ck_availability_weekday"),
        CheckConstraint(
            "period IN ('manha','tarde','noite')", name="ck_availability_period"
        ),
    )

    instructor_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("instructors.user_id", ondelete="CASCADE"), primary_key=True
    )
    weekday: Mapped[int] = mapped_column(SmallInteger, primary_key=True)  # 0 = segunda
    period: Mapped[str] = mapped_column(Text, primary_key=True)


class Vehicle(Base):
    __tablename__ = "vehicles"
    __table_args__ = (
        CheckConstraint(
            "transmission IN ('manual','automatico')", name="ck_vehicles_transmission"
        ),
        CheckConstraint("category IN ('A','B')", name="ck_vehicles_category"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    instructor_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("instructors.user_id", ondelete="CASCADE")
    )
    type: Mapped[str] = mapped_column(Text)  # 'moto' | 'carro'
    brand_model: Mapped[str] = mapped_column(Text)
    year: Mapped[int] = mapped_column(SmallInteger)
    transmission: Mapped[str] = mapped_column(Text)
    dual_control: Mapped[bool] = mapped_column(Boolean, default=False)
    category: Mapped[str] = mapped_column(CHAR(1))


class AccreditationSubmission(Base):
    __tablename__ = "accreditation_submissions"
    __table_args__ = (
        CheckConstraint(
            "status IN ('pendente','aprovado','rejeitado')",
            name="ck_accreditation_status",
        ),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    instructor_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("instructors.user_id", ondelete="CASCADE")
    )
    accreditation_number: Mapped[str] = mapped_column(Text)
    file_key: Mapped[str] = mapped_column(Text)
    status: Mapped[str] = mapped_column(Text, default="pendente")
    rejection_reason: Mapped[str | None] = mapped_column(Text)
    reviewed_by: Mapped[uuid.UUID | None] = mapped_column(Uuid, ForeignKey("users.id"))
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    submitted_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    instructor: Mapped["Instructor"] = relationship()