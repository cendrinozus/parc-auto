from app import db
from datetime import datetime

class Vehicule(db.Model):
    __tablename__ = 'vehicules'

    id = db.Column(db.Integer, primary_key=True)
    immatriculation = db.Column(db.String(20), unique=True, nullable=False)
    marque = db.Column(db.String(100), nullable=False)
    modele = db.Column(db.String(100), nullable=False)
    annee = db.Column(db.Integer, nullable=False)
    type_carburant = db.Column(db.Enum('essence', 'diesel', 'hybride', 'electrique'), nullable=False)
    km_initial = db.Column(db.Float, default=0)
    km_actuel = db.Column(db.Float, default=0)
    statut = db.Column(db.Enum('actif', 'maintenance', 'hors_service'), default='actif')
    categorie = db.Column(db.Enum('leger', 'utilitaire', 'poids_lourd'), default='leger')
    couleur = db.Column(db.String(50))
    numero_serie = db.Column(db.String(100))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    pleins = db.relationship('Plein', backref='vehicule', lazy=True, cascade='all, delete-orphan')
    affectations = db.relationship('Affectation', backref='vehicule', lazy=True, cascade='all, delete-orphan')
    alertes = db.relationship('Alerte', backref='vehicule', lazy=True, cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'immatriculation': self.immatriculation,
            'marque': self.marque,
            'modele': self.modele,
            'annee': self.annee,
            'type_carburant': self.type_carburant,
            'km_initial': self.km_initial,
            'km_actuel': self.km_actuel,
            'statut': self.statut,
            'categorie': self.categorie,
            'couleur': self.couleur,
            'numero_serie': self.numero_serie,
            'created_at': self.created_at.isoformat()
        }
