"""add conducteur link and releves

Revision ID: c3d4e5f6a7b8
Revises: b2c3d4e5f6a7
Create Date: 2026-05-18 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = 'c3d4e5f6a7b8'
down_revision = 'b2c3d4e5f6a7'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        'utilisateurs',
        sa.Column('conducteur_id', sa.Integer(), nullable=True)
    )
    op.create_foreign_key(
        'fk_utilisateurs_conducteur_id',
        'utilisateurs', 'conducteurs',
        ['conducteur_id'], ['id'],
        ondelete='SET NULL'
    )

    op.create_table(
        'releves_journaliers',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('conducteur_id', sa.Integer(), nullable=False),
        sa.Column('vehicule_id', sa.Integer(), nullable=False),
        sa.Column('date', sa.Date(), nullable=False),
        sa.Column('km_debut', sa.Float(), nullable=True),
        sa.Column('niveau_carburant_debut', sa.Float(), nullable=True),
        sa.Column('km_fin', sa.Float(), nullable=True),
        sa.Column('niveau_carburant_fin', sa.Float(), nullable=True),
        sa.Column('statut', sa.Enum('en_cours', 'clos'), nullable=False, server_default='en_cours'),
        sa.Column('observations', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['conducteur_id'], ['conducteurs.id']),
        sa.ForeignKeyConstraint(['vehicule_id'], ['vehicules.id']),
        sa.PrimaryKeyConstraint('id')
    )

    op.create_table(
        'trajets',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('releve_id', sa.Integer(), nullable=False),
        sa.Column('heure_depart', sa.String(length=5), nullable=False),
        sa.Column('heure_arrivee', sa.String(length=5), nullable=True),
        sa.Column('origine', sa.String(length=200), nullable=True),
        sa.Column('destination', sa.String(length=200), nullable=False),
        sa.Column('motif', sa.String(length=200), nullable=True),
        sa.Column('km_depart', sa.Float(), nullable=True),
        sa.Column('km_arrivee', sa.Float(), nullable=True),
        sa.Column('observations', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['releve_id'], ['releves_journaliers.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )


def downgrade():
    op.drop_table('trajets')
    op.drop_table('releves_journaliers')
    op.drop_constraint('fk_utilisateurs_conducteur_id', 'utilisateurs', type_='foreignkey')
    op.drop_column('utilisateurs', 'conducteur_id')
