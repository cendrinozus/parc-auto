"""add conducteur_id and motif to pleins

Revision ID: a1b2c3d4e5f6
Revises: 32758341a3bd
Create Date: 2026-05-18 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


revision = 'a1b2c3d4e5f6'
down_revision = '32758341a3bd'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('pleins', sa.Column('conducteur_id', sa.Integer(), nullable=True))
    op.add_column('pleins', sa.Column('motif', sa.String(length=200), nullable=True))
    op.create_foreign_key('fk_pleins_conducteur', 'pleins', 'conducteurs', ['conducteur_id'], ['id'])


def downgrade():
    op.drop_constraint('fk_pleins_conducteur', 'pleins', type_='foreignkey')
    op.drop_column('pleins', 'motif')
    op.drop_column('pleins', 'conducteur_id')
