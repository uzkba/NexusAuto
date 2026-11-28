from typing import Annotated, Literal
from uuid import UUID
from pydantic import Field
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies import get_current_user_optional
from app.models import User
from app.schemas.instructor_public import InstructorPublicOut
from app.schemas.instructor_search import InstructorSearchOut
from app.services import instructor_public_service as service
from app.services.instructor_search_service import (
    SearchFilters,
    search_instructors,
    student_default_city,
)

router = APIRouter(prefix="/instrutores", tags=["instrutores"])


from typing import Annotated, Literal

from pydantic import Field


@router.get("", response_model=InstructorSearchOut)
def buscar_instrutores(
    city_ibge: int | None = None,
    uf: str | None = Query(None, min_length=2, max_length=2),
    category: list[Literal["A", "B"]] | None = Query(None),
    vehicle_type: Literal["carro", "moto"] | None = None,
    transmission: Literal["manual", "automatico"] | None = None,
    dual_control: bool = False,
    terrain_id: list[int] | None = Query(None),
    weekday: list[Annotated[int, Field(ge=0, le=6)]] | None = Query(None),  # 0 = segunda
    period: list[Literal["manha", "tarde", "noite"]] | None = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(12, ge=1, le=50),
    db: Session = Depends(get_db),
    viewer: User | None = Depends(get_current_user_optional),
):
    filters = SearchFilters(
        city_ibge=city_ibge,
        uf=uf.upper() if uf else None,
        categories=tuple(sorted(set(category or ()))),
        vehicle_type=vehicle_type,
        transmission=transmission,
        dual_control=dual_control,
        terrain_ids=tuple(terrain_id or ()),
        weekdays=tuple(weekday or ()),
        periods=tuple(period or ()),
    )
    return search_instructors(
        db,
        filters,
        page,
        page_size,
        default_city_ibge=student_default_city(db, viewer),
    )


@router.get("/{instructor_id}", response_model=InstructorPublicOut)
def obter_perfil_publico(
    instructor_id: UUID,
    db: Session = Depends(get_db),
    viewer: User | None = Depends(get_current_user_optional),
):
    try:
        return service.get_public_profile(db, instructor_id, viewer)
    except service.InstructorNotFoundError:
        raise HTTPException(status_code=404, detail="Instrutor não encontrado") from None