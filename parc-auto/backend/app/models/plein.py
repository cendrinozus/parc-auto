from app import db
from datetime import datetime

class Plein(db.Model):
    __tablename__ = 'pleins'

    id = db.Column(db.Integer, primary_key=True)
    vehicule_id = db.Column(db.Integer, db.ForeignKey('vehicules.id'), nullable=False)
    utilisateur_id = db.Column(db.Integer, db.ForeignKey('utilisateurs.id'))
    date_plein = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    km_compteur = db.Column(db.Float, nullable=False)
    litres = db.Column(db.Float, nullable=False)
    prix_litre = db.Column(db.Float, nullable=False)
    cout_total = db.Column(db.Float, nullable=False)
    station = db.Column(db.String(150))
    type_carburant = db.Column(db.String(50))
    plein_complet = db.Column(db.Boolean, default=True)
    consommation_100km = db.Column(db.Float)
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'vehicule_id': self.vehicule_id,
            'utilisateur_id': self.utilisateur_id,
            'date_plein': self.date_plein.isoformat(),
            'km_compteur': self.km_compteur,
            'litres': self.litres,
            'prix_litre': self.prix_litre,
            'cout_total': self.cout_total,
            'station': self.station,
            'type_carburant': self.type_carburant,
            'plein_complet': self.plein_complet,
            'consommation_100km': self.consommation_100km,
            'notes': self.notes,
            'created_at': self.created_at.isoformat()
        }


class Affectation(db.Model):
    __tablename__ = 'affectations'

    id = db.Column(db.Integer, primary_key=True)
    vehicule_id = db.Column(db.Integer, db.ForeignKey('vehicules.id'), nullable=False)
    conducteur_id = db.Column(db.Integer, db.ForeignKey('conducteurs.id'), nullable=False)
    date_debut = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    date_fin = db.Column(db.DateTime)
    type_affectation = db.Column(db.Enum('permanente', 'temporaire'), default='permanente')
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'vehicule_id': self.vehicule_id,
            'conducteur_id': self.conducteur_id,
            'date_debut': self.date_debut.isoformat(),
            'date_fin': self.date_fin.isoformat() if self.date_fin else None,
            'type_affectation': self.type_affectation,
            'notes': self.notes
        }


class Alerte(db.Model):
    __tablename__ = 'alertes'

    id = db.Column(db.Integer, primary_key=True)
    vehicule_id = db.Column(db.Integer, db.ForeignKey('vehicules.id'), nullable=False)
    type_alerte = db.Column(db.Enum('sur_consommation', 'entretien', 'permis_expire', 'autre'), nullable=False)
    message = db.Column(db.Text, nullable=False)
    seuil_valeur = db.Column(db.Float)
    valeur_actuelle = db.Column(db.Float)
    lue = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'vehicule_id': self.vehicule_id,
            'type_alerte': self.type_alerte,
            'message': self.message,
            'seuil_valeur': self.seuil_valeur,
            'valeur_actuelle': self.valeur_actuelle,
            'lue': self.lue,
            'created_at': self.created_at.isoformat()
        }
