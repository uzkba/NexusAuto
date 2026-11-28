"""create contact_logs table

Revision ID: 9c4e7f2a1b3d
Revises: 5870a98e68ab
Create Date: 2026-11-27 22:15:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "9c4e7f2a1b3d"
down_revision: Union[str, Sequence[str], None] = "5870a98e68ab"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        "contact_logs",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("student_id", sa.Uuid(), nullable=False),
        sa.Column("instructor_id", sa.Uuid(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["instructor_id"], ["instructors.user_id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(
            ["student_id"], ["students.user_id"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_contact_logs_student_instructor",
        "contact_logs",
        ["student_id", "instructor_id"],
        unique=False,
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index("ix_contact_logs_student_instructor", table_name="contact_logs")
    op.drop_table("contact_logs")
