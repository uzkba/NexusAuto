from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.errors import register_exception_handlers
from app.routers import (
    avaliacoes,
    catalogo,
    health,
    instrutores_me,
    instrutores_publico,
    students,
)

app = FastAPI(title="NEXUS AUTO API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

register_exception_handlers(app)

app.include_router(health.router)
app.include_router(catalogo.router)
app.include_router(instrutores_publico.router)
app.include_router(instrutores_me.router)
app.include_router(avaliacoes.router)
app.include_router(students.router)