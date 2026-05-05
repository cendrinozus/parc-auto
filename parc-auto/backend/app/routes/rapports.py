from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app import db
from app.models.plein import Plein
from app.models.vehicule import Vehicule
from sqlalchemy import func, extract

rapports_bp = Blueprint('rapports', __name__)

@rapports_bp.route('/global', methods=['GET'])
@jwt_required()
def rapport_global():
    mois = request.args.get('mois', type=int)
    annee = request.args.get('annee', type=int)

    query = db.session.query(
        func.count(Plein.id).label('nb_pleins'),
        func.sum(Plein.litres).label('total_litres'),
        func.sum(Plein.cout_total).label('total_cout'),
        func.avg(Plein.consommation_100km).label('conso_moyenne')
    )
    if annee:
        query = query.filter(extract('year', Plein.date_plein) == annee)
    if mois:
        query = query.filter(extract('month', Plein.date_plein) == mois)

    stats = query.first()

    nb_vehicules = Vehicule.query.filter_by(statut='actif').count()

    return jsonify({
        'nb_vehicules_actifs': nb_vehicules,
        'nb_pleins': stats.nb_pleins or 0,
        'total_litres': round(stats.total_litres or 0, 2),
        'total_cout': round(stats.total_cout or 0, 2),
        'conso_moyenne': round(stats.conso_moyenne or 0, 2)
    }), 200

@rapports_bp.route('/par-vehicule', methods=['GET'])
@jwt_required()
def rapport_par_vehicule():
    annee = request.args.get('annee', type=int)
    query = db.session.query(
        Vehicule.id,
        Vehicule.immatriculation,
        Vehicule.marque,
        Vehicule.modele,
        func.count(Plein.id).label('nb_pleins'),
        func.sum(Plein.litres).label('total_litres'),
        func.sum(Plein.cout_total).label('total_cout'),
        func.avg(Plein.consommation_100km).label('conso_moyenne')
    ).join(Plein, Vehicule.id == Plein.vehicule_id)

    if annee:
        query = query.filter(extract('year', Plein.date_plein) == annee)

    rows = query.group_by(Vehicule.id).order_by(func.sum(Plein.cout_total).desc()).all()

    return jsonify([{
        'vehicule_id': r.id,
        'immatriculation': r.immatriculation,
        'label': f"{r.marque} {r.modele}",
        'nb_pleins': r.nb_pleins,
        'total_litres': round(r.total_litres or 0, 2),
        'total_cout': round(r.total_cout or 0, 2),
        'conso_moyenne': round(r.conso_moyenne or 0, 2)
    } for r in rows]), 200

@rapports_bp.route('/mensuel', methods=['GET'])
@jwt_required()
def rapport_mensuel():
    annee = request.args.get('annee', type=int)
    vehicule_id = request.args.get('vehicule_id', type=int)

    query = db.session.query(
        extract('month', Plein.date_plein).label('mois'),
        func.count(Plein.id).label('nb_pleins'),
        func.sum(Plein.litres).label('total_litres'),
        func.sum(Plein.cout_total).label('total_cout'),
        func.avg(Plein.consommation_100km).label('conso_moyenne')
    )
    if annee:
        query = query.filter(extract('year', Plein.date_plein) == annee)
    if vehicule_id:
        query = query.filter(Plein.vehicule_id == vehicule_id)

    rows = query.group_by(extract('month', Plein.date_plein)).order_by('mois').all()

    mois_labels = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc']
    return jsonify([{
        'mois': int(r.mois),
        'mois_label': mois_labels[int(r.mois) - 1],
        'nb_pleins': r.nb_pleins,
        'total_litres': round(r.total_litres or 0, 2),
        'total_cout': round(r.total_cout or 0, 2),
        'conso_moyenne': round(r.conso_moyenne or 0, 2)
    } for r in rows]), 200

@rapports_bp.route('/evolution-consommation/<int:vehicule_id>', methods=['GET'])
@jwt_required()
def evolution_consommation(vehicule_id):
    Vehicule.query.get_or_404(vehicule_id)
    pleins = Plein.query.filter(
        Plein.vehicule_id == vehicule_id,
        Plein.consommation_100km.isnot(None)
    ).order_by(Plein.date_plein).all()

    return jsonify([{
        'date': p.date_plein.isoformat(),
        'conso': p.consommation_100km,
        'km': p.km_compteur
    } for p in pleins]), 200
