from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import (
    AccreditationSubmission,
    City,
    Instructor,
    InstructorCategory,
    TerrainType,
    User,
)
from app.schemas.instructor_profile import (
    InstructorProfileIn,
    InstructorProfileOut,
    TerrainOut,
)
from app.schemas.instructor_public import CityOut


class ProfileNotFoundError(Exception):
    pass


class InvalidReferenceError(Exception):
    def __init__(self, field: str, message: str):
        super().__init__(message)
        self.field = field
        self.message = message


def _load_all(db: Session, model, column, values, field: str, message: str):
    rows = db.scalars(select(model).where(column.in_(values))).all()
    if len(rows) != len(set(values)):
        raise InvalidReferenceError(field, message)
    return rows


def _latest_submission(db: Session, instructor_id: UUID) -> AccreditationSubmission | None:
    return db.scalars(
        select(AccreditationSubmission)
        .where(AccreditationSubmission.instructor_id == instructor_id)
        .order_by(
            AccreditationSubmission.submitted_at.desc(),
            AccreditationSubmission.id.desc(),
        )
        .limit(1)
    ).first()


def _sync_categories(instructor: Instructor, wanted: list[str]) -> None:
    wanted_set = set(wanted)
    current = {c.category for c in instructor.categories}
    # Diff em vez de recriar tudo: evita conflito de PK composta no mesmo flush.
    instructor.categories = [
        c for c in instructor.categories if c.category in wanted_set
    ] + [InstructorCategory(category=c) for c in sorted(wanted_set - current)]


def _sync_accreditation(db: Session, instructor: Instructor, number: str) -> None:
    latest = _latest_submission(db, instructor.user_id)
    if latest is None:
        db.add(AccreditationSubmission(instructor_id=instructor.user_id,
                                       accreditation_number=number))
        instructor.verification_status = "pendente"
    elif latest.accreditation_number != number:
        if latest.status == "pendente":
            latest.accreditation_number = number
        else:
            # Número alterado após análise: nova submissão volta para revisão.
            db.add(AccreditationSubmission(instructor_id=instructor.user_id,
                                           accreditation_number=number))
            instructor.verification_status = "pendente"


def _to_out(db: Session, user: User, instructor: Instructor) -> InstructorProfileOut:
    latest = _latest_submission(db, instructor.user_id)
    return InstructorProfileOut(
        display_name=user.display_name,
        accreditation_number=latest.accreditation_number if latest else None,
        verification_status=instructor.verification_status,
        categories=sorted(c.category for c in instructor.categories),
        cities=[
            CityOut(ibge_code=c.ibge_code, name=c.name, uf=c.uf)
            for c in sorted(instructor.cities, key=lambda c: c.name)
        ],
        terrains=[
            TerrainOut(id=t.id, code=t.code)
            for t in sorted(instructor.terrains, key=lambda t: t.id)
        ],
        phone=instructor.phone,
        bio=instructor.experience,
        training_structure=instructor.training_structure,
    )


def get_profile(db: Session, user: User) -> InstructorProfileOut:
    db_user = db.get(User, user.id)
    instructor = db.get(Instructor, user.id)
    if instructor is None:
        raise ProfileNotFoundError
    return _to_out(db, db_user, instructor)


def save_profile(db: Session, user: User, data: InstructorProfileIn) -> InstructorProfileOut:
    cities = _load_all(
        db, City, City.ibge_code, data.city_ibge_codes,
        "city_ibge_codes", "Uma ou mais cidades informadas não existem.",
    )
    terrains = _load_all(
        db, TerrainType, TerrainType.id, data.terrain_ids,
        "terrain_ids", "Um ou mais tipos de terreno informados não existem.",
    )

    db_user = db.get(User, user.id)
    db_user.display_name = data.display_name

    instructor = db.get(Instructor, db_user.id)
    if instructor is None:
        instructor = Instructor(user_id=db_user.id)
        db.add(instructor)

    instructor.experience = data.bio
    instructor.training_structure = data.training_structure
    instructor.phone = data.phone
    instructor.cities = list(cities)
    instructor.terrains = list(terrains)
    _sync_categories(instructor, data.categories)
    db.flush()

    _sync_accreditation(db, instructor, data.accreditation_number)
    db.commit()
    return _to_out(db, db_user, instructor)