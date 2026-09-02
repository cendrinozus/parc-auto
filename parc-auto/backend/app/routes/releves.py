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


def _conducteur_actuel_vehicule(vehicule_id):
    """Retourne le conducteur_id de l'affectation active pour un véhicule, ou None."""
    from sqlalchemy import text
    row = db.session.execute(
        text("""
            SELECT conducteur_id FROM affectations
            WHERE vehicule_id = :vid AND date_fin IS NULL
            ORDER BY date_debut DESC LIMIT 1
        """),
        {'vid': vehicule_id}
    ).fetchone()
    if not row:
        row = db.session.execute(
            text("""
                SELECT conducteur_id FROM affectations
                WHERE vehicule_id = :vid AND date_fin >= CURDATE()
                ORDER BY date_fin DESC LIMIT 1
            """),
            {'vid': vehicule_id}
        ).fetchone()
    return row[0] if row else None


def _parse_date(date_str):
    try:
        return date.fromisoformat(date_str) if date_str else date.today()
    except (ValueError, TypeError):
        return date.today()


def _km_parcourus(releve):
    """Calcule km parcourus = relevé actuel - relevé précédent du même véhicule."""
    if releve.km_debut is None:
        return None
    prev = ReleveJournalier.query.filter(
        ReleveJournalier.vehicule_id == releve.vehicule_id,
        ReleveJournalier.date < releve.date,
        ReleveJournalier.km_debut.isnot(None)
    ).order_by(ReleveJournalier.date.desc()).first()
    if prev and prev.km_debut is not None:
        return round(float(releve.km_debut) - float(prev.km_debut), 1)
    return None


# ─── GET : véhicules + relevé pour une date (admin/gestionnaire, par véhicule) ───

@releves_bp.route('/pour-vehicule', methods=['GET'])
@jwt_required()
def get_pour_vehicule():
    role = get_jwt().get('role')
    if role not in ('admin', 'gestionnaire'):
        return jsonify({'message': 'Accès réservé aux administrateurs et gestionnaires'}), 403

    vehicule_id = request.args.get('vehicule_id', type=int)
    if not vehicule_id:
        return jsonify({'message': 'vehicule_id requis'}), 400

    target_date = _parse_date(request.args.get('date'))
    vehicule = Vehicule.query.get_or_404(vehicule_id)

    conducteur_id = _conducteur_actuel_vehicule(vehicule_id)
    conducteur = Conducteur.query.get(conducteur_id) if conducteur_id else None

    releve = ReleveJournalier.query.filter_by(
        vehicule_id=vehicule_id, date=target_date
    ).first()

    return jsonify({
        'vehicule': vehicule.to_dict(),
        'releve': releve.to_dict() if releve else None,
        'conducteur_id': conducteur_id,
        'conducteur_nom': f"{conducteur.prenom} {conducteur.nom}" if conducteur else None
    }), 200


# ─── GET : véhicules + relevés du conducteur connecté pour une date ───

@releves_bp.route('/pour-date', methods=['GET'])
@jwt_required()
def get_pour_date():
    user = get_current_user()
    target_date = _parse_date(request.args.get('date'))

    if not user or not user.conducteur_id:
        return jsonify({'vehicules': [], 'releves': []}), 200

    conducteur_id = user.conducteur_id

    affectations = Affectation.query.filter(
        Affectation.conducteur_id == conducteur_id,
        Affectation.date_debut <= target_date,
        db.or_(Affectation.date_fin.is_(None), Affectation.date_fin >= target_date)
    ).all()

    vehicule_ids = [a.vehicule_id for a in affectations]
    vehicules = Vehicule.query.filter(Vehicule.id.in_(vehicule_ids)).all() if vehicule_ids else []

    releves = ReleveJournalier.query.filter(
        ReleveJournalier.conducteur_id == conducteur_id,
        ReleveJournalier.date == target_date
    ).all()

    return jsonify({
        'vehicules': [v.to_dict() for v in vehicules],
        'releves': [r.to_dict() for r in releves]
    }), 200


# ─── POST : créer un relevé ───

@releves_bp.route('/', methods=['POST'])
@jwt_required()
def create_releve():
    user = get_current_user()
    role = get_jwt().get('role')
    data = request.get_json()

    # Résolution du conducteur
    conducteur_id_body = data.get('conducteur_id')
    vehicule_id = data.get('vehicule_id')

    if role in ('admin', 'gestionnaire'):
        if conducteur_id_body:
            conducteur_id = conducteur_id_body
        elif vehicule_id:
            conducteur_id = _conducteur_actuel_vehicule(vehicule_id)
            if not conducteur_id:
                return jsonify({'message': 'Aucun conducteur affecté à ce véhicule'}), 400
        else:
            if not user or not user.conducteur_id:
                return jsonify({'message': 'Aucun profil conducteur lié à ce compte'}), 400
            conducteur_id = user.conducteur_id
    else:
        if not user or not user.conducteur_id:
            return jsonify({'message': 'Aucun profil conducteur lié à ce compte'}), 400
        conducteur_id = user.conducteur_id

    if not vehicule_id:
        return jsonify({'message': 'vehicule_id requis'}), 400

    target_date = _parse_date(data.get('date'))

    # Un seul relevé par véhicule par date
    existing = ReleveJournalier.query.filter_by(
        vehicule_id=vehicule_id,
        date=target_date
    ).first()
    if existing:
        return jsonify({
            'message': 'Un relevé existe déjà pour ce véhicule à cette date',
            'releve_id': existing.id
        }), 409

    releve = ReleveJournalier(
        conducteur_id=conducteur_id,
        vehicule_id=vehicule_id,
        date=target_date,
        km_debut=data.get('km_debut'),
        observations=data.get('observations'),
        statut='clos'
    )
    db.session.add(releve)
    db.session.commit()
    return jsonify(releve.to_dict()), 201


# ─── PUT : modifier un relevé ───

@releves_bp.route('/<int:id>', methods=['PUT'])
@jwt_required()
def update_releve(id):
    user = get_current_user()
    releve = ReleveJournalier.query.get_or_404(id)
    role = get_jwt().get('role')

    if role not in ('admin', 'gestionnaire') and releve.conducteur_id != user.conducteur_id:
        return jsonify({'message': 'Accès non autorisé'}), 403

    data = request.get_json()
    for field in ['km_debut', 'observations']:
        if field in data:
            setattr(releve, field, data[field])
    releve.statut = 'clos'

    db.session.commit()
    return jsonify(releve.to_dict()), 200


# ─── DELETE : supprimer un relevé (admin/gestionnaire) ───

@releves_bp.route('/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_releve(id):
    role = get_jwt().get('role')
    if role not in ('admin', 'gestionnaire'):
        return jsonify({'message': 'Accès réservé aux administrateurs et gestionnaires'}), 403
    releve = ReleveJournalier.query.get_or_404(id)
    db.session.delete(releve)
    db.session.commit()
    return jsonify({'message': 'Relevé supprimé'}), 200


# ─── GET : historique par conducteur ou véhicule ───

@releves_bp.route('/historique', methods=['GET'])
@jwt_required()
def get_historique():
    user = get_current_user()
    role = get_jwt().get('role')

    vehicule_id_param = request.args.get('vehicule_id', type=int)
    if vehicule_id_param and role in ('admin', 'gestionnaire'):
        releves = ReleveJournalier.query.filter(
            ReleveJournalier.vehicule_id == vehicule_id_param
        ).order_by(ReleveJournalier.date.desc()).limit(90).all()
        result = []
        for r in releves:
            d = r.to_dict()
            vehicule = Vehicule.query.get(r.vehicule_id)
            if vehicule:
                d['vehicule_info'] = f"{vehicule.immatriculation} — {vehicule.marque} {vehicule.modele}"
            conducteur = Conducteur.query.get(r.conducteur_id)
            if conducteur:
                d['conducteur_nom'] = f"{conducteur.prenom} {conducteur.nom}"
            d['km_parcourus'] = _km_parcourus(r)
            result.append(d)
        return jsonify(result), 200

    conducteur_id_param = request.args.get('conducteur_id', type=int)
    if conducteur_id_param and role in ('admin', 'gestionnaire'):
        conducteur_id = conducteur_id_param
    else:
        if not user or not user.conducteur_id:
            return jsonify([]), 200
        conducteur_id = user.conducteur_id

    releves = ReleveJournalier.query.filter(
        ReleveJournalier.conducteur_id == conducteur_id
    ).order_by(ReleveJournalier.date.desc()).limit(90).all()

    result = []
    for r in releves:
        d = r.to_dict()
        vehicule = Vehicule.query.get(r.vehicule_id)
        if vehicule:
            d['vehicule_info'] = f"{vehicule.immatriculation} — {vehicule.marque} {vehicule.modele}"
        d['km_parcourus'] = _km_parcourus(r)
        result.append(d)

    return jsonify(result), 200


# ─── GET : liste complète (admin) ───

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
        d['km_parcourus'] = _km_parcourus(r)
        result.append(d)

    return jsonify(result), 200


# ─── Trajets (conservés pour compatibilité) ───

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
