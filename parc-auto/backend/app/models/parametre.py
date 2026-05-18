from app import db
from datetime import datetime

class Parametre(db.Model):
    __tablename__ = 'parametres'

    id = db.Column(db.Integer, primary_key=True)
    cle = db.Column(db.String(100), unique=True, nullable=False)
    valeur = db.Column(db.String(255), nullable=False, default='0')
    description = db.Column(db.String(255))
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'cle': self.cle,
            'valeur': self.valeur,
            'description': self.description,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
