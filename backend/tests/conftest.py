import os

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session

import app.models
from app.core.config import settings
from app.core.database import Base, get_db
from app.main import app


def _test_url() -> str:
    if url := os.getenv("TEST_DATABASE_URL"):
        return url
    # ajuste o nome do atributo se o seu Settings usar outro
    return settings.database_url.rsplit("/", 1)[0] + "/nexus_auto_test"


@pytest.fixture(scope="session")
def engine():
    eng = create_engine(_test_url())
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