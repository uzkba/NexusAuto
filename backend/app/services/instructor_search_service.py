# app/services/instructor_search_service.py
from dataclasses import dataclass, replace

from sqlalchemy import and_, func, select
from sqlalchemy.orm import Session, contains_eager, selectinload

from app.models import Review, Student, User
from app.models.catalog import City, TerrainType
from app.models.instructor import (
    Instructor,
    InstructorAvailability,
    InstructorCategory,
    Vehicle,
)
from app.schemas.instructor_public import CityOut
from app.schemas.instructor_search import InstructorCardOut, InstructorSearchOut
from app.services.instructor_public_service import _photo_url
from app.services.instructor_visibility import approved_only


@dataclass(frozen=True)
class SearchFilters:
    city_ibge: int | None = None
    uf: str | None = None
    categories: tuple[str, ...] = ()
    vehicle_type: str | None = None
    transmission: str | None = None
    dual_control: bool = False
    terrain_ids: tuple[int, ...] = ()
    weekdays: tuple[int, ...] = ()
    periods: tuple[str, ...] = ()


def student_default_city(db: Session, viewer: User | None) -> int | None:
    if viewer is None or viewer.role != "aluno":
        return None
    return db.scalar(select(Student.city_ibge).where(Student.user_id == viewer.id))


def _conditions(f: SearchFilters) -> list:
    conds = [User.deleted_at.is_(None)]
    if f.city_ibge is not None:
        conds.append(Instructor.cities.any(City.ibge_code == f.city_ibge))
    if f.uf:
        conds.append(Instructor.cities.any(City.uf == f.uf))
    for c in f.categories:
        conds.append(Instructor.categories.any(InstructorCategory.category == c))

    vehicle = []
    if f.vehicle_type:
        vehicle.append(Vehicle.type == f.vehicle_type)
    if f.transmission:
        vehicle.append(Vehicle.transmission == f.transmission)
    if f.dual_control:
        vehicle.append(Vehicle.dual_control.is_(True))
    if vehicle:
        conds.append(Instructor.vehicles.any(and_(*vehicle)))

    if f.terrain_ids:
        conds.append(Instructor.terrains.any(TerrainType.id.in_(f.terrain_ids)))

    if f.weekdays or f.periods:
        av = []
        if f.weekdays:
            av.append(InstructorAvailability.weekday.in_(f.weekdays))
        if f.periods:
            av.append(InstructorAvailability.period.in_(f.periods))
        conds.append(Instructor.availability.any(and_(*av)))
    return conds


def search_instructors(
    db: Session,
    filters: SearchFilters,
    page: int,
    page_size: int,
    default_city_ibge: int | None = None,
) -> InstructorSearchOut:
    default_city = None
    if (
        filters.city_ibge is None
        and not filters.uf
        and default_city_ibge is not None
    ):
        filters = replace(filters, city_ibge=default_city_ibge)
        default_city = db.get(City, default_city_ibge)

    conds = _conditions(filters)

    total = db.scalar(
        approved_only(
            select(func.count())
            .select_from(Instructor)
            .join(Instructor.user)
            .where(*conds)
        )
    )

    instructors = db.scalars(
        approved_only(
            select(Instructor).join(Instructor.user).where(*conds)
        )
        .options(
            contains_eager(Instructor.user),
            selectinload(Instructor.categories),
            selectinload(Instructor.cities),
            selectinload(Instructor.terrains),
            selectinload(Instructor.vehicles),
        )
        .order_by(User.display_name, Instructor.user_id)
        .offset((page - 1) * page_size)
        .limit(page_size)
    ).all()

    ids = [i.user_id for i in instructors]
    ratings = {}
    if ids:
        rows = db.execute(
            select(Review.instructor_id, func.avg(Review.rating), func.count(Review.id))
            .where(Review.instructor_id.in_(ids), Review.hidden.is_(False))
            .group_by(Review.instructor_id)
        ).all()
        ratings = {r[0]: (float(r[1]), r[2]) for r in rows}

    items = []
    for i in instructors:
        avg, count = ratings.get(i.user_id, (None, 0))
        items.append(
            InstructorCardOut(
                id=i.user_id,
                display_name=i.user.display_name,
                photo_url=_photo_url(i.photo_key),
                cities=[
                    CityOut(ibge_code=c.ibge_code, name=c.name, uf=c.uf)
                    for c in sorted(i.cities, key=lambda c: c.name)
                ],
                categories=sorted(c.category for c in i.categories),
                terrains=sorted(t.code for t in i.terrains),
                vehicle_types=sorted({v.type for v in i.vehicles}),
                rating_average=round(avg, 1) if avg is not None else None,
                rating_count=count,
            )
        )

    return InstructorSearchOut(
        items=items,
        total=total or 0,
        page=page,
        page_size=page_size,
        default_city=(
            CityOut(
                ibge_code=default_city.ibge_code,
                name=default_city.name,
                uf=default_city.uf,
            )
            if default_city
            else None
        ),
    )