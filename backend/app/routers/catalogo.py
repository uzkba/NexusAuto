from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import City, TerrainType
from app.schemas.instructor_profile import TerrainOut
from app.schemas.instructor_public import CityOut

router = APIRouter(prefix="/catalogo", tags=["catalogo"])


@router.get("/cidades", response_model=list[CityOut])
def listar_cidades(q: str | None = None, db: Session = Depends(get_db)):
    stmt = select(City).order_by(City.name)
    if q:
        stmt = stmt.where(City.name.ilike(f"%{q}%"))
    return [
        CityOut(ibge_code=c.ibge_code, name=c.name, uf=c.uf)
        for c in db.scalars(stmt.limit(100))
    ]


@router.get("/terrenos", response_model=list[TerrainOut])
def listar_terrenos(db: Session = Depends(get_db)):
    return [
        TerrainOut(id=t.id, code=t.code)
        for t in db.scalars(select(TerrainType).order_by(TerrainType.id))
    ]