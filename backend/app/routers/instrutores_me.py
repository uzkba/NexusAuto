from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.errors import validation_response
from app.dependencies import get_current_instructor_user
from app.models import User
from app.schemas.instructor_profile import InstructorProfileIn, InstructorProfileOut
from app.services import instructor_profile_service as service

router = APIRouter(prefix="/instrutores/me", tags=["instrutor-perfil"])


@router.get("", response_model=InstructorProfileOut)
def obter_meu_perfil(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_instructor_user),
):
    try:
        return service.get_profile(db, user)
    except service.ProfileNotFoundError:
        raise HTTPException(status_code=404, detail="Perfil ainda não cadastrado.") from None


@router.put("", response_model=InstructorProfileOut)
def salvar_meu_perfil(
    data: InstructorProfileIn,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_instructor_user),
):
    try:
        return service.save_profile(db, user, data)
    except service.InvalidReferenceError as exc:
        db.rollback()
        return validation_response([{"field": exc.field, "message": exc.message}])