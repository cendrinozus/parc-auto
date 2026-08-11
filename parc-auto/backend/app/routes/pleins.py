from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from app import db
from app.models.plein import Plein
from app.models.vehicule import Vehicule
from app.models.conducteur import Conducteur

pleins_bp = Blueprint('pleins', __name__)

def gestionnaire_ou_admin_required():
    role = get_jwt().get('role')
    if role not in ('admin', 'gestionnaire'):
        return jsonify({'message': 'Accès refusé'}), 403
    return None

def calculer_consommation(vehicule_id, km_actuel, litres, exclude_id=None):
    query = Plein.query.filter_by(vehicule_id=vehicule_id, plein_complet=True)
    if exclude_id:
        query = query.filter(Plein.id != exclude_id)
    dernier = query.order_by(Plein.km_compteur.desc()).first()
    if dernier:
        km_dernier = float(dernier.km_compteur)
        if km_actuel > km_dernier:
            distance = km_actuel - km_dernier
            return round((float(litres) / distance) * 100, 2)
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
        if p.conducteur_id:
            c = Conducteur.query.get(p.conducteur_id)
            if c:
                d['conducteur_nom'] = f"{c.prenom} {c.nom}"
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
    err = gestionnaire_ou_admin_required()
    if err: return err
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

    if vehicule.km_actuel and km < float(vehicule.km_actuel):
        return jsonify({'message': f'Le km compteur ({km:,.0f}) est inférieur au dernier relevé ({float(vehicule.km_actuel):,.0f} km)'}), 400

    conso = calculer_consommation(vehicule.id, km, litres) if plein_complet else None

    from datetime import datetime
    p = Plein(
        vehicule_id=vehicule.id,
        conducteur_id=data.get('conducteur_id'),
        utilisateur_id=int(identity),
        date_plein=datetime.fromisoformat(data['date_plein']) if data.get('date_plein') else datetime.utcnow(),
        km_compteur=km,
        litres=litres,
        prix_litre=prix_litre,
        cout_total=round(litres * prix_litre, 2),
        station=data.get('station'),
        type_carburant=vehicule.type_carburant,
        motif=data.get('motif'),
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
    err = gestionnaire_ou_admin_required()
    if err: return err
    from datetime import datetime
    p = Plein.query.get_or_404(id)
    data = request.get_json()

    # Validation km
    if 'km_compteur' in data:
        new_km = float(data['km_compteur'])
        precedent = Plein.query.filter(
            Plein.vehicule_id == p.vehicule_id,
            Plein.id != p.id,
            Plein.km_compteur < p.km_compteur
        ).order_by(Plein.km_compteur.desc()).first()
        if precedent and new_km < float(precedent.km_compteur):
            return jsonify({'message': f'Le km compteur ({new_km:,.0f}) est inférieur au relevé précédent ({float(precedent.km_compteur):,.0f} km)'}), 400
        p.km_compteur = new_km

    # Champs simples
    for field in ['litres', 'prix_litre', 'station', 'notes', 'plein_complet']:
        if field in data:
            setattr(p, field, data[field])

    # Champs avec coercition explicite
    if 'conducteur_id' in data:
        p.conducteur_id = int(data['conducteur_id']) if data['conducteur_id'] else None
    if 'motif' in data:
        p.motif = data['motif'] or None
    if 'date_plein' in data and data['date_plein']:
        p.date_plein = datetime.fromisoformat(data['date_plein'])

    # Recalcul du coût total
    p.cout_total = round(p.litres * p.prix_litre, 2)

    # Recalcul de la consommation (en excluant le plein courant du calcul du précédent)
    if p.plein_complet:
        p.consommation_100km = calculer_consommation(p.vehicule_id, p.km_compteur, p.litres, exclude_id=p.id)
    else:
        p.consommation_100km = None

    # Mise à jour km_actuel du véhicule si besoin
    vehicule = Vehicule.query.get(p.vehicule_id)
    if vehicule:
        vehicule.km_actuel = max(vehicule.km_actuel, p.km_compteur)

    db.session.commit()
    return jsonify(p.to_dict()), 200

@pleins_bp.route('/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_plein(id):
    err = gestionnaire_ou_admin_required()
    if err: return err
    p = Plein.query.get_or_404(id)
    vehicule_id = p.vehicule_id
    db.session.delete(p)
    db.session.flush()

    # Recalculer km_actuel à partir des pleins restants
    vehicule = Vehicule.query.get(vehicule_id)
    if vehicule:
        dernier = Plein.query.filter_by(vehicule_id=vehicule_id)\
            .order_by(Plein.km_compteur.desc()).first()
        vehicule.km_actuel = dernier.km_compteur if dernier else vehicule.km_initial

    db.session.commit()
    return jsonify({'message': 'Plein supprimé'}), 200
