import pytest

from app.dependencies import get_current_user_optional
from app.main import app
from app.models import Review
from app.seed import CARLOS_ID, MARCOS_ID, PAULO_ID, seed_all


@pytest.fixture(autouse=True)
def _seed(db):
    seed_all(db)


def test_bl01_perfil_publico_aprovado_retorna_todos_os_campos(client):
    r = client.get(f"/instrutores/{CARLOS_ID}")
    assert r.status_code == 200
    body = r.json()
    assert body["display_name"] == "Carlos Mendes"
    assert body["photo_url"]
    assert body["bio"]
    assert body["training_structure"]
    assert [c["name"] for c in body["cities"]] == ["Patos", "Santa Luzia", "São Mamede"]
    assert body["categories"] == ["A", "B"]
    assert body["terrains"] == ["estrada_terra", "rodovia"]
    assert [a["weekday"] for a in body["availability"]] == [1, 3, 5]
    assert body["availability"][0]["periods"] == ["manha", "tarde"]
    assert len(body["vehicles"]) == 2
    assert body["accreditation"]["status"] == "aprovado"
    assert body["accreditation"]["reviewed_at"] is not None
    assert body["reviews"]["count"] == 23
    assert body["reviews"]["average"] == 4.9


def test_bl01_perfil_publico_telefone_nulo_para_anonimo(client):
    assert client.get(f"/instrutores/{CARLOS_ID}").json()["phone"] is None


def test_bl01_perfil_publico_telefone_visivel_para_autenticado(client):
    app.dependency_overrides[get_current_user_optional] = lambda: object()
    assert client.get(f"/instrutores/{CARLOS_ID}").json()["phone"] == "83999990001"


def test_bl01_perfil_publico_pendente_retorna_status_pendente(client):
    r = client.get(f"/instrutores/{MARCOS_ID}")
    assert r.status_code == 200
    body = r.json()
    assert body["accreditation"] == {"status": "pendente", "reviewed_at": None}
    assert body["reviews"] == {"average": None, "count": 0, "items": []}
    assert body["photo_url"] is None


def test_bl01_perfil_publico_rejeitado_retorna_404(client):
    assert client.get(f"/instrutores/{PAULO_ID}").status_code == 404


def test_bl01_perfil_publico_inexistente_retorna_404(client):
    r = client.get("/instrutores/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa")
    assert r.status_code == 404


def test_bl01_perfil_publico_id_invalido_retorna_422(client):
    assert client.get("/instrutores/nao-e-uuid").status_code == 422


def test_bl01_perfil_publico_media_ignora_avaliacoes_ocultas(client, db):
    for review in db.query(Review).filter(Review.rating == 4):
        review.hidden = True
    db.flush()
    reviews = client.get(f"/instrutores/{CARLOS_ID}").json()["reviews"]
    assert reviews["count"] == 21
    assert reviews["average"] == 5.0


def test_bl01_perfil_publico_nao_expoe_campos_internos(client):
    texto = client.get(f"/instrutores/{CARLOS_ID}").text
    for proibido in ("photo_key", "file_key", "rejection_reason", "password_hash", "email"):
        assert proibido not in texto