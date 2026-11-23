from fastapi import Depends, HTTPException, status

from app.models import User


def get_current_user_optional() -> User | None:
    # TODO(07.3): ler o token e retornar o usuário logado, ou None.
    return None


def get_current_user(user: User | None = Depends(get_current_user_optional)) -> User:
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Autenticação necessária.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


def get_current_instructor_user(user: User = Depends(get_current_user)) -> User:
    if user.role != "instrutor":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas instrutores podem acessar este recurso.",
        )
    return user


def get_current_student_user(user: User = Depends(get_current_user)) -> User:
    if user.role != "aluno":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas alunos podem acessar este recurso.",
        )
    return user