# ParcAuto — Suivi carburant du parc automobile

Application web complète de suivi de consommation carburant.
Stack : **React 18** + **Flask 3** + **MySQL 8** + **Apache2**

---

## Lancement rapide (Docker)

```bash
git clone <repo> parc-auto && cd parc-auto
cp backend/.env.example backend/.env   # adapter les secrets
docker-compose up --build
```

- Frontend : http://localhost
- API Flask : http://localhost:5000/api
- Compte démo : `admin@parc.com` / `admin123`

Initialiser les données de test :
```bash
docker exec parc_backend flask db upgrade
docker exec parc_backend flask seed
```

---

## Lancement en développement (sans Docker)

### Backend Flask
```bash
cd backend
python -m venv venv && source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env          # configurer DB_URI
flask db upgrade
flask seed
python run.py
# API disponible sur http://localhost:5000
```

### Frontend React
```bash
cd frontend
npm install
npm run dev
# App disponible sur http://localhost:5173
```

### Apache2 (production)
```bash
sudo apt install apache2 libapache2-mod-wsgi-py3
sudo a2enmod rewrite proxy proxy_http
sudo cp apache/parc-auto.conf /etc/apache2/sites-available/
sudo a2ensite parc-auto
cd frontend && npm run build
sudo cp -r dist/* /var/www/parc-auto/frontend/dist/
sudo cp -r backend/* /var/www/parc-auto/backend/
sudo systemctl restart apache2
```

---

## Structure du projet

```
parc-auto/
├── backend/
│   ├── app/
│   │   ├── models/          # SQLAlchemy (Vehicule, Conducteur, Plein, Alerte…)
│   │   └── routes/          # Blueprints Flask (auth, vehicules, pleins…)
│   ├── app.wsgi             # Point d'entrée Apache mod_wsgi
│   ├── config.py
│   ├── run.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── pages/           # Dashboard, Véhicules, Conducteurs, Pleins, Rapports, Alertes
│   │   ├── components/      # Layout (sidebar), ProtectedRoute
│   │   ├── services/        # Appels Axios vers l'API
│   │   └── context/         # AuthContext (JWT)
│   └── package.json
├── apache/
│   └── parc-auto.conf       # VirtualHost Apache2
├── mysql/
│   └── init.sql
└── docker-compose.yml
```

---

## API — Principaux endpoints

| Méthode | Route | Description |
|---------|-------|-------------|
| POST | /api/auth/login | Connexion |
| GET | /api/vehicules/ | Liste des véhicules |
| POST | /api/vehicules/ | Créer un véhicule |
| GET | /api/vehicules/:id/stats | Stats d'un véhicule |
| POST | /api/pleins/ | Enregistrer un plein |
| GET | /api/rapports/global | Statistiques globales |
| GET | /api/rapports/mensuel | Rapport mensuel |
| GET | /api/alertes/ | Liste des alertes |
| PATCH | /api/alertes/:id/lire | Marquer une alerte comme lue |

---

## Variables d'environnement

```env
# backend/.env
FLASK_ENV=development
SECRET_KEY=change-me
JWT_SECRET_KEY=change-me-jwt
DB_URI=mysql+pymysql://parc_user:parc_pass@localhost/parc_auto
CORS_ORIGINS=http://localhost:5173
```
