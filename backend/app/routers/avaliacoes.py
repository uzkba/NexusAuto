from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies import get_current_student_user
from app.models import User
from app.schemas.review import MyReviewStatusOut, ReviewIn, ReviewOut
from app.services import review_service as service

router = APIRouter(
    prefix="/instrutores/{instructor_id}/avaliacoes",
    tags=["avaliacoes"],
)

_MSG_INSTRUCTOR_NOT_FOUND = "Instrutor não encontrado."
_MSG_CONTACT_REQUIRED = (
    "Você precisa entrar em contato com o instrutor via WhatsApp antes de avaliá-lo."
)
_MSG_ALREADY_REVIEWED = (
    "Você já avaliou este instrutor. Use a opção de editar avaliação."
)
_MSG_REVIEW_NOT_FOUND = "Avaliação não encontrada."


@router.get("/minha", response_model=MyReviewStatusOut)
def obter_minha_avaliacao(
    instructor_id: UUID,
    user: User = Depends(get_current_student_user),
    db: Session = Depends(get_db),
):
    try:
        return service.get_my_review_status(db, user.id, instructor_id)
    except service.InstructorNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=_MSG_INSTRUCTOR_NOT_FOUND,
        ) from None


@router.post("", response_model=ReviewOut, status_code=status.HTTP_201_CREATED)
def criar_avaliacao(
    instructor_id: UUID,
    payload: ReviewIn,
    user: User = Depends(get_current_student_user),
    db: Session = Depends(get_db),
):
    try:
        return service.create_review(db, user.id, instructor_id, payload)
    except service.InstructorNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=_MSG_INSTRUCTOR_NOT_FOUND,
        ) from None
    except service.ContactRequiredError:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=_MSG_CONTACT_REQUIRED,
        ) from None
    except service.ReviewAlreadyExistsError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=_MSG_ALREADY_REVIEWED,
        ) from None


@router.put("/minha", response_model=ReviewOut)
def atualizar_minha_avaliacao(
    instructor_id: UUID,
    payload: ReviewIn,
    user: User = Depends(get_current_student_user),
    db: Session = Depends(get_db),
):
    try:
        return service.update_review(db, user.id, instructor_id, payload)
    except service.InstructorNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=_MSG_INSTRUCTOR_NOT_FOUND,
        ) from None
    except service.ContactRequiredError:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=_MSG_CONTACT_REQUIRED,
        ) from None
    except service.ReviewNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=_MSG_REVIEW_NOT_FOUND,
        ) from None
