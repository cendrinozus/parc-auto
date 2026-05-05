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

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(vehicules_bp, url_prefix='/api/vehicules')
    app.register_blueprint(conducteurs_bp, url_prefix='/api/conducteurs')
    app.register_blueprint(pleins_bp, url_prefix='/api/pleins')
    app.register_blueprint(rapports_bp, url_prefix='/api/rapports')
    app.register_blueprint(alertes_bp, url_prefix='/api/alertes')
    app.register_blueprint(utilisateurs_bp, url_prefix='/api/utilisateurs')

    @app.after_request
    def set_security_headers(response):
        response.headers['X-Frame-Options'] = 'DENY'
        response.headers['Content-Security-Policy'] = "frame-ancestors 'none'"
        return response

    return app
