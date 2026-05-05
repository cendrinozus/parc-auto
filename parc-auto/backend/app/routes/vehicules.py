from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app import db
from app.models.vehicule import Vehicule

vehicules_bp = Blueprint('vehicules', __name__)

@vehicules_bp.route('/', methods=['GET'])
@jwt_required()
def get_vehicules():
    statut = request.args.get('statut')
    categorie = request.args.get('categorie')
    query = Vehicule.query
    if statut:
        query = query.filter_by(statut=statut)
    if categorie:
        query = query.filter_by(categorie=categorie)
    vehicules = query.order_by(Vehicule.immatriculation).all()
    return jsonify([v.to_dict() for v in vehicules]), 200

@vehicules_bp.route('/<int:id>', methods=['GET'])
@jwt_required()
def get_vehicule(id):
    v = Vehicule.query.get_or_404(id)
    return jsonify(v.to_dict()), 200

@vehicules_bp.route('/', methods=['POST'])
@jwt_required()
def create_vehicule():
    data = request.get_json()
    required = ['immatriculation', 'marque', 'modele', 'annee', 'type_carburant']
    if not all(data.get(f) for f in required):
        return jsonify({'message': 'Champs requis manquants'}), 400

    if Vehicule.query.filter_by(immatriculation=data['immatriculation']).first():
        return jsonify({'message': 'Immatriculation déjà existante'}), 409

    v = Vehicule(
        immatriculation=data['immatriculation'].upper(),
        marque=data['marque'],
        modele=data['modele'],
        annee=data['annee'],
        type_carburant=data['type_carburant'],
        km_initial=data.get('km_initial', 0),
        km_actuel=data.get('km_actuel', data.get('km_initial', 0)),
        statut=data.get('statut', 'actif'),
        categorie=data.get('categorie', 'leger'),
        couleur=data.get('couleur'),
        numero_serie=data.get('numero_serie')
    )
    db.session.add(v)
    db.session.commit()
    return jsonify(v.to_dict()), 201

@vehicules_bp.route('/<int:id>', methods=['PUT'])
@jwt_required()
def update_vehicule(id):
    v = Vehicule.query.get_or_404(id)
    data = request.get_json()
    for field in ['marque', 'modele', 'annee', 'type_carburant', 'km_actuel', 'statut', 'categorie', 'couleur', 'numero_serie']:
        if field in data:
            setattr(v, field, data[field])
    db.session.commit()
    return jsonify(v.to_dict()), 200

@vehicules_bp.route('/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_vehicule(id):
    v = Vehicule.query.get_or_404(id)
    db.session.delete(v)
    db.session.commit()
    return jsonify({'message': 'Véhicule supprimé'}), 200

@vehicules_bp.route('/<int:id>/stats', methods=['GET'])
@jwt_required()
def get_vehicule_stats(id):
    from app.models.plein import Plein
    from sqlalchemy import func
    v = Vehicule.query.get_or_404(id)
    stats = db.session.query(
        func.count(Plein.id).label('nb_pleins'),
        func.sum(Plein.litres).label('total_litres'),
        func.sum(Plein.cout_total).label('total_cout'),
        func.avg(Plein.consommation_100km).label('conso_moyenne')
    ).filter(Plein.vehicule_id == id).first()

    return jsonify({
        'vehicule': v.to_dict(),
        'nb_pleins': stats.nb_pleins or 0,
        'total_litres': round(stats.total_litres or 0, 2),
        'total_cout': round(stats.total_cout or 0, 2),
        'conso_moyenne': round(stats.conso_moyenne or 0, 2)
    }), 200
