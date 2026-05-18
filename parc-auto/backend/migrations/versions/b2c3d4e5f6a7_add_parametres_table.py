"""add parametres table

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-05-18 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = 'b2c3d4e5f6a7'
down_revision = 'a1b2c3d4e5f6'
branch_labels = None
depends_on = None

PRIX_DEFAUT = [
    ('prix_diesel',     '0', 'Prix du litre de diesel (FCFA)'),
    ('prix_essence',    '0', 'Prix du litre d\'essence (FCFA)'),
    ('prix_hybride',    '0', 'Prix du litre hybride (FCFA)'),
    ('prix_electrique', '0', 'Prix du kWh électrique (FCFA)'),
]

def upgrade():
    parametres = op.create_table(
        'parametres',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('cle', sa.String(length=100), nullable=False),
        sa.Column('valeur', sa.String(length=255), nullable=False, server_default='0'),
        sa.Column('description', sa.String(length=255), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('cle')
    )
    op.bulk_insert(parametres, [
        {'cle': cle, 'valeur': valeur, 'description': desc}
        for cle, valeur, desc in PRIX_DEFAUT
    ])


def downgrade():
    op.drop_table('parametres')
