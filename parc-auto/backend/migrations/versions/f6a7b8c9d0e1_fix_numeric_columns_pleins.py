"""fix numeric columns in pleins

Revision ID: f6a7b8c9d0e1
Revises: e5f6a7b8c9d0
Create Date: 2026-05-22 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = 'f6a7b8c9d0e1'
down_revision = 'e5f6a7b8c9d0'
branch_labels = None
depends_on = None


def upgrade():
    op.alter_column('pleins', 'km_compteur',
        existing_type=sa.Float(),
        type_=sa.Numeric(10, 2),
        existing_nullable=False)
    op.alter_column('pleins', 'litres',
        existing_type=sa.Float(),
        type_=sa.Numeric(10, 3),
        existing_nullable=False)
    op.alter_column('pleins', 'prix_litre',
        existing_type=sa.Float(),
        type_=sa.Numeric(10, 2),
        existing_nullable=False)
    op.alter_column('pleins', 'cout_total',
        existing_type=sa.Float(),
        type_=sa.Numeric(12, 2),
        existing_nullable=False)

    # Corrige les données existantes
    op.execute("UPDATE pleins SET cout_total = ROUND(cout_total, 2)")
    op.execute("UPDATE pleins SET prix_litre = ROUND(prix_litre, 2)")
    op.execute("UPDATE pleins SET litres    = ROUND(litres, 3)")
    op.execute("UPDATE pleins SET km_compteur = ROUND(km_compteur, 2)")


def downgrade():
    op.alter_column('pleins', 'km_compteur',
        existing_type=sa.Numeric(10, 2),
        type_=sa.Float(),
        existing_nullable=False)
    op.alter_column('pleins', 'litres',
        existing_type=sa.Numeric(10, 3),
        type_=sa.Float(),
        existing_nullable=False)
    op.alter_column('pleins', 'prix_litre',
        existing_type=sa.Numeric(10, 2),
        type_=sa.Float(),
        existing_nullable=False)
    op.alter_column('pleins', 'cout_total',
        existing_type=sa.Numeric(12, 2),
        type_=sa.Float(),
        existing_nullable=False)
