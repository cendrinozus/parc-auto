import atexit
import os
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from config import config

db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()

def create_app(config_name='default'):
    app = Flask(__name__)
    app.config.from_object(config[config_name])

    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    CORS(app, origins=app.config['CORS_ORIGINS'])

    from app.routes.auth import auth_bp
    from app.routes.vehicules import vehicules_bp
    from app.routes.conducteurs import conducteurs_bp
    from app.routes.pleins import pleins_bp
    from app.routes.rapports import rapports_bp
    from app.routes.alertes import alertes_bp
    from app.routes.utilisateurs import utilisateurs_bp
    from app.routes.parametres import parametres_bp
    from app.routes.releves import releves_bp
    from app.routes.echeances import echeances_bp
    from app.routes.entretiens import entretiens_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(vehicules_bp, url_prefix='/api/vehicules')
    app.register_blueprint(conducteurs_bp, url_prefix='/api/conducteurs')
    app.register_blueprint(pleins_bp, url_prefix='/api/pleins')
    app.register_blueprint(rapports_bp, url_prefix='/api/rapports')
    app.register_blueprint(alertes_bp, url_prefix='/api/alertes')
    app.register_blueprint(utilisateurs_bp, url_prefix='/api/utilisateurs')
    app.register_blueprint(parametres_bp, url_prefix='/api/parametres')
    app.register_blueprint(releves_bp, url_prefix='/api/releves')
    app.register_blueprint(echeances_bp, url_prefix='/api/echeances')
    app.register_blueprint(entretiens_bp, url_prefix='/api/entretiens')

    @app.after_request
    def set_security_headers(response):
        response.headers['X-Frame-Options'] = 'DENY'
        response.headers['Content-Security-Policy'] = "frame-ancestors 'none'"
        return response

    # Scheduler de vérification des échéances (évite le double-start en mode debug)
    if not app.testing and os.environ.get('WERKZEUG_RUN_MAIN') != 'false':
        try:
            from apscheduler.schedulers.background import BackgroundScheduler
            from app.services.check_echeances import verifier_et_alerter

            scheduler = BackgroundScheduler(daemon=True)
            scheduler.add_job(
                func=lambda: verifier_et_alerter(app),
                trigger='cron',
                hour=8,
                minute=0,
                id='check_echeances',
                replace_existing=True
            )
            scheduler.start()
            atexit.register(lambda: scheduler.shutdown(wait=False))
        except Exception as e:
            app.logger.warning(f"Scheduler non démarré : {e}")

    return app
