from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app import db
from app.models.conducteur import Conducteur
from app.models.plein import Affectation

conducteurs_bp = Blueprint('conducteurs', __name__)

@conducteurs_bp.route('/', methods=['GET'])
@jwt_required()
def get_conducteurs():
    actif = request.args.get('actif')
    query = Conducteur.query
    if actif is not None:
        query = query.filter_by(actif=(actif.lower() == 'true'))
    conducteurs = query.order_by(Conducteur.nom).all()
    return jsonify([c.to_dict() for c in conducteurs]), 200

@conducteurs_bp.route('/<int:id>', methods=['GET'])
@jwt_required()
def get_conducteur(id):
    c = Conducteur.query.get_or_404(id)
    return jsonify(c.to_dict()), 200

@conducteurs_bp.route('/', methods=['POST'])
@jwt_required()
def create_conducteur():
    data = request.get_json()
    required = ['nom', 'prenom', 'numero_permis']
    if not all(data.get(f) for f in required):
        return jsonify({'message': 'Champs requis manquants'}), 400

    if Conducteur.query.filter_by(numero_permis=data['numero_permis']).first():
        return jsonify({'message': 'Numéro de permis déjà existant'}), 409

    from datetime import datetime
    c = Conducteur(
        nom=data['nom'],
        prenom=data['prenom'],
        email=data.get('email'),
        telephone=data.get('telephone'),
        numero_permis=data['numero_permis'],
        date_expiration_permis=datetime.strptime(data['date_expiration_permis'], '%Y-%m-%d').date() if data.get('date_expiration_permis') else None
    )
    db.session.add(c)
    db.session.commit()
    return jsonify(c.to_dict()), 201

@conducteurs_bp.route('/<int:id>', methods=['PUT'])
@jwt_required()
def update_conducteur(id):
    c = Conducteur.query.get_or_404(id)
    data = request.get_json()
    from datetime import datetime
    for field in ['nom', 'prenom', 'email', 'telephone', 'actif']:
        if field in data:
            setattr(c, field, data[field])
    if 'date_expiration_permis' in data and data['date_expiration_permis']:
        c.date_expiration_permis = datetime.strptime(data['date_expiration_permis'], '%Y-%m-%d').date()
    db.session.commit()
    return jsonify(c.to_dict()), 200

@conducteurs_bp.route('/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_conducteur(id):
    c = Conducteur.query.get_or_404(id)
    db.session.delete(c)
    db.session.commit()
    return jsonify({'message': 'Conducteur supprimé'}), 200

@conducteurs_bp.route('/<int:id>/affectations', methods=['GET'])
@jwt_required()
def get_affectations(id):
    Conducteur.query.get_or_404(id)
    aff = Affectation.query.filter_by(conducteur_id=id).all()
    return jsonify([a.to_dict() for a in aff]), 200
