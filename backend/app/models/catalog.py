from sqlalchemy import CHAR, Integer, SmallInteger, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class City(Base):
    __tablename__ = "cities"

    ibge_code: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=False)
    name: Mapped[str] = mapped_column(Text)
    uf: Mapped[str] = mapped_column(CHAR(2))


class TerrainType(Base):
    __tablename__ = "terrain_types"

    id: Mapped[int] = mapped_column(SmallInteger, primary_key=True, autoincrement=False)
    code: Mapped[str] = mapped_column(Text, unique=True)