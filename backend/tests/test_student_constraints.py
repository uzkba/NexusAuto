import pytest
from sqlalchemy.exc import IntegrityError

from app.models import Student


def make(aluno, **over):
    data = {
        "user_id": aluno.id,
        "city_ibge": 2510808,
        "vehicle_interest": "car",
        "objectives": ["first_license"],
    }
    data.update(over)
    return Student(**data)


def test_valid_student_persists(db, patos, aluno):
    db.add(make(aluno))
    db.commit()
    saved = db.get(Student, aluno.id)
    assert saved.objectives == ["first_license"]


@pytest.mark.parametrize(
    "override, constraint",
    [
        ({"objectives": []}, "ck_students_objectives_not_empty"),
        ({"objectives": ["voar"]}, "ck_students_objectives_valid"),
        ({"vehicle_interest": "bike"}, "ck_students_vehicle_interest_valid"),
    ],
)
def test_check_constraints_reject_bad_data(db, patos, aluno, override, constraint):
    db.add(make(aluno, **override))
    with pytest.raises(IntegrityError) as exc:
        db.flush()
    assert constraint in str(exc.value)
    db.rollback()


@pytest.mark.parametrize("field", ["city_ibge", "vehicle_interest", "objectives"])
def test_required_columns_are_not_null(db, patos, aluno, field):
    db.add(make(aluno, **{field: None}))
    with pytest.raises(IntegrityError):
        db.flush()
    db.rollback()


def test_unknown_city_violates_foreign_key(db, aluno):
    db.add(make(aluno, city_ibge=1))
    with pytest.raises(IntegrityError):
        db.flush()
    db.rollback()