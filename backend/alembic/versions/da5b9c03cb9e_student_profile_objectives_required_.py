"""student profile: objectives, required city and vehicle

Revision ID: da5b9c03cb9e
Revises: fe90ac92ce13
Create Date: 2026-11-22 00:04:02.516564

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = 'da5b9c03cb9e'
down_revision: Union[str, Sequence[str], None] = 'fe90ac92ce13'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        "students",
        sa.Column("objectives", postgresql.ARRAY(sa.Text()), nullable=False),
    )
    op.alter_column("students", "city_ibge", nullable=False)
    op.alter_column("students", "vehicle_interest", nullable=False)
    op.create_check_constraint(
        "ck_students_objectives_valid",
        "students",
        "objectives <@ ARRAY['first_license','highway_practice','resume_driving']::text[]",
    )
    op.create_check_constraint(
        "ck_students_objectives_not_empty",
        "students",
        "cardinality(objectives) >= 1",
    )
    op.create_check_constraint(
        "ck_students_vehicle_interest_valid",
        "students",
        "vehicle_interest IN ('car','motorcycle')",
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_constraint("ck_students_vehicle_interest_valid", "students")
    op.drop_constraint("ck_students_objectives_not_empty", "students")
    op.drop_constraint("ck_students_objectives_valid", "students")
    op.alter_column("students", "vehicle_interest", nullable=True)
    op.alter_column("students", "city_ibge", nullable=True)
    op.drop_column("students", "objectives")