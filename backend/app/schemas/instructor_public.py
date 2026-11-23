from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel


class CityOut(BaseModel):
    ibge_code: int
    name: str
    uf: str


class AvailabilityOut(BaseModel):
    weekday: int
    periods: list[Literal["manha", "tarde", "noite"]]


class VehicleOut(BaseModel):
    type: str
    brand_model: str
    year: int
    transmission: Literal["manual", "automatico"]
    dual_control: bool
    category: Literal["A", "B"]


class AccreditationOut(BaseModel):
    status: Literal["aprovado", "pendente"]
    reviewed_at: datetime | None


class ReviewItemOut(BaseModel):
    id: int
    rating: int
    comment: str | None
    created_at: datetime
    author_name: str


class ReviewsOut(BaseModel):
    average: float | None
    count: int
    items: list[ReviewItemOut] = []


class InstructorPublicOut(BaseModel):
    id: UUID
    display_name: str
    photo_url: str | None
    bio: str | None
    training_structure: str | None
    phone: str | None
    cities: list[CityOut]
    categories: list[Literal["A", "B"]]
    terrains: list[str]
    availability: list[AvailabilityOut]
    vehicles: list[VehicleOut]
    accreditation: AccreditationOut
    reviews: ReviewsOut