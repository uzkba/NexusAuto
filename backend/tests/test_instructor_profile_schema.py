import pytest
from pydantic import ValidationError

from app.schemas.instructor_profile import InstructorProfileIn

VALID = {
    "display_name": "Carlos Mendes",
    "accreditation_number": "DET-1111",
    "categories": ["B", "A", "B"],
    "city_ibge_codes": [2510808],
    "terrain_ids": [1, 2],
    "phone": "(83) 99999-0001",
}


def test_valid_payload_is_normalized():
    data = InstructorProfileIn(**VALID)
    assert data.phone == "83999990001"
    assert data.categories == ["A", "B"]
    assert data.bio is None


@pytest.mark.parametrize(
    "field,value",
    [
        ("display_name", "   "),
        ("accreditation_number", ""),
        ("categories", []),
        ("city_ibge_codes", []),
        ("terrain_ids", []),
        ("phone", "123"),
    ],
)
def test_required_fields_are_rejected(field, value):
    with pytest.raises(ValidationError) as exc:
        InstructorProfileIn(**{**VALID, field: value})
    assert exc.value.errors()[0]["loc"] == (field,)


def test_missing_field_is_rejected():
    payload = {k: v for k, v in VALID.items() if k != "phone"}
    with pytest.raises(ValidationError):
        InstructorProfileIn(**payload)