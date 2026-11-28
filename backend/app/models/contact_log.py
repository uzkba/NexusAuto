import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Index, Integer, Uuid, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class ContactLog(Base):
    __tablename__ = "contact_logs"
    __table_args__ = (
        Index("ix_contact_logs_student_instructor", "student_id", "instructor_id"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    student_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("students.user_id", ondelete="CASCADE"), nullable=False
    )
    instructor_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("instructors.user_id", ondelete="CASCADE"), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
