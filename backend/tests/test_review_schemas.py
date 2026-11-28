from datetime import UTC, datetime
from uuid import uuid4

import pytest
from pydantic import ValidationError

from app.schemas.review import MAX_COMMENT_LENGTH, MyReviewStatusOut, ReviewIn, ReviewOut


@pytest.mark.parametrize("rating", [1, 2, 3, 4, 5])
def test_review_in_accepts_valid_ratings_without_comment(rating):
    payload = ReviewIn(rating=rating)
    assert payload.rating == rating
    assert payload.comment is None


def test_review_in_trims_comment():
    payload = ReviewIn(rating=5, comment="  Ótimo instrutor!  \n")
    assert payload.rating == 5
    assert payload.comment == "Ótimo instrutor!"


@pytest.mark.parametrize("comment", [None, "", "   ", "\t\n  "])
def test_review_in_normalizes_blank_comment_to_none(comment):
    payload = ReviewIn(rating=4, comment=comment)
    assert payload.comment is None


def test_review_in_accepts_comment_at_exact_max_length():
    text = "a" * MAX_COMMENT_LENGTH
    payload = ReviewIn(rating=5, comment=f"  {text}  ")
    assert payload.comment == text


def test_review_in_rejects_comment_exceeding_max_length():
    with pytest.raises(ValidationError) as exc:
        ReviewIn(rating=5, comment="a" * (MAX_COMMENT_LENGTH + 1))
    err = exc.value.errors()[0]
    assert err["type"] == "value_error"
    assert err["loc"] == ("comment",)
    assert "O comentário deve ter no máximo 1000 caracteres." in err["msg"]


def test_review_in_requires_rating():
    with pytest.raises(ValidationError) as exc:
        ReviewIn()
    err = exc.value.errors()[0]
    assert err["type"] == "missing"
    assert err["loc"] == ("rating",)


@pytest.mark.parametrize("rating", [-1, 0, 6, 99])
def test_review_in_rejects_out_of_range_rating(rating):
    with pytest.raises(ValidationError) as exc:
        ReviewIn(rating=rating)
    err = exc.value.errors()[0]
    assert err["type"] == "value_error"
    assert err["loc"] == ("rating",)
    assert "A nota deve estar entre 1 e 5 estrelas." in err["msg"]


@pytest.mark.parametrize("rating", [True, False])
def test_review_in_rejects_bool_rating(rating):
    with pytest.raises(ValidationError) as exc:
        ReviewIn(rating=rating)
    err = exc.value.errors()[0]
    assert err["type"] == "value_error"
    assert err["loc"] == ("rating",)
    assert "A nota deve estar entre 1 e 5 estrelas." in err["msg"]


@pytest.mark.parametrize("rating", [None, "abc", 4.5])
def test_review_in_rejects_non_integer_rating(rating):
    with pytest.raises(ValidationError) as exc:
        ReviewIn(rating=rating)
    assert exc.value.errors()[0]["loc"] == ("rating",)


def test_review_in_forbids_extra_fields():
    with pytest.raises(ValidationError) as exc:
        ReviewIn(rating=5, hidden=True)
    assert exc.value.errors()[0]["type"] == "extra_forbidden"


def test_my_review_status_out_shapes():
    now = datetime.now(UTC)
    review = ReviewOut(
        id=1,
        instructor_id=uuid4(),
        student_id=uuid4(),
        rating=5,
        comment="Excelente",
        created_at=now,
        updated_at=now,
    )
    status_blocked = MyReviewStatusOut(
        can_review=False,
        has_contact=False,
        reason="contact_required",
        review=None,
    )
    assert status_blocked.model_dump() == {
        "can_review": False,
        "has_contact": False,
        "reason": "contact_required",
        "review": None,
    }

    status_allowed = MyReviewStatusOut(
        can_review=True,
        has_contact=True,
        reason=None,
        review=review,
    )
    assert status_allowed.can_review is True
    assert status_allowed.review is not None
    assert status_allowed.review.rating == 5
