from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'c2708c823752'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS citext")

def downgrade() -> None:
    op.execute("DROP EXTENSION IF EXISTS citext")
