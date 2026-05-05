from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app import db
from app.models.plein import Alerte

alertes_bp = Blueprint('alertes', __name__)

@alertes_bp.route('/', methods=['GET'])
@jwt_required()
def get_alertes():
    lue = request.args.get('lue')
    vehicule_id = request.args.get('vehicule_id')
    query = Alerte.query
    if lue is not None:
        query = query.filter_by(lue=(lue.lower() == 'true'))
    if vehicule_id:
        query = query.filter_by(vehicule_id=vehicule_id)
    alertes = query.order_by(Alerte.created_at.desc()).all()
    return jsonify([a.to_dict() for a in alertes]), 200

@alertes_bp.route('/<int:id>/lire', methods=['PATCH'])
@jwt_required()
def marquer_lue(id):
    a = Alerte.query.get_or_404(id)
    a.lue = True
    db.session.commit()
    return jsonify(a.to_dict()), 200

@alertes_bp.route('/tout-lire', methods=['PATCH'])
@jwt_required()
def tout_marquer_lue():
    Alerte.query.filter_by(lue=False).update({'lue': True})
    db.session.commit()
    return jsonify({'message': 'Toutes les alertes marquées comme lues'}), 200

@alertes_bp.route('/count', methods=['GET'])
@jwt_required()
def count_alertes():
    count = Alerte.query.filter_by(lue=False).count()
    return jsonify({'non_lues': count}), 200
