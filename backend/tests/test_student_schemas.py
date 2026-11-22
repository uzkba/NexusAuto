import pytest
from pydantic import ValidationError

from app.schemas.student import StudentProfileUpdate


def valid(**over):
    data = {"city_ibge": 2510808, "vehicle_interest": "car", "objectives": ["first_license"]}
    data.update(over)
    return data


def test_valid_payload():
    p = StudentProfileUpdate(**valid())
    assert p.city_ibge == 2510808
    assert p.vehicle_interest == "car"
    assert p.objectives == ["first_license"]


def test_empty_objectives_rejected_with_clear_message():
    with pytest.raises(ValidationError) as exc:
        StudentProfileUpdate(**valid(objectives=[]))
    err = exc.value.errors()[0]
    assert err["type"] == "value_error"
    assert err["loc"] == ("objectives",)
    assert "Selecione pelo menos um objetivo." in err["msg"]


def test_missing_objectives_rejected():
    data = valid()
    del data["objectives"]
    with pytest.raises(ValidationError):
        StudentProfileUpdate(**data)


def test_duplicate_objectives_are_removed_keeping_order():
    p = StudentProfileUpdate(
        **valid(objectives=["resume_driving", "first_license", "resume_driving"])
    )
    assert p.objectives == ["resume_driving", "first_license"]


def test_invalid_objective_rejected():
    with pytest.raises(ValidationError):
        StudentProfileUpdate(**valid(objectives=["voar"]))


@pytest.mark.parametrize("field", ["city_ibge", "vehicle_interest"])
def test_required_fields(field):
    data = valid()
    del data[field]
    with pytest.raises(ValidationError):
        StudentProfileUpdate(**data)


def test_null_vehicle_rejected():
    with pytest.raises(ValidationError):
        StudentProfileUpdate(**valid(vehicle_interest=None))


def test_invalid_vehicle_rejected():
    with pytest.raises(ValidationError):
        StudentProfileUpdate(**valid(vehicle_interest="A"))


def test_extra_fields_forbidden():
    with pytest.raises(ValidationError):
        StudentProfileUpdate(**valid(role="admin"))