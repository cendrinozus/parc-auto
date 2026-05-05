from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from functools import wraps
from app import db
from app.models.utilisateur import Utilisateur

utilisateurs_bp = Blueprint('utilisateurs', __name__)

def admin_required(fn):
    @wraps(fn)
    @jwt_required()
    def wrapper(*args, **kwargs):
        if get_jwt().get('role') != 'admin':
            return jsonify({'message': 'Accès réservé aux administrateurs'}), 403
        return fn(*args, **kwargs)
    return wrapper

@utilisateurs_bp.route('/', methods=['GET'])
@admin_required
def get_utilisateurs():
    utilisateurs = Utilisateur.query.order_by(Utilisateur.nom).all()
    return jsonify([u.to_dict() for u in utilisateurs]), 200

@utilisateurs_bp.route('/<int:id>', methods=['GET'])
@admin_required
def get_utilisateur(id):
    u = Utilisateur.query.get_or_404(id)
    return jsonify(u.to_dict()), 200

@utilisateurs_bp.route('/', methods=['POST'])
@admin_required
def create_utilisateur():
    data = request.get_json()
    required = ['nom', 'prenom', 'email', 'password']
    if not all(data.get(f) for f in required):
        return jsonify({'message': 'Champs requis manquants'}), 400

    if Utilisateur.query.filter_by(email=data['email']).first():
        return jsonify({'message': 'Email déjà utilisé'}), 409

    u = Utilisateur(
        nom=data['nom'],
        prenom=data['prenom'],
        email=data['email'],
        role=data.get('role', 'conducteur'),
        actif=data.get('actif', True)
    )
    u.set_password(data['password'])
    db.session.add(u)
    db.session.commit()
    return jsonify(u.to_dict()), 201

@utilisateurs_bp.route('/<int:id>', methods=['PUT'])
@admin_required
def update_utilisateur(id):
    u = Utilisateur.query.get_or_404(id)
    data = request.get_json()

    current_user_id = int(get_jwt_identity())
    if u.id == current_user_id and data.get('role') and data['role'] != 'admin':
        return jsonify({'message': 'Impossible de retirer son propre rôle admin'}), 400

    for field in ['nom', 'prenom', 'email', 'role', 'actif']:
        if field in data:
            setattr(u, field, data[field])

    if data.get('password'):
        u.set_password(data['password'])

    db.session.commit()
    return jsonify(u.to_dict()), 200

@utilisateurs_bp.route('/<int:id>', methods=['DELETE'])
@admin_required
def delete_utilisateur(id):
    u = Utilisateur.query.get_or_404(id)
    current_user_id = int(get_jwt_identity())
    if u.id == current_user_id:
        return jsonify({'message': 'Impossible de supprimer son propre compte'}), 400
    db.session.delete(u)
    db.session.commit()
    return jsonify({'message': 'Utilisateur supprimé'}), 200