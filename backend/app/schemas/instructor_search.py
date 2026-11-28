# app/schemas/instructor_search.py
from typing import Literal
from uuid import UUID

from pydantic import BaseModel

from app.schemas.instructor_public import CityOut


class InstructorCardOut(BaseModel):
    id: UUID
    display_name: str
    photo_url: str | None
    cities: list[CityOut]
    categories: list[Literal["A", "B"]]
    terrains: list[str]
    vehicle_types: list[str]
    rating_average: float | None
    rating_count: int


class InstructorSearchOut(BaseModel):
    items: list[InstructorCardOut]
    total: int
    page: int
    page_size: int
    default_city: CityOut | None