import os
import uuid

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.engine import make_url
from sqlalchemy.orm import Session

from app import models  # noqa: F401  (registra os models no metadata)
from app.core.config import settings
from app.core.database import Base, get_db
from app.dependencies import get_current_user_optional
from app.main import app
from app.models import City, User

PATOS = 2510808


def _test_url() -> str:
    if url := os.getenv("TEST_DATABASE_URL"):
        return url
    # ajuste o nome do atributo se o seu Settings usar outro
    return settings.database_url.rsplit("/", 1)[0] + "/nexus_auto_test"


@pytest.fixture(scope="session")
def engine():
    url = _test_url()
    # trava: o drop_all abaixo apagaria o banco de dev se a URL estivesse errada
    if not make_url(url).database.endswith("_test"):
        pytest.exit("A URL de testes precisa apontar para um banco terminado em '_test'.")

    eng = create_engine(url)
    with eng.begin() as conn:
        conn.execute(text("CREATE EXTENSION IF NOT EXISTS citext"))
    Base.metadata.drop_all(eng)
    Base.metadata.create_all(eng)
    yield eng
    eng.dispose()


@pytest.fixture
def db(engine):
    conn = engine.connect()
    trans = conn.begin()
    session = Session(bind=conn, join_transaction_mode="create_savepoint")
    yield session
    session.close()
    trans.rollback()
    conn.close()


@pytest.fixture
def client(db):
    app.dependency_overrides[get_db] = lambda: db
    yield TestClient(app)
    app.dependency_overrides.clear()


# ---------- fixtures do fluxo do aluno ----------

@pytest.fixture
def patos(db):
    city = City(ibge_code=PATOS, name="Patos", uf="PB")
    db.add(city)
    db.commit()
    return city


def _make_user(db, role: str) -> User:
    uid = uuid.uuid4()
    user = User(
        id=uid,
        email=f"{uid}@test.dev",
        password_hash="!",
        display_name=f"Teste {role}",
        role=role,
    )
    db.add(user)
    db.commit()
    return user


@pytest.fixture
def aluno(db):
    return _make_user(db, "aluno")


@pytest.fixture
def instrutor(db):
    return _make_user(db, "instrutor")


@pytest.fixture
def login_as(client):
    """login_as(user) faz o stub de autenticação devolver esse usuário."""

    def _login(user: User) -> None:
        app.dependency_overrides[get_current_user_optional] = lambda: user

    return _login