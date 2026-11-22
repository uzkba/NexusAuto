import re
from typing import Literal

from pydantic import BaseModel, field_validator

from app.schemas.instructor_public import CityOut


class TerrainOut(BaseModel):
    id: int
    code: str


class InstructorProfileIn(BaseModel):
    display_name: str
    accreditation_number: str
    categories: list[Literal["A", "B"]]
    city_ibge_codes: list[int]
    terrain_ids: list[int]
    phone: str
    bio: str | None = None
    training_structure: str | None = None

    @field_validator("display_name")
    @classmethod
    def _display_name(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Informe o nome de exibição.")
        if len(v) > 120:
            raise ValueError("O nome de exibição deve ter no máximo 120 caracteres.")
        return v

    @field_validator("accreditation_number")
    @classmethod
    def _accreditation_number(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Informe o número de credenciamento.")
        return v

    @field_validator("categories")
    @classmethod
    def _categories(cls, v: list[str]) -> list[str]:
        if not v:
            raise ValueError("Selecione ao menos uma categoria (A ou B).")
        return sorted(set(v))

    @field_validator("city_ibge_codes")
    @classmethod
    def _cities(cls, v: list[int]) -> list[int]:
        if not v:
            raise ValueError("Selecione ao menos uma cidade de atuação.")
        return sorted(set(v))

    @field_validator("terrain_ids")
    @classmethod
    def _terrains(cls, v: list[int]) -> list[int]:
        if not v:
            raise ValueError("Selecione ao menos um tipo de terreno.")
        return sorted(set(v))

    @field_validator("phone")
    @classmethod
    def _phone(cls, v: str) -> str:
        digits = re.sub(r"\D", "", v)
        if digits.startswith("55") and len(digits) > 11:
            digits = digits[2:]
        if len(digits) not in (10, 11):
            raise ValueError(
                "Telefone inválido. Informe DDD e número, ex.: (83) 99999-0001."
            )
        return digits

    @field_validator("bio", "training_structure")
    @classmethod
    def _optional_text(cls, v: str | None) -> str | None:
        return (v or "").strip() or None


class InstructorProfileOut(BaseModel):
    display_name: str
    accreditation_number: str | None
    verification_status: Literal["pendente", "aprovado", "rejeitado"]
    categories: list[Literal["A", "B"]]
    cities: list[CityOut]
    terrains: list[TerrainOut]
    phone: str | None
    bio: str | None
    training_structure: str | None