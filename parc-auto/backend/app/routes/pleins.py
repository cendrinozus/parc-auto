from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.plein import Plein
from app.models.vehicule import Vehicule

pleins_bp = Blueprint('pleins', __name__)

def calculer_consommation(vehicule_id, km_actuel, litres):
    dernier = Plein.query.filter_by(vehicule_id=vehicule_id, plein_complet=True)\
        .order_by(Plein.km_compteur.desc()).first()
    if dernier and km_actuel > dernier.km_compteur:
        distance = km_actuel - dernier.km_compteur
        return round((litres / distance) * 100, 2)
    return None

@pleins_bp.route('/', methods=['GET'])
@jwt_required()
def get_pleins():
    vehicule_id = request.args.get('vehicule_id')
    limit = request.args.get('limit', 50, type=int)
    query = Plein.query
    if vehicule_id:
        query = query.filter_by(vehicule_id=vehicule_id)
    pleins = query.order_by(Plein.date_plein.desc()).limit(limit).all()

    result = []
    for p in pleins:
        d = p.to_dict()
        v = Vehicule.query.get(p.vehicule_id)
        if v:
            d['vehicule_immat'] = v.immatriculation
            d['vehicule_label'] = f"{v.marque} {v.modele}"
        result.append(d)
    return jsonify(result), 200

@pleins_bp.route('/<int:id>', methods=['GET'])
@jwt_required()
def get_plein(id):
    p = Plein.query.get_or_404(id)
    return jsonify(p.to_dict()), 200

@pleins_bp.route('/', methods=['POST'])
@jwt_required()
def create_plein():
    identity = get_jwt_identity()
    data = request.get_json()
    required = ['vehicule_id', 'km_compteur', 'litres', 'prix_litre']
    if not all(data.get(f) is not None for f in required):
        return jsonify({'message': 'Champs requis manquants'}), 400

    vehicule = Vehicule.query.get_or_404(data['vehicule_id'])
    litres = float(data['litres'])
    prix_litre = float(data['prix_litre'])
    km = float(data['km_compteur'])
    plein_complet = data.get('plein_complet', True)

    conso = calculer_consommation(vehicule.id, km, litres) if plein_complet else None

    from datetime import datetime
    p = Plein(
        vehicule_id=vehicule.id,
        utilisateur_id=int(identity),
        date_plein=datetime.fromisoformat(data['date_plein']) if data.get('date_plein') else datetime.utcnow(),
        km_compteur=km,
        litres=litres,
        prix_litre=prix_litre,
        cout_total=round(litres * prix_litre, 2),
        station=data.get('station'),
        type_carburant=data.get('type_carburant', vehicule.type_carburant),
        plein_complet=plein_complet,
        consommation_100km=conso,
        notes=data.get('notes')
    )

    vehicule.km_actuel = max(vehicule.km_actuel, km)

    db.session.add(p)

    # Vérification sur-consommation (seuil 12 L/100km par défaut)
    if conso and conso > 12:
        from app.models.plein import Alerte
        alerte = Alerte(
            vehicule_id=vehicule.id,
            type_alerte='sur_consommation',
            message=f"Sur-consommation détectée : {conso} L/100km",
            seuil_valeur=12,
            valeur_actuelle=conso
        )
        db.session.add(alerte)

    db.session.commit()
    return jsonify(p.to_dict()), 201

@pleins_bp.route('/<int:id>', methods=['PUT'])
@jwt_required()
def update_plein(id):
    p = Plein.query.get_or_404(id)
    data = request.get_json()
    for field in ['km_compteur', 'litres', 'prix_litre', 'station', 'notes', 'plein_complet']:
        if field in data:
            setattr(p, field, data[field])
    if 'litres' in data or 'prix_litre' in data:
        p.cout_total = round(p.litres * p.prix_litre, 2)
    db.session.commit()
    return jsonify(p.to_dict()), 200

@pleins_bp.route('/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_plein(id):
    p = Plein.query.get_or_404(id)
    db.session.delete(p)
    db.session.commit()
    return jsonify({'message': 'Plein supprimé'}), 200
