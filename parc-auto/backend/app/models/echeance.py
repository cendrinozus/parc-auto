from app import db
from datetime import datetime

LABELS_DOCUMENT = {
    'visite_technique': 'Visite technique',
    'assurance': 'Assurance',
    'tvm': 'TVM',
    'carte_orange': 'Carte orange',
}

STADES_ALERTE_DEFAUT = [15, 5, 1]

class EcheanceVehicule(db.Model):
    __tablename__ = 'echeances_vehicule'

    id = db.Column(db.Integer, primary_key=True)
    vehicule_id = db.Column(db.Integer, db.ForeignKey('vehicules.id'), nullable=False)
    type_document = db.Column(db.String(50), nullable=False)
    date_echeance = db.Column(db.Date, nullable=False)
    notes = db.Column(db.Text)
    # Stades déjà notifiés, ex: "15,5"
    notifications_envoyees = db.Column(db.String(50), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def stades_notifies(self):
        if not self.notifications_envoyees:
            return set()
        return {int(x) for x in self.notifications_envoyees.split(',') if x.strip().isdigit()}

    def marquer_stade(self, stade):
        notifies = self.stades_notifies()
        notifies.add(stade)
        self.notifications_envoyees = ','.join(str(x) for x in sorted(notifies, reverse=True))

    def to_dict(self):
        return {
            'id': self.id,
            'vehicule_id': self.vehicule_id,
            'type_document': self.type_document,
            'label': LABELS_DOCUMENT.get(self.type_document, self.type_document),
            'date_echeance': self.date_echeance.isoformat() if self.date_echeance else None,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
