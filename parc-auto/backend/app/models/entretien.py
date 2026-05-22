from app import db
from datetime import datetime

class Entretien(db.Model):
    __tablename__ = 'entretiens'

    id = db.Column(db.Integer, primary_key=True)
    vehicule_id = db.Column(db.Integer, db.ForeignKey('vehicules.id'), nullable=False)
    date_entretien = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    objet = db.Column(db.String(200), nullable=False)
    garage = db.Column(db.String(150))
    cout = db.Column(db.Float, nullable=False, default=0)
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'vehicule_id': self.vehicule_id,
            'date_entretien': self.date_entretien.isoformat(),
            'objet': self.objet,
            'garage': self.garage,
            'cout': self.cout,
            'notes': self.notes,
            'created_at': self.created_at.isoformat()
        }
