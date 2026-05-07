import os
from app import create_app, db
from app.models import Utilisateur, Vehicule, Conducteur, Plein, Affectation, Alerte

app = create_app(os.environ.get('FLASK_ENV', 'development'))

@app.shell_context_processor
def make_shell_context():
    return dict(db=db, Utilisateur=Utilisateur, Vehicule=Vehicule,
                Conducteur=Conducteur, Plein=Plein, Affectation=Affectation, Alerte=Alerte)

@app.cli.command('seed')
def seed_db():
    """Peupler la base avec des données de test."""
    admin = Utilisateur(nom='Admin', prenom='Super', email='admin@parc.com', role='admin')
    admin.set_password('admin123')
    db.session.add(admin)

    v1 = Vehicule(immatriculation='AA-001-BB', marque='Peugeot', modele='308',
                  annee=2021, type_carburant='diesel', km_initial=0, km_actuel=25000)
    v2 = Vehicule(immatriculation='CC-002-DD', marque='Renault', modele='Clio',
                  annee=2022, type_carburant='essence', km_initial=0, km_actuel=12000)
    db.session.add_all([v1, v2])

    c1 = Conducteur(nom='Dupont', prenom='Jean', email='j.dupont@example.com',
                    telephone='0601020304', numero_permis='P12345678')
    db.session.add(c1)
    db.session.commit()
    print('Base de données initialisée avec succès.')

if __name__ == '__main__':
    debug = os.environ.get('FLASK_ENV') == 'development'
    app.run(host='0.0.0.0', port=5000, debug=debug)
