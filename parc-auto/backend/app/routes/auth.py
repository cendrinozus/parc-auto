from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, create_refresh_token, jwt_required, get_jwt_identity, get_jwt
from app import db
from app.models.utilisateur import Utilisateur

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({'message': 'Email et mot de passe requis'}), 400

    user = Utilisateur.query.filter_by(email=data['email'], actif=True).first()
    if not user or not user.check_password(data['password']):
        return jsonify({'message': 'Identifiants incorrects'}), 401

    additional_claims = {'role': user.role}
    access_token = create_access_token(identity=str(user.id), additional_claims=additional_claims)
    refresh_token = create_refresh_token(identity=str(user.id), additional_claims=additional_claims)

    return jsonify({
        'access_token': access_token,
        'refresh_token': refresh_token,
        'user': user.to_dict()
    }), 200

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    required = ['nom', 'prenom', 'email', 'password']
    if not all(data.get(f) for f in required):
        return jsonify({'message': 'Tous les champs sont requis'}), 400

    if Utilisateur.query.filter_by(email=data['email']).first():
        return jsonify({'message': 'Email déjà utilisé'}), 409

    user = Utilisateur(
        nom=data['nom'],
        prenom=data['prenom'],
        email=data['email'],
        role=data.get('role', 'conducteur')
    )
    user.set_password(data['password'])
    db.session.add(user)
    db.session.commit()

    return jsonify({'message': 'Compte créé avec succès', 'user': user.to_dict()}), 201

@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    identity = get_jwt_identity()
    claims = get_jwt()
    access_token = create_access_token(identity=identity, additional_claims={'role': claims.get('role')})
    return jsonify({'access_token': access_token}), 200

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def me():
    user_id = get_jwt_identity()
    user = Utilisateur.query.get(int(user_id))
    if not user:
        return jsonify({'message': 'Utilisateur introuvable'}), 404
    return jsonify(user.to_dict()), 200
