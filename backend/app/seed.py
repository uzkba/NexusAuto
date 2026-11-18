import uuid
from datetime import UTC, datetime, timedelta

from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import (
    AccreditationSubmission,
    City,
    Instructor,
    InstructorAvailability,
    InstructorCategory,
    Review,
    Student,
    TerrainType,
    User,
    Vehicle,
)

CARLOS_ID = uuid.UUID("11111111-1111-4111-8111-111111111111")
MARCOS_ID = uuid.UUID("22222222-2222-4222-8222-222222222222")
PAULO_ID = uuid.UUID("33333333-3333-4333-8333-333333333333")
ADMIN_ID = uuid.UUID("99999999-9999-4999-8999-999999999999")

PATOS, SANTA_LUZIA, SAO_MAMEDE = 2510808, 2512101, 2513307
CIDADES = {PATOS: "Patos", SANTA_LUZIA: "Santa Luzia", SAO_MAMEDE: "São Mamede"}
TERRENOS = {1: "urbano", 2: "rodovia", 3: "estrada_terra"}

_HASH = "!"
_NOMES = [
    "Mariana Alves", "João Lima", "Beatriz Costa", "Lucas Ferreira",
    "Camila Rocha", "Rafael Dias", "Larissa Gomes", "Pedro Nunes",
]
_COMENTARIOS = [
    "Muito paciente e explica bem.",
    "Perdi o medo de dirigir na rodovia.",
    "Pontual e didático.",
    "Aprendi baliza em poucas aulas.",
    "Recomendo!",
    "Ótima estrutura de treino.",
    "Fez eu me sentir seguro no trânsito.",
    "Aulas objetivas e sem enrolação.",
]


def _criar_instrutor(
    db: Session, *, id, nome, email, status, photo_key, experiencia, estrutura,
    telefone, categorias, cidades, terrenos, disponibilidade, veiculos,
) -> None:
    db.add(User(id=id, email=email, password_hash=_HASH, display_name=nome, role="instrutor"))
    db.flush()
    db.add(
        Instructor(
            user_id=id,
            photo_key=photo_key,
            experience=experiencia,
            training_structure=estrutura,
            phone=telefone,
            verification_status=status,
            categories=[InstructorCategory(category=c) for c in categorias],
            cities=[db.get(City, c) for c in cidades],
            terrains=[db.get(TerrainType, t) for t in terrenos],
            availability=[
                InstructorAvailability(weekday=d, period=p)
                for d, periodos in disponibilidade.items()
                for p in periodos
            ],
            vehicles=veiculos,
        )
    )
    db.flush()
    revisado = status != "pendente"
    db.add(
        AccreditationSubmission(
            instructor_id=id,
            accreditation_number=f"DET-{str(id)[:4]}",
            file_key=f"seed/comprovante-{id}.pdf",
            status=status,
            rejection_reason="Comprovante ilegível" if status == "rejeitado" else None,
            reviewed_by=ADMIN_ID if revisado else None,
            reviewed_at=datetime.now(UTC) - timedelta(days=10) if revisado else None,
        )
    )


def seed_all(db: Session) -> None:
    if db.get(User, CARLOS_ID):
        return

    for ibge, nome in CIDADES.items():
        db.merge(City(ibge_code=ibge, name=nome, uf="PB"))
    for tid, code in TERRENOS.items():
        db.merge(TerrainType(id=tid, code=code))
    db.add(
        User(id=ADMIN_ID, email="admin@nexusauto.dev", password_hash=_HASH,
                display_name="Admin", role="admin")
    )
    db.flush()

    _criar_instrutor(
        db, id=CARLOS_ID, nome="Carlos Mendes", email="carlos@nexusauto.dev",
        status="aprovado", photo_key="https://i.pravatar.cc/256?img=12",
        experiencia="12 anos de experiência com alunos iniciantes e com quem quer "
                    "retomar a direção. Aulas calmas, com foco em segurança.",
        estrutura="Local próprio, com cones e marcações para treino de baliza.",
        telefone="83999990001", categorias=["A", "B"],
        cidades=[PATOS, SANTA_LUZIA, SAO_MAMEDE], terrenos=[2, 3],
        disponibilidade={1: ["manha", "tarde"], 3: ["manha", "tarde"], 5: ["manha", "tarde"]},
        veiculos=[
            Vehicle(type="moto", brand_model="Moto 160cc", year=2022,
                    transmission="manual", dual_control=False, category="A"),
            Vehicle(type="carro", brand_model="Hatch 1.0", year=2021,
                    transmission="manual", dual_control=True, category="B"),
        ],
    )
    _criar_instrutor(
        db, id=MARCOS_ID, nome="Marcos Pereira", email="marcos@nexusauto.dev",
        status="pendente", photo_key=None,
        experiencia="Instrutor de categoria B, aulas em área urbana.",
        estrutura=None, telefone="83999990002", categorias=["B"],
        cidades=[PATOS], terrenos=[1],
        disponibilidade={0: ["noite"], 2: ["noite"]},
        veiculos=[
            Vehicle(type="carro", brand_model="Sedan 1.6", year=2019,
                    transmission="automatico", dual_control=True, category="B"),
        ],
    )
    _criar_instrutor(
        db, id=PAULO_ID, nome="Paulo Rejeitado", email="paulo@nexusauto.dev",
        status="rejeitado", photo_key=None, experiencia=None, estrutura=None,
        telefone=None, categorias=["B"], cidades=[PATOS], terrenos=[1],
        disponibilidade={}, veiculos=[],
    )

    alunos = [uuid.UUID(int=0x1000 + i) for i in range(23)]
    for i, uid in enumerate(alunos):
        db.add(User(id=uid, email=f"aluno{i + 1}@example.com", password_hash=_HASH,
                    display_name=_NOMES[i % len(_NOMES)], role="aluno"))
    db.flush()
    for uid in alunos:
        db.add(Student(user_id=uid, city_ibge=PATOS))
    db.flush()
    agora = datetime.now(UTC)
    for i, uid in enumerate(alunos):
        db.add(
            Review(
                student_id=uid, instructor_id=CARLOS_ID,
                rating=4 if i in (7, 15) else 5,
                comment=_COMENTARIOS[i] if i < len(_COMENTARIOS) else None,
                created_at=agora - timedelta(days=i),
            )
        )
    db.flush()


def main() -> None:
    db = next(get_db())
    try:
        seed_all(db)
        db.commit()
        print("Seed ok.")
        print(f"  aprovado:  /instrutores/{CARLOS_ID}")
        print(f"  pendente:  /instrutores/{MARCOS_ID}")
        print(f"  rejeitado: /instrutores/{PAULO_ID} (404)")
    finally:
        db.close()


if __name__ == "__main__":
    main()