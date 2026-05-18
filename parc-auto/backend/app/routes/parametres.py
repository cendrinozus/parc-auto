from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt
from functools import wraps
from app import db
from app.models.parametre import Parametre

parametres_bp = Blueprint('parametres', __name__)

def admin_required(fn):
    @wraps(fn)
    @jwt_required()
    def wrapper(*args, **kwargs):
        if get_jwt().get('role') != 'admin':
            return jsonify({'message': 'Accès réservé aux administrateurs'}), 403
        return fn(*args, **kwargs)
    return wrapper

@parametres_bp.route('/', methods=['GET'])
@jwt_required()
def get_parametres():
    params = Parametre.query.order_by(Parametre.cle).all()
    return jsonify([p.to_dict() for p in params]), 200

@parametres_bp.route('/<cle>', methods=['GET'])
@jwt_required()
def get_parametre(cle):
    p = Parametre.query.filter_by(cle=cle).first_or_404()
    return jsonify(p.to_dict()), 200

@parametres_bp.route('/', methods=['PUT'])
@admin_required
def update_parametres():
    """Met à jour plusieurs paramètres en une seule requête : [{ cle, valeur }, ...]"""
    data = request.get_json()
    if not isinstance(data, list):
        return jsonify({'message': 'Format attendu : liste de {cle, valeur}'}), 400

    for item in data:
        cle = item.get('cle')
        valeur = item.get('valeur')
        if not cle or valeur is None:
            continue
        p = Parametre.query.filter_by(cle=cle).first()
        if p:
            p.valeur = str(valeur)
        else:
            db.session.add(Parametre(cle=cle, valeur=str(valeur)))

    db.session.commit()
    params = Parametre.query.order_by(Parametre.cle).all()
    return jsonify([p.to_dict() for p in params]), 200
