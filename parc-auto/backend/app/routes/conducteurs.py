from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt
from app import db
from app.models.conducteur import Conducteur
from app.models.plein import Affectation
from app.models.vehicule import Vehicule

conducteurs_bp = Blueprint('conducteurs', __name__)

def gestionnaire_ou_admin_required():
    role = get_jwt().get('role')
    if role not in ('admin', 'gestionnaire'):
        return jsonify({'message': 'Accès refusé'}), 403
    return None

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
    err = gestionnaire_ou_admin_required()
    if err: return err
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
    err = gestionnaire_ou_admin_required()
    if err: return err
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
    err = gestionnaire_ou_admin_required()
    if err: return err
    c = Conducteur.query.get_or_404(id)
    db.session.delete(c)
    db.session.commit()
    return jsonify({'message': 'Conducteur supprimé'}), 200

@conducteurs_bp.route('/<int:id>/affectations', methods=['GET'])
@jwt_required()
def get_affectations(id):
    Conducteur.query.get_or_404(id)
    affs = Affectation.query.filter_by(conducteur_id=id).order_by(Affectation.date_debut.desc()).all()
    result = []
    for a in affs:
        d = a.to_dict()
        v = Vehicule.query.get(a.vehicule_id)
        if v:
            d['vehicule_immat'] = v.immatriculation
            d['vehicule_label'] = f"{v.marque} {v.modele}"
        result.append(d)
    return jsonify(result), 200


@conducteurs_bp.route('/<int:id>/affectations', methods=['POST'])
@jwt_required()
def create_affectation(id):
    from datetime import datetime
    Conducteur.query.get_or_404(id)
    data = request.get_json()
    vehicule_id = data.get('vehicule_id')
    if not vehicule_id:
        return jsonify({'message': 'vehicule_id requis'}), 400

    Vehicule.query.get_or_404(vehicule_id)

    # Vérifier qu'aucune affectation active n'existe déjà pour ce véhicule
    conflit = Affectation.query.filter(
        Affectation.vehicule_id == vehicule_id,
        db.or_(Affectation.date_fin == None, Affectation.date_fin >= datetime.utcnow())
    ).first()
    if conflit:
        return jsonify({'message': 'Ce véhicule est déjà affecté à un conducteur'}), 409

    aff = Affectation(
        conducteur_id=id,
        vehicule_id=vehicule_id,
        date_debut=datetime.utcnow(),
        type_affectation=data.get('type_affectation', 'permanente'),
        notes=data.get('notes')
    )
    db.session.add(aff)
    db.session.commit()

    d = aff.to_dict()
    v = Vehicule.query.get(vehicule_id)
    if v:
        d['vehicule_immat'] = v.immatriculation
        d['vehicule_label'] = f"{v.marque} {v.modele}"
    return jsonify(d), 201


@conducteurs_bp.route('/<int:id>/affectations/<int:aff_id>/terminer', methods=['PUT'])
@jwt_required()
def terminer_affectation(id, aff_id):
    from datetime import datetime
    aff = Affectation.query.filter_by(id=aff_id, conducteur_id=id).first_or_404()
    aff.date_fin = datetime.utcnow()
    db.session.commit()
    return jsonify(aff.to_dict()), 200


@conducteurs_bp.route('/<int:id>/affectations/<int:aff_id>', methods=['DELETE'])
@jwt_required()
def delete_affectation(id, aff_id):
    aff = Affectation.query.filter_by(id=aff_id, conducteur_id=id).first_or_404()
    db.session.delete(aff)
    db.session.commit()
    return jsonify({'message': 'Affectation supprimée'}), 200
