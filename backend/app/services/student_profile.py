import uuid

from fastapi.exceptions import RequestValidationError
from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.orm import Session

from app.models import City
from app.models.user import Student
from app.schemas.student import StudentProfileUpdate


def upsert_student_profile(
    db: Session, user_id: uuid.UUID, payload: StudentProfileUpdate
) -> Student:
    city_exists = db.scalar(
        select(City.ibge_code).where(City.ibge_code == payload.city_ibge)
    )
    if city_exists is None:
        raise RequestValidationError(
            [
                {
                    "type": "value_error",
                    "loc": ("body", "city_ibge"),
                    "msg": "Value error, Cidade não encontrada.",
                    "input": payload.city_ibge,
                }
            ]
        )

    values = {
        "city_ibge": payload.city_ibge,
        "vehicle_interest": payload.vehicle_interest.value,
        "objectives": [o.value for o in payload.objectives],
    }
    stmt = (
        pg_insert(Student)
        .values(user_id=user_id, **values)
        .on_conflict_do_update(index_elements=[Student.user_id], set_=values)
    )
    db.execute(stmt)
    db.commit()

    return db.execute(
        select(Student)
        .where(Student.user_id == user_id)
        .execution_options(populate_existing=True)
    ).scalar_one()