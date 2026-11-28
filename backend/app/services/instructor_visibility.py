# app/services/instructor_visibility.py
from sqlalchemy import Select

from app.models.instructor import Instructor

APPROVED = "aprovado"


def approved_only(stmt: Select) -> Select:
    return stmt.where(Instructor.verification_status == APPROVED)