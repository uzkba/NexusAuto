from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import exists, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models import ContactLog, Instructor, Review, User
from app.schemas.review import MyReviewStatusOut, ReviewIn, ReviewOut
from app.services.instructor_visibility import approved_only


class InstructorNotFoundError(Exception):
    pass


class ContactRequiredError(Exception):
    pass


class ReviewAlreadyExistsError(Exception):
    pass


class ReviewNotFoundError(Exception):
    pass


def _ensure_visible_instructor(db: Session, instructor_id: UUID) -> None:
    found = db.scalar(
        approved_only(
            select(Instructor.user_id)
            .join(Instructor.user)
            .where(
                Instructor.user_id == instructor_id,
                User.deleted_at.is_(None),
            )
        )
    )
    if found is None:
        raise InstructorNotFoundError


def _has_contact(db: Session, student_id: UUID, instructor_id: UUID) -> bool:
    return bool(
        db.scalar(
            select(
                exists().where(
                    ContactLog.student_id == student_id,
                    ContactLog.instructor_id == instructor_id,
                )
            )
        )
    )


def _get_student_review(
    db: Session, student_id: UUID, instructor_id: UUID
) -> Review | None:
    return db.scalars(
        select(Review).where(
            Review.student_id == student_id,
            Review.instructor_id == instructor_id,
        )
    ).one_or_none()


def _is_duplicate_review_error(exc: IntegrityError) -> bool:
    orig = exc.orig
    constraint_name = getattr(getattr(orig, "diag", None), "constraint_name", None)
    if constraint_name == "uq_reviews_student_instructor":
        return True
    return "uq_reviews_student_instructor" in str(orig)


def get_my_review_status(
    db: Session, student_id: UUID, instructor_id: UUID
) -> MyReviewStatusOut:
    _ensure_visible_instructor(db, instructor_id)
    has_contact = _has_contact(db, student_id, instructor_id)
    review = _get_student_review(db, student_id, instructor_id)
    return MyReviewStatusOut(
        can_review=has_contact,
        has_contact=has_contact,
        reason=None if has_contact else "contact_required",
        review=ReviewOut.model_validate(review) if review is not None else None,
    )


def create_review(
    db: Session, student_id: UUID, instructor_id: UUID, data: ReviewIn
) -> ReviewOut:
    _ensure_visible_instructor(db, instructor_id)
    if not _has_contact(db, student_id, instructor_id):
        raise ContactRequiredError
    if _get_student_review(db, student_id, instructor_id) is not None:
        raise ReviewAlreadyExistsError

    review = Review(
        student_id=student_id,
        instructor_id=instructor_id,
        rating=data.rating,
        comment=data.comment,
    )
    db.add(review)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        if _is_duplicate_review_error(exc):
            raise ReviewAlreadyExistsError from None
        raise
    db.refresh(review)
    return ReviewOut.model_validate(review)


def update_review(
    db: Session, student_id: UUID, instructor_id: UUID, data: ReviewIn
) -> ReviewOut:
    _ensure_visible_instructor(db, instructor_id)
    if not _has_contact(db, student_id, instructor_id):
        raise ContactRequiredError
    review = _get_student_review(db, student_id, instructor_id)
    if review is None:
        raise ReviewNotFoundError

    review.rating = data.rating
    review.comment = data.comment
    review.updated_at = datetime.now(UTC)
    db.commit()
    db.refresh(review)
    return ReviewOut.model_validate(review)
