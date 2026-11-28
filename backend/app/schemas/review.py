from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, field_validator

MAX_COMMENT_LENGTH = 1000


class ReviewIn(BaseModel):
    model_config = ConfigDict(extra="forbid")

    rating: int
    comment: str | None = None

    @field_validator("rating", mode="before")
    @classmethod
    def reject_bool_rating(cls, value: object) -> object:
        if isinstance(value, bool):
            raise ValueError("A nota deve estar entre 1 e 5 estrelas.")  # noqa: TRY004
        return value

    @field_validator("rating")
    @classmethod
    def validate_rating_range(cls, value: int) -> int:
        if value < 1 or value > 5:
            raise ValueError("A nota deve estar entre 1 e 5 estrelas.")
        return value

    @field_validator("comment")
    @classmethod
    def normalize_comment(cls, value: str | None) -> str | None:
        if value is None:
            return None
        trimmed = value.strip()
        if not trimmed:
            return None
        if len(trimmed) > MAX_COMMENT_LENGTH:
            raise ValueError(
                f"O comentário deve ter no máximo {MAX_COMMENT_LENGTH} caracteres."
            )
        return trimmed


class ReviewOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    instructor_id: UUID
    student_id: UUID
    rating: int
    comment: str | None
    created_at: datetime
    updated_at: datetime


class MyReviewStatusOut(BaseModel):
    can_review: bool
    has_contact: bool
    reason: Literal["contact_required"] | None
    review: ReviewOut | None
