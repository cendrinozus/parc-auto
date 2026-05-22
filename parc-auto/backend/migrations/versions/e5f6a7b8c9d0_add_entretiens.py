"""add entretiens table

Revision ID: e5f6a7b8c9d0
Revises: d4e5f6a7b8c9
Create Date: 2026-05-22 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

revision = 'e5f6a7b8c9d0'
down_revision = 'd4e5f6a7b8c9'
branch_labels = None
depends_on = None


def upgrade():
    bind = op.get_bind()
    inspector = inspect(bind)
    if 'entretiens' not in inspector.get_table_names():
        op.create_table(
            'entretiens',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('vehicule_id', sa.Integer(), nullable=False),
            sa.Column('date_entretien', sa.DateTime(), nullable=False),
            sa.Column('objet', sa.String(200), nullable=False),
            sa.Column('garage', sa.String(150), nullable=True),
            sa.Column('cout', sa.Float(), nullable=False, server_default='0'),
            sa.Column('notes', sa.Text(), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=True),
            sa.ForeignKeyConstraint(['vehicule_id'], ['vehicules.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id')
        )


def downgrade():
    op.drop_table('entretiens')
