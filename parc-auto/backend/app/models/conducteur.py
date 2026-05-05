from app import db
from datetime import datetime

class Conducteur(db.Model):
    __tablename__ = 'conducteurs'

    id = db.Column(db.Integer, primary_key=True)
    nom = db.Column(db.String(100), nullable=False)
    prenom = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(150))
    telephone = db.Column(db.String(20))
    numero_permis = db.Column(db.String(50), unique=True, nullable=False)
    date_expiration_permis = db.Column(db.Date)
    actif = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    affectations = db.relationship('Affectation', backref='conducteur', lazy=True, cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'nom': self.nom,
            'prenom': self.prenom,
            'email': self.email,
            'telephone': self.telephone,
            'numero_permis': self.numero_permis,
            'date_expiration_permis': self.date_expiration_permis.isoformat() if self.date_expiration_permis else None,
            'actif': self.actif,
            'created_at': self.created_at.isoformat()
        }
