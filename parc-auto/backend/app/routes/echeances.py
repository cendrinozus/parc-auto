from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt
from datetime import datetime
from app import db
from app.models.echeance import EcheanceVehicule
from app.models.vehicule import Vehicule

echeances_bp = Blueprint('echeances', __name__)


def admin_required():
    role = get_jwt().get('role')
    if role != 'admin':
        return jsonify({'message': 'Accès réservé aux administrateurs'}), 403
    return None


@echeances_bp.route('/vehicule/<int:vehicule_id>', methods=['GET'])
@jwt_required()
def get_echeances(vehicule_id):
    Vehicule.query.get_or_404(vehicule_id)
    echeances = EcheanceVehicule.query.filter_by(vehicule_id=vehicule_id).order_by(EcheanceVehicule.date_echeance).all()
    return jsonify([e.to_dict() for e in echeances]), 200


@echeances_bp.route('/vehicule/<int:vehicule_id>', methods=['POST'])
@jwt_required()
def create_echeance(vehicule_id):
    err = admin_required()
    if err:
        return err
    Vehicule.query.get_or_404(vehicule_id)
    data = request.get_json()
    if not data.get('type_document') or not data.get('date_echeance'):
        return jsonify({'message': 'type_document et date_echeance sont requis'}), 400

    try:
        date_ech = datetime.strptime(data['date_echeance'], '%Y-%m-%d').date()
    except ValueError:
        return jsonify({'message': 'Format de date invalide (YYYY-MM-DD)'}), 400

    ech = EcheanceVehicule(
        vehicule_id=vehicule_id,
        type_document=data['type_document'],
        date_echeance=date_ech,
        notes=data.get('notes')
    )
    db.session.add(ech)
    db.session.commit()
    return jsonify(ech.to_dict()), 201


@echeances_bp.route('/<int:id>', methods=['PUT'])
@jwt_required()
def update_echeance(id):
    err = admin_required()
    if err:
        return err
    ech = EcheanceVehicule.query.get_or_404(id)
    data = request.get_json()

    if 'type_document' in data:
        ech.type_document = data['type_document']
    if 'date_echeance' in data and data['date_echeance']:
        try:
            ech.date_echeance = datetime.strptime(data['date_echeance'], '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'message': 'Format de date invalide'}), 400
    if 'notes' in data:
        ech.notes = data['notes']

    db.session.commit()
    return jsonify(ech.to_dict()), 200


@echeances_bp.route('/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_echeance(id):
    err = admin_required()
    if err:
        return err
    ech = EcheanceVehicule.query.get_or_404(id)
    db.session.delete(ech)
    db.session.commit()
    return jsonify({'message': 'Échéance supprimée'}), 200


@echeances_bp.route('/verifier', methods=['POST'])
@jwt_required()
def verifier_maintenant():
    err = admin_required()
    if err:
        return err

    force = request.get_json(silent=True) or {}
    if force.get('force'):
        # Réinitialise les notifications pour rejouer tous les stades
        EcheanceVehicule.query.update({'notifications_envoyees': None})
        db.session.commit()

    from flask import current_app
    from app.services.check_echeances import verifier_et_alerter
    verifier_et_alerter(current_app._get_current_object())
    return jsonify({'message': 'Vérification effectuée'}), 200


@echeances_bp.route('/tester-email', methods=['POST'])
@jwt_required()
def tester_email():
    err = admin_required()
    if err:
        return err
    from flask import current_app
    from app.services.check_echeances import _envoyer_emails
    _envoyer_emails(current_app._get_current_object(), ['Ceci est un test'])
    return jsonify({'message': 'Email de test envoyé'}), 200
