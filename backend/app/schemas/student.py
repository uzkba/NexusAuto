from pydantic import BaseModel, ConfigDict, field_validator

from app.enums.enum import StudentObjective, VehicleInterest
from app.services.instructor_public_service import CityOut


class StudentProfileUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    city_ibge: int
    vehicle_interest: VehicleInterest
    objectives: list[StudentObjective]

    @field_validator("objectives")
    @classmethod
    def at_least_one_objective(
        cls, value: list[StudentObjective]
    ) -> list[StudentObjective]:
        unique = list(dict.fromkeys(value))  # remove duplicados, mantém ordem
        if not unique:
            raise ValueError("Selecione pelo menos um objetivo.")
        return unique


class StudentProfileRead(BaseModel):
    """Todos vazios quando o aluno ainda não preencheu o perfil."""

    model_config = ConfigDict(from_attributes=True)

    city: CityOut | None = None
    vehicle_interest: VehicleInterest | None = None
    objectives: list[StudentObjective] = []