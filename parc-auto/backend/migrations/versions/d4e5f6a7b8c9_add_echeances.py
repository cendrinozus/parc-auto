"""add echeances vehicule

Revision ID: d4e5f6a7b8c9
Revises: c3d4e5f6a7b8
Create Date: 2026-05-22 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


revision = 'd4e5f6a7b8c9'
down_revision = 'c3d4e5f6a7b8'
branch_labels = None
depends_on = None


def upgrade():
    bind = op.get_bind()
    inspector = inspect(bind)
    tables = inspector.get_table_names()

    # Table écheances
    if 'echeances_vehicule' not in tables:
        op.create_table(
            'echeances_vehicule',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('vehicule_id', sa.Integer(), nullable=False),
            sa.Column('type_document', sa.String(50), nullable=False),
            sa.Column('date_echeance', sa.Date(), nullable=False),
            sa.Column('notes', sa.Text(), nullable=True),
            sa.Column('notifications_envoyees', sa.String(50), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=True),
            sa.Column('updated_at', sa.DateTime(), nullable=True),
            sa.ForeignKeyConstraint(['vehicule_id'], ['vehicules.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id')
        )

    # Colonne echeance_id sur alertes
    alertes_columns = [c['name'] for c in inspector.get_columns('alertes')]
    if 'echeance_id' not in alertes_columns:
        op.add_column('alertes', sa.Column('echeance_id', sa.Integer(), nullable=True))
        op.create_foreign_key(
            'fk_alertes_echeance_id',
            'alertes', 'echeances_vehicule',
            ['echeance_id'], ['id'],
            ondelete='SET NULL'
        )

    # Nouveaux paramètres
    op.execute("""
        INSERT INTO parametres (cle, valeur, description) VALUES
        ('alerte_stade_1', '15', 'Premier seuil d\'alerte avant échéance (jours)'),
        ('alerte_stade_2', '5',  'Deuxième seuil d\'alerte avant échéance (jours)'),
        ('alerte_stade_3', '1',  'Troisième seuil d\'alerte avant échéance (jours)'),
        ('emails_admins', '', 'Adresses email des administrateurs (séparées par des virgules)'),
        ('smtp_host', '', 'Serveur SMTP'),
        ('smtp_port', '587', 'Port SMTP'),
        ('smtp_user', '', 'Identifiant SMTP'),
        ('smtp_password', '', 'Mot de passe SMTP'),
        ('smtp_from', '', 'Adresse expéditeur des emails')
        ON DUPLICATE KEY UPDATE cle=cle
    """)


def downgrade():
    op.drop_constraint('fk_alertes_echeance_id', 'alertes', type_='foreignkey')
    op.drop_column('alertes', 'echeance_id')
    op.drop_table('echeances_vehicule')
    op.execute("""
        DELETE FROM parametres WHERE cle IN (
            'alerte_stade_1','alerte_stade_2','alerte_stade_3',
            'emails_admins','smtp_host','smtp_port','smtp_user','smtp_password','smtp_from'
        )
    """)
