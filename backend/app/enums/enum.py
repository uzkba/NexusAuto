from enum import StrEnum


class StudentObjective(StrEnum):
    FIRST_LICENSE = "first_license"        # Primeira habilitação
    HIGHWAY_PRACTICE = "highway_practice"  # Prática em rodovia
    RESUME_DRIVING = "resume_driving"      # Retomada da direção


class VehicleInterest(StrEnum):
    CAR = "car"                # Carro
    MOTORCYCLE = "motorcycle"  # Moto