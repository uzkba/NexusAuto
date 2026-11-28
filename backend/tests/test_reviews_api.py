import uuid
from datetime import UTC, datetime

import pytest

from app.models import ContactLog, Instructor, Student, User
from app.seed import CARLOS_ID, MARCOS_ID, PATOS, PAULO_ID, _extra_id, seed_all
from app.services import review_service

ANA_ID = _extra_id(1)


def _create_student_with_profile(db) -> User:
    uid = uuid.uuid4()
    user = User(
        id=uid,
        email=f"{uid}@test.dev",
        password_hash="!",
        display_name="Aluno Teste",
        role="aluno",
    )
    db.add(user)
    db.flush()
    db.add(
        Student(
            user_id=uid,
            city_ibge=PATOS,
            vehicle_interest="car",
            objectives=["first_license"],
        )
    )
    db.commit()
    return user


def _create_admin(db) -> User:
    uid = uuid.uuid4()
    user = User(
        id=uid,
        email=f"{uid}@test.dev",
        password_hash="!",
        display_name="Admin Teste",
        role="admin",
    )
    db.add(user)
    db.commit()
    return user


def _add_contact(db, student_id: uuid.UUID, instructor_id: uuid.UUID) -> ContactLog:
    log = ContactLog(student_id=student_id, instructor_id=instructor_id)
    db.add(log)
    db.commit()
    return log


def _url_base(instructor_id: uuid.UUID | str) -> str:
    return f"/instrutores/{instructor_id}/avaliacoes"


def _url_minha(instructor_id: uuid.UUID | str) -> str:
    return f"/instrutores/{instructor_id}/avaliacoes/minha"


@pytest.fixture(autouse=True)
def _seed(db):
    seed_all(db)


@pytest.fixture
def student(db) -> User:
    return _create_student_with_profile(db)


# ---------- autenticação e papel ----------


def test_endpoints_require_authentication(client):
    r_get = client.get(_url_minha(CARLOS_ID))
    r_post = client.post(_url_base(CARLOS_ID), json={"rating": 5})
    r_put = client.put(_url_minha(CARLOS_ID), json={"rating": 5})
    for resp in (r_get, r_post, r_put):
        assert resp.status_code == 401
        assert resp.json() == {"detail": "Autenticação necessária."}


def test_instructor_role_is_forbidden(client, login_as, instrutor):
    login_as(instrutor)
    r_get = client.get(_url_minha(CARLOS_ID))
    r_post = client.post(_url_base(CARLOS_ID), json={"rating": 5})
    r_put = client.put(_url_minha(CARLOS_ID), json={"rating": 5})
    for resp in (r_get, r_post, r_put):
        assert resp.status_code == 403
        assert resp.json() == {"detail": "Apenas alunos podem acessar este recurso."}


def test_admin_role_is_forbidden(client, db, login_as):
    admin = _create_admin(db)
    login_as(admin)
    r_get = client.get(_url_minha(CARLOS_ID))
    r_post = client.post(_url_base(CARLOS_ID), json={"rating": 5})
    r_put = client.put(_url_minha(CARLOS_ID), json={"rating": 5})
    for resp in (r_get, r_post, r_put):
        assert resp.status_code == 403
        assert resp.json() == {"detail": "Apenas alunos podem acessar este recurso."}


# ---------- visibilidade e validação de instrutor ----------


def test_invalid_uuid_returns_422(client, login_as, student):
    login_as(student)
    assert client.get(_url_minha("nao-e-uuid")).status_code == 422
    assert client.post(_url_base("nao-e-uuid"), json={"rating": 5}).status_code == 422
    assert client.put(_url_minha("nao-e-uuid"), json={"rating": 5}).status_code == 422


def test_nonexistent_instructor_returns_404(client, login_as, student):
    login_as(student)
    missing_id = uuid.uuid4()
    for resp in (
        client.get(_url_minha(missing_id)),
        client.post(_url_base(missing_id), json={"rating": 5}),
        client.put(_url_minha(missing_id), json={"rating": 5}),
    ):
        assert resp.status_code == 404
        assert resp.json() == {"detail": "Instrutor não encontrado."}


def test_rejected_instructor_returns_404(client, db, login_as, student):
    _add_contact(db, student.id, PAULO_ID)
    login_as(student)
    for resp in (
        client.get(_url_minha(PAULO_ID)),
        client.post(_url_base(PAULO_ID), json={"rating": 5}),
        client.put(_url_minha(PAULO_ID), json={"rating": 5}),
    ):
        assert resp.status_code == 404
        assert resp.json() == {"detail": "Instrutor não encontrado."}


def test_soft_deleted_instructor_returns_404(client, db, login_as, student):
    _add_contact(db, student.id, CARLOS_ID)
    carlos_user = db.get(User, CARLOS_ID)
    carlos_user.deleted_at = datetime.now(UTC)
    db.commit()

    login_as(student)
    for resp in (
        client.get(_url_minha(CARLOS_ID)),
        client.post(_url_base(CARLOS_ID), json={"rating": 5}),
        client.put(_url_minha(CARLOS_ID), json={"rating": 5}),
    ):
        assert resp.status_code == 404
        assert resp.json() == {"detail": "Instrutor não encontrado."}


def test_pending_instructor_returns_404(client, db, login_as, student):
    _add_contact(db, student.id, MARCOS_ID)
    login_as(student)
    for resp in (
        client.get(_url_minha(MARCOS_ID)),
        client.post(_url_base(MARCOS_ID), json={"rating": 4, "comment": "Bom"}),
        client.put(_url_minha(MARCOS_ID), json={"rating": 4, "comment": "Bom"}),
    ):
        assert resp.status_code == 404
        assert resp.json() == {"detail": "Instrutor não encontrado."}


# ---------- BL09: obrigatoriedade de contato via WhatsApp ----------


def test_without_contact_log_blocks_review_and_reports_reason(client, login_as, student):
    login_as(student)

    r_get = client.get(_url_minha(CARLOS_ID))
    assert r_get.status_code == 200
    assert r_get.json() == {
        "can_review": False,
        "has_contact": False,
        "reason": "contact_required",
        "review": None,
    }

    expected_403 = {
        "detail": "Você precisa entrar em contato com o instrutor via WhatsApp antes de avaliá-lo."
    }
    r_post = client.post(_url_base(CARLOS_ID), json={"rating": 5, "comment": "Ótimo!"})
    assert r_post.status_code == 403
    assert r_post.json() == expected_403

    r_put = client.put(_url_minha(CARLOS_ID), json={"rating": 5, "comment": "Ótimo!"})
    assert r_put.status_code == 403
    assert r_put.json() == expected_403


def test_contact_log_for_another_instructor_does_not_unlock_target(client, db, login_as, student):
    _add_contact(db, student.id, ANA_ID)
    login_as(student)

    r_get = client.get(_url_minha(CARLOS_ID))
    assert r_get.status_code == 200
    assert r_get.json()["can_review"] is False
    assert r_get.json()["reason"] == "contact_required"

    assert client.post(_url_base(CARLOS_ID), json={"rating": 5}).status_code == 403


def test_multiple_contact_logs_allow_review(client, db, login_as, student):
    _add_contact(db, student.id, CARLOS_ID)
    _add_contact(db, student.id, CARLOS_ID)
    login_as(student)

    r = client.post(_url_base(CARLOS_ID), json={"rating": 5})
    assert r.status_code == 201


# ---------- criação de avaliação ----------


def test_create_review_with_comment_and_retrieve_status(client, db, login_as, student):
    _add_contact(db, student.id, ANA_ID)
    login_as(student)

    r = client.post(
        _url_base(ANA_ID),
        json={"rating": 5, "comment": "  Excelente didática e paciência!  "},
    )
    assert r.status_code == 201
    created = r.json()
    assert isinstance(created["id"], int)
    assert created["instructor_id"] == str(ANA_ID)
    assert created["student_id"] == str(student.id)
    assert created["rating"] == 5
    assert created["comment"] == "Excelente didática e paciência!"
    assert created["created_at"] is not None
    assert created["updated_at"] is not None

    r_status = client.get(_url_minha(ANA_ID))
    assert r_status.status_code == 200
    assert r_status.json() == {
        "can_review": True,
        "has_contact": True,
        "reason": None,
        "review": created,
    }


def test_create_review_without_comment_normalizes_to_none(client, db, login_as, student):
    _add_contact(db, student.id, ANA_ID)
    login_as(student)

    r = client.post(_url_base(ANA_ID), json={"rating": 3, "comment": "   "})
    assert r.status_code == 201
    assert r.json()["rating"] == 3
    assert r.json()["comment"] is None


def test_duplicate_review_returns_409(client, db, login_as, student):
    _add_contact(db, student.id, ANA_ID)
    login_as(student)

    first = client.post(_url_base(ANA_ID), json={"rating": 5, "comment": "Primeira"})
    assert first.status_code == 201

    second = client.post(_url_base(ANA_ID), json={"rating": 4, "comment": "Segunda"})
    assert second.status_code == 409
    assert second.json() == {
        "detail": "Você já avaliou este instrutor. Use a opção de editar avaliação."
    }


def test_duplicate_review_race_condition_handled_via_integrity_error(
    client, db, login_as, student, monkeypatch
):
    _add_contact(db, student.id, ANA_ID)
    login_as(student)

    assert client.post(_url_base(ANA_ID), json={"rating": 5}).status_code == 201

    # Simula condição de corrida pulando o pré-check e forçando UniqueViolation no DB
    monkeypatch.setattr(review_service, "_get_student_review", lambda *_args, **_kw: None)
    r = client.post(_url_base(ANA_ID), json={"rating": 4})
    assert r.status_code == 409
    assert r.json() == {
        "detail": "Você já avaliou este instrutor. Use a opção de editar avaliação."
    }


# ---------- edição de avaliação ----------


def test_edit_review_without_existing_review_returns_404(client, db, login_as, student):
    _add_contact(db, student.id, ANA_ID)
    login_as(student)

    r = client.put(_url_minha(ANA_ID), json={"rating": 4, "comment": "Sem anterior"})
    assert r.status_code == 404
    assert r.json() == {"detail": "Avaliação não encontrada."}


def test_edit_existing_review_updates_fields_and_clears_blank_comment(
    client, db, login_as, student
):
    _add_contact(db, student.id, ANA_ID)
    login_as(student)

    created = client.post(
        _url_base(ANA_ID),
        json={"rating": 3, "comment": "Comentário inicial"},
    ).json()

    updated_resp = client.put(
        _url_minha(ANA_ID),
        json={"rating": 5, "comment": "   "},
    )
    assert updated_resp.status_code == 200
    updated = updated_resp.json()
    assert updated["id"] == created["id"]
    assert updated["created_at"] == created["created_at"]
    assert updated["rating"] == 5
    assert updated["comment"] is None

    status_body = client.get(_url_minha(ANA_ID)).json()
    assert status_body["review"]["rating"] == 5
    assert status_body["review"]["comment"] is None


# ---------- validações de payload (422) ----------


def test_payload_missing_rating_returns_422(client, db, login_as, student):
    _add_contact(db, student.id, ANA_ID)
    login_as(student)

    r = client.post(_url_base(ANA_ID), json={"comment": "Sem nota"})
    assert r.status_code == 422
    assert r.json() == {
        "detail": "Dados inválidos.",
        "errors": [{"field": "rating", "message": "Campo obrigatório."}],
    }


@pytest.mark.parametrize("bad_rating", [0, 6, -2, True, False])
def test_payload_invalid_rating_returns_422_portuguese_message(
    client, db, login_as, student, bad_rating
):
    _add_contact(db, student.id, ANA_ID)
    login_as(student)

    r = client.post(_url_base(ANA_ID), json={"rating": bad_rating})
    assert r.status_code == 422
    assert r.json() == {
        "detail": "Dados inválidos.",
        "errors": [{"field": "rating", "message": "A nota deve estar entre 1 e 5 estrelas."}],
    }


def test_payload_comment_too_long_returns_422(client, db, login_as, student):
    _add_contact(db, student.id, ANA_ID)
    login_as(student)

    r = client.post(_url_base(ANA_ID), json={"rating": 5, "comment": "x" * 1001})
    assert r.status_code == 422
    assert r.json() == {
        "detail": "Dados inválidos.",
        "errors": [
            {"field": "comment", "message": "O comentário deve ter no máximo 1000 caracteres."}
        ],
    }


def test_payload_extra_field_returns_422(client, db, login_as, student):
    _add_contact(db, student.id, ANA_ID)
    login_as(student)

    r = client.post(_url_base(ANA_ID), json={"rating": 5, "hidden": True})
    assert r.status_code == 422


# ---------- integração com perfil público ----------


def test_public_profile_reflects_created_and_edited_reviews(client, db, login_as, student):
    student2 = _create_student_with_profile(db)
    _add_contact(db, student.id, ANA_ID)
    _add_contact(db, student2.id, ANA_ID)

    # Ana começa sem avaliações no seed
    before = client.get(f"/instrutores/{ANA_ID}").json()["reviews"]
    assert before == {"average": None, "count": 0, "items": []}

    login_as(student)
    assert client.post(_url_base(ANA_ID), json={"rating": 4}).status_code == 201
    after_one = client.get(f"/instrutores/{ANA_ID}").json()["reviews"]
    assert after_one == {"average": 4.0, "count": 1, "items": []}

    login_as(student2)
    assert client.post(_url_base(ANA_ID), json={"rating": 5}).status_code == 201
    after_two = client.get(f"/instrutores/{ANA_ID}").json()["reviews"]
    assert after_two == {"average": 4.5, "count": 2, "items": []}

    # Edita a primeira avaliação de 4 para 2 -> média cai para 3.5, count continua 2
    login_as(student)
    assert client.put(_url_minha(ANA_ID), json={"rating": 2}).status_code == 200
    after_edit = client.get(f"/instrutores/{ANA_ID}").json()["reviews"]
    assert after_edit == {"average": 3.5, "count": 2, "items": []}

    # Confirma que não duplicou e o instrutor continua íntegro
    assert db.get(Instructor, ANA_ID) is not None
