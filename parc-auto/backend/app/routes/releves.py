from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from datetime import date
from app import db
from app.models.utilisateur import Utilisateur
from app.models.plein import Affectation
from app.models.vehicule import Vehicule
from app.models.conducteur import Conducteur
from app.models.releve import ReleveJournalier, Trajet

releves_bp = Blueprint('releves', __name__)


def get_current_user():
    return Utilisateur.query.get(int(get_jwt_identity()))


@releves_bp.route('/aujourd-hui', methods=['GET'])
@jwt_required()
def get_aujourd_hui():
    user = get_current_user()
    if not user or not user.conducteur_id:
        return jsonify({'vehicules': [], 'releves': []}), 200

    today = date.today()

    affectations = Affectation.query.filter(
        Affectation.conducteur_id == user.conducteur_id,
        db.or_(
            Affectation.date_fin == None,
            Affectation.date_fin >= today
        )
    ).all()

    vehicule_ids = [a.vehicule_id for a in affectations]
    vehicules = Vehicule.query.filter(Vehicule.id.in_(vehicule_ids)).all() if vehicule_ids else []

    releves = ReleveJournalier.query.filter(
        ReleveJournalier.conducteur_id == user.conducteur_id,
        ReleveJournalier.date == today
    ).all()

    return jsonify({
        'vehicules': [v.to_dict() for v in vehicules],
        'releves': [r.to_dict() for r in releves]
    }), 200


@releves_bp.route('/', methods=['POST'])
@jwt_required()
def create_releve():
    user = get_current_user()
    if not user or not user.conducteur_id:
        return jsonify({'message': 'Aucun profil conducteur lié à ce compte'}), 400

    data = request.get_json()
    vehicule_id = data.get('vehicule_id')
    if not vehicule_id:
        return jsonify({'message': 'vehicule_id requis'}), 400

    today = date.today()
    existing = ReleveJournalier.query.filter_by(
        conducteur_id=user.conducteur_id,
        vehicule_id=vehicule_id,
        date=today
    ).first()
    if existing:
        return jsonify({'message': 'Un relevé existe déjà pour ce véhicule aujourd\'hui'}), 409

    releve = ReleveJournalier(
        conducteur_id=user.conducteur_id,
        vehicule_id=vehicule_id,
        date=today,
        km_debut=data.get('km_debut'),
        niveau_carburant_debut=data.get('niveau_carburant_debut'),
        statut='en_cours'
    )
    db.session.add(releve)
    db.session.commit()
    return jsonify(releve.to_dict()), 201


@releves_bp.route('/<int:id>', methods=['PUT'])
@jwt_required()
def update_releve(id):
    user = get_current_user()
    releve = ReleveJournalier.query.get_or_404(id)
    role = get_jwt().get('role')

    if role not in ('admin', 'gestionnaire') and releve.conducteur_id != user.conducteur_id:
        return jsonify({'message': 'Accès non autorisé'}), 403

    data = request.get_json()
    for field in ['km_fin', 'niveau_carburant_fin', 'observations', 'statut']:
        if field in data:
            setattr(releve, field, data[field])

    db.session.commit()
    return jsonify(releve.to_dict()), 200


@releves_bp.route('/<int:id>/trajets', methods=['POST'])
@jwt_required()
def add_trajet(id):
    user = get_current_user()
    releve = ReleveJournalier.query.get_or_404(id)
    role = get_jwt().get('role')

    if role not in ('admin', 'gestionnaire') and releve.conducteur_id != user.conducteur_id:
        return jsonify({'message': 'Accès non autorisé'}), 403

    data = request.get_json()
    if not data.get('heure_depart') or not data.get('destination'):
        return jsonify({'message': 'heure_depart et destination sont requis'}), 400

    trajet = Trajet(
        releve_id=id,
        heure_depart=data['heure_depart'],
        heure_arrivee=data.get('heure_arrivee'),
        origine=data.get('origine'),
        destination=data['destination'],
        motif=data.get('motif'),
        km_depart=data.get('km_depart'),
        km_arrivee=data.get('km_arrivee'),
        observations=data.get('observations')
    )
    db.session.add(trajet)
    db.session.commit()
    return jsonify(trajet.to_dict()), 201


@releves_bp.route('/<int:id>/trajets/<int:tid>', methods=['PUT'])
@jwt_required()
def update_trajet(id, tid):
    user = get_current_user()
    releve = ReleveJournalier.query.get_or_404(id)
    role = get_jwt().get('role')

    if role not in ('admin', 'gestionnaire') and releve.conducteur_id != user.conducteur_id:
        return jsonify({'message': 'Accès non autorisé'}), 403

    trajet = Trajet.query.filter_by(id=tid, releve_id=id).first_or_404()
    data = request.get_json()
    for field in ['heure_depart', 'heure_arrivee', 'origine', 'destination', 'motif', 'km_depart', 'km_arrivee', 'observations']:
        if field in data:
            setattr(trajet, field, data[field])

    db.session.commit()
    return jsonify(trajet.to_dict()), 200


@releves_bp.route('/<int:id>/trajets/<int:tid>', methods=['DELETE'])
@jwt_required()
def delete_trajet(id, tid):
    user = get_current_user()
    releve = ReleveJournalier.query.get_or_404(id)
    role = get_jwt().get('role')

    if role not in ('admin', 'gestionnaire') and releve.conducteur_id != user.conducteur_id:
        return jsonify({'message': 'Accès non autorisé'}), 403

    trajet = Trajet.query.filter_by(id=tid, releve_id=id).first_or_404()
    db.session.delete(trajet)
    db.session.commit()
    return jsonify({'message': 'Trajet supprimé'}), 200


@releves_bp.route('/historique', methods=['GET'])
@jwt_required()
def get_historique():
    user = get_current_user()
    if not user or not user.conducteur_id:
        return jsonify([]), 200

    releves = ReleveJournalier.query.filter(
        ReleveJournalier.conducteur_id == user.conducteur_id
    ).order_by(ReleveJournalier.date.desc()).limit(90).all()

    result = []
    for r in releves:
        d = r.to_dict()
        vehicule = Vehicule.query.get(r.vehicule_id)
        if vehicule:
            d['vehicule_info'] = f"{vehicule.immatriculation} — {vehicule.marque} {vehicule.modele}"
        result.append(d)

    return jsonify(result), 200


@releves_bp.route('/', methods=['GET'])
@jwt_required()
def get_releves():
    from datetime import datetime as dt, timedelta
    role = get_jwt().get('role')
    if role not in ('admin', 'gestionnaire'):
        return jsonify({'message': 'Accès réservé aux administrateurs et gestionnaires'}), 403

    query = ReleveJournalier.query

    conducteur_id = request.args.get('conducteur_id')
    if conducteur_id:
        query = query.filter(ReleveJournalier.conducteur_id == int(conducteur_id))

    vehicule_id = request.args.get('vehicule_id')
    if vehicule_id:
        query = query.filter(ReleveJournalier.vehicule_id == int(vehicule_id))

    date_debut = request.args.get('date_debut')
    date_fin = request.args.get('date_fin')

    if date_debut:
        try:
            query = query.filter(ReleveJournalier.date >= dt.strptime(date_debut, '%Y-%m-%d').date())
        except ValueError:
            pass
    if date_fin:
        try:
            query = query.filter(ReleveJournalier.date <= dt.strptime(date_fin, '%Y-%m-%d').date())
        except ValueError:
            pass

    # Par défaut : 90 derniers jours si aucune date fournie
    if not date_debut and not date_fin:
        query = query.filter(ReleveJournalier.date >= (date.today() - timedelta(days=90)))

    releves = query.order_by(ReleveJournalier.date.desc()).all()

    result = []
    for r in releves:
        d = r.to_dict()
        conducteur = Conducteur.query.get(r.conducteur_id)
        if conducteur:
            d['conducteur_nom'] = f"{conducteur.prenom} {conducteur.nom}"
        vehicule = Vehicule.query.get(r.vehicule_id)
        if vehicule:
            d['vehicule_info'] = f"{vehicule.immatriculation} — {vehicule.marque} {vehicule.modele}"
        result.append(d)

    return jsonify(result), 200
