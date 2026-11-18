from collections import defaultdict
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session, contains_eager, selectinload

# ADAPTAR: nomes dos models conforme o que a 01.1, 04.1, 05.1 e 07.1 definirem.
from app.models import AccreditationSubmission, Instructor, Review, User
from app.schemas.instructor_public import (
    AccreditationOut,
    AvailabilityOut,
    CityOut,
    InstructorPublicOut,
    ReviewsOut,
    VehicleOut,
)

VISIBLE_STATUSES = ("aprovado", "pendente")
_PERIOD_ORDER = {"manha": 0, "tarde": 1, "noite": 2}


class InstructorNotFoundError(Exception):
    pass


def _photo_url(photo_key: str | None) -> str | None:
    # TODO: trocar por URL assinada de curta duração do bucket privado.
    if photo_key and photo_key.startswith(("http://", "https://")):
        return photo_key
    return None


def _availability(rows) -> list[AvailabilityOut]:
    by_day: dict[int, list[str]] = defaultdict(list)
    for row in rows:
        by_day[row.weekday].append(row.period)
    return [
        AvailabilityOut(weekday=day, periods=sorted(periods, key=_PERIOD_ORDER.__getitem__))
        for day, periods in sorted(by_day.items())
    ]


def get_public_profile(
    db: Session, instructor_id: UUID, viewer: User | None
) -> InstructorPublicOut:
    instructor = db.scalars(
        select(Instructor)
        .join(Instructor.user)
        .options(
            contains_eager(Instructor.user),
            selectinload(Instructor.categories),
            selectinload(Instructor.cities),
            selectinload(Instructor.terrains),
            selectinload(Instructor.availability),
            selectinload(Instructor.vehicles),
        )
        .where(
            Instructor.user_id == instructor_id,
            Instructor.verification_status.in_(VISIBLE_STATUSES),
            User.deleted_at.is_(None),
        )
    ).one_or_none()
    if instructor is None:
        raise InstructorNotFoundError

    reviewed_at = None
    if instructor.verification_status == "aprovado":
        reviewed_at = db.scalar(
            select(AccreditationSubmission.reviewed_at)
            .where(
                AccreditationSubmission.instructor_id == instructor_id,
                AccreditationSubmission.status == "aprovado",
            )
            .order_by(AccreditationSubmission.reviewed_at.desc())
            .limit(1)
        )

    average, count = db.execute(
        select(func.avg(Review.rating), func.count(Review.id)).where(
            Review.instructor_id == instructor_id, Review.hidden.is_(False)
        )
    ).one()

    return InstructorPublicOut(
        id=instructor.user_id,
        display_name=instructor.user.display_name,
        photo_url=_photo_url(instructor.photo_key),
        bio=instructor.experience,
        training_structure=instructor.training_structure,
        phone=instructor.phone if viewer is not None else None,
        cities=[
            CityOut(ibge_code=c.ibge_code, name=c.name, uf=c.uf)
            for c in sorted(instructor.cities, key=lambda c: c.name)
        ],
        categories=sorted(c.category for c in instructor.categories),
        terrains=sorted(t.code for t in instructor.terrains),
        availability=_availability(instructor.availability),
        vehicles=[
            VehicleOut(
                type=v.type, brand_model=v.brand_model, year=v.year,
                transmission=v.transmission, dual_control=v.dual_control,
                category=v.category,
            )
            for v in sorted(instructor.vehicles, key=lambda v: v.id or 0)
        ],
        accreditation=AccreditationOut(
            status=instructor.verification_status, reviewed_at=reviewed_at
        ),
        reviews=ReviewsOut(
            average=round(float(average), 1) if average is not None else None,
            count=count,
            items=[],
        ),
    )