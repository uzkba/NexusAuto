from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies import get_current_user_optional
from app.models import User
from app.schemas.instructor_public import InstructorPublicOut
from app.services import instructor_public_service as service

router = APIRouter(prefix="/instrutores", tags=["instrutores"])


@router.get("/{instructor_id}", response_model=InstructorPublicOut)
def obter_perfil_publico(
    instructor_id: UUID,
    db: Session = Depends(get_db),
    viewer: User | None = Depends(get_current_user_optional),
):
    try:
        return service.get_public_profile(db, instructor_id, viewer)
    except service.InstructorNotFoundError:
        raise HTTPException(status_code=404, detail="Instrutor não encontrado") from None