from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt
from datetime import datetime
from app import db
from app.models.entretien import Entretien
from app.models.vehicule import Vehicule

entretiens_bp = Blueprint('entretiens', __name__)

def gestionnaire_ou_admin_required():
    role = get_jwt().get('role')
    if role not in ('admin', 'gestionnaire'):
        return jsonify({'message': 'Accès refusé'}), 403
    return None


@entretiens_bp.route('/', methods=['GET'])
@jwt_required()
def get_entretiens():
    params = {}
    vehicule_id = request.args.get('vehicule_id')
    annee = request.args.get('annee')

    query = Entretien.query
    if vehicule_id:
        query = query.filter_by(vehicule_id=int(vehicule_id))
    if annee:
        query = query.filter(
            db.extract('year', Entretien.date_entretien) == int(annee)
        )

    entretiens = query.order_by(Entretien.date_entretien.desc()).limit(500).all()

    result = []
    for e in entretiens:
        d = e.to_dict()
        v = Vehicule.query.get(e.vehicule_id)
        if v:
            d['vehicule_immat'] = v.immatriculation
            d['vehicule_label'] = f"{v.marque} {v.modele}"
        result.append(d)
    return jsonify(result), 200


@entretiens_bp.route('/<int:id>', methods=['GET'])
@jwt_required()
def get_entretien(id):
    e = Entretien.query.get_or_404(id)
    d = e.to_dict()
    v = Vehicule.query.get(e.vehicule_id)
    if v:
        d['vehicule_immat'] = v.immatriculation
        d['vehicule_label'] = f"{v.marque} {v.modele}"
    return jsonify(d), 200


@entretiens_bp.route('/', methods=['POST'])
@jwt_required()
def create_entretien():
    err = gestionnaire_ou_admin_required()
    if err: return err
    data = request.get_json()
    if not data.get('vehicule_id') or not data.get('objet'):
        return jsonify({'message': 'vehicule_id et objet sont requis'}), 400

    Vehicule.query.get_or_404(data['vehicule_id'])

    try:
        date_e = datetime.fromisoformat(data['date_entretien']) if data.get('date_entretien') else datetime.utcnow()
    except ValueError:
        return jsonify({'message': 'Format de date invalide'}), 400

    e = Entretien(
        vehicule_id=int(data['vehicule_id']),
        date_entretien=date_e,
        objet=data['objet'],
        garage=data.get('garage'),
        cout=float(data.get('cout') or 0),
        notes=data.get('notes')
    )
    db.session.add(e)
    db.session.commit()
    return jsonify(e.to_dict()), 201


@entretiens_bp.route('/<int:id>', methods=['PUT'])
@jwt_required()
def update_entretien(id):
    err = gestionnaire_ou_admin_required()
    if err: return err
    e = Entretien.query.get_or_404(id)
    data = request.get_json()

    if 'date_entretien' in data and data['date_entretien']:
        try:
            e.date_entretien = datetime.fromisoformat(data['date_entretien'])
        except ValueError:
            return jsonify({'message': 'Format de date invalide'}), 400
    for field in ['objet', 'garage', 'notes']:
        if field in data:
            setattr(e, field, data[field])
    if 'cout' in data:
        e.cout = float(data['cout'] or 0)

    db.session.commit()
    return jsonify(e.to_dict()), 200


@entretiens_bp.route('/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_entretien(id):
    err = gestionnaire_ou_admin_required()
    if err: return err
    e = Entretien.query.get_or_404(id)
    db.session.delete(e)
    db.session.commit()
    return jsonify({'message': 'Entretien supprimé'}), 200
