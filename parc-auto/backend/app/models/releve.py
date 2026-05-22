from app import db
from datetime import datetime


class ReleveJournalier(db.Model):
    __tablename__ = 'releves_journaliers'

    id = db.Column(db.Integer, primary_key=True)
    conducteur_id = db.Column(db.Integer, db.ForeignKey('conducteurs.id'), nullable=False)
    vehicule_id = db.Column(db.Integer, db.ForeignKey('vehicules.id'), nullable=False)
    date = db.Column(db.Date, nullable=False)
    km_debut = db.Column(db.Float, nullable=True)
    niveau_carburant_debut = db.Column(db.Float, nullable=True)
    km_fin = db.Column(db.Float, nullable=True)
    niveau_carburant_fin = db.Column(db.Float, nullable=True)
    statut = db.Column(db.Enum('en_cours', 'clos'), default='en_cours', nullable=False)
    observations = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    trajets = db.relationship('Trajet', backref='releve', lazy=True, cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'conducteur_id': self.conducteur_id,
            'vehicule_id': self.vehicule_id,
            'date': self.date.isoformat(),
            'km_debut': self.km_debut,
            'niveau_carburant_debut': self.niveau_carburant_debut,
            'km_fin': self.km_fin,
            'niveau_carburant_fin': self.niveau_carburant_fin,
            'statut': self.statut,
            'observations': self.observations,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'trajets': [t.to_dict() for t in self.trajets]
        }


class Trajet(db.Model):
    __tablename__ = 'trajets'

    id = db.Column(db.Integer, primary_key=True)
    releve_id = db.Column(db.Integer, db.ForeignKey('releves_journaliers.id'), nullable=False)
    heure_depart = db.Column(db.String(5), nullable=False)
    heure_arrivee = db.Column(db.String(5), nullable=True)
    origine = db.Column(db.String(200), nullable=True)
    destination = db.Column(db.String(200), nullable=False)
    motif = db.Column(db.String(200), nullable=True)
    km_depart = db.Column(db.Float, nullable=True)
    km_arrivee = db.Column(db.Float, nullable=True)
    observations = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'releve_id': self.releve_id,
            'heure_depart': self.heure_depart,
            'heure_arrivee': self.heure_arrivee,
            'origine': self.origine,
            'destination': self.destination,
            'motif': self.motif,
            'km_depart': self.km_depart,
            'km_arrivee': self.km_arrivee,
            'observations': self.observations,
            'created_at': self.created_at.isoformat()
        }
