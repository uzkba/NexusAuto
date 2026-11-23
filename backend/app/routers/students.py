from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies import get_current_student_user
from app.models.user import Student, User
from app.schemas.student import StudentProfileRead, StudentProfileUpdate
from app.services.student_profile import upsert_student_profile

router = APIRouter(prefix="/students/me", tags=["students"])


@router.get("/profile", response_model=StudentProfileRead)
def get_my_profile(
    user: User = Depends(get_current_student_user),
    db: Session = Depends(get_db),
):
    student = db.get(Student, user.id)
    return student if student else StudentProfileRead()


@router.put("/profile", response_model=StudentProfileRead)
def put_my_profile(
    payload: StudentProfileUpdate,
    user: User = Depends(get_current_student_user),
    db: Session = Depends(get_db),
):
    return upsert_student_profile(db, user.id, payload)